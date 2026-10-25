// apps/web/src/components/bookkeeping/Hub3PaymentModal.tsx

import { useEffect, useRef, useState } from 'react';
import { X, Copy, Check, Printer, QrCode, Barcode, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { renderHub3Barcode, renderQrCode } from '../../utils/barcode';
import { formatHrvatskiIznos } from '@obrtniq/core';

export interface Hub3PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  naslov: string;
  opis: string;
  iznosEur: number;
  platiteljImeAdresa: string;
  primateljNaziv: string;
  primateljIban: string;
  model: string;
  pozivNaBroj: string;
  hub3Payload: string;
  epcQrPayload?: string;
  onMarkAsPaid?: () => void;
  isPaid?: boolean;
}

export function Hub3PaymentModal({
  isOpen,
  onClose,
  naslov,
  opis,
  iznosEur,
  platiteljImeAdresa,
  primateljNaziv,
  primateljIban,
  model,
  pozivNaBroj,
  hub3Payload,
  epcQrPayload,
  onMarkAsPaid,
  isPaid = false,
}: Hub3PaymentModalProps) {
  const [activeBarcodeType, setActiveBarcodeType] = useState<'HUB3' | 'EPC_QR'>('HUB3');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const hub3CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Renderiranje kodova na canvas
  useEffect(() => {
    if (!isOpen) return;

    if (activeBarcodeType === 'HUB3' && hub3CanvasRef.current && hub3Payload) {
      renderHub3Barcode(hub3CanvasRef.current, hub3Payload, { scale: 2, height: 12, columns: 9 }).catch(() => {});
    }

    if (activeBarcodeType === 'EPC_QR' && qrCanvasRef.current && epcQrPayload) {
      renderQrCode(qrCanvasRef.current, epcQrPayload, 220).catch(() => {});
    }
  }, [isOpen, activeBarcodeType, hub3Payload, epcQrPayload]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Zaglavlje modala */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-wide">{naslov}</h3>
              <p className="text-xs text-slate-400">Nalog za plaćanje u Državni proračun RH / REGOS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tijelo modala */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Iznos banner */}
          <div className="flex items-center justify-between p-4 bg-indigo-950/40 border border-indigo-800/50 rounded-xl">
            <div>
              <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider">Iznos za uplatu</span>
              <div className="text-2xl font-bold font-mono text-white mt-0.5">
                {formatHrvatskiIznos(iznosEur)}
              </div>
            </div>
            {isPaid ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Uplaćeno
              </div>
            ) : (
              <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                Čeka uplatu
              </div>
            )}
          </div>

          {/* Preklopnik barkoda: HUB-3 PDF417 vs EPC SEPA QR */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 p-1 bg-slate-800/90 rounded-lg border border-slate-700 mb-4">
              <button
                type="button"
                onClick={() => setActiveBarcodeType('HUB3')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  activeBarcodeType === 'HUB3'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Barcode className="w-4 h-4" />
                HUB-3 (PDF417)
              </button>
              {epcQrPayload && (
                <button
                  type="button"
                  onClick={() => setActiveBarcodeType('EPC_QR')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    activeBarcodeType === 'EPC_QR'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  EPC SEPA QR
                </button>
              )}
            </div>

            {/* Prikaz canvas barkoda na bijeloj podlozi radi m-banking kamera */}
            <div className="p-4 bg-white rounded-xl shadow-inner flex items-center justify-center border border-slate-300 min-w-[280px] min-h-[140px]">
              {activeBarcodeType === 'HUB3' ? (
                <canvas ref={hub3CanvasRef} className="max-w-full h-auto block" />
              ) : (
                <canvas ref={qrCanvasRef} className="max-w-[200px] h-auto block" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Otvorite mobilnu aplikaciju banke (ZABA, PBZ, Erste, George, HPB, OTP) i usmjerite kameru na kod.
            </p>
          </div>

          {/* Podaci naloga (tekstualni prikaz s 1-klik kopiranjem) */}
          <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 text-xs">
            {/* Primatelj */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Primatelj:</span>
              <span className="font-semibold text-slate-200 text-right">{primateljNaziv}</span>
            </div>

            {/* IBAN */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400 shrink-0">IBAN računa:</span>
              <div className="flex items-center gap-1.5 font-mono text-slate-200 text-right">
                <span>{primateljIban}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(primateljIban, 'iban')}
                  title="Kopiraj IBAN"
                  className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"
                >
                  {copiedField === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Model i Poziv na broj */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400 shrink-0">Model i poziv na broj:</span>
              <div className="flex items-center gap-1.5 font-mono text-slate-200 text-right">
                <span className="font-semibold text-indigo-400">{model}</span>
                <span>{pozivNaBroj}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${model} ${pozivNaBroj}`, 'poziv')}
                  title="Kopiraj poziv na broj"
                  className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"
                >
                  {copiedField === 'poziv' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Opis plaćanja */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Opis plaćanja:</span>
              <span className="text-slate-300 text-right font-medium">{opis}</span>
            </div>

            {/* Platitelj */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Platitelj:</span>
              <span className="text-slate-300 text-right">{platiteljImeAdresa}</span>
            </div>
          </div>
        </div>

        {/* Podnožje modala s akcijama */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-t border-slate-700/80">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Ispiši uplatnicu
          </button>

          <div className="flex items-center gap-2">
            {onMarkAsPaid && !isPaid && (
              <button
                type="button"
                onClick={() => {
                  onMarkAsPaid();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
              >
                <Check className="w-4 h-4" />
                Označi kao plaćeno
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition-colors"
            >
              Zatvori
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
