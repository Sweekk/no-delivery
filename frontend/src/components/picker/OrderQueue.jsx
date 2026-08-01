import React, { useEffect, useState } from 'react';
import './PickerUI.css';

const orderLabel = (order) => order.display_name || (order.customer_name ? `${order.customer_name}'s grocery order` : 'Grocery order');

export default function OrderQueue({ onSelectOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/picker/orders');
      const data = await res.json();
      const orderList = Array.isArray(data) ? data : (data.orders || []);
      setOrders(orderList);
    } catch (err) {
      console.error('Error loading pending orders:', err);
      setError('Could not refresh the order queue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleClaim = async (orderId) => {
    try {
      await fetch(`/api/picker/order/${orderId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ picker_id: 'picker-101' }),
      });
    } catch (err) {
      console.warn('Claim request failed, proceeding to pick list:', err);
    }
    onSelectOrder(orderId);
  };

  return (
    <div className="picker-container">
      {/* Clean Hero Card (No gradient, no shine, natural forest green) */}
      <header className="picker-header">
        <div className="flex items-start gap-4">
          <div className="picker-hero-icon">
            <span style={{ fontSize: '1.25rem' }}>🛍️</span>
          </div>
          <div>
            <p className="eyebrow">QuickFix Grocery Delivery</p>
            <h1>Order queue</h1>
            <p>Choose an order to begin picking</p>
          </div>
        </div>
        <div className="picker-badge">Store picker</div>
      </header>

      {/* Heading Row with Refresh Action */}
      <div className="queue-heading-row">
        <div>
          <h2 className="queue-title">Pending orders</h2>
          <p className="queue-subtitle">Orders ready for fulfillment appear here.</p>
        </div>
        <button type="button" className="btn-refresh" onClick={fetchOrders}>
          <span>🔄</span> Refresh
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading pending orders...</div>
      ) : error ? (
        <div className="queue-error">{error}</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <strong>No pending orders right now.</strong>
          <span>New orders will appear here automatically.</span>
        </div>
      ) : (
        <div className="queue-grid">
          {orders.map((order) => (
            <article key={order.order_id} className="order-card">
              <div>
                <div className="order-card-header">
                  <div className="order-name">{orderLabel(order)}</div>
                  <span className={order.order_status === 'picking_in_progress' ? 'status-pill-picking' : 'status-pill-pending'}>
                    {order.order_status === 'picking_in_progress' ? 'In progress' : 'Ready to pick'}
                  </span>
                </div>

                <div className="order-card-body">
                  <div className="order-store-name">{order.store_name || 'FreshPoint Store'}</div>
                  <div className="order-items-meta">{order.item_count ? `${order.item_count} items` : 'Multiple items'}</div>
                  {order.total_amount ? (
                    <div className="order-price">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.total_amount)}
                    </div>
                  ) : null}
                </div>

                <div className="order-card-divider"></div>

                <div className="order-card-footer-meta">
                  <span>🕒 10 min ago</span>
                  <span>📍 2.4 km</span>
                </div>
              </div>

              <button type="button" className="btn-claim" onClick={() => handleClaim(order.order_id)}>
                Start picking
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
