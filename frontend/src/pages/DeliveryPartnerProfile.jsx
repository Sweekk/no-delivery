import React, { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';

export default function DeliveryPartnerProfile({ onNavigate }) {
  const [partnerInfo, setPartnerInfo] = useState({
    name: 'QuickFix Fleet Partner',
    id: 'PARTNER-402',
    zone: 'Central Metro Zone',
    email: 'partner@quickfixgrocery.com',
    phone: '+91 98765 43210',
    rating: 4.9,
    status: 'Active'
  });

  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    async function fetchProfileAndHistory() {
      setLoading(true);
      setNotice(null);
      try {
        const response = await fetch('/api/delivery/profile');
        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }
        const data = await response.json();
        if (data.partner) setPartnerInfo(prev => ({ ...prev, ...data.partner }));
        setOrderHistory(data.history || data.orders || []);
      } catch (err) {
        console.warn('Backend API profile notice:', err);
        setNotice('GET /api/delivery/profile endpoint not connected yet. Showing active partner session.');
        setOrderHistory([]); // Start clean empty history - NO fake orders
      } finally {
        setLoading(false);
      }
    }

    fetchProfileAndHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar currentRoute="delivery-profile" onNavigate={onNavigate} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                {partnerInfo.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900">{partnerInfo.name}</h1>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                  ID: {partnerInfo.id} &bull; {partnerInfo.zone}
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('report-issue')}
              className="w-full sm:w-auto bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Report Delivery Issue</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium">Contact Email</span>
              <p className="font-bold text-gray-800">{partnerInfo.email}</p>
            </div>
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium">Phone Number</span>
              <p className="font-bold text-gray-800">{partnerInfo.phone}</p>
            </div>
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium">Partner Rating</span>
              <p className="font-bold text-emerald-700 flex items-center gap-1">
                <span>⭐ {partnerInfo.rating} / 5.0</span>
              </p>
            </div>
          </div>
        </div>

        {/* Order History Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900">Order Delivery History</h2>
            <span className="text-xs text-gray-500">Past + Current Deliveries</span>
          </div>

          {notice && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs font-medium">
              Note: {notice}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-xs text-gray-400">
              Loading history...
            </div>
          ) : orderHistory.length === 0 ? (
            /* Clean empty history state */
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2">
              <p className="text-xs font-bold text-gray-700">No completed order history yet</p>
              <p className="text-xs text-gray-500">
                Your past completed and delivered orders will be archived here once recorded by the backend.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderHistory.map(h => (
                <div key={h.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between text-xs shadow-sm">
                  <div>
                    <span className="font-bold text-gray-900 block">Order #{h.id}</span>
                    <span className="text-gray-500">{h.customerName || 'Customer'} &bull; {h.deliveredAt || 'Recently Delivered'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-700 text-sm block">₹{h.payout || h.total || 0}</span>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                      {h.status || 'Completed'}
                    </span>
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
