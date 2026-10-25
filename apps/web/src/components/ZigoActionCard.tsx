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
  BookmarkCheck,
  ShieldCheck,
  Receipt,
  TrendingUp,
  FileSpreadsheet,
  Package
} from 'lucide-react';
import { 
  formatHrvatskiIznos, 
  formatHrvatskiDatum, 
  KATEGORIJE_TROSKA_LABELS,
  type ZigoToolCall, 
  type ZigoToolResult 
} from '@obrtniq/core';

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

  // 9. Provjera obveznih doprinosa i poreza (Faza 18)
  if (fnName === 'provjeri_obvezne_doprinose_i_porez' && data) {
    const obracun = data.obracunZaMjesec;
    const isPlaceno = obracun?.status === 'UPLACENO';

    return (
      <div className="mt-3 p-3.5 bg-gradient-to-br from-[#1c1d22] to-[#141518] border border-[#b89758]/60 shadow-xl font-mono text-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-[#b89758]/30 pb-2">
          <span className="flex items-center gap-1.5 text-[#ffd700] font-bold text-[11px] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" /> Obvezni Doprinosi RH ({data.godina}.)
          </span>
          {isPlaceno ? (
            <span className="text-[10px] text-[#10B981] px-2 py-0.5 bg-[#10B981]/10 border border-[#10B981]/30 font-bold">
              UPLAĆENO
            </span>
          ) : (
            <span className="text-[10px] text-[#F59E0B] px-2 py-0.5 bg-[#F59E0B]/10 border border-[#F59E0B]/30 font-bold">
              ČEKA UPLATU
            </span>
          )}
        </div>

        {obracun && (
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span>Mjesec:</span>
              <strong className="text-white font-bold">{data.provjeraMjesec}. mjesec ({data.godina}.)</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Ukupno za uplatu:</span>
              <strong className="text-[#10B981] font-bold font-mono">{formatHrvatskiIznos(obracun.ukupnoDoprinosiEur)}</strong>
            </div>
            <div className="flex justify-between text-slate-300 text-[10px]">
              <span>MIO 1 (15%) + MIO 2 (5%) + HZZO (16.5%):</span>
              <span className="text-slate-400 font-mono">
                {obracun.iznosMio1Eur.toFixed(2)} + {obracun.iznosMio2Eur.toFixed(2)} + {obracun.iznosHzzoEur.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between text-slate-400 text-[10px] pt-1 border-t border-slate-800">
              <span>Rok plaćanja:</span>
              <span className="text-[#ffd700] font-medium">{formatHrvatskiDatum(obracun.rokPlacanja)}</span>
            </div>
          </div>
        )}

        {data.brojNeplacenihDospjelih > 0 && (
          <div className="p-2 bg-rose-950/30 border border-rose-800/40 rounded text-rose-300 text-[10px]">
            Upozorenje: Imate {data.brojNeplacenihDospjelih} dospjeli neplaćeni mjesec doprinosa ({formatHrvatskiIznos(data.ukupnoNeplacenoDospjeloEur)}).
          </div>
        )}
      </div>
    );
  }

  // 10. Evidentiranje ulaznog troška (Faza 18)
  if (fnName === 'evidentiraj_ulazni_trosak') {
    const t = data?.trosak || args;
    const ukupno = Number(t.ukupnoEur) || 0;
    const katLabel = (KATEGORIJE_TROSKA_LABELS as Record<string, string>)[t.kategorija] || t.kategorija;
    const isDugotrajna = t.jeDugotrajnaImovina || ukupno >= 663.61;

    return (
      <div className="mt-3 p-3.5 bg-gradient-to-br from-[#1c1d22] to-[#141518] border border-[#b89758]/60 shadow-xl font-mono text-xs space-y-2">
        <div className="flex items-center justify-between border-b border-[#b89758]/30 pb-2">
          <span className="flex items-center gap-1.5 text-[#ffd700] font-bold text-[11px] uppercase tracking-wider">
            <Receipt className="w-4 h-4 text-[#10B981]" /> Evidentiran Ulazni Trošak
          </span>
          <span className="text-[10px] text-[#10B981] px-2 py-0.5 bg-[#10B981]/10 border border-[#10B981]/30 font-bold">
            ZAVEDENO
          </span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <div className="text-white font-bold text-[13px]">{t.dobavljacNaziv}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{t.opis || katLabel}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-[#10B981] font-mono">
              {formatHrvatskiIznos(ukupno)}
            </div>
            <div className="text-[10px] text-slate-400">
              {t.status === 'PLACENO' ? 'Plaćeno' : 'Čeka uplatu'}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Kategorija: <strong className="text-slate-200">{katLabel}</strong></span>
          {isDugotrajna && (
            <span className="inline-flex items-center gap-1 text-indigo-400 font-bold">
              <Package className="w-3 h-3" /> Dugotrajna imovina
            </span>
          )}
        </div>
      </div>
    );
  }

  // 11. Financijska slika i neto dobit (Faza 18)
  if (fnName === 'dohvati_financijsku_sliku_i_dobit' && data) {
    return (
      <div className="mt-3 p-3.5 bg-gradient-to-br from-[#1c1d22] to-[#141518] border border-[#b89758]/60 shadow-xl font-mono text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#b89758]/30 pb-2">
          <span className="flex items-center gap-1.5 text-[#ffd700] font-bold text-[11px] uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-[#10B981]" /> Financijska Slika ({data.godina}.)
          </span>
          <span className="text-[10px] text-indigo-300 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 font-bold">
            MARŽA: {data.profitnaMarzaPostotak}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 block">KPR PRIMICI:</span>
            <span className="font-bold text-white font-mono text-xs">{formatHrvatskiIznos(data.kprPrimiciEur)}</span>
          </div>
          <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 block">UKUPNI IZDACI:</span>
            <span className="font-bold text-rose-300 font-mono text-xs">{formatHrvatskiIznos(data.ukupniIzdaciEur)}</span>
          </div>
        </div>

        <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">ČISTA NETO DOBIT:</span>
            <span className="text-base font-bold text-emerald-300 font-mono">{formatHrvatskiIznos(data.netoDobitEur)}</span>
          </div>
          <span className="text-2xl font-mono font-bold text-emerald-400/30">€</span>
        </div>
      </div>
    );
  }

  // 12. Saldiranje transakcije s izvoda (Faza 18)
  if (fnName === 'saldiraj_izvod_transakcije' && data) {
    const kpr = data.kprStavka;
    return (
      <div className="mt-3 p-3 bg-[#1c1d22] border border-[#b89758]/60 shadow-md font-mono text-xs space-y-1.5">
        <div className="flex items-center justify-between text-[#10B981] font-bold">
          <span className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-[#10B981]" /> Saldirano u Knjigu Prometa
          </span>
          <span className="text-[10px] text-[#10B981] px-1.5 py-0.2 bg-[#10B981]/10 border border-[#10B981]/30">
            KPR #{kpr?.brojKprStavke || 1}
          </span>
        </div>
        <div className="text-white font-bold">{kpr?.opisPlatitelja || 'Uplata s bankovnog izvoda'}</div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
          <span>Datum: {formatHrvatskiDatum(kpr?.datumNaplate || new Date())}</span>
          <span className="text-white font-bold font-mono">+{formatHrvatskiIznos(kpr?.ukupnoNaplaceno || 0)}</span>
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
