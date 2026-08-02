const supabase = require('../lib/supabaseClient');

/**
 * Verifies if all items for a given order have been resolved.
 * Valid resolution statuses: 'SUBSTITUTED', 'SKIPPED', 'CONFIRMED', 'RESOLVED', 'PICKED'.
 */
const checkAllItemsResolved = async (orderId) => {
  const { data: items, error } = await supabase
    .from('item_table')
    .select('status')
    .eq('order_id', orderId);

  if (error || !items || items.length === 0) {
    return false;
  }

  const resolvedStatuses = ['SUBSTITUTED', 'SKIPPED', 'CONFIRMED', 'RESOLVED', 'PICKED'];
  return items.every((item) => {
    const itemStatus = (item.status || '').toUpperCase();
    return resolvedStatuses.includes(itemStatus);
  });
};

/**
 * Checks whether an order is fully finalized and ready for delivery partner assignment.
 */
const isOrderFinalized = async (orderId) => {
  if (!orderId) return false;

  const { data: order, error: orderError } = await supabase
    .from('order_table')
    .select('order_status')
    .eq('order_id', orderId)
    .single();

  if (orderError || !order) {
    return false;
  }

  const status = (order.order_status || '').toUpperCase();
  if (status !== 'FINALIZED' && status !== 'ASSIGNED' && status !== 'COMPLETED') {
    return false;
  }

  const itemsResolved = await checkAllItemsResolved(orderId);
  if (!itemsResolved) {
    return false;
  }

  return true;
};

module.exports = {
  isOrderFinalized,
  checkAllItemsResolved,
};

