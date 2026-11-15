import React from 'react';
import { IconInfo, IconClose, IconLeaf, IconRibbonBow } from './Icons.jsx';
import { IMPACT_FACTORS } from '../constants/impactFactors.js';

export function ImpactPopover({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: 8, borderRadius: 'var(--radius-sm)' }}>
              <span className="ribbon-animated">
                <IconRibbonBow size={20} />
              </span>
            </div>
            <h2 id="modal-title" style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
              How We Calculate Impact
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-subtle btn-sm"
            style={{ width: 32, height: 32, padding: 0, borderRadius: '50%' }}
            aria-label="Close modal"
          >
            <IconClose size={16} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
          re:create quantifies the verified environmental benefit of redirecting discarded studio remnants into finished fine art and functional craft objects.
        </p>

        <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 16, border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>Formulas</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
            <strong>Waste Diverted:</strong> Total weight (kg) of scraps redirected into completed artworks.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <strong>Estimated CO2e Avoided:</strong> Σ (Material Weight × Emission Factor)
          </p>
        </div>

        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
          Emission Factors (kg CO2e avoided per kg scrap)
        </h3>

        <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Material Type</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right', color: 'var(--text-secondary)' }}>Factor (kg CO2e/kg)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(IMPACT_FACTORS).map(([type, factor]) => (
                <tr key={type} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px 12px', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                    {type.replace('_', ' & ')}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-hover)' }}>
                    {factor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', padding: 12, fontSize: 11.5, color: '#FCD34D', lineHeight: 1.5 }}>
          <strong>Note:</strong> Illustrative placeholder values. Replace with a published source such as DEFRA conversion factors before presenting.
        </div>

        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
