import React, { useEffect, useState } from 'react';
import './PickerUI.css';

const orderLabel = (order) => order.display_name || (order.customer_name ? `${order.customer_name}'s grocery order` : 'Grocery order');

const playNotificationChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.log('Audio chime unavailable:', e);
  }
};

export default function OrderQueue({ onSelectOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newOrderNotice, setNewOrderNotice] = useState(null);

  const fetchOrders = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/picker/orders', { cache: 'no-store' });
      const data = await res.json();
      const orderList = Array.isArray(data) ? data : (data.orders || []);
      
      setOrders(prev => {
        if (isBackground && orderList.length > prev.length) {
          playNotificationChime();
          setNewOrderNotice(`🔔 New Order Received! Order #${(orderList[0]?.order_id || '').substring(0, 8)} placed.`);
          setTimeout(() => setNewOrderNotice(null), 5000);
        }
        return orderList;
      });
    } catch (err) {
      console.error('Error loading pending orders:', err);
      if (!isBackground) setError('Could not refresh the order queue. Please try again.');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(false);
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 2000);

    const handleCustomEvent = (e) => {
      fetchOrders(true);
      playNotificationChime();
      const orderId = e.detail?.order_id || '';
      setNewOrderNotice(`🔔 New Customer Order Received #${orderId.substring(0, 8)}!`);
      setTimeout(() => setNewOrderNotice(null), 5000);
    };

    window.addEventListener('new_order_placed', handleCustomEvent);

    let bc;
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel('quickfix_orders');
      bc.onmessage = (msg) => {
        if (msg.data?.type === 'NEW_ORDER') {
          fetchOrders(true);
          playNotificationChime();
          setNewOrderNotice(`🔔 New Customer Order Received!`);
          setTimeout(() => setNewOrderNotice(null), 5000);
        }
      };
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('new_order_placed', handleCustomEvent);
      if (bc) bc.close();
    };
  }, []);

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
      {/* Clean Hero Card */}
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

      {newOrderNotice && (
        <div className="p-4 mb-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 rounded-2xl flex items-center justify-between shadow-lg animate-bounce font-sans">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔔</span>
            <span className="font-semibold text-sm">{newOrderNotice}</span>
          </div>
          <button onClick={() => setNewOrderNotice(null)} className="text-emerald-400 font-bold hover:text-emerald-200">✕</button>
        </div>
      )}

      {/* Heading Row with Refresh Action */}
      <div className="queue-heading-row">
        <div>
          <h2 className="queue-title">Pending orders</h2>
          <p className="queue-subtitle">Orders ready for fulfillment appear here automatically.</p>
        </div>
        <button type="button" className="btn-refresh" onClick={() => fetchOrders(false)}>
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
          <span>New orders will appear here automatically when placed by customers.</span>
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
                  <span>🕒 Live Order</span>
                  <span>📍 Indiranagar Dark Store</span>
                </div>
              </div>

              <button type="button" className="btn-claim" onClick={() => handleClaim(order.order_id)}>
                Start picking (Check Present/Not Present)
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
