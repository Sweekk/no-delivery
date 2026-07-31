/**
 * api.js — Delivery partner API layer.
 * All functions are mock implementations backed by mockOrders.js.
 * Replace the internals with real fetch() calls when the backend is ready.
 */
import { mockOrders, deliveryHistory } from '../data/mockOrders';
import { READINESS } from '../utils/constants';

// Simulate a tiny network delay so loading states are exercised.
const delay = (ms = 250) => new Promise((res) => setTimeout(res, ms));

/**
 * Returns orders that are FINALIZED and assigned to this partner,
 * excluding cancelled ones (those surface via fetchCancelledAssignments).
 */
export async function fetchAssignedOrders() {
  await delay();
  return mockOrders.filter(
    (o) =>
      o.readiness === READINESS.FINALIZED &&
      o.isAssignedToMe &&
      !o.isCancelled
  );
}

/**
 * Returns orders that were assigned to this partner but subsequently cancelled.
 * Used to show the dismissible rose alert banner on the dashboard.
 */
export async function fetchCancelledAssignments() {
  await delay();
  return mockOrders.filter((o) => o.isAssignedToMe && o.isCancelled);
}

/**
 * Simulates accepting an unassigned order.
 * In prod this would POST to /api/orders/:id/accept.
 */
export async function acceptOrder(orderId) {
  await delay();
  return { success: true, orderId };
}

/**
 * Advances an order to the next status stage.
 * Returns the server timestamp that was stamped on the transition.
 */
export async function updateOrderStatus(orderId, newStatus) {
  await delay();
  return { orderId, newStatus, timestamp: new Date().toISOString() };
}

/**
 * Submits a delivery issue report.
 */
export async function reportDeliveryIssue(orderId, issueType, notes) {
  await delay();
  console.info('[api] Issue reported:', { orderId, issueType, notes });
  return { success: true };
}

/**
 * Returns the completed delivery history for the Earnings & Payouts tab.
 */
export async function fetchDeliveryHistory() {
  await delay();
  return deliveryHistory;
}