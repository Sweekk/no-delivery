import React, { useState, useEffect } from 'react';

const PRODUCTS_CATALOG = [
  { item_id: 'APPLE-FUJI-01', item_name: 'Fuji Apples (Organic)', icon: '🍎' },
  { item_id: 'MILK-GAL-02', item_name: 'Fresh Milk (1 Gallon)', icon: '🥛' },
  { item_id: 'BANANA-ORG-03', item_name: 'Organic Bananas (bundle)', icon: '🍌' },
  { item_id: 'BREAD-WW-04', item_name: 'Whole Wheat Sourdough', icon: '🍞' },
  { item_id: 'CEREAL-BOX-05', item_name: 'Honey Oat Cereal Box', icon: '🥣' },
  { item_id: 'EGGS-DOZ-06', item_name: 'Pasture-Raised Eggs (Dozen)', icon: '🥚' }
];

export default function ReviewSubstitutesModal() {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [trackedOrderId, setTrackedOrderId] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for active substitution prompt modal
  const [activeItemToResolve, setActiveItemToResolve] = useState(null);
  const [resolveAction, setResolveAction] = useState('skip'); // 'skip' or 'substitute'
  const [replacementId, setReplacementId] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState(null);

  // Sync with localStorage on mount
  useEffect(() => {
    const savedOrderId = localStorage.getItem('active_order_id');
    if (savedOrderId) {
      setTrackedOrderId(savedOrderId);
      setOrderIdInput(savedOrderId);
    }
  }, []);

  // Poll order status
  useEffect(() => {
    if (!trackedOrderId) {
      setOrderDetails(null);
      return;
    }

    const fetchStatus = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/customer/order/${trackedOrderId}/status`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`Order with ID "${trackedOrderId}" not found.`);
          }
          throw new Error('Failed to retrieve order status.');
        }
        const data = await res.json();
        setOrderDetails(data);
        setError(null);

        // Check if there is any item awaiting customer
        const itemsAwaiting = (data.items || []).filter(item => item.status === 'awaiting_customer');
        if (itemsAwaiting.length > 0) {
          // Open the modal for the first item awaiting customer that isn't already being resolved
          setActiveItemToResolve((prev) => {
            // Only update if not already actively prompt-resolving or if the item changed
            if (prev && itemsAwaiting.some(item => item.list_id === prev.list_id)) {
              return prev;
            }
            // Set initial state for resolution dialog
            setResolveAction('skip');
            // Suggest first available substitute excluding the item itself
            const firstSubstitute = PRODUCTS_CATALOG.find(p => p.item_id !== itemsAwaiting[0].item_id);
            setReplacementId(firstSubstitute ? firstSubstitute.item_id : '');
            return itemsAwaiting[0];
          });
        } else {
          setActiveItemToResolve(null);
        }
      } catch (err) {
        console.error(err);
        if (!isBackground) {
          setError(err.message || 'An error occurred while tracking the order.');
          setOrderDetails(null);
        }
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    fetchStatus();

    // Listen to local storage changes to capture new orders immediately
    const handleLocalStorageCheck = () => {
      const saved = localStorage.getItem('active_order_id');
      if (saved && saved !== trackedOrderId) {
        setTrackedOrderId(saved);
        setOrderIdInput(saved);
      }
    };

    const interval = setInterval(() => {
      fetchStatus(true);
      handleLocalStorageCheck();
    }, 5000);

    return () => clearInterval(interval);
  }, [trackedOrderId]);

  const handleStartTracking = (e) => {
    e.preventDefault();
    if (!orderIdInput.trim()) return;
    setTrackedOrderId(orderIdInput.trim());
    localStorage.setItem('active_order_id', orderIdInput.trim());
  };

  const handleClearTracking = () => {
    setTrackedOrderId('');
    setOrderIdInput('');
    setOrderDetails(null);
    setActiveItemToResolve(null);
    localStorage.removeItem('active_order_id');
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!activeItemToResolve) return;

    setResolving(true);
    setResolveError(null);

    const payload = {
      action: resolveAction,
      replacement_item_id: resolveAction === 'substitute' ? replacementId : null
    };

    try {
      const res = await fetch(`http://localhost:5000/api/customer/item/${activeItemToResolve.list_id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Failed to submit substitution choice.');
      }

      // Success: Clear active modal and force refresh order details
      setActiveItemToResolve(null);
      // Background update order details immediately
      if (trackedOrderId) {
        const statusRes = await fetch(`http://localhost:5000/api/customer/order/${trackedOrderId}/status`);
        if (statusRes.ok) {
          const data = await statusRes.json();
          setOrderDetails(data);
        }
      }
    } catch (err) {
      console.error(err);
      setResolveError(err.message || 'Could not resolve the item action.');
    } finally {
      setResolving(false);
    }
  };

  // Helper to resolve product names from catalog IDs
  const getProductName = (id) => {
    const prod = PRODUCTS_CATALOG.find(p => p.item_id === id);
    return prod ? `${prod.icon} ${prod.item_name}` : id;
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>📋 Customer Order Tracker & Live Substitutions</span>
            {trackedOrderId && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
            )}
          </h2>
          <p className="text-slate-400 text-sm mt-1">Short-polls your picking status to handle out-of-stock actions dynamically.</p>
        </div>
        {trackedOrderId && (
          <button
            onClick={handleClearTracking}
            className="text-xs font-semibold text-red-400 hover:text-red-300 transition px-2.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
          >
            Stop Tracking
          </button>
        )}
      </div>

      {/* Order Tracker Input Form */}
      {!trackedOrderId && (
        <form onSubmit={handleStartTracking} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Paste your Supabase Order ID here..."
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 font-mono transition"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-500/10"
          >
            Track Order
          </button>
        </form>
      )}

      {/* Loading state */}
      {loading && !orderDetails && (
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs">Initializing tracking dashboard...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-200 rounded-xl text-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <span>{error}</span>
          <button 
            onClick={handleClearTracking} 
            className="px-3 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 font-semibold rounded-lg text-xs transition"
          >
            Clear and Retry
          </button>
        </div>
      )}

      {/* Order status card & items listing */}
      {orderDetails && (
        <div className="space-y-4 animate-fade-in">
          {/* Order Details Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-900/30 border border-slate-800 rounded-2xl p-4">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Order ID</span>
              <span className="font-mono text-sm text-indigo-300 break-all">{orderDetails.order_id}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Live Status</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold mt-1 border ${
                orderDetails.order_status === 'picked'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
              }`}>
                {orderDetails.order_status}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Checked Items</span>
              <span className="text-sm font-semibold text-slate-300">
                {(orderDetails.items || []).filter(item => ['found', 'not_found', 'replaced'].includes(item.status)).length} / {(orderDetails.items || []).length}
              </span>
            </div>
          </div>

          {/* Item Checklist status */}
          <div className="bg-slate-900/10 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-900/30 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Picking Progress checklist</span>
              <span className="text-[10px] font-medium text-slate-500">Auto-polls every 5s</span>
            </div>

            <div className="divide-y divide-slate-800">
              {(orderDetails.items || []).map((item, idx) => {
                let badgeClass = 'bg-slate-800 text-slate-400 border-slate-800';
                if (item.status === 'found') badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                if (item.status === 'not_found') badgeClass = 'bg-red-500/10 text-red-400 border-red-500/20';
                if (item.status === 'replaced') badgeClass = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                if (item.status === 'awaiting_customer') badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse';

                return (
                  <div key={item.list_id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-medium text-sm">
                          {getProductName(item.item_id)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeClass}`}>
                          {item.status === 'awaiting_customer' ? 'awaiting response' : item.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 space-y-0.5">
                        <p>Quantity requested: {item.qty_requested} &bull; Price: ${item.item_price.toFixed(2)}</p>
                        {item.replacement_item_id && (
                          <p className="text-indigo-400">Replaced with: {getProductName(item.replacement_item_id)}</p>
                        )}
                      </div>
                    </div>

                    {item.status === 'awaiting_customer' && (
                      <button
                        onClick={() => {
                          setResolveAction('skip');
                          const firstSubstitute = PRODUCTS_CATALOG.find(p => p.item_id !== item.item_id);
                          setReplacementId(firstSubstitute ? firstSubstitute.item_id : '');
                          setActiveItemToResolve(item);
                        }}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all animate-bounce shadow-md shadow-amber-500/10"
                      >
                        Action Required
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Substitution Resolution Overlay Modal */}
      {activeItemToResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl shadow-slate-950/50">
            
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                  Out of Stock Alert
                </span>
                <h3 className="text-xl font-bold text-slate-100 mt-2">
                  Substitute or Skip Item
                </h3>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">
              We are sorry, but the store is out of <strong className="text-slate-100">{getProductName(activeItemToResolve.item_id)}</strong>. How would you like to handle this?
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-6">
              
              {/* Radio buttons for Action Select */}
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex flex-col items-center justify-center p-4 border rounded-2xl cursor-pointer transition-all ${
                  resolveAction === 'skip'
                    ? 'border-red-500/40 bg-red-500/5 text-slate-200'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="resolveAction"
                    value="skip"
                    checked={resolveAction === 'skip'}
                    onChange={() => setResolveAction('skip')}
                    className="sr-only"
                  />
                  <span className="text-2xl mb-1">✗</span>
                  <span className="text-sm font-semibold">Skip Item</span>
                  <span className="text-[10px] text-slate-500 text-center mt-1">Refund this item (Not Found)</span>
                </label>

                <label className={`flex flex-col items-center justify-center p-4 border rounded-2xl cursor-pointer transition-all ${
                  resolveAction === 'substitute'
                    ? 'border-indigo-500/40 bg-indigo-500/5 text-slate-200'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="resolveAction"
                    value="substitute"
                    checked={resolveAction === 'substitute'}
                    onChange={() => setResolveAction('substitute')}
                    className="sr-only"
                  />
                  <span className="text-2xl mb-1">🔄</span>
                  <span className="text-sm font-semibold">Substitute</span>
                  <span className="text-[10px] text-slate-500 text-center mt-1">Select alternative product</span>
                </label>
              </div>

              {/* Conditional dropdown selection for substitute */}
              {resolveAction === 'substitute' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Select replacement product</label>
                  <select
                    value={replacementId}
                    onChange={(e) => setReplacementId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500 transition"
                  >
                    {PRODUCTS_CATALOG
                      .filter(p => p.item_id !== activeItemToResolve.item_id)
                      .map((prod) => (
                        <option key={prod.item_id} value={prod.item_id}>
                          {prod.icon} {prod.item_name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {resolveError && (
                <p className="text-xs text-red-400 font-semibold bg-red-950/20 border border-red-900/40 p-3 rounded-lg">
                  {resolveError}
                </p>
              )}

              <div className="flex gap-3 justify-end border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveItemToResolve(null)}
                  disabled={resolving}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-semibold text-sm rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/10 transition-all flex items-center gap-2"
                >
                  {resolving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Confirm Choice</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
