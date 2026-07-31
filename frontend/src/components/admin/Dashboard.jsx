import React from 'react';
import SubstitutionChart from './SubstitutionChart';
import FulfillmentChart from './FulfillmentChart';
import FlaggedStoresPanel from './FlaggedStoresPanel';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SubstitutionChart />
        <FulfillmentChart />
      </div>
      <FlaggedStoresPanel />
    </div>
  );
}
