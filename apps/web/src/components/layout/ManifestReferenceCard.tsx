import React from 'react';
import { FileText } from 'lucide-react';

export interface ManifestReferenceCardProps {
  onOpenDocs?: () => void;
}

export const ManifestReferenceCard: React.FC<ManifestReferenceCardProps> = ({ onOpenDocs }) => {
  return (
    <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4 transition-colors no-print">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center space-x-3">
          <FileText className="w-5 h-5 text-[var(--accent-primary)]" />
          <div>
            <h2 className="font-bold text-base">Implementacijski Dnevnik i Manifest</h2>
            <p className="text-xs text-[var(--text-muted)]">Evidencija faza, odluka i Gate-Check kriterija</p>
          </div>
        </div>
        {onOpenDocs ? (
          <button
            type="button"
            onClick={onOpenDocs}
            className="font-mono text-xs text-[var(--accent-primary)] hover:text-white bg-[var(--bg-elevated)] hover:bg-[var(--accent-primary)]/20 px-3 py-1.5 border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-all cursor-pointer flex items-center gap-1.5"
            title="Otvori cjeloviti sustav dokumentacije i registar faza"
          >
            <span>Otvori Sustav Dokumentacije &rarr;</span>
          </button>
        ) : (
          <span className="font-mono text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-3 py-1 border border-[var(--border-subtle)]">
            docs/manifest_i_dnevnik_implementacije.md
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="bg-[var(--bg-canvas)] p-4 border border-[var(--border-subtle)] space-y-2">
          <span className="text-[var(--text-muted)] block">GLAVNI DOKUMENT</span>
          <span className="text-white font-semibold">docs/glavni_dizajn_dokument_i_plan_implementacije_obrtniq.md</span>
        </div>
        <div className="bg-[var(--bg-canvas)] p-4 border border-[var(--border-subtle)] space-y-2">
          <span className="text-[var(--text-muted)] block">GATE-CHECK FAZA 5</span>
          <span className="text-[#10B981] font-semibold">F2 Izdavanje &bull; Immutability Zaključavanje Prošlo</span>
        </div>
        <div className="bg-[var(--bg-canvas)] p-4 border border-[var(--border-subtle)] space-y-2">
          <span className="text-[var(--text-muted)] block">THEME ENGINE</span>
          <span className="text-[#10B981] font-semibold">100% UI pokriven dinamičkim HSL varijablama</span>
        </div>
      </div>
    </div>
  );
};
