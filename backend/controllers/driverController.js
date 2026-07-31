const supabase = require('../lib/supabaseClient');

// Regex to validate standard UUIDs
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
        store:store_table (
          store_name
        )
      `)
      .eq('order_status', 'picked')
      .order('order_date', { ascending: true });

    if (error) {
      console.error('Supabase Query Error in getReadyOrders:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve ready orders from Supabase.'
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Unexpected Error in getReadyOrders:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected server error occurred.'
    });
  }
};

// Endpoint B: Mark Order Delivered
const deliverOrder = async (req, res) => {
  const { order_id } = req.params;

  // 1. Validate UUID format
  if (!order_id || !isValidUUID(order_id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid order_id format. Must be a valid UUID.'
    });
  }

  try {
    // 2. Query the order to check exists and verify current status
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
      console.error('Supabase Query Error in deliverOrder:', queryError);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to query order details.'
      });
    }

    // 3. Constraint Check: Only update if current status is exactly 'picked'
    if (order.order_status !== 'picked') {
      return res.status(404).json({
        error: 'Conflict',
        message: `Order cannot be delivered. Status lifecycle restriction: current status is '${order.order_status}' but must be 'picked'.`
      });
    }

    // 4. Update the status to 'delivered'
    const { data: updatedOrder, error: updateError } = await supabase
      .from('order_table')
      .update({ order_status: 'delivered' })
      .eq('order_id', order_id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase Update Error in deliverOrder:', updateError);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to finalize delivery status.'
      });
    }

    return res.status(200).json(updatedOrder);

  } catch (err) {
    console.error('Unexpected Error in deliverOrder:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected server error occurred.'
    });
  }
};

module.exports = {
  getReadyOrders,
  deliverOrder
};
