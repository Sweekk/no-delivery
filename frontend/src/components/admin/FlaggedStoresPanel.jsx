import React from 'react';

export default function FlaggedStoresPanel() {
  return (
    <div className="p-4 border rounded bg-white shadow-sm">
      <h3 className="font-semibold text-lg">Flagged Stores</h3>
      <div className="mt-2 text-gray-600">
        <p>List of stores with high item-not-found / substitution rates.</p>
      </div>
    </div>
  );
}
