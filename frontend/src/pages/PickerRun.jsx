import React from 'react';
<<<<<<< HEAD
import Navbar from '../components/common/Navbar';
import ActiveRunUI from '../components/picker/ActiveRunUI';
import NotFoundButton from '../components/picker/NotFoundButton';

export default function PickerRun({ onNavigate }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar currentRoute="picker" onNavigate={onNavigate} />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-black text-gray-900">QuickFix Grocery Store Picker Run</h1>
          <p className="text-xs text-gray-500">Pick and pack customer items at dark store</p>
        </div>
        <ActiveRunUI />
        <NotFoundButton onClick={() => alert('Item marked as not found. Flagged for substitution proposal.')} />
      </main>
    </div>
  );
=======
import { PickerQueue } from './picker/PickerQueue.jsx';

export default function PickerRun(props) {
  return <PickerQueue {...props} />;
>>>>>>> customer
}
