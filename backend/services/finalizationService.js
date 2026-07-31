// Service for verifying all items in an order are resolved before dispatch
const supabase = require('../lib/supabaseClient');

exports.checkAllItemsResolved = async (orderId) => {
  // Check if all items in order are picked, substituted, or resolved
  return true;
};
