// apps/web/src/components/DocumentDrawer.tsx

import { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Ban, 
  Calendar, 
  Building2, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import type { Dokument, VrstaDokumenta } from '@obrtniq/core';
import { dexieStorage } from '../storage/dexie-db';
import { formatHrvatskiIznos, formatHrvatskiDatum } from '@obrtniq/core';

export interface DocumentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeDocumentId?: string;
  onSelectDocument: (doc: Dokument) => void;
  onNewDocument: (vrsta: VrstaDokumenta) => void;
}

export function DocumentDrawer({
  isOpen,
  onClose,
  activeDocumentId,
  onSelectDocument,
  onNewDocument,
}: DocumentDrawerProps) {
  const [documents, setDocuments] = useState<Dokument[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'RACUN' | 'PONUDA' | 'STORNO_RACUN'>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const all = await dexieStorage.dokumenti.getAll();
      setDocuments(all.reverse()); // Najnoviji prvi
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredDocs = documents.filter((d) => {
    if (filterType === 'ALL') return true;
    return d.vrstaDokumenta === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-200 no-print">
      <div 
        className="w-full max-w-xl bg-[var(--bg-surface)] border-l border-[var(--border-strong)] flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-canvas)]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-primary)]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                Evidencija Dokumenata
                <span className="text-xs font-mono font-normal text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 border border-[var(--border-subtle)]">
                  {documents.length} u bazi
                </span>
              </h2>
              <p className="text-xs font-mono text-[var(--text-muted)]">
                Dexie.js IndexedDB &bull; Lokalna trajna pohrana
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={loadDocuments}
              title="Osvježi popis"
              className="p-1.5 text-[var(--text-muted)] hover:text-white border border-transparent hover:border-[var(--border-subtle)] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Header: Create New + Filter Tabs */}
        <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onNewDocument('RACUN');
                onClose();
              }}
              className="flex-1 py-2 px-3 bg-[#10B981] hover:bg-[#059669] text-black font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Novi Račun (F2)
            </button>
            <button
              type="button"
              onClick={() => {
                onNewDocument('PONUDA');
                onClose();
              }}
              className="flex-1 py-2 px-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-white border border-[var(--border-strong)] font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-[var(--accent-primary)]" />
              Nova Ponuda
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center bg-[var(--bg-canvas)] p-0.5 border border-[var(--border-subtle)] text-xs font-mono">
            {(['ALL', 'RACUN', 'PONUDA', 'STORNO_RACUN'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`flex-1 py-1.5 text-center transition-colors ${
                  filterType === type
                    ? 'bg-[var(--accent-primary)] text-black font-semibold'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
              >
                {type === 'ALL'
                  ? 'Svi'
                  : type === 'RACUN'
                  ? 'Računi'
                  : type === 'PONUDA'
                  ? 'Ponude'
                  : 'Storno'}
              </button>
            ))}
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredDocs.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-xs space-y-2">
              <FileText className="w-8 h-8 opacity-40" />
              <span>Nema pronađenih dokumenata za odabrani filter.</span>
              <span className="text-[11px] text-[var(--accent-primary)]">
                Kliknite "Novi Račun" za izradu prvog dokumenta.
              </span>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isActive = doc.id === activeDocumentId;
              const isPaid = doc.status === 'PLACENO';
              const isIssued = doc.status === 'IZDANO';
              const isStorno = doc.status === 'STORNIRANO' || doc.vrstaDokumenta === 'STORNO_RACUN';

              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    onSelectDocument(doc);
                    onClose();
                  }}
                  className={`p-3.5 border transition-all cursor-pointer font-mono text-xs flex flex-col gap-2 ${
                    isActive
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-md'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--border-focus)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">
                        {doc.vrstaDokumenta === 'PONUDA' ? 'Ponuda' : doc.vrstaDokumenta === 'STORNO_RACUN' ? 'Storno' : 'Račun'}{' '}
                        {doc.brojDokumenta}
                      </span>
                      {isActive && (
                        <span className="text-[10px] bg-[var(--accent-primary)] text-black px-1.5 py-0.2 font-bold">
                          AKTIVAN
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 border flex items-center gap-1 ${
                          isPaid
                            ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/50 shadow-sm'
                            : isIssued
                            ? 'bg-[#064E3B]/70 text-[#10B981] border-[#10B981]/30'
                            : isStorno
                            ? 'bg-[#7F1D1D] text-[#EF4444] border-[#EF4444]/40'
                            : 'bg-[var(--bg-elevated)] text-[#F59E0B] border-[#F59E0B]/40'
                        }`}
                      >
                        {isPaid || isIssued ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : isStorno ? (
                          <Ban className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {doc.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1.5 truncate max-w-[280px]">
                      <Building2 className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                      <span className="truncate">{doc.partnerNazivSnapshot || 'Kupac nije naveden'}</span>
                    </div>
                    <div className="font-bold text-white tabular-nums text-sm">
                      {formatHrvatskiIznos(doc.ukupnoIznos)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]/50">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatHrvatskiDatum(doc.datumIzdavanja)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--accent-primary)] hover:underline">
                      <span>Učitaj prikaz</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[11px] font-mono text-[var(--text-muted)] flex items-center justify-between">
          <span>ObrtnIQ Storage v1.0</span>
          <span>IndexedDB Ready</span>
        </div>
      </div>
    </div>
  );
}
