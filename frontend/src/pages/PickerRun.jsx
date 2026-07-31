import React from 'react';
import ActiveRunUI from '../components/picker/ActiveRunUI';
import NotFoundButton from '../components/picker/NotFoundButton';

export default function PickerRun() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Picker Interface</h1>
      <ActiveRunUI />
      <NotFoundButton onClick={() => alert('Item marked not found')} />
    </div>
  );
}
