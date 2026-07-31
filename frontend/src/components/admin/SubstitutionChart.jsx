// src/components/admin/SubstitutionChart.jsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

const SubstitutionChart = ({ data }) => {
  if (!data) return null;
  const { flag_threshold, stores } = data;

  const sorted = [...stores].sort((a, b) =>
    a.store_name.localeCompare(b.store_name)
  );

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart data={sorted} margin={{ top: 20, right: 30, left: 10, bottom: 35 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0edf3" />
        <ReferenceLine
          y={flag_threshold}
          label={{
            value: `Flag Threshold ${flag_threshold}%`,
            position: "top",
            fill: "#f05252",
            fontSize: 12,
            fontWeight: 700,
          }}
          stroke="#f05252"
          strokeDasharray="4 4"
          strokeWidth={2}
        />
        <XAxis
          dataKey="store_name"
          angle={-25}
          textAnchor="end"
          tick={{ fill: "#aaa6b1", fontSize: 11, fontWeight: 500 }}
          tickLine={false}
          axisLine={{ stroke: "#cbd5e1" }}
        />
        <YAxis
          tick={{ fill: "#aaa6b1", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
          unit="%"
        />
        <Tooltip
          formatter={(value) => [`${value}%`, "Substitution Rate"]}
          contentStyle={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #f0edf3",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            fontWeight: 600,
            fontSize: "0.85rem",
          }}
        />
        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontWeight: 600, fontSize: "0.85rem" }} />
        <Bar
          dataKey="substitution_rate"
          name="Substitution %"
          radius={[8, 8, 0, 0]}
          barSize={40}
        >
          {sorted.map((s) => (
            <Cell key={s.store_id} fill={s.flagged ? "#f05252" : "#ffb800"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SubstitutionChart;
