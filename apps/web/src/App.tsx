import { 
  ShieldCheck, 
  Database, 
  Cpu, 
  FileText, 
  CheckCircle2, 
  Layers
} from 'lucide-react';
import type { VrstaDokumenta, NacinPlacanja } from '@obrtniq/core';

export default function App() {
  const defaultDocType: VrstaDokumenta = 'RACUN';
  const defaultPayment: NacinPlacanja = 'TRANSAKCIJSKI_RACUN';

  return (
    <div className="min-h-screen bg-[#0B0813] text-white flex flex-col">
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
            <span className="text-xs font-mono text-[#C4B5FD] font-semibold">Faza 0 (Setup) Aktivna</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Hero Alert Banner */}
        <div className="border border-[#433068] bg-[#140F24] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#7C3AED]" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-mono tracking-widest text-[#A855F7] font-semibold">
                  Sustav Inicijaliziran
                </span>
                <span className="text-xs px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30 font-mono">
                  Radni prostor spreman
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                ObrtnIQ Monorepo & Faza 0 Uspješno Konfigurirani
              </h1>
              <p className="text-sm text-[#C4B5FD] max-w-3xl">
                Arhitektura poštuje local-first inženjerske principe: nula serverskih troškova, 
                potpuna izolacija domene (<code className="text-[#A855F7] font-mono">@obrtniq/core</code>) 
                i striktni Sharp Minimalist dizajn.
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

          <div className="border border-[#433068] bg-[#1E1635] p-5 space-y-3 relative">
            <div className="absolute top-0 right-0 w-2 h-2 bg-[#A855F7]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#C4B5FD]">FAZA 1</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#2A1F49] text-[#A855F7] border border-[#A855F7]/30">
                SLJEDEĆA
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

          <div className="border border-[#261B3D] bg-[#140F24] p-5 space-y-3 opacity-70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#7C6DA0]">FAZA 2</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#1E1635] text-[#7C6DA0] border border-[#261B3D]">
                NA ČEKANJU
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-[#7C6DA0]" />
              <h3 className="font-semibold text-sm">Storage Adapter</h3>
            </div>
            <p className="text-xs text-[#7C6DA0] leading-relaxed">
              Dexie.js / SQLite Wasm OPFS repozitorij, automatska sekvenca računa i backup.
            </p>
          </div>

          <div className="border border-[#261B3D] bg-[#140F24] p-5 space-y-3 opacity-70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#7C6DA0]">FAZA 3-7</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#1E1635] text-[#7C6DA0] border border-[#261B3D]">
                NA ČEKANJU
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Layers className="w-5 h-5 text-[#7C6DA0]" />
              <h3 className="font-semibold text-sm">UI, PDF, KPR & Fiskal</h3>
            </div>
            <p className="text-xs text-[#7C6DA0] leading-relaxed">
              Split-Screen editor, PDF engine, PO-SD XML generator i FINA CIS/e-Račun proxy.
            </p>
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
              <span className="text-white font-semibold">packages/core/vitest.config.ts</span>
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
            <span>Faza 0 Verified</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
