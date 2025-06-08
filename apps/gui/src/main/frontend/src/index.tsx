import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

async function initMocks() {
  if (process.env.NODE_ENV === 'development') {
    const { worker } = await import('./mocks/browser');
    await import('./mocks/websocket');
    return worker.start();
  }
  return Promise.resolve();
}

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

initMocks().then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}); 