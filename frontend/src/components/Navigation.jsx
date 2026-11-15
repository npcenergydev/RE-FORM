import React from 'react';
import { 
  IconDashboard, 
  IconScan, 
  IconChallenge, 
  IconIdeas, 
  IconGallery, 
  IconMap, 
  IconOrders, 
  IconRibbonBow,
  IconUser
} from './Icons.jsx';

export function Navigation({ activeTab, setActiveTab, aiStatus, currentUser, onOpenAuth }) {
  const isSupplier = currentUser?.role === 'supplier';

  const navItems = isSupplier ? [
    { id: 'dashboard', label: 'Dashboard', icon: IconDashboard },
    { id: 'orders', label: 'Supplier Desk', icon: IconOrders },
    { id: 'account', label: 'Material Custody', icon: IconUser },
    { id: 'map', label: 'Studio Map', icon: IconMap },
    { id: 'gallery', label: 'Gallery', icon: IconGallery },
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: IconDashboard },
    { id: 'scan', label: 'Scan', icon: IconScan },
    { id: 'challenge', label: 'Challenge', icon: IconChallenge },
    { id: 'ideas', label: 'Ideas', icon: IconIdeas },
    { id: 'map', label: 'Map', icon: IconMap },
    { id: 'orders', label: 'Orders', icon: IconOrders },
    { id: 'account', label: 'Custody', icon: IconUser },
    { id: 'gallery', label: 'Gallery', icon: IconGallery },
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="desktop-sidebar">
        <a href="#dashboard" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }} className="sidebar-brand">
          <img 
            src="/logo.jpg" 
            alt="re:create Logo" 
            className="sidebar-logo" 
            onError={(e) => { e.currentTarget.src = "/logo.png"; }}
          />
          <div className="sidebar-brand-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h1>re:create</h1>
              <span className="ribbon-animated" style={{ color: 'var(--accent)' }}>
                <IconRibbonBow size={16} />
              </span>
            </div>
            <p>Waste. Create. Inspire.</p>
          </div>
        </a>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile in Sidebar */}
        <div style={{ padding: '0 12px', marginBottom: 12 }}>
          {currentUser ? (
            <div 
              onClick={() => setActiveTab('account')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'account' ? 'rgba(212, 138, 148, 0.12)' : 'var(--surface-sunken)',
                border: `1px solid ${activeTab === 'account' ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer'
              }}
            >
              <img 
                src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                alt={currentUser.name}
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {currentUser.providedMaterials?.length || 0} materials allocated
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="btn btn-primary btn-block"
              style={{ width: '100%', fontSize: 12, padding: '8px' }}
            >
              Sign In / Sign Up
            </button>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="ai-status-pill" style={{ width: '100%', justifyContent: 'center' }}>
            <span className={`ai-status-dot ${aiStatus.connected ? 'connected' : 'demo'}`}></span>
            <span>{aiStatus.connected ? 'Gemini Flash: Active' : 'AI: Demo Mode'}</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="bottom-nav" aria-label="Mobile Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-tab ${isActive ? 'active' : ''}`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
