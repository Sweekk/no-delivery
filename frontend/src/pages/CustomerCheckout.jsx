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
        const res = await fetch(`/api/customer/order/${selectedOrderId}/status`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) {
          setActiveOrder(data);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }

    pollOrder();
    const interval = setInterval(pollOrder, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedOrderId, activeTab]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddToCart = () => {
    const product = MOCK_PRODUCTS.find(p => p.uuid === selectedProductId || p.name === selectedProductId);
    if (!product) {
      showNotification('Please select a product first', 'error');
      return;
    }

    // Check if product is already in cart
    const existingIndex = cart.findIndex(item => item.item_id === product.uuid);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].qty_requested += Number(selectedQty);
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          item_id: product.uuid,
          name: product.name,
          qty_requested: Number(selectedQty),
          sub_rules: selectedSubRule,
          item_price: product.price
        }
      ]);
    }

    showNotification(`Added ${product.name} to cart.`);
  };

  const handleRemoveFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const handlePlaceOrder = async () => {
    if (!selectedStoreId) {
      showNotification('Please select a store', 'error');
      return;
    }
    if (cart.length === 0) {
      showNotification('Your cart is empty', 'error');
      return;
    }

    const totalAmount = cart.reduce((sum, item) => sum + (item.item_price * item.qty_requested), 0);
    
    const payload = {
      store_id: selectedStoreId,
      customer_id: 'c1111111-1111-1111-1111-111111111111', // default customer UUID
      total_amount: totalAmount,
      items: cart.map(item => ({
        item_id: item.item_id,
        qty_requested: item.qty_requested,
        sub_rules: item.sub_rules,
        item_price: item.item_price
      }))
    };

    try {
      const res = await fetch('/api/customer/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.order_id) {
        showNotification('Order placed successfully! Redirecting to tracking...', 'success');
        setCart([]);
        
        // Add to local orders list
        const storeName = stores.find(s => s.store_id === selectedStoreId)?.store_name || 'Grocery Store';
        const newOrderRecord = {
          order_id: data.order_id,
          store_name: storeName,
          order_date: new Date().toISOString(),
          total_amount: totalAmount
        };
        setOrderList([newOrderRecord, ...orderList]);
        
        // Switch to track tab
        setSelectedOrderId(data.order_id);
        setActiveTab('track');
      } else {
        showNotification(data.message || 'Failed to place order', 'error');
      }
    } catch (err) {
      showNotification('Network error while placing order.', 'error');
    }
  };

  // Resolution Handler for Customer Substitutions
  const handleResolveSubstitution = async (listId, action, replacementId) => {
    try {
      const res = await fetch(`/api/customer/item/${listId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action, // 'skip' or 'substitute'
          replacement_item_id: action === 'substitute' ? (replacementId || generateUUID()) : null
        })
      });

      const data = await res.json();
      if (res.ok) {
        showNotification(`Successfully resolved item: ${action === 'skip' ? 'Skipped' : 'Substituted'}`);
        // Manually trigger a refresh of order details
        const refreshRes = await fetch(`/api/customer/order/${selectedOrderId}/status`);
        if (refreshRes.ok) {
          const freshData = await refreshRes.json();
          setActiveOrder(freshData);
        }
      } else {
        showNotification(data.message || 'Failed to resolve substitution', 'error');
      }
    } catch (err) {
      showNotification('Error resolving substitution.', 'error');
    }
  };

  const handleSelectOrder = async (orderId) => {
    setSelectedOrderId(orderId);
    setLoadingOrder(true);
    try {
      const res = await fetch(`/api/customer/order/${orderId}/status`);
      if (res.ok) {
        const data = await res.json();
        setActiveOrder(data);
        setActiveTab('track');
      } else {
        showNotification('Order detail not found', 'error');
      }
    } catch (err) {
      showNotification('Error loading order detail', 'error');
    } finally {
      setLoadingOrder(false);
    }
  };

  const getStatusStepClass = (currentStatus, targetStatus) => {
    const statuses = ['PENDING', 'PICKING', 'AWAITING_SUBSTITUTION', 'FINALIZED', 'ASSIGNED', 'DELIVERED'];
    const currentIndex = statuses.indexOf(String(currentStatus).toUpperCase());
    const targetIndex = statuses.indexOf(targetStatus);
    
    if (currentIndex === -1) return 'step-pending';
    if (currentIndex >= targetIndex) {
      return String(currentStatus).toUpperCase() === 'DELIVERED' || targetStatus === 'DELIVERED'
        ? 'step-completed-success'
        : 'step-completed';
    }
    return 'step-pending';
  };

  const getProductNameByUUID = (uuid) => {
    const prod = MOCK_PRODUCTS.find(p => p.uuid === uuid);
    return prod ? prod.name : `Product (${uuid.substring(0, 8)})`;
  };

  return (
    <div className="customer-page">
      {/* Toast Notification */}
      {notification && (
        <div className={`toast-notification ${notification.type}`}>
          {notification.type === 'success' ? '✓' : '⚠️'} {notification.message}
        </div>
      )}

      <header className="customer-page-header">
        <p>QuickFIx Grocery Delivery</p>
        <h1>Customer workspace</h1>
        <span>Place a grocery order and manage substitution requests.</span>
      </header>

      {/* Tabs Row */}
      <nav className="tab-navigation">
        <button 
          type="button" 
          className={`tab-btn ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => setActiveTab('shop')}
        >
          🛒 Shop & Checkout
        </button>
        <button 
          type="button" 
          className={`tab-btn ${activeTab === 'track' ? 'active' : ''}`}
          onClick={() => setActiveTab('track')}
        >
          📦 Track active order
        </button>
        <button 
          type="button" 
          className={`tab-btn ${activeTab === 'my-orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-orders')}
        >
          📋 My orders list
        </button>
      </nav>

      {/* Tab Contents */}
      <section className="tab-content-panel">
        
        {/* SHOP & CHECKOUT TAB */}
        {activeTab === 'shop' && (
          <div className="shop-tab">
            <div className="shop-grid">
              
              {/* Form panel */}
              <div className="shop-form">
                <h2>1. Select Store</h2>
                <div className="form-group">
                  <select 
                    value={selectedStoreId} 
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="select-input"
                  >
                    {stores.length === 0 ? (
                      <option value="">No stores available</option>
                    ) : (
                      stores.map(s => (
                        <option key={s.store_id} value={s.store_id}>
                          {s.store_name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <h2>2. Add items to cart</h2>
                <div className="form-group">
                  <label htmlFor="product-select">Select Product</label>
                  <select
                    id="product-select"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="select-input"
                  >
                    <option value="">-- Choose Grocery Product --</option>
                    {MOCK_PRODUCTS.map(p => (
                      <option key={p.uuid} value={p.uuid}>
                        {p.name} - ₹{p.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="item-settings-row">
                  <div className="form-group flex-1">
                    <label htmlFor="item-qty">Quantity</label>
                    <input 
                      id="item-qty"
                      type="number" 
                      min="1" 
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(e.target.value)}
                      className="text-input" 
                    />
                  </div>

                  <div className="form-group flex-2">
                    <label htmlFor="sub-rule-select">Substitution Rule</label>
                    <select
                      id="sub-rule-select"
                      value={selectedSubRule}
                      onChange={(e) => setSelectedSubRule(e.target.value)}
                      className="select-input"
                    >
                      <option value="ask">Ask Customer (Approval needed)</option>
                      <option value="auto">Auto Substitute (Best match)</option>
                      <option value="skip">Skip Item (Refund)</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="button" 
                  className="btn-add-item" 
                  onClick={handleAddToCart}
                >
                  ➕ Add to Cart
                </button>
              </div>

              {/* Cart panel */}
              <div className="shop-cart">
                <div className="cart-header">
                  <h2>Shopping Cart</h2>
                  <span className="cart-count">{cart.length} items</span>
                </div>

                {cart.length === 0 ? (
                  <div className="empty-cart-state">
                    <span>🛒</span>
                    <p>Your cart is empty. Add grocery items from the product panel.</p>
                  </div>
                ) : (
                  <div className="cart-items-list">
                    {cart.map((item, index) => (
                      <div key={item.item_id} className="cart-item-card">
                        <div className="cart-item-info">
                          <strong>{item.name}</strong>
                          <span>
                            {item.qty_requested} unit(s) · Rule: <span className="rule-badge">{item.sub_rules}</span>
                          </span>
                        </div>
                        <div className="cart-item-action">
                          <span className="item-price">₹{item.item_price * item.qty_requested}</span>
                          <button 
                            type="button" 
                            className="btn-remove"
                            onClick={() => handleRemoveFromCart(index)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="cart-totals">
                      <div className="total-row">
                        <span>Total amount</span>
                        <strong>₹{cart.reduce((sum, item) => sum + (item.item_price * item.qty_requested), 0)}</strong>
                      </div>
                      <button 
                        type="button" 
                        className="btn-checkout" 
                        onClick={handlePlaceOrder}
                      >
                        Place Order 🚀
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ACTIVE ORDER TRACKING TAB */}
        {activeTab === 'track' && (
          <div className="track-tab">
            {!selectedOrderId ? (
              <div className="empty-orders-state">
                <span>📦</span>
                <h3>No order selected for tracking</h3>
                <p>Place a new order or select an existing order from "My orders list" tab.</p>
                <button 
                  type="button" 
                  className="btn-link"
                  onClick={() => setActiveTab('my-orders')}
                >
                  View My Orders List
                </button>
              </div>
            ) : loadingOrder ? (
              <div className="loading-state">Loading active order updates...</div>
            ) : !activeOrder ? (
              <div className="empty-orders-state">
                <h3>Order not found</h3>
                <p>Could not retrieve order details for ID: {selectedOrderId}</p>
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
