import React from 'react';
import { Upload, Trash2 } from 'lucide-react';
import type { MemorandumTabProps } from '../types';

export const MemorandumTab: React.FC<MemorandumTabProps> = ({
  formData,
  onFileUpload,
  onRemoveImage,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Logotip */}
      <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-white font-bold block">
              Logotip Obrta (Zaglavlje Računa)
            </span>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              PNG, JPG ili SVG do 500 KB. Prikazuje se u gornjem kutu računa.
            </p>
          </div>
          {formData.logoImageData && (
            <button
              type="button"
              onClick={() => onRemoveImage('logoImageData')}
              className="text-xs font-mono text-[#EF4444] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Ukloni logo
            </button>
          )}
        </div>

        {formData.logoImageData ? (
          <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center max-h-32 overflow-hidden">
            <img
              src={formData.logoImageData}
              alt="Logotip obrta"
              className="max-h-24 max-w-full object-contain"
            />
          </div>
        ) : (
          <label className="border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--accent-primary)] p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[var(--bg-elevated)]/20">
            <Upload className="w-6 h-6 text-[var(--text-muted)] mb-2" />
            <span className="text-xs font-mono text-[var(--accent-primary)] font-semibold">
              Kliknite za odabir logotipa
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
              Preporučene dimenzije: 300x100 px
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={(e) => onFileUpload(e, 'logoImageData')}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* 2. Digitalni Pečat i Potpis */}
      <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-white font-bold block">
              Digitalni Pečat i Potpis Vlasnika
            </span>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              PNG s prozirnom pozadinom. Prikazuje se na dnu A4 računa.
            </p>
          </div>
          {formData.pecatPotpisImageData && (
            <button
              type="button"
              onClick={() => onRemoveImage('pecatPotpisImageData')}
              className="text-xs font-mono text-[#EF4444] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Ukloni pečat
            </button>
          )}
        </div>

        {formData.pecatPotpisImageData ? (
          <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center max-h-32 overflow-hidden">
            <img
              src={formData.pecatPotpisImageData}
              alt="Pečat i potpis"
              className="max-h-24 max-w-full object-contain"
            />
          </div>
        ) : (
          <label className="border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--accent-primary)] p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[var(--bg-elevated)]/20">
            <Upload className="w-6 h-6 text-[var(--text-muted)] mb-2" />
            <span className="text-xs font-mono text-[var(--accent-primary)] font-semibold">
              Kliknite za učitavanje pečata/potpisa
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
              Preporučeno: prozirni PNG (transparent background)
            </span>
            <input
              type="file"
              accept="image/png"
              onChange={(e) => onFileUpload(e, 'pecatPotpisImageData')}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
};
