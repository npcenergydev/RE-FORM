import React from 'react';
import { IconRibbonBow, IconUser } from './Icons.jsx';

export function Navbar({ aiStatus, currentUser, onOpenAuth, onNavigateAccount }) {
  return (
    <header className="mobile-header">
      <div className="brand-wrapper">
        <img 
          src="/logo.jpg" 
          alt="re:create Logo" 
          className="header-logo"
          onError={(e) => {
            e.currentTarget.src = "/logo.png";
          }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="brand-title">re:create</span>
            <span className="ribbon-animated" style={{ color: 'var(--accent)' }}>
              <IconRibbonBow size={15} />
            </span>
          </div>
          <span className="brand-tagline">Waste. Create. Inspire.</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Customer Account / Sign In Pill */}
        {currentUser ? (
          <button
            type="button"
            onClick={onNavigateAccount}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--surface-sunken)',
              border: '1px solid var(--accent)',
              borderRadius: '999px',
              padding: '3px 10px 3px 4px',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: 12
            }}
            title="View allocated materials & customer profile"
          >
            <img 
              src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
              alt={currentUser.name}
              style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
            />
            <span style={{ fontWeight: 600 }}>{currentUser.name.split(' ')[0]}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="btn btn-primary btn-sm"
            style={{ fontSize: 11, padding: '4px 10px' }}
          >
            Sign In
          </button>
        )}

        <div className="ai-status-pill" title={aiStatus.connected ? "Connected to Gemini Flash API" : "Using demo fallback mode"}>
          <span className={`ai-status-dot ${aiStatus.connected ? 'connected' : 'demo'}`}></span>
          <span>{aiStatus.connected ? 'AI: Online' : 'AI: Demo'}</span>
        </div>
      </div>
    </header>
  );
}
