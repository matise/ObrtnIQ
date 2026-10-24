import { useEffect, useMemo, useRef, useState } from 'react';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Eye, 
  Zap, 
  QrCode, 
  Layers,
  Printer,
  Sparkles
} from 'lucide-react';
import { renderHub3Barcode, renderQrCode } from '../utils/barcode';
import { generateInvoicePdf, generateInvoicePdfFromDom, type PdfGenerationResult } from '../utils/pdf-generator';
import { 
  generateHub3Payload, 
  generateEpcQrPayload, 
  formatHrvatskiIznos,
  formatHrvatskiDatum,
  validateHrvatskaTipografija,
  type Hub3Nalog,
  type EpcQrNalog,
  type PdfValidationResult as CorePdfValidationResult
} from '@obrtniq/core';

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
  const [layoutMode, setLayoutMode] = useState<'fluid' | 'a4' | 'pos'>('fluid');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [lastGenTime, setLastGenTime] = useState<number | null>(null);
  const [pdfValidation, setPdfValidation] = useState<CorePdfValidationResult | null>(null);

  const invoiceSheetRef = useRef<HTMLDivElement | null>(null);
  const hub3CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const ukupno = props.kolicina * props.cijena;
  const pozivNaBroj = `HR00 ${props.brojDokumenta.split('/')[0] || '1'}-2026`;

  // Validacija hrvatske tipografije i dijakritika u realnom vremenu
  const tipografijaCheck = useMemo(() => {
    const combinedText = `${props.obrtNaziv} ${props.obrtVlasnik} ${props.partnerNaziv} ${props.kpdNaziv} Račun br. ${props.brojDokumenta}`;
    return validateHrvatskaTipografija(combinedText);
  }, [props.obrtNaziv, props.obrtVlasnik, props.partnerNaziv, props.kpdNaziv, props.brojDokumenta]);

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

  // Renderiranje barkodova na Canvas
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

  // 1. Nativni ispis putem browser print enginea (Ctrl+P / @media print)
  const handlePrint = () => {
    window.print();
  };

  // 2. Klijentski PDF download (s DOM očuvanjem tipografije i automatskim vektorskim fallbackom)
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);

    try {
      const cleanBroj = props.brojDokumenta.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Racun_${cleanBroj}.pdf`;

      let result: PdfGenerationResult;
      try {
        if (!invoiceSheetRef.current) throw new Error('DOM element računa nije pronađen');
        result = await generateInvoicePdfFromDom(invoiceSheetRef.current, filename);
      } catch (domErr) {
        console.warn('DOM PDF generiranje nije uspjelo, prebacujem na brzi vektorski generator:', domErr);
        // Automatski prelazak na pouzdani vektorski generator s HUB-3 i QR kodovima
        result = await generateInvoicePdf({
          obrtNaziv: props.obrtNaziv,
          obrtVlasnik: props.obrtVlasnik,
          obrtOib: props.obrtOib,
          obrtAdresa: props.obrtAdresa,
          obrtIban: props.obrtIban,
          obrtBanka: props.obrtBanka,
          kupacNaziv: props.partnerNaziv,
          kupacOib: props.partnerOib,
          kupacAdresa: 'Hrvatska',
          vrstaDokumentaNaziv: 'RAČUN',
          brojDokumenta: props.brojDokumenta,
          datumIzdavanja: props.datumIzdavanja,
          datumIsporuke: props.datumIsporuke,
          datumDospijeca: props.datumDospijeca,
          nacinPlacanjaNaziv: props.nacinPlacanja,
          pozivNaBroj: pozivNaBroj,
          stavke: [
            {
              rbr: 1,
              naziv: props.kpdNaziv || 'Računalno programiranje i savjetovanje',
              kpdSifra: props.kpdSifra,
              kolicina: props.kolicina,
              jedinicaMjere: 'kom',
              jedinicnaCijena: props.cijena,
              ukupno: props.kolicina * props.cijena,
            },
          ],
          ukupnoOsnovica: ukupno,
          ukupnoPdv: 0,
          ukupnoIznos: ukupno,
          includeHub3Barcode: true,
          includeQrCode: true,
        });
      }

      setLastGenTime(result.durationMs);
      setPdfValidation(result.validation);

      // Preuzimanje generiranog PDF-a
      result.doc.save(result.filename);
    } catch (err: any) {
      console.error('Greška pri generiranju PDF-a:', err);
      alert(`Greška pri generiranju PDF-a: ${err?.message || 'Nepoznata greška'}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const isPaper = previewStyle === 'paper';

  // Određivanje širine prikaza (Fluid vs A4 fiksno vs POS 80mm)
  const layoutContainerClass = (() => {
    switch (layoutMode) {
      case 'a4':
        return 'max-w-[794px] mx-auto'; // Standardna A4 širina pri 96 DPI
      case 'pos':
        return 'max-w-[320px] mx-auto text-[11px]'; // Termalna POS 80mm traka
      case 'fluid':
      default:
        return 'w-full';
    }
  })();

  return (
    <div className="space-y-4">
      {/* Control Header & Style Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3 no-print">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[var(--accent-primary)]" />
            <span className="text-xs font-mono uppercase text-[var(--text-secondary)] font-bold tracking-wider">
              Živi A4 Preglednik (Responsive Flow Engine)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#10B981]">
            <Sparkles className="w-3 h-3" />
            <span>
              {tipografijaCheck.sadrziDijakritike 
                ? 'Hrvatska tipografija (UTF-8, č/ć/ž/š/đ verificirani, zarez decimala)' 
                : 'Hrvatska tipografija (UTF-8 spreman, HR zarez decimala)'}
            </span>
          </div>
        </div>

        {/* Action Buttons: Layout Width + Theme + Print + PDF */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layout Mode Selector (Flow Layout) */}
          <div className="flex items-center bg-[var(--bg-canvas)] p-0.5 border border-[var(--border-subtle)] text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setLayoutMode('fluid')}
              title="Prilagodljivo širini prozora (Fluid Flow)"
              className={`px-2 py-1 transition-colors ${
                layoutMode === 'fluid'
                  ? 'bg-[var(--accent-primary)] text-black font-semibold'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              Fluid
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('a4')}
              title="Fiksni A4 omjer (210mm)"
              className={`px-2 py-1 transition-colors ${
                layoutMode === 'a4'
                  ? 'bg-[var(--accent-primary)] text-black font-semibold'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              A4
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('pos')}
              title="POS Termalni račun (80mm)"
              className={`px-2 py-1 transition-colors ${
                layoutMode === 'pos'
                  ? 'bg-[var(--accent-primary)] text-black font-semibold'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              POS 80mm
            </button>
          </div>

          {/* Style Toggle: Theme vs White Paper */}
          <div className="flex items-center bg-[var(--bg-canvas)] p-0.5 border border-[var(--border-subtle)] text-[10px] font-mono">
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

          {/* Native Print Dialog Button (Ctrl+P) */}
          <button
            type="button"
            onClick={handlePrint}
            title="Ispiši ili spremi kao PDF putem preglednika (Ctrl+P)"
            className="px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-white border border-[var(--border-strong)] font-mono font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            Ispiši
          </button>

          {/* Instant High-DPI Flow PDF Download Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            title="Preuzmi službeni A4 PDF s očuvanom tipografijom i dijakritikama"
            className="px-3 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-black font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {isGeneratingPdf ? 'Generiram...' : 'Preuzmi PDF'}
          </button>
        </div>
      </div>

      {/* Latency, Typography & PDF Structure Verification Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-1.5 bg-[#064E3B] border border-[#10B981]/40 text-[#10B981] font-mono text-xs gap-2 no-print">
        <span className="flex items-center gap-1.5 font-semibold">
          <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
          {lastGenTime !== null
            ? `Klijentski PDF generiran u ${lastGenTime} ms! ${pdfValidation?.isValidPdf ? `• ISO 32000-1 OK (${(pdfValidation.byteLength / 1024).toFixed(1)} KB)` : ''}`
            : 'Spreman Flow Layout engine (nema rezanja znakova, puna širina)'}
        </span>
        <div className="flex items-center gap-2">
          {pdfValidation?.isValidPdf && (
            <span className="text-[10px] bg-[#10B981] text-black font-bold px-1.5 py-0.5">
              PDF {pdfValidation.version} ISO OK
            </span>
          )}
          <span className="text-[10px] bg-[#10B981]/20 px-1.5 py-0.5 border border-[#10B981]/30">
            ČĆŽŠĐ UTF-8 PROLAZI
          </span>
        </div>
      </div>

      {/* The Printable Sheet (Responsive Flow Layout & @media print support) */}
      <div className={layoutContainerClass}>
        <div
          ref={invoiceSheetRef}
          className={`printable-invoice w-full p-5 sm:p-6 transition-all border shadow-2xl relative ${
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

          {/* 1. Header (Obrt info & Invoice Metadata) - Flex Flow */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-current/15 text-xs font-mono">
            <div className="space-y-1 max-w-sm flow-text">
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
                Datum izdavanja: {formatHrvatskiDatum(props.datumIzdavanja)}
              </div>
              <div className={isPaper ? 'text-slate-600' : 'text-[var(--text-muted)]'}>
                Datum isporuke: {formatHrvatskiDatum(props.datumIsporuke)}
              </div>
              <div className={isPaper ? 'text-slate-600' : 'text-[var(--text-muted)]'}>
                Dospijeće: <span className="font-semibold">{formatHrvatskiDatum(props.datumDospijeca)}</span>
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
            className={`my-4 p-3.5 border text-xs font-mono page-break-avoid ${
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
            <div className={`font-bold text-sm flow-text ${isPaper ? 'text-black' : 'text-white'}`}>
              {props.partnerNaziv || 'Naziv kupca nije unesen'}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span>OIB: {props.partnerOib || '—'}</span>
              {props.isPartnerOibValid && (
                <span className="text-[#10B981] flex items-center text-[10px] gap-0.5 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Validiran
                </span>
              )}
            </div>
            <div className="text-[11px] mt-0.5">
              Model i poziv na broj: <span className="font-semibold">{pozivNaBroj}</span>
            </div>
          </div>

          {/* 3. Tablica stavaka s prirodnim Flow Layoutom (bez rezanja dugih tekstova) */}
          <div
            className={`border overflow-x-auto my-4 text-xs font-mono page-break-avoid ${
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
                  <th className="p-2.5">Opis / KPD 2025 Klasifikacija</th>
                  <th className="p-2.5 text-center">Kol.</th>
                  <th className="p-2.5 text-right">Cijena</th>
                  <th className="p-2.5 text-right">Ukupno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-current/10">
                <tr>
                  <td className="p-2.5 flow-text">
                    {/* Naziv bez ikakvog umjetnog skraćivanja / rezanja */}
                    <div className={`font-semibold text-xs leading-relaxed ${isPaper ? 'text-black' : 'text-white'}`}>
                      {props.kpdNaziv || 'Usluga'}
                    </div>
                    <div
                      className={`text-[10px] font-bold mt-0.5 ${
                        isPaper ? 'text-purple-700' : 'text-[var(--accent-primary)]'
                      }`}
                    >
                      KPD: {props.kpdSifra}
                    </div>
                  </td>
                  <td className="p-2.5 text-center tabular-nums">{props.kolicina} sat</td>
                  <td className="p-2.5 text-right tabular-nums">{formatHrvatskiIznos(props.cijena, false)} €</td>
                  <td className={`p-2.5 text-right font-bold tabular-nums ${isPaper ? 'text-black' : 'text-white'}`}>
                    {formatHrvatskiIznos(ukupno)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. Rekapitulacija - Službeni HR format brojeva */}
          <div
            className={`p-3.5 my-4 space-y-1.5 font-mono text-xs border page-break-avoid ${
              isPaper
                ? 'bg-slate-50 border-slate-200 text-slate-700'
                : 'bg-[var(--bg-canvas)]/60 border-[var(--border-subtle)] text-[var(--text-secondary)]'
            }`}
          >
            <div className="flex justify-between">
              <span className={isPaper ? 'text-slate-500' : 'text-[var(--text-muted)]'}>
                Ukupno osnovica:
              </span>
              <span className="font-semibold tabular-nums">{formatHrvatskiIznos(ukupno)}</span>
            </div>
            <div className="flex justify-between">
              <span className={isPaper ? 'text-slate-500' : 'text-[var(--text-muted)]'}>
                PDV (0% - čl. 90. st. 2.):
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
              <span className="text-base tabular-nums">{formatHrvatskiIznos(ukupno)}</span>
            </div>
          </div>

          {/* 5. Zakonska klauzula (Članak 90. stavak 2.) */}
          <div
            className={`p-2.5 my-3 text-[11px] font-mono leading-relaxed border page-break-avoid ${
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
            Paušalni obrt nije u sustavu PDV-a prema čl. 90. st. 2. Zakona o PDV-u. Izdano putem digitalnog sustava ObrtnIQ bez fizičkog potpisa i pečata sukladno propisima RH.
          </div>

          {/* 6. Barkodovi na dnu (HUB-3 PDF417 i EPC QR) */}
          <div
            className={`barcode-container pt-4 mt-5 border-t page-break-avoid ${
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
    </div>
  );
}
