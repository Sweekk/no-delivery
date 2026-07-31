/**
 * Format a Date/ISO-string as a HH:MM clock string (12-hour with AM/PM).
 * @param {string|Date|null} iso
 * @returns {string}
 */
export function formatClock(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * Return the number of whole minutes between two ISO timestamps.
 * @param {string|null} from
 * @param {string|null} to
 * @returns {number}
 */
export function minutesBetween(from, to) {
    if (!from || !to) return 0;
    return Math.round((new Date(to) - new Date(from)) / 60000);
}

/**
 * Format a number of minutes as a human-readable duration string.
 * e.g. 75 → "1 hr 15 min"
 * @param {number} totalMins
 * @returns {string}
 */
export function formatDuration(totalMins) {
    if (totalMins <= 0) return '0 min';
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hrs === 0) return `${mins} min`;
    if (mins === 0) return `${hrs} hr`;
    return `${hrs} hr ${mins} min`;
}

/**
 * Legacy helpers kept for backward compat.
 */
export function formatCurrency(amount) {
    return `₹${amount}`;
}

export function calculateEstimatedArrival(minutes) {
    return `${minutes} mins delivery window`;
}