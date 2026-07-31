import React, { useState, useEffect } from 'react';
import './DeliveryPartnerWorkspace.css';

export default function DeliveryPartnerWorkspace() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchReadyOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/driver/orders/ready');
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to fetch ready orders.');
      }
    } catch (err) {
      console.error('Error fetching ready orders:', err);
      setError('Connection error. Could not reach server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadyOrders();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDeliver = async (orderId) => {
    setProcessingId(orderId);
    try {
      const res = await fetch(`/api/driver/order/${orderId}/deliver`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (res.ok) {
        showNotification(`Order delivered successfully!`);
        // Refresh orders list
        await fetchReadyOrders();
      } else {
        showNotification(data.message || 'Delivery request failed.', 'error');
      }
    } catch (err) {
      showNotification('Network error finalizing delivery.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="delivery-page">
      {notification && (
        <div className={`toast-notification ${notification.type}`}>
          {notification.type === 'success' ? '✓' : '⚠️'} {notification.message}
        </div>
      )}

      <header className="delivery-page-header">
        <p className="eyebrow">QuickFIx Grocery Delivery</p>
        <h1>Delivery partner workspace</h1>
        <span>Manage assigned routes, active deliveries, and drop-off finalization.</span>
      </header>

      <div className="delivery-action-bar">
        <h2>Assigned Shipments Queue</h2>
        <button 
          type="button" 
          className="btn-refresh" 
          onClick={fetchReadyOrders}
          disabled={loading}
        >
          🔄 Refresh Queue
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading ready shipments...</div>
      ) : error ? (
        <div className="queue-error">{error}</div>
      ) : orders.length === 0 ? (
        <div className="empty-delivery-state">
          <span>🛵</span>
          <h3>No shipments assigned right now</h3>
          <p>We’ll notify you as soon as a finalized grocery order is ready for delivery partner pickup.</p>
        </div>
      ) : (
        <div className="delivery-grid">
          {orders.map((order) => (
            <article key={order.order_id} className="delivery-card">
              <div className="delivery-card-header">
                <div>
                  <span className="order-id-label">SHIPMENT ID</span>
                  <h3>#{order.order_id.substring(0, 8)}</h3>
                </div>
                <span className={`status-pill ${order.order_status}`}>
                  {order.order_status}
                </span>
              </div>

              <div className="delivery-card-body">
                <div className="detail-row">
                  <span>Store Pickup Location</span>
                  <strong>{order.store?.store_name || 'QuickFIx Grocery Store'}</strong>
                </div>
                <div className="detail-row">
                  <span>Date Placed</span>
                  <strong>{new Date(order.order_date).toLocaleString()}</strong>
                </div>
                <div className="detail-row">
                  <span>Total Bill Amount</span>
                  <strong className="delivery-amount">₹{order.total_amount || 0}</strong>
                </div>
              </div>

              <div className="delivery-card-actions">
                <button
                  type="button"
                  className="btn-deliver"
                  onClick={() => handleDeliver(order.order_id)}
                  disabled={processingId === order.order_id}
                >
                  {processingId === order.order_id ? 'Confirming Dropoff...' : '✅ Confirm Delivered'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
