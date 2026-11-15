import React, { useState, useEffect } from 'react';
import { 
  getOrders, 
  advanceOrderStatus, 
  saveOrders 
} from '../utils/storage.js';
import { 
  DELIVERY_STATUS_STEPS, 
  PICKUP_STATUS_STEPS 
} from '../constants/seedSuppliers.js';
import { onOrdersSnapshot } from '../firebase.js';

export default function OrdersPage({ currentUser, onNavigateTab, onShowToast }) {
  const [orders, setOrders] = useState(getOrders);
  const [selectedOrderId, setSelectedOrderId] = useState(() => {
    const list = getOrders();
    return list.length > 0 ? list[0].id : null;
  });
  const [isSupplierView, setIsSupplierView] = useState(() => currentUser?.role === 'supplier');
  const [supplierNote, setSupplierNote] = useState('');

  // Automatically switch to supplier view if logged in as supplier
  useEffect(() => {
    if (currentUser?.role === 'supplier') {
      setIsSupplierView(true);
    }
  }, [currentUser]);

  // Real-time Firestore snapshot listener
  useEffect(() => {
    const unsubscribe = onOrdersSnapshot((remoteOrders) => {
      if (remoteOrders && remoteOrders.length > 0) {
        setOrders(prevOrders => {
          // Check for status changes to trigger toast
          remoteOrders.forEach(rem => {
            const local = prevOrders.find(p => p.id === rem.id);
            if (local && local.status !== rem.status) {
              if (onShowToast) {
                onShowToast(`Order #${rem.trackingCode} is now ${rem.status}!`);
              }
            }
          });
          saveOrders(remoteOrders);
          return remoteOrders;
        });
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [onShowToast]);

  const activeOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  const handleSimulateNextStatus = (orderId) => {
    const target = orders.find(o => o.id === orderId);
    if (!target) return;

    const updated = advanceOrderStatus(orderId);
    setOrders(updated);
    const updatedTarget = updated.find(o => o.id === orderId);
    if (onShowToast) {
      onShowToast(`Order #${updatedTarget.trackingCode} advanced to "${updatedTarget.status}"`);
    }
  };

  const handleSupplierAdvance = (orderId, targetStatus) => {
    const updated = advanceOrderStatus(orderId, targetStatus, supplierNote.trim() || null);
    setOrders(updated);
    setSupplierNote('');
    if (onShowToast) {
      onShowToast(`Order updated to "${targetStatus}"`);
    }
  };

  // Determine timeline steps based on method
  const timelineSteps = activeOrder 
    ? (activeOrder.method === 'pickup' ? PICKUP_STATUS_STEPS : DELIVERY_STATUS_STEPS)
    : [];

  const currentStepIndex = activeOrder ? timelineSteps.indexOf(activeOrder.status) : -1;
  const isDeliveredOrCollected = activeOrder && ['Delivered', 'Collected'].includes(activeOrder.status);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Delivered':
      case 'Collected':
        return 'badge-success';
      case 'Dispatched':
      case 'Out for delivery':
      case 'Ready for pickup':
        return 'badge-accent';
      case 'Packed':
      case 'Confirmed':
        return 'badge-secondary';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div className="tab-pane active animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <span className="badge badge-accent" style={{ marginBottom: '0.4rem' }}>
            Live Fulfillment
          </span>
          <h2 style={{ fontSize: '1.8rem', margin: 0, fontFamily: 'var(--font-serif)' }}>
            Orders & Delivery Tracking
          </h2>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Follow the chain of custody as salvaged studio materials make their way to your atelier.
          </p>
        </div>

        {/* View Toggle: Creator vs Supplier */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-sunken)', padding: '0.3rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setIsSupplierView(false)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'calc(var(--radius) - 4px)',
              border: 'none',
              fontSize: '0.825rem',
              fontWeight: !isSupplierView ? 600 : 400,
              background: !isSupplierView ? 'var(--accent)' : 'transparent',
              color: !isSupplierView ? '#0A0A0D' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Artist View
          </button>
          <button
            type="button"
            onClick={() => setIsSupplierView(true)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'calc(var(--radius) - 4px)',
              border: 'none',
              fontSize: '0.825rem',
              fontWeight: isSupplierView ? 600 : 400,
              background: isSupplierView ? 'var(--accent)' : 'transparent',
              color: isSupplierView ? '#0A0A0D' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            I'm a Supplier
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface-sunken)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', marginBottom: '1rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem', fontFamily: 'var(--font-serif)' }}>No Active Material Orders</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
            Browse local zero-waste suppliers on the Map to request studio offcuts and trimmings.
          </p>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => onNavigateTab && onNavigateTab('map')}
          >
            Explore Supplier Map
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.8fr)', gap: '1.5rem' }}>
          
          {/* ORDERS LIST (Left Column) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {orders.length} TOTAL REQUESTS
              </span>
              <button 
                type="button" 
                className="btn btn-ghost" 
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                onClick={() => onNavigateTab && onNavigateTab('map')}
              >
                + New Request
              </button>
            </div>

            <div style={{ display: 'grid', gap: '0.65rem' }}>
              {orders.map(order => {
                const isSelected = activeOrder?.id === order.id;
                const matText = Array.isArray(order.materialNames) ? order.materialNames.join(', ') : 'Materials';

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      background: isSelected ? 'rgba(212, 138, 148, 0.08)' : 'var(--surface)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-muted)' }}>
                        #{order.trackingCode || order.id}
                      </span>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`} style={{ fontSize: '0.725rem' }}>
                        {order.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>
                      {matText}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      <span>From {order.supplierName}</span>
                      <span style={{ textTransform: 'capitalize' }}>{order.method}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTIVE ORDER DETAIL VIEW (Right Column) */}
          {activeOrder && (
            <div>
              <div className="card animate-fade-in" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                
                {/* Header details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '1.15rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>
                        #{activeOrder.trackingCode}
                      </span>
                      <span className={`badge ${getStatusBadgeClass(activeOrder.status)}`}>
                        {activeOrder.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                      Requested: {new Date(activeOrder.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • {activeOrder.method === 'pickup' ? 'Self Pickup' : 'Eco Courier'}
                    </div>
                  </div>

                  {/* 1-Click Status Simulation Button (Hackathon Demo feature) */}
                  {!isSupplierView && (
                    <div style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleSimulateNextStatus(activeOrder.id)}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                      >
                        Simulate Next Status ⚡
                      </button>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        1-click hackathon test demo
                      </div>
                    </div>
                  )}
                </div>

                {/* Materials & Logistics info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'var(--surface-sunken)', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      SCRAP MATERIALS
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                      {Array.isArray(activeOrder.materialNames) ? activeOrder.materialNames.join(', ') : 'Assorted Scraps'}
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-sunken)', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      ORIGIN SUPPLIER
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                      {activeOrder.supplierName}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {activeOrder.deliveryAddress}
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-sunken)', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      ESTIMATED SCHEDULE
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent)' }}>
                      {activeOrder.estimatedDelivery || 'In Progress'}
                    </div>
                  </div>
                </div>

                {/* CELEBRATORY CALLOUT WHEN DELIVERED / COLLECTED */}
                {isDeliveredOrCollected && (
                  <div 
                    className="animate-scale-in"
                    style={{
                      marginBottom: '1.5rem',
                      padding: '1.1rem 1.25rem',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--accent)',
                      background: 'linear-gradient(135deg, rgba(212, 138, 148, 0.15) 0%, rgba(18, 18, 22, 0.9) 100%)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: 'var(--text)' }}>
                        Materials Successfully Received!
                      </h4>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Your studio scraps are in hand. Ready to turn this into art with a challenge?
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => onNavigateTab && onNavigateTab('challenge')}
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                    >
                      Turn this into art →
                    </button>
                  </div>
                )}

                {/* SUPPLIER ADVANCE CONTROL PANEL (If Supplier Mode Active) */}
                {isSupplierView && (
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface-sunken)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.5rem' }}>
                      SUPPLIER CONTROL DESK: #{activeOrder.trackingCode}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>
                      Update order dispatch, packing, or collection status in real-time.
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                      {timelineSteps.map(step => (
                        <button
                          key={step}
                          type="button"
                          className="btn"
                          disabled={activeOrder.status === step}
                          onClick={() => handleSupplierAdvance(activeOrder.id, step)}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.3rem 0.65rem',
                            background: activeOrder.status === step ? 'var(--accent)' : 'var(--surface)',
                            color: activeOrder.status === step ? '#0A0A0D' : 'var(--text)',
                            border: '1px solid var(--border)'
                          }}
                        >
                          Mark as {step}
                        </button>
                      ))}
                    </div>

                    <input 
                      type="text"
                      className="input-field"
                      placeholder="Add an internal note or handoff detail (optional)..."
                      value={supplierNote}
                      onChange={e => setSupplierNote(e.target.value)}
                      style={{ fontSize: '0.825rem' }}
                    />
                  </div>
                )}

                {/* VERTICAL STEP TIMELINE */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 1rem' }}>
                    TRACKING TIMELINE
                  </h4>

                  <div style={{ position: 'relative', paddingLeft: '1.75rem' }}>
                    {/* Continuous vertical bar */}
                    <div 
                      style={{
                        position: 'absolute',
                        left: '7px',
                        top: '8px',
                        bottom: '12px',
                        width: '2px',
                        background: 'var(--border)'
                      }}
                    ></div>

                    {timelineSteps.map((step, idx) => {
                      const isCompleted = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      
                      // Look up matching history item
                      const historyItem = (activeOrder.statusHistory || []).slice().reverse().find(h => h.status === step);

                      return (
                        <div key={step} style={{ position: 'relative', marginBottom: idx === timelineSteps.length - 1 ? 0 : '1.5rem' }}>
                          {/* Dot marker */}
                          <div
                            style={{
                              position: 'absolute',
                              left: '-1.75rem',
                              top: '2px',
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: isCompleted ? 'var(--accent)' : 'var(--surface-sunken)',
                              border: `2px solid ${isCurrent ? '#FFFFFF' : (isCompleted ? 'var(--accent)' : 'var(--border)')}`,
                              boxShadow: isCurrent ? '0 0 10px rgba(212, 138, 148, 0.8)' : 'none',
                              zIndex: 1,
                              transition: 'all 0.2s ease'
                            }}
                          ></div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: isCurrent ? 700 : (isCompleted ? 600 : 400), color: isCompleted ? 'var(--text)' : 'var(--text-muted)' }}>
                                {step}
                              </span>
                              {historyItem?.timestamp && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  ({historyItem.timestamp})
                                </span>
                              )}
                            </div>

                            {historyItem?.note && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                {historyItem.note}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
