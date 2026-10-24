import React from 'react';
import { Printer, Plus } from 'lucide-react';
import { formatHrvatskiIznos } from '@obrtniq/core';

export interface InvoiceDeskActionsProps {
  ukupniIznos: number;
  isLocked: boolean;
  isFormSubmittable: boolean;
  onIssueDocument: () => void;
  onNewDocument: () => void;
}

export const InvoiceDeskActions: React.FC<InvoiceDeskActionsProps> = ({
  ukupniIznos,
  isLocked,
  isFormSubmittable,
  onIssueDocument,
  onNewDocument,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-[var(--border-subtle)] pt-4 gap-4">
      <div className="flex flex-col text-xs font-mono">
        <span className="text-[var(--text-muted)] uppercase text-[10px]">Ukupno za platiti:</span>
        <span className="text-xl font-bold font-mono text-[#10B981] tabular-nums">
          {formatHrvatskiIznos(ukupniIznos)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {!isLocked ? (
          <button
            type="button"
            onClick={onIssueDocument}
            disabled={!isFormSubmittable}
            className={`px-6 py-2.5 font-mono text-xs font-bold transition-all rounded-none flex items-center gap-2
              ${
                isFormSubmittable
                  ? 'bg-[#10B981] text-black hover:bg-[#059669] cursor-pointer shadow-lg shadow-[#10B981]/20 active:scale-95'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-strong)]'
              }
            `}
          >
            <Printer className="w-4 h-4" />
            Fiskaliziraj / Izdaj (F2)
          </button>
        ) : (
          <button
            type="button"
            onClick={onNewDocument}
            className="px-6 py-2.5 font-mono text-xs font-bold bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-primary-hover)] transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            Novi Račun
          </button>
        )}
      </div>
    </div>
  );
};
