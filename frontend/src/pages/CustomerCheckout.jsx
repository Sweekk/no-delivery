import React from 'react';
import CartUI from '../components/customer/CartUI';
import ReviewSubstitutesModal from '../components/customer/ReviewSubstitutesModal';

export default function CustomerCheckout() {
  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Customer Checkout Storefront</h1>
        <p className="text-slate-400">Configure your shopping cart, select substitution preferences, and submit a customer order directly to the picker database.</p>
      </div>

      <CartUI />

      <div className="pt-8 border-t border-slate-900">
        <details className="group bg-slate-900/20 border border-slate-800 rounded-xl overflow-hidden transition-all duration-200">
          <summary className="flex items-center justify-between p-4 cursor-pointer text-slate-400 hover:text-slate-200 font-medium select-none text-sm">
            <span>🔧 Additional Customer Modules (Substitutes Review)</span>
            <span className="text-xs transition-transform group-open:rotate-180">▼</span>
          </summary>
          <div className="p-4 border-t border-slate-800 bg-slate-950/20">
            <ReviewSubstitutesModal />
          </div>
        </details>
      </div>
    </div>
  );
}
