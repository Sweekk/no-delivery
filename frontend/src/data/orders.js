import { PRODUCTS } from './products.js';

export const INITIAL_ORDERS = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-9821',
    customerName: 'Alex Morgan',
    customerPhone: '+91 98765-12345',
    deliveryAddress: 'Flat 402, Green Park Residency, Sector 5',
    storeName: 'QuickFix Green Park Store #402',
    items: [
      {
        id: 'oi-1',
        product: PRODUCTS[11], // Fresh Whole Milk
        quantity: 1,
        pickingStatus: 'available',
      },
      {
        id: 'oi-2',
        product: PRODUCTS[5], // Farm Fresh Red Tomatoes
        quantity: 1,
        pickingStatus: 'not_available',
      },
      {
        id: 'oi-3',
        product: PRODUCTS[16], // Whole Wheat Bread
        quantity: 1,
        pickingStatus: 'pending',
      },
    ],
    subtotal: 430,
    deliveryFee: 30,
    totalAmount: 460,
    stage: 'Picking Items',
    createdAt: '2026-07-29T10:00:00Z',
    updatedAt: '2026-07-29T10:05:00Z',
    cancellationAllowed: true,
  },
];
