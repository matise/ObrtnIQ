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

// Registracija PWA Service Workera za terenski rad i offline podršku (Faza 18)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (import.meta as any)?.env?.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        appLogger.scope('PWA:SW').info('PWA Service Worker uspješno registriran', { scope: reg.scope });
      })
      .catch((err) => {
        appLogger.scope('PWA:SW').warn('Greška pri registraciji Service Workera', err);
      });
  });
}

import { AudioTransportProvider } from './context/AudioTransportContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AudioTransportProvider>
        <App />
      </AudioTransportProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);

