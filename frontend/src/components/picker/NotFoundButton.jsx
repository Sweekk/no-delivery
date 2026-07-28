import React from 'react';

export default function NotFoundButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Item Not Found
    </button>
  );
}
