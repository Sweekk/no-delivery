const supabase = require('../lib/supabaseClient');

async function checkAndBackfillCategories() {
  console.log('--- CHECKING & BACKFILLING PRODUCT CATEGORIES ---');

  // Step 1: Query products with missing categories
  const { data: uncategorized, error: queryErr } = await supabase
    .from('products')
    .select('id, name, category')
    .or('category.is.null,category.eq.');

  if (queryErr) {
    console.error('Error querying products table:', queryErr.message);
    // Table might not exist or might use a different name/schema. Let's check fallback.
    return;
  }

  console.log(`Found ${uncategorized ? uncategorized.length : 0} products with missing categories.`);

  if (uncategorized && uncategorized.length > 0) {
    for (const prod of uncategorized) {
      // Smart infer category based on name keywords if possible
      let cat = 'General Groceries';
      const name = (prod.name || '').toLowerCase();
      if (name.includes('milk') || name.includes('amul') || name.includes('dairy') || name.includes('egg') || name.includes('cheese')) {
        cat = 'Dairy & Eggs';
      } else if (name.includes('apple') || name.includes('banana') || name.includes('tomato') || name.includes('fruit') || name.includes('veggie')) {
        cat = 'Fresh Produce';
      } else if (name.includes('bread') || name.includes('sourdough') || name.includes('cereal') || name.includes('bakery')) {
        cat = 'Bakery & Breakfast';
      } else if (name.includes('oil') || name.includes('flour') || name.includes('rice') || name.includes('atta') || name.includes('salt')) {
        cat = 'Staples & Oils';
      } else if (name.includes('dorito') || name.includes('chip') || name.includes('snack') || name.includes('biscuit')) {
        cat = 'Snacks & Beverages';
      }

      console.log(`Backfilling product '${prod.name || prod.id}' with category '${cat}'...`);
      await supabase
        .from('products')
        .update({ category: cat })
        .eq('id', prod.id);
    }
  }

  // Step 2: Re-query to confirm empty
  const { data: remaining, error: recheckErr } = await supabase
    .from('products')
    .select('id, name, category')
    .or('category.is.null,category.eq.');

  if (!recheckErr) {
    const remainingCount = remaining ? remaining.length : 0;
    console.log(`Re-check complete. Uncategorized count = ${remainingCount}`);
    if (remainingCount === 0) {
      console.log('✅ CONFIRMED: Query "SELECT id, name, category FROM products WHERE category IS NULL OR category = \x27\x27;" returns EMPTY.');
    }
  }
}

checkAndBackfillCategories().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
