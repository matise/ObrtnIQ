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
  Sword,
  Globe,
  Search,
  ExternalLink,
  Check,
  BookmarkCheck
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
  onExecuteTool,
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

  // 6. Istraživanje propisa na webu (Tavily AI Search) — HITL Traženje Dozvole
  if (fnName === 'istrazi_propise_web' && !toolRezultat) {
    return (
      <div className="mt-3 p-3.5 bg-gradient-to-br from-[#1c1d22] to-[#121418] border border-cyan-500/50 shadow-xl space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
          <span className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
            <Globe className="w-4 h-4 text-cyan-400 animate-pulse" /> Žigo traži dopuštenje za web
          </span>
          <span className="text-[10px] text-cyan-400 px-1.5 py-0.5 bg-cyan-950/40 border border-cyan-500/30">
            HITL PRIVOLA
          </span>
        </div>

        <div className="text-[12px] text-gray-200">
          Gosparu, zakoni i mišljenja Porezne uprave stalno se mijenjaju. Želiš li da provjerim najnovije objave na stranicama Porezne?
        </div>

        <div className="bg-[#0f1013] p-2.5 border border-cyan-500/30 text-cyan-200 flex items-start gap-2">
          <Search className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="overflow-hidden">
            <div className="text-[10px] text-gray-400 uppercase font-semibold">UPIT PRETRAGE</div>
            <div className="text-white font-bold truncate">{args.upit}</div>
            <div className="text-[10px] text-cyan-400/80 mt-1">
              🏛️ Izvor: Tavily AI Search • porezna-uprava.hr / HOK
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onExecuteTool?.(toolPoziv)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] shadow-lg transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" /> Dopusti pretragu na webu
          </button>
        </div>
      </div>
    );
  }

  // 7. Istraživanje propisa na webu (Tavily AI Search) — Prikaz Rezultata
  if (fnName === 'istrazi_propise_web' && toolRezultat) {
    const resData = toolRezultat.podaci || {};
    const resultsList = resData.results || [];

    return (
      <div className="mt-3 p-3.5 bg-gradient-to-br from-[#1c1d22] to-[#121418] border border-cyan-500/60 shadow-xl space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
          <span className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
            <Globe className="w-4 h-4 text-cyan-400" /> Rezultati istraživanja propisa
          </span>
          <span className="text-[10px] text-emerald-400 px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-500/30">
            VERIFICIRANO
          </span>
        </div>

        {resData.odgovorSazetak && (
          <div className="bg-cyan-950/20 border-l-2 border-cyan-400 p-2.5 text-gray-200 text-[11px] leading-relaxed">
            {resData.odgovorSazetak}
          </div>
        )}

        {resultsList.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
              Službeni izvori i reference:
            </div>
            {resultsList.map((item: any, idx: number) => (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 bg-[#0f1013] hover:bg-[#15171d] border border-white/10 hover:border-cyan-400/50 transition-colors text-cyan-300 text-[11px] group"
              >
                <span className="truncate pr-2 font-medium group-hover:text-cyan-200">
                  {item.title}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 8. Pamćenje činjenice u Žigin tefter
  if (fnName === 'zapamti_cinjenicu') {
    const mem = data?.memorija || args;
    return (
      <div className="mt-3 p-3 bg-[#1c1d22] border border-[#b89758]/60 shadow-md font-mono text-xs">
        <div className="flex items-center justify-between text-[#ffd700] font-bold mb-1.5">
          <span className="flex items-center gap-1.5">
            <BookmarkCheck className="w-4 h-4 text-[#10B981]" /> Zabilježeno u Žigin tefter
          </span>
          <span className="text-[10px] text-[#10B981] px-1.5 py-0.5 bg-[#10B981]/10 border border-[#10B981]/30">
            ZAPAMĆENO
          </span>
        </div>
        <div className="text-white font-bold">{mem.vrijednost}</div>
        <div className="text-[10px] text-[var(--text-muted)] mt-1">
          Ključ: <strong className="text-[#ffd700]">[{mem.kljuc}]</strong> {mem.kategorija ? `• ${mem.kategorija}` : ''}
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
