const deliveryController = require('../controllers/deliveryController');

async function testDeliveryOrdersAPI() {
  console.log('--- TESTING DELIVERY ORDERS SUBCONTROLLER API ---');

  const req = {};
  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      console.log(`Response Code: ${this.statusCode || 200}`);
      console.log(`Orders fetched: ${body.length}`);
      if (body.length > 0) {
        console.log('Sample Delivery Order Object:', {
          id: body[0].id,
          subtotal: body[0].subtotal,
          totalAmount: body[0].totalAmount,
          itemCount: body[0].items ? body[0].items.length : 0
        });
      }
    }
  };

  await deliveryController.getAssignedOrders(req, res);
}

testDeliveryOrdersAPI().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
