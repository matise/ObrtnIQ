// apps/web/src/components/desk/SystemLogWorkspaceView.tsx
// Faza 19: Modularni In-Place Workspace Prikaz za Sustavni Dnevnik (Telemetrija)

import React from 'react';
import { SystemLogDrawer, type SystemLogDrawerProps } from '../SystemLogDrawer';

export interface SystemLogWorkspaceViewProps extends Omit<SystemLogDrawerProps, 'isOpen' | 'isEmbedded' | 'onClose'> {
  onNavigateHome: () => void;
  onClose?: () => void;
}

export const SystemLogWorkspaceView: React.FC<SystemLogWorkspaceViewProps> = (props) => {
  return (
    <div className="w-full animate-in fade-in duration-200">
      <SystemLogDrawer
        {...props}
        isOpen={true}
        isEmbedded={true}
        onClose={props.onNavigateHome}
      />
    </div>
  );
};
