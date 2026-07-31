import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function NetworkHealthChart({ performance }) {
  const score = Math.max(0, Math.min(100, performance?.health_score || 0));
  const data = [{ name: "Healthy", value: score }, { name: "Remaining", value: 100 - score }];
  return <div style={styles.wrap}>
    <div style={styles.chart}>
      <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" startAngle={90} endAngle={-270} innerRadius="68%" outerRadius="92%" stroke="none"><Cell fill="#3b7ddd" /><Cell fill="#e9ecef" /></Pie></PieChart></ResponsiveContainer>
      <div style={styles.center}><strong>{score}</strong><span>health score</span></div>
    </div>
    <div style={styles.copy}><b>{performance?.label || "Network health"}</b><span>{performance?.summary || "Performance data will appear as orders are processed."}</span></div>
  </div>;
}

const styles = { wrap: { display: "flex", alignItems: "center", gap: 18, minHeight: 170 }, chart: { width: 154, height: 154, position: "relative", flex: "0 0 auto" }, center: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }, copy: { display: "flex", flexDirection: "column", gap: 7, fontSize: 12, color: "#6c757d", lineHeight: 1.45 } };
