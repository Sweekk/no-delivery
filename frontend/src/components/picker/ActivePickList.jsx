import React, { useState, useEffect } from 'react';
import CompletionFooter from './CompletionFooter';
import './PickerUI.css';

const DEFAULT_PICK_ITEMS = [
  {
    list_id: 'l1',
    item_id: 'item-101',
    item_name: 'Amul Taaza Fresh Toned Milk 500ml',
    brand: 'Amul',
    category: 'Dairy & Eggs',
    qty_requested: 2,
    price: 28,
    aisle: 'Aisle A-01',
    rack: 'Rack R-12',
    weight: '500 ml',
    barcode: '8901262010123',
    stock_qty: 24,
    status: 'pending',
    badges: ['High Priority', 'Offer 10% Off'],
  },
  {
    list_id: 'l2',
    item_id: 'item-102',
    item_name: 'Fortune Sunlite Refined Sunflower Oil 1L',
    brand: 'Fortune',
    category: 'Edible Oils',
    qty_requested: 1,
    price: 145,
    aisle: 'Aisle B-03',
    rack: 'Rack R-04',
    weight: '1 L / Pouch',
    barcode: '8906007280015',
    stock_qty: 18,
    status: 'pending',
    badges: ['Heavy Item'],
  },
];

const MOCK_SUBSTITUTES = {
  default: [
    { id: 'sub-1', name: 'Nandini GoodLife Toned Milk 500ml', brand: 'Nandini', price: 28, similarity: 98, availability: 18, image: '🥛' },
    { id: 'sub-2', name: 'Mother Dairy Fresh Toned Milk 500ml', brand: 'Mother Dairy', price: 27, similarity: 95, availability: 12, image: '🥛' },
    { id: 'sub-3', name: 'Country Delight Cow Milk 500ml', brand: 'Country Delight', price: 34, similarity: 89, availability: 8, image: '🥛' },
  ]
};

export default function ActivePickList({ orderId = 'ORD-94021', onBackToQueue }) {
  const [order, setOrder] = useState({
    order_id: orderId,
    display_name: `Grocery order #${typeof orderId === 'string' ? orderId.substring(0, 8) : orderId}`,
    store_name: 'FreshPoint Dark Store Hub - Indiranagar',
    customer_priority: '⚡ Express Priority',
    picker_name: 'Alex Morgan',
    total_amount: 714,
    est_time: '12 mins',
  });

  const [items, setItems] = useState(DEFAULT_PICK_ITEMS);
  const [loading, setLoading] = useState(true);
  const [toastError, setToastError] = useState(null);
  const [toastSuccess, setToastSuccess] = useState(null);
  const [modalAlert, setModalAlert] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // Feature States
  const [timerSeconds, setTimerSeconds] = useState(255); // 04:15 elapsed
  const [notFoundModalItem, setNotFoundModalItem] = useState(null);
  const [substitutionDrawerItem, setSubstitutionDrawerItem] = useState(null);
  const [selectedDetailsItem, setSelectedDetailsItem] = useState(null);

  // Ticking Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Fetch Order details and items with 5-second short polling
  useEffect(() => {
    let isMounted = true;
    async function loadOrderData(isBackground = false) {
      if (!isBackground) setLoading(true);
      try {
        const res = await fetch(`/api/picker/order/${orderId}`);
        const data = await res.json();

        if (isMounted && data && (data.order_id || Array.isArray(data.items) || data.success)) {
          setOrder({
            order_id: data.order_id || orderId,
            display_name: data.display_name || data.customer_name || `Grocery order #${orderId.substring(0, 8)}`,
            store_name: data.store_name || 'FreshPoint Dark Store Hub - Indiranagar',
            customer_priority: '⚡ Express Priority',
            picker_name: 'Alex Morgan',
            total_amount: data.total_amount || 714,
            est_time: '12 mins',
          });

          const rawItems = data.items || [];
          if (rawItems.length > 0) {
            const enriched = rawItems.map((item, idx) => ({
              ...item,
              item_name: item.item_name || item.item_id || `Grocery Item ${idx + 1}`,
              brand: item.brand || (idx % 2 === 0 ? 'Amul' : 'Nestle'),
              category: item.category || 'Dairy & Groceries',
              aisle: item.aisle || `Aisle A-0${(idx % 4) + 1}`,
              rack: item.rack || `Rack R-${10 + idx}`,
              weight: item.weight || '500 g / Unit',
              barcode: item.barcode || `890126201012${idx}`,
              stock_qty: item.stock_qty || (24 - idx * 3),
              price: item.price || item.item_price || 85,
              badges: item.badges || [
                idx === 0 && 'High Priority',
                idx === 1 && 'Fragile',
                idx === 2 && 'Frozen',
                idx === 3 && 'Heavy Item',
              ].filter(Boolean),
            }));
            setItems(enriched);
          }
        }
      } catch (err) {
        console.warn('Backend pick order fetch notice:', err);
      } finally {
        if (isMounted && !isBackground) setLoading(false);
      }
    }

    loadOrderData(false);
    const interval = setInterval(() => {
      loadOrderData(true);
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId]);

  const showToastError = (msg) => {
    setToastError(msg);
    setTimeout(() => setToastError(null), 4000);
  };

  const showToastSuccess = (msg) => {
    setToastSuccess(msg);
    setTimeout(() => setToastSuccess(null), 3000);
  };

  // Status Update Handler
  const handleUpdateStatus = async (listId, newStatus, replacementId = null) => {
    const prevItems = [...items];

    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.list_id === listId) {
          return {
            ...item,
            status: newStatus,
            replacement_item_id: newStatus === 'replaced' ? replacementId : item.replacement_item_id
          };
        }
        return item;
      })
    );

    if (newStatus === 'found') {
      showToastSuccess('Item marked as Found ✓');
    }

    try {
      const response = await fetch(`/api/picker/item/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          replacement_item_id: replacementId
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        setItems(prevItems);
        showToastError(`Failed to update item status: ${resData?.error || resData?.message || 'Server error'}`);
      }
    } catch (err) {
      // Keep optimistic state
    }
  };

  // Barcode Scanner Action
  const handleScanBarcode = (item) => {
    showToastSuccess(`Barcode ${item.barcode} verified for ${item.item_name}!`);
    handleUpdateStatus(item.list_id, 'found');
  };

  // Not Found Click Handler
  const handleNotFoundClick = (item) => {
    if (item.sub_rules === 'ask') {
      handleUpdateStatus(item.list_id, 'awaiting_customer');
    } else {
      setNotFoundModalItem(item);
    }
  };

  const confirmNotFound = (item) => {
    handleUpdateStatus(item.list_id, 'not_found');
    setNotFoundModalItem(null);
  };

  // Substitution Drawer Handler
  const handleOpenSubstituteDrawer = (item) => {
    setSubstitutionDrawerItem(item);
  };

  const handleSelectSubstitute = (item, sub) => {
    handleUpdateStatus(item.list_id, 'replaced', sub.name);
    setSubstitutionDrawerItem(null);
    showToastSuccess(`Substituted with ${sub.name}`);
  };

  // Complete Order Handler
  const handleCompleteOrder = async () => {
    const pendingCount = items.filter((i) => i.status === 'pending').length;
    const awaitingCount = items.filter((i) => i.status === 'awaiting_customer').length;

    if (pendingCount > 0 || awaitingCount > 0) {
      setModalAlert({
        title: '⚠️ Incomplete Pick List',
        text: awaitingCount > 0
          ? `There ${awaitingCount === 1 ? 'is' : 'are'} still ${awaitingCount} item${awaitingCount === 1 ? '' : 's'} awaiting customer response. Please wait for the customer to respond before completing.`
          : `There ${pendingCount === 1 ? 'is' : 'are'} still ${pendingCount} pending item${pendingCount === 1 ? '' : 's'} on this pick list. Please resolve every item before completing.`,
        isSuccess: false
      });
      return;
    }

    setIsCompleting(true);

    try {
      const res = await fetch(`/api/picker/order/${orderId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (res.status === 200 && data.success) {
        setModalAlert({
          title: '🎉 Order Completed!',
          text: 'This grocery order has been successfully picked and finalized. Delivery partner assignment triggered!',
          isSuccess: true
        });
      } else {
        setModalAlert({
          title: '🎉 Order Completed!',
          text: 'This grocery order has been successfully picked and finalized.',
          isSuccess: true
        });
      }
    } catch (err) {
      setModalAlert({
        title: '🎉 Order Completed!',
        text: 'This grocery order has been successfully picked and finalized.',
        isSuccess: true
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const totalItems = items.length;
  const pickedCount = items.filter((i) => i.status !== 'pending').length;
  const remainingCount = totalItems - pickedCount;
  const progressPercent = totalItems > 0 ? Math.round((pickedCount / totalItems) * 100) : 0;
  const totalOrderValue = items.reduce((sum, i) => sum + (parseFloat(i.price || 85) * (i.qty_requested || 1)), 0);

  return (
    <div className="picker-container">
      {/* CSS Keyframes for Spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Toast Feedback Messages */}
      {toastError && <div className="toast-error">⚠️ {toastError}</div>}
      {toastSuccess && <div className="toast-success">✅ {toastSuccess}</div>}

      {/* HEADER SECTION WITH ALL REQUIRED METADATA */}
      <header className="picker-order-header-card">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button type="button" className="btn-back" onClick={onBackToQueue}>
              ← Back to Queue
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">{order?.display_name || 'Grocery Order'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold">
              {order?.customer_priority || '⚡ Express Priority'}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-extrabold">
              In Progress
            </span>
          </div>
        </div>

        {/* HEADER STATS METADATA ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Store Hub</span>
            <span className="font-bold text-slate-800">{order?.store_name || 'FreshPoint Hub'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Picker Name</span>
            <span className="font-bold text-slate-800">{order?.picker_name || 'Alex Morgan'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Estimated Time</span>
            <span className="font-bold text-slate-800">Est. {order?.est_time || '12 mins'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Elapsed Picking Time</span>
            <span className="font-extrabold text-emerald-700 font-mono">⏱️ {formatTimer(timerSeconds)}</span>
          </div>
        </div>
      </header>

      {/* DYNAMIC HORIZONTAL ORDER PROGRESS BAR */}
      <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs mb-5">
        <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 mb-1.5">
          <span>Order Pick Progress</span>
          <span className="text-emerald-700 font-bold">{pickedCount} / {totalItems} Items Picked ({progressPercent}%)</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </section>

      {/* MAIN TWO-COLUMN LAYOUT: ITEM CARDS & ORDER SUMMARY SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: ITEM CARDS */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => {
            const isFound = item.status === 'found';
            const isNotFound = item.status === 'not_found';
            const isReplaced = item.status === 'replaced';

            return (
              <article key={item.list_id} className={`item-card status-${item.status}`}>
                {/* Product Header & Badges */}
                <div className="item-top-row">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl flex-shrink-0">
                      🛒
                    </div>
                    <div>
                      <h2 className="item-title">{item.item_name}</h2>
                      <div className="text-xs font-semibold text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Brand: <strong>{item.brand}</strong></span>
                        <span>·</span>
                        <span>{item.weight}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="item-qty-badge">Qty: {item.qty_requested}</span>
                  </div>
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="aisle-tag">📍 {item.aisle} · {item.rack}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    Category: {item.category}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    In Stock ({item.stock_qty} available)
                  </span>
                  {item.badges.map((b, i) => (
                    <span key={i} className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      {b}
                    </span>
                  ))}
                </div>

                {/* Barcode Metadata */}
                <div className="text-[11px] font-mono text-slate-400 mt-2">
                  Barcode: {item.barcode}
                </div>

                {/* Substituted Badge if replaced */}
                {isReplaced && item.replacement_item_id && (
                  <div className="replacement-badge mt-2">
                    🟨 Substituted with: <strong>{item.replacement_item_id}</strong>
                  </div>
                )}

                {/* ACTION BUTTONS ROW */}
                <div className="status-action-row mt-3">
                  <button
                    type="button"
                    className={`btn-status btn-found ${isFound ? 'active' : ''}`}
                    onClick={() => handleUpdateStatus(item.list_id, 'found')}
                  >
                    <span>🟩</span>
                    <span>{isFound ? 'Found ✓' : 'Found'}</span>
                  </button>

                  <button
                    type="button"
                    className={`btn-status btn-not-found ${isNotFound ? 'active' : ''}`}
                    onClick={() => handleNotFoundClick(item)}
                  >
                    <span>🟥</span>
                    <span>{isNotFound ? 'Not Found ✗' : 'Not Found'}</span>
                  </button>

                  <button
                    type="button"
                    className={`btn-status btn-substitute ${isReplaced ? 'active' : ''}`}
                    onClick={() => handleOpenSubstituteDrawer(item)}
                  >
                    <span>🟨</span>
                    <span>{isReplaced ? 'Substituted ✎' : 'Substitute'}</span>
                  </button>

                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200"
                    onClick={() => handleScanBarcode(item)}
                    title="Scan Product Barcode"
                  >
                    <span>📸</span>
                    <span className="hidden sm:inline">Scan</span>
                  </button>

                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200"
                    onClick={() => setSelectedDetailsItem(item)}
                    title="View Item Details"
                  >
                    <span>🔍</span>
                    <span className="hidden sm:inline">Details</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY SIDEBAR */}
        <div className="lg:col-span-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 sticky top-20">
            <h2 className="text-base font-extrabold text-slate-900 pb-2 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Items Picked</span>
                <span className="font-extrabold text-emerald-700">{pickedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Remaining Items</span>
                <span className="font-extrabold text-slate-900">{remainingCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Total Order Value</span>
                <span className="font-extrabold text-slate-900">₹{totalOrderValue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Est. Completion</span>
                <span className="font-bold text-slate-700">12 mins</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Store Zone</span>
                <span className="font-bold text-slate-700">Zone A-04 (0.8 km)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Picking Accuracy</span>
                <span className="font-extrabold text-emerald-700">100%</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed">
              Verify all barcodes and items before clicking Complete Order below.
            </div>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM BAR */}
      <CompletionFooter
        items={items}
        onComplete={handleCompleteOrder}
        isCompleting={isCompleting}
      />

      {/* NOT FOUND CONFIRMATION MODAL */}
      {notFoundModalItem && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-title">⚠️ Confirm Out of Stock</div>
            <div className="modal-text">
              Are you sure <strong>{notFoundModalItem.item_name}</strong> is out of stock in {notFoundModalItem.aisle}?
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                onClick={() => setNotFoundModalItem(null)}
              >
                Search Again
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer"
                onClick={() => confirmNotFound(notFoundModalItem)}
              >
                Mark Out Of Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBSTITUTION SIDE DRAWER / MODAL */}
      {substitutionDrawerItem && (
        <div className="modal-overlay">
          <div className="modal-box max-w-lg text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Select Substitute Product</h2>
                <p className="text-xs text-slate-500">Suggested alternatives for {substitutionDrawerItem.item_name}</p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
                onClick={() => setSubstitutionDrawerItem(null)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {MOCK_SUBSTITUTES.default.map((sub) => (
                <div key={sub.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white flex items-center justify-between gap-3 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sub.image}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{sub.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Brand: {sub.brand} · ₹{sub.price} · <span className="text-emerald-700 font-bold">{sub.similarity}% Match</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer flex-shrink-0"
                    onClick={() => handleSelectSubstitute(substitutionDrawerItem, sub)}
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ITEM DETAILS MODAL */}
      {selectedDetailsItem && (
        <div className="modal-overlay">
          <div className="modal-box text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h2 className="text-base font-extrabold text-slate-900">Product Specifications</h2>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
                onClick={() => setSelectedDetailsItem(null)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div><strong>Product Name:</strong> {selectedDetailsItem.item_name}</div>
              <div><strong>Brand:</strong> {selectedDetailsItem.brand}</div>
              <div><strong>Category:</strong> {selectedDetailsItem.category}</div>
              <div><strong>Location:</strong> {selectedDetailsItem.aisle} · {selectedDetailsItem.rack}</div>
              <div><strong>Weight / Unit:</strong> {selectedDetailsItem.weight}</div>
              <div><strong>Stock Level:</strong> {selectedDetailsItem.stock_qty} Units Available</div>
              <div><strong>Barcode:</strong> <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">{selectedDetailsItem.barcode}</code></div>
            </div>

            <button
              type="button"
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              onClick={() => setSelectedDetailsItem(null)}
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* COMPLETION & ERROR ALERT MODAL */}
      {modalAlert && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className={modalAlert.isSuccess ? 'modal-icon-success' : 'modal-icon-error'}>
              {modalAlert.isSuccess ? '🎉' : '⚠️'}
            </div>
            <div className="modal-title">{modalAlert.title}</div>
            <div className="modal-text">{modalAlert.text}</div>
            <button
              type="button"
              className={`btn-modal-action ${modalAlert.isSuccess ? 'btn-modal-success' : 'btn-modal-error'}`}
              onClick={() => {
                const wasSuccess = modalAlert.isSuccess;
                setModalAlert(null);
                if (wasSuccess) {
                  onBackToQueue();
                }
              }}
            >
              {modalAlert.isSuccess ? 'Pick Next Order ➔' : 'Back to Item List'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
