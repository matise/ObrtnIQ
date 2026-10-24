import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  FileText, 
  CheckCircle2, 
  Layers,
  Printer,
  Lock,
  Unlock,
  Terminal,
  Plus,
  Trash2,
  FolderOpen,
  ArrowRightLeft,
  Ban,
  Smartphone,
  Monitor
} from 'lucide-react';
import { 
  OibInput, 
  IbanInput, 
  CurrencyInput, 
  TaxZoneToggle, 
  KpdPicker 
} from './components/controls';
import { ThemeSelector } from './components/ThemeSelector';
import { InvoiceLivePreview } from './components/InvoiceLivePreview';
import { SystemLogDrawer } from './components/SystemLogDrawer';
import { DocumentDrawer } from './components/DocumentDrawer';
import { useSystemLogs } from './hooks/useSystemLogs';
import { appLogger } from './services/logger';
import { dexieStorage } from './storage/dexie-db';
import { 
  izdajDokument, 
  pretvoriPonuduURacun, 
  stornirajDokument,
  formatHrvatskiIznos,
  type PoreznaZona, 
  type VrstaDokumenta, 
  type StatusDokumenta,
  type Dokument,
  type StavkaDokumenta 
} from '@obrtniq/core';

interface FormItem {
  id: string;
  kpdSifra: string;
  kpdNaziv: string;
  kolicina: number;
  jedinicaMjere: string;
  cijena: number;
}

export default function App() {
  // 1. Informacije o obrtu
  const obrtNaziv = 'Robot Hand Made, obrt za računalno programiranje';
  const obrtVlasnik = 'Matija Obrtović';
  const obrtOib = '69435151530';
  const obrtAdresa = 'Ulica grada Vukovara 284, Čakovec';

  // 2. Dokument State Machine & Linija života (Faza 5)
  const [docId, setDocId] = useState<string>(() => `draft-${Date.now()}`);
  const [docType, setDocType] = useState<VrstaDokumenta>('RACUN');
  const [docStatus, setDocStatus] = useState<StatusDokumenta>('NACRT');
  const [brojDokumenta, setBrojDokumenta] = useState<string>('NACRT');
  const [datumIzdavanja, setDatumIzdavanja] = useState<string>('24.10.2026.');
  const [datumDospijeca, setDatumDospijeca] = useState<string>('03.11.2026.');
  const [datumIsporuke, setDatumIsporuke] = useState<string>('24.10.2026.');
  const [nacinPlacanja, setNacinPlacanja] = useState<string>('Transakcijski račun');

  // 3. Partner podaci
  const [partnerNaziv, setPartnerNaziv] = useState('Domaći Kupac Čistoća i Održavanje d.o.o.');
  const [oib, setOib] = useState('69435151530');
  const [isOibValid, setIsOibValid] = useState(true);
  const [taxZone, setTaxZone] = useState<PoreznaZona>('DOMACI_B2B');

  // 4. Poslovni IBAN (Matematički valjan ZABA IBAN s MOD 97)
  const [iban, setIban] = useState('HR3123600001101234567');
  const [isIbanValid, setIsIbanValid] = useState(true);
  const [detectedBank, setDetectedBank] = useState<string | undefined>('Zagrebačka banka d.d.');

  // 5. Više stavaka dokumenta (Multi-item Invoice Support)
  const [items, setItems] = useState<FormItem[]>([
    {
      id: 'item-1',
      kpdSifra: '62.01.11',
      kpdNaziv: 'Usluge dizajna i razvoja aplikacijskog softvera',
      kolicina: 1,
      jedinicaMjere: 'sat',
      cijena: 1250.00,
    },
  ]);

  // 6. UI alati i ladice
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [isDocDrawerOpen, setIsDocDrawerOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'desk' | 'preview'>('desk');
  const [totalSavedDocs, setTotalSavedDocs] = useState(0);

  const { errorCount, warnCount } = useSystemLogs();

  // Immutability: ako je dokument IZDAN ili STORNIRAN, forma je trajno zaključana
  const isLocked = docStatus !== 'NACRT';

  // Osvježavanje brojača dokumenata u bazi
  const refreshDocCount = useCallback(async () => {
    try {
      const all = await dexieStorage.dokumenti.getAll();
      setTotalSavedDocs(all.length);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshDocCount();
    appLogger.scope('SYSTEM:BOOT').info('ObrtnIQ sustav uspješno pokrenut (Offline OPFS Ready, Logging Engine aktivan)', {
      vrijeme: new Date().toLocaleTimeString('hr-HR'),
      okruzenje: 'Lokalni preglednik',
    });
  }, [refreshDocCount]);

  // Kalkulacija ukupnog iznosa svih stavki
  const ukupniIznos = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.kolicina * it.cijena), 0);
  }, [items]);

  // Provjera valjanosti forme za izdavanje
  const isFormSubmittable = useMemo(() => {
    if (isLocked) return false;
    if (!partnerNaziv.trim()) return false;
    if (!isOibValid) return false;
    if (!isIbanValid) return false;
    if (items.length === 0) return false;
    return items.every((it) => it.kpdSifra.trim().length > 0 && it.kolicina > 0 && it.cijena >= 0);
  }, [isLocked, partnerNaziv, isOibValid, isIbanValid, items]);

  // 7. Akcije: Dodavanje i brisanje stavaka
  const handleAddItem = useCallback(() => {
    if (isLocked) return;
    const newItem: FormItem = {
      id: `item-${Date.now()}`,
      kpdSifra: '62.02.10',
      kpdNaziv: 'Usluge savjetovanja u vezi s računalnim softverom',
      kolicina: 1,
      jedinicaMjere: 'sat',
      cijena: 100.00,
    };
    setItems((prev) => [...prev, newItem]);
    appLogger.scope('INVOICE:ITEMS').info('Dodana nova stavka na radnu plohu (Alt+N)', {
      ukupnoStavaka: items.length + 1,
    });
  }, [isLocked, items.length]);

  const handleRemoveItem = (id: string) => {
    if (isLocked) return;
    if (items.length <= 1) {
      alert('Dokument mora sadržavati barem jednu stavku.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, partial: Partial<FormItem>) => {
    if (isLocked) return;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...partial } : it)));
  };

  // 8. Službeno izdavanje računa / fiskalizacija (F2)
  const handleIssueDocument = useCallback(async () => {
    if (!isFormSubmittable) return;

    try {
      const stavkeDokumenta: StavkaDokumenta[] = items.map((it, idx) => ({
        id: `${docId}-st-${idx + 1}`,
        dokumentId: docId,
        redniBroj: idx + 1,
        kpdSifra: it.kpdSifra,
        naziv: it.kpdNaziv || 'Usluga računalnog programiranja',
        jedinicaMjere: it.jedinicaMjere,
        kolicina: it.kolicina,
        jedinicnaCijena: it.cijena,
        popustPostotak: 0,
        iznosPopusta: 0,
        osnovica: it.kolicina * it.cijena,
        stopaPdv: 0,
        iznosPdv: 0,
        ukupno: it.kolicina * it.cijena,
      }));

      const draftDokument: Dokument = {
        id: docId,
        partnerId: 'partner-direct',
        partnerNazivSnapshot: partnerNaziv,
        partnerOibSnapshot: oib,
        partnerAdresaSnapshot: 'Hrvatska',
        vrstaDokumenta: docType,
        godina: 2026,
        brojSekvenca: 0,
        brojDokumenta: 'NACRT',
        poslovniProstorOznaka: 'POSL1',
        naplatniUredjajOznaka: '1',
        datumIzdavanja: '2026-10-24',
        vrijemeIzdavanja: new Date().toLocaleTimeString('hr-HR'),
        datumDospijeca: '2026-11-03',
        datumIsporuke: '2026-10-24',
        nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
        iban: iban.replace(/\s+/g, ''),
        pozivNaBroj: '',
        jeReverseCharge: false,
        zakonskaNapomena: 'Paušalni obrt, oslobođeno PDV-a po čl. 90. st. 2. Zakona o PDV-u.',
        status: 'NACRT',
        valuta: 'EUR',
        ukupnoOsnovica: ukupniIznos,
        ukupnoPdv: 0,
        ukupnoIznos: ukupniIznos,
        fiskalizacijaStatus: 'NIJE_POTREBNO',
        eracunStatus: 'NIJE_POTREBNO',
        stavke: stavkeDokumenta,
      };

      // Pohrani nacrt u Dexie bazu
      await dexieStorage.dokumenti.save(draftDokument);

      // Izvrši prijelaz stanja u IZDANO kroz Core Workflow Engine
      const izdani = await izdajDokument(dexieStorage.dokumenti, draftDokument, {
        obrtNaziv,
      });

      // Ažuriraj stanje sučelja
      setBrojDokumenta(izdani.brojDokumenta);
      setDocStatus('IZDANO');
      await refreshDocCount();

      appLogger.scope('INVOICE:ISSUE').info(`Račun ${izdani.brojDokumenta} uspješno izdan i trajno zaključan!`, {
        brojDokumenta: izdani.brojDokumenta,
        iznos: izdani.ukupnoIznos,
        stavaka: izdani.stavke.length,
      });
    } catch (err: any) {
      appLogger.scope('INVOICE:ERROR').error(`Izdavanje računa nije uspjelo: ${err?.message || String(err)}`, {
        error: err?.message,
      });
      alert(`Greška pri izdavanju: ${err?.message || 'Nepoznata greška'}`);
    }
  }, [
    isFormSubmittable,
    items,
    docId,
    partnerNaziv,
    oib,
    docType,
    iban,
    ukupniIznos,
    obrtNaziv,
    refreshDocCount,
  ]);

  // 9. Novi dokument (Reset forme na novi NACRT)
  const handleNewDocument = (vrsta: VrstaDokumenta = 'RACUN') => {
    const newId = `doc-${Date.now()}`;
    setDocId(newId);
    setDocType(vrsta);
    setDocStatus('NACRT');
    setBrojDokumenta('NACRT');
    setItems([
      {
        id: `item-${Date.now()}`,
        kpdSifra: '62.01.11',
        kpdNaziv: 'Usluge dizajna i razvoja aplikacijskog softvera',
        kolicina: 1,
        jedinicaMjere: 'sat',
        cijena: 1250.00,
      },
    ]);
    appLogger.scope('INVOICE:DRAFT').info(`Otvoren novi prazan nacrt (${vrsta})`, {
      docId: newId,
    });
  };

  // 10. Učitavanje postojećeg dokumenta iz Dexie baze
  const handleSelectDocument = (doc: Dokument) => {
    setDocId(doc.id);
    setDocType(doc.vrstaDokumenta);
    setDocStatus(doc.status);
    setBrojDokumenta(doc.brojDokumenta);
    setPartnerNaziv(doc.partnerNazivSnapshot);
    if (doc.partnerOibSnapshot) setOib(doc.partnerOibSnapshot);
    if (doc.iban) setIban(doc.iban);
    setDatumIzdavanja(doc.datumIzdavanja);
    setDatumDospijeca(doc.datumDospijeca);
    if (doc.datumIsporuke) setDatumIsporuke(doc.datumIsporuke);
    if (doc.nacinPlacanja) setNacinPlacanja(doc.nacinPlacanja);

    if (doc.stavke && doc.stavke.length > 0) {
      setItems(
        doc.stavke.map((s) => ({
          id: s.id,
          kpdSifra: s.kpdSifra,
          kpdNaziv: s.naziv,
          kolicina: s.kolicina,
          jedinicaMjere: s.jedinicaMjere || 'sat',
          cijena: s.jedinicnaCijena,
        }))
      );
    }

    appLogger.scope('INVOICE:LOAD').info(`Učitan dokument ${doc.brojDokumenta} (${doc.status})`, {
      docId: doc.id,
      brojDokumenta: doc.brojDokumenta,
    });
  };

  // 11. Storniranje izdanog računa
  const handleStorno = async () => {
    if (docStatus !== 'IZDANO') return;
    const confirmStorno = confirm(`Jeste li sigurni da želite stornirati račun ${brojDokumenta}? Stvorit će se novi storno račun u nizu.`);
    if (!confirmStorno) return;

    try {
      const stornoDoc = await stornirajDokument(dexieStorage.dokumenti, docId, {
        datumIzdavanja: new Date().toISOString().slice(0, 10),
        vrijemeIzdavanja: new Date().toLocaleTimeString('hr-HR'),
        razlogStorna: 'Korisnički storno računa',
      });

      handleSelectDocument(stornoDoc);
      await refreshDocCount();

      appLogger.scope('INVOICE:STORNO').warn(`Račun ${brojDokumenta} storniran. Izdan storno račun ${stornoDoc.brojDokumenta}`, {
        stornoBroj: stornoDoc.brojDokumenta,
        izvorniBroj: brojDokumenta,
      });
    } catch (err: any) {
      alert(`Greška pri storniranju: ${err?.message || 'Nepoznata greška'}`);
    }
  };

  // 12. Konverzija ponude u račun jednim klikom
  const handleConvertOffer = async () => {
    if (docType !== 'PONUDA') return;
    try {
      const noviRacun = await pretvoriPonuduURacun(dexieStorage.dokumenti, docId, {
        obrtNaziv,
        automatskiIzdaj: true,
      });
      handleSelectDocument(noviRacun);
      await refreshDocCount();

      appLogger.scope('INVOICE:CONVERT').info(`Ponuda ${brojDokumenta} uspješno pretvorena u račun ${noviRacun.brojDokumenta}`, {
        noviBroj: noviRacun.brojDokumenta,
      });
    } catch (err: any) {
      alert(`Greška pri konverziji: ${err?.message || 'Nepoznata greška'}`);
    }
  };

  // 13. Tipkovnički prečaci (F2 = Izdaj, Alt+N = Nova stavka)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Fiskaliziraj / Izdaj
      if (e.key === 'F2') {
        e.preventDefault();
        if (isFormSubmittable && !isLocked) {
          handleIssueDocument();
        }
      }
      // Alt+N: Nova stavka
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        if (!isLocked) {
          handleAddItem();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormSubmittable, isLocked, handleIssueDocument, handleAddItem]);

  // Mapiranje stavki za živi preglednik
  const previewItems = useMemo(() => {
    return items.map((it, idx) => ({
      id: it.id,
      redniBroj: idx + 1,
      kpdSifra: it.kpdSifra,
      naziv: it.kpdNaziv,
      kolicina: it.kolicina,
      jedinicaMjere: it.jedinicaMjere,
      jedinicnaCijena: it.cijena,
      ukupno: it.kolicina * it.cijena,
    }));
  }, [items]);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-white flex flex-col font-sans transition-colors duration-200">
      {/* Top Precision Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-50 no-print">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-primary-hover)] to-[var(--accent-primary)] flex items-center justify-center font-bold font-mono text-sm tracking-wider text-black shadow-inner">
              IQ
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">
                ObrtnIQ
              </span>
              <span className="ml-2 text-[10px] font-mono uppercase bg-[var(--bg-elevated)] text-[var(--text-secondary)] px-1.5 py-0.5 border border-[var(--border-strong)]">
                v3.0 Dynamic Theme
              </span>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-[var(--border-subtle)]" />

          {/* Gumb za evidenciju dokumenata */}
          <button
            type="button"
            onClick={() => setIsDocDrawerOpen(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-xs font-mono text-white border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-all cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Dokumenti</span>
            <span className="ml-1 text-[10px] bg-[var(--accent-primary)] text-black px-1.5 py-0.2 font-bold">
              {totalSavedDocs}
            </span>
          </button>
        </div>

        {/* Header Right Tools: Theme Selector + Prag Widget */}
        <div className="flex items-center space-x-4 sm:space-x-6">
          {/* Dynamic Theme Selector */}
          <ThemeSelector />

          <div className="hidden lg:flex flex-col items-end text-right">
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-[var(--text-muted)] uppercase tracking-wider font-mono">Paušalni Prag 2026:</span>
              <span className="font-mono font-bold text-[#10B981] tabular-nums">28.450,00 €</span>
              <span className="text-[var(--text-muted)] font-mono">/ 40.000 € (71.1%)</span>
            </div>
            <div className="w-44 h-1.5 bg-[var(--bg-elevated)] mt-1 overflow-hidden border border-[var(--border-subtle)]">
              <div className="h-full bg-gradient-to-r from-[#10B981] to-[#F59E0B]" style={{ width: '71.1%' }} />
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-mono block text-[var(--text-muted)]">Status Sustava</span>
            <span className="text-xs font-mono text-[#10B981] font-semibold">Faza 5 &bull; Invoice Workflow Engine</span>
          </div>
        </div>
      </header>

      {/* Main Content Area - Full Width Edge-to-Edge */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Alert Banner */}
        <div className="border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 relative overflow-hidden transition-colors no-print">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981]" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-mono tracking-widest text-[#10B981] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Faza 5 &bull; Poslovni Tijek &amp; Immutability
                </span>
                <span className="text-xs px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30 font-mono">
                  Radna Ploha 58/42 Split
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Ekran za Izdavanje Računa, Multi-Stavke &amp; Statusni Automat
              </h1>
              <p className="text-sm text-[var(--text-secondary)] max-w-3xl">
                Potpuni desktop i mobilni workflow: unos više stavaka uz prečac <code className="text-[var(--accent-primary)] font-mono">Alt+N</code>, 
                brzo izdavanje s tipkom <code className="text-[var(--accent-primary)] font-mono">F2</code>, 
                trajno zakonsko zaključavanje izdanih dokumenata (immutability), te storno niz bez rupa.
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right font-mono text-xs text-[var(--text-muted)]">
                <span>Aktivni status dokumenta:</span>
                <div className="text-white font-semibold flex items-center gap-1.5 justify-end">
                  {isLocked ? <Lock className="w-3.5 h-3.5 text-[#10B981]" /> : <Unlock className="w-3.5 h-3.5 text-[#F59E0B]" />}
                  <span>{docType} {brojDokumenta} [{docStatus}]</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Grid Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 no-print">
          <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-muted)]">FAZA 0-2</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
                GOTOVO
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Cpu className="w-5 h-5 text-[#10B981]" />
              <h3 className="font-semibold text-sm">Domena & Baza</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              OIB MOD 11, IBAN MOD 97, kalkulator, Dexie perzistencija i sekvenca bez rupa.
            </p>
          </div>

          <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-muted)]">FAZA 3</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
                GOTOVO
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Layers className="w-5 h-5 text-[#10B981]" />
              <h3 className="font-semibold text-sm text-white">Sharp UI & Teme</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              OibInput, IbanInput, CurrencyInput, KpdPicker, TaxZoneToggle i Hue teme.
            </p>
          </div>

          <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-muted)]">FAZA 4</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
                GOTOVO
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Printer className="w-5 h-5 text-[#10B981]" />
              <h3 className="font-semibold text-sm text-white">HUB-3 & PDF</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              HUB-3 PDF417, EPC QR, ISO 32000-1 validacija i klijentski A4 PDF generator.
            </p>
          </div>

          <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-muted)]">FAZA 4.5</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
                GOTOVO
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Terminal className="w-5 h-5 text-[#10B981]" />
              <h3 className="font-semibold text-sm text-white">Logging Engine</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Višerazinski Core Logger, RingBuffer (500), UI konzola i sanitizirani izvoz.
            </p>
          </div>

          <div className="border border-[#10B981]/40 bg-[var(--bg-surface)] p-5 space-y-3 relative transition-colors">
            <div className="absolute top-0 right-0 w-2 h-2 bg-[#10B981]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-secondary)]">FAZA 5</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30 font-bold">
                AKTIVNO
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-[#10B981]" />
              <h3 className="font-semibold text-sm text-white">Workflow & State</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Split 58/42 radna ploha, F2/Alt+N prečaci, immutability i storno sekvenca.
            </p>
          </div>
        </div>

        {/* Mobile View Tab Switcher (< xl screens) */}
        <div className="flex xl:hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-1 text-xs font-mono no-print">
          <button
            type="button"
            onClick={() => setMobileTab('desk')}
            className={`flex-1 py-2 flex items-center justify-center gap-2 transition-colors ${
              mobileTab === 'desk'
                ? 'bg-[var(--accent-primary)] text-black font-bold'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Radna Ploha Unosa
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-2 flex items-center justify-center gap-2 transition-colors ${
              mobileTab === 'preview'
                ? 'bg-[var(--accent-primary)] text-black font-bold'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Živi A4 Preglednik
          </button>
        </div>

        {/* Workspace: Full-Width Split-Screen Layout (58% Input Desk / 42% Live Invoice Preview) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start">
          {/* Left Panel: High-Density Input Desk (7 Cols / 58%) */}
          <div 
            className={`xl:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 space-y-6 transition-colors no-print ${
              mobileTab === 'preview' ? 'hidden xl:block' : 'block'
            }`}
          >
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
                    onClick={() => handleNewDocument('RACUN')}
                    className="px-3 py-1 bg-[var(--accent-primary)] text-black font-bold text-xs hover:bg-[var(--accent-primary-hover)] transition-all cursor-pointer"
                  >
                    Novi Račun
                  </button>
                  {docStatus === 'IZDANO' && docType === 'RACUN' && (
                    <button
                      type="button"
                      onClick={handleStorno}
                      className="px-3 py-1 bg-[#EF4444] text-white font-bold text-xs hover:bg-[#DC2626] transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Storniraj ovaj račun
                    </button>
                  )}
                  {docType === 'PONUDA' && (
                    <button
                      type="button"
                      onClick={handleConvertOffer}
                      className="px-3 py-1 bg-[#10B981] text-black font-bold text-xs hover:bg-[#059669] transition-all cursor-pointer flex items-center gap-1"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      Pretvori u Službeni Račun
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 1. Porezna Zona Toggle */}
            <fieldset disabled={isLocked} className={isLocked ? 'opacity-70 pointer-events-none' : ''}>
              <TaxZoneToggle value={taxZone} onChange={setTaxZone} />
            </fieldset>

            {/* 2. Partner podaci (OIB & Naziv) */}
            <fieldset disabled={isLocked} className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isLocked ? 'opacity-70 pointer-events-none' : ''}`}>
              <div>
                <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1.5">
                  Naziv Partnera / Kupca *
                </label>
                <input
                  type="text"
                  value={partnerNaziv}
                  disabled={isLocked}
                  onChange={(e) => setPartnerNaziv(e.target.value)}
                  placeholder="npr. Alpha Inženjering d.o.o."
                  className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none disabled:bg-[var(--bg-elevated)]"
                />
              </div>

              <OibInput
                value={oib}
                onChange={(val, valid) => {
                  setOib(val);
                  setIsOibValid(valid);
                }}
                required
              />
            </fieldset>

            {/* 3. Poslovni IBAN */}
            <fieldset disabled={isLocked} className={isLocked ? 'opacity-70 pointer-events-none' : ''}>
              <IbanInput
                value={iban}
                onChange={(val, valid, bank) => {
                  setIban(val);
                  setIsIbanValid(valid);
                  setDetectedBank(bank);
                }}
                required
              />
              {detectedBank && (
                <div className="mt-1 text-[11px] font-mono text-[#10B981]">
                  Povezana domaća banka: <span className="font-semibold">{detectedBank}</span>
                </div>
              )}
            </fieldset>

            {/* 4. Stavke računa (Multi-Item List Editor - Faza 5) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <span className="text-xs font-mono uppercase text-[var(--text-secondary)] font-semibold flex items-center gap-2">
                  <span>Stavke Dokumenta ({items.length})</span>
                  <span className="text-[10px] font-mono text-[var(--accent-primary)] font-normal">
                    Prečac: <kbd className="bg-[var(--bg-elevated)] px-1 py-0.5 border border-[var(--border-strong)]">Alt+N</kbd>
                  </span>
                </span>

                {!isLocked && (
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--accent-primary)] border border-[var(--border-strong)] font-mono text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Dodaj stavku (Alt+N)
                  </button>
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
                          onClick={() => handleRemoveItem(item.id)}
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
                        handleUpdateItem(item.id, { kpdSifra: sifra, kpdNaziv: naziv });
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
                            handleUpdateItem(item.id, {
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
                          onChange={(e) => handleUpdateItem(item.id, { jedinicaMjere: e.target.value })}
                          className="w-full bg-[var(--bg-canvas)] text-white px-3 py-2 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                        />
                      </div>

                      <CurrencyInput
                        label="Cijena (€)"
                        value={item.cijena}
                        onChange={(cijena) => handleUpdateItem(item.id, { cijena })}
                        required
                      />
                    </div>

                    <div className="text-right text-xs font-mono text-[var(--text-secondary)] pt-1 border-t border-[var(--border-subtle)]/40">
                      Ukupno stavka: <span className="font-bold text-white tabular-nums">{formatHrvatskiIznos(item.kolicina * item.cijena)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-[var(--border-subtle)] pt-4 gap-4">
              <div className="flex flex-col text-xs font-mono">
                <span className="text-[var(--text-muted)] uppercase text-[10px]">Ukupno za platiti:</span>
                <span className="text-xl font-bold font-mono text-[#10B981] tabular-nums">
                  {formatHrvatskiIznos(ukupniIznos)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {!isLocked ? (
                  <button
                    type="button"
                    onClick={handleIssueDocument}
                    disabled={!isFormSubmittable}
                    className={`px-6 py-2.5 font-mono text-xs font-bold transition-all rounded-none flex items-center gap-2
                      ${
                        isFormSubmittable
                          ? 'bg-[#10B981] text-black hover:bg-[#059669] cursor-pointer shadow-lg shadow-[#10B981]/20 active:scale-95'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-strong)]'
                      }
                    `}
                  >
                    <Printer className="w-4 h-4" />
                    Fiskaliziraj / Izdaj (F2)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleNewDocument('RACUN')}
                    className="px-6 py-2.5 font-mono text-xs font-bold bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-primary-hover)] transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Novi Račun
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Live A4 Real-Time Preview with HUB-3 Barcode & EPC QR (5 Cols / 42%) */}
          <div 
            className={`xl:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-strong)] p-5 space-y-4 sticky top-20 shadow-xl transition-colors ${
              mobileTab === 'desk' ? 'hidden xl:block' : 'block'
            }`}
          >
            <InvoiceLivePreview
              obrtNaziv={obrtNaziv}
              obrtVlasnik={obrtVlasnik}
              obrtOib={obrtOib}
              obrtIban={iban}
              obrtBanka={detectedBank}
              obrtAdresa={obrtAdresa}
              partnerNaziv={partnerNaziv}
              partnerOib={oib}
              isPartnerOibValid={isOibValid}
              vrstaDokumenta={docType}
              statusDokumenta={docStatus}
              brojDokumenta={brojDokumenta}
              datumIzdavanja={datumIzdavanja}
              datumIsporuke={datumIsporuke}
              datumDospijeca={datumDospijeca}
              nacinPlacanja={nacinPlacanja}
              taxZone={taxZone}
              items={previewItems}
            />
          </div>
        </div>

        {/* Documentation & Manifest Reference */}
        <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4 transition-colors no-print">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-[var(--accent-primary)]" />
              <div>
                <h2 className="font-bold text-base">Implementacijski Dnevnik i Manifest</h2>
                <p className="text-xs text-[var(--text-muted)]">Evidencija faza, odluka i Gate-Check kriterija</p>
              </div>
            </div>
            <span className="font-mono text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-3 py-1 border border-[var(--border-subtle)]">
              docs/manifest_i_dnevnik_implementacije.md
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-[var(--bg-canvas)] p-4 border border-[var(--border-subtle)] space-y-2">
              <span className="text-[var(--text-muted)] block">GLAVNI DOKUMENT</span>
              <span className="text-white font-semibold">docs/glavni_dizajn_dokument_i_plan_implementacije_obrtniq.md</span>
            </div>
            <div className="bg-[var(--bg-canvas)] p-4 border border-[var(--border-subtle)] space-y-2">
              <span className="text-[var(--text-muted)] block">GATE-CHECK FAZA 5</span>
              <span className="text-[#10B981] font-semibold">F2 Izdavanje &bull; Immutability Zaključavanje Prošlo</span>
            </div>
            <div className="bg-[var(--bg-canvas)] p-4 border border-[var(--border-subtle)] space-y-2">
              <span className="text-[var(--text-muted)] block">THEME ENGINE</span>
              <span className="text-[#10B981] font-semibold">100% UI pokriven dinamičkim HSL varijablama</span>
            </div>
          </div>
        </div>
      </main>

      {/* Precision Footer with Live System Log Trigger */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 sm:px-6 py-2.5 text-xs font-mono text-[var(--text-muted)] flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors no-print">
        <div className="flex items-center space-x-3">
          <span>ObrtnIQ &copy; 2026 &bull; Zakon o fiskalizaciji 1.0 &amp; 2.0</span>
          <span className="text-[var(--border-strong)]">|</span>
          {/* Status Widget Trigger */}
          <button
            type="button"
            onClick={() => setIsLogDrawerOpen((prev) => !prev)}
            title="Otvori / Zatvori Sustavni Dnevnik (Event & Error Console)"
            className={`flex items-center space-x-1.5 px-2 py-0.5 border text-[11px] transition-all cursor-pointer ${
              errorCount > 0
                ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444] animate-pulse font-bold'
                : warnCount > 0
                ? 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B] font-bold'
                : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[#10B981] hover:border-[var(--accent-primary)] hover:text-white'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                errorCount > 0 ? 'bg-[#EF4444]' : warnCount > 0 ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
              }`}
            />
            <span>
              {errorCount > 0
                ? `${errorCount} ${errorCount === 1 ? 'greška' : 'greške'}!`
                : warnCount > 0
                ? `${warnCount} ${warnCount === 1 ? 'upozorenje' : 'upozorenja'}`
                : 'Sustav stabilan'}
            </span>
            <Terminal className="w-3 h-3 ml-1 opacity-70" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5 text-[#10B981]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Faza 5 &bull; Invoice Workflow, State Machine &amp; Multi-Item Desk</span>
          </span>
        </div>
      </footer>

      {/* System Log Terminal Drawer */}
      <SystemLogDrawer
        isOpen={isLogDrawerOpen}
        onClose={() => setIsLogDrawerOpen(false)}
      />

      {/* Document History Drawer (Dexie.js IndexedDB) */}
      <DocumentDrawer
        isOpen={isDocDrawerOpen}
        onClose={() => setIsDocDrawerOpen(false)}
        activeDocumentId={docId}
        onSelectDocument={handleSelectDocument}
        onNewDocument={handleNewDocument}
      />
    </div>
  );
}
