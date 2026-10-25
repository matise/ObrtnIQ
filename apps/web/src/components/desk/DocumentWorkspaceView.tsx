// apps/web/src/components/desk/DocumentWorkspaceView.tsx
// Faza 19: Modularni In-Place Workspace Prikaz za Evidenciju Dokumenata

import React from 'react';
import { DocumentDrawer, type DocumentDrawerProps } from '../DocumentDrawer';

export interface DocumentWorkspaceViewProps extends Omit<DocumentDrawerProps, 'isOpen' | 'isEmbedded' | 'onClose'> {
  onNavigateHome: () => void;
  onClose?: () => void;
}

export const DocumentWorkspaceView: React.FC<DocumentWorkspaceViewProps> = (props) => {
  return (
    <div className="w-full animate-in fade-in duration-200">
      <DocumentDrawer
        {...props}
        isOpen={true}
        isEmbedded={true}
        onClose={props.onNavigateHome}
      />
    </div>
  );
};
