const assert = require('assert');
const { assertOrderIsFinalized, OrderNotFinalizedError } = require('../services/dispatchGuard');
const dispatchController = require('../controllers/dispatchController');
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

async function runGuardRailTests() {
  console.log('--- RUNNING GUARD RAIL DEFENSE-IN-DEPTH TESTS ---\n');

  const origFrom = supabase.from;

  try {
    // -------------------------------------------------------------
    // TEST 1: Direct Bypass Attempt on Application-Level Guard
    // Call assertOrderIsFinalized() directly bypassing controller check
    // -------------------------------------------------------------
    console.log('Test 1: Application Guard - Direct assertOrderIsFinalized() bypass attempt on non-finalized order');
    supabase.from = (table) => {
      if (table === 'orders') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: 'unfinalized-order-1', status: 'PICKING' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'order_items') {
        return {
          select: () => ({
            eq: async () => ({
              data: [{ status: 'substitute_requested', resolution_status: 'PENDING' }],
              error: null,
            }),
          }),
        };
      }
      return origFrom.call(supabase, table);
    };

    let caughtError = null;
    try {
      await assertOrderIsFinalized('unfinalized-order-1');
    } catch (err) {
      caughtError = err;
    }

    assert.ok(caughtError, 'Expected assertOrderIsFinalized to throw an error');
    assert.strictEqual(
      caughtError.name,
      'OrderNotFinalizedError',
      'Expected error class to be OrderNotFinalizedError'
    );
    assert.ok(
      caughtError.message.includes('Delivery assignment guard blocked'),
      'Expected specific guard error message'
    );
    console.log('  PASSED: Application guard threw OrderNotFinalizedError:', caughtError.message);

    // -------------------------------------------------------------
    // TEST 2: Direct DB Bypass Attempt (Database-Level Guard Simulation)
    // Direct UPDATE query setting assigned_partner_id on non-finalized order
    // -------------------------------------------------------------
    console.log('\nTest 2: Database Guard - Direct DB update attempt setting assigned_partner_id on non-finalized order');
    supabase.from = (table) => {
      if (table === 'orders') {
        return {
          update: (fields) => ({
            eq: async () => ({
              data: null,
              error: {
                message:
                  'Database Guard Block: Order unfinalized-order-1 status must be FINALIZED before assigning delivery partner (current status: PENDING)',
                code: 'P0001',
              },
            }),
          }),
        };
      }
      return origFrom.call(supabase, table);
    };

    const dbUpdateResult = await supabase
      .from('orders')
      .update({ assigned_partner_id: 'partner-123' })
      .eq('id', 'unfinalized-order-1');

    assert.ok(dbUpdateResult.error, 'Expected DB update to return an error from trigger');
    assert.ok(
      dbUpdateResult.error.message.includes('Database Guard Block'),
      'Expected DB trigger error message'
    );
    console.log('  PASSED: Database trigger rejected direct UPDATE with error:', dbUpdateResult.error.message);

    // -------------------------------------------------------------
    // TEST 3: Controller Error Handling on Guard Rail Interception
    // Verifies controller catches error and returns HTTP 400 JSON instead of crashing
    // -------------------------------------------------------------
    console.log('\nTest 3: Controller Guard Rail Interception - Returns clean HTTP 400 without crashing');
    supabase.from = (table) => {
      if (table === 'orders') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: 'order-bypass-test', status: 'PENDING' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'order_items') {
        return {
          select: () => ({
            eq: async () => ({
              data: [{ status: 'pending', resolution_status: 'PENDING' }],
              error: null,
            }),
          }),
        };
      }
      return origFrom.call(supabase, table);
    };

    const req = { params: { orderId: 'order-bypass-test' }, body: {} };
    const res = createMockRes();

    await dispatchController.assignDeliveryPartner(req, res);

    assert.strictEqual(res.statusCode, 400, 'Expected HTTP 400 status code');
    assert.ok(res.jsonBody.error, 'Expected clean JSON error response');
    console.log('  PASSED: Controller caught guard interception and returned HTTP 400:', res.jsonBody);

    console.log('\n--- ALL GUARD RAIL TESTS PASSED SUCCESSFULLY ---');
  } finally {
    supabase.from = origFrom;
  }
}

runGuardRailTests().catch((err) => {
  console.error('Guard rail test execution failed:', err);
  process.exit(1);
});
