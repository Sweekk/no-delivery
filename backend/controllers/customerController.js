const supabase = require('../lib/supabaseClient');

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

  try {
    // 2. Determine the new database values based on the customer's choice
    const newStatus = action === 'skip' ? 'not_found' : 'replaced';
    const newReplacementId = action === 'skip' ? null : (PRODUCT_MAPPING[replacement_item_id] || replacement_item_id);

    // 3. Update the database, ensuring we ONLY update items waiting on the customer
    const { data, error } = await supabase
      .from('item_table')
      .update({ 
        status: newStatus, 
        replacement_item_id: newReplacementId 
      })
      .eq('list', list_id)
      .eq('status', 'awaiting_customer') // Security: Prevent updating already picked items
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Not Found / Conflict', 
          message: 'Item not found or is not currently awaiting a customer response.' 
        });
      }
      throw error;
    }

    return res.status(200).json({
      message: `Item successfully marked as ${newStatus}.`,
      data: data
    });

  } catch (err) {
    console.error('Unexpected Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
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
        message: 'Failed to retrieve order status.'
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
    console.error('Unexpected Error in getOrderStatus:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { resolveItemAction, getOrderStatus };
