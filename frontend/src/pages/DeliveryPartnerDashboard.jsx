import React, { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import LiveLocationMap from '../components/delivery/LiveLocationMap';

export default function DeliveryPartnerDashboard({ onNavigate, onLogout }) {
  const [partnerZone] = useState('Central Metro Zone');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiError, setApiError] = useState(null);

  // Fetch real order data from backend API
  useEffect(() => {
    async function fetchDeliveryData() {
      setLoading(true);
      setApiError(null);
      try {
        const response = await fetch('/api/delivery/orders');
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : (data.orders || []));
      } catch (err) {
        console.warn('Backend API fetch notice:', err);
        setApiError('GET /api/delivery/orders is ready on backend.');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDeliveryData();
  }, []);

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (order.id && order.id.toLowerCase().includes(query)) ||
      (order.address && order.address.toLowerCase().includes(query)) ||
      (order.customerName && order.customerName.toLowerCase().includes(query))
    );
  });

  const activeOrder = orders.find(o => o.status !== 'Delivered' && o.status !== 'Cancelled');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Dedicated Delivery Partner Navbar */}
      <Navbar
        currentRoute="delivery-dashboard"
        onNavigate={onNavigate}
        partnerZone={partnerZone}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onLogout={onLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Active Delivery Banner */}
        {activeOrder ? (
          <div className="bg-emerald-700 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-800 text-emerald-100 text-xs font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
                  Active Delivery In-Progress
                </span>
                <span className="text-xs font-bold text-emerald-200">
                  ID: {activeOrder.id}
                </span>
              </div>
              <h2 className="text-xl font-black">Stage: {activeOrder.status || 'Out for Delivery'}</h2>
              <p className="text-xs text-emerald-100">
                Drop Location: {activeOrder.address || 'Assigned Address'}
              </p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('delivery-orders')}
              className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs px-5 py-3 rounded-xl transition-colors shrink-0 shadow-sm"
            >
              View Order Details &rarr;
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                !
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-800">No Active Delivery Banner</h3>
                <p className="text-xs text-gray-500">You currently have no order in flight. Waiting for new customer orders.</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl">
              Status: Available for Assignments
            </span>
          </div>
        )}

        {/* Live Location Map Section (Red destination pin rendered ONLY when activeOrder exists) */}
        <LiveLocationMap
          hasActiveOrder={!!activeOrder}
          destinationAddress={activeOrder ? activeOrder.address : ""}
          destinationCoords={activeOrder?.coords || null}
        />

        {/* Orders List Queue */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-900">Assigned Delivery Queue</h2>
              <p className="text-xs text-gray-500">Real-time backend orders for your zone</p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('delivery-orders')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Full Orders View &rarr;
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-xs text-gray-400">
              Loading orders from backend server...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400 font-bold text-lg">
                📦
              </div>
              <h3 className="font-bold text-gray-800 text-sm">No orders yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No customer orders have been assigned to your queue. New orders placed on QuickFix Grocery will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-sm">Order #{order.id}</span>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                      {order.status || 'Assigned'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><strong>Store:</strong> {order.storeName || 'QuickFix Dark Store'}</p>
                    <p><strong>Deliver To:</strong> {order.address}</p>
                    <p><strong>Subtotal:</strong> ₹{order.subtotal || order.total || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
