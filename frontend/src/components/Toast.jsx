import React, { useEffect } from 'react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div 
      className="animate-slide-up"
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2000,
        background: 'var(--surface-raised)',
        border: '1px solid var(--accent)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(212, 138, 148, 0.25)',
        color: 'var(--text)',
        padding: '0.65rem 1.25rem',
        borderRadius: '999px',
        fontSize: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        maxWidth: '90vw'
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }}></div>
      <span style={{ fontWeight: 500 }}>{message}</span>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex'
        }}
        aria-label="Dismiss notification"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
}
