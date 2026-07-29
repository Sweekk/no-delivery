import React, { useState } from 'react';
import { MapPin, ArrowRight, ChevronLeft, CreditCard } from 'lucide-react';

export const Checkout = ({
  cart,
  onPlaceOrder,
  onBackToCart,
}) => {
  const [address, setAddress] = useState('Flat 402, Green Park Residency, Sector 5');
  const [phone, setPhone] = useState('+91 98765-12345');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const deliveryFee = 30;
  const total = subtotal + deliveryFee;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onPlaceOrder(address);
    }, 600);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6 text-left">
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToCart}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Basket
          </button>
          <div className="text-xs font-bold text-slate-500">Checkout</div>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h1 className="text-2xl font-extrabold text-slate-900">Delivery & Payment Details</h1>
            <p className="text-xs text-slate-500 font-medium">Verify your address and place your order</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Delivery Address */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Delivery Address
                </h4>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Street Address / Flat</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Contact Phone</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-600" />
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Payment Method
                </h4>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Cash on Delivery / UPI Pay</span>
                <span className="text-emerald-700 font-extrabold">Active</span>
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs">
              <h4 className="font-extrabold text-slate-900 pb-2 border-b border-slate-100">Order Summary ({cart.length} items)</h4>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Items Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Total Payable</span>
                <span className="text-emerald-700 font-mono">₹{total}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Placing Order...</span>
              ) : (
                <>
                  <span>Place Order (₹{total})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
