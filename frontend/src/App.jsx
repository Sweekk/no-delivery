import React, { useEffect, useState } from 'react';
import CustomerCheckout from './pages/CustomerCheckout';
import PickerRun from './pages/PickerRun';
import AdminDashboard from './pages/AdminDashboard';

function DeliveryPartnerWorkspace() {
  return (
    <section style={styles.deliveryPage}>
      <p style={styles.eyebrow}>QuickFIx Grocery</p>
      <h1 style={styles.deliveryTitle}>Delivery partner workspace</h1>
      <p style={styles.deliveryCopy}>Your assigned deliveries and route updates will appear here.</p>
      <div style={styles.deliveryCard}>
        <strong>No active delivery assigned</strong>
        <span>We'll notify you as soon as a grocery order is ready for pickup.</span>
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

const roleOptions = [
  { role: 'customer', title: 'Customer', description: 'Review your cart and grocery order.', icon: '🛒' },
  { role: 'delivery', title: 'Delivery Partner', description: 'See delivery assignments and route updates.', icon: '🛵' },
  { role: 'picker', title: 'Store Picker', description: 'Pick and prepare store orders.', icon: '📦' },
  { role: 'admin', title: 'Admin', description: 'Monitor store operations and performance.', icon: '📊' },
];

function RoleSelector({ selectedRole, onSelect }) {
  return (
    <div style={styles.roleGrid}>
      {roleOptions.map((option) => {
        const isSelected = option.role === selectedRole;
        return (
          <button
            key={option.role}
            type="button"
            style={{
              ...styles.roleCard,
              ...(isSelected ? styles.roleCardSelected : null),
            }}
            onClick={() => onSelect(option.role)}
            aria-pressed={isSelected}
          >
            <span style={styles.roleIcon}>{option.icon}</span>
            <span style={styles.roleTitle}>{option.title}</span>
            <span style={styles.roleDescription}>{option.description}</span>
            <span style={styles.continueLabel}>{isSelected ? 'Selected ✓' : 'Select'}</span>
          </button>
        );
      })}
    </div>
  );
}

function LoginPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [role, setRole] = useState('customer');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Enter a username.');
      return;
    }
    if (!password) {
      setError('Enter a password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    // No backend wired up yet — proceed straight to the chosen workspace.
    onAuthenticated(role, username.trim());
  };

  return (
    <main style={styles.loginPage}>
      <section style={styles.loginPanel}>
        <div style={styles.loginLayout}>
          <div style={styles.heroSide}>
            <div style={styles.loginBrand}>
              <span style={styles.brandMark}>Q</span>QuickFIx Grocery Delivery
            </div>
            <div style={styles.heroVisual}>
              <img
                src="/quickfix-hero.svg"
                alt="QuickFIx grocery delivery illustration"
                style={styles.heroImage}
              />
            </div>
          </div>

          <div style={styles.formSide}>
            <p style={styles.eyebrow}>Welcome</p>
            <h1 style={styles.loginTitle}>
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </h1>
            <p style={styles.loginCopy}>
              {mode === 'login'
                ? 'Enter your details and pick your workspace.'
                : 'Set a username and password, then pick your workspace.'}
            </p>

            <div style={styles.tabRow} role="tablist" aria-label="Choose sign in or sign up">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                style={{ ...styles.tabButton, ...(mode === 'login' ? styles.tabButtonActive : null) }}
                onClick={() => switchMode('login')}
              >
                Log in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                style={{ ...styles.tabButton, ...(mode === 'signup' ? styles.tabButtonActive : null) }}
                onClick={() => switchMode('signup')}
              >
                Sign up
              </button>
            </div>

            <form style={styles.form} onSubmit={handleSubmit} noValidate>
              <label style={styles.fieldLabel}>
                Username
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  style={styles.input}
                  autoComplete="username"
                />
              </label>

              <label style={styles.fieldLabel}>
                {mode === 'login' ? 'Password' : 'Create password'}
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'login' ? 'Enter your password' : 'At least 6 characters'}
                  style={styles.input}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </label>

              {mode === 'signup' && (
                <label style={styles.fieldLabel}>
                  Confirm password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    style={styles.input}
                    autoComplete="new-password"
                  />
                </label>
              )}

              {error && <div style={styles.errorText}>{error}</div>}

              <p style={styles.roleSectionLabel}>Choose your workspace</p>
              <RoleSelector selectedRole={role} onSelect={setRole} />

              <button type="submit" style={styles.submitButton}>
                {mode === 'login' ? 'Log in' : 'Create account'} →
              </button>
            </form>
          </div>
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

  const handleAuthenticated = (role /*, username */) => {
    chooseRole(role);
  };

  if (!page) return <LoginPage onAuthenticated={handleAuthenticated} />;

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
  loginPanel: { width: 'min(1080px, 100%)', padding: 'clamp(1rem, 3vw, 1.4rem)', background: 'rgba(255,255,255,0.94)', border: '1px solid #e0eae2', borderRadius: '1.5rem', boxShadow: '0 20px 60px rgba(31, 68, 40, 0.12)' },
  loginLayout: { display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.25rem', alignItems: 'stretch' },
  heroSide: { display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem', background: 'linear-gradient(160deg, #eff9f1 0%, #f9fbf9 100%)', borderRadius: '1.15rem', minHeight: '100%' },
  formSide: { display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0.35rem 0.25rem 0.35rem 0.1rem' },
  loginBrand: { display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#12351d', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' },
  heroVisual: { flex: 1, display: 'grid', placeItems: 'center', borderRadius: '1rem', overflow: 'hidden', background: '#f6fbf7', border: '1px solid #d9eadc' },
  heroImage: { width: '100%', height: '100%', objectFit: 'contain', display: 'block' },
  eyebrow: { margin: '0 0 0.5rem', color: '#0c831f', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' },
  loginTitle: { margin: 0, color: '#17211a', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', letterSpacing: '-0.045em' },
  loginCopy: { margin: '0.6rem 0 1.5rem', color: '#68766c', lineHeight: 1.55 },
  tabRow: { display: 'flex', gap: '0.4rem', padding: '0.3rem', background: '#eef2ef', borderRadius: '0.75rem', marginBottom: '1.5rem', width: 'fit-content' },
  tabButton: { padding: '0.5rem 1.2rem', border: 'none', borderRadius: '0.55rem', background: 'transparent', color: '#68766c', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' },
  tabButtonActive: { background: '#fff', color: '#0c831f', boxShadow: '0 1px 4px rgba(12,131,31,0.18)' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  fieldLabel: { display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#203125' },
  input: { padding: '0.7rem 0.85rem', border: '1px solid #d8e2da', borderRadius: '0.6rem', fontSize: '0.95rem', fontFamily: 'inherit', color: '#17211a', outline: 'none' },
  errorText: { color: '#b3261e', fontSize: '0.85rem', fontWeight: 600, background: '#fdecea', border: '1px solid #f6cdc9', borderRadius: '0.5rem', padding: '0.55rem 0.75rem' },
  roleSectionLabel: { margin: '0.25rem 0 0', fontSize: '0.85rem', fontWeight: 700, color: '#203125' },
  roleGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.7rem' },
  roleCard: { textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem', minHeight: '140px', padding: '0.9rem', border: '1px solid #dfe8e1', borderRadius: '0.85rem', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease' },
  roleCardSelected: { borderColor: '#0c831f', boxShadow: '0 0 0 2px rgba(12,131,31,0.25)', background: '#f3fbf3' },
  roleIcon: { fontSize: '1.3rem' },
  roleTitle: { color: '#203125', fontSize: '0.92rem', fontWeight: 800 },
  roleDescription: { color: '#68766c', fontSize: '0.78rem', lineHeight: 1.4 },
  continueLabel: { marginTop: 'auto', color: '#0c831f', fontSize: '0.78rem', fontWeight: 800 },
  submitButton: { marginTop: '0.4rem', padding: '0.85rem 1rem', border: 'none', borderRadius: '0.7rem', background: '#0c831f', color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' },
  deliveryPage: { maxWidth: '760px', margin: '2rem auto', padding: '1rem' },
  deliveryTitle: { margin: 0, color: '#1e293b', fontSize: '1.7rem' },
  deliveryCopy: { color: '#64748b', margin: '0.5rem 0 1.5rem' },
  deliveryCard: { display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '1rem', color: '#64748b' },
};
