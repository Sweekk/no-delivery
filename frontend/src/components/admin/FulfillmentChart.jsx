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

// Plain JavaScript component – no TypeScript
const FulfillmentChart = ({ data }) => {
  const { overall_average_minutes, per_store } = data;

  // Sort stores alphabetically for consistent rendering
  const sorted = [...per_store].sort((a, b) =>
    a.store_name.localeCompare(b.store_name)
  );

  return (
    <div style={styles.wrapper}>
      {/* Overall statistic card */}
      <div style={styles.overallCard}>
        <h4 style={{ margin: 0 }}>Overall Avg. Fulfillment Time</h4>
        <p style={styles.overallValue}>
          {overall_average_minutes.toFixed(1)} min
        </p>
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={sorted} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="store_name" angle={-30} textAnchor="end" height={60} />
          <YAxis
            label={{
              value: "Avg. Minutes",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip />
          <Legend verticalAlign="top" height={36} />
          <Bar dataKey="average_minutes" name="Avg. Minutes" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  overallCard: {
    alignSelf: "flex-start",
    background: "#f0f9ff",
    padding: "0.8rem 1.2rem",
    borderRadius: "6px",
    boxShadow: "0 1px 3px rgba(0,0,0,.1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  overallValue: {
    fontSize: "1.8rem",
    fontWeight: 600,
    margin: "0.2rem 0 0",
    color: "#1e3a8a",
  },
};

export default FulfillmentChart;
