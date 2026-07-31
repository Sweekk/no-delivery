import React, { useState, useEffect } from 'react';
import CompletionFooter from './CompletionFooter';
import './PickerUI.css';

export default function ActivePickList({ orderId, onBackToQueue }) {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [substituteInputs, setSubstituteInputs] = useState({}); // { [list_id]: string }
  const [activeSubstituteId, setActiveSubstituteId] = useState(null); // list_id currently editing sub
  const [toastError, setToastError] = useState(null);
  const [modalAlert, setModalAlert] = useState(null); // { title, text, isSuccess }
  const [isCompleting, setIsCompleting] = useState(false);

  // Fetch Order details and items
  useEffect(() => {
    let isMounted = true;
    async function loadOrderData() {
      setLoading(true);
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
          } else {
            showToast('Failed to load order items.');
          }
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        if (isMounted) showToast('Network error loading order.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOrderData();
    return () => {
      isMounted = false;
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
            replacement_item_id: newStatus === 'replaced' ? replacementId : null
          };
        }
        return item;
      })
    );

    // Clear active substitute editing mode if set
    if (activeSubstituteId === listId && newStatus !== 'replaced') {
      setActiveSubstituteId(null);
    }

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

  const handleSubstituteClick = (listId) => {
    if (activeSubstituteId === listId) {
      setActiveSubstituteId(null);
    } else {
      setActiveSubstituteId(listId);
    }
  };

  const handleConfirmSubstitute = (listId) => {
    const inputVal = substituteInputs[listId]?.trim();
    if (!inputVal) {
      showToast('Please enter a replacement product name.');
      return;
    }
    handleUpdateStatus(listId, 'replaced', inputVal);
    setActiveSubstituteId(null);
  };

  // Complete Order Gate Handler
  const handleCompleteOrder = async () => {
    const pendingCount = items.filter((i) => i.status === 'pending').length;

    // Client-side gate check
    if (pendingCount > 0) {
      setModalAlert({
        title: '⚠️ Incomplete Pick List',
        text: `There ${pendingCount === 1 ? 'is' : 'are'} still ${pendingCount} pending item${pendingCount === 1 ? '' : 's'} on this pick list. Please mark every single item as Found 🟩, Not Found 🟥, or Substitute 🟨 before completing.`,
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
            <span>{items.filter((i) => i.status !== 'pending').length} / {items.length} Picked</span>
          </div>
        </div>
      </div>

      {/* Item List (Screen B) */}
      <div className="item-list-container">
        {items.map((item) => {
          const isPending = item.status === 'pending';
          const isFound = item.status === 'found';
          const isNotFound = item.status === 'not_found';
          const isReplaced = item.status === 'replaced';
          const isEditingSub = activeSubstituteId === item.list_id;

          return (
            <div key={item.list_id} className={`item-card status-${item.status}`}>
              <div className="item-top-row">
                <div>
                  {/* Display item_id and requested quantity as required */}
                  <div className="item-title">{item.item_id}</div>
                  <div className="item-meta" style={{ marginTop: '0.3rem' }}>
                    {item.category && <span>Category: {item.category}</span>}
                    {item.aisle && <span className="aisle-tag">📍 {item.aisle}</span>}
                  </div>
                </div>

                <div className="item-qty-badge">
                  {item.qty_requested} {item.qty_requested === 1 ? 'Unit' : 'Units'} Req
                </div>
              </div>

              {/* Display replacement tag if status is replaced */}
              {isReplaced && item.replacement_item_id && (
                <div className="replacement-badge">
                  🟨 Substituted with: <strong>{item.replacement_item_id}</strong>
                </div>
              )}

              {/* 3-Button Row Interaction Design */}
              <div className="status-action-row">
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
                  onClick={() => handleUpdateStatus(item.list_id, 'not_found')}
                >
                  <span>🟥</span>
                  <span>{isNotFound ? 'Not Found ✗' : 'Not Found'}</span>
                </button>

                <button
                  type="button"
                  className={`btn-status btn-substitute ${isReplaced || isEditingSub ? 'active' : ''}`}
                  onClick={() => handleSubstituteClick(item.list_id)}
                >
                  <span>🟨</span>
                  <span>{isReplaced ? 'Substituted ✎' : 'Substitute'}</span>
                </button>
              </div>

              {/* Dynamic Text Input Field (Appears ONLY when Substitute/Replaced is clicked/selected) */}
              {(isEditingSub || (isReplaced && !item.replacement_item_id)) && (
                <div className="substitute-input-container">
                  <label htmlFor={`sub-input-${item.list_id}`} className="substitute-label">
                    Replacement product
                  </label>
                  <div className="substitute-row">
                    <input
                      id={`sub-input-${item.list_id}`}
                      type="text"
                      className="substitute-input"
                      placeholder="Enter the replacement product name"
                      value={substituteInputs[item.list_id] || item.replacement_item_id || ''}
                      onChange={(e) =>
                        setSubstituteInputs({
                          ...substituteInputs,
                          [item.list_id]: e.target.value
                        })
                      }
                    />
                    <button
                      type="button"
                      className="btn-confirm-sub"
                      onClick={() => handleConfirmSubstitute(item.list_id)}
                    >
                      Save Sub
                    </button>
                  </div>
                </div>
              )}
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
