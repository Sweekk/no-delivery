import React, { useState } from 'react';
import { login, signup, storeSession } from '../../authApi';
import { useAuth } from '../../context/AuthContext';

const roleOptions = [
  { role: 'customer', title: 'Customer', icon: '🛒' },
  { role: 'delivery', title: 'Delivery', icon: '🛵' },
  { role: 'picker', title: 'Picker', icon: '📦' },
  { role: 'admin', title: 'Admin', icon: '📊' },
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
          </button>
        );
      })}
    </div>
  );
}

export function LoginPage({ onAuthenticated }) {
  const { login: contextLogin } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [role, setRole] = useState('customer');
  const [username, setUsername] = useState('alex.customer@quickfix.com');
  const [password, setPassword] = useState('Password123!');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Enter a username or email.');
      setIsSubmitting(false);
      return;
    }
    if (!password) {
      setError('Enter a password.');
      setIsSubmitting(false);
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setIsSubmitting(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const result = mode === 'signup'
        ? await signup({ username: trimmedUsername, password, role })
        : await login({ username: trimmedUsername, password, role });

      if (!result.ok) {
        setError(result.error || 'Authentication failed.');
        setIsSubmitting(false);
        return;
      }

      const authenticatedUser = result.user || { username: trimmedUsername, role };
      storeSession(result.token, authenticatedUser);

      if (contextLogin) {
        await contextLogin(trimmedUsername, password, role);
      }

      if (onAuthenticated) {
        onAuthenticated(authenticatedUser);
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to authentication server. Please ensure backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoginMode = mode === 'login';

  return (
    <main style={styles.loginPage}>
      <section style={styles.loginPanel}>
        <div style={styles.loginLayoutContainer}>

          {/* GROCERY CART HERO IMAGE PANEL (SLIDES FROM LEFT TO RIGHT ON SIGNUP) */}
          <div
            style={{
              ...styles.heroSide,
              transform: isLoginMode ? 'translateX(0%)' : 'translateX(100%)',
            }}
          >
            <div style={styles.loginBrand}>
              <span style={styles.brandMark}>Q</span>QuickFix Grocery Delivery
            </div>
            <div style={styles.heroVisual}>
              <img
                src="/grocery-cart.png"
                alt="Fresh Grocery Cart"
                style={styles.heroImage}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80';
                }}
              />
            </div>
          </div>

          {/* FORM SIDE PANEL (SLIDES FROM RIGHT TO LEFT ON SIGNUP - NO SCROLL) */}
          <div
            style={{
              ...styles.formSide,
              transform: isLoginMode ? 'translateX(0%)' : 'translateX(-100%)',
            }}
          >
            <p style={styles.eyebrow}>Welcome</p>
            <h1 style={styles.loginTitle}>
              {isLoginMode ? 'Sign in to your account' : 'Create your account'}
            </h1>
            <p style={styles.loginCopy}>
              {isLoginMode
                ? 'Enter your details and pick your workspace.'
                : 'Set a username and password, then pick your workspace.'}
            </p>

            <div style={styles.tabRow} role="tablist" aria-label="Choose sign in or sign up">
              <button
                type="button"
                role="tab"
                aria-selected={isLoginMode}
                style={{ ...styles.tabButton, ...(isLoginMode ? styles.tabButtonActive : null) }}
                onClick={() => switchMode('login')}
              >
                Log in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isLoginMode}
                style={{ ...styles.tabButton, ...(!isLoginMode ? styles.tabButtonActive : null) }}
                onClick={() => switchMode('signup')}
              >
                Sign up
              </button>
            </div>

            <form style={styles.form} onSubmit={handleSubmit} noValidate>
              <label style={styles.fieldLabel}>
                Username or Email
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username or email"
                  style={styles.input}
                  autoComplete="username"
                />
              </label>

              <label style={styles.fieldLabel}>
                {isLoginMode ? 'Password' : 'Create password'}
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLoginMode ? 'Enter your password' : 'At least 6 characters'}
                  style={styles.input}
                  autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                />
              </label>

              {!isLoginMode && (
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

              <p style={styles.roleSectionLabel}>Select workspace</p>
              <RoleSelector selectedRole={role} onSelect={setRole} />

              <button type="submit" style={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? 'Authenticating...' : isLoginMode ? 'Log in →' : 'Create account →'}
              </button>
            </form>
          </div>

        </div>
      </section>
    </main>
  );
}

const styles = {
  loginPage: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: '1.25rem',
    background: 'linear-gradient(135deg, #eef8ef 0%, #f8faf9 45%, #fff7df 100%)',
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  },
  loginPanel: {
    width: 'min(1060px, 100%)',
    padding: '0.85rem',
    background: 'rgba(255,255,255,0.96)',
    border: '1px solid #e0eae2',
    borderRadius: '1.5rem',
    boxShadow: '0 20px 60px rgba(31, 68, 40, 0.12)',
    overflow: 'hidden'
  },
  loginLayoutContainer: {
    position: 'relative',
    display: 'flex',
    width: '100%',
    minHeight: '620px',
    overflow: 'hidden',
    borderRadius: '1.25rem'
  },
  heroSide: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    padding: '0.85rem',
    background: 'linear-gradient(160deg, #eff9f1 0%, #f9fbf9 100%)',
    borderRadius: '1.15rem',
    zIndex: 2,
    transition: 'transform 550ms cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'transform'
  },
  formSide: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '1rem 1.75rem',
    zIndex: 1,
    transition: 'transform 550ms cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'transform',
    overflow: 'hidden' // NO SCROLLBAR!
  },
  loginBrand: { display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#12351d', fontWeight: 800, fontSize: '1.05rem' },
  brandMark: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1.8rem', height: '1.8rem', borderRadius: '0.55rem', background: '#0c831f', color: '#fff', fontSize: '0.95rem', fontWeight: 800 },
  heroVisual: { flex: 1, display: 'block', borderRadius: '0.9rem', overflow: 'hidden', background: '#f6fbf7', border: '1px solid #d9eadc' },
  heroImage: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '0.85rem' },
  eyebrow: { margin: '0 0 0.2rem', color: '#0c831f', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' },
  loginTitle: { margin: 0, color: '#17211a', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', letterSpacing: '-0.04em' },
  loginCopy: { margin: '0.25rem 0 0.75rem', color: '#68766c', fontSize: '0.8rem', lineHeight: 1.4 },
  tabRow: { display: 'flex', gap: '0.3rem', padding: '0.25rem', background: '#eef2ef', borderRadius: '0.65rem', marginBottom: '0.85rem', width: 'fit-content' },
  tabButton: { padding: '0.4rem 1rem', border: 'none', borderRadius: '0.5rem', background: 'transparent', color: '#68766c', fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 200ms ease' },
  tabButtonActive: { background: '#fff', color: '#0c831f', boxShadow: '0 1px 4px rgba(12,131,31,0.18)' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  fieldLabel: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#203125' },
  input: { padding: '0.55rem 0.75rem', border: '1px solid #d8e2da', borderRadius: '0.55rem', fontSize: '0.85rem', fontFamily: 'inherit', color: '#17211a', outline: 'none' },
  errorText: { color: '#b3261e', fontSize: '0.78rem', fontWeight: 600, background: '#fdecea', border: '1px solid #f6cdc9', borderRadius: '0.5rem', padding: '0.45rem 0.65rem' },
  roleSectionLabel: { margin: '0.1rem 0 0', fontSize: '0.78rem', fontWeight: 700, color: '#203125' },
  roleGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' },
  roleCard: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.15rem', padding: '0.45rem 0.25rem', border: '1px solid #dfe8e1', borderRadius: '0.65rem', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease' },
  roleCardSelected: { borderColor: '#0c831f', boxShadow: '0 0 0 2px rgba(12,131,31,0.25)', background: '#f3fbf3' },
  roleIcon: { fontSize: '1.1rem' },
  roleTitle: { color: '#203125', fontSize: '0.75rem', fontWeight: 800 },
  submitButton: { marginTop: '0.25rem', padding: '0.75rem 1rem', border: 'none', borderRadius: '0.65rem', background: '#0c831f', color: '#fff', fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'background-color 200ms ease' },
};

export default LoginPage;
