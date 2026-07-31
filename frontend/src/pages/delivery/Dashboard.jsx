import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle2, Store, Clock } from 'lucide-react';
import {
    fetchAssignedOrders,
    fetchCancelledAssignments,
    acceptOrder,
    updateOrderStatus,
    reportDeliveryIssue,
    fetchDeliveryHistory,
} from '../../services/api';
import { formatClock, minutesBetween, formatDuration } from '../../utils/helpers';
import OrderCard from '../../components/delivery/OrderCard';
import EarningsCard from '../../components/delivery/EarningsCard';

const TABS = ['Live Dashboard', 'All Assigned Orders', 'Earnings & Payouts'];

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [orders, setOrders] = useState([]);
    const [cancelledAssignments, setCancelledAssignments] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dismissedAlert, setDismissedAlert] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const [visible, cancelled, historyData] = await Promise.all([
                fetchAssignedOrders(),
                fetchCancelledAssignments(),
                fetchDeliveryHistory(),
            ]);
            setOrders(visible);
            setCancelledAssignments(cancelled);
            setHistory(historyData);
            setLoading(false);
        }
        load();
    }, []);

    async function handleAdvanceStatus(orderId, newStatus, timestampKey) {
        const result = await updateOrderStatus(orderId, newStatus);
        setOrders((prev) =>
            prev.map((o) =>
                o.id === orderId
                    ? { ...o, status: newStatus, timestamps: { ...o.timestamps, [timestampKey]: result.timestamp } }
                    : o
            )
        );
    }

    async function handleReportIssue(orderId, issueType, notes) {
        await reportDeliveryIssue(orderId, issueType, notes);
    }

    const todaysEarnings =
        [...orders, ...cancelledAssignments].reduce((sum, o) => sum + (o.status === 'Delivered' ? o.payout : 0), 0) +
        history.reduce((sum, h) => sum + h.payout, 0);
    const completedCount = history.length;

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            {/* DEL-ISSUE-08: cancelled-but-assigned orders surface as a dismissible alert */}
            {cancelledAssignments.length > 0 && !dismissedAlert && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4 text-sm text-rose-700 flex items-center justify-between">
                    <span>
                        {cancelledAssignments.length} of your assigned order{cancelledAssignments.length > 1 ? 's were' : ' was'} cancelled — check &quot;All Assigned Orders&quot; for details.
                    </span>
                    <button
                        onClick={() => setDismissedAlert(true)}
                        className="ml-4 text-rose-500 hover:text-rose-700 font-bold text-lg leading-none"
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Tab bar */}
            <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-bold transition-colors border-b-2 -mb-px whitespace-nowrap ${activeTab === tab ? 'text-emerald-700 border-emerald-700' : 'text-gray-500 border-transparent hover:text-gray-700'
                            }`}
                    >
                        {tab}
                        {tab === 'All Assigned Orders' && ` (${orders.length + cancelledAssignments.length})`}
                    </button>
                ))}
            </div>

            {/* Stat row — single source of truth via EarningsCard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <EarningsCard
                    label="Today's Earnings"
                    value={`₹${todaysEarnings}`}
                    icon={<DollarSign className="w-5 h-5" />}
                    bgColor="bg-emerald-50"
                    iconBg="bg-emerald-700"
                    labelColor="text-gray-500"
                    valueColor="text-gray-900"
                />
                <EarningsCard
                    label="Completed Deliveries"
                    value={`${completedCount} Orders`}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    bgColor="bg-blue-50"
                    iconBg="bg-blue-600"
                    labelColor="text-blue-700"
                    valueColor="text-blue-900"
                />
                <EarningsCard
                    label="Dark Store Hub"
                    value="Kadri (High Demand)"
                    icon={<Store className="w-5 h-5" />}
                    bgColor="bg-amber-50"
                    iconBg="bg-orange-500"
                    labelColor="text-amber-700"
                    valueColor="text-amber-900 text-lg"
                />
            </div>

            {/* Live Dashboard tab */}
            {activeTab === 'Live Dashboard' && (
                <section>
                    <h2 className="font-black text-gray-900 mb-4">Active Assigned Deliveries</h2>
                    {loading ? (
                        <p className="text-sm text-gray-400">Loading orders...</p>
                    ) : orders.length === 0 ? (
                        <p className="text-sm text-gray-400">No finalized orders assigned right now.</p>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {orders.map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onAccept={acceptOrder}
                                    onAdvanceStatus={handleAdvanceStatus}
                                    onReportIssue={handleReportIssue}
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* All Assigned Orders tab */}
            {activeTab === 'All Assigned Orders' && (
                <section>
                    <h2 className="font-black text-gray-900 mb-4">All Assigned Orders</h2>
                    {loading ? (
                        <p className="text-sm text-gray-400">Loading orders...</p>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {[...orders, ...cancelledAssignments].map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onAccept={acceptOrder}
                                    onAdvanceStatus={handleAdvanceStatus}
                                    onReportIssue={handleReportIssue}
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Earnings & Payouts tab */}
            {activeTab === 'Earnings & Payouts' && (
                <section>
                    <h2 className="font-black text-gray-900 mb-4">Delivery Performance</h2>
                    {history.length === 0 ? (
                        <p className="text-sm text-gray-400">No completed deliveries yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {history.map((h) => {
                                const total = minutesBetween(h.timestamps.assignedAt, h.timestamps.deliveredAt);
                                return (
                                    <div key={h.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-bold text-gray-900">{h.id}</span>
                                            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">Delivered</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{h.customerName} — ₹{h.payout}</p>
                                        <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-gray-100 pt-3">
                                            <div>
                                                <p className="text-gray-400">Assigned</p>
                                                <p className="font-semibold text-gray-700">{formatClock(h.timestamps.assignedAt)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Picked Up</p>
                                                <p className="font-semibold text-gray-700">{formatClock(h.timestamps.pickedUpAt)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Delivered</p>
                                                <p className="font-semibold text-gray-700">{formatClock(h.timestamps.deliveredAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                                            <Clock className="w-3.5 h-3.5" /> Total time: {formatDuration(total)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
