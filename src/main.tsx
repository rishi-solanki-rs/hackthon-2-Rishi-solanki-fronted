import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// The service worker only runs in production builds; in dev it would serve stale Vite modules.
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('[PWA] Service worker registration failed:', err));
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

