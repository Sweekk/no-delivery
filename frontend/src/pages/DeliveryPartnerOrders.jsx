import React, { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';

export default function DeliveryPartnerOrders({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorNotice, setErrorNotice] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      setErrorNotice(null);
      try {
        const response = await fetch('/api/delivery/orders');
        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : (data.orders || []));
      } catch (err) {
        console.warn('Backend API notice:', err);
        setErrorNotice('Backend orders endpoint GET /api/delivery/orders is not active yet.');
        setOrders([]); // Clean empty state - NO mock orders
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (o.id && o.id.toLowerCase().includes(q)) ||
      (o.storeName && o.storeName.toLowerCase().includes(q)) ||
      (o.address && o.address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar
        currentRoute="delivery-orders"
        onNavigate={onNavigate}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Delivery Orders</h1>
            <p className="text-xs text-gray-500">View real customer orders assigned to your delivery route</p>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'} Assigned
          </span>
        </div>

        {errorNotice && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs font-medium">
            Note: {errorNotice}
          </div>
        )}

        {/* Orders Cards List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-xs text-gray-400">
            Fetching order details from backend...
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty state - Zero dummy/mock data */
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400 font-black text-2xl">
              📋
            </div>
            <h2 className="text-base font-bold text-gray-800">No active deliveries</h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              You have no assigned orders at this time. Once a customer places an order on QuickFix Grocery, order detail cards will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                
                {/* Card Header: Order ID & Status */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Order Reference</span>
                    <span className="font-mono text-base font-black text-gray-900">{order.id}</span>
                  </div>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full">
                    {order.status || 'Ready for Delivery'}
                  </span>
                </div>

                {/* Store Name & Delivery Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  <div>
                    <span className="font-bold text-gray-900 block">Pickup Dark Store:</span>
                    <span>{order.storeName || 'QuickFix Hub #1'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">Customer Delivery Address:</span>
                    <span>{order.address}</span>
                  </div>
                </div>

                {/* Item Availability List */}
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Item List & Availability Status
                  </h4>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden text-xs">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{item.name}</span>
                          <span className="text-gray-400">x{item.quantity || 1}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            item.available === false ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {item.available === false ? 'Unavailable' : 'Available'}
                          </span>
                          <span className="font-bold text-gray-900">₹{item.price || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotal Footer & Actions */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                  <div>
                    <span className="text-gray-500">Order Subtotal: </span>
                    <span className="font-black text-sm text-gray-900">₹{order.subtotal ?? order.total ?? order.totalAmount ?? order.total_amount ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate && onNavigate('report-issue')}
                      className="text-rose-600 hover:text-rose-700 font-bold hover:underline px-3 py-1.5 rounded-lg text-xs"
                    >
                      Report Issue
                    </button>
                    <button
                      onClick={() => alert(`Navigating to route for Order #${order.id}`)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition-colors"
                    >
                      Start Delivery
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
