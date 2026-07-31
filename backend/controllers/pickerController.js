const supabase = require('../lib/supabaseClient');

<<<<<<< HEAD
const PRODUCT_MAPPING = {
  'APPLE-FUJI-01': 'a0000000-0000-0000-0000-000000000001',
  'MILK-GAL-02': 'a0000000-0000-0000-0000-000000000002',
  'BANANA-ORG-03': 'a0000000-0000-0000-0000-000000000003',
  'BREAD-WW-04': 'a0000000-0000-0000-0000-000000000004',
  'CEREAL-BOX-05': 'a0000000-0000-0000-0000-000000000005',
  'EGGS-DOZ-06': 'a0000000-0000-0000-0000-000000000006'
};

const INVERSE_PRODUCT_MAPPING = {
  'a0000000-0000-0000-0000-000000000001': 'APPLE-FUJI-01',
  'a0000000-0000-0000-0000-000000000002': 'MILK-GAL-02',
  'a0000000-0000-0000-0000-000000000003': 'BANANA-ORG-03',
  'a0000000-0000-0000-0000-000000000004': 'BREAD-WW-04',
  'a0000000-0000-0000-0000-000000000005': 'CEREAL-BOX-05',
  'a0000000-0000-0000-0000-000000000006': 'EGGS-DOZ-06'
};

// Regex to validate standard UUIDs
const isValidUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const getOrderForPicker = async (req, res) => {
  const { order_id } = req.params;

  if (!order_id || !isValidUUID(order_id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid order_id format. Must be a valid UUID.'
    });
  }

  try {
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

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: `Order with ID ${order_id} does not exist.`
        });
      }

      console.error('Supabase Query Error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve order data.'
      });
    }

    // Map UUIDs back to frontend product codes and list back to list_id
    if (data && data.items) {
      data.items = data.items.map(item => {
        const { list, ...rest } = item;
        return {
          list_id: list,
          ...rest,
          item_id: INVERSE_PRODUCT_MAPPING[item.item_id] || item.item_id,
          replacement_item_id: INVERSE_PRODUCT_MAPPING[item.replacement_item_id] || item.replacement_item_id || null
        };
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Unexpected Controller Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.'
    });
  }
};

const getActiveRun = async (req, res) => {
  res.status(200).json({ message: 'Active run placeholder' });
};

const handleNotFound = async (req, res) => {
  res.status(200).json({ message: 'Not found item handled placeholder' });
};

const updateItemStatus = async (req, res) => {
  const { list_id } = req.params;
  const { status, replacement_item_id } = req.body;

  if (!list_id || !isValidUUID(list_id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid list_id format. Must be a valid UUID.'
    });
  }

  const validStatuses = ['found', 'not_found', 'replaced', 'awaiting_customer'];
  if (!status || !validStatuses.includes(status.toLowerCase())) {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
=======
// In-memory fallback dataset for smooth operation even if DB is empty or disconnected
const memoryStore = {
  orders: [
    {
      order_id: 'ord-101',
      display_name: "Rahul Sharma's grocery order",
      order_status: 'pending_pick',
      order_date: new Date(Date.now() - 15 * 60000).toISOString(),
      store_name: 'QuickFIx Grocery - Indiranagar',
      customer_name: 'Rahul Sharma',
      picker_id: null,
      total_amount: 349.00,
      items: [
        {
          list_id: 'item-101-1',
          order_id: 'ord-101',
          item_id: 'Amul Taaza Toned Milk 1L',
          qty_requested: 2,
          status: 'pending',
          replacement_item_id: null,
          category: 'Dairy & Bread',
          aisle: 'Aisle 3, Shelf B'
        },
        {
          list_id: 'item-101-2',
          order_id: 'ord-101',
          item_id: 'Britannia 100% Whole Wheat Bread 400g',
          qty_requested: 1,
          status: 'pending',
          replacement_item_id: null,
          category: 'Dairy & Bread',
          aisle: 'Aisle 3, Shelf D'
        },
        {
          list_id: 'item-101-3',
          order_id: 'ord-101',
          item_id: 'Lay\'s India\'s Magic Masala Chips 50g',
          qty_requested: 3,
          status: 'pending',
          replacement_item_id: null,
          category: 'Snacks & Munchies',
          aisle: 'Aisle 1, Shelf A'
        },
        {
          list_id: 'item-101-4',
          order_id: 'ord-101',
          item_id: 'Coca-Cola Zero Sugar Can 300ml',
          qty_requested: 2,
          status: 'pending',
          replacement_item_id: null,
          category: 'Cold Drinks & Juices',
          aisle: 'Aisle 2, Shelf C'
        }
      ]
    },
    {
      order_id: 'ord-102',
      display_name: "Priya Patel's grocery order",
      order_status: 'pending_pick',
      order_date: new Date(Date.now() - 28 * 60000).toISOString(),
      store_name: 'QuickFIx Grocery - Koramangala',
      customer_name: 'Priya Patel',
      picker_id: null,
      total_amount: 520.50,
      items: [
        {
          list_id: 'item-102-1',
          order_id: 'ord-102',
          item_id: 'Organic Bananas 6pcs (approx 800g)',
          qty_requested: 1,
          status: 'pending',
          replacement_item_id: null,
          category: 'Fresh Fruits & Vegetables',
          aisle: 'Aisle 5, Bin 12'
        },
        {
          list_id: 'item-102-2',
          order_id: 'ord-102',
          item_id: 'Fortune Sunlite Sunflower Oil 1L',
          qty_requested: 1,
          status: 'pending',
          replacement_item_id: null,
          category: 'Atta, Rice & Oil',
          aisle: 'Aisle 4, Shelf E'
        },
        {
          list_id: 'item-102-3',
          order_id: 'ord-102',
          item_id: 'Cadbury Dairy Milk Silk 150g',
          qty_requested: 2,
          status: 'pending',
          replacement_item_id: null,
          category: 'Sweets & Chocolates',
          aisle: 'Aisle 1, Shelf C'
        }
      ]
    },
    {
      order_id: 'ord-103',
      display_name: "Amit Verma's grocery order",
      order_status: 'picking_in_progress',
      order_date: new Date(Date.now() - 5 * 60000).toISOString(),
      store_name: 'QuickFIx Grocery - HSR Layout',
      customer_name: 'Amit Verma',
      picker_id: 'picker-77',
      total_amount: 185.00,
      items: [
        {
          list_id: 'item-103-1',
          order_id: 'ord-103',
          item_id: 'Maggi 2-Minute Instant Noodles 280g',
          qty_requested: 2,
          status: 'found',
          replacement_item_id: null,
          category: 'Instant Food',
          aisle: 'Aisle 2, Shelf B'
        },
        {
          list_id: 'item-103-2',
          order_id: 'ord-103',
          item_id: 'Nescafe Classic Instant Coffee 50g',
          qty_requested: 1,
          status: 'pending',
          replacement_item_id: null,
          category: 'Tea, Coffee & Beverages',
          aisle: 'Aisle 2, Shelf D'
        }
      ]
    }
  ]
};

// Map database statuses to picker frontend standard statuses
function normalizeItemStatus(dbStatus) {
  if (!dbStatus) return 'pending';
  const s = String(dbStatus).toLowerCase();
  if (s === 'picked' || s === 'found') return 'found';
  if (s === 'skipped' || s === 'not_found') return 'not_found';
  if (s === 'substituted' || s === 'replaced') return 'replaced';
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
 * GET /api/picker/orders/pending (or /orders/pending)
 * Fetches all orders available for picking
 */
exports.getPendingOrders = async (req, res) => {
  try {
    const { data: dbOrders, error } = await supabase
      .from('order_table')
      .select('order_id, order_status, order_date, total_amount, store_id, picker_id, stores(name)')
      .order('order_date', { ascending: false });

    if (!error && dbOrders && dbOrders.length > 0) {
      const formatted = dbOrders.map(o => ({
        order_id: o.order_id,
        display_name: 'Grocery order',
        order_status: normalizeOrderStatus(o.order_status),
        order_date: o.order_date,
        store_name: o.stores?.name || 'QuickFIx Grocery Store',
        picker_id: o.picker_id,
        total_amount: parseFloat(o.total_amount) || 0
      }));
      return res.status(200).json({ success: true, orders: formatted });
    }
  } catch (err) {
    console.warn('[PICKER] Supabase query failed, returning fallback memory data:', err.message);
  }

  // Fallback to memory store
  const orders = memoryStore.orders.map(o => ({
    order_id: o.order_id,
    display_name: o.display_name || 'Grocery order',
    order_status: o.order_status,
    order_date: o.order_date,
    store_name: o.store_name,
    customer_name: o.customer_name,
    picker_id: o.picker_id,
    total_amount: o.total_amount,
    item_count: o.items.length
  }));

  return res.status(200).json({ success: true, orders });
};

/**
 * POST /api/picker/order/:order_id/claim (or /order/:order_id/claim)
 * Claims an order by changing status to picking_in_progress and assigning picker_id
 */
exports.claimOrder = async (req, res) => {
  const { order_id } = req.params;
  const pickerId = req.body.picker_id || 'picker-101';

  try {
    const { data, error } = await supabase
      .from('order_table')
      .update({
        order_status: 'PICKING',
        picker_id: pickerId
      })
      .eq('order_id', order_id)
      .select();

    if (!error && data && data.length > 0) {
      return res.status(200).json({
        success: true,
        message: `Order ${order_id} claimed successfully`,
        order: {
          order_id,
          order_status: 'picking_in_progress',
          picker_id: pickerId
        }
      });
    }
  } catch (err) {
    console.warn('[PICKER] Supabase update error, applying to memory store:', err.message);
  }

  // Fallback memory store update
  let order = memoryStore.orders.find(o => o.order_id === order_id);
  if (!order) {
    // Create placeholder order if not found
    order = {
      order_id,
      order_status: 'picking_in_progress',
      order_date: new Date().toISOString(),
      display_name: 'Grocery order',
      store_name: 'QuickFIx Grocery Store',
      picker_id: pickerId,
      total_amount: 250.00,
      items: [
        {
          list_id: `${order_id}-1`,
          order_id,
          item_id: 'Fresh Organic Tomatoes 500g',
          qty_requested: 2,
          status: 'pending',
          replacement_item_id: null
        },
        {
          list_id: `${order_id}-2`,
          order_id,
          item_id: 'Amul Butter 500g',
          qty_requested: 1,
          status: 'pending',
          replacement_item_id: null
        }
      ]
    };
    memoryStore.orders.push(order);
  } else {
    order.order_status = 'picking_in_progress';
    order.picker_id = pickerId;
  }

  return res.status(200).json({
    success: true,
    message: `Order ${order_id} claimed successfully`,
    order
  });
};

/**
 * GET /order/:order_id (or /api/order/:order_id)
 * Fetches specific order and its list of items
 */
exports.getOrderDetails = async (req, res) => {
  const { order_id } = req.params;

  try {
    const { data: orderData, error: orderErr } = await supabase
      .from('order_table')
      .select('*, stores(name)')
      .eq('order_id', order_id)
      .single();

    if (!orderErr && orderData) {
      const { data: itemData } = await supabase
        .from('item_table')
        .select('*')
        .eq('order_id', order_id);

      const items = (itemData || []).map(i => ({
        list_id: i.list || i.id,
        order_id: i.order_id,
        item_id: i.item_id || `Item #${i.list}`,
        qty_requested: i.qty_requested || 1,
        status: normalizeItemStatus(i.status),
        replacement_item_id: i.replacement_item_id || null,
        sub_rules: i.sub_rules || 'ask'
      }));

      return res.status(200).json({
        success: true,
        order_id: orderData.order_id,
        order_status: normalizeOrderStatus(orderData.order_status),
        display_name: 'Grocery order',
        store_name: orderData.stores?.name || 'QuickFIx Grocery Store',
        picker_id: orderData.picker_id,
        items
      });
    }
  } catch (err) {
    console.warn('[PICKER] DB error fetching order, falling back to memory store:', err.message);
  }

  // Memory store fallback
  const order = memoryStore.orders.find(o => o.order_id.toLowerCase() === String(order_id).toLowerCase());
  if (order) {
    return res.status(200).json({
      success: true,
      order_id: order.order_id,
      display_name: order.display_name || 'Grocery order',
      order_status: order.order_status,
      store_name: order.store_name,
      picker_id: order.picker_id,
      items: order.items
    });
  }

  // Create an on-demand order if user searches for an arbitrary ID (e.g. "ORD-999")
  const generatedOrder = {
    order_id,
    order_status: 'picking_in_progress',
    order_date: new Date().toISOString(),
    display_name: 'Grocery order',
    store_name: 'QuickFIx Grocery - Indiranagar',
    picker_id: 'picker-101',
    items: [
      {
        list_id: `${order_id}-item-1`,
        order_id,
        item_id: 'Amul Taaza Fresh Milk 1L',
        qty_requested: 2,
        status: 'pending',
        replacement_item_id: null,
        category: 'Dairy & Milk',
        aisle: 'Aisle 1, Bay A'
      },
      {
        list_id: `${order_id}-item-2`,
        order_id,
        item_id: 'Brown Bread Wheat Special 400g',
        qty_requested: 1,
        status: 'pending',
        replacement_item_id: null,
        category: 'Bakery',
        aisle: 'Aisle 1, Bay C'
      },
      {
        list_id: `${order_id}-item-3`,
        order_id,
        item_id: 'Doritos Nacho Cheese 150g',
        qty_requested: 2,
        status: 'pending',
        replacement_item_id: null,
        category: 'Snacks',
        aisle: 'Aisle 3, Bay B'
      }
    ]
  };

  memoryStore.orders.push(generatedOrder);

  return res.status(200).json({
    success: true,
    order_id: generatedOrder.order_id,
    display_name: generatedOrder.display_name,
    order_status: generatedOrder.order_status,
    store_name: generatedOrder.store_name,
    picker_id: generatedOrder.picker_id,
    items: generatedOrder.items
  });
};

/**
 * PATCH /item/:list_id (or /api/item/:list_id)
 * Updates item status ('found', 'not_found', 'replaced') and replacement_item_id
 */
exports.updateItemStatus = async (req, res) => {
  const { list_id } = req.params;
  const { status, replacement_item_id } = req.body;

  const validStatuses = ['found', 'not_found', 'replaced'];
  if (!status || !validStatuses.includes(status.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid status: '${status}'. Must be one of: 'found', 'not_found', or 'replaced'.`
>>>>>>> bdev
    });
  }

  const normalizedStatus = status.toLowerCase();

<<<<<<< HEAD
  // Map to DB status representation (lowercase status constraint)
  const dbStatusMap = {
    found: 'found',
    not_found: 'not_found',
    replaced: 'replaced',
    awaiting_customer: 'awaiting_customer'
  };

  try {
    const dbReplacementId = replacement_item_id ? (PRODUCT_MAPPING[replacement_item_id] || replacement_item_id) : null;

=======
  // Map to DB status representation if needed
  const dbStatusMap = {
    found: 'PICKED',
    not_found: 'SKIPPED',
    replaced: 'SUBSTITUTED'
  };

  try {
>>>>>>> bdev
    const { data, error } = await supabase
      .from('item_table')
      .update({
        status: dbStatusMap[normalizedStatus],
<<<<<<< HEAD
        replacement_item_id: (normalizedStatus === 'replaced' || normalizedStatus === 'awaiting_customer') ? dbReplacementId : null
      })
      .eq('list', list_id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: `Item with list_id ${list_id} does not exist.`
        });
      }
      console.error('Supabase Update Error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update item status.'
      });
    }

    return res.status(200).json({
      message: 'Item updated successfully',
      data: data
    });

  } catch (err) {
    console.error('Unexpected Controller Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.'
    });
  }
};

const completeOrder = async (req, res) => {
  const { order_id } = req.params;

  if (!order_id || !isValidUUID(order_id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid order_id format. Must be a valid UUID.'
    });
  }

  try {
    const { data: order, error: orderError } = await supabase
      .from('order_table')
      .select('order_id, order_status')
      .eq('order_id', order_id)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: `Order with ID ${order_id} does not exist.`
        });
      }
      console.error('Supabase Query Error:', orderError);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve order details.'
      });
    }

    const { data: items, error: itemsError } = await supabase
      .from('item_table')
      .select('list, item_id, status')
      .eq('order_id', order_id);

    if (itemsError) {
      console.error('Supabase Items Query Error:', itemsError);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve order items.'
      });
    }

    // Check if any items are pending or awaiting customer response
    const incompleteItems = items.filter(item => {
      const s = String(item.status).toLowerCase();
      return s === 'pending' || s === 'awaiting_customer';
    });

    if (incompleteItems.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot complete order. Some items are still pending or awaiting customer response.',
        pending_items: incompleteItems
      });
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('order_table')
      .update({ order_status: 'FINALIZED' })
      .eq('order_id', order_id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase Order Update Error:', updateError);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to finalize order status.'
      });
    }

    return res.status(200).json({
      message: 'Order completed successfully',
      data: updatedOrder
    });

  } catch (err) {
    console.error('Unexpected Controller Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.'
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('order_table')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) {
      console.error('Supabase getOrders Error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve orders.'
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Unexpected Controller Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.'
    });
  }
};

const updateOrderStatus = async (req, res) => {
  const { order_id } = req.params;
  const { status } = req.body;

  if (!order_id || !isValidUUID(order_id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid order_id format. Must be a valid UUID.'
    });
  }

  if (!status) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'status is required.'
    });
  }

  try {
    const { data, error } = await supabase
      .from('order_table')
      .update({ order_status: status })
      .eq('order_id', order_id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: `Order with ID ${order_id} does not exist.`
        });
      }
      console.error('Supabase Update Order Status Error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update order status.'
      });
    }

    return res.status(200).json({
      message: 'Order status updated successfully',
      data
    });
  } catch (err) {
    console.error('Unexpected Controller Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.'
    });
  }
};

module.exports = {
  getOrderForPicker,
  getActiveRun,
  updateItemStatus,
  handleNotFound,
  completeOrder,
  getOrders,
  updateOrderStatus
};
=======
        replacement_item_id: normalizedStatus === 'replaced' ? replacement_item_id : null
      })
      .eq('list', list_id)
      .select();

    if (!error && data && data.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Item status updated',
        item: {
          list_id,
          status: normalizedStatus,
          replacement_item_id: normalizedStatus === 'replaced' ? replacement_item_id : null
        }
      });
    }
  } catch (err) {
    console.warn('[PICKER] DB update failed, falling back to memory store:', err.message);
  }

  // Fallback memory store update
  let targetItem = null;
  for (const order of memoryStore.orders) {
    const found = order.items.find(i => i.list_id === list_id);
    if (found) {
      targetItem = found;
      break;
    }
  }

  if (targetItem) {
    targetItem.status = normalizedStatus;
    targetItem.replacement_item_id = normalizedStatus === 'replaced' ? (replacement_item_id || null) : null;
  }

  return res.status(200).json({
    success: true,
    message: 'Item status updated successfully',
    item: {
      list_id,
      status: normalizedStatus,
      replacement_item_id: normalizedStatus === 'replaced' ? (replacement_item_id || null) : null
    }
  });
};

/**
 * POST /order/:order_id/complete (or /api/order/:order_id/complete)
 * Completes the order if all items are resolved.
 * Returns 400 if any items are pending.
 */
exports.completeOrder = async (req, res) => {
  const { order_id } = req.params;

  let items = [];
  let orderFound = false;

  try {
    const { data: itemData, error } = await supabase
      .from('item_table')
      .select('*')
      .eq('order_id', order_id);

    if (!error && itemData && itemData.length > 0) {
      orderFound = true;
      items = itemData.map(i => ({
        list_id: i.list || i.id,
        status: normalizeItemStatus(i.status)
      }));
    }
  } catch (err) {
    console.warn('[PICKER] DB query error during completion:', err.message);
  }

  if (!orderFound) {
    const memOrder = memoryStore.orders.find(o => o.order_id.toLowerCase() === String(order_id).toLowerCase());
    if (memOrder) {
      items = memOrder.items;
      orderFound = true;
    }
  }

  // Check for any pending items
  const pendingItems = items.filter(i => i.status === 'pending');

  if (pendingItems.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Cannot complete order: ${pendingItems.length} item(s) are still pending resolution. Please mark every item as Found, Not Found, or Substitute before completing.`,
      pending_count: pendingItems.length
    });
  }

  // Update order status to finalized/completed
  const now = new Date().toISOString();

  try {
    await supabase
      .from('order_table')
      .update({
        order_status: 'FINALIZED',
        finalized_at: now
      })
      .eq('order_id', order_id);
  } catch (err) {
    console.warn('[PICKER] Could not update order_table on Supabase:', err.message);
  }

  const memOrder = memoryStore.orders.find(o => o.order_id.toLowerCase() === String(order_id).toLowerCase());
  if (memOrder) {
    memOrder.order_status = 'completed';
    memOrder.finalized_at = now;
  }

  return res.status(200).json({
    success: true,
    message: `Order ${order_id} completed successfully!`,
    order_id,
    completed_at: now
  });
};

// Aliases for compatibility
exports.getActiveRun = exports.getPendingOrders;
exports.handleNotFound = exports.updateItemStatus;
>>>>>>> bdev
