const supabase = require('../lib/supabaseClient');

const PRODUCT_CATALOG = [
  { id: 'e0000001-0000-0000-0000-000000000001', name: 'Organic Bananas 6pcs', category: 'Fruits & Vegetables', price: 50 },
  { id: 'e0000002-0000-0000-0000-000000000002', name: 'Amul Taaza Toned Milk 1L', category: 'Dairy, Bread & Eggs', price: 54 },
  { id: 'e0000003-0000-0000-0000-000000000003', name: 'Whole Wheat Bread 400g', category: 'Dairy, Bread & Eggs', price: 45 },
  { id: 'e0000004-0000-0000-0000-000000000004', name: 'Fortune Sunflower Oil 1L', category: 'Atta, Rice & Oil', price: 145 },
  { id: 'e0000005-0000-0000-0000-000000000005', name: 'Doritos Nacho Cheese 150g', category: 'Snacks & Munchies', price: 60 },
  { id: 'e0000006-0000-0000-0000-000000000006', name: 'Fresh Tomatoes 1kg', category: 'Fruits & Vegetables', price: 35 },
  { id: 'a0000000-0000-0000-0000-000000000001', name: 'Fuji Apples (Organic)', category: 'Fruits & Vegetables', price: 140 },
  { id: 'a0000000-0000-0000-0000-000000000002', name: 'Fresh Milk (1 Gallon)', category: 'Dairy, Bread & Eggs', price: 65 },
  { id: 'a0000000-0000-0000-0000-000000000003', name: 'Organic Bananas (Bundle)', category: 'Fruits & Vegetables', price: 55 },
  { id: 'a0000000-0000-0000-0000-000000000004', name: 'Whole Wheat Sourdough', category: 'Dairy, Bread & Eggs', price: 50 },
  { id: 'a0000000-0000-0000-0000-000000000005', name: 'Honey Oat Cereal Box', category: 'Bakery & Breakfast', price: 120 },
  { id: 'a0000000-0000-0000-0000-000000000006', name: 'Pasture-Raised Eggs (Dozen)', category: 'Dairy, Bread & Eggs', price: 90 }
];

/**
 * Finds a matching substitute product within the same category.
 */
async function findSubstituteProduct(itemId, requestedCategory = null) {
  try {
    // 1. Try querying products table in Supabase if exists
    const { data: dbProducts } = await supabase
      .from('products')
      .select('*');

    const catalog = (dbProducts && dbProducts.length > 0) ? dbProducts : PRODUCT_CATALOG;

    // Find original product details
    const orig = catalog.find(p => p.id === itemId || p.item_id === itemId || p.name === itemId);
    const categoryToMatch = requestedCategory || orig?.category;

    if (categoryToMatch) {
      const sameCategory = catalog.filter(p => 
        (p.category || '').toLowerCase() === categoryToMatch.toLowerCase() &&
        p.id !== itemId && p.item_id !== itemId
      );
      if (sameCategory.length > 0) {
        return sameCategory[0];
      }
    }

    // Fallback: return any product that is not the original item
    const alternative = catalog.find(p => p.id !== itemId && p.item_id !== itemId);
    return alternative || catalog[0];

  } catch (err) {
    console.error('[SUBSTITUTION_SERVICE_ERROR]', err.message);
    const orig = PRODUCT_CATALOG.find(p => p.id === itemId);
    return PRODUCT_CATALOG.find(p => p.category === orig?.category && p.id !== itemId) || PRODUCT_CATALOG[1];
  }
}

/**
 * Resolves batch substitution preferences for an order.
 */
async function processBatchSubstitutionDecisions(orderId, decisions) {
  const results = [];
  for (const itemDecision of decisions) {
    const { itemId, action, substituteProductId } = itemDecision;
    
    let newStatus = 'SKIPPED';
    let subStatus = 'rejected';

    if (action === 'skip') {
      newStatus = 'SKIPPED';
      subStatus = 'rejected';
    } else if (action === 'accept_suggested' || action === 'self_select' || action === 'substitute') {
      newStatus = 'SUBSTITUTED';
      subStatus = 'accepted';
    } else if (action === 'picker_choice') {
      newStatus = 'picker_choice_pending';
      subStatus = 'pending';
    }

    // Update item_table
    const { data: updatedItem, error } = await supabase
      .from('item_table')
      .update({
        status: newStatus,
        replacement_item_id: substituteProductId || null
      })
      .eq('list', itemId)
      .select();

    // Update substitutions log table
    await supabase
      .from('substitutions')
      .update({
        status: subStatus,
        proposed_product_id: substituteProductId || null
      })
      .eq('order_item_id', itemId);

    results.push({ itemId, action, status: newStatus, error: error?.message });
  }

  // Recalculate order total amount after batch update
  const { data: remainingItems } = await supabase
    .from('item_table')
    .select('price, item_price, quantity, qty_requested, status')
    .eq('order_id', orderId);

  if (remainingItems) {
    const newTotal = remainingItems.reduce((sum, i) => {
      const st = String(i.status || '').toUpperCase();
      if (st === 'SKIPPED' || st === 'SKIPPED_TIMEOUT') return sum;
      const p = parseFloat(i.price || i.item_price) || 0;
      const q = parseInt(i.quantity || i.qty_requested, 10) || 1;
      return sum + (p * q);
    }, 0);

    await supabase
      .from('order_table')
      .update({ total_amount: Number(newTotal.toFixed(2)) })
      .eq('order_id', orderId);
  }

  return results;
}

module.exports = {
  findSubstituteProduct,
  processBatchSubstitutionDecisions,
  PRODUCT_CATALOG
};
