// Service for verifying all items in an order are resolved before dispatch
const supabase = require('../lib/supabaseClient');

/**
 * Verifies if all items for a given order have been resolved.
 * Valid resolution statuses: 'SUBSTITUTED', 'SKIPPED', 'CONFIRMED' (or 'RESOLVED').
 * An item with 'PENDING' resolution status is unresolved.
 * 
 * @param {string} orderId 
 * @returns {Promise<boolean>}
 */
const checkAllItemsResolved = async (orderId) => {
  const { data: items, error } = await supabase
    .from('order_items')
    .select('status, resolution_status')
    .eq('order_id', orderId);

  if (error || !items || items.length === 0) {
    return false;
  }

  const resolvedStatuses = ['SUBSTITUTED', 'SKIPPED', 'CONFIRMED', 'RESOLVED', 'PICKED'];
  return items.every((item) => {
    const resStatus = (item.resolution_status || '').toUpperCase();
    const itemStatus = (item.status || '').toUpperCase();

    if (resStatus === 'PENDING') return false;
    return resolvedStatuses.includes(resStatus) || resolvedStatuses.includes(itemStatus) || (resStatus !== '' && resStatus !== 'PENDING');
  });
};

/**
 * Checks whether an order is fully finalized and ready for delivery partner assignment.
 * 
 * Acceptance Criteria:
 * - Order status must equal 'FINALIZED'.
 * - All items for the order must have their substitution/picking issues resolved (not PENDING).
 * 
 * @param {string} orderId 
 * @returns {Promise<boolean>}
 */
const isOrderFinalized = async (orderId) => {
  if (!orderId) return false;

  // 1. Query Supabase for order status
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return false;
  }

  // 2. Confirm order's status field equals FINALIZED
  if (!order.status || order.status.toUpperCase() !== 'FINALIZED') {
    return false;
  }

  // 3. Confirm all items for the order are resolved
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

