import React from 'react';
import { Lock, Unlock, CheckCircle2, CreditCard, Ban, ArrowRightLeft } from 'lucide-react';
import type { VrstaDokumenta, StatusDokumenta } from '@obrtniq/core';

export interface DocumentStatusBarProps {
  docType: VrstaDokumenta;
  docStatus: StatusDokumenta;
  brojDokumenta: string;
  isLocked: boolean;
  onNewDocument: (vrsta?: VrstaDokumenta) => void;
  onRecordPayment: () => void;
  onStorno: () => void;
  onConvertOffer: () => void;
}

export const DocumentStatusBar: React.FC<DocumentStatusBarProps> = ({
  docType,
  docStatus,
  brojDokumenta,
  isLocked,
  onNewDocument,
  onRecordPayment,
  onStorno,
  onConvertOffer,
}) => {
  return (
    <div className="space-y-4">
      {/* Desk Top Bar: Mode & Immutability Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-subtle)] pb-3 gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono uppercase text-[var(--accent-primary)] font-bold tracking-wider">
            Radna Ploha Unosa (Input Desk)
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--bg-canvas)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
            {docType}
          </span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          {isLocked ? (
            <span className="flex items-center text-[#10B981] gap-1.5 font-bold bg-[#064E3B]/40 px-2 py-0.5 border border-[#10B981]/30">
              <Lock className="w-3.5 h-3.5" />
              ZAKLJUČANO &bull; {brojDokumenta}
            </span>
          ) : (
            <span className="flex items-center text-[#F59E0B] gap-1.5 font-bold bg-[#78350F]/20 px-2 py-0.5 border border-[#F59E0B]/30">
              <Unlock className="w-3.5 h-3.5" />
              NACRT (Uređivanje omogućeno)
            </span>
          )}
        </div>
      </div>

      {/* Immutability Notification Banner when locked */}
      {isLocked && (
        <div className="p-3 bg-[#064E3B]/30 border border-[#10B981]/40 text-xs font-mono space-y-1 text-slate-200">
          <div className="flex items-center gap-1.5 text-[#10B981] font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Dokument je uspješno izdan i trajno zaključan za izmjene</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Prema Zakonu o računovodstvu i fiskalizaciji RH, izdani računi se ne smiju mijenjati. Ako trebate ispravak, kliknite gumb "Storniraj račun".
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNewDocument('RACUN')}
              className="px-3 py-1 bg-[var(--accent-primary)] text-black font-bold text-xs hover:bg-[var(--accent-primary-hover)] transition-all cursor-pointer"
            >
              Novi Račun
            </button>
            {docStatus === 'IZDANO' && docType === 'RACUN' && (
              <>
                <button
                  type="button"
                  onClick={onRecordPayment}
                  className="px-3 py-1 bg-[#10B981] text-black font-bold text-xs hover:bg-[#059669] transition-all cursor-pointer flex items-center gap-1 shadow-md"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Evidentiraj uplatu u KPR
                </button>
                <button
                  type="button"
                  onClick={onStorno}
                  className="px-3 py-1 bg-[#EF4444] text-white font-bold text-xs hover:bg-[#DC2626] transition-all cursor-pointer flex items-center gap-1"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Storniraj ovaj račun
                </button>
              </>
            )}
            {docStatus === 'PLACENO' && (
              <span className="px-3 py-1 bg-[#064E3B] text-[#10B981] border border-[#10B981]/50 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Plaćeno &bull; Evidentirano u Knjizi Prometa
              </span>
            )}
            {docType === 'PONUDA' && (
              <button
                type="button"
                onClick={onConvertOffer}
                className="px-3 py-1 bg-[#10B981] text-black font-bold text-xs hover:bg-[#059669] transition-all cursor-pointer flex items-center gap-1"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Pretvori u Službeni Račun
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
