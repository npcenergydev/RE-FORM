import React, { useState } from 'react';
import { 
  registerWithFirebase, 
  signInWithFirebase,
  signInWithGoogle
} from '../firebase.js';
import { 
  setCurrentUser, 
  getCustomers 
} from '../utils/storage.js';
import { INITIAL_CUSTOMERS } from '../constants/seedCustomers.js';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('creator');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      let user = null;
      if (isSignUp) {
        if (!name.trim()) throw new Error("Please enter your name or studio name");
        user = await registerWithFirebase(name, email, password, role);
      } else {
        user = await signInWithFirebase(email, password);
      }

      setCurrentUser(user);
      setLoading(false);
      if (onAuthSuccess) onAuthSuccess(user);
      onClose();
    } catch (err) {
      console.warn("Auth error:", err);
      setErrorMsg(err.message || "Authentication failed. You can also click 'Continue as demo user' below.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const user = await signInWithGoogle(role);
      setCurrentUser(user);
      setLoading(false);
      if (onAuthSuccess) onAuthSuccess(user);
      onClose();
    } catch (err) {
      console.warn("Google sign-in notice:", err);
      setErrorMsg(
        err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed'
          ? "Google provider is not yet enabled in Firebase Console. You can click 'Continue as demo user' below."
          : (err.message || "Google sign-in was cancelled or failed.")
      );
      setLoading(false);
    }
  };

  const handleContinueAsDemo = () => {
    const demo = INITIAL_CUSTOMERS[0]; // Aanya Sharma (Creator)
    setCurrentUser(demo);
    if (onAuthSuccess) onAuthSuccess(demo);
    onClose();
  };

  const handleQuickDemoLogin = (demoCustomer) => {
    setCurrentUser(demoCustomer);
    if (onAuthSuccess) onAuthSuccess(demoCustomer);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-card animate-scale-in" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '440px' }}
      >
        {/* Header with Ribbon Icon */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <span className="badge badge-accent" style={{ marginBottom: '0.4rem' }}>
              Atelier Access
            </span>
            <h3 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'var(--font-serif)', color: 'var(--text)' }}>
              {isSignUp ? 'Create Atelier Account' : 'Sign In to Re:form'}
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              {isSignUp 
                ? 'Join independent creators and zero-waste studios.' 
                : 'Access your salvaged materials and track creative impact.'}
            </p>
          </div>
          <button 
            type="button" 
            className="btn btn-ghost" 
            onClick={onClose} 
            style={{ padding: '0.35rem', borderRadius: '50%' }}
            aria-label="Close dialog"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div style={{ display: 'flex', background: 'var(--surface-sunken)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '0.45rem',
              borderRadius: 'calc(var(--radius-sm) - 2px)',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: !isSignUp ? 600 : 400,
              background: !isSignUp ? 'var(--accent)' : 'transparent',
              color: !isSignUp ? '#0A0A0D' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '0.45rem',
              borderRadius: 'calc(var(--radius-sm) - 2px)',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: isSignUp ? 600 : 400,
              background: isSignUp ? 'var(--accent)' : 'transparent',
              color: isSignUp ? '#0A0A0D' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem', color: '#F87171', marginBottom: '1rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Google Sign-in & Instant Demo Access */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: '#FFFFFF',
              color: '#1F2937',
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={handleContinueAsDemo}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(212, 138, 148, 0.12)',
              color: 'var(--accent)',
              border: '1px solid var(--accent-border)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ⚡ Continue as Demo User (Instant Access)
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            or with email & password
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text)' }}>
                Full Name / Studio Name
              </label>
              <input 
                type="text"
                className="input-field"
                placeholder="e.g. Aanya Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
                required={isSignUp}
              />
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text)' }}>
              Email Address
            </label>
            <input 
              type="email"
              className="input-field"
              placeholder="you@atelier.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: isSignUp ? '1rem' : '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text)' }}>
              Password
            </label>
            <input 
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {isSignUp && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text)' }}>
                Account Purpose
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <label 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${role === 'creator' ? 'var(--accent)' : 'var(--border)'}`,
                    background: role === 'creator' ? 'rgba(212, 138, 148, 0.08)' : 'var(--surface-sunken)',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  <input 
                    type="radio" 
                    name="role" 
                    value="creator" 
                    checked={role === 'creator'} 
                    onChange={() => setRole('creator')} 
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Artist / Creator</span>
                </label>

                <label 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${role === 'supplier' ? 'var(--accent)' : 'var(--border)'}`,
                    background: role === 'supplier' ? 'rgba(212, 138, 148, 0.08)' : 'var(--surface-sunken)',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  <input 
                    type="radio" 
                    name="role" 
                    value="supplier" 
                    checked={role === 'supplier'} 
                    onChange={() => setRole('supplier')} 
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Studio Supplier</span>
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', marginBottom: '1.25rem' }}
          >
            {loading 
              ? (isSignUp ? 'Creating Profile...' : 'Authenticating...') 
              : (isSignUp ? 'Create Account & Save to Firebase' : 'Sign In')}
          </button>
        </form>

        {/* 1-Click Demo Accounts (Judges & Testing) */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Instant Demo Logins (Pre-loaded with materials)
          </div>
          <div style={{ display: 'grid', gap: '0.4rem' }}>
            {INITIAL_CUSTOMERS.slice(0, 4).map(demo => (
              <button
                key={demo.id}
                type="button"
                onClick={() => handleQuickDemoLogin(demo)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>{demo.name}</span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                    ({demo.providedMaterials?.length || 0} materials allocated)
                  </span>
                </div>
                <span className="badge badge-accent" style={{ fontSize: '0.675rem' }}>
                  {demo.role}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
