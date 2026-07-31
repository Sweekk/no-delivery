import { useState } from 'react';
import { X } from 'lucide-react';
import { ISSUE_TYPES } from '../../utils/constants';

export default function ReportIssueModal({ orderId, onClose, onSubmit }) {
    const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
    const [notes, setNotes] = useState('');

    function handleSubmit(e) {
        e.preventDefault();
        onSubmit(issueType, notes);
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-black text-gray-900">Report Delivery Issue</h2>
                    <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-xs text-gray-500 mb-4">Order {orderId}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Issue Type</label>
                        <select
                            value={issueType}
                            onChange={(e) => setIssueType(e.target.value)}
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                        >
                            {ISSUE_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Add details that will help admin resolve this..."
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border border-gray-200 text-gray-600 text-sm font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold py-3 rounded-xl transition-colors"
                        >
                            Submit Report
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
