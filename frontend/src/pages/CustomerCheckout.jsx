import React from 'react';
import CartUI from '../components/customer/CartUI';
import ReviewSubstitutesModal from '../components/customer/ReviewSubstitutesModal';

export default function CustomerCheckout() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Checkout Page</h1>
      <CartUI />
      <ReviewSubstitutesModal />
    </div>
  );
}
