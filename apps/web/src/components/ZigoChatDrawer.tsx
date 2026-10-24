import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Paperclip, 
  Trash2, 
  Plus, 
  Shield, 
  Sword, 
  FileText, 
  Image as ImageIcon,
  ChevronDown
} from 'lucide-react';
import type { ZigoAttachment } from '@obrtniq/core';
import type { UseZigoAgentReturn } from '../hooks/useZigoAgent';
import { ZigoActionCard } from './ZigoActionCard';

export interface ZigoChatDrawerProps {
  agent: UseZigoAgentReturn;
}

export const ZigoChatDrawer: React.FC<ZigoChatDrawerProps> = ({ agent }) => {
  const {
    sesije,
    aktivnaSesija,
    poruke,
    isThinking,
    isDrawerOpen,
    setIsDrawerOpen,
    stvoriNovuSesiju,
    odaberiSesiju,
    obrisiSesiju,
    posaljiPoruku,
    aktivirajRez,
  } = agent;

  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<ZigoAttachment[]>([]);
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatsko skrolanje na dno pri novoj poruci
  useEffect(() => {
    if (isDrawerOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [poruke, isThinking, isDrawerOpen]);

  if (!isDrawerOpen) return null;

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Učitavanje datoteka (Slike i PDF računi)
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none print:hidden flex justify-end">
      {/* 1. Zatamnjena pozadina s klikom za zatvaranje */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* 2. Glavni panel ladice */}
      <div className="relative w-full sm:w-[500px] md:w-[580px] lg:w-[650px] bg-[#141518] text-white border-l border-[#b89758]/40 shadow-2xl flex flex-col h-full z-10 font-sans">
        
        {/* Zaglavlje s amblemom i sesijama */}
        <div className="p-4 bg-gradient-to-r from-[#1c1d22] via-[#22242b] to-[#1a1b20] border-b border-[#b89758]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Orlandov amblem s rotirajućim Q-prstenom */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#1e2025] border border-[#d4af37] shadow-inner shrink-0">
              <Shield className="w-5 h-5 text-[#d4af37]" />
              <span className="absolute text-[8px] font-mono font-black text-[#ffd700]">Q</span>
              {isThinking && (
                <div className="absolute -inset-1 rounded-full border border-dashed border-[#ffd700] animate-spin" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-[#f0e6d2]">Žigo (Digitalni Orlando)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] uppercase font-bold">
                  AGENT
                </span>
              </div>
              <div className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-2">
                <span>Dubrovački lakat</span>
                <span>•</span>
                <span>Zero-Server AI</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Izbornik sesija */}
            <div className="relative">
              <button
                onClick={() => setShowSessionMenu(!showSessionMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#181a1f] border border-[#b89758]/40 text-[#e0cfab] hover:border-[#ffd700] text-xs font-mono transition-colors"
                title="Popis razgovora"
              >
                <span className="truncate max-w-[120px]">{aktivnaSesija?.naslov || 'Sesije'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#ffd700]" />
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
                      className={`flex items-center justify-between px-2.5 py-2 hover:bg-[#252830] cursor-pointer ${
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

            {/* Zatvori drawer */}
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#252830] rounded-none transition-colors"
              title="Zatvori ladicu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3. Prozor s porukama */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
          {poruke.map((msg) => {
            const isUser = msg.uloga === 'user';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] mb-1 px-1">
                  <span>{isUser ? 'TI' : 'ŽIGO (ORLANDO)'}</span>
                  <span>•</span>
                  <span>{new Date(msg.kreirano).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`max-w-[88%] p-3.5 shadow-lg ${
                    isUser
                      ? 'bg-[#252830] text-[#e5e7eb] border border-[var(--border-strong)]'
                      : 'bg-gradient-to-br from-[#1c1d22] to-[#17181c] text-[#f5f0e6] border border-[#b89758]/40'
                  }`}
                >
                  {/* Privitci ako postoje */}
                  {msg.privitci && msg.privitci.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 pb-2 border-b border-white/10">
                      {msg.privitci.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2 py-1 bg-black/40 border border-white/20 text-[10px] text-[#ffd700]"
                        >
                          {att.mimeType.startsWith('image/') ? (
                            <ImageIcon className="w-3.5 h-3.5" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                          <span className="truncate max-w-[150px]">{att.naziv}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tekst poruke */}
                  <div className="leading-relaxed whitespace-pre-wrap font-sans text-[13px]">
                    {msg.tekst}
                  </div>

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

          {/* Indikator razmišljanja */}
          {isThinking && (
            <div className="flex items-center gap-2 p-3 bg-[#1c1d22] border border-[#ffd700]/40 text-[#ffd700] max-w-[70%] animate-pulse">
              <Shield className="w-4 h-4 animate-spin text-[#ffd700]" />
              <span className="text-[11px] font-mono">Orlando mjeri pod laktom...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 4. Donja fiksna traka: "Žigo, presijeci" gumb */}
        <div className="px-4 py-2 bg-[#181a1f] border-t border-[#b89758]/20 flex items-center justify-between">
          <div className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1.5">
            <Sword className="w-3.5 h-3.5 text-[#b89758]" />
            <span className="hidden sm:inline">Preopterećenost birokracijom?</span>
          </div>

          <button
            onClick={aktivirajRez}
            disabled={isThinking}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#252830] hover:bg-[#2e313b] text-[#ffd700] border border-[#b89758]/60 hover:border-[#ffd700] shadow-md text-xs font-mono font-bold tracking-wider transition-all disabled:opacity-50"
          >
            <Sword className="w-3.5 h-3.5" />
            <span>Žigo, presijeci</span>
          </button>
        </div>

        {/* 5. Polje za unos poruke i privitaka */}
        <div className="p-4 bg-[#181a1f] border-t border-[#b89758]/40 space-y-2">
          {/* Pregled odabranih privitaka prije slanja */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-1">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2 py-1 bg-[#252830] border border-[#b89758]/50 text-[#ffd700] text-[10px] font-mono"
                >
                  <span className="truncate max-w-[140px]">{att.naziv}</span>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="hover:text-red-400 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Skriveni file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Gumb za privitke */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 bg-[#252830] hover:bg-[#2d3039] text-[#e0cfab] border border-[#b89758]/40 hover:border-[#ffd700] transition-colors"
              title="Priloži račun, sliku ili PDF e-Račun"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Input polje */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isThinking}
              placeholder="Pitaj Žiga, naloži akciju ili povuci račun..."
              className="flex-1 bg-[#141518] border border-[var(--border-strong)] focus:border-[#ffd700] text-white px-3.5 py-2 text-xs font-mono outline-none transition-colors placeholder:text-gray-500"
            />

            {/* Gumb za slanje */}
            <button
              onClick={handleSend}
              disabled={(!inputText.trim() && attachments.length === 0) || isThinking}
              className="p-2.5 bg-[#b89758] hover:bg-[#d4af37] disabled:bg-gray-800 disabled:text-gray-600 text-black font-bold border border-[#ffd700] shadow-md transition-all active:scale-95"
              title="Pošalji poruku"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
