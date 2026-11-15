import React, { useState } from 'react';
import { 
  getCurrentUser, 
  getCustomers, 
  setCurrentUser 
} from '../utils/storage.js';

export default function CustomerMaterials({ currentUser: propUser, onUserChange, onNavigateTab, onOpenAuth }) {
  const [currentUser, setLocalCurrentUser] = useState(() => propUser || getCurrentUser());
  const [allCustomers, setAllCustomers] = useState(getCustomers);
  const [activeSubTab, setActiveSubTab] = useState('my_materials'); // 'my_materials' | 'all_customers'
  const [searchQuery, setSearchQuery] = useState('');

  // Keep in sync with parent prop
  React.useEffect(() => {
    if (propUser !== undefined) {
      setLocalCurrentUser(propUser);
    }
  }, [propUser]);

  const handleSignOut = () => {
    setCurrentUser(null);
    setLocalCurrentUser(null);
    if (onUserChange) onUserChange(null);
  };

  const handleSwitchAccount = (customer) => {
    setCurrentUser(customer);
    setLocalCurrentUser(customer);
    if (onUserChange) onUserChange(customer);
  };

  // Filter all customers for the directory
  const filteredCustomers = allCustomers.filter(c => {
    const matchName = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchEmail = (c.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchMaterials = (c.providedMaterials || []).some(m => 
      (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.supplierName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchName || matchEmail || matchMaterials;
  });

  return (
    <div className="tab-pane active animate-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <span className="badge badge-accent" style={{ marginBottom: '0.4rem' }}>
            Chain of Custody & Allocations
          </span>
          <h2 style={{ fontSize: '1.8rem', margin: 0, fontFamily: 'var(--font-serif)' }}>
            Customer Accounts & Provided Materials
          </h2>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Transparent tracking of which artist has been provided with what discarded studio scraps.
          </p>
        </div>

        {/* View Switcher: My Materials vs All Customers + Sign In Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onOpenAuth && onOpenAuth()}
            style={{ fontSize: '0.825rem', padding: '0.4rem 0.85rem' }}
          >
            Sign In / Register
          </button>

          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-sunken)', padding: '0.3rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setActiveSubTab('my_materials')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'calc(var(--radius) - 4px)',
                border: 'none',
                fontSize: '0.825rem',
                fontWeight: activeSubTab === 'my_materials' ? 600 : 400,
                background: activeSubTab === 'my_materials' ? 'var(--accent)' : 'transparent',
                color: activeSubTab === 'my_materials' ? '#0A0A0D' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              My Allocated Materials
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('all_customers')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'calc(var(--radius) - 4px)',
                border: 'none',
                fontSize: '0.825rem',
                fontWeight: activeSubTab === 'all_customers' ? 600 : 400,
                background: activeSubTab === 'all_customers' ? 'var(--accent)' : 'transparent',
                color: activeSubTab === 'all_customers' ? '#0A0A0D' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              All Customer Allocations ({allCustomers.length})
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: MY ALLOCATED MATERIALS */}
      {activeSubTab === 'my_materials' && (
        <div>
          {/* Customer Profile Card */}
          {currentUser ? (
            <div 
              className="card"
              style={{
                marginBottom: '1.5rem',
                border: '1px solid var(--accent)',
                background: 'linear-gradient(135deg, rgba(212, 138, 148, 0.1) 0%, rgba(18, 18, 22, 0.95) 100%)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <img 
                    src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                    alt={currentUser.name}
                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.3rem', fontFamily: 'var(--font-serif)' }}>
                        {currentUser.name}
                      </h3>
                      <span className="badge badge-accent" style={{ textTransform: 'capitalize' }}>
                        {currentUser.role}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {currentUser.email} • {currentUser.studio || 'Studio Atelier'} ({currentUser.city || 'Ranchi'})
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onOpenAuth && onOpenAuth()}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  >
                    Switch Account
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleSignOut}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', border: '1px solid var(--border)' }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>

              {/* Custody Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ background: 'var(--surface-sunken)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Allocated Materials</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {currentUser.providedMaterials?.length || 0} batches
                  </div>
                </div>

                <div style={{ background: 'var(--surface-sunken)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Diverted by Customer</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
                    {currentUser.totalWasteDivertedKg || 0} kg
                  </div>
                </div>

                <div style={{ background: 'var(--surface-sunken)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Member Since</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginTop: '0.15rem' }}>
                    {new Date(currentUser.createdAt || Date.now()).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', fontFamily: 'var(--font-serif)' }}>Sign in to view your provided materials</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 auto 1.25rem', maxWidth: '380px' }}>
                Sign in to track what discarded workshop scraps have been allocated to your atelier.
              </p>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => onOpenAuth && onOpenAuth()}
              >
                Sign In / Sign Up
              </button>
            </div>
          )}

          {/* List of Materials Provided to This Customer */}
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', margin: 0, fontFamily: 'var(--font-serif)' }}>
              Materials Provided to {currentUser?.name || 'Customer'} ({(currentUser?.providedMaterials || []).length})
            </h3>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', border: '1px solid var(--border)' }}
              onClick={() => onNavigateTab && onNavigateTab('map')}
            >
              + Request More Scraps
            </button>
          </div>

          {(currentUser?.providedMaterials || []).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
                No materials have been provided to your account yet. Explore the Supplier Map to request studio scraps!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {(currentUser.providedMaterials || []).map((mat, idx) => (
                <div 
                  key={mat.materialId || idx}
                  className="card animate-fade-in"
                  style={{
                    padding: '1.1rem 1.25rem',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span className="badge badge-accent" style={{ textTransform: 'capitalize' }}>
                          {mat.type}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          #{mat.trackingCode || mat.orderId}
                        </span>
                        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                          {mat.status || 'Delivered'}
                        </span>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-serif)' }}>
                        {mat.name}
                      </h4>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        Provided by: <strong style={{ color: 'var(--text)' }}>{mat.supplierName}</strong> ({mat.method === 'pickup' ? 'Self Pickup' : 'Eco Courier'})
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent)' }}>
                        {mat.quantity} ({mat.weightKg} kg)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Allocated: {new Date(mat.providedAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {mat.notes && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--surface-sunken)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <strong>Studio Note:</strong> {mat.notes}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.65rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                      onClick={() => onNavigateTab && onNavigateTab('ideas')}
                    >
                      Get Art Ideas
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                      onClick={() => onNavigateTab && onNavigateTab('challenge')}
                    >
                      Spin Challenge with this Scrap →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: ALL CUSTOMER ALLOCATIONS (Platform Overview) */}
      {activeSubTab === 'all_customers' && (
        <div>
          {/* Search bar */}
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text"
              className="input-field"
              placeholder="Filter by customer name, email, scrap material, or supplier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredCustomers.map(customer => {
              const materialsList = customer.providedMaterials || [];
              const isCurrent = currentUser?.id === customer.id;

              return (
                <div
                  key={customer.id}
                  className="card"
                  style={{
                    padding: '1.25rem',
                    border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'}`,
                    background: isCurrent ? 'rgba(212, 138, 148, 0.04)' : 'var(--surface)'
                  }}
                >
                  {/* Customer info header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <img 
                        src={customer.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                        alt={customer.name}
                        style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-serif)' }}>
                            {customer.name}
                          </h4>
                          <span className="badge" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>
                            {customer.role}
                          </span>
                          {isCurrent && (
                            <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>
                              You
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {customer.email} • {customer.studio || 'Studio Atelier'} ({customer.city})
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
                        {customer.totalWasteDivertedKg || 0} kg diverted
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', marginTop: '0.25rem', border: '1px solid var(--border)' }}
                        onClick={() => handleSwitchAccount(customer)}
                      >
                        {isCurrent ? 'Current Profile' : 'Switch to this User'}
                      </button>
                    </div>
                  </div>

                  {/* Materials provided table/pills */}
                  <div style={{ background: 'var(--surface-sunken)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      MATERIALS PROVIDED TO THIS CUSTOMER ({materialsList.length}):
                    </div>

                    {materialsList.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        No materials provided yet.
                      </span>
                    ) : (
                      <div style={{ display: 'grid', gap: '0.45rem' }}>
                        {materialsList.map((item, idx) => (
                          <div 
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.825rem',
                              padding: '0.35rem 0',
                              borderBottom: idx === materialsList.length - 1 ? 'none' : '1px solid var(--border)'
                            }}
                          >
                            <div>
                              <strong style={{ color: 'var(--text)' }}>{item.name}</strong>
                              <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                                ({item.quantity} • {item.weightKg} kg)
                              </span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.775rem' }}>
                              From <span style={{ color: 'var(--accent)' }}>{item.supplierName}</span> (#{item.trackingCode})
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
