import React, { useState } from 'react';
import { Plus, Trash2, BookMarked, BookmarkPlus, Sparkles, Loader2, Check, X } from 'lucide-react';
import { formatHrvatskiIznos } from '@obrtniq/core';
import { CurrencyInput, KpdPicker } from '../controls';
import type { FormItem } from '../../engine/types';
import { geminiService, type KpdRecommendation } from '../../services/gemini-service';
import type { UseGeminiAssistantReturn } from '../../hooks/useGeminiAssistant';

export interface InvoiceItemsEditorProps {
  items: FormItem[];
  isLocked: boolean;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, partial: Partial<FormItem>) => void;
  onOpenArticleCatalog?: () => void;
  onSaveItemToCatalog?: (item: FormItem) => void;
  geminiAssistant?: UseGeminiAssistantReturn;
}

export const InvoiceItemsEditor: React.FC<InvoiceItemsEditorProps> = ({
  items,
  isLocked,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onOpenArticleCatalog,
  onSaveItemToCatalog,
  geminiAssistant,
}) => {
  // AI KPD Asistent stanja
  const [activeAiItemId, setActiveAiItemId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiRecommendation, setAiRecommendation] = useState<KpdRecommendation | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleToggleAi = (item: FormItem) => {
    if (activeAiItemId === item.id) {
      setActiveAiItemId(null);
      setAiRecommendation(null);
      setAiError(null);
    } else {
      setActiveAiItemId(item.id);
      setAiPrompt(item.kpdNaziv || '');
      setAiRecommendation(null);
      setAiError(null);
    }
  };

  const handleRunAi = async (_itemId: string) => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiError(null);
    setAiRecommendation(null);
    try {
      let rec: KpdRecommendation;
      if (geminiAssistant) {
        rec = await geminiAssistant.recommendKpd(aiPrompt);
      } else {
        rec = await geminiService.recommendKpd(aiPrompt);
      }
      setAiRecommendation(rec);
    } catch (err: any) {
      setAiError(err?.message || 'Greška prilikom preporučivanja KPD šifre.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyRecommendation = (itemId: string, rec: KpdRecommendation) => {
    onUpdateItem(itemId, {
      kpdSifra: rec.kpdSifra,
      kpdNaziv: rec.kpdNaziv,
      jedinicaMjere: rec.preporucenaJedinica || 'kom',
      cijena: rec.preporucenaCijena && rec.preporucenaCijena > 0 ? rec.preporucenaCijena : undefined,
    });
    setActiveAiItemId(null);
    setAiRecommendation(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
        <span className="text-xs font-mono uppercase text-[var(--text-secondary)] font-semibold flex items-center gap-2">
          <span>Stavke Dokumenta ({items.length})</span>
          <span className="text-[10px] font-mono text-[var(--accent-primary)] font-normal">
            Prečac: <kbd className="bg-[var(--bg-elevated)] px-1 py-0.5 border border-[var(--border-strong)]">Alt+N</kbd>
          </span>
        </span>

        {!isLocked && (
          <div className="flex items-center gap-2">
            {onOpenArticleCatalog && (
              <button
                type="button"
                onClick={onOpenArticleCatalog}
                className="px-2.5 py-1 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-white border border-[var(--border-strong)] font-mono text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                title="Otvori cjenik usluga i artikala"
              >
                <BookMarked className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                Odaberi iz cjenika
              </button>
            )}
            <button
              type="button"
              onClick={onAddItem}
              className="px-2.5 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--accent-primary)] border border-[var(--border-strong)] font-mono text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Dodaj stavku (Alt+N)
            </button>
          </div>
        )}
      </div>

      {/* Lista stavaka */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-4 space-y-3 relative ${
              isLocked ? 'opacity-70' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--text-muted)] font-bold">
                  Stavka #{index + 1}
                </span>
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => handleToggleAi(item)}
                    title="Otvori AI asistenta za preporuku KPD 2025 šifre i tržišne cijene"
                    className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 transition-all cursor-pointer rounded-xs"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>AI KPD Asistent</span>
                  </button>
                )}
              </div>
              {!isLocked && items.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  title="Ukloni stavku"
                  className="text-[var(--text-muted)] hover:text-[#EF4444] p-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* AI KPD Modal / Prompt Box */}
            {activeAiItemId === item.id && (
              <div className="p-3 bg-[var(--bg-canvas)] border border-amber-500/40 rounded-xs space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-amber-400">
                      ObrtnIQ AI Preporuka KPD 2025 &amp; Cijene
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAiItemId(null);
                      setAiRecommendation(null);
                      setAiError(null);
                    }}
                    className="text-[var(--text-muted)] hover:text-white p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-[var(--text-secondary)] block">
                    Opišite uslugu na prirodnom hrvatskom jeziku:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleRunAi(item.id);
                        }
                      }}
                      placeholder="npr. izrada web shopa u shopifyju, hosting i SEO optimizacija..."
                      className="flex-1 bg-[var(--bg-elevated)] text-white px-3 py-1.5 text-xs font-mono border border-[var(--border-strong)] focus:border-amber-400 outline-none"
                    />
                    <button
                      type="button"
                      disabled={isAiLoading || !aiPrompt.trim()}
                      onClick={() => handleRunAi(item.id)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isAiLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Analiza...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Analiziraj</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Brzi primjeri */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">Brzi primjeri:</span>
                  {[
                    'Programiranje web aplikacija',
                    'Dizajn logotipa i brending',
                    'Poslovno savjetovanje',
                    'Održavanje IT opreme',
                    'Prijevod tehničke dokumentacije',
                  ].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => {
                        setAiPrompt(quick);
                      }}
                      className="text-[10px] font-mono px-1.5 py-0.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-subtle)] cursor-pointer"
                    >
                      {quick}
                    </button>
                  ))}
                </div>

                {/* Greška ako postoji */}
                {aiError && (
                  <p className="text-xs font-mono text-[#EF4444] bg-[#EF4444]/10 p-2 border border-[#EF4444]/20">
                    {aiError}
                  </p>
                )}

                {/* Rezultat preporuke */}
                {aiRecommendation && (
                  <div className="bg-[var(--bg-elevated)] p-3 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                        <span className="text-amber-400">[{aiRecommendation.kpdSifra}]</span>
                        <span>{aiRecommendation.kpdNaziv}</span>
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 border ${
                        aiRecommendation.jeAiGenerirano 
                          ? 'bg-purple-950/80 text-purple-300 border-purple-500/30' 
                          : 'bg-blue-950/80 text-blue-300 border-blue-500/30'
                      }`}>
                        {aiRecommendation.jeAiGenerirano ? '🤖 Gemini AI' : '⚡ RH Heuristika'}
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-[var(--text-secondary)] leading-relaxed">
                      {aiRecommendation.objasnjenje}
                    </p>

                    <div className="flex items-center justify-between text-xs font-mono pt-1 text-[var(--text-muted)] border-t border-[var(--border-subtle)]">
                      <div>
                        Preporučena JM:{' '}
                        <span className="text-white font-bold">{aiRecommendation.preporucenaJedinica}</span>
                        {aiRecommendation.preporucenaCijena ? (
                          <> | Cijena: <span className="text-white font-bold">{aiRecommendation.preporucenaCijena} €</span></>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyRecommendation(item.id, aiRecommendation)}
                        className="px-2.5 py-1 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Primijeni na stavku
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* KPD Klasifikacija */}
            <KpdPicker
              value={item.kpdSifra}
              onChange={(sifra, naziv) => {
                onUpdateItem(item.id, { kpdSifra: sifra, kpdNaziv: naziv });
              }}
              required
            />

            {/* Količina i Cijena */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
                  Količina
                </label>
                <input
                  type="number"
                  min={1}
                  disabled={isLocked}
                  value={item.kolicina}
                  onChange={(e) =>
                    onUpdateItem(item.id, {
                      kolicina: Math.max(1, parseInt(e.target.value, 10) || 1),
                    })
                  }
                  className="w-full bg-[var(--bg-canvas)] text-white px-3 py-2 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
                  Jedinica Mjere
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={item.jedinicaMjere}
                  onChange={(e) => onUpdateItem(item.id, { jedinicaMjere: e.target.value })}
                  className="w-full bg-[var(--bg-canvas)] text-white px-3 py-2 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                />
              </div>

              <CurrencyInput
                label="Cijena (€)"
                value={item.cijena}
                onChange={(cijena) => onUpdateItem(item.id, { cijena })}
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)] pt-1.5 border-t border-[var(--border-subtle)]/40">
              <div>
                {!isLocked && onSaveItemToCatalog && (
                  <button
                    type="button"
                    onClick={() => onSaveItemToCatalog(item)}
                    title="Spremi ovu stavku u trajni cjenik za buduće račune"
                    className="text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--accent-primary)] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <BookmarkPlus className="w-3 h-3" />
                    Spremi u cjenik
                  </button>
                )}
              </div>
              <div>
                Ukupno stavka:{' '}
                <span className="font-bold text-white tabular-nums">
                  {formatHrvatskiIznos(item.kolicina * item.cijena)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

