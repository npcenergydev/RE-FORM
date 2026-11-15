import React, { useState } from 'react';
import { addOrder } from '../utils/storage.js';

export default function RequestMaterialModal({ supplier, materials = [], onClose, onOrderCreated }) {
  const [method, setMethod] = useState('pickup');
  const [address, setAddress] = useState('Studio Atelier, Circular Road, Ranchi');
  const [notes, setNotes] = useState('');
  const [creatorName, setCreatorName] = useState('Artist / Creator');
  
  // Materials linked to this supplier that are neither used nor reserved
  const supplierMaterials = materials.filter(m => m.supplierId === supplier.id && !m.used && !m.reserved);
  const [selectedMatIds, setSelectedMatIds] = useState(
    supplierMaterials.length > 0 ? [supplierMaterials[0].id] : []
  );
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState(null);

  const toggleMaterial = (id) => {
    setSelectedMatIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setRequestError(null);

    if (selectedMatIds.length === 0 && supplierMaterials.length > 0) {
      setRequestError("Please select at least one material to request.");
      return;
    }

    setSubmitting(true);
    const chosenMaterials = supplierMaterials.filter(m => selectedMatIds.includes(m.id));
    const materialNames = chosenMaterials.length > 0 
      ? chosenMaterials.map(m => m.name) 
      : [`Studio Scraps Batch (${supplier.businessType || 'Assorted'})`];

    try {
      const result = addOrder({
        supplierId: supplier.id,
        supplierName: supplier.name,
        creatorName,
        method,
        deliveryAddress: method === 'pickup' ? supplier.address : address,
        materialIds: selectedMatIds,
        materialNames,
        notes
      });

      setSubmitting(false);
      if (onOrderCreated) {
        onOrderCreated(result.newOrder);
      }
      onClose();
    } catch (err) {
      setSubmitting(false);
      setRequestError(err.message || "Failed to submit request.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <span className="badge badge-accent" style={{ textTransform: 'capitalize', marginBottom: '0.4rem' }}>
              {supplier.businessType || 'Studio Partner'}
            </span>
            <h3 style={{ fontSize: '1.35rem', margin: 0, fontFamily: 'var(--font-serif)' }}>
              Request Materials from {supplier.name}
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              {supplier.address}, {supplier.city} ({supplier.distance ? `${supplier.distance} km away` : 'Nearby'})
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

        <form onSubmit={handleSubmit}>
          {/* Material selection */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
              Select Available Materials ({supplierMaterials.length} listed)
            </label>
            {supplierMaterials.length === 0 ? (
              <div style={{ padding: '0.75rem', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                General offcut package: Requesting standard studio offcuts & trimmings.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                {supplierMaterials.map(mat => {
                  const isChecked = selectedMatIds.includes(mat.id);
                  return (
                    <label 
                      key={mat.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        background: isChecked ? 'rgba(212, 138, 148, 0.08)' : 'var(--surface-sunken)',
                        border: `1px solid ${isChecked ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleMaterial(mat.id)}
                          style={{ accentColor: 'var(--accent)' }}
                        />
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{mat.name}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {mat.quantity} ({mat.estimated_weight_kg || 0.5} kg)
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Method selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
              Fulfillment Method
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setMethod('pickup')}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${method === 'pickup' ? 'var(--accent)' : 'var(--border)'}`,
                  background: method === 'pickup' ? 'rgba(212, 138, 148, 0.1)' : 'var(--surface-sunken)',
                  color: 'var(--text)',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Self Pickup
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Free • Direct from studio reception
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod('delivery')}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${method === 'delivery' ? 'var(--accent)' : 'var(--border)'}`,
                  background: method === 'delivery' ? 'rgba(212, 138, 148, 0.1)' : 'var(--surface-sunken)',
                  color: 'var(--text)',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                  Eco Courier
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Next day • Dispatched in re-used boxes
                </div>
              </button>
            </div>
          </div>

          {/* Delivery address if delivery */}
          {method === 'delivery' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text)' }}>
                Delivery Destination
              </label>
              <input 
                type="text"
                className="input-field"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Enter your studio address in Ranchi"
                required
              />
            </div>
          )}

          {/* Creator note */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text)' }}>
              Note for Supplier (optional)
            </label>
            <input 
              type="text"
              className="input-field"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g., Any small offcuts or color variations are welcome"
            />
          </div>

          {requestError && (
            <div style={{ 
              marginBottom: '1rem', 
              padding: '0.65rem 0.85rem', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: 'var(--radius-sm)', 
              color: '#f87171', 
              fontSize: '0.825rem' 
            }}>
              {requestError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating Request...' : 'Confirm Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
