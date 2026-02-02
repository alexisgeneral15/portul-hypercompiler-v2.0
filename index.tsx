
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Fatal: Root element not found.");
}

const root = ReactDOM.createRoot(rootElement);

import('./components/App')
  .then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  })
  .catch((error) => {
    root.render(
      <div style={{
        fontFamily: 'sans-serif',
        padding: '24px',
        color: '#fca5a5',
        background: '#111827',
        minHeight: '100vh'
      }}>
        <h1 style={{ fontSize: '20px', marginBottom: '12px' }}>Error cargando la app</h1>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{String(error)}</pre>
      </div>
    );
  });