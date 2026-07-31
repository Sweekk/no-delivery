import React, { useEffect, useState, useCallback } from "react";
import SubstitutionChart from "./SubstitutionChart";
import FulfillmentChart from "./FulfillmentChart";
import FlaggedStoresPanel from "./FlaggedStoresPanel";
import NetworkHealthChart from "./NetworkHealthChart";
import "./AdminDashboard.css";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const navigationItems = [
  { id: "overview", label: "Dashboard", badge: "New", icon: "📊" },
  { id: "analysis", label: "Analytics", icon: "📈" },
  { id: "orders", label: "Food orders", icon: "🛒" },
  { id: "stores", label: "Stores", icon: "🏪" },
  { id: "team", label: "Settings", icon: "⚙️" },
];

export default function Dashboard() {
  const [section, setSection] = useState("overview");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("7days");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError("");
      const response = await fetch("/api/admin/dashboard");
      if (!response.ok) throw new Error("Unable to load dashboard data");
      setData(await response.json());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live Auto-Refresh Effect (Polls every 10 seconds when enabled)
  useEffect(() => {
    let interval = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadData();
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, loadData]);

  // CSV Export Engine
  const handleExportCSV = () => {
    if (!data) return;
    const metrics = data.metrics || {};
    const orders = metrics.recent_orders || [];
    const stores = data.substitution?.stores || [];

    let csvContent = "data:text/csv;charset=utf-8,";

    // Summary Section
    csvContent += "--- METRICS SUMMARY ---\n";
    csvContent += `Total Income,${metrics.total_revenue || 0}\n`;
    csvContent += `Total Orders,${metrics.total_orders || 0}\n`;
    csvContent += `Average Order Value,${metrics.average_order_value || 0}\n`;
    csvContent += `Active Stores,${metrics.active_stores || 0}\n`;
    csvContent += `Active Delivery Partners,${metrics.active_delivery_partners || 0}\n\n`;

    // Orders Section
    csvContent += "--- RECENT FOOD ORDERS ---\n";
    csvContent += "Order ID,Store Name,Status,Amount (INR),Date\n";
    orders.forEach((o) => {
      csvContent += `${o.order_id},"${o.store_name}",${o.order_status},${o.total_amount},${o.order_date || ""}\n`;
    });

    csvContent += "\n--- STORE SUBSTITUTION PERFORMANCE ---\n";
    csvContent += "Store ID,Store Name,Substitution Rate %,Flagged\n";
    stores.forEach((s) => {
      csvContent += `${s.store_id},"${s.store_name}",${s.substitution_rate},${s.flagged ? "YES" : "NO"}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `admin_dashboard_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!data && !error) {
    return <div style={styles.loading}>Loading admin metrics...</div>;
  }

  if (error) {
    return (
      <div style={styles.loading}>
        {error}{" "}
        <button onClick={loadData} style={styles.retry}>
          Try again
        </button>
      </div>
    );
  }

  const rawMetrics = data?.metrics || {};
  const substitution = data?.substitution || { stores: [], flag_threshold: 25 };
  const fulfillment = data?.fulfillment || { overall_average_minutes: 0, per_store: [] };
  const performance = data?.performance || {};

  // Apply Date Range multiplier for demo dynamic stats
  const dateMultiplier =
    dateRange === "today"
      ? 0.25
      : dateRange === "7days"
      ? 1.0
      : dateRange === "30days"
      ? 3.8
      : 5.2;

  const metrics = {
    ...rawMetrics,
    total_revenue: (rawMetrics.total_revenue || 0) * dateMultiplier,
    total_orders: Math.round((rawMetrics.total_orders || 0) * dateMultiplier),
  };

  // Filter Orders by Search Query & Status Filter
  const recentOrders = (rawMetrics.recent_orders || []).filter((order) => {
    const matchesSearch =
      !searchQuery ||
      String(order.order_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(order.store_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(order.order_status).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      String(order.order_status).toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filter Stores by Search Query
  const filteredStores = (substitution.stores || []).filter(
    (s) =>
      !searchQuery ||
      s.store_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Top header greeting & control bar
  const HeaderBar = ({ title, subtitle }) => (
    <header className="admin-top-header">
      <div className="header-title-group">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="top-action-bar">
        {/* Date Filter Dropdown */}
        <select
          className="date-selector-select"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="today">📅 Today</option>
          <option value="7days">📅 Last 7 days</option>
          <option value="30days">📅 Last 30 days</option>
          <option value="all">📅 All time</option>
        </select>

        {/* Live Auto Refresh Toggle */}
        <button
          className={`auto-refresh-toggle-btn ${autoRefresh ? "active" : ""}`}
          onClick={() => setAutoRefresh(!autoRefresh)}
          title="Toggle 10-second automatic background refresh"
        >
          {autoRefresh && <span className="live-pulse-dot"></span>}
          {autoRefresh ? "Live 10s" : "Auto-Refresh Off"}
        </button>

        <button className="btn-header-action" onClick={loadData}>
          🔄 Refresh
        </button>
        <button className="btn-header-action" onClick={handleExportCSV}>
          📥 Export CSV
        </button>
        <button className="btn-header-action">ℹ info</button>
      </div>
    </header>
  );

  // Top stat strip
  const StatStrip = () => (
    <div className="stat-strip-container">
      <div className="stat-metric-card">
        <span className="stat-label-title">Total income</span>
        <span className="stat-value-main">{money(metrics.total_revenue)}</span>
        <span className="stat-note-sub">Filtered range total</span>
      </div>
      <div className="stat-metric-card">
        <span className="stat-label-title">Total orders</span>
        <span className="stat-value-main">
          {(metrics.total_orders || 0).toLocaleString()}
        </span>
        <span className="stat-note-sub">Filtered timeframe</span>
      </div>
      <div className="stat-metric-card">
        <span className="stat-label-title">Average order</span>
        <span className="stat-value-main">{money(metrics.average_order_value)}</span>
        <span className="stat-note-sub">Current basket value</span>
      </div>
      <div className="stat-metric-card">
        <span className="stat-label-title">Delivery partners</span>
        <span className="stat-value-main">
          {metrics.active_delivery_partners || 0}
        </span>
        <span className="stat-note-sub">
          Across {metrics.active_stores || 0} active stores
        </span>
      </div>
    </div>
  );

  // View 1: Overview
  const overviewView = (
    <>
      <HeaderBar
        title="Kenneth Osborne"
        subtitle="Your last login: 21h ago from newzealand."
      />
      <StatStrip />
      <div className="dashboard-content-body">
        <div className="main-dashboard-grid">
          <div>
            <Card title="Order workflow">
              <div className="workflow-grid">
                {Object.entries(metrics.status_breakdown || {}).map(([name, count]) => (
                  <div key={name} className="workflow-item-box">
                    <span className="workflow-name">{name.replace(/_/g, " ")}</span>
                    <span className="workflow-count">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Recent food orders">
              <StatusFilterPills
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />
              <OrdersTable orders={recentOrders} />
            </Card>
          </div>
          <div>
            <Card title="Network performance">
              <NetworkHealthChart performance={performance} />
            </Card>
            <Card title="Fulfillment speed">
              <FulfillmentChart data={fulfillment} />
            </Card>
            <FlaggedStoresPanel
              stores={filteredStores}
              threshold={substitution.flag_threshold}
            />
          </div>
        </div>
      </div>
    </>
  );

  // View 2: Analytics
  const analyticsView = (
    <>
      <HeaderBar
        title="Analytics"
        subtitle="Track fulfillment speed and item substitution rates across your network."
      />
      <div className="dashboard-content-body">
        <Card title="Substitution rate by store">
          <SubstitutionChart data={{ ...substitution, stores: filteredStores }} />
        </Card>
        <Card title="Fulfillment time by store">
          <FulfillmentChart data={fulfillment} />
        </Card>
      </div>
    </>
  );

  // View 3: Food Orders
  const ordersView = (
    <>
      <HeaderBar
        title="Food orders"
        subtitle="Live feed of orders received across all store locations."
      />
      <div className="dashboard-content-body">
        <Card title="Order activity">
          <StatusFilterPills
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
          <OrdersTable orders={recentOrders} />
        </Card>
      </div>
    </>
  );

  // View 4: Stores
  const storesView = (
    <>
      <HeaderBar
        title="Stores"
        subtitle="Monitor store performance, availability, and substitution flags."
      />
      <div className="dashboard-content-body">
        <FlaggedStoresPanel
          stores={filteredStores}
          threshold={substitution.flag_threshold}
        />
        <Card title="Store substitution rate">
          <SubstitutionChart data={{ ...substitution, stores: filteredStores }} />
        </Card>
      </div>
    </>
  );

  // View 5: Settings & Fleet View
  const teamView = (
    <>
      <HeaderBar
        title="Settings & Fleet"
        subtitle="Network availability and delivery fleet capacity management."
      />
      <div className="dashboard-content-body">
        <Card title="Active Delivery Fleet Capacity">
          <p style={{ color: "#7e8299", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
            <b>{metrics.active_delivery_partners || 0}</b> active delivery partners are assigned across <b>{metrics.active_stores || 0}</b> store hubs.
          </p>
          <div className="fleet-grid">
            {[
              { name: "Rahul Sharma", status: "BUSY", store: "Koramangala Hub" },
              { name: "Anish Patel", status: "AVAILABLE", store: "Indiranagar Hub" },
              { name: "Priya Singh", status: "BUSY", store: "HSR Layout Hub" },
              { name: "Vikram Reddy", status: "AVAILABLE", store: "Whitefield Hub" },
            ].map((partner) => (
              <div key={partner.name} className="partner-card">
                <div className="partner-info">
                  <span className="partner-name">{partner.name}</span>
                  <span className="partner-store">📍 {partner.store}</span>
                </div>
                <span className={`partner-badge ${partner.status}`}>
                  {partner.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );

  const views = {
    overview: overviewView,
    analysis: analyticsView,
    orders: ordersView,
    stores: storesView,
    team: teamView,
  };

  return (
    <div className="admin-layout">
      {/* Dark Sidebar */}
      <aside className="admin-sidebar">
        {/* Profile */}
        <div className="user-profile-widget">
          <div className="avatar-wrapper">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Kenneth Osborne"
              className="user-avatar"
            />
            <span className="status-dot"></span>
          </div>
          <div className="user-meta">
            <span className="user-name">Kenneth Osborne</span>
            <span className="user-subtext">
              <span style={{ color: "#50cd89" }}>●</span> Welcome
            </span>
          </div>
        </div>

        {/* Global Search Input */}
        <div className="sidebar-search-box">
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Search orders, stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="sidebar-search-icon">🔍</span>
        </div>

        {/* Dash menu label */}
        <div className="menu-section-header">Dash menu</div>

        {/* Nav List */}
        <ul className="sidebar-nav-list">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-item-btn ${section === item.id ? "active" : ""}`}
                onClick={() => setSection(item.id)}
              >
                <div className="nav-item-left">
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && <span className="new-badge">{item.badge}</span>}
                </div>
              </button>
            </li>
          ))}
        </ul>

        {/* Category Footer */}
        <div className="menu-section-header">Category</div>
        <div className="category-tag-item">
          <span className="tag-dot sales"></span> #Sales
        </div>
        <div className="category-tag-item">
          <span className="tag-dot marketing"></span> #Marketing
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-wrapper">{views[section] || views.overview}</main>

      {/* Settings Floating Action Button */}
      <button
        className="floating-settings-fab"
        title="Fleet Settings"
        onClick={() => setSection("team")}
      >
        ⚙️
      </button>
    </div>
  );
}

function StatusFilterPills({ statusFilter, setStatusFilter }) {
  const statuses = [
    "ALL",
    "PENDING",
    "PICKING",
    "AWAITING_SUBSTITUTION",
    "FINALIZED",
    "DELIVERED",
  ];
  return (
    <div className="status-pills-bar" style={{ marginBottom: "1rem" }}>
      {statuses.map((st) => (
        <button
          key={st}
          className={`status-pill-btn ${statusFilter === st ? "active" : ""}`}
          onClick={() => setStatusFilter(st)}
        >
          {st.replace(/_/g, " ")}
        </button>
      ))}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="theme-card">
      <div className="theme-card-header">
        <h2 className="theme-card-title">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function OrdersTable({ orders }) {
  if (!orders || !orders.length) {
    return (
      <p style={{ color: "#7e8299", fontSize: "0.875rem", padding: "0.5rem 0" }}>
        No matching orders found.
      </p>
    );
  }

  return (
    <table className="orders-data-table">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Store</th>
          <th>Status</th>
          <th style={{ textAlign: "right" }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.order_id}>
            <td style={{ fontWeight: 600 }}>{String(o.order_id).slice(0, 8)}</td>
            <td>{o.store_name}</td>
            <td>
              <span
                className={`status-tag ${String(
                  o.order_status
                ).toUpperCase()}`}
              >
                {String(o.order_status).replace(/_/g, " ")}
              </span>
            </td>
            <td style={{ textAlign: "right", fontWeight: 700 }}>
              {money(o.total_amount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const styles = {
  loading: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    color: "#777",
    fontFamily: "Inter, sans-serif",
  },
  retry: {
    border: 0,
    color: "#7239ea",
    background: "none",
    textDecoration: "underline",
    cursor: "pointer",
    fontWeight: 700,
  },
};
