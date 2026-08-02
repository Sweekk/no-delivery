const supabase = require('../lib/supabaseClient');
const { assignPicker, assignDeliveryPartner } = require('../services/assignmentService');

const PRODUCT_MAPPING = {
  'Organic Bananas 6pcs': 'e0000001-0000-0000-0000-000000000001',
  'Amul Taaza Toned Milk 1L': 'e0000002-0000-0000-0000-000000000002',
  'Whole Wheat Bread 400g': 'e0000003-0000-0000-0000-000000000003',
  'Fortune Sunflower Oil 1L': 'e0000004-0000-0000-0000-000000000004',
  'Doritos Nacho Cheese 150g': 'e0000005-0000-0000-0000-000000000005',
  'Fresh Tomatoes 1kg': 'e0000006-0000-0000-0000-000000000006',
};

const DEFAULT_ITEM_UUID = 'e0000001-0000-0000-0000-000000000001';

const isValidUUID = (id) =>
  typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

function getValidItemUUID(itemIdentifier) {
  if (!itemIdentifier) return DEFAULT_ITEM_UUID;
  if (isValidUUID(itemIdentifier)) return itemIdentifier;
  if (PRODUCT_MAPPING[itemIdentifier]) return PRODUCT_MAPPING[itemIdentifier];
  return DEFAULT_ITEM_UUID;
}

// Recalculates order total_amount based on active available/substituted items
async function recalculateOrderTotal(orderId) {
  try {
    const { data: orderItems, error } = await supabase
      .from('item_table')
      .select('price, item_price, quantity, qty_requested, status')
      .eq('order_id', orderId);

    if (error || !orderItems) return;

    const newTotal = orderItems.reduce((sum, item) => {
      const st = String(item.status || '').toUpperCase();
      if (st === 'SKIPPED' || st === 'SKIPPED_TIMEOUT') return sum;
      const itemPrice = parseFloat(item.price || item.item_price) || 0;
      const qty = parseInt(item.quantity || item.qty_requested, 10) || 1;
      return sum + (itemPrice * qty);
    }, 0);

    await supabase
      .from('order_table')
      .update({ total_amount: Number(newTotal.toFixed(2)) })
      .eq('order_id', orderId);

  } catch (err) {
    console.warn('recalculateOrderTotal warning:', err.message);
  }
}

// Checks if all items in order are resolved to available, substituted, or skipped
async function checkAndFinalizeOrderCompletion(orderId) {
  try {
    const { data: orderItems, error } = await supabase
      .from('item_table')
      .select('status')
      .eq('order_id', orderId);

    if (error || !orderItems || orderItems.length === 0) return false;

    const unresolved = orderItems.filter(i => {
      const st = String(i.status || '').toLowerCase();
      return ['pending', 'unavailable', 'picker_choice_pending', 'awaiting_customer'].includes(st);
    });

    if (unresolved.length === 0) {
      console.log(`[ORDER_LIFECYCLE] All items resolved for order ${orderId}. Advancing to order_confirmed.`);
      
      // Update order status to order_confirmed
      await supabase
        .from('order_table')
        .update({
          order_status: 'order_confirmed',
          finalized_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      // Auto-assign least-busy delivery partner
      await assignDeliveryPartner(orderId);
      return true;
    }
    return false;
  } catch (err) {
    console.error('checkAndFinalizeOrderCompletion exception:', err);
    return false;
  }
}

/**
 * 1. POST /api/orders (and /api/customer/orders)
 * Creates order row, inserts cart items, auto-assigns picker via least-busy round-robin
 */
exports.createOrder = async (req, res) => {
  const { store_id, customer_id, total_amount, items, default_substitution_preference = 'ask_first' } = req.body;

  if (total_amount === undefined || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'total_amount and a non-empty items array are required.'
    });
  }

  const parsedTotal = parseFloat(total_amount);
  const defaultPref = ['auto_substitute', 'ask_first', 'skip'].includes(default_substitution_preference) 
    ? default_substitution_preference 
    : 'ask_first';

  try {
    let validStoreId = isValidUUID(store_id) ? store_id : null;
    if (!validStoreId) {
      const { data: dbStores } = await supabase.from('stores').select('id').limit(1);
      if (dbStores && dbStores.length > 0) {
        validStoreId = dbStores[0].id;
      }
    }

    let validCustomerId = isValidUUID(customer_id) ? customer_id : null;

    // Step A: Insert into order_table with status = 'placed' and default_substitution_preference
    const { data: orderData, error: orderError } = await supabase
      .from('order_table')
      .insert([{
        store_id: validStoreId,
        customer_id: validCustomerId,
        total_amount: parsedTotal,
        order_status: 'placed',
        order_date: new Date().toISOString(),
        default_substitution_preference: defaultPref
      }])
      .select('order_id')
      .single();

    if (orderError || !orderData) {
      console.error('[DATABASE_ERROR] Order Insert Failed:', orderError);
      return res.status(500).json({ error: 'Database Error', message: orderError?.message });
    }

    const orderId = orderData.order_id;

    // Step B: Insert cart items into item_table / items
    const formattedItems = items.map(item => {
      const rawIdentifier = item.item_id || item.product_name || item.name;
      const validUUID = getValidItemUUID(rawIdentifier);
      const itemPref = item.substitution_preference || item.sub_rules || defaultPref;
      const normalizedPref = ['auto_substitute', 'ask_first', 'skip'].includes(itemPref) ? itemPref : defaultPref;

      return {
        order_id: orderId,
        item_id: validUUID,
        qty_requested: parseInt(item.qty_requested || item.quantity || 1, 10),
        sub_rules: normalizedPref === 'auto_substitute' ? 'auto' : normalizedPref === 'skip' ? 'skip' : 'ask',
        substitution_preference: normalizedPref,
        status: 'pending'
      };
    });

    const { error: itemsError } = await supabase
      .from('item_table')
      .insert(formattedItems);

    if (itemsError) {
      console.error('[DATABASE_ERROR] Items Insert Error:', itemsError);
    }

    // Step C: Auto-assign least-busy picker
    const assignResult = await assignPicker(orderId);

    return res.status(201).json({
      success: true,
      message: 'Order placed and auto-assigned to picker successfully.',
      order_id: orderId,
      order_status: 'assigned_to_picker',
      picker_id: assignResult.picker_id
    });

  } catch (err) {
    console.error('[CRITICAL_ERROR] createOrder exception:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};

/**
 * 2. PATCH /api/orders/:id/items/:itemId/status
 * Picker marks item available/unavailable with server timestamp in substitutions table
 */
exports.updateItemStatus = async (req, res) => {
  const { id: orderId, itemId } = req.params;
  const { status } = req.body; // 'available' | 'unavailable'

  if (!status || !['available', 'unavailable', 'found', 'not_found'].includes(status.toLowerCase())) {
    return res.status(400).json({ error: 'Bad Request', message: 'status must be available or unavailable.' });
  }

  const normalizedStatus = status.toLowerCase();
  const nowTimestamp = new Date().toISOString();

  try {
    const isUnavailable = normalizedStatus === 'unavailable' || normalizedStatus === 'not_found';
    const dbItemStatus = isUnavailable ? 'awaiting_customer' : 'PICKED';

    const { data: updatedItem, error } = await supabase
      .from('item_table')
      .update({
        status: dbItemStatus
      })
      .eq('list', itemId)
      .select()
      .single();

    if (error) {
      // Fallback try by order_id and list
      await supabase.from('item_table').update({ status: dbItemStatus }).eq('order_id', orderId);
    }

    // When item is unavailable, record server timestamp entry in substitutions table
    let unavailable_marked_at = nowTimestamp;
    if (isUnavailable) {
      const { data: subData } = await supabase
        .from('substitutions')
        .insert([{
          order_item_id: isValidUUID(itemId) ? itemId : null,
          status: 'pending',
          created_at: nowTimestamp
        }])
        .select()
        .single();

      if (subData) {
        unavailable_marked_at = subData.created_at;
      }
    }

    // Advance order_status to picking_in_progress if currently assigned_to_picker or placed
    const { data: currentOrder } = await supabase
      .from('order_table')
      .select('order_status')
      .eq('order_id', orderId)
      .single();

    if (currentOrder && (currentOrder.order_status === 'assigned_to_picker' || currentOrder.order_status === 'placed')) {
      await supabase
        .from('order_table')
        .update({ order_status: 'picking_in_progress' })
        .eq('order_id', orderId);
    }

    // Check if order is complete
    await checkAndFinalizeOrderCompletion(orderId);

    return res.status(200).json({
      success: true,
      message: `Item status updated to ${normalizedStatus}`,
      item: {
        id: itemId,
        status: isUnavailable ? 'unavailable' : 'available',
        unavailable_marked_at: isUnavailable ? unavailable_marked_at : null
      }
    });

  } catch (err) {
    console.error('updateItemStatus exception:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};

/**
 * 3. PATCH /api/orders/:id/items/:itemId/decision
 * Customer decision: skip | self_select | picker_choice
 */
exports.handleCustomerDecision = async (req, res) => {
  const { id: orderId, itemId } = req.params;
  const { customer_decision, substitute_product_id } = req.body;

  if (!customer_decision || !['skip', 'self_select', 'picker_choice'].includes(customer_decision)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'customer_decision must be skip, self_select, or picker_choice.'
    });
  }

  try {
    let newStatus = 'SKIPPED';
    let subStatus = 'rejected';

    if (customer_decision === 'skip') {
      newStatus = 'SKIPPED';
      subStatus = 'rejected';
    } else if (customer_decision === 'self_select') {
      newStatus = 'SUBSTITUTED';
      subStatus = 'accepted';
    } else if (customer_decision === 'picker_choice') {
      newStatus = 'picker_choice_pending';
      subStatus = 'pending';
    }

    const validSubUUID = (substitute_product_id && isValidUUID(substitute_product_id))
      ? substitute_product_id
      : (PRODUCT_MAPPING[substitute_product_id] || null);

    // Update item_table status
    const { data: updatedItem } = await supabase
      .from('item_table')
      .update({
        status: newStatus,
        replacement_item_id: validSubUUID
      })
      .eq('list', itemId)
      .select()
      .single();

    // Update substitutions log
    if (isValidUUID(itemId)) {
      await supabase
        .from('substitutions')
        .update({
          status: subStatus,
          proposed_product_id: validSubUUID
        })
        .eq('order_item_id', itemId);
    }

    // Recalculate order total amount
    await recalculateOrderTotal(orderId);

    // Check if order completion criteria is reached
    const isCompleted = await checkAndFinalizeOrderCompletion(orderId);

    return res.status(200).json({
      success: true,
      message: `Customer decision '${customer_decision}' recorded successfully.`,
      item: updatedItem || { id: itemId, status: newStatus, customer_decision },
      order_completed: isCompleted
    });

  } catch (err) {
    console.error('handleCustomerDecision exception:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};

/**
 * 4. PATCH /api/orders/:id/status
 * Updates order status (e.g. out_for_delivery, delivered, order_confirmed)
 */
exports.updateOrderStatus = async (req, res) => {
  const { id: orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Bad Request', message: 'status is required.' });
  }

  try {
    const { data: updatedOrder, error } = await supabase
      .from('order_table')
      .update({
        order_status: status,
        ...(status === 'delivered' ? { finalized_at: new Date().toISOString() } : {})
      })
      .eq('order_id', orderId)
      .select()
      .single();

    if (error) {
      console.error('[DATABASE_ERROR] updateOrderStatus error:', error);
      return res.status(500).json({ error: 'Database Error', message: error.message });
    }

    // Auto-assign delivery partner if transitioning to order_confirmed
    if (status === 'order_confirmed' || status === 'ready_for_pickup') {
      await assignDeliveryPartner(orderId);
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder
    });

  } catch (err) {
    console.error('updateOrderStatus exception:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};

/**
 * GET /api/orders/:id
 * Fetches order with items & substitutions timestamps
 */
exports.getOrderDetails = async (req, res) => {
  const { id: orderId } = req.params;
  try {
    const { data: order, error: orderErr } = await supabase
      .from('order_table')
      .select('order_id, order_status, order_date, total_amount, picker_id, delivery_partner_id, stores(name)')
      .eq('order_id', orderId)
      .single();

    if (orderErr || !order) {
      return res.status(404).json({ error: 'Not Found', message: `Order ${orderId} not found.` });
    }

    const { data: items } = await supabase
      .from('item_table')
      .select('*')
      .eq('order_id', orderId);

    const { data: subs } = await supabase
      .from('substitutions')
      .select('*');

    const subMap = {};
    (subs || []).forEach(s => {
      if (s.order_item_id) {
        subMap[s.order_item_id] = s.created_at;
      }
    });

    const formattedItems = (items || []).map(i => ({
      ...i,
      id: i.list || i.id,
      unavailable_marked_at: subMap[i.list] || i.created_at
    }));

    return res.status(200).json({
      order,
      items: formattedItems
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
