import React from 'react';
import { Package, MapPin, Clock, ArrowRight } from 'lucide-react';

export default function Orders() {
  const activeDeliveries = [
    {
      id: 'ORD-9821',
      store: 'Blinkit Dark Store - Kadri',
      customer: 'Rahul Sharma',
      address: 'Flat 402, Sunshine Apartments, Mangaluru',
      itemsCount: 6,
      timeWindow: '8 mins',
      status: 'Ready for Pickup',
    },
    {
      id: 'ORD-9822',
      store: 'Blinkit Dark Store - Kadri',
      customer: 'Ananya Shetty',
      address: 'Near City Centre, K.S. Rao Road, Mangaluru',
      itemsCount: 3,
      timeWindow: '12 mins',
      status: 'Out for Delivery',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Assigned Orders</h1>
          <p className="text-xs text-gray-500">Manage your active pickups and customer drop-offs</p>
        </div>
        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full">
          2 Active Tasks
        </span>
      </div>

      <div className="space-y-4">
        {activeDeliveries.map((order) => (
          <div 
            key={order.id} 
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md">
                  {order.id}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  order.status === 'Ready for Pickup' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {order.status}
                </span>
              </div>

              <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>{order.store}</span>
                <span className="text-gray-400 font-normal">({order.itemsCount} items)</span>
              </div>

              <div className="text-xs text-gray-600 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>Drop to: <strong>{order.customer}</strong> — {order.address}</span>
              </div>
            </div>

            <div className="flex md:flex-col items-end justify-between w-full md:w-auto gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
                <span>{order.timeWindow} target</span>
              </div>
              <button className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition-colors flex items-center gap-1.5">
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
