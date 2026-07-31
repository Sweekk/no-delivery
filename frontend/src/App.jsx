import React, { useEffect, useState } from 'react';
import CustomerCheckout from './pages/CustomerCheckout';
import PickerRun from './pages/PickerRun';
import AdminDashboard from './pages/AdminDashboard';

function DeliveryPartnerWorkspace() {
  return (
    <section style={styles.deliveryPage}>
      <p style={styles.eyebrow}>QuickFIx Grocery Delivery</p>
      <h1 style={styles.deliveryTitle}>Delivery partner workspace</h1>
      <p style={styles.deliveryCopy}>Your assigned deliveries and route updates will appear here.</p>
      <div style={styles.deliveryCard}>
        <strong>No active delivery assigned</strong>
        <span>We’ll notify you as soon as a grocery order is ready for pickup.</span>
      </div>
    </section>
  );
}

const workspaces = {
  customer: { label: 'Customer workspace', detail: 'Your grocery order', component: CustomerCheckout },
  delivery: { label: 'Delivery partner workspace', detail: 'Pickup and delivery updates', component: DeliveryPartnerWorkspace },
  picker: { label: 'Store picker workspace', detail: 'Store fulfillment', component: PickerRun },
  admin: { label: 'Admin workspace', detail: 'Operations overview', component: AdminDashboard },
};

const loginOptions = [
  { role: 'customer', title: 'Customer', description: 'Review your cart and grocery order.', icon: '🛒' },
  { role: 'delivery', title: 'Delivery Partner', description: 'See delivery assignments and route updates.', icon: '🛵' },
  { role: 'picker', title: 'Store Picker', description: 'Pick and prepare store orders.', icon: '📦' },
  { role: 'admin', title: 'Admin', description: 'Monitor store operations and performance.', icon: '📊' },
];

function LoginPage({ onLogin }) {
  return (
    <main style={styles.loginPage}>
      <section style={styles.loginPanel}>
        <div style={styles.loginBrand}><span style={styles.brandMark}>Q</span>QuickFIx Grocery Delivery</div>
        <p style={styles.eyebrow}>Welcome</p>
        <h1 style={styles.loginTitle}>Choose how you’re signing in</h1>
        <p style={styles.loginCopy}>Select your role to open the right workspace.</p>
        <div style={styles.roleGrid}>
          {loginOptions.map((option) => (
            <button key={option.role} type="button" style={styles.roleCard} onClick={() => onLogin(option.role)}>
              <span style={styles.roleIcon}>{option.icon}</span>
              <span style={styles.roleTitle}>{option.title}</span>
              <span style={styles.roleDescription}>{option.description}</span>
              <span style={styles.continueLabel}>Continue →</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [page, setPage] = useState(null);

  useEffect(() => {
    const updatePage = () => {
      const pathRoute = window.location.pathname.split('/').filter(Boolean).at(-1);
      const hashRoute = window.location.hash.replace('#', '');
      const route = pathRoute || hashRoute;
      setPage(workspaces[route] ? route : null);
    };
    window.addEventListener('hashchange', updatePage);
    window.addEventListener('popstate', updatePage);
    updatePage();
    return () => {
      window.removeEventListener('hashchange', updatePage);
      window.removeEventListener('popstate', updatePage);
    };
  }, []);

  const chooseRole = (role) => {
    window.history.pushState({}, '', `/${role}`);
    setPage(role);
  };

  if (!page) return <LoginPage onLogin={chooseRole} />;

  const workspace = workspaces[page];
  const Page = workspace.component;
  return (
    <div style={styles.appWrapper}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.brand} aria-label="QuickFIx Grocery Delivery"><span style={styles.brandMark}>Q</span><span>QuickFIx Grocery Delivery</span></div>
          <div style={styles.divider} />
          <div><div style={styles.workspaceLabel}>{workspace.label}</div><div style={styles.workspaceDetail}>{workspace.detail}</div></div>
          <button type="button" style={styles.switchRole} onClick={() => chooseRole('')}>Switch role</button>
        </div>
      </header>
      <main style={styles.mainContent}><Page /></main>
    </div>
  );
}

const styles = {
  appWrapper: { minHeight: '100vh', backgroundColor: '#f6f8f7', color: '#17211a', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  header: { backgroundColor: '#fff', borderBottom: '1px solid #e4ebe5', position: 'sticky', top: 0, zIndex: 100 },
  headerContent: { maxWidth: '1280px', margin: '0 auto', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.9rem' },
  brand: { display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#12351d' },
  brandMark: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1.9rem', height: '1.9rem', borderRadius: '0.6rem', background: '#0c831f', color: '#fff', fontSize: '1rem', fontWeight: 800 },
  divider: { height: '2rem', width: '1px', background: '#e4ebe5' },
  workspaceLabel: { fontSize: '0.88rem', fontWeight: 750, color: '#203125' }, workspaceDetail: { marginTop: '0.08rem', fontSize: '0.75rem', color: '#68766c' },
  switchRole: { marginLeft: 'auto', padding: '0.5rem 0.75rem', border: '1px solid #d8e2da', borderRadius: '0.5rem', background: '#fff', color: '#285436', fontWeight: 700, cursor: 'pointer' },
  mainContent: { maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1.25rem' },
  loginPage: { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1.5rem', background: 'linear-gradient(135deg, #eef8ef 0%, #f8faf9 45%, #fff7df 100%)', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  loginPanel: { width: 'min(760px, 100%)', padding: 'clamp(1.5rem, 5vw, 3rem)', background: 'rgba(255,255,255,0.94)', border: '1px solid #e0eae2', borderRadius: '1.5rem', boxShadow: '0 20px 60px rgba(31, 68, 40, 0.12)' },
  loginBrand: { display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#12351d', fontWeight: 800, fontSize: '1.1rem', marginBottom: '2rem' },
  eyebrow: { margin: '0 0 0.5rem', color: '#0c831f', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' },
  loginTitle: { margin: 0, color: '#17211a', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', letterSpacing: '-0.045em' }, loginCopy: { margin: '0.75rem 0 1.75rem', color: '#68766c', lineHeight: 1.55 },
  roleGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' },
  roleCard: { textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.45rem', minHeight: '175px', padding: '1.1rem', border: '1px solid #dfe8e1', borderRadius: '1rem', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease' },
  roleIcon: { fontSize: '1.45rem' }, roleTitle: { color: '#203125', fontSize: '1rem', fontWeight: 800 }, roleDescription: { color: '#68766c', fontSize: '0.84rem', lineHeight: 1.45 }, continueLabel: { marginTop: 'auto', color: '#0c831f', fontSize: '0.82rem', fontWeight: 800 },
  deliveryPage: { maxWidth: '760px', margin: '2rem auto', padding: '1rem' }, deliveryTitle: { margin: 0, color: '#1e293b', fontSize: '1.7rem' }, deliveryCopy: { color: '#64748b', margin: '0.5rem 0 1.5rem' }, deliveryCard: { display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '1rem', color: '#64748b' },
};
