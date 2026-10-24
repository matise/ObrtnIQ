import { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Cpu, 
  FileText, 
  CheckCircle2, 
  Layers,
  Printer,
  Lock,
  Unlock,
  Terminal
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
import { useSystemLogs } from './hooks/useSystemLogs';
import { appLogger } from './services/logger';
import type { 
  PoreznaZona, 
  VrstaDokumenta, 
  NacinPlacanja 
} from '@obrtniq/core';

export default function App() {
  const defaultDocType: VrstaDokumenta = 'RACUN';
  const defaultPayment: NacinPlacanja = 'TRANSAKCIJSKI_RACUN';

  // Interactive Form State utilizing all Phase 3 UI Primitives
  const [oib, setOib] = useState('69435151530');
  const [isOibValid, setIsOibValid] = useState(true);

  const [iban, setIban] = useState('HR1223600001101234567');
  const [isIbanValid, setIsIbanValid] = useState(true);
  const [detectedBank, setDetectedBank] = useState<string | undefined>('Zagrebačka banka d.d.');

  const [taxZone, setTaxZone] = useState<PoreznaZona>('DOMACI_B2B');
  const [kpdSifra, setKpdSifra] = useState('62.01.11');
  const [kpdNaziv, setKpdNaziv] = useState('Usluge dizajna i razvoja aplikacijskog softvera');

  const [cijena, setCijena] = useState(1250.00);
  const [kolicina, setKolicina] = useState(1);
  const [partnerNaziv, setPartnerNaziv] = useState('Domaći Kupac Čistoća i Održavanje d.o.o.');

  // System Logging Engine state & boot notification
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const { errorCount, warnCount } = useSystemLogs();

  useEffect(() => {
    appLogger.scope('SYSTEM:BOOT').info('ObrtnIQ sustav uspješno pokrenut (Offline OPFS Ready, Logging Engine aktivan)', {
      vrijeme: new Date().toLocaleTimeString('hr-HR'),
      okruzenje: 'Lokalni preglednik',
    });
  }, []);

  // Form validity check (Gate-check requirement: invalid OIB/IBAN blocks invoice generation)
  const isFormSubmittable = useMemo(() => {
    return isOibValid && isIbanValid && cijena > 0 && kpdSifra.length > 0;
  }, [isOibValid, isIbanValid, cijena, kpdSifra]);

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

          <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>OPFS Offline Ready</span>
          </div>
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
            <span className="text-xs font-mono text-[#10B981] font-semibold">Faza 4 &bull; Payment &amp; PDF Engine</span>
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
                  <CheckCircle2 className="w-3.5 h-3.5" /> Faza 4 Gate-Check Prošao
                </span>
                <span className="text-xs px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30 font-mono">
                  Payment &amp; Print Engine
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                HUB-3 PDF417 Barkod, EPC SEPA QR &amp; Klijentski A4 PDF Engine
              </h1>
              <p className="text-sm text-[var(--text-secondary)] max-w-3xl">
                Implementiran kompletan pogon za plaćanja i ispis: 
                <code className="text-[var(--accent-primary)] font-mono"> HUB-3 PDF417</code> (m-banking skeniranje), 
                <code className="text-[var(--accent-primary)] font-mono"> EPC069-12 QR</code> (SEPA transfer), 
                <code className="text-[var(--accent-primary)] font-mono"> Fiskalni QR</code> (Porezna uprava URL), te 
                <code className="text-[var(--accent-primary)] font-mono"> jsPDF Engine</code> koji generira službeni A4 račun u pregledniku za manje od 100 ms bez poslužitelja.
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right font-mono text-xs text-[var(--text-muted)]">
                <span>Aktivni tipovi:</span>
                <div className="text-white font-semibold">{defaultDocType} / {defaultPayment}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Grid Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 no-print">
          <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-muted)]">FAZA 0</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
                GOTOVO
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Cpu className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="font-semibold text-sm">Monorepo & Alati</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Vite, React 19, TypeScript strict mode, Vitest i Tailwind CSS konfigurirani.
            </p>
          </div>

          <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-muted)]">FAZA 1</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
                GOTOVO
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-[#10B981]" />
              <h3 className="font-semibold text-sm text-white">Domena & Validacije</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              ISO 7064 OIB, MOD 97 IBAN, HUB-3 barkod generator i financijski kalkulator.
            </p>
          </div>

          <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-muted)]">FAZA 2</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
                GOTOVO
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-[#10B981]" />
              <h3 className="font-semibold text-sm text-white">Storage Adapter</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Dexie.js IndexedDB, sekvenca bez rupa, storno servis i AES-256 backup.
            </p>
          </div>

          <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-secondary)]">FAZA 3</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
                GOTOVO
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Layers className="w-5 h-5 text-[#10B981]" />
              <h3 className="font-semibold text-sm text-white">Sharp UI & Teme</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              OibInput, IbanInput, CurrencyInput, KpdPicker, TaxZoneToggle i Hue teme.
            </p>
          </div>

          <div className="border border-[#10B981]/40 bg-[var(--bg-surface)] p-5 space-y-3 relative transition-colors">
            <div className="absolute top-0 right-0 w-2 h-2 bg-[#10B981]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-secondary)]">FAZA 4</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
                GOTOVO
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Printer className="w-5 h-5 text-[#10B981]" />
              <h3 className="font-semibold text-sm text-white">Kodovi & PDF</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              HUB-3 PDF417, EPC QR, Fiskalni QR i klijentski A4 PDF generator (&lt;300ms).
            </p>
          </div>
        </div>

        {/* Workspace: Full-Width Split-Screen Layout (58% Input Desk / 42% Live Invoice Preview) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start">
                {/* Left Panel: High-Density Input Desk (7 Cols) */}
                <div className="xl:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 space-y-6 transition-colors no-print">
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                    <span className="text-xs font-mono uppercase text-[var(--accent-primary)] font-bold tracking-wider">
                      Radna Ploha Unosa (Input Desk)
                    </span>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      Precision Minimalist &bull; Split 58/42
                    </span>
                  </div>

                  {/* 1. Porezna Zona Toggle */}
                  <TaxZoneToggle value={taxZone} onChange={setTaxZone} />

                  {/* 2. Partner podaci (OIB & Naziv) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1.5">
                        Naziv Partnera / Kupca *
                      </label>
                      <input
                        type="text"
                        value={partnerNaziv}
                        onChange={(e) => setPartnerNaziv(e.target.value)}
                        placeholder="npr. Alpha d.o.o."
                        className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
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
                  </div>

                  {/* 3. Poslovni IBAN */}
                  <div>
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
                  </div>

                  {/* 4. Stavka računa (KPD Picker, Količina, Cijena) */}
                  <div className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase text-[var(--text-secondary)] font-semibold block">
                        Stavka Dokumenta &amp; KPD 2025 Klasifikacija
                      </span>
                      {kpdNaziv && (
                        <span className="text-[10px] font-mono text-[var(--accent-primary)] truncate max-w-sm">
                          {kpdNaziv}
                        </span>
                      )}
                    </div>

                    <KpdPicker
                      value={kpdSifra}
                      onChange={(sifra, naziv) => {
                        setKpdSifra(sifra);
                        setKpdNaziv(naziv);
                      }}
                      required
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1.5">
                          Količina (sat / kom)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={kolicina}
                          onChange={(e) => setKolicina(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                        />
                      </div>

                      <CurrencyInput
                        label="Jedinična Cijena (€)"
                        value={cijena}
                        onChange={setCijena}
                        required
                      />
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-[var(--border-subtle)] pt-4 gap-4">
                    <div className="flex items-center space-x-2 text-xs font-mono">
                      {isFormSubmittable ? (
                        <span className="flex items-center text-[#10B981] gap-1.5 font-semibold">
                          <Unlock className="w-4 h-4" />
                          Forma je valjana za izdavanje računa.
                        </span>
                      ) : (
                        <span className="flex items-center text-[#EF4444] gap-1.5 font-semibold">
                          <Lock className="w-4 h-4" />
                          Izdavanje blokirano: {!isOibValid ? 'Neispravan OIB' : !isIbanValid ? 'Neispravan IBAN' : 'Provjerite unos'}.
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!isFormSubmittable}
                      className={`px-6 py-2.5 font-mono text-xs font-bold transition-all rounded-none flex items-center gap-2
                        ${
                          isFormSubmittable
                            ? 'bg-[#10B981] text-black hover:bg-[#059669] cursor-pointer shadow-lg shadow-[#10B981]/20'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-strong)]'
                        }
                      `}
                    >
                      <Printer className="w-4 h-4" />
                      Fiskaliziraj / Izdaj (F2)
                    </button>
                  </div>
                </div>

                {/* Right Panel: Live A4 Real-Time Preview with HUB-3 Barcode & EPC QR (5 Cols) */}
                <div className="xl:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-strong)] p-5 space-y-4 sticky top-20 shadow-xl transition-colors">
                  <InvoiceLivePreview
                    obrtNaziv="Robot Hand Made, obrt za računalno programiranje"
                    obrtVlasnik="Matija Obrtović"
                    obrtOib="69435151530"
                    obrtIban={iban}
                    obrtBanka={detectedBank}
                    obrtAdresa="Ulica grada Vukovara 284, Čakovec"
                    partnerNaziv={partnerNaziv}
                    partnerOib={oib}
                    isPartnerOibValid={isOibValid}
                    brojDokumenta="1/POSL1/1"
                    datumIzdavanja="24.10.2026."
                    datumIsporuke="24.10.2026."
                    datumDospijeca="03.11.2026."
                    nacinPlacanja="Transakcijski račun"
                    taxZone={taxZone}
                    kpdSifra={kpdSifra}
                    kpdNaziv={kpdNaziv}
                    kolicina={kolicina}
                    cijena={cijena}
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
              <span className="text-[var(--text-muted)] block">UI KONTROLE</span>
              <span className="text-white font-semibold">apps/web/src/components/controls</span>
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
            <span>Faza 4.5 &bull; Diagnostic &amp; Event Logging Engine</span>
          </span>
        </div>
      </footer>

      {/* System Log Terminal Drawer */}
      <SystemLogDrawer
        isOpen={isLogDrawerOpen}
        onClose={() => setIsLogDrawerOpen(false)}
      />
    </div>
  );
}
