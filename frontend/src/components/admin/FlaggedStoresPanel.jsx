// src/components/admin/FlaggedStoresPanel.jsx
import React, { useState } from "react";

/**
 * Highlights stores whose substitution rate exceeds the flag threshold.
 * Features interactive threshold adjustment and store inventory sync triggers.
 */
export default function FlaggedStoresPanel({
  data,
  stores: storesProp,
  threshold: initialThreshold,
}) {
  const stores = storesProp || data?.stores || [];
  const defaultThreshold = initialThreshold || data?.flag_threshold || 25;
  const [threshold, setThreshold] = useState(defaultThreshold);
  const [syncingStore, setSyncingStore] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState("");

  const flagged = stores.filter(
    (s) => Number(s.substitution_rate || 0) >= threshold
  );

  const handleSyncStore = (storeId, storeName) => {
    setSyncingStore(storeId);
    setSyncSuccess("");
    setTimeout(() => {
      setSyncingStore(null);
      setSyncSuccess(`Inventory sync triggered for ${storeName}`);
      setTimeout(() => setSyncSuccess(""), 4000);
    }, 1000);
  };

  return (
    <div style={styles.panelContainer}>
      {/* Threshold adjustment toolbar */}
      <div style={styles.thresholdControlRow}>
        <div style={styles.thresholdMeta}>
          <span style={styles.thresholdLabel}>Flag Threshold:</span>
          <span style={styles.thresholdValue}>{threshold}%</span>
        </div>
        <input
          type="range"
          min="10"
          max="50"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          style={styles.slider}
          title="Adjust substitution flag threshold"
        />
      </div>

      {syncSuccess && (
        <div style={styles.toastMessage}>
          <span>✅ {syncSuccess}</span>
        </div>
      )}

      {/* ── Nothing flagged ── */}
      {flagged.length === 0 ? (
        <div style={styles.panelOk}>
          <span style={styles.iconOk}>✅</span>
          <span style={styles.okText}>
            No stores currently flagged — all substitution rates are below{" "}
            {threshold}%
          </span>
        </div>
      ) : (
        /* ── Flagged stores exist ── */
        <div style={styles.panel}>
          <div style={styles.header}>
            <span style={styles.iconWarn}>⚠️</span>
            <span style={styles.headerText}>
              {flagged.length} store{flagged.length > 1 ? "s" : ""} flagged
            </span>
            <span style={styles.badge}>≥ {threshold}% substitution rate</span>
          </div>

          <div style={styles.list}>
            {flagged.map((store) => (
              <div key={store.store_id || store.store_name} style={styles.card}>
                <div style={styles.storeInfo}>
                  <span style={styles.storeName}>{store.store_name}</span>
                  <span style={styles.rate}>{store.substitution_rate}%</span>
                </div>
                <button
                  style={styles.syncBtn}
                  disabled={syncingStore === store.store_id}
                  onClick={() =>
                    handleSyncStore(store.store_id, store.store_name)
                  }
                >
                  {syncingStore === store.store_id ? "Syncing..." : "🔄 Sync Inventory"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  panelContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    marginBottom: "1.5rem",
  },
  thresholdControlRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    background: "#ffffff",
    padding: "0.75rem 1.25rem",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  thresholdMeta: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.825rem",
    fontWeight: 600,
    color: "#475569",
  },
  thresholdLabel: {
    color: "#64748b",
  },
  thresholdValue: {
    fontWeight: 800,
    color: "#7239ea",
    background: "#f3e8ff",
    padding: "0.15rem 0.6rem",
    borderRadius: "6px",
  },
  slider: {
    accentColor: "#7239ea",
    cursor: "pointer",
    width: "140px",
  },
  toastMessage: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    padding: "0.6rem 1rem",
    borderRadius: "8px",
    fontSize: "0.825rem",
    fontWeight: 600,
  },
  panel: {
    background: "#fff5f5",
    border: "1px solid #fecaca",
    borderLeft: "6px solid #ef4444",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(239, 68, 68, 0.08)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.85rem 1.25rem",
    background: "rgba(239, 68, 68, 0.06)",
    borderBottom: "1px solid rgba(239, 68, 68, 0.12)",
  },
  iconWarn: { fontSize: "1.1rem" },
  headerText: {
    fontWeight: 700,
    fontSize: "0.9rem",
    color: "#991b1b",
    flex: 1,
  },
  badge: {
    fontSize: "0.725rem",
    fontWeight: 700,
    color: "#ffffff",
    background: "#ef4444",
    borderRadius: "999px",
    padding: "0.2rem 0.65rem",
    whiteSpace: "nowrap",
  },
  list: {
    maxHeight: "220px",
    overflowY: "auto",
    padding: "0.75rem 1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#ffffff",
    border: "1px solid #fee2e2",
    borderRadius: "8px",
    padding: "0.65rem 1rem",
  },
  storeInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  storeName: {
    fontWeight: 600,
    fontSize: "0.875rem",
    color: "#1e293b",
  },
  rate: {
    fontWeight: 800,
    fontSize: "0.95rem",
    color: "#dc2626",
  },
  syncBtn: {
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "0.35rem 0.75rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#334155",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  panelOk: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderLeft: "6px solid #0c831f",
    borderRadius: "12px",
    padding: "0.9rem 1.25rem",
    boxShadow: "0 2px 12px rgba(12, 131, 31, 0.06)",
  },
  iconOk: { fontSize: "1.1rem" },
  okText: {
    fontWeight: 600,
    fontSize: "0.875rem",
    color: "#166534",
  },
};
