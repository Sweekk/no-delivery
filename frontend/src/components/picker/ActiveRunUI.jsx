import React, { useState, useEffect } from 'react';

export default function ActiveRunUI({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/picker/order/${orderId}`);
        if (!res.ok) throw new Error('Failed to retrieve order items.');
        const data = await res.json();
        setOrder(data);
        setItems(data.items || []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load active run details. Please verify database seeding and connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleSetStatus = (listId, newStatus) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.list_id === listId ? { ...item, status: newStatus } : item
      )
    );
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const pendingCount = items.filter(item => item.status === 'pending').length;
      if (pendingCount > 0) {
        throw new Error(`Cannot submit. There are still ${pendingCount} pending items in the checklist.`);
      }

      // Perform updates for each item status
      const updatePromises = items.map((item) =>
        fetch(`http://localhost:5000/api/picker/item/${item.list_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: item.status })
        }).then(async (res) => {
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || `Failed to update item: ${item.item_id}`);
          }
          return res.json();
        })
      );

      await Promise.all(updatePromises);

      // Finalize the order picking
      const completeRes = await fetch(`http://localhost:5000/api/picker/order/${orderId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!completeRes.ok) {
        const completeErr = await completeRes.json();
        throw new Error(completeErr.message || 'Failed to complete the picking process.');
      }

      setSuccess(true);
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while saving picking choices.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400">Loading receipt item list...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-900/60 rounded-2xl flex flex-col items-center text-center space-y-4 font-sans">
        <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center text-red-400 font-bold text-xl">!</div>
        <h3 className="font-semibold text-lg text-red-200">Error Loading Order</h3>
        <p className="text-slate-400 max-w-md text-sm">{error}</p>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition"
        >
          Back to Receipt List
        </button>
      </div>
    );
  }

  const finishedCount = items.filter(item => item.status !== 'pending').length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((finishedCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in font-sans">
      <div className="relative overflow-hidden p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition"
            >
              ←
            </button>
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
              Receipt Mode
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-sans">
            Picking Run for #{orderId.slice(0, 8)}
          </h2>
          <p className="text-slate-400 text-sm font-mono">{orderId}</p>
        </div>

        <div className="flex flex-col items-end gap-2 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold font-sans">Completion</span>
          <span className="text-2xl font-bold text-slate-200 font-sans">{finishedCount} / {totalCount} Items</span>
          <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div 
              style={{ width: `${progressPercent}%` }} 
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
            ></div>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-6 bg-emerald-950/40 border border-emerald-900/60 text-emerald-200 rounded-2xl text-center space-y-2 animate-bounce font-sans">
          <h3 className="text-xl font-bold">🎉 Success!</h3>
          <p className="text-sm text-slate-300 font-sans">All picking updates have been synced to the database. Returning to dashboard...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/60 text-red-200 rounded-xl text-sm font-sans flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 font-bold hover:text-red-300">✕</button>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-200 font-sans flex items-center gap-2">
          <span>Picking Checklist</span>
          <span className="text-xs font-normal text-slate-400">({totalCount} items requested)</span>
        </h3>

        <div className="space-y-3">
          {items.map((item, index) => {
            const isPending = item.status === 'pending';
            const isFound = item.status === 'found';
            const isNotFound = item.status === 'not_found';

            let itemBg = "bg-slate-900/20 border-slate-800";
            let statusIndicator = (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400 font-sans">
                Pending
              </span>
            );

            if (isFound) {
              itemBg = "bg-emerald-950/10 border-emerald-900/40 shadow-sm shadow-emerald-950/5";
              statusIndicator = (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                  Found
                </span>
              );
            } else if (isNotFound) {
              itemBg = "bg-red-950/10 border-red-900/40 shadow-sm shadow-red-950/5";
              statusIndicator = (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 font-sans">
                  Not Found
                </span>
              );
            }

            return (
              <div 
                key={item.list_id}
                className={`p-5 border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-200 ${itemBg}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center font-mono">
                      {index + 1}
                    </span>
                    <h4 className="text-lg font-semibold text-slate-100 font-sans">
                      {item.item_id}
                    </h4>
                    {statusIndicator}
                  </div>
                  <div className="pl-9 flex flex-col space-y-1">
                    <p className="text-slate-300 text-sm font-sans">
                      Quantity: <span className="font-bold text-slate-100">{item.qty_requested}</span>
                    </p>
                    {item.sub_rules && (
                      <p className="text-slate-400 text-xs font-sans italic bg-slate-950/20 p-2 rounded-md border border-slate-800/40 mt-1">
                        <span className="font-semibold text-indigo-400 not-italic">Rules:</span> {item.sub_rules}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pl-9 md:pl-0 flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => handleSetStatus(item.list_id, 'found')}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isFound 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/15' 
                        : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    ✓ Found
                  </button>
                  <button 
                    onClick={() => handleSetStatus(item.list_id, 'not_found')}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isNotFound 
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/15' 
                        : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    ✗ Not Found
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center p-6 bg-slate-900/40 border border-slate-800 rounded-3xl">
        <button 
          onClick={onBack}
          disabled={saving}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white rounded-xl text-sm font-medium border border-slate-700 transition font-sans"
        >
          Cancel Picking
        </button>

        <button 
          onClick={handleSubmit}
          disabled={saving || finishedCount === 0 || success}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 disabled:text-slate-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95 transition-all font-sans"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving to DB...</span>
            </div>
          ) : (
            <span>Submit Checklist to DB</span>
          )}
        </button>
      </div>
    </div>
  );
}
