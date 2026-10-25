import React from 'react';
import { ObrtIcon } from '../icons';
import type { SettingsTabsNavProps } from './types';

export const SettingsTabsNav: React.FC<SettingsTabsNavProps> = ({
  activeTab,
  onTabChange,
  isGoogleAuthenticated = false,
}) => {
  return (
    <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] font-mono text-xs">
      <button
        type="button"
        onClick={() => onTabChange('osnovno')}
        className={`flex-1 py-3 px-3 sm:px-4 flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 font-semibold transition-all cursor-pointer ${
          activeTab === 'osnovno'
            ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-surface)]'
            : 'border-transparent text-[var(--text-muted)] hover:text-white'
        }`}
      >
        <ObrtIcon name="obrt-tools" size={16} glow={activeTab === 'osnovno'} />
        <span className="hidden sm:inline">1. Osnovni Podaci</span>
        <span className="sm:hidden">1. Osnovno</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('poslovanje')}
        className={`flex-1 py-3 px-3 sm:px-4 flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 font-semibold transition-all cursor-pointer ${
          activeTab === 'poslovanje'
            ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-surface)]'
            : 'border-transparent text-[var(--text-muted)] hover:text-white'
        }`}
      >
        <ObrtIcon name="invoice-document" size={16} glow={activeTab === 'poslovanje'} />
        <span className="hidden sm:inline">2. Račun &amp; Poslovni Prostor</span>
        <span className="sm:hidden">2. Račun</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('memorandum')}
        className={`flex-1 py-3 px-2 sm:px-3 flex items-center justify-center gap-1.5 border-b-2 font-semibold transition-all cursor-pointer ${
          activeTab === 'memorandum'
            ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-surface)]'
            : 'border-transparent text-[var(--text-muted)] hover:text-white'
        }`}
      >
        <ObrtIcon name="fiscal-quill" size={16} glow={activeTab === 'memorandum'} />
        <span>3. Memorandum</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('backup')}
        className={`flex-1 py-3 px-2 flex items-center justify-center gap-1 border-b-2 font-semibold transition-all cursor-pointer ${
          activeTab === 'backup'
            ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-surface)]'
            : 'border-transparent text-[var(--text-muted)] hover:text-white'
        }`}
      >
        <ObrtIcon name="crypto-vault" size={16} glow={activeTab === 'backup'} />
        <span>4. Trezor</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('cloud')}
        className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 font-semibold transition-all cursor-pointer relative ${
          activeTab === 'cloud'
            ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-surface)]'
            : 'border-transparent text-[var(--text-muted)] hover:text-white'
        }`}
      >
        <ObrtIcon name="shield-security" size={16} glow={activeTab === 'cloud'} />
        <span>5. Google &amp; AI</span>
        {isGoogleAuthenticated && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] absolute top-2 right-2" title="Prijavljen na Google" />
        )}
      </button>
    </div>
  );
};
