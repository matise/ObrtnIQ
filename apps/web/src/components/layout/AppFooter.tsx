import { Terminal, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useSystemLogs } from '../../hooks/useSystemLogs';
import { getTotalPhasesCount, getPhasesProgressPercentage } from '@obrtniq/core';

export interface AppFooterProps {
  onToggleLogDrawer: () => void;
  isLogDrawerOpen?: boolean;
  onOpenDocs?: () => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({ 
  onToggleLogDrawer, 
  isLogDrawerOpen = false,
  onOpenDocs 
}) => {
  const { errorCount, warnCount } = useSystemLogs();

  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 sm:px-6 py-2.5 text-xs font-mono text-[var(--text-muted)] flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors no-print">
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <span className="hidden md:inline">ObrtnIQ &copy; 2026 &bull; Zakon o fiskalizaciji 1.0 &amp; 2.0</span>
        <span className="md:hidden">ObrtnIQ &copy; 2026</span>
        <span className="text-[var(--border-strong)]">|</span>
        {/* Status Widget Trigger */}
        <button
          type="button"
          onClick={onToggleLogDrawer}
          title={isLogDrawerOpen ? 'Zatvori Sustavni Dnevnik (Alt+9)' : 'Otvori Sustavni Dnevnik & Telemetriju (Alt+9 / Alt+L)'}
          className={`flex items-center space-x-1.5 px-2 py-0.5 border text-[11px] transition-all cursor-pointer rounded-none shrink-0 ${
            isLogDrawerOpen
              ? 'bg-[var(--bg-elevated)] border-2 border-[var(--accent-primary)] text-white shadow-[0_0_10px_var(--icon-layer-glow)] font-bold'
              : errorCount > 0
              ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444] animate-pulse font-bold'
              : warnCount > 0
              ? 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B] font-bold'
              : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[#10B981] hover:border-[var(--accent-primary)] hover:text-white'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
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
          <Terminal className="w-3 h-3 ml-1 opacity-70 shrink-0" />
        </button>
      </div>

      <div className="flex items-center space-x-4 shrink-0">
        {onOpenDocs ? (
          <button
            type="button"
            onClick={onOpenDocs}
            className="flex items-center space-x-1.5 text-slate-300 hover:text-[var(--accent-primary)] transition-colors cursor-pointer shrink-0"
            title="Otvori Sustav Dokumentacije i registar faza izgradnje"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
            <span className="hidden sm:inline">Sustav Dokumentacije &bull; {getTotalPhasesCount()} Faza ({getPhasesProgressPercentage()}%)</span>
            <span className="sm:hidden">Dokumentacija &bull; {getPhasesProgressPercentage()}%</span>
          </button>
        ) : (
          <span className="flex items-center space-x-1.5 text-[#10B981] shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Faza 7 &bull; Fiskalizacija 1.0 (CIS) &amp; e-Račun UBL 2.1</span>
            <span className="sm:hidden">Faza 7 &bull; CIS / UBL</span>
          </span>
        )}
      </div>
    </footer>
  );
};
