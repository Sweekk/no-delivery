const supabase = require('../lib/supabaseClient');

const isValidUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Endpoint A: Fetch Ready Orders
const getReadyOrders = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('order_table')
      .select(`
        order_id,
        order_status,
        order_date,
        total_amount,
        customer_id,
        picker_id,
        stores (
          name
        )
      `)
      .in('order_status', ['FINALIZED', 'ASSIGNED', 'PICKED', 'COMPLETED', 'DELIVERED', 'order_confirmed', 'assigned_to_delivery', 'out_for_delivery', 'delivered'])
      .order('order_date', { ascending: false });

    if (error) {
      console.error('[DATABASE_ERROR] Supabase Query Error in getReadyOrders:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve ready orders from Supabase: ' + error.message
      });
    }

    const formatted = (data || []).map(o => ({
      order_id: o.order_id,
      order_status: o.order_status,
      order_date: o.order_date,
      total_amount: parseFloat(o.total_amount) || 0,
      customer_id: o.customer_id,
      picker_id: o.picker_id,
      store_name: o.stores?.name || 'QuickFix Grocery Store Hub'
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('[CRITICAL_ERROR] Unexpected Error in getReadyOrders:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected server error occurred: ' + err.message
    });
  }
};

// Endpoint B: Mark Order Delivered
const deliverOrder = async (req, res) => {
  const { order_id } = req.params;

  if (!order_id || !isValidUUID(order_id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid order_id format. Must be a valid UUID.'
    });
  }

  try {
    const { data: order, error: queryError } = await supabase
      .from('order_table')
      .select('order_id, order_status')
      .eq('order_id', order_id)
      .single();

    if (queryError) {
      if (queryError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: `Order with ID ${order_id} does not exist.`
        });
      }
      console.error('[DATABASE_ERROR] Supabase Query Error in deliverOrder:', queryError);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to query order details: ' + queryError.message
      });
    }

    const currentStatus = (order.order_status || '').toUpperCase();
    const validReadyStatuses = ['FINALIZED', 'ASSIGNED', 'PICKED', 'COMPLETED'];
    if (!validReadyStatuses.includes(currentStatus)) {
      return res.status(400).json({
        error: 'Conflict',
        message: `Order cannot be delivered. Status lifecycle restriction: current status is '${order.order_status}' but must be one of: ${validReadyStatuses.join(', ')}.`
      });
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('order_table')
      .update({ order_status: 'DELIVERED' })
      .eq('order_id', order_id)
      .select()
      .single();

    if (updateError) {
      console.error('[DATABASE_ERROR] Supabase Update Error in deliverOrder:', updateError);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to finalize delivery status: ' + updateError.message
      });
    }

    return res.status(200).json(updatedOrder);

  } catch (err) {
    console.error('[CRITICAL_ERROR] Unexpected Error in deliverOrder:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected server error occurred: ' + err.message
    });
  }
};

module.exports = {
  getReadyOrders,
  deliverOrder
};
