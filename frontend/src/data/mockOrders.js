import { READINESS, STATUS } from '../utils/constants';

const now = Date.now();
const minsAgo = (m) => new Date(now - m * 60 * 1000).toISOString();

export const mockOrders = [
  {
    id: 'ORD-9821',
    readiness: READINESS.FINALIZED,
    status: STATUS.READY_FOR_PICKUP,
    isAssignedToMe: true,
    isCancelled: false,
    pickupStore: 'Kadri Dark Store #4',
    itemCount: 5,
    customerName: 'Aarav Sharma',
    phone: '+91 98450 11223',
    address: 'Flat 402, Ocean Breeze Apartments, Light House Hill Road',
    gps: '12.8721° N, 74.8426° E',
    payout: 450,
    targetMins: 12,
    timestamps: { assignedAt: minsAgo(4), pickedUpAt: null, outForDeliveryAt: null, deliveredAt: null },
  },
  {
    id: 'ORD-9825',
    readiness: READINESS.FINALIZED,
    status: STATUS.OUT_FOR_DELIVERY,
    isAssignedToMe: true,
    isCancelled: false,
    pickupStore: 'Bejai Dark Store #2',
    itemCount: 3,
    customerName: 'Sneha Rao',
    phone: '+91 98450 33445',
    address: 'Door No. 3-14, Near St. Aloysius Chapel, Bejai',
    gps: '12.8850° N, 74.8480° E',
    payout: 280,
    targetMins: 25,
    timestamps: { assignedAt: minsAgo(30), pickedUpAt: minsAgo(22), outForDeliveryAt: minsAgo(18), deliveredAt: null },
  },
  // Still being picked at the store — must NOT appear on the dashboard.
  // Proves DEL-ISSUE-01 / 02 / 03 / 04.
  {
    id: 'ORD-9830',
    readiness: READINESS.PICKING,
    status: STATUS.READY_FOR_PICKUP,
    isAssignedToMe: false,
    isCancelled: false,
    pickupStore: 'Kadri Dark Store #4',
    itemCount: 8,
    customerName: 'Vikram Shetty',
    phone: '+91 98450 55667',
    address: 'Near KSRTC Bus Stand, Kadri',
    gps: '12.8700° N, 74.8500° E',
    payout: 300,
    targetMins: 15,
    timestamps: { assignedAt: null, pickedUpAt: null, outForDeliveryAt: null, deliveredAt: null },
  },
  // Waiting on a customer's substitution response — must NOT appear either.
  {
    id: 'ORD-9832',
    readiness: READINESS.AWAITING_SUBSTITUTION,
    status: STATUS.READY_FOR_PICKUP,
    isAssignedToMe: false,
    isCancelled: false,
    pickupStore: 'Bejai Dark Store #2',
    itemCount: 4,
    customerName: 'Divya Kamath',
    phone: '+91 98450 77889',
    address: 'Balmatta Road, Mangaluru',
    gps: '12.8730° N, 74.8420° E',
    payout: 320,
    targetMins: 18,
    timestamps: { assignedAt: null, pickedUpAt: null, outForDeliveryAt: null, deliveredAt: null },
  },
  // Finalized and ready — but already locked by another partner. Proves DEL-ISSUE-05.
  {
    id: 'ORD-9835',
    readiness: READINESS.FINALIZED,
    status: STATUS.READY_FOR_PICKUP,
    isAssignedToMe: false,
    lockedByAnother: true,
    isCancelled: false,
    pickupStore: 'Kadri Dark Store #4',
    itemCount: 2,
    customerName: 'Rohit Pai',
    phone: '+91 98450 99001',
    address: 'Attavar, Mangaluru',
    gps: '12.8690° N, 74.8440° E',
    payout: 260,
    targetMins: 10,
    timestamps: { assignedAt: minsAgo(2), pickedUpAt: null, outForDeliveryAt: null, deliveredAt: null },
  },
  // Cancelled AFTER assignment — proves DEL-ISSUE-08.
  {
    id: 'ORD-9840',
    readiness: READINESS.CANCELLED,
    status: STATUS.OUT_FOR_DELIVERY,
    isAssignedToMe: true,
    isCancelled: true,
    pickupStore: 'Kadri Dark Store #4',
    itemCount: 1,
    customerName: 'Priya Kulkarni',
    phone: '+91 98450 22110',
    address: 'Mannagudda, Mangaluru',
    gps: '12.8715° N, 74.8460° E',
    payout: 200,
    targetMins: 20,
    timestamps: { assignedAt: minsAgo(35), pickedUpAt: minsAgo(28), outForDeliveryAt: minsAgo(20), deliveredAt: null },
  },
];

// Completed deliveries for the Earnings & Payouts tab — proves DEL-ISSUE-10.
export const deliveryHistory = [
  {
    id: 'ORD-9790', customerName: 'Tom Walker', payout: 240,
    timestamps: { assignedAt: minsAgo(300), pickedUpAt: minsAgo(288), outForDeliveryAt: minsAgo(280), deliveredAt: minsAgo(258) },
  },
  {
    id: 'ORD-9795', customerName: 'Neha Verma', payout: 310,
    timestamps: { assignedAt: minsAgo(220), pickedUpAt: minsAgo(206), outForDeliveryAt: minsAgo(198), deliveredAt: minsAgo(172) },
  },
];
