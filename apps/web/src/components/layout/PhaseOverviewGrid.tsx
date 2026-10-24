import React from 'react';
import { Cpu, Layers, Printer, Terminal, ShieldCheck, BookOpen, Settings, BookMarked, Sparkles, Shield } from 'lucide-react';

export const PhaseOverviewGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-11 gap-3 no-print">
      <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-1.5 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">FAZA 0-2</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
            GOTOVO
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-[#10B981]" />
          <h3 className="font-semibold text-xs text-white">Domena &amp; Baza</h3>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          OIB MOD 11, IBAN MOD 97, kalkulator, Dexie perzistencija.
        </p>
      </div>

      <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-1.5 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">FAZA 3</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
            GOTOVO
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-[#10B981]" />
          <h3 className="font-semibold text-xs text-white">Sharp UI &amp; Teme</h3>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          OibInput, IbanInput, CurrencyInput, KpdPicker i Hue rotacija.
        </p>
      </div>

      <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-1.5 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">FAZA 4</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
            GOTOVO
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Printer className="w-4 h-4 text-[#10B981]" />
          <h3 className="font-semibold text-xs text-white">HUB-3 &amp; PDF</h3>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          HUB-3 PDF417, EPC QR, ISO 32000-1 i A4 PDF generator.
        </p>
      </div>

      <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-1.5 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">FAZA 4.5</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
            GOTOVO
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-[#10B981]" />
          <h3 className="font-semibold text-xs text-white">Logging Engine</h3>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          RingBuffer (500), UI konzola i sanitizirani JSON izvoz.
        </p>
      </div>

      <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-1.5 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[var(--text-secondary)]">FAZA 5</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
            GOTOVO
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          <h3 className="font-semibold text-xs text-white">Workflow &amp; State</h3>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
          Multi-stavke (Alt+N), F2 izdavanje, immutability i storno.
        </p>
      </div>

      <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-1.5 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[var(--text-secondary)]">FAZA 6</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
            GOTOVO
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-[#10B981]" />
          <h3 className="font-semibold text-xs text-white">KPR &amp; PO-SD</h3>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
          Knjiga prometa, prag 40k €, kvartali i PO-SD ePorezna XML.
        </p>
      </div>

      <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-1.5 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[var(--text-secondary)]">FAZA 7</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
            GOTOVO
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#3B82F6]" />
          <h3 className="font-semibold text-xs text-white">Fiskal. 1.0 &amp; 2.0</h3>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
          ZKI, JIR, CIS SOAP, FINA trezor i UBL 2.1 CIUS-HR e-Račun.
        </p>
      </div>

      <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-1.5 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[var(--accent-primary)] font-bold">FAZA 8</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30 font-bold">
            GOTOVO
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4 text-[var(--accent-primary)]" />
          <h3 className="font-semibold text-xs text-white">Postavke &amp; Logo</h3>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
          Profil obrta, adresar partnera, logo i digitalni pečat.
        </p>
      </div>

      <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-1.5 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[var(--accent-primary)] font-bold">FAZA 9</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30 font-bold">
            GOTOVO
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <BookMarked className="w-4 h-4 text-[#F59E0B]" />
          <h3 className="font-semibold text-xs text-white">Cjenik &amp; Backup</h3>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
          Katalog s KPD 2025, KPR CSV izvoz i AES-256 kriptirani backup.
        </p>
      </div>

      <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-1.5 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[var(--accent-primary)] font-bold">FAZA 10</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30 font-bold">
            GOTOVO
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-xs text-white">Google &amp; Cloud</h3>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
          Google kripto-sidro, Drive AppData sinkronizacija i Gemini KPD.
        </p>
      </div>

      <div className="border border-[#b89758]/60 bg-[#1a1b20] p-3.5 space-y-1.5 transition-colors shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#ffd700] font-bold">FAZA 11</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30 font-bold">
            GOTOVO
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-[#ffd700]" />
          <h3 className="font-semibold text-xs text-[#ffd700]">Žigo Agent</h3>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
          Autonomni Gemini agent, function calling, multimodal, Žigin rez.
        </p>
      </div>
    </div>
  );
};

