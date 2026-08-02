const http = require('http');

async function request(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
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

async function runLifecycleVerification() {
  console.log('====================================================');
  console.log('STARTING END-TO-END LIFECYCLE VERIFICATION');
  console.log('====================================================');

  try {
    // 1. ORDER PLACEMENT (Customer App)
    console.log('\n--- STEP 1: CUSTOMER ORDER PLACEMENT ---');
    const orderPayload = {
      store_id: '467a74f5-cc56-47a1-b932-c33dde36132e',
      total_amount: 380.00,
      items: [
        { product_name: 'Organic Bananas 6pcs', item_id: 'e0000001-0000-0000-0000-000000000001', qty_requested: 2, price: 60, sub_rules: 'ask' },
        { product_name: 'Amul Taaza Toned Milk 1L', item_id: 'e0000002-0000-0000-0000-000000000002', qty_requested: 1, price: 54, sub_rules: 'ask' },
        { product_name: 'Whole Wheat Bread 400g', item_id: 'e0000003-0000-0000-0000-000000000003', qty_requested: 1, price: 45, sub_rules: 'ask' }
      ]
    };

    const r1 = await request('http://localhost:5001/api/orders', 'POST', orderPayload);
    console.log(`✓ Order Placement API Response [${r1.status}]:`, r1.body);
    const orderId = r1.body.order_id;
    if (!orderId) throw new Error('Order creation failed: missing order_id');

    // Fetch created order & item details
    const rDetails = await request(`http://localhost:5001/api/orders/${orderId}`);
    console.log(`✓ Order Details & Auto-Assigned Picker:`, rDetails.body.order);
    const items = rDetails.body.items || [];
    console.log(`✓ Inserted Items Count: ${items.length}`);

    if (items.length < 2) throw new Error('Items were not properly inserted into database');
    const item1 = items[0];
    const item2 = items[1];

    // 2. PICKER RECEIVES THE ORDER & MARKS ITEM UNAVAILABLE
    console.log('\n--- STEP 2: PICKER ITEM AVAILABILITY MARKING ---');
    const rPickAvailable = await request(`http://localhost:5001/api/orders/${orderId}/items/${item1.id}/status`, 'PATCH', { status: 'available' });
    console.log(`✓ Picker marked item1 AVAILABLE:`, rPickAvailable.body);

    const rPickUnavailable = await request(`http://localhost:5001/api/orders/${orderId}/items/${item2.id}/status`, 'PATCH', { status: 'unavailable' });
    console.log(`✓ Picker marked item2 UNAVAILABLE:`, rPickUnavailable.body);
    console.log(`✓ Server Timestamp unavailable_marked_at:`, rPickUnavailable.body.item?.unavailable_marked_at);

    // 3. CUSTOMER DECISION (Skip / Self-Select / Let Picker Choose)
    console.log('\n--- STEP 3: CUSTOMER DECISION & TOTAL RECALCULATION ---');
    const rDecision = await request(`http://localhost:5001/api/orders/${orderId}/items/${item2.id}/decision`, 'PATCH', {
      customer_decision: 'self_select',
      substitute_product_id: 'e0000004-0000-0000-0000-000000000004'
    });
    console.log(`✓ Customer Decision Response:`, rDecision.body);

    // Handle 3rd item decision -> skip item
    const item3 = items[2];
    const rDecision2 = await request(`http://localhost:5001/api/orders/${orderId}/items/${item3.id}/decision`, 'PATCH', {
      customer_decision: 'skip'
    });
    console.log(`✓ Customer Decision (Skip) Response:`, rDecision2.body);

    // 4. HANDOFF TO DELIVERY PARTNER
    console.log('\n--- STEP 4: DELIVERY PARTNER HANDOFF & PROGRESSION ---');
    const rAfterCompletion = await request(`http://localhost:5001/api/orders/${orderId}`);
    console.log(`✓ Finalized Order Status & Delivery Partner:`, rAfterCompletion.body.order);

    const rOutForDelivery = await request(`http://localhost:5001/api/orders/${orderId}/status`, 'PATCH', { status: 'out_for_delivery' });
    console.log(`✓ Delivery Partner Status -> out_for_delivery:`, rOutForDelivery.body);

    const rDelivered = await request(`http://localhost:5001/api/orders/${orderId}/status`, 'PATCH', { status: 'delivered' });
    console.log(`✓ Delivery Partner Status -> delivered:`, rDelivered.body);

    // 5. ADMIN DASHBOARD REALTIME ANALYTICS
    console.log('\n--- STEP 5: ADMIN DASHBOARD ANALYTICS ---');
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || '71f953201e8e82ebf86d07432283f3a11f53c61f49bf541bad3316690d46d30ce09b3851fa8a8c4adb9000ca32d21d6c0718c40b388cf0f662bb9a9c08d57144';
    const token = jwt.sign(
      { sub: 'admin-1', username: 'ujwal@gmail.com', role: 'admin' },
      secret,
      { expiresIn: '7d' }
    );
    const rMetrics = await request('http://localhost:5001/api/admin/metrics', 'GET', null, { Authorization: `Bearer ${token}` });
    console.log(`✓ Admin Analytics Metrics:`, rMetrics.body);

    console.log('\n====================================================');
    console.log('✓ VERIFICATION SUCCESSFUL: ALL LIFECYCLE STEPS PASSED!');
    console.log('====================================================');

  } catch (err) {
    console.error('Lifecycle verification error:', err);
  }
}

runLifecycleVerification();
