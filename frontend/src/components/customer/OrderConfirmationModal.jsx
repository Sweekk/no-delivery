import React from 'react';
import { CheckCircle2, ShoppingBag, MapPin, ArrowRight } from 'lucide-react';

export const OrderConfirmationModal = ({
  order,
  isOpen,
  onTrackOrder,
  onContinueShopping,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-slate-900">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 text-left">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Order Confirmed!
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Thank you for shopping! Your grocery order has been successfully placed.
          </p>
        </div>

        {/* Details Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-bold">
            <span className="text-slate-500 uppercase tracking-wider text-[10px]">Order ID</span>
            <span className="text-slate-900 font-mono text-sm">{order.orderNumber}</span>
          </div>

          <div className="space-y-1.5 text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{order.items.length} items ordered</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{order.deliveryAddress}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-extrabold text-slate-900 text-sm">
            <span>Total Payable Amount</span>
            <span className="text-emerald-700 font-mono">₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={onTrackOrder}
            className="py-3 px-4 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Track Order Status</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={onContinueShopping}
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>

      </div>
    </div>
  );
};
