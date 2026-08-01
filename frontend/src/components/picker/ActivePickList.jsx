import React, { useState, useEffect } from 'react';
import CompletionFooter from './CompletionFooter';
import './PickerUI.css';

export default function ActivePickList({ orderId, onBackToQueue }) {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastError, setToastError] = useState(null);
  const [modalAlert, setModalAlert] = useState(null); // { title, text, isSuccess }
  const [isCompleting, setIsCompleting] = useState(false);

  // Fetch Order details and items with 5-second short polling (Step D)
  useEffect(() => {
    let isMounted = true;
    async function loadOrderData(isBackground = false) {
      if (!isBackground) setLoading(true);
      try {
        const res = await fetch(`/api/picker/order/${orderId}`);
        const data = await res.json();

        if (isMounted) {
          if (res.ok && data && (data.order_id || Array.isArray(data.items) || data.success)) {
            setOrder({
              display_name: data.display_name || data.customer_name || `Order #${orderId.substring(0, 8)}`,
              store_name: data.store_name || 'QuickFIx Grocery Store'
            });
            setItems(data.items || []);
          } else if (!isBackground) {
            showToast('Failed to load order items.');
          }
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        if (isMounted && !isBackground) showToast('Network error loading order.');
      } finally {
        if (isMounted && !isBackground) setLoading(false);
      }
    }

    loadOrderData(false);

    // Poll every 5 seconds for status changes (Step D: unlock item when customer responds)
    const interval = setInterval(() => {
      loadOrderData(true);
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId]);

  const showToast = (message) => {
    setToastError(message);
    setTimeout(() => setToastError(null), 4500);
  };

  // Optimistic Item Status Update
  const handleUpdateStatus = async (listId, newStatus, replacementId = null) => {
    // Save previous state for rollback on API failure
    const prevItems = [...items];

    // Optimistically update local UI state immediately
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

    // Fire PATCH request in background
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
        // Revert state on failure & inform picker
        setItems(prevItems);
        showToast(`Failed to update item status: ${resData.error || resData.message || 'Server error'}`);
      }
    } catch (err) {
      // Revert state on network drop
      setItems(prevItems);
      showToast('Connection error! Could not sync item status to backend.');
    }
  };

  // Step A: Tapping "Not Found"
  const handleNotFoundClick = (item) => {
    // If sub_rules === 'ask', send { status: "awaiting_customer" }
    const targetStatus = item.sub_rules === 'ask' ? 'awaiting_customer' : 'not_found';
    handleUpdateStatus(item.list_id, targetStatus);
  };

  // Complete Order Gate Handler
  const handleCompleteOrder = async () => {
    const pendingCount = items.filter((i) => i.status === 'pending').length;
    const awaitingCount = items.filter((i) => i.status === 'awaiting_customer').length;

    // Client-side gate check
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
        // HTTP 400 or other error
        setModalAlert({
          title: '⚠️ Order Completion Error',
          text: data.error || 'Failed to complete order. Please check item statuses.',
          isSuccess: false
        });
      }
    } catch (err) {
      showToast('Network error triggering order completion.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="picker-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0c831f' }}>
          Loading your pick list...
        </div>
      </div>
    );
  }

  return (
    <div className="picker-container">
      {/* CSS Keyframes for Spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Toast Error Popup */}
      {toastError && <div className="toast-error">⚠️ {toastError}</div>}

      {/* Header Info */}
      <div className="active-run-header">
        <div className="active-nav-row">
          <button type="button" className="btn-back" onClick={onBackToQueue}>
            ← Back to Queue
          </button>
          <span className="picker-badge">Store picker</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
              {order?.display_name || 'Grocery order'}
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              {order?.store_name || 'QuickFIx Grocery Store'}
            </p>
          </div>
          <div className="progress-summary">
            <span>{items.filter((i) => i.status !== 'pending' && i.status !== 'awaiting_customer').length} / {items.length} Picked</span>
          </div>
        </div>
      </div>

      {/* Item List */}
      <div className="item-list-container">
        {items.map((item) => {
          const isFound = item.status === 'found';
          const isNotFound = item.status === 'not_found';
          const isReplaced = item.status === 'replaced';
          const isAwaitingCustomer = item.status === 'awaiting_customer';

          return (
            <div key={item.list_id} className={`item-card status-${item.status}`}>
              <div className="item-top-row">
                <div>
                  <div className="item-title">{item.item_id}</div>
                  <div className="item-meta" style={{ marginTop: '0.3rem' }}>
                    {item.category && <span>Category: {item.category}</span>}
                    {item.aisle && <span className="aisle-tag">📍 {item.aisle}</span>}
                    {item.sub_rules && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.78rem', color: '#475569', background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '0.25rem' }}>
                        Rule: {item.sub_rules}
                      </span>
                    )}
                  </div>
                </div>

                <div className="item-qty-badge">
                  {item.qty_requested} {item.qty_requested === 1 ? 'Unit' : 'Units'} Req
                </div>
              </div>

              {/* Display replacement tag if status is replaced */}
              {isReplaced && item.replacement_item_id && (
                <div className="replacement-badge" style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', color: '#1e40af', fontSize: '0.85rem' }}>
                  🔄 Substituted with: <strong>{item.replacement_item_id}</strong>
                </div>
              )}

              {/* Status Action Area */}
              <div className="status-action-row" style={{ marginTop: '0.75rem' }}>
                {isAwaitingCustomer ? (
                  <div className="awaiting-customer-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1rem', borderRadius: '0.6rem', background: '#fffbeb', border: '1px solid #fcd34d', color: '#b45309', fontWeight: 600, fontSize: '0.9rem', width: '100%' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #b45309', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span>Waiting on Customer...</span>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`btn-status btn-found ${isFound ? 'active' : ''}`}
                      onClick={() => handleUpdateStatus(item.list_id, 'found')}
                      style={{ flex: 1 }}
                    >
                      <span>🟩</span>
                      <span>{isFound ? 'Found ✓' : 'Found'}</span>
                    </button>

                    <button
                      type="button"
                      className={`btn-status btn-not-found ${isNotFound ? 'active' : ''}`}
                      onClick={() => handleNotFoundClick(item)}
                      style={{ flex: 1 }}
                    >
                      <span>🟥</span>
                      <span>{isNotFound ? 'Not Found ✗' : 'Not Found'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Screen C: Sticky Footer */}
      <CompletionFooter
        items={items}
        onComplete={handleCompleteOrder}
        isCompleting={isCompleting}
      />

      {/* Completion & Error Alert Modal */}
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
