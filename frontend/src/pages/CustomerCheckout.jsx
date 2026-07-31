import React from 'react';
import CartUI from '../components/customer/CartUI';
import ReviewSubstitutesModal from '../components/customer/ReviewSubstitutesModal';
import './CustomerCheckout.css';

export default function CustomerCheckout() {
  return (
    <div className="customer-page">
      <header className="customer-page-header">
        <p>QuickFIx Grocery Delivery</p>
        <h1>Your grocery order</h1>
        <span>Review your cart and any suggested replacements.</span>
      </header>
      <section className="customer-content">
        <CartUI />
        <ReviewSubstitutesModal />
      </section>
    </div>
  );
}
