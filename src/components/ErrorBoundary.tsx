import React from 'react';

interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '2rem',
          fontFamily: 'DM Mono, monospace', background: '#e8e2d4',
        }}>
          <div style={{
            maxWidth: '560px', width: '100%',
            background: '#f0ece3', border: '1px solid rgba(30,36,51,0.15)',
            borderTop: '2px solid #c0392b', borderRadius: '6px', padding: '1.5rem',
          }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9aacbb', marginBottom: '0.5rem' }}>
              Application Error
            </p>
            <h2 style={{ fontSize: '1rem', color: '#1e2433', marginBottom: '0.75rem', fontFamily: 'DM Sans, sans-serif' }}>
              Something went wrong
            </h2>
            <pre style={{
              fontSize: '0.72rem', color: '#5a6475', background: '#e8e2d4',
              padding: '0.75rem', borderRadius: '4px', overflow: 'auto',
              whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginBottom: '1rem',
            }}>
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#1e2433', color: '#e8e2d4', border: 'none',
                padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer',
                fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
