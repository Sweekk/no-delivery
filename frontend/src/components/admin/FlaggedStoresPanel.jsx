// src/components/admin/FlaggedStoresPanel.jsx
import React from "react";

/**
 * Highlights stores whose substitution rate exceeds the flag threshold.
 * Accepts the same `stores` array that Dashboard.jsx already fetched —
 * filters client-side, no extra API call.
 *
 * Props:
 *   stores     – array of { store_id, store_name, substitution_rate, flagged }
 *   threshold  – number (the flag_threshold from the API, used in the header)
 */
export default function FlaggedStoresPanel({ stores = [], threshold = 25 }) {
  const flagged = stores.filter((s) => s.flagged);

  /* ── Nothing flagged ── */
  if (flagged.length === 0) {
    return (
      <div style={styles.panelOk}>
        <span style={styles.iconOk}>✅</span>
        <span style={styles.okText}>
          No stores currently flagged — all substitution rates are below{" "}
          {threshold}%
        </span>
      </div>
    );
  }

  /* ── Flagged stores exist ── */
  return (
    <div style={styles.panel}>
      {/* Header bar */}
      <div style={styles.header}>
        <span style={styles.iconWarn}>⚠️</span>
        <span style={styles.headerText}>
          {flagged.length} store{flagged.length > 1 ? "s" : ""} flagged
        </span>
        <span style={styles.badge}>≥ {threshold}% substitution rate</span>
      </div>

      {/* Scrollable card list (caps at ~200 px before scrolling) */}
      <div style={styles.list}>
        {flagged.map((store) => (
          <div key={store.store_id} style={styles.card}>
            <span style={styles.storeName}>{store.store_name}</span>
            <span style={styles.rate}>{store.substitution_rate}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Styles ─── */
const styles = {
  /* Flagged panel (warning state) */
  panel: {
    background: "linear-gradient(135deg, #fff5f5 0%, #fff0eb 100%)",
    border: "1px solid #fc8181",
    borderLeft: "5px solid #e53e3e",
    borderRadius: "10px",
    padding: "0",
    marginBottom: "1.5rem",
    overflow: "hidden",
    boxShadow: "0 4px 14px rgba(229, 62, 62, 0.12)",
  },

  /* Header */
  header: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
    background: "rgba(229, 62, 62, 0.08)",
    borderBottom: "1px solid rgba(229, 62, 62, 0.15)",
  },
  iconWarn: { fontSize: "1.25rem" },
  headerText: {
    fontWeight: 700,
    fontSize: "0.95rem",
    color: "#c53030",
    flex: 1,
  },
  badge: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#fff",
    background: "#e53e3e",
    borderRadius: "999px",
    padding: "0.2rem 0.65rem",
    whiteSpace: "nowrap",
  },

  /* Scrollable list */
  list: {
    maxHeight: "200px",
    overflowY: "auto",
    padding: "0.5rem 1rem 0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
  },

  /* Individual store card */
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
    border: "1px solid #fed7d7",
    borderRadius: "8px",
    padding: "0.55rem 0.85rem",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  storeName: {
    fontWeight: 600,
    fontSize: "0.9rem",
    color: "#2d3748",
  },
  rate: {
    fontWeight: 700,
    fontSize: "1rem",
    color: "#e53e3e",
    fontVariantNumeric: "tabular-nums",
  },

  /* All-clear panel (no flags) */
  panelOk: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    background: "linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%)",
    border: "1px solid #9ae6b4",
    borderLeft: "5px solid #38a169",
    borderRadius: "10px",
    padding: "0.85rem 1rem",
    marginBottom: "1.5rem",
    boxShadow: "0 2px 8px rgba(56, 161, 105, 0.1)",
  },
  iconOk: { fontSize: "1.25rem" },
  okText: {
    fontWeight: 600,
    fontSize: "0.9rem",
    color: "#276749",
  },
};
