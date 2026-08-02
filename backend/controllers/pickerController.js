const supabase = require('../lib/supabaseClient');

function normalizeItemStatus(dbStatus) {
  if (!dbStatus) return 'pending';
  const s = String(dbStatus).toLowerCase();
  if (s === 'picked' || s === 'found') return 'found';
  if (s === 'skipped' || s === 'not_found') return 'not_found';
  if (s === 'substituted' || s === 'replaced') return 'replaced';
  if (s === 'awaiting_customer') return 'awaiting_customer';
  return 'pending';
}

function normalizeOrderStatus(dbStatus) {
  if (!dbStatus) return 'pending_pick';
  const s = String(dbStatus).toLowerCase();
  if (s === 'pending' || s === 'pending_pick') return 'pending_pick';
  if (s === 'picking' || s === 'picking_in_progress') return 'picking_in_progress';
  if (s === 'finalized' || s === 'completed' || s === 'delivered') return 'completed';
  return s;
}

/**
 * GET /api/picker/orders/pending
 * Fetches all orders available for picking from Supabase
 */
exports.getPendingOrders = async (req, res) => {
  try {
    const { data: dbOrders, error } = await supabase
      .from('order_table')
      .select('order_id, order_status, order_date, total_amount, store_id, picker_id, stores(name)')
      .order('order_date', { ascending: false });

    if (error) {
      console.error('[DATABASE_ERROR] Supabase getPendingOrders error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    const formatted = (dbOrders || []).map(o => ({
      order_id: o.order_id,
      display_name: `Grocery order #${String(o.order_id).substring(0, 8)}`,
      order_status: normalizeOrderStatus(o.order_status),
      order_date: o.order_date,
      store_name: o.stores?.name || 'QuickFix Grocery Store',
      picker_id: o.picker_id,
      total_amount: parseFloat(o.total_amount) || 0
    }));

    return res.status(200).json({ success: true, orders: formatted });
  } catch (err) {
    console.error('[CRITICAL_ERROR] getPendingOrders exception:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/picker/order/:order_id/claim
 * Claims an order by changing status to PICKING in Supabase
 */
exports.claimOrder = async (req, res) => {
  const { order_id } = req.params;
  const rawPickerId = req.body.picker_id || 'd9aeadd7-9baf-491e-add8-df94d46f8dcb';
  
  const pickerId = (typeof rawPickerId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawPickerId))
    ? rawPickerId
    : 'd9aeadd7-9baf-491e-add8-df94d46f8dcb';

  try {
    const { data, error } = await supabase
      .from('order_table')
      .update({
        order_status: 'PICKING',
        picker_id: pickerId
      })
      .eq('order_id', order_id)
      .select();

    if (error) {
      console.error('[DATABASE_ERROR] Claim order failed:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Order ${order_id} claimed successfully`,
      order: {
        order_id,
        order_status: 'picking_in_progress',
        picker_id: pickerId
      }
    });
  } catch (err) {
    console.error('[CRITICAL_ERROR] claimOrder exception:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/picker/order/:order_id
 * Fetches specific order and its items from Supabase
 */
exports.getOrderDetails = async (req, res) => {
  const { order_id } = req.params;

  try {
    const { data: orderData, error: orderErr } = await supabase
      .from('order_table')
      .select('*, stores(name)')
      .eq('order_id', order_id)
      .single();

    if (orderErr) {
      console.error('[DATABASE_ERROR] Order details fetch error:', orderErr);
      return res.status(404).json({ success: false, error: 'Order not found in database' });
    }

    const { data: itemData } = await supabase
      .from('item_table')
      .select('*')
      .eq('order_id', order_id);

    // Build a set of product UUIDs to look up names
    const productIds = [...new Set((itemData || []).map(i => i.item_id).filter(Boolean))];
    let productMap = {};
    if (productIds.length > 0) {
      const { data: prodData } = await supabase
        .from('products')
        .select('id, name, category')
        .in('id', productIds);
      (prodData || []).forEach(p => { productMap[p.id] = p; });
    }

    const items = (itemData || []).map(i => {
      const prod = productMap[i.item_id];
      const productName = (prod && prod.name) || i.product_name || i.item_id || `Grocery Item #${i.list}`;
      return {
        list_id: i.list || i.id,
        order_id: i.order_id,
        product_name: productName,
        item_id: i.item_id,
        category: prod?.category || null,
        qty_requested: i.qty_requested || 1,
        price: parseFloat(i.price || i.item_price) || 0,
        status: normalizeItemStatus(i.status),
        replacement_item_id: i.replacement_item_id || null,
        sub_rules: i.sub_rules || 'ask',
        substitution_preference: i.substitution_preference || null
      };
    });

    return res.status(200).json({
      success: true,
      order_id: orderData.order_id,
      order_status: normalizeOrderStatus(orderData.order_status),
      display_name: `Grocery order #${String(orderData.order_id).substring(0, 8)}`,
      store_name: orderData.stores?.name || 'QuickFix Grocery Store',
      picker_id: orderData.picker_id,
      items
    });
  } catch (err) {
    console.error('[CRITICAL_ERROR] getOrderDetails exception:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * PATCH /api/picker/item/:list_id
 * Updates item status ('found', 'not_found', 'replaced', 'awaiting_customer') in Supabase
 */
exports.updateItemStatus = async (req, res) => {
  const { list_id } = req.params;
  const { status, replacement_item_id } = req.body;

  const validStatuses = ['found', 'not_found', 'replaced', 'awaiting_customer'];
  if (!status || !validStatuses.includes(status.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid status: '${status}'. Must be one of: 'found', 'not_found', 'replaced', or 'awaiting_customer'.`
    });
  }

  const normalizedStatus = status.toLowerCase();

  const dbStatusMap = {
    found: 'PICKED',
    not_found: 'SKIPPED',
    replaced: 'SUBSTITUTED',
    awaiting_customer: 'awaiting_customer'
  };

  const isValidUUID = (id) =>
    typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const formattedReplacement = (normalizedStatus === 'replaced' && replacement_item_id)
    ? (isValidUUID(replacement_item_id) ? replacement_item_id : null)
    : null;

  try {
    const updateFields = {
      status: dbStatusMap[normalizedStatus] || normalizedStatus,
      replacement_item_id: formattedReplacement
    };

    const { data, error } = await supabase
      .from('item_table')
      .update(updateFields)
      .eq('list', list_id)
      .select();

    if (error) {
      console.error('[DATABASE_ERROR] Update item status error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // For not_found / awaiting_customer: find same-category substitute and insert substitution record
    let suggestedSubstitute = null;
    if (normalizedStatus === 'not_found' || normalizedStatus === 'awaiting_customer') {
      // Fetch the item to get its product_id and category
      const itemRow = (data && data[0]) || null;
      if (itemRow && itemRow.item_id) {
        const { data: origProduct } = await supabase
          .from('products')
          .select('id, name, category, price')
          .eq('id', itemRow.item_id)
          .single();

        if (origProduct && origProduct.category) {
          const { data: sameCat } = await supabase
            .from('products')
            .select('id, name, price, image')
            .eq('category', origProduct.category)
            .neq('id', origProduct.id)
            .limit(3);
          if (sameCat && sameCat.length > 0) {
            suggestedSubstitute = sameCat[0];
          }
        }
      }

      // Insert substitution record for 3-minute timer
      if (isValidUUID(list_id)) {
        const subInsert = {
          order_item_id: list_id,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        if (suggestedSubstitute) {
          subInsert.proposed_product_id = suggestedSubstitute.id;
        }
        await supabase.from('substitutions').insert([subInsert]);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Item status updated in Supabase',
      item: {
        list_id,
        status: normalizedStatus,
        replacement_item_id: normalizedStatus === 'replaced' ? replacement_item_id : null
      },
      suggested_substitute: suggestedSubstitute
    });
  } catch (err) {
    console.error('[CRITICAL_ERROR] updateItemStatus exception:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/picker/order/:order_id/complete
 * Completes the order if all items are resolved.
 */
exports.completeOrder = async (req, res) => {
  const { order_id } = req.params;

  try {
    const { data: itemData, error: itemErr } = await supabase
      .from('item_table')
      .select('*')
      .eq('order_id', order_id);

    if (itemErr) {
      console.error('[DATABASE_ERROR] Item fetch error during completion:', itemErr);
      return res.status(500).json({ success: false, error: itemErr.message });
    }

    const items = (itemData || []).map(i => ({
      list_id: i.list || i.id,
      status: normalizeItemStatus(i.status)
    }));

    const pendingItems = items.filter(i => i.status === 'pending' || i.status === 'awaiting_customer');

    if (pendingItems.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot complete order: ${pendingItems.length} item(s) are still pending resolution or awaiting customer response.`,
        pending_count: pendingItems.length
      });
    }

    const now = new Date().toISOString();

    const { error: orderUpdateErr } = await supabase
      .from('order_table')
      .update({
        order_status: 'FINALIZED',
        finalized_at: now
      })
      .eq('order_id', order_id);

    if (orderUpdateErr) {
      console.error('[DATABASE_ERROR] Order completion update error:', orderUpdateErr);
      return res.status(500).json({ success: false, error: orderUpdateErr.message });
    }

    return res.status(200).json({
      success: true,
      message: `Order ${order_id} finalized and completed successfully in database!`,
      order_id,
      completed_at: now
    });
  } catch (err) {
    console.error('[CRITICAL_ERROR] completeOrder exception:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getActiveRun = exports.getPendingOrders;
exports.handleNotFound = exports.updateItemStatus;