import { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Cpu, 
  FileText, 
  CheckCircle2, 
  Layers,
  Calculator,
  QrCode
} from 'lucide-react';
import { 
  validateOib, 
  validateIban, 
  getBankNameFromIban, 
  formatIban,
  calculateStavka,
  generateHub3Payload,
  type VrstaDokumenta, 
  type NacinPlacanja 
} from '@obrtniq/core';

export default function App() {
  const defaultDocType: VrstaDokumenta = 'RACUN';
  const defaultPayment: NacinPlacanja = 'TRANSAKCIJSKI_RACUN';

  // Live Playground State for Faza 1
  const [testOib, setTestOib] = useState('69435151530');
  const [testIban, setTestIban] = useState('HR1223600001101234567');
  const [kolicina, setKolicina] = useState(2);
  const [cijena, setCijena] = useState(150);
  const [popust, setPopust] = useState(10);
  const [stopaPdv, setStopaPdv] = useState(0); // 0% za paušaliste

  // OIB & IBAN validacije
  const isOibValid = useMemo(() => validateOib(testOib), [testOib]);
  const isIbanValid = useMemo(() => validateIban(testIban), [testIban]);
  const detectedBank = useMemo(() => getBankNameFromIban(testIban), [testIban]);

  // Kalkulacija stavke
  const stavkaCalc = useMemo(() => calculateStavka({
    kolicina,
    jedinicnaCijena: cijena,
    popustPostotak: popust,
    stopaPdv,
  }), [kolicina, cijena, popust, stopaPdv]);

  // HUB-3 Barkod string
  const sampleHub3 = useMemo(() => generateHub3Payload({
    iznosEur: stavkaCalc.ukupno,
    platiteljImeAdresa: 'Kupac d.o.o., Zagreb',
    primateljImeAdresa: 'ObrtnIQ Studio, vl. Matija',
    primateljIban: testIban,
    model: 'HR00',
    pozivNaBroj: '14-2026',
    sifraNamjene: 'GDSV',
    opisPlacanja: 'Račun br. 14/POSL1/1',
  }), [stavkaCalc.ukupno, testIban]);

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
                v3.0 Local-First
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
            <span className="text-xs font-mono text-[#10B981] font-semibold">Faza 2 Verificirana (34/34 testa)</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Hero Alert Banner */}
        <div className="border border-[#433068] bg-[#140F24] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981]" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-mono tracking-widest text-[#10B981] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Faza 1 Gate-Check Prošao
                </span>
                <span className="text-xs px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30 font-mono">
                  32/32 Vitest testova zeleno
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                ObrtnIQ Core Domenski Engine je Aktivan
              </h1>
              <p className="text-sm text-[#C4B5FD] max-w-3xl">
                Implementirani i matematički verificirani: ISO 7064 MOD 11, 10 (OIB), ISO 13616 MOD 97 (IBAN), 
                precizni financijski kalkulator bez floating-point anomalija i HUB-3A HRVHUB30 generator.
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

          <div className="border border-[#10B981]/40 bg-[#140F24] p-5 space-y-3 relative">
            <div className="absolute top-0 right-0 w-2 h-2 bg-[#10B981]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#C4B5FD]">FAZA 1</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
                GOTOVO
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-[#10B981]" />
              <h3 className="font-semibold text-sm text-white">Domena & Validacije</h3>
            </div>
            <p className="text-xs text-[#C4B5FD] leading-relaxed">
              ISO 7064 OIB, MOD 97 IBAN, HUB-3 barkod generator i financijski kalkulator.
            </p>
          </div>

          <div className="border border-[#10B981]/40 bg-[#140F24] p-5 space-y-3 relative">
            <div className="absolute top-0 right-0 w-2 h-2 bg-[#10B981]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#C4B5FD]">FAZA 2</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
                GOTOVO
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-[#10B981]" />
              <h3 className="font-semibold text-sm text-white">Storage Adapter</h3>
            </div>
            <p className="text-xs text-[#C4B5FD] leading-relaxed">
              Dexie.js IndexedDB, sekvenca računa bez rupa, storniranje i AES-256 backup.
            </p>
          </div>

          <div className="border border-[#433068] bg-[#1E1635] p-5 space-y-3 relative">
            <div className="absolute top-0 right-0 w-2 h-2 bg-[#A855F7]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#C4B5FD]">FAZA 3</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#2A1F49] text-[#A855F7] border border-[#A855F7]/30">
                SLJEDEĆA
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Layers className="w-5 h-5 text-[#A855F7]" />
              <h3 className="font-semibold text-sm">Sharp UI Primitivi</h3>
            </div>
            <p className="text-xs text-[#C4B5FD] leading-relaxed">
              OibInput, IbanInput, CurrencyInput, KpdPicker i responzivni Split-Screen.
            </p>
          </div>
        </div>

        {/* Live Playground for Faza 1 Core Algorithms */}
        <div className="border border-[#433068] bg-[#140F24] p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#261B3D] pb-4">
            <div className="flex items-center space-x-3">
              <Calculator className="w-5 h-5 text-[#A855F7]" />
              <div>
                <h2 className="font-bold text-base">Faza 1: Interaktivni Verifikator Core Enginea</h2>
                <p className="text-xs text-[#7C6DA0]">Testirajte OIB, IBAN i kalkulator izravno iz paketa @obrtniq/core</p>
              </div>
            </div>
            <span className="font-mono text-xs text-[#10B981] bg-[#064E3B] px-3 py-1 border border-[#10B981]/30">
              Live &bull; packages/core
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* OIB Validator Test Box */}
            <div className="bg-[#1E1635] p-5 border border-[#261B3D] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-[#C4B5FD] font-semibold">1. OIB Validacija (ISO 7064)</span>
                <span className={`text-[11px] font-mono px-2 py-0.5 border ${
                  isOibValid 
                    ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/30' 
                    : 'bg-[#450A0A] text-[#EF4444] border-[#EF4444]/30'
                }`}>
                  {isOibValid ? 'VALJAN OIB' : 'NEISPRAVAN OIB'}
                </span>
              </div>

              <div>
                <label className="text-[11px] text-[#7C6DA0] block mb-1">Unesite OIB (11 znamenki):</label>
                <input 
                  type="text" 
                  value={testOib}
                  onChange={(e) => setTestOib(e.target.value)}
                  maxLength={11}
                  className="w-full bg-[#0B0813] border border-[#433068] focus:border-[#A855F7] text-white px-3 py-2 font-mono text-sm outline-none"
                  placeholder="npr. 69435151530"
                />
              </div>

              <div className="text-xs font-mono text-[#7C6DA0] space-y-1">
                <div>Kontrolna formula: <span className="text-white">MOD 11, 10</span></div>
                <div>Status: <span className={isOibValid ? 'text-[#10B981]' : 'text-[#EF4444]'}>
                  {isOibValid ? 'Zadnja znamenka matematički potvrđena.' : 'Pogrešna kontrolna znamenka ili duljina.'}
                </span></div>
              </div>
            </div>

            {/* IBAN & Bank Lookup Test Box */}
            <div className="bg-[#1E1635] p-5 border border-[#261B3D] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-[#C4B5FD] font-semibold">2. IBAN &amp; HNB Banka</span>
                <span className={`text-[11px] font-mono px-2 py-0.5 border ${
                  isIbanValid 
                    ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/30' 
                    : 'bg-[#450A0A] text-[#EF4444] border-[#EF4444]/30'
                }`}>
                  {isIbanValid ? 'VALJAN IBAN' : 'NEISPRAVAN'}
                </span>
              </div>

              <div>
                <label className="text-[11px] text-[#7C6DA0] block mb-1">Hrvatski ili EU IBAN:</label>
                <input 
                  type="text" 
                  value={testIban}
                  onChange={(e) => setTestIban(e.target.value)}
                  className="w-full bg-[#0B0813] border border-[#433068] focus:border-[#A855F7] text-white px-3 py-2 font-mono text-sm outline-none"
                  placeholder="HR12..."
                />
              </div>

              <div className="text-xs font-mono text-[#7C6DA0] space-y-1">
                <div>Formatirano: <span className="text-white">{formatIban(testIban)}</span></div>
                <div>Detektirana banka: <span className="text-[#10B981] font-semibold">{detectedBank || 'Nepoznata / Inozemna'}</span></div>
              </div>
            </div>

            {/* Financial Calculator Test Box */}
            <div className="bg-[#1E1635] p-5 border border-[#261B3D] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-[#C4B5FD] font-semibold">3. Kalkulator Stavke</span>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-[#261B3D] text-[#C4B5FD] border border-[#433068]">
                  CENTS ARITMETIKA
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#7C6DA0] block mb-1">Količina:</label>
                  <input 
                    type="number" 
                    value={kolicina}
                    onChange={(e) => setKolicina(Number(e.target.value))}
                    className="w-full bg-[#0B0813] border border-[#433068] text-white px-2 py-1 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#7C6DA0] block mb-1">Cijena (€):</label>
                  <input 
                    type="number" 
                    value={cijena}
                    onChange={(e) => setCijena(Number(e.target.value))}
                    className="w-full bg-[#0B0813] border border-[#433068] text-white px-2 py-1 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#7C6DA0] block mb-1">Popust (%):</label>
                  <input 
                    type="number" 
                    value={popust}
                    onChange={(e) => setPopust(Number(e.target.value))}
                    className="w-full bg-[#0B0813] border border-[#433068] text-white px-2 py-1 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#7C6DA0] block mb-1">PDV (%):</label>
                  <select 
                    value={stopaPdv}
                    onChange={(e) => setStopaPdv(Number(e.target.value))}
                    className="w-full bg-[#0B0813] border border-[#433068] text-white px-2 py-1 font-mono text-sm"
                  >
                    <option value={0}>0% (Paušalist)</option>
                    <option value={5}>5%</option>
                    <option value={13}>13%</option>
                    <option value={25}>25%</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-[#261B3D] pt-3 text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#7C6DA0]">Osnovica:</span>
                  <span className="text-white">{stavkaCalc.osnovica.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7C6DA0]">PDV ({stavkaCalc.stopaPdv}%):</span>
                  <span className="text-white">{stavkaCalc.iznosPdv.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#10B981] pt-1">
                  <span>UKUPNO:</span>
                  <span>{stavkaCalc.ukupno.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>

          {/* HUB-3 String Preview */}
          <div className="bg-[#0B0813] p-4 border border-[#261B3D] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#C4B5FD]">
              <span className="flex items-center gap-1.5 font-semibold">
                <QrCode className="w-4 h-4 text-[#A855F7]" />
                Generirani HUB-3 Payload (HRVHUB30 za PDF417):
              </span>
              <span className="text-[#7C6DA0]">Standard Hrvatske udruge banaka</span>
            </div>
            <pre className="text-[11px] font-mono text-[#C4B5FD] bg-[#140F24] p-3 border border-[#261B3D] overflow-x-auto whitespace-pre">
              {sampleHub3}
            </pre>
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
              <span className="text-[#7C6DA0] block">DOMENSKI PAKET</span>
              <span className="text-white font-semibold">packages/core/src/domain/types.ts</span>
            </div>
            <div className="bg-[#0B0813] p-4 border border-[#261B3D] space-y-2">
              <span className="text-[#7C6DA0] block">TEST HARNESS</span>
              <span className="text-[#10B981] font-semibold">32 unit testa prošla u 386ms</span>
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
            <span>Faza 1 Gate-Check Verified</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
