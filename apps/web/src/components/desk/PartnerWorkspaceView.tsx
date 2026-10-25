// apps/web/src/components/desk/PartnerWorkspaceView.tsx
// Faza 19: Modularni In-Place Workspace Prikaz za Adresar Partnera & Kupaca

import React from 'react';
import { PartnerDrawer, type PartnerDrawerProps } from '../PartnerDrawer';

export interface PartnerWorkspaceViewProps extends Omit<PartnerDrawerProps, 'isOpen' | 'isEmbedded' | 'onClose'> {
  onNavigateHome: () => void;
  onClose?: () => void;
}

export const PartnerWorkspaceView: React.FC<PartnerWorkspaceViewProps> = (props) => {
  return (
    <div className="w-full animate-in fade-in duration-200">
      <PartnerDrawer
        {...props}
        isOpen={true}
        isEmbedded={true}
        onClose={props.onNavigateHome}
      />
    </div>
  );
};
