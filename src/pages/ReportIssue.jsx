import React, { useState } from 'react';
import Navbar from '../components/common/Navbar';

export default function ReportIssue({ onNavigate }) {
  const [orderId, setOrderId] = useState('');
  const [issueType, setIssueType] = useState('Order Delayed');
  const [description, setDescription] = useState('');
  
  const [originalItem, setOriginalItem] = useState('');
  const [alternateItem, setAlternateItem] = useState('');
  const [priceDifference, setPriceDifference] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const payload = {
      orderId,
      issueType,
      description,
      alternateSuggestion: issueType.includes('Item Not Available') ? {
        originalItem,
        alternateItem,
        priceDifference
      } : null,
      submittedAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/delivery/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || `Server responded with status ${response.status}`);
      }

      setSuccessMessage(`Issue report submitted successfully for Order #${orderId}. Admin and customer have been notified.`);
      setOrderId('');
      setDescription('');
      setOriginalItem('');
      setAlternateItem('');
      setPriceDifference('');
    } catch (err) {
      console.error('Report issue submit notice:', err);
      setErrorMessage(`Submit Note: ${err.message || 'POST /api/delivery/issues endpoint connection failed.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar currentRoute="report-issue" onNavigate={onNavigate} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Report Order Issue</h1>
            <p className="text-xs text-gray-500">Submit delivery issues or propose item substitutions directly to backend</p>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('delivery-orders')}
            className="text-xs font-bold text-gray-600 hover:text-emerald-700 bg-white border border-gray-200 px-3 py-2 rounded-xl"
          >
            &larr; Back to Orders
          </button>
        </div>

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs font-bold flex items-start gap-2">
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-xs font-medium flex items-start gap-2">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Order ID Reference *
            </label>
            <input
              type="text"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. ORD-9821"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-emerald-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Issue Category *
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-emerald-600 transition-all"
            >
              <option value="Order Delayed">Order Delayed</option>
              <option value="Unable to Reach Customer">Unable to Reach Customer</option>
              <option value="Item Not Available — Suggest Alternate">Item Not Available — Suggest Alternate</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {issueType.includes('Item Not Available') && (
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>🔄 Propose Alternate Item</span>
              </h3>
              <p className="text-xs text-emerald-700">
                Provide substitution details so customer or admin can approve the alternate product.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Original Missing Item *
                  </label>
                  <input
                    type="text"
                    required={issueType.includes('Item Not Available')}
                    value={originalItem}
                    onChange={(e) => setOriginalItem(e.target.value)}
                    placeholder="e.g. Fresh Milk 1L"
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Proposed Alternate Item *
                  </label>
                  <input
                    type="text"
                    required={issueType.includes('Item Not Available')}
                    value={alternateItem}
                    onChange={(e) => setAlternateItem(e.target.value)}
                    placeholder="e.g. Organic Toned Milk 1L"
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Price Difference / Reason
                </label>
                <input
                  type="text"
                  value={priceDifference}
                  onChange={(e) => setPriceDifference(e.target.value)}
                  placeholder="e.g. +₹10 difference, same brand quality"
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Issue Description / Notes *
            </label>
            <textarea
              required
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details regarding the issue encountered..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-emerald-600 transition-all resize-none"
            ></textarea>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('delivery-orders')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold py-3.5 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span>Submitting Issue...</span>
              ) : (
                <span>Submit Issue Report</span>
              )}
            </button>
          </div>

        </form>

      </main>
    </div>
  );
}
