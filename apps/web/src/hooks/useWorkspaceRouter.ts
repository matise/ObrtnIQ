import { useState, useEffect, useCallback } from 'react';

export type WorkspaceView =
  | 'home'
  | 'bookkeeping'
  | 'documents'
  | 'fiscal'
  | 'articles'
  | 'partners'
  | 'settings'
  | 'logs';

export interface WorkspaceViewParams {
  tab?: string;
  id?: string;
  returnTo?: WorkspaceView;
  [key: string]: any;
}

export interface UseWorkspaceRouterReturn {
  activeView: WorkspaceView;
  viewParams: WorkspaceViewParams | undefined;
  navigateTo: (view: WorkspaceView, params?: WorkspaceViewParams) => void;
  navigateHome: () => void;
  isHome: boolean;
}

const HASH_MAP: Record<string, WorkspaceView> = {
  '#home': 'home',
  '#bookkeeping': 'bookkeeping',
  '#kpr': 'bookkeeping',
  '#documents': 'documents',
  '#docs': 'documents',
  '#fiscal': 'fiscal',
  '#articles': 'articles',
  '#cjenik': 'articles',
  '#partners': 'partners',
  '#settings': 'settings',
  '#logs': 'logs',
};

const VIEW_TITLES: Record<WorkspaceView, string> = {
  home: 'ObrtnIQ — Radna Ploha (Novi Račun)',
  bookkeeping: 'ObrtnIQ — Knjigovodstvo & Financije',
  documents: 'ObrtnIQ — Dokumenti & Računi',
  fiscal: 'ObrtnIQ — Fiskalizacija 1.0 & 2.0',
  articles: 'ObrtnIQ — Cjenik Artikala & Usluga',
  partners: 'ObrtnIQ — Adresar Poslovnih Partnera',
  settings: 'ObrtnIQ — Postavke Obrta & Trezor',
  logs: 'ObrtnIQ — Dnevnik Sustava',
};

function getInitialViewFromHash(): WorkspaceView {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.toLowerCase();
  return HASH_MAP[hash] || 'home';
}

export function useWorkspaceRouter(): UseWorkspaceRouterReturn {
  const [activeView, setActiveView] = useState<WorkspaceView>(getInitialViewFromHash);
  const [viewParams, setViewParams] = useState<WorkspaceViewParams | undefined>(undefined);

  // Sinkronizacija s hash promjenama (Browser Back / Forward tipke)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHashChange = () => {
      const newView = getInitialViewFromHash();
      setActiveView(newView);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Ažuriranje naslova dokumenta i hash-a
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = VIEW_TITLES[activeView] || 'ObrtnIQ';
    }
  }, [activeView]);

  const navigateTo = useCallback(
    (view: WorkspaceView, params?: WorkspaceViewParams) => {
      setActiveView(view);
      setViewParams(params);
      if (typeof window !== 'undefined') {
        const targetHash = `#${view}`;
        if (window.location.hash !== targetHash) {
          window.location.hash = targetHash;
        }
      }
    },
    []
  );

  const navigateHome = useCallback(() => {
    navigateTo('home');
  }, [navigateTo]);

  return {
    activeView,
    viewParams,
    navigateTo,
    navigateHome,
    isHome: activeView === 'home',
  };
}
