const supabase = require('../lib/supabaseClient');

async function inspectColumns() {
  console.log('--- INSPECTING COLUMNS ---');
  
  const { data: itemSample } = await supabase.from('item_table').select('*').limit(1);
  if (itemSample && itemSample.length > 0) {
    console.log('item_table columns:', Object.keys(itemSample[0]));
    console.log('item_table sample row:', itemSample[0]);
  } else {
    console.log('item_table is empty');
  }

  const { data: orderSample } = await supabase.from('order_table').select('*').limit(1);
  if (orderSample && orderSample.length > 0) {
    console.log('order_table columns:', Object.keys(orderSample[0]));
    console.log('order_table sample row:', orderSample[0]);
  } else {
    console.log('order_table is empty');
  }

  const { data: subSample } = await supabase.from('substitutions').select('*').limit(1);
  if (subSample && subSample.length > 0) {
    console.log('substitutions columns:', Object.keys(subSample[0]));
    console.log('substitutions sample row:', subSample[0]);
  }
}

inspectColumns().then(() => process.exit(0));
