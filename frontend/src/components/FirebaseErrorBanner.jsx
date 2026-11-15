import React, { useState, useEffect } from 'react';
import { onFirebaseError } from '../firebase.js';
import { IconClose } from './Icons.jsx';

export function FirebaseErrorBanner() {
  const [errors, setErrors] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    // Subscribe to exact Firebase errors
    const unsubscribe = onFirebaseError((newError) => {
      setErrors((prev) => [
        { ...newError, id: `err-${Date.now()}-${Math.random()}` },
        ...prev.slice(0, 4) // Keep up to 5 latest errors
      ]);
    });
    return unsubscribe;
  }, []);

  if (errors.length === 0) return null;

  const dismissError = (id) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  };

  const copyToClipboard = (err) => {
    const text = `Action: ${err.action}\nCode: ${err.code}\nMessage: ${err.message}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(err.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 680,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        animation: 'fadeInDown 0.3s ease-out'
      }}
      role="alert"
      aria-live="assertive"
    >
      {errors.map((err) => (
        <div
          key={err.id}
          style={{
            background: 'linear-gradient(135deg, #1C0F12 0%, #160D10 100%)',
            border: '1.5px solid #F87171',
            borderRadius: 12,
            padding: '14px 16px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8), 0 0 16px rgba(248, 113, 113, 0.35)',
            color: '#FEE2E2',
            fontSize: 13,
            lineHeight: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span 
                style={{ 
                  background: '#EF4444', 
                  color: '#FFF', 
                  fontSize: 10, 
                  fontWeight: 700, 
                  padding: '2px 7px', 
                  borderRadius: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Firebase Error
              </span>
              <strong style={{ color: '#FCA5A5', fontSize: 13 }}>
                {err.action}
              </strong>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                {err.timestamp}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => copyToClipboard(err)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFF',
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                {copiedId === err.id ? 'Copied!' : 'Copy Error'}
              </button>
              <button
                onClick={() => dismissError(err.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#F87171',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label="Dismiss"
              >
                <IconClose size={16} />
              </button>
            </div>
          </div>

          {/* Exact Error Code & Message */}
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.5)', 
            padding: '8px 12px', 
            borderRadius: 6, 
            fontFamily: 'monospace', 
            fontSize: 12,
            border: '1px solid rgba(248, 113, 113, 0.2)',
            wordBreak: 'break-all'
          }}>
            <div><strong>Code:</strong> <span style={{ color: '#F87171' }}>{err.code}</span></div>
            <div><strong>Message:</strong> <span style={{ color: '#FCA5A5' }}>{err.message}</span></div>
          </div>

          {/* Contextual Actionable Fix Advice for Firebase Auth Setup */}
          {(err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed' || String(err.code).startsWith('auth/')) && (
            <div style={{ 
              marginTop: 6, 
              fontSize: 12.5, 
              color: '#FDE68A', 
              background: 'rgba(245, 158, 11, 0.15)', 
              padding: '10px 14px', 
              borderRadius: 8, 
              border: '1px solid rgba(245, 158, 11, 0.35)',
              lineHeight: 1.5
            }}>
              <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>⚠️ Firebase Setup Notice:</span>
              </div>
              <div style={{ marginBottom: 6 }}>
                <strong>To enable sign-in, go to Firebase Console &gt; Authentication &gt; Get Started and enable Email/Password and Google providers.</strong>
              </div>
              <div style={{ fontSize: 11.5, color: '#FEF3C7' }}>
                Direct Link: <a href="https://console.firebase.google.com/project/reform-e169c/authentication" target="_blank" rel="noopener noreferrer" style={{ color: '#93C5FD', textDecoration: 'underline' }}>console.firebase.google.com/project/reform-e169c/authentication</a>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
