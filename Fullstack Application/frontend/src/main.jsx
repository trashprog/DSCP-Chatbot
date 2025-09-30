import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';

function ErrorBoundaryFallback({ error }) {
  return (
    <div style={{ padding: '2rem', color: 'red' }}>
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
    </div>
  );
}

function SafeApp() {
  try {
    return <App />;
  } catch (error) {
    return <ErrorBoundaryFallback error={error} />;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SafeApp />
    </BrowserRouter>
  </StrictMode>
);
