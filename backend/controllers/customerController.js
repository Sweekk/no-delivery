const supabase = require('../lib/supabaseClient');

// PATCH: Customer resolves an 'ask' sub-rule
const resolveItemAction = async (req, res) => {
  const { list_id } = req.params;
  const { action, replacement_item_id } = req.body;

  // 1. Validate input
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

  const newStatus = action === 'skip' ? 'not_found' : 'replaced';
  const dbStatus = action === 'skip' ? 'SKIPPED' : 'SUBSTITUTED';
  const newReplacementId = action === 'skip' ? null : replacement_item_id;

  try {
    // 2. Determine and update database values across potential primary key column names (list, list_id, id)
    let updatedData = null;

    const { data: d1, error: e1 } = await supabase
      .from('item_table')
      .update({ 
        status: dbStatus, 
        replacement_item_id: newReplacementId 
      })
      .eq('list', list_id)
      .select();

    if (!e1 && d1 && d1.length > 0) {
      updatedData = d1[0];
    } else {
      const { data: d2, error: e2 } = await supabase
        .from('item_table')
        .update({ 
          status: dbStatus, 
          replacement_item_id: newReplacementId 
        })
        .eq('list_id', list_id)
        .select();

      if (!e2 && d2 && d2.length > 0) {
        updatedData = d2[0];
      } else {
        const { data: d3, error: e3 } = await supabase
          .from('item_table')
          .update({ 
            status: dbStatus, 
            replacement_item_id: newReplacementId 
          })
          .eq('id', list_id)
          .select();

        if (!e3 && d3 && d3.length > 0) {
          updatedData = d3[0];
        }
      }
    }

    if (updatedData) {
      return res.status(200).json({
        message: `Item successfully marked as ${newStatus}.`,
        data: {
          list_id: updatedData.list || updatedData.list_id || updatedData.id || list_id,
          status: newStatus,
          replacement_item_id: newReplacementId
        }
      });
    }
  } catch (err) {
    console.warn('[CUSTOMER] Supabase resolve failed, checking memory store:', err.message);
  }

  // Fallback memory store update
  const { memoryStore } = require('./pickerController');
  if (memoryStore && memoryStore.orders) {
    for (const order of memoryStore.orders) {
      const item = order.items.find(i => i.list_id === list_id || i.list === list_id || i.id === list_id);
      if (item) {
        item.status = newStatus;
        item.replacement_item_id = newReplacementId;
        return res.status(200).json({
          message: `Item successfully marked as ${newStatus}.`,
          data: { list_id, status: newStatus, replacement_item_id: newReplacementId }
        });
      }
    }
  }

  return res.status(404).json({ 
    error: 'Not Found', 
    message: `Item with ID ${list_id} was not found.` 
  });
};

const getOrderStatus = async (req, res) => {
  const { order_id } = req.params;

  try {
    // Fetch order and its items
    const { data, error } = await supabase
      .from('order_table')
      .select(`
        order_id,
        order_status,
        order_date,
        items:item_table (
          list,
          item_id,
          qty_requested,
          sub_rules,
          status,
          replacement_item_id
        )
      `)
      .eq('order_id', order_id)
      .single();

    if (!error && data) {
      if (data.items) {
        data.items = data.items.map(item => ({
          list_id: item.list || item.list_id,
          ...item
        }));
      }
      return res.status(200).json(data);
    }
  } catch (err) {
    console.warn('[CUSTOMER] Supabase Query Error in getOrderStatus:', err.message);
  }

  // Fallback to memory store
  const { memoryStore } = require('./pickerController');
  if (memoryStore && memoryStore.orders) {
    const memOrder = memoryStore.orders.find(o => o.order_id.toLowerCase() === String(order_id).toLowerCase());
    if (memOrder) {
      return res.status(200).json({
        order_id: memOrder.order_id,
        order_status: memOrder.order_status,
        order_date: memOrder.order_date,
        items: memOrder.items.map(i => ({
          list_id: i.list_id || i.list,
          ...i
        }))
      });
    }
  }

  return res.status(404).json({
    error: 'Not Found',
    message: `Order with ID ${order_id} does not exist.`
  });
};

module.exports = { resolveItemAction, getOrderStatus };

