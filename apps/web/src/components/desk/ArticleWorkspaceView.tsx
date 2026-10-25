// apps/web/src/components/desk/ArticleWorkspaceView.tsx
// Faza 19: Modularni In-Place Workspace Prikaz za Cjenik Artikala i Usluga (KPD 2025)

import React from 'react';
import { ArticleDrawer, type ArticleDrawerProps } from '../ArticleDrawer';

export interface ArticleWorkspaceViewProps extends Omit<ArticleDrawerProps, 'isOpen' | 'isEmbedded' | 'onClose'> {
  onNavigateHome: () => void;
  onClose?: () => void;
}

export const ArticleWorkspaceView: React.FC<ArticleWorkspaceViewProps> = (props) => {
  return (
    <div className="w-full animate-in fade-in duration-200">
      <ArticleDrawer
        {...props}
        isOpen={true}
        isEmbedded={true}
        onClose={props.onNavigateHome}
      />
    </div>
  );
};
