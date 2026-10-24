import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Clock, 
  ArrowRight, 
  UserCheck, 
  PlusCircle, 
  DollarSign, 
  BookOpen, 
  Sword
} from 'lucide-react';
import type { ZigoToolCall, ZigoToolResult } from '@obrtniq/core';

export interface ZigoActionCardProps {
  toolPoziv?: ZigoToolCall;
  toolRezultat?: ZigoToolResult;
  onExecuteTool?: (tool: ZigoToolCall) => void;
}

export const ZigoActionCard: React.FC<ZigoActionCardProps> = ({
  toolPoziv,
  toolRezultat,
  onExecuteTool: _onExecuteTool,
}) => {
  if (!toolPoziv) return null;

  const fnName = toolPoziv.imeFunkcije;
  const args = toolPoziv.argumenti || {};
  const isSuccess = toolRezultat?.uspjeh ?? true;
  const data = toolRezultat?.podaci;

  // 1. Žigin Rez kartica
  if (fnName === 'aktiviraj_zigin_rez' && data) {
    return (
      <div className="mt-3 p-3.5 bg-gradient-to-br from-[#1c1d22] to-[#141518] border border-[#b89758]/60 shadow-xl space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-[#b89758]/30 pb-2">
          <span className="flex items-center gap-1.5 text-[#ffd700] font-bold uppercase tracking-wider text-[11px]">
            <Sword className="w-4 h-4 text-[#d4af37]" /> Žigin Rez (Instant Trijaža)
          </span>
          <span className="text-[10px] text-[#10B981] px-1.5 py-0.5 bg-[#10B981]/10 border border-[#10B981]/30">
            PULS: 60
          </span>
        </div>

        {/* 1. Što gori */}
        <div className="flex items-start gap-2 bg-[#EF4444]/10 border-l-2 border-[#EF4444] p-2 text-[#fca5a5]">
          <Flame className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-[#f87171] text-[10px] uppercase">1. Što gori</div>
            <div className="text-[11px] leading-relaxed text-[#fee2e2]">{data.stoGori}</div>
          </div>
        </div>

        {/* 2. Što čeka */}
        <div className="flex items-start gap-2 bg-[#3B82F6]/10 border-l-2 border-[#3B82F6] p-2 text-[#93c5fd]">
          <Clock className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-[#60a5fa] text-[10px] uppercase">2. Što čeka</div>
            <div className="text-[11px] leading-relaxed text-[#dbeafe]">{data.stoCeka}</div>
          </div>
        </div>

        {/* 3. Akcija sad */}
        <div className="flex items-start gap-2 bg-[#ffd700]/10 border-l-2 border-[#ffd700] p-2 text-[#fef08a]">
          <ArrowRight className="w-4 h-4 text-[#ffd700] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-[#ffd700] text-[10px] uppercase">3. Jedna akcija sad</div>
            <div className="text-[11px] font-bold text-white leading-relaxed">{data.akcijaSad}</div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Postavljanje kupca kartica
  if (fnName === 'postavi_kupca') {
    return (
      <div className="mt-3 p-3 bg-[#1c1d22] border border-[#b89758]/50 shadow-md font-mono text-xs">
        <div className="flex items-center justify-between text-[#d4af37] font-bold mb-1.5">
          <span className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-[#10B981]" /> Kupac postavljen na račun
          </span>
          <span className="text-[10px] text-[#10B981] px-1.5 py-0.2 bg-[#10B981]/10 border border-[#10B981]/30">
            RADNA PLOHA
          </span>
        </div>
        <div className="text-white font-bold text-[13px]">{args.partnerNaziv}</div>
        <div className="text-[11px] text-[var(--text-muted)] flex flex-wrap gap-x-3 mt-1">
          {args.oib && <span>OIB: <strong className="text-white">{args.oib}</strong></span>}
          {args.taxZone && <span>Zona: <strong className="text-white">{args.taxZone}</strong></span>}
        </div>
      </div>
    );
  }

  // 3. Dodavanje stavke računa kartica
  if (fnName === 'dodaj_stavku_racuna') {
    const kolicina = Number(args.kolicina) || 1;
    const cijena = Number(args.cijena) || 0;
    const ukupno = kolicina * cijena;

    return (
      <div className="mt-3 p-3 bg-[#1c1d22] border border-[#b89758]/50 shadow-md font-mono text-xs">
        <div className="flex items-center justify-between text-[#d4af37] font-bold mb-1.5">
          <span className="flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-[#10B981]" /> Stavka dodana na račun
          </span>
          <span className="text-[11px] font-bold text-[#10B981]">
            +{ukupno.toFixed(2)} €
          </span>
        </div>
        <div className="text-white font-bold">{args.naziv}</div>
        <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between mt-1">
          <span>KPD: <strong className="text-[#ffd700]">{args.kpdSifra}</strong></span>
          <span>{kolicina} {args.jedinicaMjere || 'sat'} x {cijena.toFixed(2)} €</span>
        </div>
      </div>
    );
  }

  // 4. Status praga i KPR kartica
  if (fnName === 'dohvati_financijski_status' && data) {
    const ukupno = Number(data.ukupnoNaplaceno) || 0;
    const prag = Number(data.zakonskiPrag) || 40000;
    const ostalo = Number(data.ostaloDoPraga) || 0;
    const postotak = Math.min(100, (ukupno / prag) * 100);

    return (
      <div className="mt-3 p-3 bg-[#1c1d22] border border-[#b89758]/50 shadow-md font-mono text-xs space-y-2">
        <div className="flex items-center justify-between text-[#d4af37] font-bold">
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-[#ffd700]" /> KPR Status & Paušalni Prag
          </span>
          <span className="text-[10px] text-white bg-[#252830] px-1.5 py-0.5 border border-[#b89758]/30">
            {data.godina}. GODINA
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
          <div className="bg-[#141518] p-2 border border-[#b89758]/20">
            <div className="text-[10px] text-[var(--text-muted)]">NAPLAĆENO (KPR)</div>
            <div className="text-sm font-bold text-[#10B981]">{ukupno.toFixed(2)} €</div>
          </div>
          <div className="bg-[#141518] p-2 border border-[#b89758]/20">
            <div className="text-[10px] text-[var(--text-muted)]">DO PRAGA 40.000 €</div>
            <div className={`text-sm font-bold ${ostalo < 2000 ? 'text-[#EF4444]' : 'text-[#ffd700]'}`}>
              {ostalo.toFixed(2)} €
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#141518] h-2 border border-[#b89758]/30 overflow-hidden">
          <div
            className={`h-full transition-all ${
              postotak > 90 ? 'bg-[#EF4444]' : postotak > 75 ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
            }`}
            style={{ width: `${postotak}%` }}
          />
        </div>
      </div>
    );
  }

  // 5. Dodano u cjenik kartica
  if (fnName === 'dodaj_u_cjenik' && data) {
    return (
      <div className="mt-3 p-3 bg-[#1c1d22] border border-[#b89758]/50 shadow-md font-mono text-xs">
        <div className="flex items-center justify-between text-[#d4af37] font-bold mb-1.5">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#10B981]" /> Spremljeno u lokalni cjenik
          </span>
          <span className="text-[11px] font-bold text-[#10B981]">
            {Number(data.cijenaOsnovica || 0).toFixed(2)} €
          </span>
        </div>
        <div className="text-white font-bold">{data.naziv}</div>
        <div className="text-[11px] text-[var(--text-muted)] mt-1">
          KPD 2025: <strong className="text-[#ffd700]">{data.kpdSifra}</strong> ({data.jedinicaMjere})
        </div>
      </div>
    );
  }

  // Generička kartica akcije
  return (
    <div className="mt-2.5 p-2.5 bg-[#1c1d22] border border-[#b89758]/30 font-mono text-[11px] flex items-center justify-between">
      <div className="flex items-center gap-2">
        {isSuccess ? (
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
        ) : (
          <AlertCircle className="w-4 h-4 text-[#EF4444]" />
        )}
        <span className="text-[var(--text-secondary)]">Alat: <strong className="text-white">{fnName}</strong></span>
      </div>
      <span className="text-[10px] text-[#ffd700] uppercase font-bold">
        {isSuccess ? 'Izvršeno' : 'Greška'}
      </span>
    </div>
  );
};
