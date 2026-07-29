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
} from "recharts";

// No TypeScript types – plain JS component
const SubstitutionChart = ({ data }) => {
  if (!data) return null; // safety guard
  const { flag_threshold, stores } = data;

  // Sort stores alphabetically for stable layout
  const sorted = [...stores].sort((a, b) =>
    a.store_name.localeCompare(b.store_name)
  );

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={sorted} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        {/* Reference line for the threshold */}
        <ReferenceLine
          y={flag_threshold}
          label={{
            value: `Threshold ${flag_threshold}%`,
            position: "insideTopRight",
            fill: "#ff5722",
          }}
          stroke="#ff5722"
          strokeDasharray="3 3"
        />
        <XAxis dataKey="store_name" angle={-30} textAnchor="end" height={60} />
        <YAxis
          label={{ value: "Substitution %", angle: -90, position: "insideLeft" }}
          domain={[0, 100]}
        />
        <Tooltip formatter={(value) => `${value}%`} contentStyle={{ backgroundColor: "#fff" }} />
        <Legend verticalAlign="top" height={36} />
        <Bar dataKey="substitution_rate" name="Substitution %">
          {sorted.map((s) => (
            <Cell key={s.store_id} fill={s.flagged ? "#ff5722" : "#3b82f6"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SubstitutionChart;
