import React from 'react';
import './PickerUI.css';

export default function CompletionFooter({
  items = [],
  onComplete,
  isCompleting = false
}) {
  const totalItems = items.length;
  const resolvedItems = items.filter((i) => i.status !== 'pending').length;
  const isAllResolved = totalItems > 0 && resolvedItems === totalItems;
  const progressPercent = totalItems > 0 ? Math.round((resolvedItems / totalItems) * 100) : 0;

  return (
    <div className="sticky-footer">
      <div className="footer-content">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>
            <span>Order Progress</span>
            <span style={{ color: isAllResolved ? '#0c831f' : '#64748b' }}>
              {resolvedItems} of {totalItems} items verified ({progressPercent}%)
            </span>
          </div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <button
          type="button"
          id="btnCompleteOrder"
          className={`btn-complete-order ${!isAllResolved ? 'disabled' : ''}`}
          onClick={onComplete}
          disabled={isCompleting}
        >
          {isCompleting ? (
            'Completing...'
          ) : (
            <>
              <span>Complete Order</span>
              <span>{isAllResolved ? '✓' : '⚠️'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
