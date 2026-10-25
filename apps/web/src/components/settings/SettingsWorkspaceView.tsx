// apps/web/src/components/settings/SettingsWorkspaceView.tsx
// Faza 19: Modularni In-Place Workspace Prikaz za Postavke Sustava i Obrta

import React from 'react';
import { SettingsDrawer, type SettingsDrawerProps } from '../SettingsDrawer';

export interface SettingsWorkspaceViewProps extends Omit<SettingsDrawerProps, 'isOpen' | 'isEmbedded' | 'onClose'> {
  onNavigateHome: () => void;
  onClose?: () => void;
}

export const SettingsWorkspaceView: React.FC<SettingsWorkspaceViewProps> = (props) => {
  return (
    <div className="w-full animate-in fade-in duration-200">
      <SettingsDrawer
        {...props}
        isOpen={true}
        isEmbedded={true}
        onClose={props.onNavigateHome}
      />
    </div>
  );
};
