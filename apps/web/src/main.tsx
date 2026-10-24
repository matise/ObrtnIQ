import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initGlobalErrorTrap } from './services/global-error-trap';
import { AppErrorBoundary } from './components/AppErrorBoundary';

// Inicijalizacija globalnih hvatača neuhvaćenih grešaka (Faza 10.5)
initGlobalErrorTrap();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
