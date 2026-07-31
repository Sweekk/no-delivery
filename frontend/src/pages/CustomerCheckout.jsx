import React, { useState, useEffect } from 'react';
import './CustomerCheckout.css';

// Helper to generate standard mock UUIDs for Postgres insertion compatibility
const generateUUID = () => {
  return 'e0000000-0000-0000-0000-' + Math.floor(1e11 + Math.random() * 9e11);
};

const MOCK_PRODUCTS = [
  { name: 'Organic Bananas 6pcs', price: 60, uuid: 'e0000001-0000-0000-0000-000000000001' },
  { name: 'Amul Taaza Toned Milk 1L', price: 54, uuid: 'e0000002-0000-0000-0000-000000000002' },
  { name: 'Whole Wheat Bread 400g', price: 45, uuid: 'e0000003-0000-0000-0000-000000000003' },
  { name: 'Fortune Sunflower Oil 1L', price: 135, uuid: 'e0000004-0000-0000-0000-000000000004' },
  { name: 'Doritos Nacho Cheese 150g', price: 90, uuid: 'e0000005-0000-0000-0000-000000000005' },
  { name: 'Fresh Tomatoes 1kg', price: 40, uuid: 'e0000006-0000-0000-0000-000000000006' }
];

export default function CustomerCheckout() {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedSubRule, setSelectedSubRule] = useState('ask');
  const [activeTab, setActiveTab] = useState('shop');
  
  // Placed Orders & Tracking
  const [orderList, setOrderList] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  
  // Notification / Alert Banner
  const [notification, setNotification] = useState(null);

  // Fetch stores on mount
  useEffect(() => {
    async function loadStores() {
      try {
        const res = await fetch('/api/customer/stores');
        if (res.ok) {
          const data = await res.json();
          setStores(data);
          if (data.length > 0) setSelectedStoreId(data[0].store_id);
        }
      } catch (err) {
        console.error('Error fetching stores:', err);
      }
    }
    loadStores();
  }, []);

  // Poll order status if tracking an active order
  useEffect(() => {
    if (!selectedOrderId || activeTab !== 'track') return;
    
    let isMounted = true;
    async function pollOrder() {
      try {
        const res = await fetch(`/api/customer/order/${selectedOrderId}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setActiveOrder(data);
        }
      } catch (err) {
        console.error('Error polling order:', err);
      }
    }

    pollOrder();
    const interval = setInterval(pollOrder, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedOrderId, activeTab]);

  const handleAddToCart = () => {
    if (!selectedProductId) return;
    const prod = MOCK_PRODUCTS.find(p => p.uuid === selectedProductId);
    if (!prod) return;

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.item_id === prod.uuid);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].qty_requested += selectedQty;
        return updated;
      }
      return [...prev, {
        item_id: prod.uuid,
        name: prod.name,
        price: prod.price,
        qty_requested: selectedQty,
        sub_rules: selectedSubRule
      }];
    });

    setNotification({ type: 'success', message: `Added ${prod.name} (x${selectedQty}) to cart.` });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRemoveFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.qty_requested), 0);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty! Please add items first.');
      return;
    }

    try {
      const payload = {
        store_id: selectedStoreId || 's0000001-0000-0000-0000-000000000001',
        total_amount: calculateSubtotal() + 30, // Cart + delivery fee
        items: cart.map(item => ({
          item_id: item.item_id,
          qty_requested: item.qty_requested,
          sub_rules: item.sub_rules
        }))
      };

      const res = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Order creation failed');
      const data = await res.json();

      setCart([]);
      setSelectedOrderId(data.order_id);
      setActiveTab('track');
      setNotification({ type: 'success', message: `Order #${data.order_id.substring(0, 8)} placed successfully!` });
      setTimeout(() => setNotification(null), 4000);

      // Refresh Order History
      fetchOrdersList();
    } catch (err) {
      console.error(err);
      alert('Could not place order. Please try again.');
    }
  };

  const fetchOrdersList = async () => {
    try {
      const res = await fetch('/api/customer/orders');
      if (res.ok) {
        const data = await res.json();
        setOrderList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-orders') {
      fetchOrdersList();
    }
  }, [activeTab]);

  const handleResolveSubstitution = async (listId, action, replacementId) => {
    try {
      const res = await fetch('/api/substitution/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          list_id: listId,
          action: action, // 'substitute' or 'skip'
          replacement_item_id: replacementId
        })
      });

      if (res.ok) {
        setNotification({ type: 'success', message: `Substitution choice updated successfully!` });
        setTimeout(() => setNotification(null), 3000);
        // Force refresh active order
        const orderRes = await fetch(`/api/customer/order/${selectedOrderId}`);
        if (orderRes.ok) setActiveOrder(await orderRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setActiveTab('track');
  };

  const getStatusStepClass = (currentStatus, stepStatus) => {
    const statusOrder = ['PENDING', 'PICKING', 'AWAITING_SUBSTITUTION', 'FINALIZED', 'ASSIGNED', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepStatus);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'current';
    return 'pending';
  };

  const getProductNameByUUID = (uuid) => {
    const p = MOCK_PRODUCTS.find(item => item.uuid === uuid);
    return p ? p.name : uuid;
  };

  return (
    <div className="customer-page">
      {/* HEADER */}
      <header className="customer-page-header">
        <p>QuickFix Grocery</p>
        <h1>Customer Store Front & Reorder Workspace</h1>
        <span>Shop local dark stores, manage item substitution rules, and track live order progress.</span>
      </header>

      {/* NOTIFICATION BANNER */}
      {notification && (
        <div className={`notification-banner ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* TAB NAVIGATION */}
      <nav className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => setActiveTab('shop')}
        >
          🛒 Shop & Checkout
        </button>
        <button 
          className={`tab-btn ${activeTab === 'track' ? 'active' : ''}`}
          onClick={() => setActiveTab('track')}
        >
          📦 Track Order {selectedOrderId ? `(#${selectedOrderId.substring(0, 6)})` : ''}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'my-orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-orders')}
        >
          📋 Order History
        </button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <section className="customer-content">
        
        {/* SHOPPING TAB */}
        {activeTab === 'shop' && (
          <div className="shop-tab">
            <div className="store-selector-card">
              <label>
                <strong>Select Store Location:</strong>
                <select 
                  value={selectedStoreId} 
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="input-select"
                >
                  {stores.length > 0 ? (
                    stores.map(s => (
                      <option key={s.store_id} value={s.store_id}>{s.name} ({s.location})</option>
                    ))
                  ) : (
                    <option value="s0000001-0000-0000-0000-000000000001">Koramangala Dark Store Hub</option>
                  )}
                </select>
              </label>
            </div>

            <div className="shop-grid">
              {/* Product Catalog Card */}
              <div className="product-catalog-card">
                <h3>Add Grocery Item</h3>
                <div className="form-group">
                  <label>Select Item:</label>
                  <select 
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="input-select"
                  >
                    <option value="">-- Choose Product --</option>
                    {MOCK_PRODUCTS.map(p => (
                      <option key={p.uuid} value={p.uuid}>{p.name} - ₹{p.price}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity:</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={selectedQty} 
                      onChange={(e) => setSelectedQty(parseInt(e.target.value) || 1)}
                      className="input-number"
                    />
                  </div>

                  <div className="form-group">
                    <label>If Item is Out of Stock:</label>
                    <select 
                      value={selectedSubRule}
                      onChange={(e) => setSelectedSubRule(e.target.value)}
                      className="input-select"
                    >
                      <option value="ask">Ask Me First (Send Alert)</option>
                      <option value="substitute_any">Auto-Substitute Best Match</option>
                      <option value="no_substitute">Do Not Substitute (Refund Item)</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="button" 
                  className="btn-add-cart"
                  onClick={handleAddToCart}
                  disabled={!selectedProductId}
                >
                  + Add to Basket
                </button>
              </div>

              {/* Cart & Checkout Summary */}
              <div className="cart-summary-card">
                <h3>Basket Summary ({cart.length} items)</h3>
                
                {cart.length === 0 ? (
                  <div className="empty-cart-state">
                    <span>🛒</span>
                    <p>Your basket is empty. Select items on the left to add.</p>
                  </div>
                ) : (
                  <div className="cart-items-list">
                    {cart.map((item, idx) => (
                      <div key={idx} className="cart-item-row">
                        <div className="item-info">
                          <strong>{item.name}</strong>
                          <span>Qty: {item.qty_requested} · Rule: <em>{item.sub_rules}</em></span>
                        </div>
                        <div className="item-price">
                          ₹{item.price * item.qty_requested}
                          <button 
                            type="button" 
                            className="btn-remove-item"
                            onClick={() => handleRemoveFromCart(idx)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="cart-totals">
                      <div className="total-row">
                        <span>Items Subtotal:</span>
                        <span>₹{calculateSubtotal()}</span>
                      </div>
                      <div className="total-row">
                        <span>Delivery Fee:</span>
                        <span>₹30</span>
                      </div>
                      <div className="total-row grand-total">
                        <span>Grand Total:</span>
                        <span>₹{calculateSubtotal() + 30}</span>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      className="btn-place-order"
                      onClick={handlePlaceOrder}
                    >
                      Place Order & Start Fulfillment →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ORDER TRACKING TAB */}
        {activeTab === 'track' && (
          <div className="track-tab">
            {!selectedOrderId ? (
              <div className="empty-orders-state">
                <span>📍</span>
                <h3>No Order Selected for Tracking</h3>
                <p>Place an order or choose an active order from "Order History" to view real-time status.</p>
              </div>
            ) : !activeOrder ? (
              <div className="empty-orders-state">
                <h3>Loading order details...</h3>
              </div>
            ) : (
              <div className="active-order-dashboard">
                
                {/* Order Summary Header */}
                <div className="order-dashboard-header">
                  <div>
                    <h3>Order #{activeOrder.order_id.substring(0, 8)}</h3>
                    <span>Placed on {new Date(activeOrder.order_date).toLocaleString()}</span>
                  </div>
                  <div className="order-dashboard-status">
                    Status: <span className={`status-tag ${activeOrder.order_status}`}>{activeOrder.order_status}</span>
                  </div>
                </div>

                {/* Tracking Stepper */}
                <div className="stepper-container">
                  <div className="stepper">
                    <div className={`step ${getStatusStepClass(activeOrder.order_status, 'PENDING')}`}>
                      <div className="step-circle">1</div>
                      <div className="step-label">Placed</div>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${getStatusStepClass(activeOrder.order_status, 'PICKING')}`}>
                      <div className="step-circle">2</div>
                      <div className="step-label">Picking</div>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${getStatusStepClass(activeOrder.order_status, 'AWAITING_SUBSTITUTION')}`}>
                      <div className="step-circle">3</div>
                      <div className="step-label">Substitutions</div>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${getStatusStepClass(activeOrder.order_status, 'FINALIZED')}`}>
                      <div className="step-circle">4</div>
                      <div className="step-label">Finalized</div>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${getStatusStepClass(activeOrder.order_status, 'ASSIGNED')}`}>
                      <div className="step-circle">5</div>
                      <div className="step-label">Dispatched</div>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${getStatusStepClass(activeOrder.order_status, 'DELIVERED')}`}>
                      <div className="step-circle">6</div>
                      <div className="step-label">Delivered</div>
                    </div>
                  </div>
                </div>

                {/* Substitution Alert Resolution Section */}
                {activeOrder.order_status === 'AWAITING_SUBSTITUTION' && (
                  <div className="substitution-resolution-banner">
                    <div className="sub-banner-header">
                      <span>⚠️ ACTION REQUIRED</span>
                      <h4>Choose replacement options for unavailable items</h4>
                    </div>
                    
                    <div className="resolution-items-grid">
                      {activeOrder.items?.filter(item => item.status === 'awaiting_customer').map(item => (
                        <div key={item.list_id} className="resolution-item-card">
                          <div className="resolution-card-body">
                            <div className="item-side">
                              <span className="badge-missing">Unavailable</span>
                              <strong>{getProductNameByUUID(item.item_id)}</strong>
                              <span>Qty: {item.qty_requested}</span>
                            </div>
                            <div className="replacement-arrow">➔</div>
                            <div className="item-side">
                              <span className="badge-replacement">Suggested Sub</span>
                              <strong>{item.replacement_item_id || 'Alternative Item'}</strong>
                            </div>
                          </div>
                          <div className="resolution-card-actions">
                            <button
                              type="button"
                              className="btn-resolve btn-sub"
                              onClick={() => handleResolveSubstitution(item.list_id, 'substitute', item.replacement_item_id)}
                            >
                              Accept Substitution
                            </button>
                            <button
                              type="button"
                              className="btn-resolve btn-skip"
                              onClick={() => handleResolveSubstitution(item.list_id, 'skip', null)}
                            >
                              Refund / Skip Item
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items Summary Details List */}
                <div className="order-items-summary">
                  <h4>Ordered items details</h4>
                  <div className="summary-list">
                    {activeOrder.items?.map(item => (
                      <div key={item.list_id} className="summary-item-row">
                        <div className="item-main">
                          <strong>{getProductNameByUUID(item.item_id)}</strong>
                          <span>Quantity: {item.qty_requested} · Substitution rule: {item.sub_rules}</span>
                        </div>
                        <div className="item-status">
                          <span className={`item-status-pill ${item.status}`}>
                            {item.status || 'PENDING'}
                          </span>
                          {item.replacement_item_id && item.status !== 'awaiting_customer' && (
                            <span className="replacement-note">Replaced: {item.replacement_item_id}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* MY ORDERS LIST TAB */}
        {activeTab === 'my-orders' && (
          <div className="my-orders-tab">
            <h2>Order History</h2>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Select any order below to track its real-time fulfillment status.
            </p>

            {orderList.length === 0 ? (
              <div className="empty-orders-state">
                <span>📋</span>
                <p>No orders placed yet. Switch to "Shop & Checkout" to place your first grocery order.</p>
              </div>
            ) : (
              <div className="orders-table">
                {orderList.map(order => (
                  <article key={order.order_id} className="history-order-card">
                    <div className="history-main">
                      <div>
                        <strong>{order.store_name}</strong>
                        <span>Order Date: {new Date(order.order_date).toLocaleString()}</span>
                      </div>
                      <span className="history-price">₹{order.total_amount}</span>
                    </div>
                    <button 
                      type="button" 
                      className="btn-track-order" 
                      onClick={() => handleSelectOrder(order.order_id)}
                    >
                      Track Order ➔
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

      </section>
    </div>
  );
}
