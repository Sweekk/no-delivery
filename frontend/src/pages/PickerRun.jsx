import React, { useState, useEffect } from 'react';
import ActiveRunUI from '../components/picker/ActiveRunUI';

export default function PickerRun() {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/picker/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load orders. Please make sure the backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedOrderId) {
      fetchOrders();
    }
  }, [selectedOrderId]);

  const handleSelectOrder = async (orderId, currentStatus) => {
    try {
      // "such that when the receipt is clicked it is updated to order received"
      // Update status if it's currently 'pending'
      if (currentStatus === 'pending') {
        const updateRes = await fetch(`http://localhost:5000/api/picker/order/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'order received' })
        });
        if (!updateRes.ok) {
          console.error('Failed to update status in DB');
        }
      }
      setSelectedOrderId(orderId);
    } catch (err) {
      console.error('Error selecting order:', err);
      setSelectedOrderId(orderId);
    }
  };

  if (selectedOrderId) {
    return (
      <ActiveRunUI 
        orderId={selectedOrderId} 
        onBack={() => setSelectedOrderId(null)} 
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight font-sans">Active Picking Runs</h1>
          <p className="text-slate-400 mt-1 font-sans">Select an order receipt below to receive the order and start picking items.</p>
        </div>
        <button 
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-sm font-medium transition-all font-sans"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18m0 0V9m0-9h-2m-2 0H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2V7m6-4v2" /></svg>
          Refresh Lists
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 font-sans">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Fetching order receipts from the database...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-950/40 border border-red-900/60 rounded-2xl flex flex-col items-center text-center space-y-3 font-sans">
          <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center text-red-400 font-bold text-xl">!</div>
          <h3 className="font-semibold text-lg text-red-200">Database Connection Error</h3>
          <p className="text-slate-400 max-w-md text-sm">{error}</p>
          <button 
            onClick={fetchOrders}
            className="mt-2 px-4 py-2 bg-red-900 hover:bg-red-800 text-red-100 rounded-lg text-sm font-medium transition"
          >
            Retry Connection
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center space-y-3 font-sans">
          <p className="text-slate-400">No orders found in the database.</p>
          <p className="text-slate-500 text-sm">Create orders first, or use seed scripts to populate mock database runs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
          {orders.map((order) => {
            const formattedDate = new Date(order.order_date).toLocaleDateString(undefined, {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            });

            let statusBadge = (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans">
                Pending Pick
              </span>
            );
            let borderClass = "border-slate-800 hover:border-indigo-500/50 hover:shadow-indigo-500/5";
            let ribbonColor = "bg-amber-500";

            if (order.order_status === 'order received') {
              statusBadge = (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse font-sans">
                  Order Received
                </span>
              );
              borderClass = "border-blue-900/60 hover:border-blue-500/80 hover:shadow-blue-500/5";
              ribbonColor = "bg-blue-500";
            } else if (order.order_status === 'picked') {
              statusBadge = (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                  Picked
                </span>
              );
              borderClass = "border-slate-800 opacity-75 hover:opacity-100 hover:border-slate-700";
              ribbonColor = "bg-emerald-500";
            }

            return (
              <div 
                key={order.order_id}
                onClick={() => handleSelectOrder(order.order_id, order.order_status)}
                className={`relative flex flex-col justify-between p-6 bg-slate-900/40 border rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${borderClass}`}
              >
                <div className={`absolute top-0 left-0 w-2.5 h-1/3 rounded-tl-2xl rounded-bl-sm ${ribbonColor}`}></div>

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase font-mono">
                      RECEIPT #{order.order_id.slice(0, 8)}
                    </span>
                    {statusBadge}
                  </div>

                  <div className="border-t border-b border-dashed border-slate-800/80 py-4 my-2">
                    <div className="flex justify-between text-xs text-slate-400 font-sans">
                      <span>Order Placed:</span>
                      <span className="font-medium text-slate-300">{formattedDate}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-2 font-sans">
                      <span>Assigned Picker:</span>
                      <span className="font-medium text-slate-300">Picker #1</span>
                    </div>
                    
                    <div className="mt-4 flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
                      <div className="h-8 w-full flex items-center justify-between gap-[2px] bg-slate-950/60 p-2 rounded border border-slate-800">
                        {Array.from({ length: 32 }).map((_, i) => (
                          <div 
                            key={i} 
                            style={{ width: i % 3 === 0 ? '4px' : i % 5 === 0 ? '1px' : '2px' }} 
                            className="h-full bg-slate-400"
                          ></div>
                        ))}
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 mt-1 tracking-widest uppercase">
                        {order.order_id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center text-xs font-sans text-slate-400">
                  <span>Click to select & open</span>
                  <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                    →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
