const finalizationService = require('./finalizationService');

/**
 * Custom error thrown when an order is not finalized or has unresolved substitution items.
 */
class OrderNotFinalizedError extends Error {
  constructor(message = 'Order is not finalized or has unresolved items') {
    super(message);
    this.name = 'OrderNotFinalizedError';
    this.code = 'ORDER_NOT_FINALIZED';
  }
}

/**
 * Application-level guard function that asserts an order is finalized.
 * Placed immediately before any database write for delivery assignment.
 * Throws OrderNotFinalizedError if the order is not ready for assignment.
 * 
 * @param {string} orderId 
 * @throws {OrderNotFinalizedError}
 */
const assertOrderIsFinalized = async (orderId) => {
  if (!orderId) {
    throw new OrderNotFinalizedError('Order ID is required for finalization assertion');
  }

  const finalized = await finalizationService.isOrderFinalized(orderId);
  if (!finalized) {
    throw new OrderNotFinalizedError(
      `Delivery assignment guard blocked: Order ${orderId} is not finalized or has pending items`
    );
  }
};

module.exports = {
  assertOrderIsFinalized,
  OrderNotFinalizedError,
};
