import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, AlertCircle, RefreshCw, XCircle, UserCheck } from 'lucide-react';
import { useOrders } from '../../context/OrderContext.jsx';
import { ChooseReplacementModal } from '../../components/customer/ChooseReplacementModal.jsx';

export const OrderStatus = ({ onBackToHome }) => {
  const { activeOrder, cancelOrder, updateItemAvailability, resolveUnavailableItem } = useOrders();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedItemForReplacement, setSelectedItemForReplacement] = useState(null);

  if (!activeOrder) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans p-8 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-sm text-center space-y-4">
          <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto" />
          <h2 className="text-xl font-extrabold text-slate-900">No Active Order Found</h2>
          <p className="text-xs text-slate-500 font-medium">Place an order from the grocery store catalog to start tracking.</p>
          <button
            onClick={onBackToHome}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition cursor-pointer"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  const handleSelfReplacementSelect = (product) => {
    if (selectedItemForReplacement) {
      resolveUnavailableItem(activeOrder.id, selectedItemForReplacement.id, 'self_pick', product);
      setSelectedItemForReplacement(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans p-4 sm:p-8">
      
      {/* Replacement Selection Modal */}
      {selectedItemForReplacement && (
        <ChooseReplacementModal
          item={selectedItemForReplacement}
          isOpen={!!selectedItemForReplacement}
          onClose={() => setSelectedItemForReplacement(null)}
          onSelectReplacement={handleSelfReplacementSelect}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6 text-left">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Grocery Store
          </button>
          <div className="text-xs font-bold text-slate-500">
            Order #{activeOrder.orderNumber}
          </div>
        </div>

        {/* Order Header Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-xl font-extrabold text-slate-900">Order Tracker & Status</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Store: <span className="font-bold text-slate-800">{activeOrder.storeName}</span> • Delivering to: <span className="font-bold text-slate-800">{activeOrder.deliveryAddress}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-800">
            <span>Stage: {activeOrder.stage}</span>
          </div>
        </div>

        {/* SIMULATED PICKER DEMO CONTROL PANEL */}
        <div className="bg-amber-50/80 rounded-3xl p-5 border border-amber-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                Simulated Picker Controls (Academic Demo)
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
              Teammates backend placeholder
            </span>
          </div>
          <p className="text-xs text-amber-800 font-medium leading-relaxed">
            Since the Picker dashboard is excluded per project requirements, use the buttons below to simulate the Picker marking each item as <strong>Available</strong> or <strong>Not Available</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {activeOrder.items.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-white border border-amber-200/80 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 max-w-[160px] truncate">
                  <span className="font-bold text-slate-900 truncate">{item.product.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => updateItemAvailability(activeOrder.id, item.id, 'available')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      item.pickingStatus === 'available'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    ✓ Mark Available
                  </button>
                  <button
                    onClick={() => updateItemAvailability(activeOrder.id, item.id, 'not_available')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      item.pickingStatus === 'not_available'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    ✗ Mark Not Available
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ORDER ITEMS & CUSTOMER SUBSTITUTION ACTIONS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900">
              Order Items ({activeOrder.items.length})
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Subtotal: <strong className="text-slate-900 font-mono">₹{activeOrder.subtotal}</strong>
            </span>
          </div>

          <div className="space-y-4">
            {activeOrder.items.map((item) => {
              const isUnavailable = item.pickingStatus === 'not_available';
              const isSubstituted = item.pickingStatus === 'substituted';
              const isSkipped = item.pickingStatus === 'skipped';
              const isAvailable = item.pickingStatus === 'available';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all text-xs space-y-3 ${
                    isUnavailable
                      ? 'bg-rose-50/50 border-rose-200'
                      : isSubstituted
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isSkipped
                      ? 'bg-slate-50 border-slate-200 opacity-75'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  {/* Item Summary Line */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {item.product.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          ₹{item.product.price} × {item.quantity} {item.product.unit ? `(${item.product.unit})` : ''}
                        </p>
                        {item.originalProduct && (
                          <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                            Replaced original: <span className="line-through">{item.originalProduct.name}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-mono text-sm font-extrabold ${isSkipped ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        ₹{isSkipped ? 0 : item.product.price * item.quantity}
                      </span>
                      <div className="mt-1">
                        {isAvailable && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                            Available in Store
                          </span>
                        )}
                        {isSubstituted && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                            Substituted ({item.substitutionChoice === 'self_pick' ? 'Self Chosen' : 'Picker Chosen'})
                          </span>
                        )}
                        {isSkipped && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                            Item Skipped
                          </span>
                        )}
                        {item.pickingStatus === 'pending' && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full border border-slate-300">
                            Pending Verification
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3 CUSTOMER RESOLUTION OPTIONS WHEN ITEM IS NOT AVAILABLE */}
                  {isUnavailable && (
                    <div className="p-3.5 rounded-xl bg-white border border-rose-200 space-y-2.5 animate-slide-up">
                      <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Item flagged Not Available by Picker. Select how you want to resolve this:</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {/* Option i — Choose replacement myself */}
                        <button
                          onClick={() => setSelectedItemForReplacement(item)}
                          className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center"
                        >
                          <UserCheck className="w-4 h-4 text-emerald-700" />
                          <span>Option i</span>
                          <span className="text-[10px] font-normal text-emerald-900">Choose replacement myself</span>
                        </button>

                        {/* Option ii — Let the picker choose */}
                        <button
                          onClick={() => resolveUnavailableItem(activeOrder.id, item.id, 'picker_pick')}
                          className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center"
                        >
                          <RefreshCw className="w-4 h-4 text-amber-700" />
                          <span>Option ii</span>
                          <span className="text-[10px] font-normal text-amber-950">Let picker choose match</span>
                        </button>

                        {/* Option iii — Skip the item */}
                        <button
                          onClick={() => resolveUnavailableItem(activeOrder.id, item.id, 'skip')}
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center"
                        >
                          <XCircle className="w-4 h-4 text-slate-600" />
                          <span>Option iii</span>
                          <span className="text-[10px] font-normal text-slate-600">Skip / remove item</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ORDER SUMMARY & CANCELLATION CARD */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-100">
            Order Payment Summary
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-mono font-bold text-slate-900">₹{activeOrder.subtotal}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span className="font-mono font-bold text-slate-900">₹{activeOrder.deliveryFee}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm font-extrabold text-slate-900">
              <span>Final Total Amount</span>
              <span className="font-mono text-emerald-700">₹{activeOrder.totalAmount}</span>
            </div>
          </div>

          {/* Cancellation Section */}
          <div className="pt-2">
            {activeOrder.cancellationAllowed ? (
              <div>
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition cursor-pointer"
                  >
                    Cancel Order
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 space-y-2 text-center">
                    <p className="text-xs font-bold text-rose-800">Are you sure you want to cancel this order?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => cancelOrder(activeOrder.id)}
                        className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-xs"
                      >
                        Yes, Cancel Order
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="flex-1 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs"
                      >
                        Keep Order
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-medium">
                Order processing complete. Cancellation is locked.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
