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
  Save,
  Shield,
  Lock,
  Download,
  Key,
  AlertTriangle,
  FileJson,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import type { ObrtProfil } from '@obrtniq/core';
import { OibInput, IbanInput } from './controls';
import type { UseObrtProfileReturn } from '../hooks/useObrtProfile';
import { useBackupRestore, type RestoreSummary } from '../hooks/useBackupRestore';

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
  const [activeTab, setActiveTab] = useState<'osnovno' | 'poslovanje' | 'memorandum' | 'backup'>('osnovno');
  const [formData, setFormData] = useState<ObrtProfil>(profil);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Backup & Restore hook i stanja
  const backupHook = useBackupRestore();
  const [backupPassword, setBackupPassword] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [isEncryptedFile, setIsEncryptedFile] = useState<boolean | null>(null);
  const [restoreSummary, setRestoreSummary] = useState<RestoreSummary | null>(null);
  const [resetConfirmInput, setResetConfirmInput] = useState('');

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

  // Backup / Restore Handlers
  const handleExportEncrypted = async () => {
    if (!backupPassword || backupPassword.trim().length < 4) {
      alert('Molimo unesite lozinku od najmanje 4 znaka za enkripciju sigurnosne kopije.');
      return;
    }
    try {
      await backupHook.exportEncryptedBackup(backupPassword);
      setBackupPassword('');
    } catch {
      // Greška je evidentirana u hooku
    }
  };

  const handleExportJson = async () => {
    try {
      await backupHook.exportJsonSnapshot();
    } catch {
      // Greška je evidentirana u hooku
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFile(file);
    setRestoreSummary(null);
    try {
      const inspect = await backupHook.inspectBackupFile(file);
      setIsEncryptedFile(inspect.isEncrypted);
    } catch {
      setIsEncryptedFile(null);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      alert('Molimo odaberite datoteku sigurnosne kopije.');
      return;
    }
    if (isEncryptedFile && (!restorePassword || restorePassword.trim().length === 0)) {
      alert('Unesite lozinku za dekripciju sigurnosne kopije.');
      return;
    }
    const confirmed = confirm(
      'POZOR: Obnova iz sigurnosne kopije zamijenit će podatke u lokalnoj bazi. Želite li nastaviti?'
    );
    if (!confirmed) return;

    try {
      const summary = await backupHook.restoreFromFile(restoreFile, restorePassword);
      setRestoreSummary(summary);
      setRestorePassword('');
      // Ponovno učitaj profil obrta u formu
      const updatedProfil = await obrtProfileHook.profil;
      setFormData(updatedProfil);
    } catch {
      // Greška je evidentirana u hooku
    }
  };

  const handleResetDb = async () => {
    if (resetConfirmInput !== 'OBRISI') {
      alert('Za potvrdu trajnog brisanja morate upisati točno riječ OBRISI.');
      return;
    }
    const confirmed = confirm(
      'Jeste li STVARNO sigurni da želite nepovratno obrisati sve račune, KPR i partnere iz lokalne baze?'
    );
    if (!confirmed) return;

    await backupHook.resetDatabase();
    setResetConfirmInput('');
    alert('Baza podataka je ispražnjena.');
    window.location.reload();
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
              className={`flex-1 py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 font-semibold transition-all ${
                activeTab === 'memorandum'
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-surface)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              3. Memorandum
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`flex-1 py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 font-semibold transition-all ${
                activeTab === 'backup'
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-surface)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4 text-[#10B981]" />
              4. Backup &amp; Trezor
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

            {/* TAB 4: Sigurnosna Kopija & Trezor Podataka (Faza 9) */}
            {activeTab === 'backup' && (
              <div className="space-y-6">
                {/* Statusne obavijesti */}
                {backupHook.lastActionStatus && (
                  <div className="p-3 bg-[#064E3B]/40 border border-[#10B981] text-[#10B981] text-xs font-mono flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{backupHook.lastActionStatus}</span>
                  </div>
                )}
                {backupHook.error && (
                  <div className="p-3 bg-[#7F1D1D]/40 border border-[#EF4444] text-[#EF4444] text-xs font-mono flex items-center gap-2 animate-fade-in">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{backupHook.error}</span>
                  </div>
                )}

                {/* 1. Kriptirani AES-256 Sigurnosni Backup */}
                <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] flex-shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
                        <span>Kriptirana Sigurnosna Kopija (.obrtniq)</span>
                        <span className="text-[10px] bg-[#064E3B] text-[#10B981] px-1.5 py-0.2 border border-[#10B981]/40">
                          AES-256-GCM
                        </span>
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                        Zaštićeno PBKDF2 izvođenjem ključa (100.000 iteracija). Sve račune, KPR, partnere i cjenik zaključava vašom tajnom lozinkom.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                    <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block">
                      Lozinka za zaštitu sigurnosne kopije *
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Key className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                        <input
                          type="password"
                          value={backupPassword}
                          onChange={(e) => setBackupPassword(e.target.value)}
                          placeholder="Unesite tajnu lozinku (min. 4 znaka)..."
                          className="w-full bg-[var(--bg-surface)] text-white pl-9 pr-3.5 py-2 font-mono text-xs border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleExportEncrypted}
                        disabled={backupHook.isProcessing || !backupPassword}
                        className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer flex-shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Preuzmi .obrtniq
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Otvoreni JSON Snapshot */}
                <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-primary)] flex-shrink-0">
                        <FileJson className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-mono font-bold uppercase text-white">
                          Otvoreni JSON Snapshot (Za knjigovodstvo)
                        </h3>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                          Standardni nekriptirani JSON format za vanjski softver, knjigovodstveni uvid ili arhivu.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportJson}
                      disabled={backupHook.isProcessing}
                      className="px-3.5 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-white border border-[var(--border-strong)] font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      Preuzmi JSON
                    </button>
                  </div>
                </div>

                {/* 3. Uvoz i Obnova Baze (Restore) */}
                <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-[#3B82F6]/20 border border-[#3B82F6]/40 flex items-center justify-center text-[#3B82F6] flex-shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-mono font-bold uppercase text-white">
                        Uvoz i Obnova Podataka (Restore)
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                        Odaberite prethodno spremljenu .obrtniq ili .json sigurnosnu kopiju.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <label className="flex-1 px-3 py-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-dashed border-[var(--border-strong)] hover:border-[#3B82F6] cursor-pointer flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                        <FolderOpen className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                        <span className="truncate">
                          {restoreFile ? restoreFile.name : 'Odaberite .obrtniq ili .json datoteku...'}
                        </span>
                        <input
                          type="file"
                          accept=".obrtniq,.json"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>

                      {isEncryptedFile && (
                        <input
                          type="password"
                          value={restorePassword}
                          onChange={(e) => setRestorePassword(e.target.value)}
                          placeholder="Lozinka za otključavanje..."
                          className="w-full sm:w-48 bg-[var(--bg-surface)] text-white px-3 py-2 font-mono text-xs border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                        />
                      )}

                      <button
                        type="button"
                        onClick={handleRestore}
                        disabled={backupHook.isProcessing || !restoreFile}
                        className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer flex-shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Obnovi Podatke
                      </button>
                    </div>

                    {restoreSummary && (
                      <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5 font-mono text-xs">
                        <div className="text-[#10B981] font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Podaci uspješno obnovljeni:</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[var(--text-secondary)] pt-1">
                          <div>Dokumenti: <b className="text-white">{restoreSummary.dokumentiCount}</b></div>
                          <div>KPR uplate: <b className="text-white">{restoreSummary.kprCount}</b></div>
                          <div>Partneri: <b className="text-white">{restoreSummary.partneriCount}</b></div>
                          <div>Artikli: <b className="text-white">{restoreSummary.artikliCount}</b></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Opasna Zona: Brisanje Lokalne Baze */}
                <div className="p-4 bg-[var(--bg-canvas)] border border-[#EF4444]/40 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-[#EF4444]/20 border border-[#EF4444]/40 flex items-center justify-center text-[#EF4444] flex-shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-mono font-bold uppercase text-[#EF4444]">
                        Opasna Zona: Tvorničko Brisanje Baze
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                        Trajno i nepovratno briše sve lokalno spremljene podatke na ovom uređaju.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                    <label className="text-[11px] font-mono text-[var(--text-muted)] block">
                      Za potvrdu upišite riječ <b className="text-white font-mono">OBRISI</b>:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={resetConfirmInput}
                        onChange={(e) => setResetConfirmInput(e.target.value)}
                        placeholder="OBRISI"
                        className="w-36 bg-[var(--bg-surface)] text-white px-3 py-1.5 font-mono text-xs border border-[var(--border-strong)] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleResetDb}
                        disabled={resetConfirmInput !== 'OBRISI' || backupHook.isProcessing}
                        className="px-3.5 py-1.5 bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-30 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Isprazni Bazu Podataka
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions - only for profile editing tabs */}
            {activeTab !== 'backup' && (
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
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
