// apps/web/src/components/onboarding/OnboardingWizardModal.tsx
// ObrtnIQ v3.0 — Onboarding Wizard: "Upoznaj Žiga, Gospara od Obrta"

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Building2,
  CreditCard,
  Palette,
  FileText,
  X,
  Check,
  Zap,
  Lightbulb,
  Copy,
} from 'lucide-react';
import { ObrtIcon, ObrtBadge } from '../icons';
import {
  type UseOnboardingWizardReturn,
  PREDEFINED_DJELATNOSTI,
} from '../../hooks/useOnboardingWizard';
import {
  ONBOARDING_DIALOGUES,
  ONBOARDING_STEPS_META,
  ONBOARDING_EDUCATIONAL_TIPS,
  type OnboardingDialogueStep,
} from '../../services/onboarding-dialogues';
import { THEME_PRESETS } from '../../hooks/useTheme';

export interface OnboardingWizardModalProps {
  wizard: UseOnboardingWizardReturn;
  onThemeSelect?: (themeKey: string) => void;
  onIssueFirstInvoice?: () => void;
}

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  wizard,
  onThemeSelect,
  onIssueFirstInvoice,
}) => {
  const [isSuccessIssued, setIsSuccessIssued] = useState(false);
  const [showEducationalTip, setShowEducationalTip] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Zatvori savjet pri prelasku na drugi korak
  useEffect(() => {
    setShowEducationalTip(false);
  }, [wizard.step]);

  if (!wizard.isOpen) return null;

  const currentDialogue: OnboardingDialogueStep =
    ONBOARDING_DIALOGUES[wizard.step] || ONBOARDING_DIALOGUES[1]!;
  const currentEducationalTip = ONBOARDING_EDUCATIONAL_TIPS[wizard.step];

  const handleFinishFirstInvoice = async () => {
    setIsSuccessIssued(true);
    await wizard.completeOnboarding(onIssueFirstInvoice);
  };

  const handleCopyExample = () => {
    wizard.loadExampleData();
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (wizard.canGoNext) {
        wizard.goToNextStep();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200 no-print">
      {/* Glavni prozor čarobnjaka (760px širina, staklena dubrovačka kapsula s oštrim rubovima) */}
      <div className="relative w-full max-w-3xl bg-[var(--bg-surface)] border border-[var(--border-strong)] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col my-auto transition-all overflow-hidden">
        
        {/* ========================================================
            ZAGLAVLJE WIZARDA: Žigo Orlando Amblem & Kontrole Zvuka
           ======================================================== */}
        <div className="p-4 sm:p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="relative shrink-0">
              <ObrtBadge
                name="zigo-emblem"
                size={44}
                glow
                colorMode="gold"
                label="Žigo Orlando"
              />
              <span className="absolute -bottom-1 -right-1 bg-[#18191e] border border-[#b89758]/80 text-[#ffd700] text-[8px] font-mono font-black px-1 rounded-none shadow">
                GOSPAR
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight">Žigo Gospar</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#b89758]/20 border border-[#b89758]/40 text-[#ffd700]">
                  Vodič &bull; Korak {wizard.step} od {wizard.totalSteps}
                </span>
              </div>
              <p className="text-xs font-mono text-[var(--text-muted)]">
                Digitalni Orlando Kripto-Republike &bull; Postavljanje suverenog obrta
              </p>
            </div>
          </div>

          {/* Audio kontrole & izlaz */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={wizard.replaySpeech}
              title="Ponovi glasovnu repliku Žiga"
              className="w-8 h-8 flex items-center justify-center bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={wizard.toggleMute}
              title={wizard.isMuted ? 'Uključi glas Žiga' : 'Utišaj glas Žiga'}
              className={`w-8 h-8 flex items-center justify-center border transition-colors cursor-pointer ${
                wizard.isMuted
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[#ffd700]'
              }`}
            >
              {wizard.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={wizard.skipOnboarding}
              title="Preskoči čarobnjak i idi na radnu plohu"
              className="w-8 h-8 flex items-center justify-center bg-[var(--bg-canvas)] hover:bg-rose-500/20 border border-[var(--border-subtle)] hover:border-rose-500 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================
            ŽIGINA GOVORNA KARTICA (Dijaloški Mjehurić sa Zlatnim Akcentom)
           ======================================================== */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-[#1c1d22] via-[var(--bg-surface)] to-[#1c1d22] border-b border-[var(--border-subtle)] flex items-start gap-3.5">
          <div className="shrink-0 mt-0.5">
            <ObrtIcon name="telemetry-terminal" size={20} colorMode="gold" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#ffd700] uppercase tracking-wider">
                {currentDialogue.title}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">&bull; Orlando govori:</span>
            </div>
            <p className="text-sm text-slate-100 font-sans leading-relaxed">
              {currentDialogue.subtitle}
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono text-[#b89758]">
              <Sparkles className="w-3 h-3 text-[#ffd700]" />
              <span>{currentDialogue.mentorTip}</span>
            </div>
          </div>
        </div>

        {/* ========================================================
            KORACI PROGRESA (5 Pilula)
           ======================================================== */}
        <div className="px-4 sm:px-6 py-2 bg-[var(--bg-canvas)]/50 border-b border-[var(--border-subtle)] flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
          {ONBOARDING_STEPS_META.map(meta => {
            const isActive = wizard.step === meta.step;
            const isDone = wizard.step > meta.step;
            const isClickable = meta.step <= wizard.step || (meta.step === wizard.step + 1 && wizard.canGoNext);
            return (
              <button
                key={meta.step}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && wizard.setStep(meta.step)}
                className={`flex-1 py-1.5 px-2 text-center text-xs font-mono transition-all flex items-center justify-center gap-1.5 border-b-2 ${
                  isActive
                    ? 'border-[var(--accent-primary)] text-white font-bold bg-[var(--bg-elevated)] cursor-default'
                    : isDone
                    ? 'border-[#10B981] text-emerald-400 bg-emerald-500/5 cursor-pointer'
                    : isClickable
                    ? 'border-transparent text-slate-400 hover:text-slate-200 cursor-pointer'
                    : 'border-transparent text-slate-600 opacity-50 cursor-not-allowed'
                }`}
              >
                {isDone ? (
                  <Check className="w-3 h-3 text-[#10B981]" />
                ) : (
                  <span className="text-[10px] opacity-75">{meta.step}.</span>
                )}
                <span className="truncate">{meta.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================
            SADRŽAJ KORAKA (ČINOVI 1 DO 5)
           ======================================================== */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] space-y-5">
          
          {/* ČIN 1: Pozdrav & Odabir načina rada */}
          {wizard.step === 1 && (
            <div className="space-y-6 py-2">
              <div className="text-center space-y-2 max-w-lg mx-auto">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Kako želiš pokrenuti svoj obrt?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  ObrtnIQ je dizajniran da te oslobodi papirologije. Odaberi kako želiš započeti:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                {/* Opcija 1: Vođeni Wizard */}
                <div
                  onClick={wizard.goToNextStep}
                  className="p-4 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border-2 border-[var(--accent-primary)] hover:shadow-[0_0_20px_var(--icon-layer-glow)] cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 flex items-center justify-center bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]">
                      <Sparkles className="w-5 h-5 text-[var(--accent-primary)]" />
                    </div>
                    <h4 className="font-bold text-white text-sm group-hover:text-[var(--accent-primary)] transition-colors">
                      Vodi me korak po korak
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      Unesi OIB, IBAN i djelatnost uz Žiginu provjeru i izdaj prvi račun u 90 sekundi.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center text-xs font-mono font-bold text-[var(--accent-primary)]">
                    <span>Započni</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Opcija 2: Demo podaci */}
                <div
                  onClick={wizard.applyDemoData}
                  className="p-4 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#10B981] cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 flex items-center justify-center bg-[#10B981]/15 border border-[#10B981]/40">
                      <Zap className="w-5 h-5 text-[#10B981]" />
                    </div>
                    <h4 className="font-bold text-white text-sm group-hover:text-[#10B981] transition-colors">
                      Isprobaj s demo obrtom
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      Jednim klikom učitaj ogledni obrt "Orlando Libertas" s pripremljenim računom.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center text-xs font-mono font-bold text-[#10B981]">
                    <span>Učitaj demo</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Opcija 3: Preskoči */}
                <div
                  onClick={wizard.skipOnboarding}
                  className="p-4 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-slate-400 cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10">
                      <FileText className="w-5 h-5 text-slate-400" />
                    </div>
                    <h4 className="font-bold text-white text-sm group-hover:text-slate-200 transition-colors">
                      Znam sve, pusti me na plohu
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-mono">
                      Otvori praznu formu za unos računa odmah. Podatke obrta postavi kasnije.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center text-xs font-mono text-slate-400">
                    <span>Preskoči</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ČIN 2: Kapetan Obrta (Naziv, OIB i Sjedište) */}
          {wizard.step === 2 && (
            <div className="space-y-4">
              {/* Zaglavlje Čina 2 sa Žigovim savjetom */}
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    Temeljni podaci tvog obrta
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Podaci koji se ispisuju na tvojim računima i memorandumima.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEducationalTip(prev => !prev)}
                  className={`px-3 py-1.5 border text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                    showEducationalTip
                      ? 'bg-[#b89758]/25 border-[#ffd700] text-[#ffd700] shadow-[0_0_10px_rgba(255,215,0,0.2)]'
                      : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] hover:border-[#ffd700]/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-[#ffd700]" />
                  <span>{showEducationalTip ? 'Zatvori savjet' : '💡 Žigov savjet i primjer'}</span>
                </button>
              </div>

              {/* Edukativna kartica Žiga Gospara ako je aktivirana */}
              {showEducationalTip && currentEducationalTip && (
                <div className="p-4 bg-gradient-to-br from-[#1c1d22] to-[var(--bg-canvas)] border border-[#ffd700]/40 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#ffd700]" />
                        <h5 className="font-bold text-white text-xs font-mono tracking-wide uppercase">
                          {currentEducationalTip.title}
                        </h5>
                      </div>
                      <p className="text-xs text-slate-300 font-sans">
                        {currentEducationalTip.summary}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowEducationalTip(false)}
                      className="text-slate-400 hover:text-white p-1 cursor-pointer"
                      title="Zatvori savjet"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-300 font-mono list-disc pl-4">
                    {currentEducationalTip.details.map((detail, idx) => (
                      <li key={idx} className="leading-relaxed">{detail}</li>
                    ))}
                  </ul>

                  {/* Ogledni primjer & 1-klik kopiranje */}
                  <div className="p-3 bg-black/50 border border-[#b89758]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs font-mono space-y-0.5">
                      <span className="text-[10px] text-[#ffd700] uppercase font-bold block">Provjereni ogledni podaci:</span>
                      <div className="text-white font-medium">{currentEducationalTip.example.naziv}</div>
                      <div className="text-slate-400 text-[11px]">
                        OIB: <span className="text-emerald-400 font-mono font-bold">{currentEducationalTip.example.oib}</span> &bull; Vlasnik: {currentEducationalTip.example.vlasnik}
                      </div>
                      <div className="text-slate-400 text-[11px]">{currentEducationalTip.example.adresa}</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyExample}
                      className="px-3.5 py-2 bg-[#b89758]/20 hover:bg-[#b89758]/35 border border-[#ffd700]/70 hover:border-[#ffd700] text-[#ffd700] hover:text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedNotification ? '✓ Primjer prekopiran!' : '📋 Prekopiraj ovaj primjer u formu'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Naziv obrta */}
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      <span>Puni naziv obrta *</span>
                    </label>
                    {wizard.naziv.length > 0 ? (
                      <span className={`text-[10px] font-mono flex items-center gap-1 ${
                        wizard.naziv.trim().length >= 3 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {wizard.naziv.trim().length >= 3 ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ispravno</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            <span>Min. 3 znaka</span>
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">
                        Obavezno polje
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={wizard.naziv}
                    onChange={e => wizard.setNaziv(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="npr. Orlando Libertas, obrt za programiranje i savjetovanje"
                    className="w-full bg-[var(--bg-canvas)] border border-[var(--border-strong)] px-3 py-2 text-white text-sm focus:border-[var(--accent-primary)] focus:outline-none font-mono"
                  />
                </div>

                {/* Vlasnik */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-slate-300">
                      Ime i prezime vlasnika *
                    </label>
                    {wizard.vlasnikImePrezime.length > 0 ? (
                      <span className={`text-[10px] font-mono flex items-center gap-1 ${
                        wizard.vlasnikImePrezime.trim().split(/\s+/).filter(Boolean).length >= 2 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {wizard.vlasnikImePrezime.trim().split(/\s+/).filter(Boolean).length >= 2 ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ispravno</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            <span>Unesi i prezime</span>
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">
                        Obavezno polje
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={wizard.vlasnikImePrezime}
                    onChange={e => wizard.setVlasnikImePrezime(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="npr. Vlaho Sorkočević"
                    className="w-full bg-[var(--bg-canvas)] border border-[var(--border-strong)] px-3 py-2 text-white text-sm focus:border-[var(--accent-primary)] focus:outline-none font-mono"
                  />
                </div>

                {/* OIB */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-slate-300">
                      OIB obrta / vlasnika (11 znamenki) *
                    </label>
                    {wizard.oib.length === 0 ? (
                      <span className="text-[10px] font-mono text-slate-500">
                        Upiši 11 znamenki
                      </span>
                    ) : wizard.oib.length < 11 ? (
                      <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                        <span>{wizard.oib.length} / 11 znamenki</span>
                      </span>
                    ) : (
                      <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                        wizard.isOibValid ? 'text-[#10B981]' : 'text-rose-400'
                      }`}>
                        {wizard.isOibValid ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>ISO MOD 11 Ispravan</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            <span>Neispravna kontrolna znamenka</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={wizard.oib}
                    onChange={e => wizard.setOib(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    maxLength={11}
                    placeholder="11 znamenki (npr. 69435151530)"
                    className={`w-full bg-[var(--bg-canvas)] border px-3 py-2 text-white text-sm font-mono tracking-wider focus:outline-none ${
                      wizard.oib.length === 11
                        ? wizard.isOibValid
                          ? 'border-[#10B981] focus:border-[#10B981]'
                          : 'border-rose-500 focus:border-rose-500'
                        : 'border-[var(--border-strong)] focus:border-[var(--accent-primary)]'
                    }`}
                  />
                </div>

                {/* Ulica i broj */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Ulica i kućni broj</label>
                  <input
                    type="text"
                    value={wizard.ulicaIBroj}
                    onChange={e => wizard.setUlicaIBroj(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="npr. Placa Stradun 1"
                    className="w-full bg-[var(--bg-canvas)] border border-[var(--border-strong)] px-3 py-2 text-white text-sm focus:border-[var(--accent-primary)] focus:outline-none font-mono"
                  />
                </div>

                {/* Poštanski broj i mjesto */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Poštanski broj</label>
                    <input
                      type="text"
                      value={wizard.postanskiBroj}
                      onChange={e => wizard.setPostanskiBroj(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      placeholder="npr. 20000"
                      className="w-full bg-[var(--bg-canvas)] border border-[var(--border-strong)] px-3 py-2 text-white text-sm focus:border-[var(--accent-primary)] focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Mjesto</label>
                    <input
                      type="text"
                      value={wizard.mjesto}
                      onChange={e => wizard.setMjesto(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      placeholder="npr. Dubrovnik"
                      className="w-full bg-[var(--bg-canvas)] border border-[var(--border-strong)] px-3 py-2 text-white text-sm focus:border-[var(--accent-primary)] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ČIN 3: KPR, Banka i Djelatnost */}
          {wizard.step === 3 && (
            <div className="space-y-4">
              {/* Zaglavlje Čina 3 sa Žigovim savjetom */}
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    Financijski račun i KPD djelatnost
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Poslovni IBAN za uplate kupaca i službena šifra prema KPD 2025.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEducationalTip(prev => !prev)}
                  className={`px-3 py-1.5 border text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                    showEducationalTip
                      ? 'bg-[#b89758]/25 border-[#ffd700] text-[#ffd700] shadow-[0_0_10px_rgba(255,215,0,0.2)]'
                      : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] hover:border-[#ffd700]/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-[#ffd700]" />
                  <span>{showEducationalTip ? 'Zatvori savjet' : '💡 Žigov savjet i primjer'}</span>
                </button>
              </div>

              {/* Edukativna kartica Čina 3 */}
              {showEducationalTip && currentEducationalTip && (
                <div className="p-4 bg-gradient-to-br from-[#1c1d22] to-[var(--bg-canvas)] border border-[#ffd700]/40 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#ffd700]" />
                        <h5 className="font-bold text-white text-xs font-mono tracking-wide uppercase">
                          {currentEducationalTip.title}
                        </h5>
                      </div>
                      <p className="text-xs text-slate-300 font-sans">
                        {currentEducationalTip.summary}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowEducationalTip(false)}
                      className="text-slate-400 hover:text-white p-1 cursor-pointer"
                      title="Zatvori savjet"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-300 font-mono list-disc pl-4">
                    {currentEducationalTip.details.map((detail, idx) => (
                      <li key={idx} className="leading-relaxed">{detail}</li>
                    ))}
                  </ul>

                  {/* Ogledni primjer & 1-klik kopiranje */}
                  <div className="p-3 bg-black/50 border border-[#b89758]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs font-mono space-y-0.5">
                      <span className="text-[10px] text-[#ffd700] uppercase font-bold block">Provjereni ogledni podaci:</span>
                      <div className="text-white font-medium">{currentEducationalTip.example.naziv}</div>
                      <div className="text-slate-400 text-[11px]">
                        IBAN: <span className="text-emerald-400 font-mono font-bold">{currentEducationalTip.example.iban}</span> (Zagrebačka banka)
                      </div>
                      <div className="text-slate-400 text-[11px]">{currentEducationalTip.example.djelatnost}</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyExample}
                      className="px-3.5 py-2 bg-[#b89758]/20 hover:bg-[#b89758]/35 border border-[#ffd700]/70 hover:border-[#ffd700] text-[#ffd700] hover:text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedNotification ? '✓ Primjer prekopiran!' : '📋 Prekopiraj ovaj primjer u formu'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* IBAN */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Transakcijski račun (HR IBAN) *</span>
                  </label>
                  {wizard.iban.length === 0 ? (
                    <span className="text-[10px] font-mono text-slate-500">
                      Upiši HR IBAN (21 znak)
                    </span>
                  ) : wizard.iban.length < 21 ? (
                    <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                      <span>{wizard.iban.length} / 21 znakova</span>
                    </span>
                  ) : (
                    <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                      wizard.isIbanValid ? 'text-[#10B981]' : 'text-rose-400'
                    }`}>
                      {wizard.isIbanValid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{wizard.detectedBank || 'IBAN Valjan'}</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Neispravan IBAN (MOD 97)</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={wizard.iban}
                  onChange={e => wizard.setIban(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  maxLength={21}
                  placeholder="HR6023600001101234567"
                  className={`w-full bg-[var(--bg-canvas)] border px-3 py-2 text-white text-sm font-mono tracking-wider focus:outline-none ${
                    wizard.iban.length >= 21
                      ? wizard.isIbanValid
                        ? 'border-[#10B981] focus:border-[#10B981]'
                        : 'border-rose-500 focus:border-rose-500'
                      : 'border-[var(--border-strong)] focus:border-[var(--accent-primary)]'
                  }`}
                />
              </div>

              {/* Djelatnost i KPD 2025 šifra */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-mono text-slate-300 block">
                  Odaberi primarnu djelatnost obrta (automatski dodjeljuje službenu KPD 2025 šifru):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PREDEFINED_DJELATNOSTI.map(item => {
                    const isSelected = wizard.selectedDjelatnostId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => wizard.selectDjelatnost(item.id)}
                        className={`p-3 border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[var(--bg-elevated)] border-[var(--accent-primary)] shadow-[0_0_12px_var(--icon-layer-glow)]'
                            : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] hover:border-slate-400'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{item.naziv}</span>
                            <span className="text-[10px] font-mono px-1 bg-black/40 border border-white/10 text-[var(--accent-primary)]">
                              KPD {item.kpdSifra}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {item.kpdNaziv}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ČIN 4: Memorandum, Teme & Pečat */}
          {wizard.step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#ffd700]" />
                  <span>Odaberi dubrovačku temu aplikacije:</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {THEME_PRESETS.map(theme => {
                    const isSelected = wizard.selectedTheme === theme.key;
                    return (
                      <button
                        key={theme.key}
                        type="button"
                        onClick={() => {
                          wizard.setSelectedTheme(theme.key);
                          onThemeSelect?.(theme.key);
                        }}
                        className={`p-2.5 border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                          isSelected
                            ? 'bg-[var(--bg-elevated)] border-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.3)]'
                            : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] hover:border-slate-400'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: theme.previewColor }}
                        />
                        <span className="text-xs font-mono font-medium text-white truncate">
                          {theme.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status pečata i potpisa */}
              <div className="p-3 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                  <div>
                    <h5 className="text-xs font-bold text-white font-mono">Digitalni Pečat Kripto-Republike</h5>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Automatski se generira na A4 memorandumu uz OIB i podatke obrta.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] font-bold">
                  UKLJUČENO
                </span>
              </div>
            </div>
          )}

          {/* ČIN 5: Prvi Rez — Izdavanje prvog računa */}
          {wizard.step === 5 && (
            <div className="space-y-5">
              {!isSuccessIssued ? (
                <>
                  <div className="p-4 bg-[var(--bg-canvas)] border border-[#b89758]/50 shadow-inner space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-[#ffd700]" />
                        <span className="font-mono font-bold text-sm text-white">RAČUN BR. 1-1-1</span>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 border border-emerald-500/30">
                        SPREMNO ZA IZDAVANJE
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Izdavatelj:</span>
                        <span className="font-bold text-white block truncate">{wizard.naziv || 'Moj Obrt'}</span>
                        <span className="text-slate-400 block">OIB: {wizard.oib || '69435151530'}</span>
                        <span className="text-slate-400 block truncate">{wizard.iban}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Kupac (Ogledni partner):</span>
                        <span className="font-bold text-white block">Domaći Kupac d.o.o.</span>
                        <span className="text-slate-400 block">OIB: 12345678901</span>
                        <span className="text-slate-400 block">Plaćanje: Transakcijski</span>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-2 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-white block font-bold">{wizard.kpdNaziv}</span>
                        <span className="text-[10px] text-[#ffd700]">KPD {wizard.kpdSifra} &bull; 1 kom &times; 100,00 €</span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-white font-mono">100,00 €</span>
                        <span className="text-[9px] text-slate-400 block">Ne podliježe PDV-u</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={handleFinishFirstInvoice}
                      className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#b89758] via-[#ffd700] to-[#b89758] hover:opacity-95 text-black font-mono font-black text-sm tracking-wide shadow-[0_0_25px_rgba(255,215,0,0.4)] transition-all cursor-pointer uppercase flex items-center justify-center gap-2 mx-auto"
                    >
                      <span>⚔️ IZDAJ MOJ PRVI RAČUN (F2)</span>
                    </button>
                    <p className="text-[11px] text-slate-400 font-mono mt-2">
                      Klikom na gumb račun se sprema u lokalnu bazu i otvara Knjigu prometa (KPR).
                    </p>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 mx-auto bg-emerald-500/20 border-2 border-[#10B981] flex items-center justify-center rounded-full shadow-[0_0_20px_#10B981]">
                    <Check className="w-8 h-8 text-[#10B981]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white tracking-tight">
                      Čestitam, gosparu! Led je probijen!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto font-mono">
                      Tvoj prvi račun je arhiviran, Knjiga prometa je pokrenuta, a tvoj obrt je suveren.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={wizard.closeWizard}
                    className="px-6 py-2.5 bg-[var(--accent-primary)] hover:opacity-90 text-black font-mono font-bold text-xs uppercase cursor-pointer"
                  >
                    Uđi na Radnu Plohu (Home) &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================
            PODNOŽJE WIZARDA: Navigacija (Nazad / Dalje / Preskoči)
           ======================================================== */}
        <div className="p-4 sm:p-5 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)]/80 flex items-center justify-between gap-3">
          <div>
            {wizard.step > 1 && !isSuccessIssued && (
              <button
                type="button"
                onClick={wizard.goToPrevStep}
                className="px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-slate-300 hover:text-white text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Nazad</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {wizard.step < wizard.totalSteps && (
              <>
                {!wizard.canGoNext && (
                  <span className="text-[11px] font-mono text-amber-400/90 hidden sm:inline-block">
                    {wizard.step === 2
                      ? '⚠ Popuni naziv, vlasnika i valjani 11-znamenkasti OIB.'
                      : wizard.step === 3
                      ? '⚠ Popuni valjani HR IBAN (21 znak).'
                      : 'Popuni obavezna polja za nastavak.'}
                  </span>
                )}

                <button
                  type="button"
                  onClick={wizard.skipOnboarding}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors cursor-pointer"
                >
                  Preskoči
                </button>

                <button
                  type="button"
                  disabled={!wizard.canGoNext}
                  onClick={wizard.goToNextStep}
                  className={`px-5 py-2 font-mono font-bold text-xs transition-all flex items-center gap-1.5 shadow ${
                    wizard.canGoNext
                      ? 'bg-[var(--accent-primary)] hover:opacity-90 text-black cursor-pointer'
                      : 'bg-white/10 text-slate-500 cursor-not-allowed border border-white/5 opacity-60'
                  }`}
                  title={!wizard.canGoNext ? 'Unesi valjane podatke ili učitaj primjer za nastavak' : 'Idi na sljedeći korak'}
                >
                  <span>Sljedeći korak</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
