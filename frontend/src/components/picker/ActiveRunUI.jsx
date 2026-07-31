import React from 'react';
import { PickItemRow } from './PickItemRow.jsx';
import { UnavailableActionModal } from './UnavailableActionModal.jsx';

export default function ActiveRunUI({
  items = [],
  onMarkAvailable,
  onMarkUnavailable,
  ...props
}) {
  return (
    <div className="p-4 border rounded-2xl bg-white border-slate-200 shadow-xs space-y-3">
      <h2 className="text-lg font-bold text-slate-900">Picker Active Run</h2>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500 font-medium">No items currently queued for picking.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <PickItemRow
              key={item.id || idx}
              item={item}
              onMarkAvailable={() => onMarkAvailable && onMarkAvailable(item)}
              onMarkUnavailable={() => onMarkUnavailable && onMarkUnavailable(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { PickItemRow, UnavailableActionModal };
