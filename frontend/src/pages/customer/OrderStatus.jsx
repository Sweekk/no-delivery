import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, AlertCircle, RefreshCw, PackageCheck, Check, Bell, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

import { useOrders } from '../../context/OrderContext.jsx';
import { ChooseReplacementModal } from '../../components/customer/ChooseReplacementModal.jsx';
import { ConsolidatedUnavailableModal } from '../../components/customer/ConsolidatedUnavailableModal.jsx';
import { Toast } from '../../components/common/Toast.jsx';

export const OrderStatus = ({ onBackToHome }) => {
  const {
    activeOrder,
    cancelOrder,
    updateItemAvailability,
    completeOrderPicking,
    resolveBatchUnavailableItems,
    resolveUnavailableItem,
    finalizePickerSelection,
    handleItemTimerExpire,
    activeToast,
  } = useOrders();

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedItemForReplacement, setSelectedItemForReplacement] = useState(null);
  const [replacementCallbackObj, setReplacementCallbackObj] = useState(null);
  const [isConsolidatedModalOpen, setIsConsolidatedModalOpen] = useState(true);

  // Auto-open consolidated modal whenever a pending notification exists
  useEffect(() => {
    if (activeOrder?.hasPendingNotification) {
      setIsConsolidatedModalOpen(true);
    }
  }, [activeOrder?.hasPendingNotification, activeOrder?.id]);

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
    if (replacementCallbackObj && typeof replacementCallbackObj.fn === 'function') {
      replacementCallbackObj.fn(product);
      setReplacementCallbackObj(null);
    } else if (selectedItemForReplacement) {
      resolveUnavailableItem(activeOrder.id, selectedItemForReplacement.id, 'self_pick', product);
    }
    setSelectedItemForReplacement(null);
  };

  const handleOpenReplacementFromBatchModal = (item, onSelect) => {
    setSelectedItemForReplacement(item);
    setReplacementCallbackObj({ fn: onSelect });
  };

  const handleBatchSubmit = (responses) => {
    resolveBatchUnavailableItems(activeOrder.id, responses);
    setIsConsolidatedModalOpen(false);
  };

  const checkedCount = activeOrder.items.filter(i => i.pickingStatus !== 'pending').length;
  const unavailableItemsCount = activeOrder.items.filter(i => i.pickingStatus === 'not_available').length;
  const notifications = activeOrder.notifications || [];

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans p-4 sm:p-8">
      <Toast message={activeToast?.message} type={activeToast?.type} />

      {/* Replacement Selection Modal */}
      {selectedItemForReplacement && (
        <ChooseReplacementModal
          item={selectedItemForReplacement}
          isOpen={!!selectedItemForReplacement}
          onClose={() => {
            setSelectedItemForReplacement(null);
            setReplacementCallbackObj(null);
          }}
          onSelectReplacement={handleSelfReplacementSelect}
        />
      )}

      {/* Single Consolidated Unavailable Items Modal */}
      {activeOrder.hasPendingNotification && activeOrder.consolidatedNotification && (
        <ConsolidatedUnavailableModal
          notification={activeOrder.consolidatedNotification}
          isOpen={isConsolidatedModalOpen}
          onClose={() => setIsConsolidatedModalOpen(false)}
          onSubmitResponses={handleBatchSubmit}
          onOpenReplacementPicker={handleOpenReplacementFromBatchModal}
          onItemTimerExpire={(itemId) => handleItemTimerExpire(activeOrder.id, itemId)}
          onResolveSingleItem={(itemId, action, replacementProduct) => {
            resolveUnavailableItem(activeOrder.id, itemId, action, replacementProduct);
          }}
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
              <span className={`w-2.5 h-2.5 rounded-full ${
                activeOrder.stage === 'Pending Customer Review'
                  ? 'bg-amber-500 animate-pulse'
                  : activeOrder.stage === 'Ready for Delivery'
                  ? 'bg-emerald-500'
                  : 'bg-blue-500'
              }`} />
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

        {/* IN-APP SELECTION CONFIRMATION NOTIFICATIONS FEED */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Bell className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    In-App Selection Confirmation Notifications
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Real-time confirmation alerts for each item decision
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                {notifications.length} {notifications.length === 1 ? 'alert' : 'alerts'}
              </span>
            </div>

            <div className="space-y-2.5">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 transition-all ${
                    notif.isAutoFallback
                      ? 'bg-amber-50/90 border-amber-300 text-amber-900'
                      : notif.option === 'skip'
                      ? 'bg-slate-50 border-slate-300 text-slate-800'
                      : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {notif.isAutoFallback ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : notif.option === 'skip' ? (
                      <Info className="w-4 h-4 text-slate-500" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        notif.isAutoFallback
                          ? 'bg-amber-200 text-amber-900 border-amber-300'
                          : notif.option === 'self_pick' || notif.option === 'custom_pick'
                          ? 'bg-amber-100 text-amber-900 border-amber-200'
                          : notif.option === 'skip'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-emerald-200 text-emerald-900 border-emerald-300'
                      }`}>
                        {notif.isAutoFallback
                          ? 'Timer Expired Auto-Fallback'
                          : notif.option === 'self_pick' || notif.option === 'custom_pick'
                          ? 'Option i — Self-Selected'
                          : notif.option === 'skip'
                          ? 'Option iii — Skipped'
                          : 'Option ii — Picker Selected'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium font-mono">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="font-semibold leading-relaxed text-xs">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONSOLIDATED NOTIFICATION BANNER (When action is required) */}
        {activeOrder.hasPendingNotification && (
          <div className="bg-amber-50 rounded-3xl p-5 border border-amber-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    Action Required
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    3-Minute Decision Timer Active
                  </h4>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  The picker finished checking your order. <strong>{activeOrder.consolidatedNotification?.unavailableItems?.length || 0} item(s)</strong> are unavailable. Review and respond before the 3-minute timer expires.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsConsolidatedModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-sm transition cursor-pointer shrink-0 flex items-center justify-center gap-2"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Open Batch Popup</span>
            </button>
          </div>
        )}

        {/* SIMULATED PICKER DEMO CONTROL PANEL */}
        <div className="bg-amber-50/80 rounded-3xl p-5 border border-amber-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                Simulated Picker Controls (Order Picking Workflow)
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
              Checked: {checkedCount}/{activeOrder.items.length} items
            </span>
          </div>
          <p className="text-xs text-amber-800 font-medium leading-relaxed">
            Mark items as <strong>Available</strong> or <strong>Not Available</strong> during picking. Unavailable items trigger the 3-minute customer timer upon completing order picking.
          </p>

          {/* Item Picking Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {activeOrder.items.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-white border border-amber-200/80 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 max-w-[150px] truncate">
                  <span className="font-bold text-slate-900 truncate">{item.product.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.pickingStatus === 'substituted' || item.pickingStatus === 'skipped' ? (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {item.pickingStatus === 'substituted' ? '✓ Substituted' : '✗ Skipped'}
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => updateItemAvailability(activeOrder.id, item.id, 'available')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          item.pickingStatus === 'available'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        ✓ Available
                      </button>
                      <button
                        onClick={() => updateItemAvailability(activeOrder.id, item.id, 'not_available')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          item.pickingStatus === 'not_available'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        ✗ Not Available
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Finish Picking Button */}
          <div className="pt-2 flex items-center justify-between border-t border-amber-200/60">
            <div className="text-[11px] font-bold text-amber-900">
              Internal count: <span className="text-rose-700 font-extrabold">{unavailableItemsCount} item(s)</span> flagged unavailable
            </div>
            <button
              onClick={() => completeOrderPicking(activeOrder.id)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Complete Order Picking</span>
            </button>
          </div>
        </div>

        {/* ORDER ITEMS LIST */}
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
                      ? 'bg-rose-50/40 border-rose-200'
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
                        {isUnavailable && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                            Flagged Not Available (3-Min Timer Running)
                          </span>
                        )}
                        {isSubstituted && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                            Substituted ({item.substitutionChoice === 'self_pick' ? 'Option i — Self Selected' : 'Option ii — Picker Selected'})
                          </span>
                        )}
                        {isSkipped && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                            Option iii — Skipped
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

