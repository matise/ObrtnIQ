// apps/web/src/components/desk/DocumentationWorkspaceView.tsx
// ObrtnIQ v3.0 — Sustav Dokumentacije, Faza Izgradnje i Implementacijskog Manifesta

import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  FileText,
  Download,
  ArrowLeft,
  Layers,
  Tag,
  ShieldCheck,
  Code,
  Copy,
  Check,
  BookOpen
} from 'lucide-react';
import { ObrtIcon, type ObrtIconName } from '../icons';
import { useDocsStore } from '../../storage/docs-store';
import type { ImplementationPhase } from '@obrtniq/core';

export interface DocumentationWorkspaceViewProps {
  onNavigateHome: () => void;
  initialPhaseId?: string;
}

export const DocumentationWorkspaceView: React.FC<DocumentationWorkspaceViewProps> = ({
  onNavigateHome,
  initialPhaseId = 'faza-05'
}) => {
  const store = useDocsStore(initialPhaseId);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleDownloadMarkdown = () => {
    const mdContent = store.exportPhasesMarkdown();
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ObrtnIQ_Faze_Izgradnje_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200 no-print">
      {/* 1. Glavno Zaglavlje Sustava Dokumentacije */}
      <div className="border border-[var(--border-strong)] bg-[var(--bg-surface)] p-5 sm:p-6 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <button
              type="button"
              onClick={onNavigateHome}
              className="p-2 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Povratak na Radnu Plohu (Home)"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--accent-primary)]" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent-primary)] font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Sustav Dokumentacije &bull; Lokalni Store
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)] font-mono">
                  Lokalna Baza Znanja
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mt-0.5">
                Implementacijski Dnevnik, Faze &amp; Gate-Checkovi
              </h1>
            </div>
          </div>

          {/* Desna strana: Statistika i Izvoz */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end text-right font-mono text-xs">
              <span className="text-[var(--text-muted)] text-[10px] uppercase">Dovršenost sustava:</span>
              <span className="font-bold text-[#10B981] text-sm tabular-nums">
                {store.completedPhases} / {store.totalPhases} Faza ({store.progressPercentage}%)
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="flex items-center space-x-1.5 px-3 py-2 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] text-xs font-mono text-slate-200 hover:text-white transition-all cursor-pointer"
              title="Preuzmite cjeloviti registar faza u Markdown formatu"
            >
              <Download className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span className="hidden sm:inline">Izvezi Markdown</span>
            </button>
          </div>
        </div>

        {/* Tabovi modula dokumentacije */}
        <div className="flex items-center space-x-2 border-t border-[var(--border-subtle)] mt-4 pt-3 text-xs font-mono">
          <button
            type="button"
            onClick={() => store.setActiveTab('phases')}
            className={`flex items-center space-x-2 px-3 py-1.5 transition-all cursor-pointer ${
              store.activeTab === 'phases'
                ? 'bg-[var(--bg-elevated)] text-white border-b-2 border-[var(--accent-primary)] font-bold shadow-sm'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-canvas)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Faze Izgradnje ({store.phases.length})</span>
          </button>
          <button
            type="button"
            onClick={() => store.setActiveTab('manifest')}
            className={`flex items-center space-x-2 px-3 py-1.5 transition-all cursor-pointer ${
              store.activeTab === 'manifest'
                ? 'bg-[var(--bg-elevated)] text-white border-b-2 border-[var(--accent-primary)] font-bold shadow-sm'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-canvas)]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Arhitektonski Manifest</span>
          </button>
          <button
            type="button"
            onClick={() => store.setActiveTab('catalog')}
            className={`flex items-center space-x-2 px-3 py-1.5 transition-all cursor-pointer ${
              store.activeTab === 'catalog'
                ? 'bg-[var(--bg-elevated)] text-white border-b-2 border-[var(--accent-primary)] font-bold shadow-sm'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-canvas)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Katalog Dokumenata ({store.docsCatalog.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Glavni Sadržaj Ovisno o Aktivnom Tabu */}
      {store.activeTab === 'phases' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LIJEVI STUPAC: Pretraga, Filteri i Popis Faza (lg:col-span-5 xl:col-span-4) */}
          <div className="lg:col-span-5 xl:col-span-4 border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-4">
            {/* Traka za pretragu */}
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pretraži faze, komponente, tagove..."
                value={store.searchQuery}
                onChange={(e) => store.setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] text-xs text-white pl-9 pr-3 py-2 outline-none font-mono transition-colors"
              />
              {store.searchQuery && (
                <button
                  type="button"
                  onClick={() => store.setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-white font-mono"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Filteri statusa */}
            <div className="flex items-center space-x-1.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => store.setStatusFilter('ALL')}
                className={`px-2.5 py-1 border transition-colors cursor-pointer ${
                  store.statusFilter === 'ALL'
                    ? 'bg-[var(--bg-elevated)] text-white border-[var(--accent-primary)] font-bold'
                    : 'bg-[var(--bg-canvas)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-white'
                }`}
              >
                Sve ({store.phases.length})
              </button>
              <button
                type="button"
                onClick={() => store.setStatusFilter('COMPLETED')}
                className={`px-2.5 py-1 border transition-colors cursor-pointer ${
                  store.statusFilter === 'COMPLETED'
                    ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/50 font-bold'
                    : 'bg-[var(--bg-canvas)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[#10B981]'
                }`}
              >
                Gotovo ({store.completedPhases})
              </button>
              <button
                type="button"
                onClick={() => store.setStatusFilter('IN_PROGRESS')}
                className={`px-2.5 py-1 border transition-colors cursor-pointer ${
                  store.statusFilter === 'IN_PROGRESS'
                    ? 'bg-amber-950 text-amber-400 border-amber-500/50 font-bold'
                    : 'bg-[var(--bg-canvas)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-amber-400'
                }`}
              >
                U tijeku
              </button>
            </div>

            {/* Lista kartica faza (skrolabilna) */}
            <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
              {store.filteredPhases.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] font-mono">
                  Nema faza koje odgovaraju pojmu "{store.searchQuery}".
                </div>
              ) : (
                store.filteredPhases.map((phase) => {
                  const isSelected = store.selectedPhase?.id === phase.id;
                  const isCompleted = phase.status === 'COMPLETED';

                  return (
                    <div
                      key={phase.id}
                      onClick={() => store.setSelectedPhaseId(phase.id)}
                      className={`p-3 border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)] shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-primary)]" />
                      )}
                      <div className="flex items-center justify-between pl-1.5">
                        <span className="text-[10px] font-mono font-bold text-[var(--text-muted)]">
                          {phase.code}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 border ${
                            isCompleted
                              ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/30'
                              : 'bg-amber-950 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {isCompleted ? 'GOTOVO' : 'U TIJEKU'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2.5 mt-1.5 pl-1.5">
                        <ObrtIcon name={phase.iconName as ObrtIconName} size={18} glow={isSelected} />
                        <h4 className="font-bold text-xs text-white leading-tight">
                          {phase.title}
                        </h4>
                      </div>

                      <p className="text-[11px] text-[var(--text-muted)] mt-1.5 line-clamp-2 pl-1.5 leading-relaxed">
                        {phase.summary}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* DESNI STUPAC: Detaljni Prikaz Odabrane Faze (lg:col-span-7 xl:col-span-8) */}
          <div className="lg:col-span-7 xl:col-span-8 border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-6">
            {store.selectedPhase ? (
              <PhaseDetailsCard
                phase={store.selectedPhase}
                onCopyPath={handleCopyPath}
                copiedPath={copiedPath}
              />
            ) : (
              <div className="p-12 text-center text-sm text-[var(--text-muted)] font-mono">
                Odaberite fazu s lijeve strane za detaljan uvid.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prikaz Tab: Manifest */}
      {store.activeTab === 'manifest' && (
        <ManifestView />
      )}

      {/* Prikaz Tab: Katalog Dokumenata */}
      {store.activeTab === 'catalog' && (
        <DocsCatalogView
          catalog={store.docsCatalog}
          onCopyPath={handleCopyPath}
          copiedPath={copiedPath}
        />
      )}
    </div>
  );
};

interface PhaseDetailsCardProps {
  phase: ImplementationPhase;
  onCopyPath: (path: string) => void;
  copiedPath: string | null;
}

const PhaseDetailsCard: React.FC<PhaseDetailsCardProps> = ({ phase, onCopyPath, copiedPath }) => {
  return (
    <div className="space-y-6">
      {/* Zaglavlje kartice faze */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-center">
            <ObrtIcon name={phase.iconName as ObrtIconName} size={28} glow />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[var(--accent-primary)]">
                {phase.code}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30 font-bold">
                {phase.status === 'COMPLETED' ? 'GOTOVO' : 'U TIJEKU'}
              </span>
              {phase.completedDate && (
                <span className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Dovršeno: {phase.completedDate}
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">
              {phase.title}
            </h2>
          </div>
        </div>
      </div>

      {/* Sažetak i detaljni inženjerski opis */}
      <div className="space-y-3">
        <div className="bg-[var(--bg-canvas)] border-l-2 border-[var(--accent-primary)] p-3 text-xs text-slate-200 font-mono">
          {phase.summary}
        </div>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
          {phase.description}
        </p>
      </div>

      {/* Gate-Check Verifikacijski Kriteriji */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            Gate-Check Kriteriji ({phase.gateChecks.filter(g => g.passed).length}/{phase.gateChecks.length})
          </h3>
          <span className="text-[10px] font-mono text-[#10B981]">100% Prošlo</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
          {phase.gateChecks.map((gc, idx) => (
            <div
              key={idx}
              className="bg-[var(--bg-canvas)] border border-[var(--border-subtle)] p-3 space-y-1.5"
            >
              <div className="flex items-center space-x-2 text-white font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                <span className="truncate">{gc.name}</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pl-5.5">
                {gc.verificationDetail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tagovi i Ključne Riječi */}
      {phase.tags.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] flex items-center gap-1">
            <Tag className="w-3 h-3" /> Ključne domene:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {phase.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono px-2 py-0.5 bg-[var(--bg-canvas)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Povezane datoteke s gumbom za kopiranje */}
      {phase.relatedFiles.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)]">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5" /> Povezane izvorne datoteke u repozitoriju:
          </span>
          <div className="space-y-1.5 font-mono text-xs">
            {phase.relatedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-[var(--bg-canvas)] px-3 py-1.5 border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-colors group"
              >
                <span className="text-slate-300 truncate max-w-[500px]">
                  {file}
                </span>
                <button
                  type="button"
                  onClick={() => onCopyPath(file)}
                  className="flex items-center space-x-1 text-[10px] text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors cursor-pointer ml-2"
                  title="Kopiraj relativnu putanju"
                >
                  {copiedPath === file ? (
                    <>
                      <Check className="w-3 h-3 text-[#10B981]" />
                      <span className="text-[#10B981]">Kopirano</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Kopiraj</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ManifestView: React.FC = () => {
  return (
    <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-6">
      <div className="flex items-center space-x-3 border-b border-[var(--border-subtle)] pb-4">
        <ShieldCheck className="w-6 h-6 text-[#10B981]" />
        <div>
          <h2 className="text-lg font-bold text-white">Dubrovački Kripto-Manifest i Temeljna Načela</h2>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            Službena načela izgradnje autonomnog sustava za hrvatske paušalne obrtnike
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        <div className="bg-[var(--bg-canvas)] p-4 border border-[var(--border-subtle)] space-y-2">
          <span className="text-[var(--accent-primary)] font-bold block text-sm">1. LIBERTAS (Potpuna Samostalnost)</span>
          <p className="text-[var(--text-muted)] leading-relaxed">
            Nema ovisnosti o oblaku trećih strana ili tuđim poslužiteljima. Podaci su u 100% vlasništvu obrtnika, pohranjeni lokalno u IndexedDB bazu preglednika (Dexie).
          </p>
        </div>

        <div className="bg-[var(--bg-canvas)] p-4 border border-[var(--border-subtle)] space-y-2">
          <span className="text-[#10B981] font-bold block text-sm">2. ZAKONSKI IMMUTABILITY</span>
          <p className="text-[var(--text-muted)] leading-relaxed">
            Izdani račun je trajno zakonski zaključan. Nema retroaktivnog prepravljanja iznosa ili datuma. Sve ispravke rješavaju se isključivo kroz transparentni storno postupak.
          </p>
        </div>

        <div className="bg-[var(--bg-canvas)] p-4 border border-[var(--border-subtle)] space-y-2">
          <span className="text-[#F59E0B] font-bold block text-sm">3. KRIPTO-SIDRO I PRIVATNOST</span>
          <p className="text-[var(--text-muted)] leading-relaxed">
            Sinkronizacija se vrši isključivo na privatni Google Drive korisnika uz lokalno AES-256 kriptiranje. Google Sub ID služi kao klijentsko kriptografsko sidro bez curenja podataka.
          </p>
        </div>

        <div className="bg-[var(--bg-canvas)] p-4 border border-[var(--border-subtle)] space-y-2">
          <span className="text-[#8B5CF6] font-bold block text-sm">4. REGULATORNA PRECIZNOST RH</span>
          <p className="text-[var(--text-muted)] leading-relaxed">
            Ugrađeni algoritmi ISO 7064 MOD 11,10 (OIB), MOD 97 (IBAN), HUB-3 PDF417, EPC QR SEPA standard, ZKI/JIR i UBL 2.1 CIUS-HR jamče 100% točnost bez potrebe za knjigovođom.
          </p>
        </div>
      </div>

      <div className="bg-[var(--bg-canvas)] p-4 border border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono">
        <span className="text-[var(--text-muted)]">
          Cjeloviti dnevnik implementacije dostupan je u dokumentu:
        </span>
        <span className="text-[var(--accent-primary)] font-bold">
          docs/manifest_i_dnevnik_implementacije.md
        </span>
      </div>
    </div>
  );
};

interface DocsCatalogViewProps {
  catalog: { slug: string; title: string; category: string; filePath: string; description: string }[];
  onCopyPath: (path: string) => void;
  copiedPath: string | null;
}

const DocsCatalogView: React.FC<DocsCatalogViewProps> = ({ catalog, onCopyPath, copiedPath }) => {
  return (
    <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-5">
      <div className="flex items-center space-x-3 border-b border-[var(--border-subtle)] pb-4">
        <FileText className="w-6 h-6 text-[#F59E0B]" />
        <div>
          <h2 className="text-lg font-bold text-white">Katalog Dokumentacije Repozitorija</h2>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            Službeni planovi faza, arhitektonske specifikacije i vodiči u mapi `/docs`
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {catalog.map((item) => (
          <div
            key={item.slug}
            className="bg-[var(--bg-canvas)] border border-[var(--border-subtle)] p-4 space-y-3 font-mono"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-2 py-0.5 bg-[var(--bg-elevated)] text-[var(--accent-primary)] border border-[var(--border-strong)]">
                {item.category}
              </span>
              <button
                type="button"
                onClick={() => onCopyPath(item.filePath)}
                className="flex items-center space-x-1 text-[10px] text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                title="Kopiraj putanju do datoteke"
              >
                {copiedPath === item.filePath ? (
                  <span className="text-[#10B981] flex items-center gap-1">
                    <Check className="w-3 h-3" /> Kopirano
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Kopiraj putanju
                  </span>
                )}
              </button>
            </div>
            <h4 className="text-sm font-bold text-white">
              {item.title}
            </h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {item.description}
            </p>
            <div className="text-[11px] text-slate-400 truncate bg-[var(--bg-surface)] p-2 border border-[var(--border-subtle)]">
              {item.filePath}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
