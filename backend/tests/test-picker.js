const http = require('http');

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING PICKER API VERIFICATION ===\n');

  try {
    // 1. Test GET /api/picker/orders/pending
    console.log('1. Testing GET /api/picker/orders/pending...');
    const pendingRes = await makeRequest('GET', '/api/picker/orders/pending');
    console.log('   Status:', pendingRes.status);
    console.log('   Response:', pendingRes.body);
    if (pendingRes.status !== 200 || !pendingRes.body.success) {
      throw new Error('Failed GET /api/picker/orders/pending');
    }

    const testOrderId = pendingRes.body.orders[0]?.order_id || 'ord-101';

    // 2. Test POST /api/picker/order/:order_id/claim
    console.log(`\n2. Testing POST /api/picker/order/${testOrderId}/claim...`);
    const claimRes = await makeRequest('POST', `/api/picker/order/${testOrderId}/claim`, { picker_id: 'picker-999' });
    console.log('   Status:', claimRes.status);
    console.log('   Response:', claimRes.body);
    if (claimRes.status !== 200 || !claimRes.body.success) {
      throw new Error('Failed POST claim order');
    }

    // 3. Test GET /order/:order_id
    console.log(`\n3. Testing GET /order/${testOrderId}...`);
    const orderRes = await makeRequest('GET', `/order/${testOrderId}`);
    console.log('   Status:', orderRes.status);
    console.log('   Items count:', orderRes.body.items?.length);
    if (orderRes.status !== 200 || !orderRes.body.items || orderRes.body.items.length === 0) {
      throw new Error('Failed GET order details');
    }

    const items = orderRes.body.items;
    const item1 = items[0];
    const item2 = items[1] || items[0];

    // 4. Test Completion Gate Failure (HTTP 400 when items are pending)
    console.log(`\n4. Testing POST /order/${testOrderId}/complete with pending items (Expecting 400 Bad Request)...`);
    const failCompleteRes = await makeRequest('POST', `/order/${testOrderId}/complete`);
    console.log('   Status:', failCompleteRes.status, '(Expected 400)');
    console.log('   Error Message:', failCompleteRes.body.error);
    if (failCompleteRes.status !== 400) {
      throw new Error('Completion gate failed to block incomplete order!');
    }

    // 5. Test PATCH /item/:list_id (found, not_found, replaced)
    console.log(`\n5. Testing PATCH /item/${item1.list_id} (status: found)...`);
    const patch1 = await makeRequest('PATCH', `/item/${item1.list_id}`, { status: 'found' });
    console.log('   Status:', patch1.status, patch1.body);

    console.log(`\n6. Testing PATCH /item/${item2.list_id} (status: replaced with replacement_item_id)...`);
    const patch2 = await makeRequest('PATCH', `/item/${item2.list_id}`, { status: 'replaced', replacement_item_id: 'ALT-ITEM-789' });
    console.log('   Status:', patch2.status, patch2.body);

    // Update all remaining items to resolved
    for (const item of items) {
      await makeRequest('PATCH', `/item/${item.list_id}`, { status: 'found' });
    }

    // 6. Test Completion Success (HTTP 200 when all items resolved)
    console.log(`\n7. Testing POST /order/${testOrderId}/complete when ALL items resolved (Expecting 200 OK)...`);
    const successCompleteRes = await makeRequest('POST', `/order/${testOrderId}/complete`);
    console.log('   Status:', successCompleteRes.status, '(Expected 200)');
    console.log('   Success Body:', successCompleteRes.body);
    if (successCompleteRes.status !== 200 || !successCompleteRes.body.success) {
      throw new Error('Failed order completion when all items were resolved!');
    }

    console.log('\n✅ ALL PICKER API TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  }
}

runTests();
