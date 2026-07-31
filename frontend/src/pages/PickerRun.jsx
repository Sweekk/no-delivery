import React, { useState } from 'react';
import OrderQueue from '../components/picker/OrderQueue';
import ActivePickList from '../components/picker/ActivePickList';

export default function PickerRun() {
  const [activeOrderId, setActiveOrderId] = useState(null);

  return (
    <div className="picker-page-wrapper">
      {activeOrderId ? (
        <ActivePickList
          orderId={activeOrderId}
          onBackToQueue={() => setActiveOrderId(null)}
        />
      ) : (
        <OrderQueue
          onSelectOrder={(orderId) => setActiveOrderId(orderId)}
        />
      )}
    </div>
  );
}

