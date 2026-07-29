// src/components/admin/Dashboard.jsx
import React, { useEffect, useState } from "react";
import SubstitutionChart from "./SubstitutionChart";
import FulfillmentChart from "./FulfillmentChart";
import FlaggedStoresPanel from "./FlaggedStoresPanel";

const API_BASE = "/api/admin/metrics";

export default function Dashboard() {
  const [substitutionData, setSubstitutionData] = useState(null);
  const [fulfillmentData, setFulfillmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to fetch JSON and throw on non‑2xx
  const fetchJson = async (url) => {
    const res = await fetch(url);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }
    return res.json();
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [sub, ful] = await Promise.all([
          fetchJson(`${API_BASE}/substitution-rate`),
          fetchJson(`${API_BASE}/fulfillment-time`),
        ]);
        setSubstitutionData(sub);
        setFulfillmentData(ful);
      } catch (e) {
        setError(e.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // -----------------------------------------------------------------------
  // UI helpers
  // -----------------------------------------------------------------------
  if (loading) {
    return (
      <div style={styles.center}>
        <div className="spinner" />
        <p>Loading admin metrics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.center}>
        <p style={{ color: "red" }}>❌ {error}</p>
      </div>
    );
  }

  // Both datasets are guaranteed to exist here
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Admin Dashboard</h2>

      {/* Flagged stores alert — sits above the charts */}
      <FlaggedStoresPanel
        stores={substitutionData?.stores || []}
        threshold={substitutionData?.flag_threshold || 25}
      />

      <section style={styles.section}>
        <h3 style={styles.subTitle}>🛒 Substitution Rate per Store</h3>
        <SubstitutionChart data={substitutionData} />
      </section>

      <section style={styles.section}>
        <h3 style={styles.subTitle}>⏱️ Fulfillment Time per Store</h3>
        <FulfillmentChart data={fulfillmentData} />
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Minimal inline styling – feel free to move to a CSS module if you prefer
// ---------------------------------------------------------------------------
const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "1rem",
  },
  title: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  subTitle: {
    marginBottom: ".5rem",
  },
  section: {
    marginBottom: "2rem",
    background: "#fafafa",
    borderRadius: "8px",
    padding: "1rem",
    boxShadow: "0 2px 4px rgba(0,0,0,.05)",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "4rem",
  },
};
