import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Building2, 
  CreditCard, 
  Image as ImageIcon, 
  CheckCircle2, 
  Upload, 
  Trash2, 
  RotateCcw,
  Save
} from 'lucide-react';
import type { ObrtProfil } from '@obrtniq/core';
import { OibInput, IbanInput } from './controls';
import type { UseObrtProfileReturn } from '../hooks/useObrtProfile';

export interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  obrtProfileHook: UseObrtProfileReturn;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  obrtProfileHook,
}) => {
  const { profil, saveProfil, resetToDefault } = obrtProfileHook;
  const [activeTab, setActiveTab] = useState<'osnovno' | 'poslovanje' | 'memorandum'>('osnovno');
  const [formData, setFormData] = useState<ObrtProfil>(profil);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setFormData(profil);
  }, [profil, isOpen]);

  if (!isOpen) return null;

  const handleTextChange = (field: keyof ObrtProfil, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setSavedSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfil(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = async () => {
    const confirmReset = confirm('Jeste li sigurni da želite vratiti profil obrta na tvorničke postavke?');
    if (!confirmReset) return;
    await resetToDefault();
    setFormData(profil);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoImageData' | 'pecatPotpisImageData') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert('Veličina slike ne smije premašiti 500 KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormData((prev) => ({ ...prev, [field]: base64 }));
      setSavedSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-[var(--bg-surface)] border-l border-[var(--border-strong)] text-white flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)]/40">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-primary)]">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-base tracking-tight flex items-center gap-2">
                  Postavke Obrta &amp; Memorandum
                </h2>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  Upravljanje profilom, bankovnim računom i vizualnim identitetom
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] font-mono text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('osnovno')}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 font-semibold transition-all ${
                activeTab === 'osnovno'
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-surface)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              1. Osnovni Podaci
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('poslovanje')}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 font-semibold transition-all ${
                activeTab === 'poslovanje'
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-surface)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              2. Račun &amp; Poslovni Prostor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('memorandum')}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 font-semibold transition-all ${
                activeTab === 'memorandum'
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-surface)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              3. Logo &amp; Pečat
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
            {savedSuccess && (
              <div className="p-3 bg-[#064E3B]/40 border border-[#10B981] text-[#10B981] text-xs font-mono flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Postavke profila uspješno spremljene u Dexie bazu!</span>
              </div>
            )}

            {/* TAB 1: Osnovni podaci */}
            {activeTab === 'osnovno' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
                    Puni Naziv Obrta *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.naziv}
                    onChange={(e) => handleTextChange('naziv', e.target.value)}
                    placeholder="npr. Robot Hand Made, obrt za računalno programiranje"
                    className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
                      Vlasnik (Ime i Prezime) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.vlasnikImePrezime}
                      onChange={(e) => handleTextChange('vlasnikImePrezime', e.target.value)}
                      placeholder="npr. Matija Obrtović"
                      className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                    />
                  </div>

                  <OibInput
                    value={formData.oib}
                    onChange={(val) => handleTextChange('oib', val)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
                      Ulica i Kućni Broj *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.ulicaIBroj}
                      onChange={(e) => handleTextChange('ulicaIBroj', e.target.value)}
                      placeholder="Ulica grada Vukovara 284"
                      className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
                      Poštanski Broj *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.postanskiBroj}
                      onChange={(e) => handleTextChange('postanskiBroj', e.target.value)}
                      placeholder="40000"
                      className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
                      Mjesto / Grad *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.mjesto}
                      onChange={(e) => handleTextChange('mjesto', e.target.value)}
                      placeholder="Čakovec"
                      className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
                      Država (ISO 3166-1)
                    </label>
                    <input
                      type="text"
                      value={formData.drzavaIso}
                      onChange={(e) => handleTextChange('drzavaIso', e.target.value)}
                      className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
                      Službeni Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleTextChange('email', e.target.value)}
                      placeholder="info@robothandmade.hr"
                      className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
                      Kontakt Telefon
                    </label>
                    <input
                      type="text"
                      value={formData.telefon || ''}
                      onChange={(e) => handleTextChange('telefon', e.target.value)}
                      placeholder="+385 91 123 4567"
                      className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Poslovanje & Račun */}
            {activeTab === 'poslovanje' && (
              <div className="space-y-4">
                <IbanInput
                  value={formData.iban}
                  onChange={(val, _valid, bank) => {
                    handleTextChange('iban', val);
                    if (bank) handleTextChange('bankaNaziv', bank);
                  }}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
                      Oznaka Poslovnog Prostora *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.poslovniProstorOznaka}
                      onChange={(e) => handleTextChange('poslovniProstorOznaka', e.target.value)}
                      placeholder="npr. POSL1"
                      className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
                      Oznaka Naplatnog Uređaja *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.naplatniUredjajOznaka}
                      onChange={(e) => handleTextChange('naplatniUredjajOznaka', e.target.value)}
                      placeholder="npr. 1"
                      className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3">
                  <span className="text-xs font-mono text-[var(--accent-primary)] font-semibold block">
                    Porezni Status
                  </span>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="jePausalist"
                      checked={formData.jePausalist}
                      onChange={(e) => handleTextChange('jePausalist', e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--border-strong)] accent-[var(--accent-primary)]"
                    />
                    <label htmlFor="jePausalist" className="text-xs font-mono text-slate-200">
                      Paušalno oporezivanje samostalne djelatnosti (Dohodak)
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="uSustavuPdv"
                      checked={formData.uSustavuPdv}
                      onChange={(e) => handleTextChange('uSustavuPdv', e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--border-strong)] accent-[var(--accent-primary)]"
                    />
                    <label htmlFor="uSustavuPdv" className="text-xs font-mono text-slate-200">
                      U sustavu PDV-a (redovni obveznik PDV-a)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Logo & Pečat */}
            {activeTab === 'memorandum' && (
              <div className="space-y-6">
                {/* 1. Logotip */}
                <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-white font-bold block">
                        Logotip Obrta (Zaglavlje Računa)
                      </span>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono">
                        PNG, JPG ili SVG do 500 KB. Prikazuje se u gornjem kutu računa.
                      </p>
                    </div>
                    {formData.logoImageData && (
                      <button
                        type="button"
                        onClick={() => handleTextChange('logoImageData', undefined)}
                        className="text-xs font-mono text-[#EF4444] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Ukloni logo
                      </button>
                    )}
                  </div>

                  {formData.logoImageData ? (
                    <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center max-h-32 overflow-hidden">
                      <img
                        src={formData.logoImageData}
                        alt="Logotip obrta"
                        className="max-h-24 max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--accent-primary)] p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[var(--bg-elevated)]/20">
                      <Upload className="w-6 h-6 text-[var(--text-muted)] mb-2" />
                      <span className="text-xs font-mono text-[var(--accent-primary)] font-semibold">
                        Kliknite za odabir logotipa
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
                        Preporučene dimenzije: 300x100 px
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        onChange={(e) => handleFileUpload(e, 'logoImageData')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* 2. Digitalni Pečat i Potpis */}
                <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-white font-bold block">
                        Digitalni Pečat i Potpis Vlasnika
                      </span>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono">
                        PNG s prozirnom pozadinom. Prikazuje se na dnu A4 računa.
                      </p>
                    </div>
                    {formData.pecatPotpisImageData && (
                      <button
                        type="button"
                        onClick={() => handleTextChange('pecatPotpisImageData', undefined)}
                        className="text-xs font-mono text-[#EF4444] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Ukloni pečat
                      </button>
                    )}
                  </div>

                  {formData.pecatPotpisImageData ? (
                    <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center max-h-32 overflow-hidden">
                      <img
                        src={formData.pecatPotpisImageData}
                        alt="Pečat i potpis"
                        className="max-h-24 max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--accent-primary)] p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[var(--bg-elevated)]/20">
                      <Upload className="w-6 h-6 text-[var(--text-muted)] mb-2" />
                      <span className="text-xs font-mono text-[var(--accent-primary)] font-semibold">
                        Kliknite za učitavanje pečata/potpisa
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
                        Preporučeno: prozirni PNG (transparent background)
                      </span>
                      <input
                        type="file"
                        accept="image/png"
                        onChange={(e) => handleFileUpload(e, 'pecatPotpisImageData')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="border-t border-[var(--border-subtle)] pt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-white border border-[var(--border-subtle)] text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Vrati tvorničke postavke
              </button>

              <button
                type="submit"
                className="px-6 py-2 bg-[var(--accent-primary)] text-black font-bold font-mono text-xs hover:bg-[var(--accent-primary-hover)] transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" />
                Spremi Sve Izmjene
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
