// apps/web/src/components/bookkeeping/BookkeepingWorkspaceView.tsx
// Faza 19: Modularni In-Place Workspace Prikaz za Knjigovodstvo i Financije Obrta

import React from 'react';
import { BookkeepingDrawer, type BookkeepingTabType } from './BookkeepingDrawer';

export interface BookkeepingWorkspaceViewProps {
  obrtOib: string;
  obrtNaziv: string;
  obrtVlasnik: string;
  obrtAdresa: string;
  onKprUpdated?: () => void;
  initialTab?: BookkeepingTabType;
  onNavigateHome: () => void;
}

export const BookkeepingWorkspaceView: React.FC<BookkeepingWorkspaceViewProps> = ({
  obrtOib,
  obrtNaziv,
  obrtVlasnik,
  obrtAdresa,
  onKprUpdated,
  initialTab = 'kpr',
  onNavigateHome,
}) => {
  return (
    <div className="w-full animate-in fade-in duration-200">
      <BookkeepingDrawer
        isOpen={true}
        isEmbedded={true}
        onClose={onNavigateHome}
        onNavigateHome={onNavigateHome}
        obrtOib={obrtOib}
        obrtNaziv={obrtNaziv}
        obrtVlasnik={obrtVlasnik}
        obrtAdresa={obrtAdresa}
        onKprUpdated={onKprUpdated}
        initialTab={initialTab}
      />
    </div>
  );
};
