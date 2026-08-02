const supabase = require('../lib/supabaseClient');

// GET /api/delivery/orders
exports.getAssignedOrders = async (req, res) => {
  try {
    const { data: dbOrders, error } = await supabase
      .from('order_table')
      .select('order_id, order_status, order_date, total_amount, customer_id, picker_id, stores(name)')
      .in('order_status', ['FINALIZED', 'ASSIGNED', 'PICKED', 'COMPLETED', 'DELIVERED', 'order_confirmed', 'ready_for_pickup', 'out_for_delivery'])
      .order('order_date', { ascending: false });

    if (error) {
      console.error('[DATABASE_ERROR] Supabase getAssignedOrders error:', error);
      return res.status(500).json({ error: error.message, orders: [] });
    }

    const formatted = await Promise.all((dbOrders || []).map(async o => {
      const { data: itemData } = await supabase
        .from('item_table')
        .select('*')
        .eq('order_id', o.order_id);

      const productIds = [...new Set((itemData || []).map(i => i.item_id).filter(Boolean))];
      let productMap = {};
      if (productIds.length > 0) {
        const { data: prodData } = await supabase
          .from('products')
          .select('id, name, price')
          .in('id', productIds);
        (prodData || []).forEach(p => { productMap[p.id] = p; });
      }

      const items = (itemData || []).map(i => {
        const prod = productMap[i.item_id];
        const name = (prod && prod.name) || i.product_name || i.item_id || 'Grocery Item';
        const price = parseFloat(i.price || i.item_price || prod?.price || 60);
        const st = String(i.status || '').toUpperCase();
        const available = st !== 'SKIPPED' && st !== 'SKIPPED_TIMEOUT' && st !== 'NOT_FOUND';
        return {
          id: i.list || i.id,
          name,
          quantity: i.qty_requested || 1,
          price,
          available
        };
      });

      const orderAmt = parseFloat(o.total_amount) || 0;
      const calculatedItemsTotal = items.reduce((sum, i) => i.available ? sum + (i.price * i.quantity) : sum, 0);
      const finalAmount = orderAmt > 0 ? orderAmt : calculatedItemsTotal;

      return {
        id: o.order_id,
        order_id: o.order_id,
        status: o.order_status === 'DELIVERED' || o.order_status === 'delivered' ? 'Delivered' : 'Ready for Pickup',
        raw_status: o.order_status,
        orderDate: o.order_date,
        subtotal: finalAmount,
        total: finalAmount,
        totalAmount: finalAmount,
        total_amount: finalAmount,
        storeName: o.stores?.name || 'QuickFix Grocery - Indiranagar',
        customerName: 'Alex Morgan',
        address: 'Flat 402, Green Park Residency, Sector 5',
        items
      };
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('[CRITICAL_ERROR] getAssignedOrders exception:', err);
    return res.status(500).json({ error: err.message, orders: [] });
  }
};

// POST /api/delivery/issues
exports.reportIssue = (req, res) => {
  const { orderId, issueType, description, alternateSuggestion } = req.body;

  if (!orderId || !issueType) {
    return res.status(400).json({ error: 'orderId and issueType are required.' });
  }

  console.log(`[Issue Report Received] Order: ${orderId}, Type: ${issueType}`, {
    description,
    alternateSuggestion
  });

  res.json({
    success: true,
    message: `Issue reported successfully for Order #${orderId}`,
    reportId: `ISSUE-${Date.now()}`
  });
};

// GET /api/delivery/profile
exports.getProfile = (req, res) => {
  res.json({
    partner: {
      id: 'PARTNER-402',
      name: 'QuickFix Fleet Partner',
      email: 'partner@quickfixgrocery.com',
      zone: 'Central Metro Zone',
      rating: 4.9,
      phone: '+91 98765 43210'
    },
    history: []
  });
};

// POST /api/delivery/location
exports.updateLocation = (req, res) => {
  const { lat, lng } = req.body;
  res.json({ success: true, updatedLocation: { lat, lng } });
};
