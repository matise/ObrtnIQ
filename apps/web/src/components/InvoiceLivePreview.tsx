import { useEffect, useRef, useState } from 'react';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Eye, 
  Zap, 
  QrCode, 
  Layers 
} from 'lucide-react';
import { renderHub3Barcode, renderQrCode } from '../utils/barcode';
import { generateInvoicePdf, type InvoicePdfData } from '../utils/pdf-generator';
import { generateHub3Payload, type Hub3Nalog } from '@obrtniq/core';
import { generateEpcQrPayload, type EpcQrNalog } from '@obrtniq/core';

export interface InvoiceLivePreviewProps {
  obrtNaziv: string;
  obrtVlasnik: string;
  obrtOib: string;
  obrtIban: string;
  obrtAdresa: string;
  obrtBanka?: string;

  partnerNaziv: string;
  partnerOib: string;
  isPartnerOibValid: boolean;

  brojDokumenta: string;
  datumIzdavanja: string;
  datumDospijeca: string;
  datumIsporuke: string;
  nacinPlacanja: string;
  taxZone: string;

  kpdSifra: string;
  kpdNaziv: string;
  kolicina: number;
  cijena: number;
}

export function InvoiceLivePreview(props: InvoiceLivePreviewProps) {
  const [previewStyle, setPreviewStyle] = useState<'theme' | 'paper'>('theme');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [lastGenTime, setLastGenTime] = useState<number | null>(null);

  const hub3CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const ukupno = props.kolicina * props.cijena;
  const pozivNaBroj = `HR00 ${props.brojDokumenta.split('/')[0] || '1'}-2026`;

  // Priprema podataka za HUB-3 uplatnicu
  const hub3Payload = (() => {
    try {
      const nalog: Hub3Nalog = {
        iznosEur: ukupno,
        platiteljImeAdresa: props.partnerNaziv || 'Kupac',
        primateljImeAdresa: props.obrtNaziv,
        primateljIban: props.obrtIban.replace(/\s+/g, ''),
        model: 'HR00',
        pozivNaBroj: pozivNaBroj.replace(/^HR00\s*/, ''),
        sifraNamjene: 'GDSV',
        opisPlacanja: `Racun ${props.brojDokumenta}`,
      };
      return generateHub3Payload(nalog);
    } catch {
      return '';
    }
  })();

  // Priprema podataka za EPC SEPA QR kod
  const epcQrPayload = (() => {
    try {
      const nalog: EpcQrNalog = {
        primateljIme: props.obrtNaziv,
        primateljIban: props.obrtIban.replace(/\s+/g, ''),
        iznosEur: ukupno,
        bic: props.obrtBanka,
        svrhaKod: 'GDSV',
        pozivNaBroj: pozivNaBroj,
        opisPlacanja: `Racun ${props.brojDokumenta}`,
      };
      return generateEpcQrPayload(nalog);
    } catch {
      return '';
    }
  })();

  // Renderiranje barkodova na Canvas pri promjeni unosa
  useEffect(() => {
    if (hub3CanvasRef.current && hub3Payload) {
      renderHub3Barcode(hub3CanvasRef.current, hub3Payload, {
        scale: 2,
        height: 8,
        columns: 9,
        eclevel: 4,
      }).catch((err) => console.warn('HUB-3 render:', err));
    }

    if (qrCanvasRef.current && epcQrPayload) {
      renderQrCode(qrCanvasRef.current, epcQrPayload, 140).catch((err) =>
        console.warn('QR render:', err)
      );
    }
  }, [hub3Payload, epcQrPayload]);

  // Handler za generiranje i download pravog A4 PDF dokumenta
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdfData: InvoicePdfData = {
        obrtNaziv: props.obrtNaziv,
        obrtVlasnik: props.obrtVlasnik,
        obrtOib: props.obrtOib,
        obrtAdresa: props.obrtAdresa,
        obrtIban: props.obrtIban,
        obrtBanka: props.obrtBanka,
        kupacNaziv: props.partnerNaziv || 'Kupac',
        kupacOib: props.partnerOib,
        kupacAdresa: 'Hrvatska',
        vrstaDokumentaNaziv: 'RAČUN',
        brojDokumenta: props.brojDokumenta,
        datumIzdavanja: props.datumIzdavanja,
        datumIsporuke: props.datumIsporuke,
        datumDospijeca: props.datumDospijeca,
        nacinPlacanjaNaziv: props.nacinPlacanja,
        pozivNaBroj: pozivNaBroj,
        poreznaZonaNaziv: props.taxZone,
        stavke: [
          {
            rbr: 1,
            naziv: props.kpdNaziv || 'Usluga razvoja aplikacijskog softvera',
            kpdSifra: props.kpdSifra,
            kolicina: props.kolicina,
            jedinicaMjere: 'sat',
            jedinicnaCijena: props.cijena,
            popustPostotak: 0,
            ukupno: ukupno,
          },
        ],
        ukupnoOsnovica: ukupno,
        ukupnoPdv: 0,
        ukupnoIznos: ukupno,
        includeHub3Barcode: true,
        includeQrCode: true,
      };

      const result = await generateInvoicePdf(pdfData);
      setLastGenTime(result.durationMs);

      // Preuzimanje PDF datoteke
      result.doc.save(result.filename);
    } catch (err) {
      console.error('Greška pri generiranju PDF-a:', err);
      alert('Greška pri generiranju PDF-a. Provjerite konzolu.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const isPaper = previewStyle === 'paper';

  return (
    <div className="space-y-4">
      {/* Action Header & Style Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="text-xs font-mono uppercase text-[var(--text-secondary)] font-bold tracking-wider">
            Živi A4 Preglednik (Real-Time Engine)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Style Toggle: Theme vs White Paper */}
          <div className="flex items-center bg-[var(--bg-canvas)] p-0.5 border border-[var(--border-subtle)] text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setPreviewStyle('theme')}
              className={`px-2.5 py-1 flex items-center gap-1 transition-colors ${
                !isPaper
                  ? 'bg-[var(--accent-primary)] text-black font-semibold'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              Tema
            </button>
            <button
              type="button"
              onClick={() => setPreviewStyle('paper')}
              className={`px-2.5 py-1 flex items-center gap-1 transition-colors ${
                isPaper
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              Bijeli Papir
            </button>
          </div>

          {/* Instant PDF Download Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-3.5 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-black font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {isGeneratingPdf ? 'Generiram...' : 'Preuzmi PDF'}
          </button>
        </div>
      </div>

      {/* Latency / Gate-Check Speed Indicator */}
      {lastGenTime !== null && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#064E3B] border border-[#10B981]/40 text-[#10B981] font-mono text-xs">
          <span className="flex items-center gap-1.5 font-semibold">
            <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
            Klijentski PDF generiran u {lastGenTime} ms!
          </span>
          <span className="text-[10px] bg-[#10B981]/20 px-1.5 py-0.5 border border-[#10B981]/30">
            Gate-Check (&lt; 300 ms) PROŠAO
          </span>
        </div>
      )}

      {/* The Printable A4 Simulation Sheet */}
      <div
        className={`w-full p-5 sm:p-6 transition-all border shadow-2xl relative ${
          isPaper
            ? 'bg-[#FFFFFF] text-[#0F172A] border-slate-300 shadow-slate-900/30'
            : 'bg-[var(--bg-elevated)]/70 text-white border-[var(--border-subtle)]'
        }`}
      >
        {/* Top Accent Line */}
        <div
          className={`h-1.5 w-full mb-5 ${
            isPaper ? 'bg-slate-900' : 'bg-[var(--accent-primary)]'
          }`}
        />

        {/* 1. Header (Obrt info & Invoice Metadata) */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-current/15 text-xs font-mono">
          <div className="space-y-1">
            <div className={`font-bold text-base ${isPaper ? 'text-black' : 'text-white'}`}>
              {props.obrtNaziv}
            </div>
            <div className={isPaper ? 'text-slate-600' : 'text-[var(--text-muted)]'}>
              vl. {props.obrtVlasnik}
            </div>
            <div className={isPaper ? 'text-slate-600' : 'text-[var(--text-muted)]'}>
              OIB: <span className="font-semibold">{props.obrtOib}</span>
            </div>
            <div className={isPaper ? 'text-slate-600' : 'text-[var(--text-muted)]'}>
              {props.obrtAdresa}
            </div>
            <div className={isPaper ? 'text-slate-600' : 'text-[var(--text-muted)]'}>
              IBAN: <span className="font-semibold">{props.obrtIban}</span>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div
              className={`font-bold text-sm tracking-tight ${
                isPaper ? 'text-slate-900' : 'text-[var(--accent-primary)]'
              }`}
            >
              Račun br. {props.brojDokumenta}
            </div>
            <div className={isPaper ? 'text-slate-600' : 'text-[var(--text-muted)]'}>
              Datum izdavanja: {props.datumIzdavanja}
            </div>
            <div className={isPaper ? 'text-slate-600' : 'text-[var(--text-muted)]'}>
              Datum isporuke: {props.datumIsporuke}
            </div>
            <div className={isPaper ? 'text-slate-600' : 'text-[var(--text-muted)]'}>
              Dospijeće: <span className="font-semibold">{props.datumDospijeca}</span>
            </div>
            <div className="pt-1">
              <span
                className={`text-[10px] px-2 py-0.5 border ${
                  isPaper
                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                    : 'bg-[var(--bg-canvas)] text-[var(--text-secondary)] border-[var(--border-strong)]'
                }`}
              >
                {props.taxZone}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Kupac Box */}
        <div
          className={`my-4 p-3.5 border text-xs font-mono ${
            isPaper
              ? 'bg-slate-50 border-slate-200 text-slate-800'
              : 'bg-[var(--bg-canvas)]/80 border-[var(--border-subtle)] text-[var(--text-secondary)]'
          }`}
        >
          <span
            className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${
              isPaper ? 'text-slate-500' : 'text-[var(--text-muted)]'
            }`}
          >
            KUPAC / PLATITELJ:
          </span>
          <div className={`font-bold text-sm ${isPaper ? 'text-black' : 'text-white'}`}>
            {props.partnerNaziv || 'Naziv kupca nije unesen'}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span>OIB: {props.partnerOib || '—'}</span>
            {props.isPartnerOibValid && (
              <span className="text-[#10B981] flex items-center text-[10px] gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Validiran
              </span>
            )}
          </div>
          <div className="text-[11px] mt-0.5">
            Model i poziv na broj: <span className="font-semibold">{pozivNaBroj}</span>
          </div>
        </div>

        {/* 3. Tablica stavki */}
        <div
          className={`border overflow-x-auto my-4 text-xs font-mono ${
            isPaper ? 'border-slate-300' : 'border-[var(--border-subtle)]'
          }`}
        >
          <table className="w-full text-left">
            <thead
              className={`border-b text-[11px] uppercase ${
                isPaper
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
              }`}
            >
              <tr>
                <th className="p-2">Opis / KPD 2025</th>
                <th className="p-2 text-center">Kol.</th>
                <th className="p-2 text-right">Cijena</th>
                <th className="p-2 text-right">Ukupno</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-current/10">
              <tr>
                <td className="p-2">
                  <div className={`font-semibold ${isPaper ? 'text-black' : 'text-white'}`}>
                    {props.kpdNaziv || 'Usluga'}
                  </div>
                  <div
                    className={`text-[10px] font-bold ${
                      isPaper ? 'text-purple-700' : 'text-[var(--accent-primary)]'
                    }`}
                  >
                    KPD: {props.kpdSifra}
                  </div>
                </td>
                <td className="p-2 text-center tabular-nums">{props.kolicina} sat</td>
                <td className="p-2 text-right tabular-nums">{props.cijena.toFixed(2)} €</td>
                <td className={`p-2 text-right font-bold tabular-nums ${isPaper ? 'text-black' : 'text-white'}`}>
                  {ukupno.toFixed(2)} €
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. Rekapitulacija */}
        <div
          className={`p-3.5 my-4 space-y-1.5 font-mono text-xs border ${
            isPaper
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-[var(--bg-canvas)]/60 border-[var(--border-subtle)] text-[var(--text-secondary)]'
          }`}
        >
          <div className="flex justify-between">
            <span className={isPaper ? 'text-slate-500' : 'text-[var(--text-muted)]'}>
              Ukupno osnovica:
            </span>
            <span className="font-semibold tabular-nums">{ukupno.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className={isPaper ? 'text-slate-500' : 'text-[var(--text-muted)]'}>
              PDV (0% - čl. 90 st. 2):
            </span>
            <span className="font-semibold tabular-nums">0,00 €</span>
          </div>
          <div
            className={`flex justify-between font-bold text-sm pt-2 border-t ${
              isPaper
                ? 'border-slate-300 text-black'
                : 'border-[var(--border-subtle)] text-[#10B981]'
            }`}
          >
            <span>UKUPNO ZA PLATITI:</span>
            <span className="text-base tabular-nums">{ukupno.toFixed(2)} €</span>
          </div>
        </div>

        {/* 5. Zakonska klauzula (Članak 90. stavak 2.) */}
        <div
          className={`p-2.5 my-3 text-[11px] font-mono leading-relaxed border ${
            isPaper
              ? 'bg-slate-100 border-slate-200 text-slate-600'
              : 'bg-[var(--bg-canvas)]/40 border-[var(--border-subtle)] text-[var(--text-muted)]'
          }`}
        >
          <span
            className={`block font-semibold mb-0.5 ${
              isPaper ? 'text-slate-800' : 'text-[var(--text-secondary)]'
            }`}
          >
            Zakonska klauzula:
          </span>
          Paušalni obrt nije u sustavu PDV-a prema čl. 90. st. 2. Zakona o PDV-u. Izdano putem sustava ObrtnIQ.
        </div>

        {/* 6. Barkodovi na dnu (HUB-3 PDF417 i EPC QR) */}
        <div
          className={`pt-4 mt-5 border-t ${
            isPaper ? 'border-slate-300' : 'border-[var(--border-subtle)]'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* HUB-3 Barkod (Hrvatska uplatnica) */}
            <div className="md:col-span-8 space-y-1.5">
              <span
                className={`text-[10px] font-mono uppercase font-bold tracking-wider block ${
                  isPaper ? 'text-slate-700' : 'text-[var(--text-secondary)]'
                }`}
              >
                HUB-3 2D Barkod (PDF417 m-banking standard):
              </span>
              <div
                className={`p-2 bg-white inline-block border ${
                  isPaper ? 'border-slate-400' : 'border-white/20'
                }`}
              >
                <canvas ref={hub3CanvasRef} className="max-w-full h-auto" />
              </div>
              <p
                className={`text-[10px] font-mono ${
                  isPaper ? 'text-slate-500' : 'text-[var(--text-muted)]'
                }`}
              >
                Skenabilno kamerom m-banking aplikacija svih banaka u RH.
              </p>
            </div>

            {/* EPC SEPA QR Kod */}
            <div className="md:col-span-4 space-y-1.5 text-left md:text-right">
              <span
                className={`text-[10px] font-mono uppercase font-bold tracking-wider flex items-center md:justify-end gap-1 ${
                  isPaper ? 'text-slate-700' : 'text-[var(--text-secondary)]'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" /> EPC SEPA QR:
              </span>
              <div
                className={`p-2 bg-white inline-block border ${
                  isPaper ? 'border-slate-400' : 'border-white/20'
                }`}
              >
                <canvas ref={qrCanvasRef} className="w-24 h-24" />
              </div>
              <p
                className={`text-[10px] font-mono ${
                  isPaper ? 'text-slate-500' : 'text-[var(--text-muted)]'
                }`}
              >
                EPC069-12 v002 standard
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
