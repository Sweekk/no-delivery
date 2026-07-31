import { useState } from 'react';
import { Phone, MapPin, Store, ArrowRight, Lock, AlertTriangle, Flag } from 'lucide-react';
import { STATUS } from '../../utils/constants';
import { formatClock } from '../../utils/helpers';
import ReportIssueModal from './ReportIssueModal';

const statusBadgeStyles = {
  [STATUS.READY_FOR_PICKUP]: 'bg-amber-100 text-amber-800',
  [STATUS.OUT_FOR_DELIVERY]: 'bg-amber-100 text-amber-800',
  [STATUS.DELIVERED]: 'bg-emerald-100 text-emerald-700',
};

const nextAction = {
  [STATUS.READY_FOR_PICKUP]: { label: 'Confirm Pickup', next: STATUS.OUT_FOR_DELIVERY, key: 'pickedUpAt' },
  [STATUS.OUT_FOR_DELIVERY]: { label: 'Mark Delivered', next: STATUS.DELIVERED, key: 'deliveredAt' },
};

export default function OrderCard({ order, onAccept, onAdvanceStatus, onReportIssue }) {
  const [reportOpen, setReportOpen] = useState(false);

  // DEL-ISSUE-08: cancelled orders replace all actions with a plain notice —
  // no way to accidentally keep progressing toward a store/customer that no
  // longer needs this delivery.
  if (order.isCancelled) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-gray-900">{order.id}</span>
          <span className="text-xs font-bold bg-rose-100 text-rose-700 px-3 py-1 rounded-full">Cancelled</span>
        </div>
        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700">
            This order was cancelled after being assigned to you. No further action needed — it's been removed from your active list.
          </p>
        </div>
      </div>
    );
  }

  // DEL-ISSUE-05: if it's finalized and ready, but locked by someone else,
  // show a disabled state instead of an Accept button.
  if (order.lockedByAnother) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 opacity-60">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-gray-900">{order.id}</span>
          <span className="flex items-center gap-1 text-xs font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
            <Lock className="w-3 h-3" /> Assigned to another partner
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Store className="w-4 h-4" />
          Pickup Store: <span className="font-semibold">{order.pickupStore}</span> ({order.itemCount} items)
        </div>
      </div>
    );
  }

  const action = nextAction[order.status];

  function handleAdvance() {
    if (!action) return;
    onAdvanceStatus(order.id, action.next, action.key);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-gray-900">{order.id}</span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusBadgeStyles[order.status]}`}>
          {order.status}
        </span>
      </div>

      {/* DEL-ISSUE-07: full details visible right after assignment */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Store className="w-4 h-4 text-emerald-700" />
        Pickup Store: <span className="font-semibold text-gray-800">{order.pickupStore}</span> ({order.itemCount} items)
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 font-semibold text-gray-900">
          {order.customerName}
        </span>
        <a
          href={`tel:${order.phone}`}
          className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
        >
          <Phone className="w-3.5 h-3.5" /> Call
        </a>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
        <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
        {order.address}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span className="font-mono">GPS: {order.gps}</span>
        <span className="font-semibold text-gray-700">Payout: ₹{order.payout}</span>
      </div>

      {/* DEL-ISSUE-06: timestamps stamp themselves as each stage completes */}
      {(order.timestamps.pickedUpAt || order.timestamps.outForDeliveryAt) && (
        <div className="flex gap-4 text-[11px] text-gray-400 mb-3 border-t border-gray-100 pt-2">
          {order.timestamps.pickedUpAt && <span>Picked up {formatClock(order.timestamps.pickedUpAt)}</span>}
          {order.timestamps.outForDeliveryAt && <span>Out for delivery {formatClock(order.timestamps.outForDeliveryAt)}</span>}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 text-xs font-semibold"
        >
          <Flag className="w-3.5 h-3.5" /> Report Issue
        </button>

        {action && (
          <button
            type="button"
            onClick={handleAdvance}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            {action.label} <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {reportOpen && (
        <ReportIssueModal
          orderId={order.id}
          onClose={() => setReportOpen(false)}
          onSubmit={(issueType, notes) => {
            onReportIssue(order.id, issueType, notes);
            setReportOpen(false);
          }}
        />
      )}
    </div>
  );
}
