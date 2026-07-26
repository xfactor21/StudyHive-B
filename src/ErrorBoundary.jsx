import React from 'react';

/**
 * Catches any render crash and shows the actual error instead of a silent
 * black screen. This was added specifically because a returning user's
 * stale Firestore profile document (written by an earlier version of the
 * app during testing) could theoretically have a shape the current code
 * doesn't expect, and there was previously no way to see what broke.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('StudyHive crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: 24, background: '#1E1B4B',
          color: '#F4F2FA', fontFamily: 'sans-serif',
        }}>
          <h2 style={{ marginBottom: 12 }}>Something broke</h2>
          <p style={{ color: '#A8A3C0', marginBottom: 16, fontSize: 14 }}>
            The exact error is below — screenshot this and send it over.
          </p>
          <pre style={{
            background: '#12102B', padding: 12, borderRadius: 8,
            fontSize: 12, overflowX: 'auto', whiteSpace: 'pre-wrap',
          }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20, padding: '10px 20px', borderRadius: 999,
              background: '#F59E0B', color: '#1A1300', border: 'none',
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
