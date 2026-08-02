const supabase = require('../lib/supabaseClient');

const isValidUUID = (id) =>
  typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// PATCH: Customer resolves an 'ask' sub-rule
const resolveItemAction = async (req, res) => {
  const { list_id } = req.params;
  const { action, replacement_item_id } = req.body;

  if (!['skip', 'substitute'].includes(action)) {
    return res.status(400).json({ 
      error: 'Bad Request', 
      message: 'Action must be either "skip" or "substitute".' 
    });
  }

  if (action === 'substitute' && !replacement_item_id) {
    return res.status(400).json({ 
      error: 'Bad Request', 
      message: 'replacement_item_id is required when substituting.' 
    });
  }

  const dbStatus = action === 'skip' ? 'SKIPPED' : 'SUBSTITUTED';
  const newStatus = action === 'skip' ? 'not_found' : 'replaced';

  const formattedReplacement = (action === 'substitute' && replacement_item_id)
    ? (isValidUUID(replacement_item_id) ? replacement_item_id : null)
    : null;

  try {
    const { data, error } = await supabase
      .from('item_table')
      .update({ 
        status: dbStatus, 
        replacement_item_id: formattedReplacement 
      })
      .eq('list', list_id)
      .select();

    if (error) {
      console.error('[DATABASE_ERROR] Supabase resolveItemAction error:', error);
      return res.status(500).json({ error: 'Database Error', message: error.message });
    }

    // Also update substitution record if exists
    if (isValidUUID(list_id)) {
      const subStatus = action === 'skip' ? 'rejected' : 'accepted';
      await supabase
        .from('substitutions')
        .update({ status: subStatus, proposed_product_id: formattedReplacement })
        .eq('order_item_id', list_id)
        .eq('status', 'pending');
    }

    return res.status(200).json({
      message: `Item successfully marked as ${newStatus}.`,
      data: {
        list_id: list_id,
        status: newStatus,
        replacement_item_id: formattedReplacement
      }
    });
  } catch (err) {
    console.error('[CRITICAL_ERROR] resolveItemAction exception:', err);
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

const getOrderStatus = async (req, res) => {
  const { order_id } = req.params;

  try {
    const { data, error } = await supabase
      .from('order_table')
      .select(`
        order_id,
        order_status,
        order_date,
        total_amount,
        items:item_table (
          list,
          item_id,
          qty_requested,
          sub_rules,
          status,
          replacement_item_id,
          price,
          item_price
        )
      `)
      .eq('order_id', order_id)
      .single();

    if (error) {
      console.error('[DATABASE_ERROR] getOrderStatus query error:', error);
      return res.status(404).json({ error: 'Not Found', message: `Order with ID ${order_id} does not exist.` });
    }

    if (data && data.items) {
      // Resolve product names and suggested substitutes from products table
      const productIds = [...new Set(data.items.map(i => i.item_id).filter(Boolean))];
      let productMap = {};
      if (productIds.length > 0) {
        const { data: prodData } = await supabase
          .from('products')
          .select('id, name, category, price, image')
          .in('id', productIds);
        (prodData || []).forEach(p => { productMap[p.id] = p; });
      }

      // For unavailable items, find same-category substitutes
      const categoriesNeeded = [...new Set(
        data.items
          .filter(i => {
            const st = String(i.status).toLowerCase();
            return st === 'awaiting_customer' || st === 'skipped' || st === 'unavailable';
          })
          .map(i => productMap[i.item_id]?.category)
          .filter(Boolean)
      )];

      let categorySubMap = {};
      for (const cat of categoriesNeeded) {
        const itemIdsInOrder = data.items.map(i => i.item_id);
        const { data: subs } = await supabase
          .from('products')
          .select('id, name, price, image')
          .eq('category', cat)
          .not('id', 'in', `(${itemIdsInOrder.join(',')})`)
          .limit(3);
        categorySubMap[cat] = subs || [];
      }

      // Also fetch substitution records to get server timestamps
      const listIds = data.items.map(i => i.list).filter(Boolean);
      let subTimestamps = {};
      if (listIds.length > 0) {
        const { data: subRecs } = await supabase
          .from('substitutions')
          .select('order_item_id, created_at, proposed_product_id')
          .in('order_item_id', listIds);
        (subRecs || []).forEach(s => {
          subTimestamps[s.order_item_id] = s;
        });
      }

      data.items = data.items.map(item => {
        const prod = productMap[item.item_id];
        const subRecord = subTimestamps[item.list];
        const category = prod?.category;
        const suggestedSubs = category ? (categorySubMap[category] || []) : [];

        return {
          list_id: item.list,
          list: item.list,
          product_name: prod?.name || item.item_id,
          item_id: item.item_id,
          category: category || null,
          qty_requested: item.qty_requested,
          sub_rules: item.sub_rules,
          status: item.status,
          replacement_item_id: item.replacement_item_id,
          price: parseFloat(item.price || item.item_price) || 0,
          unavailable_marked_at: subRecord?.created_at || null,
          suggested_substitute: suggestedSubs[0] || null,
          all_substitutes: suggestedSubs
        };
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('[CRITICAL_ERROR] getOrderStatus exception:', err);
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

module.exports = { resolveItemAction, getOrderStatus };
