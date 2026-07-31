const assert = require('assert');
const adminController = require('../controllers/adminController');
const supabase = require('../lib/supabaseClient');

function createMockRes() {
  const res = {};
  res.statusCode = null;
  res.jsonBody = null;
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (body) {
    res.jsonBody = body;
    return res;
  };
  return res;
}

async function runAdminMetricsTests() {
  console.log('--- RUNNING ADMIN METRICS SUBSTITUTION RATE TESTS ---\n');

  const origFrom = supabase.from;

  try {
    // -------------------------------------------------------------
    // TEST 1: SQL View Query Execution Test
    // -------------------------------------------------------------
    console.log('Test 1: Querying SQL View store_substitution_rates');
    supabase.from = (table) => {
      if (table === 'store_substitution_rates') {
        return {
          select: async () => ({
            data: [
              {
                store_id: 'store-101',
                store_name: 'FreshMart Koramangala',
                total_orders: 42,
                orders_with_substitution: 9,
                substitution_rate: 21.428,
              },
              {
                store_id: 'store-102',
                store_name: 'EmptyStore Indiranagar',
                total_orders: 0,
                orders_with_substitution: 0,
                substitution_rate: 0,
              },
            ],
            error: null,
          }),
        };
      }
      return origFrom.call(supabase, table);
    };

    const req1 = {};
    const res1 = createMockRes();

    await adminController.getSubstitutionRateByStore(req1, res1);

    assert.strictEqual(res1.statusCode, 200, 'Expected HTTP 200');
    assert.ok(Array.isArray(res1.jsonBody), 'Expected array response');
    assert.strictEqual(res1.jsonBody.length, 2, 'Expected 2 store records');

    const store1 = res1.jsonBody.find((s) => s.store_id === 'store-101');
    assert.strictEqual(store1.total_orders, 42);
    assert.strictEqual(store1.orders_with_substitution, 9);
    assert.strictEqual(store1.substitution_rate, 21.4, 'Rate should be rounded to 1 decimal place');

    const store2 = res1.jsonBody.find((s) => s.store_id === 'store-102');
    assert.strictEqual(store2.total_orders, 0);
    assert.strictEqual(store2.orders_with_substitution, 0);
    assert.strictEqual(store2.substitution_rate, 0, 'Zero orders store should return 0, not NaN or null');

    console.log('  PASSED: View metrics formatted correctly:', res1.jsonBody);

    // -------------------------------------------------------------
    // TEST 2: Fallback In-Memory Aggregation Test (when DB view is unavailable)
    // -------------------------------------------------------------
    console.log('\nTest 2: Fallback In-Memory Aggregation Calculation');
    supabase.from = (table) => {
      if (table === 'store_substitution_rates') {
        return {
          select: async () => ({
            data: null,
            error: { message: 'relation store_substitution_rates does not exist' },
          }),
        };
      }
      if (table === 'stores') {
        return {
          select: async () => ({
            data: [
              { id: 'store-A', name: 'Store Alpha' },
              { id: 'store-B', name: 'Store Zero' },
            ],
            error: null,
          }),
        };
      }
      if (table === 'orders') {
        return {
          select: async () => ({
            data: [
              { id: 'ord-1', store_id: 'store-A' },
              { id: 'ord-2', store_id: 'store-A' },
              { id: 'ord-3', store_id: 'store-A' },
            ],
            error: null,
          }),
        };
      }
      if (table === 'order_items') {
        return {
          select: async () => ({
            data: [
              { order_id: 'ord-1', resolution_status: 'CONFIRMED' },
              { order_id: 'ord-2', resolution_status: 'SUBSTITUTED' },
              { order_id: 'ord-3', resolution_status: 'SKIPPED' },
            ],
            error: null,
          }),
        };
      }
      return origFrom.call(supabase, table);
    };

    const req2 = {};
    const res2 = createMockRes();

    await adminController.getSubstitutionRateByStore(req2, res2);

    assert.strictEqual(res2.statusCode, 200);
    assert.strictEqual(res2.jsonBody.length, 2);

    const storeA = res2.jsonBody.find((s) => s.store_id === 'store-A');
    assert.strictEqual(storeA.total_orders, 3);
    assert.strictEqual(storeA.orders_with_substitution, 2); // ord-2 (SUBSTITUTED) and ord-3 (SKIPPED)
    assert.strictEqual(storeA.substitution_rate, 66.7, 'Expected (2/3)*100 rounded to 1 decimal place = 66.7');

    const storeB = res2.jsonBody.find((s) => s.store_id === 'store-B');
    assert.strictEqual(storeB.total_orders, 0);
    assert.strictEqual(storeB.orders_with_substitution, 0);
    assert.strictEqual(storeB.substitution_rate, 0);

    console.log('  PASSED: Fallback aggregation calculation correctly returned:', res2.jsonBody);

    // -------------------------------------------------------------
    // TEST 3: Fulfillment Time Metrics Test
    // -------------------------------------------------------------
    console.log('\nTest 3: getAverageFulfillmentTime Metrics');
    const now = Date.now();
    const tenMinAgo = new Date(now - 10 * 60 * 1000).toISOString();
    const twentyMinAgo = new Date(now - 20 * 60 * 1000).toISOString();
    const thirtyMinAgo = new Date(now - 30 * 60 * 1000).toISOString();

    supabase.from = (table) => {
      if (table === 'store_fulfillment_times') {
        return {
          select: async () => ({
            data: [
              {
                store_id: 'store-1',
                store_name: 'Store 1',
                order_count: 2,
                average_minutes: 15.0,
              },
            ],
            error: null,
          }),
        };
      }
      if (table === 'orders') {
        return {
          select: () => ({
            not: async () => ({
              data: [
                { id: 'o1', store_id: 'store-1', placed_at: twentyMinAgo, finalized_at: tenMinAgo }, // 10 min
                { id: 'o2', store_id: 'store-1', placed_at: thirtyMinAgo, finalized_at: tenMinAgo }, // 20 min
              ],
              error: null,
            }),
          }),
        };
      }
      return origFrom.call(supabase, table);
    };

    const req3 = {};
    const res3 = createMockRes();

    await adminController.getAverageFulfillmentTime(req3, res3);

    assert.strictEqual(res3.statusCode, 200);
    assert.strictEqual(res3.jsonBody.overall_average_minutes, 15.0);
    assert.strictEqual(res3.jsonBody.per_store.length, 1);
    assert.strictEqual(res3.jsonBody.per_store[0].store_id, 'store-1');
    assert.strictEqual(res3.jsonBody.per_store[0].average_minutes, 15.0);
    assert.strictEqual(res3.jsonBody.per_store[0].order_count, 2);

    console.log('  PASSED: getAverageFulfillmentTime returned expected payload:', res3.jsonBody);

    console.log('\n--- ALL ADMIN METRICS TESTS PASSED SUCCESSFULLY ---');
  } finally {
    supabase.from = origFrom;
  }
}

runAdminMetricsTests().catch((err) => {
  console.error('Admin metrics test execution failed:', err);
  process.exit(1);
});
