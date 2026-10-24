import { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Cpu, 
  FileText, 
  CheckCircle2, 
  Layers,
  Sparkles,
  Smartphone,
  Monitor,
  Printer,
  Lock,
  Unlock
} from 'lucide-react';
import { 
  OibInput, 
  IbanInput, 
  CurrencyInput, 
  TaxZoneToggle, 
  KpdPicker 
} from './components/controls';
import type { 
  PoreznaZona, 
  VrstaDokumenta, 
  NacinPlacanja 
} from '@obrtniq/core';

export default function App() {
  const defaultDocType: VrstaDokumenta = 'RACUN';
  const defaultPayment: NacinPlacanja = 'TRANSAKCIJSKI_RACUN';

  // Responsive View Mode Toggle (Desktop vs Mobile 375px preview)
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

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
  const [partnerNaziv, setPartnerNaziv] = useState('Kupac Alpha d.o.o.');

  // Form validity check (Gate-check requirement: invalid OIB/IBAN blocks invoice generation)
  const isFormSubmittable = useMemo(() => {
    return isOibValid && isIbanValid && cijena > 0 && kpdSifra.length > 0;
  }, [isOibValid, isIbanValid, cijena, kpdSifra]);

  return (
    <div className="min-h-screen bg-[#0B0813] text-white flex flex-col font-sans">
      {/* Top Precision Header */}
      <header className="border-b border-[#261B3D] bg-[#140F24]/90 backdrop-blur px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center font-bold font-mono text-sm tracking-wider shadow-inner">
              IQ
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-[#C4B5FD] bg-clip-text text-transparent">
                ObrtnIQ
              </span>
              <span className="ml-2 text-[10px] font-mono uppercase bg-[#261B3D] text-[#C4B5FD] px-1.5 py-0.5 border border-[#433068]">
                v3.0 Sharp UI
              </span>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-[#261B3D]" />

          <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-[#C4B5FD]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>OPFS Offline Ready</span>
          </div>
        </div>

        {/* Paušalni Prag Widget */}
        <div className="flex items-center space-x-6">
          <div className="hidden lg:flex flex-col items-end text-right">
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-[#7C6DA0] uppercase tracking-wider font-mono">Paušalni Prag 2026:</span>
              <span className="font-mono font-bold text-[#10B981] tabular-nums">28.450,00 €</span>
              <span className="text-[#7C6DA0] font-mono">/ 40.000 € (71.1%)</span>
            </div>
            <div className="w-48 h-1.5 bg-[#1E1635] mt-1 overflow-hidden border border-[#261B3D]">
              <div className="h-full bg-gradient-to-r from-[#10B981] to-[#F59E0B]" style={{ width: '71.1%' }} />
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono block text-[#7C6DA0]">Status Sustava</span>
            <span className="text-xs font-mono text-[#10B981] font-semibold">Faza 3 Verificirana (Sharp UI)</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        {/* Hero Alert Banner */}
        <div className="border border-[#433068] bg-[#140F24] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981]" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-mono tracking-widest text-[#10B981] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Faza 3 Gate-Check Prošao
                </span>
                <span className="text-xs px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30 font-mono">
                  Sharp UI kontrole verificirane
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Specijalizirane HR/EU UI Kontrole &amp; Midnight Amethyst Tema
              </h1>
              <p className="text-sm text-[#C4B5FD] max-w-3xl">
                Izgrađen set oštrih kontrola visoke gustoće: <code className="text-[#A855F7] font-mono">OibInput</code> (ISO 7064), 
                <code className="text-[#A855F7] font-mono"> IbanInput</code> (MOD 97 + HNB bank lookup), 
                <code className="text-[#A855F7] font-mono"> CurrencyInput</code> (€ dual comma/dot), 
                <code className="text-[#A855F7] font-mono"> KpdPicker</code> (KPD 2025 baza) i 
                <code className="text-[#A855F7] font-mono"> TaxZoneToggle</code>.
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right font-mono text-xs text-[#7C6DA0]">
                <span>Aktivni tipovi:</span>
                <div className="text-white font-semibold">{defaultDocType} / {defaultPayment}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Grid Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-[#261B3D] bg-[#140F24] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#7C6DA0]">FAZA 0</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
                GOTOVO
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Cpu className="w-5 h-5 text-[#A855F7]" />
              <h3 className="font-semibold text-sm">Monorepo & Alati</h3>
            </div>
            <p className="text-xs text-[#7C6DA0] leading-relaxed">
              Vite, React 19, TypeScript strict mode, Vitest i Tailwind CSS konfigurirani.
            </p>
          </div>

          <div className="border border-[#261B3D] bg-[#140F24] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#7C6DA0]">FAZA 1</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
                GOTOVO
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-[#10B981]" />
              <h3 className="font-semibold text-sm text-white">Domena & Validacije</h3>
            </div>
            <p className="text-xs text-[#7C6DA0] leading-relaxed">
              ISO 7064 OIB, MOD 97 IBAN, HUB-3 barkod generator i financijski kalkulator.
            </p>
          </div>

          <div className="border border-[#261B3D] bg-[#140F24] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#7C6DA0]">FAZA 2</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
                GOTOVO
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-[#10B981]" />
              <h3 className="font-semibold text-sm text-white">Storage Adapter</h3>
            </div>
            <p className="text-xs text-[#7C6DA0] leading-relaxed">
              Dexie.js IndexedDB, sekvenca bez rupa, storno servis i AES-256 backup.
            </p>
          </div>

          <div className="border border-[#10B981]/40 bg-[#140F24] p-5 space-y-3 relative">
            <div className="absolute top-0 right-0 w-2 h-2 bg-[#10B981]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#C4B5FD]">FAZA 3</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
                GOTOVO
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Layers className="w-5 h-5 text-[#10B981]" />
              <h3 className="font-semibold text-sm text-white">Sharp UI Primitivi</h3>
            </div>
            <p className="text-xs text-[#C4B5FD] leading-relaxed">
              OibInput, IbanInput, CurrencyInput, KpdPicker i segmentirani TaxZoneToggle.
            </p>
          </div>
        </div>

        {/* Phase 3 Live Showroom & Editor Desk */}
        <div className="border border-[#433068] bg-[#140F24] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#261B3D] pb-4 gap-4">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-[#A855F7]" />
              <div>
                <h2 className="font-bold text-base">Faza 3: Interaktivni Showroom Kontrola i Responzivnost</h2>
                <p className="text-xs text-[#7C6DA0]">Isprobajte specijalizirane kontrole u desktopu ili simuliranom 375px mobilnom prikazu</p>
              </div>
            </div>

            {/* Desktop vs Mobile Toggle */}
            <div className="flex items-center space-x-2 bg-[#0B0813] p-1 border border-[#261B3D]">
              <button
                type="button"
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono transition-colors ${
                  viewMode === 'desktop' 
                    ? 'bg-[#7C3AED] text-white font-semibold' 
                    : 'text-[#7C6DA0] hover:text-[#C4B5FD]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Desktop (1440px)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono transition-colors ${
                  viewMode === 'mobile' 
                    ? 'bg-[#7C3AED] text-white font-semibold' 
                    : 'text-[#7C6DA0] hover:text-[#C4B5FD]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Mobitel (375px)
              </button>
            </div>
          </div>

          {/* Form & Preview Container */}
          <div className="flex justify-center">
            <div className={`transition-all duration-300 w-full ${
              viewMode === 'mobile' 
                ? 'max-w-[375px] border-2 border-[#A855F7] p-4 bg-[#0B0813] shadow-2xl' 
                : 'max-w-full'
            }`}>
              {viewMode === 'mobile' && (
                <div className="text-center font-mono text-[11px] text-[#A855F7] mb-4 pb-2 border-b border-[#261B3D]">
                  Simulirani zaslon pametnog telefona (375px širine)
                </div>
              )}

              <div className="space-y-6">
                {/* 1. Porezna Zona Toggle */}
                <TaxZoneToggle 
                  value={taxZone} 
                  onChange={setTaxZone} 
                />

                {/* 2. Partner podaci (OIB & Naziv) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-[#C4B5FD] font-semibold block mb-1.5">
                      Naziv Partnera / Kupca *
                    </label>
                    <input
                      type="text"
                      value={partnerNaziv}
                      onChange={(e) => setPartnerNaziv(e.target.value)}
                      placeholder="npr. Alpha d.o.o."
                      className="w-full bg-[#0B0813] text-white px-3.5 py-2.5 font-mono text-sm border border-[#433068] focus:border-[#A855F7] outline-none"
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
                      Povezana banka: <span className="font-semibold">{detectedBank}</span>
                    </div>
                  )}
                </div>

                {/* 4. Stavka računa (KPD Picker, Količina, Cijena) */}
                <div className="border border-[#261B3D] bg-[#1E1635]/50 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-[#C4B5FD] font-semibold block">
                      Stavka Dokumenta &amp; KPD 2025 Klasifikacija
                    </span>
                    {kpdNaziv && (
                      <span className="text-[10px] font-mono text-[#A855F7] truncate max-w-xs">
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
                      <label className="text-xs font-mono text-[#C4B5FD] font-semibold block mb-1.5">
                        Količina (sat / kom)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={kolicina}
                        onChange={(e) => setKolicina(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full bg-[#0B0813] text-white px-3.5 py-2.5 font-mono text-sm border border-[#433068] focus:border-[#A855F7] outline-none"
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

                {/* Action Bar & Gate-Check Submittable Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-[#261B3D] pt-4 gap-4">
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

                  <div className="flex items-center space-x-3">
                    <div className="text-right font-mono text-xs text-[#7C6DA0] hidden sm:block">
                      <span>Ukupno za naplatu:</span>
                      <div className="text-[#10B981] font-bold text-sm">{(kolicina * cijena).toFixed(2)} €</div>
                    </div>

                    <button
                      type="button"
                      disabled={!isFormSubmittable}
                      className={`px-5 py-2.5 font-mono text-xs font-bold transition-all rounded-none flex items-center gap-2
                        ${
                          isFormSubmittable
                            ? 'bg-[#10B981] text-black hover:bg-[#059669] cursor-pointer shadow-lg shadow-[#10B981]/20'
                            : 'bg-[#261B3D] text-[#7C6DA0] cursor-not-allowed border border-[#433068]'
                        }
                      `}
                    >
                      <Printer className="w-4 h-4" />
                      Fiskaliziraj / Izdaj (F2)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documentation & Manifest Reference */}
        <div className="border border-[#261B3D] bg-[#140F24] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#261B3D] pb-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-[#A855F7]" />
              <div>
                <h2 className="font-bold text-base">Implementacijski Dnevnik i Manifest</h2>
                <p className="text-xs text-[#7C6DA0]">Evidencija faza, odluka i Gate-Check kriterija</p>
              </div>
            </div>
            <span className="font-mono text-xs text-[#C4B5FD] bg-[#1E1635] px-3 py-1 border border-[#261B3D]">
              docs/manifest_i_dnevnik_implementacije.md
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-[#0B0813] p-4 border border-[#261B3D] space-y-2">
              <span className="text-[#7C6DA0] block">GLAVNI DOKUMENT</span>
              <span className="text-white font-semibold">docs/glavni_dizajn_dokument_i_plan_implementacije_obrtniq.md</span>
            </div>
            <div className="bg-[#0B0813] p-4 border border-[#261B3D] space-y-2">
              <span className="text-[#7C6DA0] block">UI KONTROLE</span>
              <span className="text-white font-semibold">apps/web/src/components/controls</span>
            </div>
            <div className="bg-[#0B0813] p-4 border border-[#261B3D] space-y-2">
              <span className="text-[#7C6DA0] block">GATE-CHECK STATUS</span>
              <span className="text-[#10B981] font-semibold">Faza 0, 1 i 2 verificirane &bull; Faza 3 aktivna</span>
            </div>
          </div>
        </div>
      </main>

      {/* Precision Footer */}
      <footer className="border-t border-[#261B3D] bg-[#140F24] px-6 py-3 text-xs font-mono text-[#7C6DA0] flex items-center justify-between">
        <div>ObrtnIQ &copy; 2026 &bull; Zakon o fiskalizaciji 1.0 (B2C) &amp; 2.0 (B2B EN 16931)</div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5 text-[#10B981]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Faza 3 Gate-Check Verified</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
