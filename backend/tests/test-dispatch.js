const assert = require('assert');
const finalizationService = require('../services/finalizationService');
const dispatchController = require('../controllers/dispatchController');
const supabase = require('../lib/supabaseClient');

// Mock response builder for Express res
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

async function runTests() {
  console.log('--- RUNNING DELIVERY PARTNER ASSIGNMENT TESTS ---\n');

  // Backup original supabase methods
  const origFrom = supabase.from;

  try {
    // -------------------------------------------------------------
    // TEST 1: Rejected assignment attempt on non-finalized order (Status: PENDING)
    // -------------------------------------------------------------
    console.log('Test 1: Assignment attempt on non-finalized order (Status: PENDING)');
    supabase.from = (table) => {
      if (table === 'orders') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: 'order-101', status: 'PENDING' },
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
              data: [
                { status: 'pending', resolution_status: 'PENDING' },
              ],
              error: null,
            }),
          }),
        };
      }
      return origFrom.call(supabase, table);
    };

    const req1 = { params: { orderId: 'order-101' }, body: {} };
    const res1 = createMockRes();

    await dispatchController.assignDeliveryPartner(req1, res1);

    assert.strictEqual(res1.statusCode, 400, 'Expected HTTP 400 status code');
    assert.strictEqual(
      res1.jsonBody.error,
      'Order not finalized, cannot assign delivery',
      'Expected clear error message'
    );
    console.log('  PASSED: Returned HTTP 400 with message:', res1.jsonBody.error);

    // -------------------------------------------------------------
    // TEST 2: Rejected assignment attempt on order with unresolved items
    // -------------------------------------------------------------
    console.log('\nTest 2: Assignment attempt on order with unresolved items');
    supabase.from = (table) => {
      if (table === 'orders') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: 'order-102', status: 'FINALIZED' },
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
              data: [
                { status: 'substitute_requested', resolution_status: 'PENDING' },
              ],
              error: null,
            }),
          }),
        };
      }
      return origFrom.call(supabase, table);
    };

    const req2 = { params: { orderId: 'order-102' }, body: {} };
    const res2 = createMockRes();

    await dispatchController.assignDeliveryPartner(req2, res2);

    assert.strictEqual(res2.statusCode, 400, 'Expected HTTP 400 status code');
    assert.strictEqual(
      res2.jsonBody.error,
      'Order not finalized, cannot assign delivery',
      'Expected clear error message'
    );
    console.log('  PASSED: Returned HTTP 400 for unresolved substitution item');

    // -------------------------------------------------------------
    // TEST 3: No available delivery partners (HTTP 503)
    // -------------------------------------------------------------
    console.log('\nTest 3: Finalized order when NO delivery partners are AVAILABLE');
    supabase.from = (table) => {
      if (table === 'orders') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: 'order-200', status: 'FINALIZED' },
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
              data: [
                { status: 'picked', resolution_status: 'CONFIRMED' },
              ],
              error: null,
            }),
          }),
        };
      }
      if (table === 'delivery_partners') {
        return {
          select: () => ({
            eq: () => ({
              limit: async () => ({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      }
      return origFrom.call(supabase, table);
    };

    const req3 = { params: { orderId: 'order-200' }, body: {} };
    const res3 = createMockRes();

    await dispatchController.assignDeliveryPartner(req3, res3);

    assert.strictEqual(res3.statusCode, 503, 'Expected HTTP 503 status code when no drivers available');
    assert.strictEqual(
      res3.jsonBody.error,
      'No delivery partners available',
      'Expected no drivers error message'
    );
    console.log('  PASSED: Returned HTTP 503 with error:', res3.jsonBody.error);

    // -------------------------------------------------------------
    // TEST 4: Successful assignment attempt on finalized order with available partner
    // -------------------------------------------------------------
    console.log('\nTest 4: Successful assignment attempt on finalized order');
    let orderUpdated = false;
    let partnerUpdated = false;

    supabase.from = (table) => {
      if (table === 'orders') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: 'order-300', status: 'FINALIZED' },
                error: null,
              }),
            }),
          }),
          update: (fields) => {
            assert.strictEqual(fields.assigned_partner_id, 'partner-uuid-77');
            assert.strictEqual(fields.status, 'ASSIGNED');
            assert.ok(fields.assigned_at, 'assigned_at timestamp should be set');
            orderUpdated = true;
            return {
              eq: async () => ({ data: null, error: null }),
            };
          },
        };
      }
      if (table === 'order_items') {
        return {
          select: () => ({
            eq: async () => ({
              data: [
                { status: 'picked', resolution_status: 'CONFIRMED' },
                { status: 'resolved', resolution_status: 'SUBSTITUTED' },
              ],
              error: null,
            }),
          }),
        };
      }
      if (table === 'delivery_partners') {
        return {
          select: () => ({
            eq: (col, val) => ({
              limit: async () => ({
                data: [{ id: 'partner-uuid-77', name: 'Ramesh Kumar', status: 'AVAILABLE' }],
                error: null,
              }),
            }),
          }),
          update: (fields) => {
            assert.strictEqual(fields.status, 'BUSY');
            partnerUpdated = true;
            return {
              eq: async () => ({ data: null, error: null }),
            };
          },
        };
      }
      return origFrom.call(supabase, table);
    };

    const req4 = { params: { orderId: 'order-300' }, body: {} };
    const res4 = createMockRes();

    await dispatchController.assignDeliveryPartner(req4, res4);

    assert.strictEqual(res4.statusCode, 200, 'Expected HTTP 200 status code');
    assert.strictEqual(
      res4.jsonBody.message,
      'Delivery partner assigned successfully',
      'Expected success message'
    );
    assert.strictEqual(res4.jsonBody.assignedPartner.id, 'partner-uuid-77');
    assert.strictEqual(res4.jsonBody.assignedPartner.status, 'BUSY');
    assert.ok(orderUpdated, 'Order should be updated in database');
    assert.ok(partnerUpdated, 'Delivery partner status should be updated to BUSY');
    console.log('  PASSED: Returned HTTP 200 with response:', res4.jsonBody);

    console.log('\n--- ALL TESTS PASSED SUCCESSFULLY ---');
  } finally {
    // Restore original supabase methods
    supabase.from = origFrom;
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
