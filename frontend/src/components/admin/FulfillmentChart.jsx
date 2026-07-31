// src/components/admin/FulfillmentChart.jsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const FulfillmentChart = ({ data }) => {
  const { overall_average_minutes, per_store } = data;

  const sorted = [...per_store].sort((a, b) =>
    a.store_name.localeCompare(b.store_name)
  );

  return (
    <div style={styles.wrapper}>
      {/* Overall statistic card */}
      <div style={styles.overallCard}>
        <div style={styles.statMeta}>
          <span style={styles.statLabel}>Network Average SLA</span>
          <span style={styles.statTag}>⚡ 10 min target</span>
        </div>
        <p style={styles.overallValue}>
          {overall_average_minutes.toFixed(1)} <span style={styles.unitText}>min</span>
        </p>
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={sorted} margin={{ top: 20, right: 30, left: 10, bottom: 35 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0edf3" />
          <XAxis
            dataKey="store_name"
            angle={-25}
            textAnchor="end"
            tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            tick={{ fill: "#475569", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            unit="m"
          />
          <Tooltip
            formatter={(value) => [`${value} min`, "Avg Fulfillment Time"]}
            contentStyle={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontWeight: 600, fontSize: "0.85rem" }} />
          <Bar
            dataKey="average_minutes"
            name="Avg. Minutes"
            fill="#ffb800"
            radius={[8, 8, 0, 0]}
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  overallCard: {
    alignSelf: "flex-start",
    background: "#fff9e9",
    border: "1px solid #ffedbb",
    padding: "0.9rem 1.4rem",
    borderRadius: "9px",
    boxShadow: "0 2px 8px rgba(247, 198, 0, 0.12)",
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    minWidth: "220px",
  },
  statMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
  },
  statLabel: {
    fontSize: "0.8rem",
    fontWeight: "700",
    color: "#854d0e",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  statTag: {
    fontSize: "0.7rem",
    fontWeight: "800",
    color: "#0c831f",
    backgroundColor: "#dcfce7",
    padding: "0.15rem 0.5rem",
    borderRadius: "999px",
  },
  overallValue: {
    fontSize: "2rem",
    fontWeight: "800",
    margin: "0.2rem 0 0",
    color: "#1c1c1c",
    lineHeight: 1,
  },
  unitText: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#71717a",
  },
};

export default FulfillmentChart;
