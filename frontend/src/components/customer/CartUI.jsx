import React, { useState, useEffect } from 'react';

const AVAILABLE_PRODUCTS = [
  { item_id: 'APPLE-FUJI-01', item_name: 'Fuji Apples (Organic)', default_price: 1.50, icon: '🍎' },
  { item_id: 'MILK-GAL-02', item_name: 'Fresh Milk (1 Gallon)', default_price: 4.99, icon: '🥛' },
  { item_id: 'BANANA-ORG-03', item_name: 'Organic Bananas (bundle)', default_price: 0.89, icon: '🍌' },
  { item_id: 'BREAD-WW-04', item_name: 'Whole Wheat Sourdough', default_price: 3.49, icon: '🍞' },
  { item_id: 'CEREAL-BOX-05', item_name: 'Honey Oat Cereal Box', default_price: 5.99, icon: '🥣' },
  { item_id: 'EGGS-DOZ-06', item_name: 'Pasture-Raised Eggs (Dozen)', default_price: 6.50, icon: '🥚' }
];

export default function CartUI() {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [customerId, setCustomerId] = useState('22222222-2222-2222-2222-222222222222');
  
  // Cart maps item_id -> { item_id, item_name, qty_requested, sub_rules, item_price, icon }
  const [cart, setCart] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorResult, setErrorResult] = useState(null);

  // Fetch stores on mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch('/api/customer/stores');
        if (!res.ok) throw new Error('Failed to load stores');
        const data = await res.json();
        setStores(data);
        if (data.length > 0) {
          setSelectedStoreId(data[0].store_id);
        }
      } catch (err) {
        console.error('Error fetching stores:', err);
      }
    };
    fetchStores();
  }, []);

  const generateRandomUUID = () => {
    // Generate a quick mock valid UUID
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    setCustomerId(uuid);
  };

  const handleAddItem = (product) => {
    setCart((prev) => {
      const existing = prev[product.item_id];
      return {
        ...prev,
        [product.item_id]: {
          item_id: product.item_id,
          item_name: product.item_name,
          qty_requested: existing ? existing.qty_requested + 1 : 1,
          sub_rules: existing ? existing.sub_rules : 'ask', // default rule
          item_price: product.default_price,
          icon: product.icon
        }
      };
    });
  };

  const handleRemoveItem = (productId) => {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      const updated = { ...prev };
      if (existing.qty_requested <= 1) {
        delete updated[productId];
      } else {
        updated[productId] = {
          ...existing,
          qty_requested: existing.qty_requested - 1
        };
      }
      return updated;
    });
  };

  const handleSubRuleChange = (productId, newRule) => {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      return {
        ...prev,
        [productId]: {
          ...existing,
          sub_rules: newRule
        }
      };
    });
  };

  // Calculate totals
  const cartItemsArray = Object.values(cart);
  const totalAmount = cartItemsArray.reduce((acc, curr) => acc + (curr.item_price * curr.qty_requested), 0);

  const handleCheckout = async () => {
    setIsSubmitting(true);
    setSuccessResult(null);
    setErrorResult(null);

    const payload = {
      store_id: selectedStoreId,
      customer_id: customerId,
      total_amount: parseFloat(totalAmount.toFixed(2)),
      items: cartItemsArray.map(item => ({
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

      const responseData = await res.json();

      if (!res.ok) {
        throw {
          status: res.status,
          message: responseData.message || responseData.error || 'Check checkout fields.'
        };
      }

      setSuccessResult({
        order_id: responseData.order_id,
        message: responseData.message,
        total: totalAmount
      });
      // Save order_id to localStorage for automatic tracking in the Review Substitutes module
      localStorage.setItem('active_order_id', responseData.order_id);
      // Clear cart on success
      setCart({});
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorResult({
        status: err.status || 500,
        message: err.message || 'Unable to connect to the backend server. Make sure it is running on port 5000.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success view
  if (successResult) {
    return (
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 max-w-2xl mx-auto shadow-2xl shadow-emerald-950/20 text-center animate-fade-in space-y-6">
        <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center text-3xl">
          ✓
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-100">Order Placed Successfully!</h2>
          <p className="text-slate-400 text-sm">Your order has been routed and initialized with database defaults.</p>
        </div>

        <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-5 text-left space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <span className="text-xs text-slate-400 font-medium">STATUS</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              pending_pick
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-400 block font-medium">ORDER ID</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm bg-slate-900 border border-slate-800 px-3 py-1.5 rounded text-indigo-300 w-full break-all">
                {successResult.order_id}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(successResult.order_id)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded border border-slate-700 text-slate-300 transition"
              >
                Copy
              </button>
            </div>
          </div>
          <div className="flex justify-between text-sm pt-2">
            <span className="text-slate-400">Total Charged:</span>
            <span className="font-bold text-slate-200 font-mono">${successResult.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => setSuccessResult(null)}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-sm font-medium border border-slate-700 transition"
          >
            Create Another Order
          </button>
          <button
            onClick={() => {
              window.location.hash = '#picker';
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/10 transition"
          >
            Go to Picker Run →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Product Selection Catalog */}
      <div className="lg:col-span-7 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            🛒 Store Catalog
          </h2>
          <p className="text-slate-400 text-sm mt-1">Browse groceries and add them to your cart.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AVAILABLE_PRODUCTS.map((prod) => {
            const inCart = cart[prod.item_id];
            const qty = inCart ? inCart.qty_requested : 0;
            return (
              <div 
                key={prod.item_id}
                className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 bg-slate-950/60 rounded-xl border border-slate-800">{prod.icon}</span>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-200">{prod.item_name}</h3>
                    <p className="text-xs text-indigo-400 font-mono font-medium">${prod.default_price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800/80">
                  <button 
                    onClick={() => handleRemoveItem(prod.item_id)}
                    className="h-7 w-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center transition"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-slate-100 font-mono">{qty}</span>
                  <button 
                    onClick={() => handleAddItem(prod)}
                    className="h-7 w-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center transition"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Configuration Panel */}
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Order Settings</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold block">SELECT STORE</label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 transition"
              >
                {stores.length === 0 ? (
                  <option value="">No stores found (run seeds)</option>
                ) : (
                  stores.map((s) => (
                    <option key={s.store_id} value={s.store_id}>
                      {s.store_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold block">CUSTOMER UUID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="Customer ID UUID"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 font-mono transition"
                />
                <button
                  onClick={generateRandomUUID}
                  type="button"
                  className="px-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-xs text-slate-300 font-medium transition"
                  title="Generate random UUID"
                >
                  🎲
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Summary Panel */}
      <div className="lg:col-span-5 space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-4">
          <span>📋 Checkout Summary</span>
          {cartItemsArray.length > 0 && (
            <span className="ml-auto bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold px-2 py-0.5 rounded-full">
              {cartItemsArray.length} items
            </span>
          )}
        </h2>

        {cartItemsArray.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <span className="text-4xl block opacity-40">🛒</span>
            <p className="text-slate-400 text-sm font-medium">Your checkout shopping cart is empty.</p>
            <p className="text-slate-500 text-xs">Add products from the catalog to configure substitution rules and place your order.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {cartItemsArray.map((item) => (
                <div key={item.item_id} className="p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-3.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <h4 className="font-semibold text-xs text-slate-200 leading-tight">{item.item_name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          Qty: {item.qty_requested} × ${item.item_price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-xs text-slate-300 font-mono">
                      ${(item.item_price * item.qty_requested).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800/40">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sub Rule:</label>
                    <select
                      value={item.sub_rules}
                      onChange={(e) => handleSubRuleChange(item.item_id, e.target.value)}
                      className="bg-transparent text-xs text-slate-200 border-none outline-none cursor-pointer focus:text-indigo-400 transition"
                    >
                      <option className="bg-slate-900 text-slate-200" value="ask">Ask Customer (ask)</option>
                      <option className="bg-slate-900 text-slate-200" value="auto">Auto Substitute (auto)</option>
                      <option className="bg-slate-900 text-slate-200" value="skip">Skip Item (skip)</option>
                      <option className="bg-slate-900 text-red-400 font-semibold" value="ignore">Deliberate Invalid (ignore - triggers 422)</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations & Submit */}
            <div className="border-t border-slate-800 pt-4 space-y-3.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Items Subtotal:</span>
                <span className="text-slate-200 font-mono">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Delivery Fee:</span>
                <span className="text-emerald-400 font-medium text-xs bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">FREE (Mock)</span>
              </div>
              <div className="flex justify-between items-center text-base pt-2 border-t border-slate-800">
                <span className="font-bold text-slate-100">Order Total:</span>
                <span className="font-bold text-indigo-400 font-mono text-lg">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Error alerts */}
            {errorResult && (
              <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-xl space-y-1.5 animate-fade-in">
                <div className="flex justify-between text-red-400 font-bold text-xs uppercase tracking-wider">
                  <span>Checkout Error ({errorResult.status})</span>
                  <button onClick={() => setErrorResult(null)} className="text-[10px] hover:text-white">✕</button>
                </div>
                <p className="text-red-200 text-xs leading-relaxed">{errorResult.message}</p>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={isSubmitting || !selectedStoreId}
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${
                !selectedStoreId
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : isSubmitting
                  ? 'bg-indigo-600/50 cursor-wait'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/10'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Checkout...</span>
                </div>
              ) : (
                'Place Order'
              )}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
