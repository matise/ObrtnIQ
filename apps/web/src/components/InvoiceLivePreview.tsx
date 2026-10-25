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
  Sparkles,
  ShieldCheck,
  Share2,
  Mail,
  MessageSquare,
  Copy,
  Check
} from 'lucide-react';
import { renderHub3Barcode, renderQrCode } from '../utils/barcode';
import { generateInvoicePdf, generateInvoicePdfFromDom, type PdfGenerationResult } from '../utils/pdf-generator';
import { appLogger } from '../services/logger';
import {
  buildMailtoUrl,
  buildChatSummary,
  buildWhatsAppUrl,
  copyToClipboard,
} from '../services/invoice-dispatcher';
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


export interface InvoiceItemPreview {
  id: string;
  redniBroj?: number;
  kpdSifra: string;
  naziv: string;
  jedinicaMjere?: string;
  kolicina: number;
  jedinicnaCijena: number;
  popustPostotak?: number;
  ukupno: number;
}

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
  partnerEmail?: string;
  partnerTelefon?: string;

  vrstaDokumenta?: string; // 'RACUN' | 'PONUDA' | 'STORNO_RACUN'
  statusDokumenta?: string; // 'NACRT' | 'IZDANO' | 'STORNIRANO'
  brojDokumenta: string;
  datumIzdavanja: string;
  datumDospijeca: string;
  datumIsporuke: string;
  nacinPlacanja: string;
  taxZone: string;

  // Više stavaka dokumenta
  items?: InvoiceItemPreview[];

  // Fiskalizacija 1.0 polja
  zki?: string;
  jir?: string;
  fiskalniQrUrl?: string;
  fiskalizacijaStatus?: string;

  // Memorandum i brending (Faza 8)
  logoImageData?: string;
  pecatPotpisImageData?: string;

  // Fallback za pojedinačnu stavku (kompatibilnost)
  kpdSifra?: string;
  kpdNaziv?: string;
  kolicina?: number;
  cijena?: number;
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

  // Normalizirana lista stavaka
  const displayItems = useMemo(() => {
    if (props.items && props.items.length > 0) {
      return props.items;
    }
    return [
      {
        id: 'default-1',
        redniBroj: 1,
        kpdSifra: props.kpdSifra || '62.01.11',
        naziv: props.kpdNaziv || 'Računalno programiranje i razvoj softvera',
        jedinicaMjere: 'sat',
        kolicina: props.kolicina || 1,
        jedinicnaCijena: props.cijena || 0,
        popustPostotak: 0,
        ukupno: (props.kolicina || 1) * (props.cijena || 0),
      },
    ];
  }, [props.items, props.kpdSifra, props.kpdNaziv, props.kolicina, props.cijena]);

  const ukupno = useMemo(() => {
    return displayItems.reduce((acc, it) => acc + it.ukupno, 0);
  }, [displayItems]);

  const docTitle = props.vrstaDokumenta === 'PONUDA'
    ? 'Ponuda'
    : props.vrstaDokumenta === 'STORNO_RACUN'
    ? 'Storno račun'
    : 'Račun';

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

  // Renderiranje barkodova na Canvas (Fiskalni QR ili EPC SEPA QR)
  useEffect(() => {
    if (hub3CanvasRef.current && hub3Payload) {
      renderHub3Barcode(hub3CanvasRef.current, hub3Payload, {
        scale: 2,
        height: 8,
        columns: 9,
        eclevel: 4,
      }).catch((err) => console.warn('HUB-3 render:', err));
    }

    const qrData = props.fiskalniQrUrl || epcQrPayload;
    if (qrCanvasRef.current && qrData) {
      renderQrCode(qrCanvasRef.current, qrData, 140).catch((err) =>
        console.warn('QR render:', err)
      );
    }
  }, [hub3Payload, epcQrPayload, props.fiskalniQrUrl]);

  // 1. Nativni ispis putem browser print enginea (Ctrl+P / @media print)
  const handlePrint = () => {
    appLogger.scope('UI:PRINT').info('Korisnik pokrenuo nativni ispis računa (window.print / Ctrl+P)', {
      brojDokumenta: props.brojDokumenta,
    });
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
      } catch (domErr: any) {
        appLogger.scope('PDF:FLOW').warn('DOM PDF snimanje nije uspjelo, automatski prelazim na čisti vektorski generator', {
          error: domErr?.message || String(domErr),
        });
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
          vrstaDokumentaNaziv: docTitle.toUpperCase(),
          brojDokumenta: props.brojDokumenta,
          datumIzdavanja: props.datumIzdavanja,
          datumIsporuke: props.datumIsporuke,
          datumDospijeca: props.datumDospijeca,
          nacinPlacanjaNaziv: props.nacinPlacanja,
          pozivNaBroj: pozivNaBroj,
          stavke: displayItems.map((item, idx) => ({
            rbr: item.redniBroj || idx + 1,
            naziv: item.naziv,
            kpdSifra: item.kpdSifra,
            kolicina: item.kolicina,
            jedinicaMjere: item.jedinicaMjere || 'sat',
            jedinicnaCijena: item.jedinicnaCijena,
            popustPostotak: item.popustPostotak || 0,
            ukupno: item.ukupno,
          })),
          ukupnoOsnovica: ukupno,
          ukupnoPdv: 0,
          ukupnoIznos: ukupno,
          includeHub3Barcode: true,
          includeQrCode: true,
          logoImageData: props.logoImageData,
          pecatPotpisImageData: props.pecatPotpisImageData,
        });
      }

      setLastGenTime(result.durationMs);
      setPdfValidation(result.validation);

      appLogger.scope('UI:PREVIEW').info(`Račun ${props.brojDokumenta} uspješno spremljen u PDF formatu (${result.filename})`, {
        durationMs: result.durationMs,
        sizeBytes: result.validation.byteLength,
      });

      // Preuzimanje generiranog PDF-a
      result.doc.save(result.filename);
    } catch (err: any) {
      appLogger.scope('UI:PREVIEW').error('Kritična greška pri generiranju ili preuzimanju PDF-a', err);
      alert(`Greška pri generiranju PDF-a: ${err?.message || 'Nepoznata greška'}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const dispatchParams = useMemo(() => ({
    kupacEmail: props.partnerEmail,
    kupacNaziv: props.partnerNaziv,
    kupacTelefon: props.partnerTelefon,
    brojDokumenta: props.brojDokumenta,
    datumIzdavanja: props.datumIzdavanja,
    datumDospijeca: props.datumDospijeca,
    ukupniIznosEur: ukupno,
    iban: props.obrtIban,
    bankaNaziv: props.obrtBanka,
    obrtNaziv: props.obrtNaziv,
    vlasnikNaziv: props.obrtVlasnik,
    pozivNaBroj: pozivNaBroj,
  }), [props.partnerEmail, props.partnerNaziv, props.partnerTelefon, props.brojDokumenta, props.datumIzdavanja, props.datumDospijeca, props.obrtIban, props.obrtBanka, props.obrtNaziv, props.obrtVlasnik, ukupno, pozivNaBroj]);

  const handleSendEmail = () => {
    const url = buildMailtoUrl(dispatchParams);
    window.open(url, '_blank');
    setIsShareMenuOpen(false);
  };

  const handleShareWhatsApp = () => {
    const summary = buildChatSummary(dispatchParams);
    const url = buildWhatsAppUrl(summary, props.partnerTelefon);
    window.open(url, '_blank');
    setIsShareMenuOpen(false);
  };

  const handleCopyChatSummary = async () => {
    const summary = buildChatSummary(dispatchParams);
    await copyToClipboard(summary);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
    setIsShareMenuOpen(false);
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

          {/* Pošalji / Podijeli Račun */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
              title="Pošalji račun kupcu putem E-maila, WhatsAppa ili kopiraj sažetak"
              className="px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-white border border-[var(--border-strong)] font-mono font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pošalji / Podijeli</span>
            </button>

            {isShareMenuOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1.5 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={handleSendEmail}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center gap-2.5 transition"
                >
                  <Mail className="w-4 h-4 text-sky-400" />
                  <div>
                    <p className="font-semibold text-white">Pošalji E-mailom</p>
                    <p className="text-[10px] text-slate-400">Otvara pripremljeni mailto nacrt</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center gap-2.5 transition"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-white">WhatsApp / SMS</p>
                    <p className="text-[10px] text-slate-400">Brza poruka s IBAN-om i iznosom</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleCopyChatSummary}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center gap-2.5 transition border-t border-slate-800 mt-1"
                >
                  <Copy className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="font-semibold text-white">Kopiraj sažetak</p>
                    <p className="text-[10px] text-slate-400">Za chat s kupcem u međuspremnik</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {copiedToast && (
        <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs rounded-lg flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>✓ Sažetak računa s IBAN-om i pozivom na broj kopiran je u međuspremnik!</span>
        </div>
      )}


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
            <div className="flex items-start gap-3.5 max-w-sm flow-text">
              {props.logoImageData && (
                <div className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 p-1 border flex items-center justify-center overflow-hidden ${
                  isPaper ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <img
                    src={props.logoImageData}
                    alt="Logo obrta"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
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
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div
                className={`font-bold text-sm tracking-tight flex items-center gap-2 sm:justify-end ${
                  isPaper ? 'text-slate-900' : 'text-[var(--accent-primary)]'
                }`}
              >
                <span>{docTitle} br. {props.brojDokumenta}</span>
                {props.statusDokumenta && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 border uppercase ${
                      props.statusDokumenta === 'IZDANO'
                        ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/40'
                        : props.statusDokumenta === 'STORNIRANO'
                        ? 'bg-[#7F1D1D] text-[#EF4444] border-[#EF4444]/40'
                        : 'bg-[var(--bg-canvas)] text-[#F59E0B] border-[#F59E0B]/40'
                    }`}
                  >
                    {props.statusDokumenta === 'IZDANO'
                      ? 'IZDAN'
                      : props.statusDokumenta === 'STORNIRANO'
                      ? 'STORNIRAN'
                      : 'NACRT'}
                  </span>
                )}
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
                {displayItems.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="p-2.5 flow-text">
                      <div className={`font-semibold text-xs leading-relaxed ${isPaper ? 'text-black' : 'text-white'}`}>
                        {item.naziv || 'Usluga'}
                      </div>
                      <div
                        className={`text-[10px] font-bold mt-0.5 ${
                          isPaper ? 'text-purple-700' : 'text-[var(--accent-primary)]'
                        }`}
                      >
                        KPD: {item.kpdSifra}
                      </div>
                    </td>
                    <td className="p-2.5 text-center tabular-nums">{item.kolicina} {item.jedinicaMjere || 'sat'}</td>
                    <td className="p-2.5 text-right tabular-nums">{formatHrvatskiIznos(item.jedinicnaCijena, false)} €</td>
                    <td className={`p-2.5 text-right font-bold tabular-nums ${isPaper ? 'text-black' : 'text-white'}`}>
                      {formatHrvatskiIznos(item.ukupno)}
                    </td>
                  </tr>
                ))}
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

          {/* 5.1 Fiskalni blok (ZKI / JIR) - Prikazuje se na gotovinskim/kartičnim računima */}
          {props.zki && (
            <div
              className={`p-3 my-3 border text-xs font-mono space-y-1 page-break-avoid ${
                isPaper
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-[var(--bg-canvas)]/80 border-[#10B981]/40 text-[var(--text-secondary)]'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-1 mb-1 border-current/20">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[#10B981] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  FISKALIZIRANI RAČUN (ZAKON O FISKALIZACIJI RH)
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 border ${
                  props.jir
                    ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/40'
                    : 'bg-[#78350F] text-[#F59E0B] border-[#F59E0B]/40'
                }`}>
                  {props.jir ? 'JIR DODIJELJEN' : 'OFFLINE ZKI (ROK 48h)'}
                </span>
              </div>
              <div className="break-all text-[11px]">
                <span className="font-semibold text-[var(--text-muted)]">ZKI: </span>
                <span className={`select-all font-mono ${isPaper ? 'text-slate-800' : 'text-slate-300'}`}>{props.zki}</span>
              </div>
              {props.jir ? (
                <div className="break-all text-[11px]">
                  <span className="font-semibold text-[var(--text-muted)]">JIR: </span>
                  <span className="select-all font-mono text-[#10B981] font-bold">{props.jir}</span>
                </div>
              ) : (
                <div className="text-[10px] text-[#F59E0B]">
                  Račun je izdan u izvanmrežnom radu. Izdavatelj ima zakonski rok od 48 sati za dostavu računa u CIS Porezne uprave.
                </div>
              )}
            </div>
          )}

          {/* 5.5 Potpis i Digitalni Pečat Izdavatelja (Faza 8) */}
          <div className="flex justify-end pt-3 pb-1 text-xs font-mono page-break-avoid">
            <div className="text-center w-56 space-y-1">
              <div className="h-16 flex items-center justify-center relative">
                {props.pecatPotpisImageData ? (
                  <img
                    src={props.pecatPotpisImageData}
                    alt="Digitalni pečat i potpis"
                    className="max-h-16 max-w-full object-contain"
                  />
                ) : (
                  <div className="text-[10px] text-[var(--text-muted)] italic opacity-60">
                    (Dokument izdan elektroničkim putem)
                  </div>
                )}
              </div>
              <div
                className={`border-t pt-1 font-semibold text-[11px] ${
                  isPaper ? 'border-slate-800 text-slate-800' : 'border-white/40 text-slate-200'
                }`}
              >
                {props.obrtVlasnik}
              </div>
              <div className="text-[9px] text-[var(--text-muted)]">
                Račun izdao i potpisao
              </div>
            </div>
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
                  <QrCode className="w-3.5 h-3.5" /> {props.fiskalniQrUrl ? 'Porezna Uprava Fiskalni QR:' : 'EPC SEPA QR:'}
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
                  {props.fiskalniQrUrl ? 'Provjera računa na Porezna-Uprava.hr' : 'EPC069-12 v002 standard'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
