import React from 'react';
import { Terminal, CheckCircle2 } from 'lucide-react';
import { useSystemLogs } from '../../hooks/useSystemLogs';

export interface AppFooterProps {
  onToggleLogDrawer: () => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({ onToggleLogDrawer }) => {
  const { errorCount, warnCount } = useSystemLogs();

  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 sm:px-6 py-2.5 text-xs font-mono text-[var(--text-muted)] flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors no-print">
      <div className="flex items-center space-x-3">
        <span>ObrtnIQ &copy; 2026 &bull; Zakon o fiskalizaciji 1.0 &amp; 2.0</span>
        <span className="text-[var(--border-strong)]">|</span>
        {/* Status Widget Trigger */}
        <button
          type="button"
          onClick={onToggleLogDrawer}
          title="Otvori / Zatvori Sustavni Dnevnik (Event & Error Console)"
          className={`flex items-center space-x-1.5 px-2 py-0.5 border text-[11px] transition-all cursor-pointer ${
            errorCount > 0
              ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444] animate-pulse font-bold'
              : warnCount > 0
              ? 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B] font-bold'
              : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[#10B981] hover:border-[var(--accent-primary)] hover:text-white'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              errorCount > 0 ? 'bg-[#EF4444]' : warnCount > 0 ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
            }`}
          />
          <span>
            {errorCount > 0
              ? `${errorCount} ${errorCount === 1 ? 'greška' : 'greške'}!`
              : warnCount > 0
              ? `${warnCount} ${warnCount === 1 ? 'upozorenje' : 'upozorenja'}`
              : 'Sustav stabilan'}
          </span>
          <Terminal className="w-3 h-3 ml-1 opacity-70" />
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <span className="flex items-center space-x-1.5 text-[#10B981]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Faza 7 &bull; Fiskalizacija 1.0 (CIS) &amp; e-Račun UBL 2.1</span>
        </span>
      </div>
    </footer>
  );
};
