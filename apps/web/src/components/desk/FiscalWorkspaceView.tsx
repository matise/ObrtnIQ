// apps/web/src/components/desk/FiscalWorkspaceView.tsx
// Faza 19: Modularni In-Place Workspace Prikaz za Fiskalizaciju 1.0 & 2.0

import React from 'react';
import { FiscalDrawer, type FiscalDrawerProps } from '../FiscalDrawer';

export interface FiscalWorkspaceViewProps extends Omit<FiscalDrawerProps, 'isOpen' | 'isEmbedded' | 'onClose'> {
  onNavigateHome: () => void;
  onClose?: () => void;
}

export const FiscalWorkspaceView: React.FC<FiscalWorkspaceViewProps> = (props) => {
  return (
    <div className="w-full animate-in fade-in duration-200">
      <FiscalDrawer
        {...props}
        isOpen={true}
        isEmbedded={true}
        onClose={props.onNavigateHome}
      />
    </div>
  );
};
