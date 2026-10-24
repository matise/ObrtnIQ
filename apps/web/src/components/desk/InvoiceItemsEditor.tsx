import React from 'react';
import { Plus, Trash2, BookMarked, BookmarkPlus } from 'lucide-react';
import { formatHrvatskiIznos } from '@obrtniq/core';
import { CurrencyInput, KpdPicker } from '../controls';
import type { FormItem } from '../../engine/types';

export interface InvoiceItemsEditorProps {
  items: FormItem[];
  isLocked: boolean;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, partial: Partial<FormItem>) => void;
  onOpenArticleCatalog?: () => void;
  onSaveItemToCatalog?: (item: FormItem) => void;
}

export const InvoiceItemsEditor: React.FC<InvoiceItemsEditorProps> = ({
  items,
  isLocked,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onOpenArticleCatalog,
  onSaveItemToCatalog,
}) => {
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
              <span className="text-xs font-mono text-[var(--text-muted)] font-bold">
                Stavka #{index + 1}
              </span>
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
