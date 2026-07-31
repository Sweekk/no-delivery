import React from 'react';
import Navbar from '../components/common/Navbar';
import CartUI from '../components/customer/CartUI';
import ReviewSubstitutesModal from '../components/customer/ReviewSubstitutesModal';

export default function CustomerCheckout({ onNavigate }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar currentRoute="checkout" onNavigate={onNavigate} />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-black text-gray-900">QuickFix Grocery Checkout</h1>
          <p className="text-xs text-gray-500">Review your cart and confirm your delivery details</p>
        </div>
        <CartUI />
        <ReviewSubstitutesModal />
      </main>
    </div>
  );
}
