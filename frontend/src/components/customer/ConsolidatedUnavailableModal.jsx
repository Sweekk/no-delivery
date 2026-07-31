import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, XCircle, RefreshCw, Sparkles, ArrowRight, Clock } from 'lucide-react';

const TIMER_DURATION_SECONDS = 180; // 3 minutes

const ItemCountdownTimer = ({ item, onExpire }) => {
  const unavailableAt = item.unavailableAt || Date.now();
  
  const calculateRemaining = () => {
    const elapsedSeconds = Math.floor((Date.now() - unavailableAt) / 1000);
    return Math.max(0, TIMER_DURATION_SECONDS - elapsedSeconds);
  };

  const [remainingSeconds, setRemainingSeconds] = useState(calculateRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        if (onExpire) {
          onExpire(item.id);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [unavailableAt, item.id]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  let badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (remainingSeconds <= 30) {
    badgeStyle = 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
  } else if (remainingSeconds <= 60) {
    badgeStyle = 'bg-amber-100 text-amber-800 border-amber-300';
  }

  return (
    <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 ${badgeStyle}`}>
      <Clock className="w-3.5 h-3.5" />
      <span>{remainingSeconds > 0 ? formattedTime : 'Time Expired'}</span>
    </div>
  );
};

export const ConsolidatedUnavailableModal = ({
  notification,
  isOpen,
  onClose,
  onSubmitResponses,
  onOpenReplacementPicker,
  onItemTimerExpire,
  onResolveSingleItem,
}) => {

  const unavailableItems = notification?.unavailableItems || [];
  const orderNumber = notification?.orderNumber || '';

  // Initialize responses state unconditionally using useEffect when notification changes
  const [responses, setResponses] = useState({});

  useEffect(() => {
    if (unavailableItems.length > 0) {
      const initial = {};
      unavailableItems.forEach(item => {
        initial[item.id] = {
          action: item.suggestedSubstitute ? 'accept_suggested' : 'skip',
          replacementProduct: item.suggestedSubstitute || null,
        };
      });
      setResponses(initial);
    }
  }, [notification]);

  if (!isOpen || !notification || unavailableItems.length === 0) return null;

  const handleItemAction = (itemId, action, replacementProduct = null) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        action,
        replacementProduct: action === 'accept_suggested' 
          ? (unavailableItems.find(i => i.id === itemId)?.suggestedSubstitute || null)
          : replacementProduct,
      },
    }));
  };

  const handleAcceptAll = () => {
    const updated = {};
    unavailableItems.forEach(item => {
      updated[item.id] = {
        action: item.suggestedSubstitute ? 'accept_suggested' : 'skip',
        replacementProduct: item.suggestedSubstitute || null,
      };
    });
    setResponses(updated);
  };

  const handleSkipAll = () => {
    const updated = {};
    unavailableItems.forEach(item => {
      updated[item.id] = {
        action: 'skip',
        replacementProduct: null,
      };
    });
    setResponses(updated);
  };

  const handleSubmit = () => {
    onSubmitResponses(responses);
  };

  const acceptedCount = Object.values(responses).filter(
    r => r.action === 'accept_suggested' || r.action === 'custom_pick'
  ).length;
  const skippedCount = Object.values(responses).filter(r => r.action === 'skip').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-fade-in text-slate-900">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] text-left">
        
        {/* Header */}
        <div className="pb-4 border-b border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  3-Min Decision Window
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 pt-0.5">
                  Unavailable Items in Order #{orderNumber}
                </h3>
              </div>
            </div>
            <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {unavailableItems.length} {unavailableItems.length === 1 ? 'item' : 'items'} unavailable
            </span>
          </div>

          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            The store picker found {unavailableItems.length} item(s) out of stock. You have <strong>3 minutes per item</strong> to make a selection. If time expires, the system will automatically default to Option ii ("Picker selects relevant replacement").
          </p>
        </div>

        {/* Global Action Shortcut Bar */}
        <div className="py-3 px-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 my-3 text-xs font-bold">
          <span className="text-slate-600 font-semibold">Quick Batch Choices:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Accept All Substitutes
            </button>
            <button
              type="button"
              onClick={handleSkipAll}
              className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 transition cursor-pointer flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" /> Skip All Items
            </button>
          </div>
        </div>

        {/* Unavailable Items List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-2">
          {unavailableItems.map(item => {
            const currentResponse = responses[item.id] || { action: 'skip' };
            const suggested = item.suggestedSubstitute;
            const customReplacement = currentResponse.replacementProduct;

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
              >
                {/* Original Out of Stock Item & Per-Item 3-Min Timer */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 opacity-70"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm line-through text-slate-500">
                          {item.product.name}
                        </h4>
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Out of Stock
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Original: ₹{item.product.price} × {item.quantity} {item.product.unit ? `(${item.product.unit})` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <ItemCountdownTimer item={item} onExpire={onItemTimerExpire} />
                    <span className="font-mono text-xs font-bold text-slate-400">
                      ₹{item.product.price * item.quantity}
                    </span>
                  </div>
                </div>

                {/* Suggested / Selected Substitute Card */}
                {suggested && (
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">
                          Suggested Match
                        </div>
                        <div className="font-bold text-slate-900">
                          {suggested.name}
                        </div>
                        <div className="text-[10px] text-slate-600 font-medium">
                          ₹{suggested.price} {suggested.unit ? `(${suggested.unit})` : ''}
                          {suggested.price !== item.product.price && (
                            <span className="ml-1 text-emerald-700 font-semibold">
                              ({suggested.price > item.product.price ? `+₹${suggested.price - item.product.price}` : `-₹${item.product.price - suggested.price}`})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {currentResponse.action === 'accept_suggested' && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200 px-2 py-1 rounded-lg shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </div>
                )}

                {/* Custom Picked Replacement (if chosen) */}
                {currentResponse.action === 'custom_pick' && customReplacement && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={customReplacement.image}
                        alt={customReplacement.name}
                        className="w-9 h-9 rounded-lg object-cover border border-amber-300 shrink-0"
                      />
                      <div>
                        <div className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">
                          Custom Replacement Chosen
                        </div>
                        <div className="font-bold text-slate-900">{customReplacement.name}</div>
                        <div className="text-[10px] text-slate-600">₹{customReplacement.price}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-2 py-1 rounded-lg shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Selected
                    </span>
                  </div>
                )}

                {/* Decision Options Per Item (3 Independent Options: i, ii, iii) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {/* Option i: Customer selects specific replacement item */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenReplacementPicker) {
                        onOpenReplacementPicker(item, (chosenProduct) => {
                          handleItemAction(item.id, 'custom_pick', chosenProduct);
                        });
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                      currentResponse.action === 'custom_pick'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>i. Self-Select Item</span>
                    <span className="text-[9px] font-normal opacity-80">Pick from full catalog</span>
                  </button>

                  {/* Option ii: Customer allows picker to choose relevant replacement */}
                  <button
                    type="button"
                    onClick={() => handleItemAction(item.id, 'accept_suggested')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                      currentResponse.action === 'accept_suggested'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>ii. Picker Choose</span>
                    <span className="text-[9px] font-normal opacity-90 truncate max-w-[130px]">
                      {suggested ? suggested.name : `Similar ${item.product.category}`}
                    </span>
                  </button>

                  {/* Option iii: Skip item */}
                  <button
                    type="button"
                    onClick={() => {
                      handleItemAction(item.id, 'skip');
                      if (onResolveSingleItem) {
                        onResolveSingleItem(item.id, 'skip');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                      currentResponse.action === 'skip'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>iii. Skip Item</span>
                    <span className="text-[9px] font-normal opacity-80">Remove without replacement</span>
                  </button>
                </div>

                {/* Instant Confirm Button for this item */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (onResolveSingleItem) {
                        const act = currentResponse.action === 'custom_pick' ? 'self_pick' : currentResponse.action === 'accept_suggested' ? 'accept_suggested' : 'skip';
                        onResolveSingleItem(item.id, act, currentResponse.replacementProduct);
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Confirm Selection for {item.product.name}</span>
                  </button>
                </div>


              </div>
            );
          })}
        </div>

        {/* Footer & Submit Action */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
          <div className="text-xs font-medium text-slate-600">
            Selections: <strong className="text-emerald-700 font-bold">{acceptedCount} substituted</strong>, <strong className="text-rose-700 font-bold">{skippedCount} skipped</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Review Later
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Submit Response</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

