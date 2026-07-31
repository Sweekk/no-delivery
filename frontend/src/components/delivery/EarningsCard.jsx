/**
 * EarningsCard.jsx
 *
 * A single stat card used in the Dashboard's 3-up stat row.
 * Props:
 *   label       {string}   — e.g. "Today's Earnings"
 *   value       {string}   — e.g. "₹730"
 *   icon        {ReactNode} — Lucide icon element
 *   bgColor     {string}   — Tailwind bg class, e.g. "bg-emerald-50"
 *   iconBg      {string}   — Tailwind bg class for icon circle, e.g. "bg-emerald-700"
 *   labelColor  {string}   — Tailwind text class for label, e.g. "text-gray-500"
 *   valueColor  {string}   — Tailwind text class for value, e.g. "text-gray-900"
 */
export default function EarningsCard({
    label,
    value,
    icon,
    bgColor = 'bg-emerald-50',
    iconBg = 'bg-emerald-700',
    labelColor = 'text-gray-500',
    valueColor = 'text-gray-900',
}) {
    return (
        <div className={`${bgColor} rounded-2xl p-5 flex items-center justify-between`}>
            <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${labelColor}`}>{label}</p>
                <p className={`text-3xl font-black ${valueColor}`}>{value}</p>
            </div>
            <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center text-white shrink-0`}>
                {icon}
            </div>
        </div>
    );
}
