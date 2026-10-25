import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initGlobalErrorTrap } from './services/global-error-trap';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { appLogger } from './services/logger';

// Inicijalizacija globalnih hvatača neuhvaćenih grešaka (Faza 10.5)
initGlobalErrorTrap();

// Inicijalni boot zapis sustava u telemetrijski spremnik
appLogger.scope('SYSTEM:BOOT').info('ObrtnIQ sustav uspješno pokrenut (v3.0 Local-First Architecture)', {
  environment: (import.meta as any)?.env?.MODE || 'production',
  activeLogLevel: appLogger.level,
  timestamp: new Date().toISOString(),
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);

