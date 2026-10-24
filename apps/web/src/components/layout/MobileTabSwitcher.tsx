import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';

export interface MobileTabSwitcherProps {
  activeTab: 'desk' | 'preview';
  onChange: (tab: 'desk' | 'preview') => void;
}

export const MobileTabSwitcher: React.FC<MobileTabSwitcherProps> = ({
  activeTab,
  onChange,
}) => {
  return (
    <div className="flex xl:hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-1 text-xs font-mono no-print">
      <button
        type="button"
        onClick={() => onChange('desk')}
        className={`flex-1 py-2 flex items-center justify-center gap-2 transition-colors ${
          activeTab === 'desk'
            ? 'bg-[var(--accent-primary)] text-black font-bold'
            : 'text-[var(--text-muted)] hover:text-white'
        }`}
      >
        <Monitor className="w-4 h-4" />
        Radna Ploha Unosa
      </button>
      <button
        type="button"
        onClick={() => onChange('preview')}
        className={`flex-1 py-2 flex items-center justify-center gap-2 transition-colors ${
          activeTab === 'preview'
            ? 'bg-[var(--accent-primary)] text-black font-bold'
            : 'text-[var(--text-muted)] hover:text-white'
        }`}
      >
        <Smartphone className="w-4 h-4" />
        Živi A4 Preglednik
      </button>
    </div>
  );
};
