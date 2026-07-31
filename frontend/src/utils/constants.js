/**
 * constants.js — Shared enum-like constants for the delivery partner app.
 *
 * READINESS: reflects the store-side state of an order before it is handed off.
 * STATUS:    reflects the delivery partner's progression through an order.
 * ISSUE_TYPES: selectable issue categories in the ReportIssueModal.
 */

export const READINESS = {
  PICKING: 'Picking',
  AWAITING_SUBSTITUTION: 'Awaiting Substitution',
  FINALIZED: 'Finalized',
  CANCELLED: 'Cancelled',
};

export const STATUS = {
  READY_FOR_PICKUP: 'Ready for Pickup',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
};

export const ISSUE_TYPES = [
  'Customer not reachable',
  'Wrong address',
  'Customer refused delivery',
  'Item damaged',
  'Cannot find location',
  'Traffic / delay',
  'Other',
];
