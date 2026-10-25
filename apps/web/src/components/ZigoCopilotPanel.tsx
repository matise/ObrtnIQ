import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Square,
  Paperclip,
  Trash2,
  Plus,
  Shield,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  PanelRightClose,
  PanelRightOpen,
  Eye,
  Sword,
  Sparkles,
  BookMarked,
  BookmarkCheck,
} from 'lucide-react';
import type { ZigoAttachment, ZigoUserMemory, ZigoMemoryKategorija } from '@obrtniq/core';
import type { UseZigoAgentReturn } from '../hooks/useZigoAgent';
import type { UseLiveScreenContextReturn } from '../hooks/useLiveScreenContext';
import { zigoMemoryService } from '../services/zigo-memory-service';
import { getZigoThinkingPhrase } from '../services/zigo-context-builder';
import { ZigoActionCard } from './ZigoActionCard';
import { ZigoMessageContent } from './ZigoMessageContent';
import { ObrtEmblem } from './icons';

export interface ZigoCopilotPanelProps {
  agent: UseZigoAgentReturn;
  liveContext: UseLiveScreenContextReturn;
  isDocked?: boolean;
  onToggleDock?: () => void;
  onClose?: () => void;
  className?: string;
}

export const ZigoCopilotPanel: React.FC<ZigoCopilotPanelProps> = ({
  agent,
  liveContext,
  isDocked = false,
  onToggleDock,
  onClose,
  className = '',
}) => {
  const {
    sesije,
    aktivnaSesija,
    poruke,
    isThinking,
    stvoriNovuSesiju,
    odaberiSesiju,
    obrisiSesiju,
    posaljiPoruku,
    aktivirajRez,
  } = agent;

  const { snapshot, chips } = liveContext;

  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<ZigoAttachment[]>([]);
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const [showDetailedContext, setShowDetailedContext] = useState(false);
  const [showTefter, setShowTefter] = useState(false);
  const [memories, setMemories] = useState<ZigoUserMemory[]>([]);
  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryVal, setNewMemoryVal] = useState('');
  const [newMemoryCat, setNewMemoryCat] = useState<ZigoMemoryKategorija>('posao');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMemories = async () => {
    try {
      const list = await zigoMemoryService.getAllMemories();
      setMemories(list);
    } catch {
      // Tihi fallback
    }
  };

  useEffect(() => {
    if (showTefter) {
      loadMemories();
    }
  }, [showTefter]);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryVal.trim()) return;
    await zigoMemoryService.saveMemory(
      newMemoryCat,
      newMemoryKey.trim() || newMemoryVal.trim().slice(0, 24),
      newMemoryVal.trim(),
      'izricito_korisnik'
    );
    setNewMemoryKey('');
    setNewMemoryVal('');
    await loadMemories();
  };

  const handleDeleteMemory = async (id: string) => {
    await zigoMemoryService.deleteMemory(id);
    await loadMemories();
  };

  const handleClearAllMemories = async () => {
    if (confirm('Jeste li sigurni da želite obrisati sve činjenice iz Žiginog teftera?')) {
      await zigoMemoryService.clearAllMemories();
      await loadMemories();
    }
  };

  // Automatsko skrolanje na dno pri novoj poruci
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [poruke, isThinking]);

  // Slanje poruke
  const handleSend = async () => {
    if ((!inputText.trim() && attachments.length === 0) || isThinking) return;
    const textToSend = inputText;
    const attToSend = [...attachments];
    setInputText('');
    setAttachments([]);
    await posaljiPoruku(textToSend, attToSend.length > 0 ? attToSend : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && isThinking) {
      e.preventDefault();
      agent.zaustaviDumanje();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Učitavanje privitaka
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            naziv: file.name,
            mimeType: file.type || 'application/octet-stream',
            base64Data,
            velicinaBajtova: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Klik na dinamički čip
  const handleChipClick = async (chipPrompt: string) => {
    if (isThinking) return;
    await posaljiPoruku(chipPrompt);
  };



  return (
    <div
      className={`bg-[#141518] text-white flex flex-col h-full border-l border-[#b89758]/40 shadow-2xl font-sans select-none ${className}`}
    >
      {/* 1. Zaglavlje s amblemom i kontrolama */}
      <div className="p-3 bg-gradient-to-r from-[#1c1d22] via-[#22242b] to-[#1a1b20] border-b border-[#b89758]/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <ObrtEmblem
            emblem="zigo-emblem"
            size={36}
            rotatingRing
            ringSpeed={isThinking ? 'fast' : 'slow'}
            glowing={isThinking}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs tracking-wide text-[#f0e6d2]">Žigo (Orlando)</span>
              <span className="text-[9px] font-mono px-1 py-0.2 bg-[#ffd700]/15 border border-[#ffd700]/40 text-[#ffd700] uppercase font-bold">
                Omni-Copilot
              </span>
            </div>
            <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1.5">
              <span>Dubrovački lakat</span>
              <span>•</span>
              <span>Eyes on Screen</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Izbornik sesija */}
          <div className="relative">
            <button
              onClick={() => setShowSessionMenu(!showSessionMenu)}
              className="flex items-center gap-1 px-2 py-1 bg-[#181a1f] border border-[#b89758]/40 text-[#e0cfab] hover:border-[#ffd700] text-[11px] font-mono transition-colors"
              title="Popis sesija razgovora"
            >
              <span className="truncate max-w-[90px]">{aktivnaSesija?.naslov || 'Sesije'}</span>
              <ChevronDown className="w-3 h-3 text-[#ffd700]" />
            </button>

            {showSessionMenu && (
              <div className="absolute right-0 mt-1 w-64 bg-[#181a1f] border border-[#b89758]/60 shadow-2xl z-50 p-1 font-mono text-xs max-h-72 overflow-y-auto">
                <button
                  onClick={() => {
                    stvoriNovuSesiju();
                    setShowSessionMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-[#ffd700] hover:bg-[#252830] border-b border-[#b89758]/20 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" /> Novi razgovor
                </button>
                {sesije.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between px-2.5 py-1.5 hover:bg-[#252830] cursor-pointer ${
                      s.id === aktivnaSesija?.id ? 'bg-[#252830] text-[#ffd700]' : 'text-gray-300'
                    }`}
                    onClick={() => {
                      odaberiSesiju(s.id);
                      setShowSessionMenu(false);
                    }}
                  >
                    <span className="truncate pr-2">{s.naslov}</span>
                    {sesije.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          obrisiSesiju(s.id);
                        }}
                        className="text-gray-500 hover:text-[#EF4444] p-1"
                        title="Obriši razgovor"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Žigin Tefter gumb */}
          <button
            onClick={() => setShowTefter(!showTefter)}
            className={`p-1.5 transition-colors border ${
              showTefter
                ? 'bg-[#b89758]/20 border-[#ffd700] text-[#ffd700]'
                : 'border-transparent text-gray-400 hover:text-[#ffd700] hover:bg-[#252830]'
            }`}
            title="Žigin Tefter (Što znam o tebi i tvojim navikama)"
          >
            <BookMarked className="w-4 h-4" />
          </button>

          {/* Dock / Undock gumb */}
          {onToggleDock && (
            <button
              onClick={onToggleDock}
              className="p-1.5 text-gray-400 hover:text-[#ffd700] hover:bg-[#252830] transition-colors"
              title={isDocked ? 'Prebaci u plutajući prozor' : 'Usidri na desni rub (Sidecar način rada)'}
            >
              {isDocked ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          )}

          {/* Zatvori panel */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#252830] transition-colors"
              title="Zatvori kopilota"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 1.1. Žigin Tefter Drawer (Prikaz činjenica i preferencija) */}
      {showTefter && (
        <div className="bg-[#121316] border-b border-[#b89758]/50 p-3 space-y-3 font-mono text-xs shrink-0 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-[#b89758]/30 pb-1.5">
            <span className="flex items-center gap-1.5 text-[#ffd700] font-bold text-[11px] uppercase tracking-wider">
              <BookmarkCheck className="w-4 h-4 text-[#10B981]" /> Žigin Tefter (Knjiga Mudrosti)
            </span>
            <div className="flex items-center gap-2">
              {memories.length > 0 && (
                <button
                  onClick={handleClearAllMemories}
                  className="text-[10px] text-red-400 hover:text-red-300 underline"
                  title="Obriši sve bilješke"
                >
                  Isprazni
                </button>
              )}
              <button
                onClick={() => setShowTefter(false)}
                className="text-gray-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 leading-relaxed">
            Ovdje su sve činjenice, pravila i navike koje je Žigo naučio o tebi i tvom obrtu. Koristi ih u svakom razgovoru i odlukama.
          </p>

          {/* Popis zabilješki */}
          <div className="space-y-1.5">
            {memories.length === 0 ? (
              <div className="p-2.5 bg-[#181a1f] border border-white/5 text-[11px] text-gray-500 italic text-center">
                Tefter je prazan. Reci Žigu: "Zovi me...", "Moj obrt je...", "Žigo, zapamti da..."
              </div>
            ) : (
              memories.map((mem) => (
                <div
                  key={mem.id}
                  className="flex items-start justify-between p-2 bg-[#181a1f] border border-[#b89758]/20 text-[11px] group"
                >
                  <div className="space-y-0.5 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] px-1 py-0.2 bg-[#252830] text-[#ffd700] uppercase font-bold border border-[#b89758]/30">
                        {mem.kategorija}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">[{mem.kljuc}]</span>
                    </div>
                    <div className="text-gray-200">{mem.vrijednost}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteMemory(mem.id)}
                    className="text-gray-500 hover:text-red-400 p-1 opacity-60 group-hover:opacity-100 transition-opacity"
                    title="Obriši zabilješku"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Obrazac za ručno dodavanje bilješke */}
          <form onSubmit={handleAddMemory} className="pt-2 border-t border-white/10 space-y-2">
            <div className="text-[10px] text-[#ffd700] uppercase font-bold">Dodaj novu zabilješku:</div>
            <div className="flex gap-1.5">
              <select
                value={newMemoryCat}
                onChange={(e) => setNewMemoryCat(e.target.value as ZigoMemoryKategorija)}
                className="bg-[#181a1f] border border-[#b89758]/40 text-gray-200 text-[10px] px-1.5 py-1 focus:outline-none"
              >
                <option value="posao">Posao</option>
                <option value="identitet">Identitet</option>
                <option value="preferenca">Preferenca</option>
                <option value="pravilo">Pravilo</option>
                <option value="osobno">Osobno</option>
              </select>
              <input
                type="text"
                placeholder="Ključ (npr. radno_vrijeme)"
                value={newMemoryKey}
                onChange={(e) => setNewMemoryKey(e.target.value)}
                className="w-1/3 bg-[#181a1f] border border-[#b89758]/40 px-2 py-1 text-[10px] text-white focus:outline-none"
              />
              <input
                type="text"
                placeholder="Vrijednost (npr. radi noću)"
                value={newMemoryVal}
                onChange={(e) => setNewMemoryVal(e.target.value)}
                className="flex-1 bg-[#181a1f] border border-[#b89758]/40 px-2 py-1 text-[10px] text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-[#b89758]/30 hover:bg-[#b89758]/50 text-[#ffd700] border border-[#ffd700]/50 text-[10px] font-bold"
              >
                Dodaj
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. "Orlando motri" Statusna traka u stvarnom vremenu (Eyes on Screen Pill) */}
      <div className="bg-[#181a1f] border-b border-[#b89758]/30 px-3 py-1.5 flex flex-col shrink-0">
        <button
          onClick={() => setShowDetailedContext(!showDetailedContext)}
          className="flex items-center justify-between w-full text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex h-2 w-2 relative shrink-0">
              {snapshot.financije.hoceLiProbitePrag ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              )}
            </span>

            <span className="text-[11px] font-mono truncate text-gray-300 group-hover:text-[#ffd700] transition-colors">
              {snapshot.financije.hoceLiProbitePrag ? (
                <span className="text-[#EF4444] font-bold">
                  ⚠️ Orlandov lakat: Račun probija limit od 40.000 €!
                </span>
              ) : snapshot.financije.statusUgroze === 'UPOZORENJE' ? (
                <span className="text-[#F59E0B] font-bold">
                  🛡️ Do praga 40k: još {snapshot.financije.preostaloDoPraga.toLocaleString('hr-HR')} €
                </span>
              ) : snapshot.racun.oib && !snapshot.racun.isOibValid ? (
                <span className="text-[#F59E0B]">
                  ⚠️ OIB nije valjan (MOD 11) • {snapshot.racun.oib}
                </span>
              ) : (
                <span>
                  Orlando motri: <strong className="text-white">{snapshot.aktivniEkran}</strong> • {snapshot.racun.brojStavki} stavki ({snapshot.racun.ukupniIznos.toFixed(2)} €)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 text-gray-400 group-hover:text-white">
            <Eye className="w-3.5 h-3.5 text-[#ffd700]" />
            {showDetailedContext ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </div>
        </button>

        {/* Prošireni detaljni pregled stanja ekrana */}
        {showDetailedContext && (
          <div className="mt-2 pt-2 border-t border-white/10 font-mono text-[10px] space-y-1.5 text-gray-300 bg-black/30 p-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Partner / Kupac:</span>
              <span className="text-white font-bold truncate max-w-[200px]">{snapshot.racun.partnerNaziv || '(nije zadan)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">OIB kontrola:</span>
              <span className={snapshot.racun.isOibValid ? 'text-emerald-400' : 'text-amber-400'}>
                {snapshot.racun.oib ? `${snapshot.racun.oib} (${snapshot.racun.isOibValid ? 'MOD 11 OK' : 'NEISPRAVAN'})` : '(nema OIB-a)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">KPR Promet YTD:</span>
              <span className="text-white">{snapshot.financije.kprPrometYtd.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Preostalo do 40.000 €:</span>
              <span className={snapshot.financije.preostaloDoPraga < 4000 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                {snapshot.financije.preostaloDoPraga.toFixed(2)} €
              </span>
            </div>
            {snapshot.sustav.posljednjaGreska && (
              <div className="text-red-400 text-[9px] border-t border-red-500/20 pt-1">
                Zadnja greška: [{snapshot.sustav.posljednjaGreska.scope}] {snapshot.sustav.posljednjaGreska.poruka}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Dinamički kontekstualni čipovi (Quick Contextual Action Chips) */}
      {chips.length > 0 && (
        <div className="px-3 py-1.5 bg-[#16171b] border-b border-[#b89758]/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <Sparkles className="w-3 h-3 text-[#ffd700] shrink-0" />
          {chips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => handleChipClick(chip.prompt)}
              disabled={isThinking}
              className={`shrink-0 px-2 py-1 text-[10px] font-mono transition-all border cursor-pointer ${
                chip.prioritet === 'visok'
                  ? 'bg-red-950/40 hover:bg-red-900/60 text-red-200 border-red-500/60 hover:border-red-400 animate-pulse'
                  : 'bg-[#202228] hover:bg-[#292c34] text-[#e0cfab] hover:text-[#ffd700] border-[#b89758]/40 hover:border-[#ffd700]'
              }`}
              title={chip.prompt}
            >
              {chip.tekst}
            </button>
          ))}
        </div>
      )}

      {/* 4. Glavni prozor poruka */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
        {poruke.map((msg) => {
          const isUser = msg.uloga === 'user';

          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 text-[9px] text-[var(--text-muted)] mb-1 px-1">
                <span>{isUser ? 'TI' : 'ŽIGO (ORLANDO)'}</span>
                <span>•</span>
                <span>{new Date(msg.kreirano).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div
                className={`max-w-[90%] p-3 shadow-lg ${
                  isUser
                    ? 'bg-[#252830] text-[#e5e7eb] border border-[var(--border-strong)]'
                    : 'bg-gradient-to-br from-[#1c1d22] to-[#17181c] text-[#f5f0e6] border border-[#b89758]/40'
                }`}
              >
                {/* Privitci ako postoje */}
                {msg.privitci && msg.privitci.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2 pb-2 border-b border-white/10">
                    {msg.privitci.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 px-1.5 py-0.5 bg-black/40 border border-white/20 text-[9px] text-[#ffd700]"
                      >
                        {att.mimeType.startsWith('image/') ? (
                          <ImageIcon className="w-3 h-3" />
                        ) : (
                          <FileText className="w-3 h-3" />
                        )}
                        <span className="truncate max-w-[120px]">{att.naziv}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tekst poruke sa stiliziranom trodijelnom strukturom */}
                <ZigoMessageContent tekst={msg.tekst} isUser={isUser} />

                {/* Akcijska kartica ako poruka sadrži tool poziv ili rezultat */}
                {(msg.toolPoziv || msg.toolRezultat) && (
                  <ZigoActionCard
                    toolPoziv={msg.toolPoziv}
                    toolRezultat={msg.toolRezultat}
                    onExecuteTool={agent.izvrsiPripremljeniAlat}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Indikator razmišljanja sa stop gumbom */}
        {isThinking && (
          <div className="flex items-center justify-between gap-3 p-2.5 bg-[#1c1d22] border border-[#ffd700]/40 text-[#ffd700] max-w-[85%] font-mono text-[11px] shadow-lg animate-pulse">
            <div className="flex items-center gap-2 min-w-0">
              <Shield className="w-3.5 h-3.5 animate-spin text-[#ffd700] shrink-0" />
              <span className="truncate">{getZigoThinkingPhrase(snapshot)}</span>
            </div>
            <button
              type="button"
              onClick={agent.zaustaviDumanje}
              className="shrink-0 px-2 py-0.5 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 border border-[#EF4444]/60 hover:border-[#EF4444] text-[#EF4444] text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
              title="Zaustavi dumanje (Esc)"
              aria-label="Zaustavi dumanje"
            >
              <Square className="w-2.5 h-2.5 fill-current" />
              <span>Prekini</span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 5. Prečac: "Žigo, presijeci" */}
      <div className="px-3 py-1.5 bg-[#181a1f] border-t border-[#b89758]/20 flex items-center justify-between shrink-0">
        <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1">
          <Sword className="w-3 h-3 text-[#b89758]" />
          <span>Birokratska drama?</span>
        </div>

        <button
          onClick={aktivirajRez}
          disabled={isThinking}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#252830] hover:bg-[#2e313b] text-[#ffd700] border border-[#b89758]/60 hover:border-[#ffd700] shadow text-[11px] font-mono font-bold tracking-wider transition-all disabled:opacity-50 cursor-pointer"
        >
          <Sword className="w-3 h-3" />
          <span>Žigo, presijeci</span>
        </button>
      </div>

      {/* 6. Polje za unos poruke i privitaka */}
      <div className="p-3 bg-[#181a1f] border-t border-[#b89758]/40 space-y-2 shrink-0">
        {/* Pregled privitaka */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2 py-0.5 bg-[#252830] border border-[#b89758]/50 text-[#ffd700] text-[10px] font-mono"
              >
                <span className="truncate max-w-[140px]">{att.naziv}</span>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="text-gray-400 hover:text-[#EF4444]"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Skriveni input za datoteke */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*,application/pdf"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isThinking}
            className="p-2 bg-[#252830] hover:bg-[#2e313b] border border-[var(--border-strong)] text-[#e0cfab] hover:text-[#ffd700] transition-colors disabled:opacity-50 cursor-pointer"
            title="Priloži račun, slip ili ugovor (slika ili PDF)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pitaj Orlanda ili zatraži pripremu..."
            disabled={isThinking}
            className="flex-1 bg-[#141518] border border-[#b89758]/40 focus:border-[#ffd700] px-3 py-2 text-xs font-mono text-white placeholder-gray-500 focus:outline-none transition-colors"
          />

          {isThinking ? (
            <button
              type="button"
              onClick={agent.zaustaviDumanje}
              className="p-2 bg-[#EF4444]/25 hover:bg-[#EF4444]/40 text-[#EF4444] border border-[#EF4444] transition-all transform active:scale-95 cursor-pointer shadow-lg animate-pulse"
              title="Zaustavi dumanje (Esc)"
              aria-label="Zaustavi dumanje"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim() && attachments.length === 0}
              className="p-2 bg-[#b89758] hover:bg-[#d4af37] text-black font-bold border border-[#ffd700] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Pošalji poruku (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
