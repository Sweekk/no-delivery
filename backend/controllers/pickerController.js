const supabase = require('../lib/supabaseClient'); // Adjust path to your supabaseClient.js

// Regex to validate standard UUIDs
const isValidUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const getOrderForPicker = async (req, res) => {
  const { order_id } = req.params;

  // TEST CASE 2: Catch badly formatted IDs before hitting the database
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
          list_id,
          item_id,
          qty_requested,
          sub_rules,
          status,
          replacement_item_id
        )
      `)
      .eq('order_id', order_id)
      .single();

    // Handle Supabase errors
    if (error) {
      // TEST CASE 3: Catch 0 rows returned
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: `Order with ID ${order_id} does not exist.`
        });
      }

      // TEST CASE 4: Catch general database failures
      console.error('Supabase Query Error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve order data.'
      });
    }

    // TEST CASE 1: Happy Path
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
  const supabase = require('../lib/supabaseClient'); // Adjust path to your supabaseClient.js

  // Regex to validate standard UUIDs
  const isValidUUID = (id) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const getOrderForPicker = async (req, res) => {
    const { order_id } = req.params;

    // TEST CASE 2: Catch badly formatted IDs before hitting the database
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
          list_id,
          item_id,
          qty_requested,
          sub_rules,
          status,
          replacement_item_id
        )
      `)
        .eq('order_id', order_id)
        .single();

      // Handle Supabase errors
      if (error) {
        // TEST CASE 3: Catch 0 rows returned
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Not Found',
            message: `Order with ID ${order_id} does not exist.`
          });
        }

        // TEST CASE 4: Catch general database failures
        console.error('Supabase Query Error:', error);
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to retrieve order data.'
        });
      }

      // TEST CASE 1: Happy Path
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
}