import React from 'react';
import { IconRibbonBow, IconRefresh } from './Icons.jsx';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[React ErrorBoundary caught error]:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('reform_active_challenge_v1');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A0D',
          color: '#EFEFEF',
          padding: '24px',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}>
          <div style={{
            maxWidth: 480,
            width: '100%',
            background: 'linear-gradient(145deg, #1A1A24 0%, #121218 100%)',
            border: '1px solid rgba(212, 138, 148, 0.35)',
            borderRadius: 16,
            padding: '36px 28px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 24px rgba(212, 138, 148, 0.2)'
          }}>
            <div style={{ 
              display: 'inline-flex', 
              padding: 16, 
              background: 'rgba(212, 138, 148, 0.12)', 
              color: '#D48A94', 
              borderRadius: '50%', 
              marginBottom: 16 
            }}>
              <IconRibbonBow size={42} />
            </div>

            <h2 style={{ 
              fontFamily: "'Cormorant Garamond', Georgia, serif", 
              fontSize: 28, 
              fontWeight: 700, 
              color: '#FFF', 
              margin: '0 0 10px' 
            }}>
              Atelier Interrupted
            </h2>

            <p style={{ fontSize: 13.5, color: '#A1A1AA', lineHeight: 1.6, margin: '0 0 20px' }}>
              Something unexpected occurred while rendering this creative studio session. Your salvaged materials and saved artworks in local storage remain secure.
            </p>

            {this.state.error && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 12,
                color: '#F87171',
                fontFamily: 'monospace',
                textAlign: 'left',
                marginBottom: 24,
                overflowX: 'auto',
                wordBreak: 'break-all'
              }}>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <IconRefresh size={16} />
                <span>Reload Atelier</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-secondary"
                style={{ padding: '10px 16px', fontSize: 13 }}
              >
                <span>Reset Session</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
