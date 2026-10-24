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
  FolderOpen,
  Cloud,
  Sparkles,
  LogIn,
  LogOut,
  ExternalLink,
  Flame,
  Eye,
  EyeOff,
  Activity
} from 'lucide-react';
import type { ObrtProfil } from '@obrtniq/core';
import { OibInput, IbanInput } from './controls';
import type { UseObrtProfileReturn } from '../hooks/useObrtProfile';
import { useBackupRestore, type RestoreSummary } from '../hooks/useBackupRestore';
import { useGoogleAuth, type UseGoogleAuthReturn } from '../hooks/useGoogleAuth';
import { useGoogleDriveSync, type UseGoogleDriveSyncReturn } from '../hooks/useGoogleDriveSync';
import { useGeminiAssistant, type UseGeminiAssistantReturn } from '../hooks/useGeminiAssistant';
import { googleAuthService } from '../services/google-auth-service';
import { googleDriveService } from '../services/google-drive-service';

export interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  obrtProfileHook: UseObrtProfileReturn;
  googleAuthHook?: UseGoogleAuthReturn;
  driveSyncHook?: UseGoogleDriveSyncReturn;
  geminiHook?: UseGeminiAssistantReturn;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  obrtProfileHook,
  googleAuthHook,
  driveSyncHook,
  geminiHook,
}) => {
  const { profil, saveProfil, resetToDefault } = obrtProfileHook;
  const [activeTab, setActiveTab] = useState<'osnovno' | 'poslovanje' | 'memorandum' | 'backup' | 'cloud'>('osnovno');
  const [formData, setFormData] = useState<ObrtProfil>(profil);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Google, Drive & Gemini Hooks (koriste proslijeđene ili fallback instance)
  const internalGoogleAuth = useGoogleAuth();
  const googleAuth = googleAuthHook || internalGoogleAuth;

  const internalDriveSync = useGoogleDriveSync(googleAuth.identity, googleAuth.getAccessToken);
  const driveSync = driveSyncHook || internalDriveSync;

  const internalGemini = useGeminiAssistant();
  const gemini = geminiHook || internalGemini;

  // Backup & Restore hook i stanja
  const backupHook = useBackupRestore();
  const [backupPassword, setBackupPassword] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [isEncryptedFile, setIsEncryptedFile] = useState<boolean | null>(null);
  const [restoreSummary, setRestoreSummary] = useState<RestoreSummary | null>(null);
  const [resetConfirmInput, setResetConfirmInput] = useState('');

  // Cloud & AI stanja
  const [customClientIdInput, setCustomClientIdInput] = useState(googleAuth.clientId);
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState(gemini.apiKey);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiTestStatus, setGeminiTestStatus] = useState<string | null>(null);
  const [drivePinInput, setDrivePinInput] = useState('');

  // Dijagnostika API-ja i dozvola
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagResult, setDiagResult] = useState<{
    clientIdValid: boolean;
    clientIdMsg?: string;
    tokenInfo?: { ok: boolean; scopes: string[]; email?: string; error?: string };
    driveApi?: { ok: boolean; statusText: string; enableUrl?: string };
    geminiApi?: { ok: boolean; msg: string };
  } | null>(null);

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

  // Google Auth Handlers
  const handleGoogleLogin = async () => {
    if (!googleAuth.hasCustomClientId) {
      alert(
        'Za prijavu stvarnim Google računom potrebno je unijeti vaš besplatni Google Cloud Client ID u "Naprednim postavkama" ispod.\n\nZa trenutno testiranje svih mogućnosti (kripto-sidro, AES-256 enkripcija, Drive sync) bez konfiguracije kliknite "Isprobaj Demo Prijavu"!'
      );
      return;
    }
    try {
      await googleAuth.login();
    } catch {
      // Greška je zabilježena u hooku
    }
  };

  const handleSaveClientId = () => {
    googleAuth.setClientId(customClientIdInput);
    alert('Google Client ID spremljen.');
  };

  // Google Drive Sync Handlers
  const handleSyncToDrive = async () => {
    try {
      await driveSync.syncToDrive(drivePinInput || undefined);
      alert('Baza podataka uspješno je sinkronizirana na Google Drive!');
    } catch {
      // Greška je zabilježena u hooku
    }
  };

  const handleRestoreFromDrive = async (fileId: string) => {
    const confirmed = confirm(
      'POZOR: Vraćanje baze s Google Drivea zamijenit će trenutne lokalne podatke. Želite li nastaviti?'
    );
    if (!confirmed) return;
    try {
      await driveSync.restoreFromDrive(fileId, drivePinInput || undefined);
      alert('Baza podataka uspješno je vraćena s Google Drivea!');
      window.location.reload();
    } catch {
      // Greška je zabilježena u hooku
    }
  };

  // Gemini AI Handlers
  const handleSaveGeminiKey = () => {
    gemini.setApiKey(geminiApiKeyInput);
    alert('Gemini API ključ spremljen lokalno u preglednik.');
  };

  const handleTestGeminiKey = async () => {
    setGeminiTestStatus('TESTING');
    const ok = await gemini.testKey(geminiApiKeyInput);
    if (ok) {
      setGeminiTestStatus('SUCCESS');
      setTimeout(() => setGeminiTestStatus(null), 4000);
    } else {
      setGeminiTestStatus('ERROR');
    }
  };

  // Dijagnostika Google i Gemini API-ja
  const handleRunDiagnostics = async () => {
    setIsDiagnosing(true);
    setDiagResult(null);

    const formatCheck = googleAuthService.validateClientIdFormat(googleAuth.clientId);
    let tokenRes: { ok: boolean; scopes: string[]; email?: string; error?: string } | undefined;
    let driveRes: { ok: boolean; statusText: string; enableUrl?: string } | undefined;
    let geminiRes: { ok: boolean; msg: string } | undefined;

    const token = await googleAuth.getAccessToken();
    if (token) {
      const inspected = await googleAuthService.inspectToken(token);
      tokenRes = {
        ok: inspected.ok,
        scopes: inspected.scopes,
        email: inspected.email,
        error: inspected.error,
      };

      const driveCheck = await googleDriveService.testDriveApiAccess(token);
      driveRes = {
        ok: driveCheck.ok,
        statusText: driveCheck.statusText,
        enableUrl: driveCheck.enableUrl,
      };
    }

    if (gemini.apiKey) {
      const ok = await gemini.testKey(gemini.apiKey);
      geminiRes = {
        ok,
        msg: ok
          ? 'Gemini API ključ je valjan i model uspješno odgovara.'
          : 'Gemini API poziv nije uspio (provjerite ključ ili kvotu na AI Studio).',
      };
    }

    setDiagResult({
      clientIdValid: formatCheck.valid,
      clientIdMsg: formatCheck.message,
      tokenInfo: tokenRes,
      driveApi: driveRes,
      geminiApi: geminiRes,
    });
    setIsDiagnosing(false);
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
              className={`flex-1 py-3 px-2 flex items-center justify-center gap-1 border-b-2 font-semibold transition-all ${
                activeTab === 'backup'
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-surface)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4 text-[#10B981]" />
              4. Trezor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cloud')}
              className={`flex-1 py-3 px-2 flex items-center justify-center gap-1 border-b-2 font-semibold transition-all ${
                activeTab === 'cloud'
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-surface)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <Cloud className="w-4 h-4 text-[#4285F4]" />
              5. Google &amp; AI
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

            {/* TAB 5: Google Račun, Drive & Gemini AI (Faza 10) */}
            {activeTab === 'cloud' && (
              <div className="space-y-6">
                {/* 0. Dijagnostika API-ja i dozvola (Automatska provjera servisa) */}
                <div className="p-4 bg-[var(--bg-canvas)] border border-cyan-500/30 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
                          <span>Dijagnostika API-ja &amp; Dozvola</span>
                          <span className="text-[10px] bg-cyan-950 text-cyan-400 px-1.5 py-0.2 border border-cyan-500/30">
                            Health Check
                          </span>
                        </h3>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                          Automatska provjera valjanosti Google Client ID-a, tokena, Google Drive API-ja i Gemini AI ključa.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRunDiagnostics}
                      disabled={isDiagnosing}
                      className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer flex-shrink-0"
                    >
                      {isDiagnosing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Activity className="w-3.5 h-3.5" />
                      )}
                      Pokreni Dijagnostiku
                    </button>
                  </div>

                  {/* Informacije: Koje API-je omogućiti */}
                  <details className="text-[11px] font-mono bg-[var(--bg-surface)] p-3 border border-[var(--border-subtle)]">
                    <summary className="cursor-pointer font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5">
                      ℹ Koje Google API-je trebate omogućiti u konzoli?
                    </summary>
                    <div className="mt-2 space-y-2 text-[var(--text-secondary)] leading-relaxed">
                      <p>
                        U <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noreferrer" className="text-[var(--accent-primary)] underline">Google Cloud Console &gt; APIs &amp; Services &gt; Library</a> omogućite:
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>
                          <b className="text-white">Google Drive API</b> (<code className="text-xs text-amber-300">drive.googleapis.com</code>) — <b className="text-white">Obavezno</b> za oblak sinkronizaciju baze u skrivenu <code className="text-xs">appDataFolder</code> mapu.
                        </li>
                        <li>
                          <b className="text-white">Google Identity / User Profile</b> — Uključeno automatski samom konfiguracijom OAuth zaslona suglasnosti (OAuth consent screen - scopes: <i>openid, email, profile</i>).
                        </li>
                        <li>
                          <b className="text-white">Gemini AI Asistent</b> — <b className="text-emerald-400">NE zahtijeva</b> Google Cloud Console API! Koristi besplatni BYOK ključ s <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[var(--accent-primary)] underline">Google AI Studio</a> (bez potrebe za platnom karticom ili billing računom).
                        </li>
                      </ul>
                    </div>
                  </details>

                  {/* Rezultati dijagnostike */}
                  {diagResult && (
                    <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)] text-xs font-mono">
                      {/* 1. Client ID format */}
                      <div className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {diagResult.clientIdValid ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            )}
                            <span>1. Google Client ID Format</span>
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                            {diagResult.clientIdMsg || (diagResult.clientIdValid ? 'Format Client ID-a je ispravan.' : 'Nevažeći format.')}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold border ${diagResult.clientIdValid ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/40' : 'bg-amber-950 text-amber-400 border-amber-500/40'}`}>
                          {diagResult.clientIdValid ? 'ISPRAVAN' : 'UPOZORENJE'}
                        </span>
                      </div>

                      {/* 2. Token & Scopes */}
                      <div className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {diagResult.tokenInfo?.ok ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            )}
                            <span>2. OAuth Token &amp; Dozvole (Scopes)</span>
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] font-bold border ${diagResult.tokenInfo?.ok ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                            {diagResult.tokenInfo?.ok ? 'AKTIVAN TOKEN' : 'NIJE PRIJAVLJEN'}
                          </span>
                        </div>
                        {diagResult.tokenInfo ? (
                          diagResult.tokenInfo.ok ? (
                            <div className="text-[11px] text-[var(--text-secondary)] space-y-1">
                              <div>Korisnik: <span className="text-white">{diagResult.tokenInfo.email || googleAuth.identity?.email}</span></div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {diagResult.tokenInfo.scopes.map((sc) => (
                                  <span key={sc} className="px-1.5 py-0.5 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[10px] text-cyan-300">
                                    {sc.split('/').pop()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-[#EF4444]">{diagResult.tokenInfo.error}</div>
                          )
                        ) : (
                          <div className="text-[11px] text-[var(--text-muted)]">
                            Za inspekciju OAuth tokena prijavite se pravim ili demo Google računom.
                          </div>
                        )}
                      </div>

                      {/* 3. Google Drive API */}
                      <div className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {diagResult.driveApi?.ok ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                            ) : diagResult.driveApi ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
                            ) : (
                              <Cloud className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            )}
                            <span>3. Google Drive API (appDataFolder)</span>
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] font-bold border ${diagResult.driveApi?.ok ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/40' : diagResult.driveApi ? 'bg-red-950 text-[#EF4444] border-[#EF4444]/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                            {diagResult.driveApi?.ok ? 'DOSTUPAN' : diagResult.driveApi ? 'NIJE OMOGUĆEN' : 'ČEKA PRIJAVU'}
                          </span>
                        </div>
                        {diagResult.driveApi ? (
                          <div className="text-[11px] space-y-1">
                            <div className={diagResult.driveApi.ok ? 'text-[#10B981]' : 'text-amber-300'}>
                              {diagResult.driveApi.statusText}
                            </div>
                            {diagResult.driveApi.enableUrl && (
                              <a
                                href={diagResult.driveApi.enableUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent-primary)] hover:underline mt-1 bg-[var(--bg-canvas)] px-2.5 py-1 border border-[var(--accent-primary)]/40"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Kliknite ovdje za uključivanje Google Drive API-ja u Google Cloud Console
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-[var(--text-muted)]">
                            Testira se automatski kada se prijavite Google računom.
                          </div>
                        )}
                      </div>

                      {/* 4. Gemini AI Studio */}
                      <div className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {diagResult.geminiApi?.ok ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                            ) : diagResult.geminiApi ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            )}
                            <span>4. Google AI Studio (Gemini)</span>
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                            {diagResult.geminiApi?.msg || (gemini.apiKey ? 'Spreman za test' : 'Ključ nije unesen')}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold border ${diagResult.geminiApi?.ok ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/40' : diagResult.geminiApi ? 'bg-red-950 text-[#EF4444] border-[#EF4444]/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {diagResult.geminiApi?.ok ? 'POVEZANO' : diagResult.geminiApi ? 'GREŠKA' : 'NIJE POSTAVLJENO'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 1. Google Identity & Kripto Sidro (Zero-Server Auth) */}
                <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded bg-[#4285F4]/20 border border-[#4285F4]/40 flex items-center justify-center text-[#4285F4] flex-shrink-0">
                      <LogIn className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
                        <span>Google Identity &amp; Kriptografsko Sidro</span>
                        <span className="text-[10px] bg-[#1E3A8A] text-[#60A5FA] px-1.5 py-0.2 border border-[#60A5FA]/30">
                          Zero-Server Auth
                        </span>
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                        Povezuje vaš jedinstveni Google ID (sub) s lokalnom bazom za izvođenje AES-256-GCM ključa i besplatnu Drive sinkronizaciju.
                      </p>
                    </div>
                  </div>

                  {googleAuth.identity ? (
                    <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-strong)] space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {googleAuth.identity.pictureUrl ? (
                            <img
                              src={googleAuth.identity.pictureUrl}
                              alt="Avatar"
                              className="w-10 h-10 rounded-full object-cover border border-[var(--border-subtle)]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#4285F4] text-white flex items-center justify-center font-bold">
                              {googleAuth.identity.name ? googleAuth.identity.name.charAt(0) : 'G'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white text-sm">
                              {googleAuth.identity.name}
                            </div>
                            <div className="text-[var(--text-muted)] text-[11px]">
                              {googleAuth.identity.email}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={googleAuth.logout}
                          className="px-3 py-1.5 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-[#EF4444] border border-[#EF4444]/40 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Odjavi se
                        </button>
                      </div>

                      <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1 text-[11px] text-[var(--text-secondary)]">
                        <div>
                          Google Kripto Sidro (sub):{' '}
                          <code className="text-[var(--accent-primary)] font-bold">
                            {googleAuth.identity.googleSub}
                          </code>
                        </div>
                        <div>
                          Povezano:{' '}
                          <span className="text-white">
                            {googleAuth.identity.connectedAt
                              ? new Date(googleAuth.identity.connectedAt).toLocaleString('hr-HR')
                              : 'Aktivno'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
                      {googleAuth.error && (
                        <div className="p-2.5 bg-[#7F1D1D]/40 border border-[#EF4444] text-[#EF4444] text-xs font-mono">
                          {googleAuth.error}
                        </div>
                      )}

                      {!googleAuth.hasCustomClientId && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-xs font-mono space-y-1.5">
                          <div className="text-amber-400 font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Za prijavu vlastitim Google računom potreban je Client ID</span>
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                            Za trenutno testiranje svih mogućnosti (kripto-sidro, AES-256 enkripcija i Drive sync) bez konfiguracije kliknite <b>"Isprobaj Demo Prijavu"</b>.
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                          type="button"
                          onClick={handleGoogleLogin}
                          disabled={googleAuth.isLoading}
                          className="flex-1 px-4 py-2 bg-[#4285F4] hover:bg-[#3367D6] disabled:opacity-50 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          <LogIn className="w-4 h-4" />
                          Prijavi se putem Google računa
                        </button>

                        <button
                          type="button"
                          onClick={googleAuth.loginDemo}
                          className="px-3 py-2 bg-[#064E3B] hover:bg-[#047857] text-[#10B981] border border-[#10B981]/40 font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm"
                          title="Simulira Google prijavu za testiranje bez unosa Google Client ID-a"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Isprobaj Demo Prijavu
                        </button>
                      </div>

                      <details className="text-[11px] font-mono text-[var(--text-muted)] pt-1" open={!googleAuth.hasCustomClientId}>
                        <summary className="cursor-pointer hover:text-white font-bold text-[var(--text-secondary)]">
                          ▶ Napredne postavke: Vlastiti Google OAuth Client ID
                        </summary>
                        <div className="mt-2 space-y-3 p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                              Google Cloud Client ID:
                            </label>
                            <div className="flex gap-2 mt-1">
                              <input
                                type="text"
                                value={customClientIdInput}
                                onChange={(e) => setCustomClientIdInput(e.target.value)}
                                placeholder="123456789-xyz.apps.googleusercontent.com"
                                className="flex-1 bg-[var(--bg-canvas)] text-white px-2.5 py-1.5 text-xs font-mono border border-[var(--border-strong)] outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleSaveClientId}
                                className="px-3 py-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-mono font-bold cursor-pointer transition-all"
                              >
                                Spremi
                              </button>
                            </div>
                          </div>

                          <div className="p-2.5 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1 text-[10px] text-[var(--text-muted)]">
                            <b className="text-white">Kako dobiti besplatni Google Client ID (2 min):</b>
                            <ol className="list-decimal pl-4 space-y-0.5">
                              <li>Otvorite <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-[var(--accent-primary)] underline">Google Cloud Console</a>.</li>
                              <li>Kliknite <b>Create Credentials &gt; OAuth client ID</b> (Tip: <i>Web application</i>).</li>
                              <li>U <b>Authorized JavaScript origins</b> dodajte: <code className="text-white">http://localhost:5173</code></li>
                              <li>Kopirajte Client ID, zalijepite ga gore i kliknite <b>Spremi</b>.</li>
                            </ol>
                          </div>
                        </div>
                      </details>
                    </div>
                  )}
                </div>

                {/* 2. Google Drive AppData Trezor (Besplatna Skrivena Pohrana) */}
                <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] flex-shrink-0">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
                        <span>Google Drive AppData Trezor</span>
                        <span className="text-[10px] bg-[#064E3B] text-[#10B981] px-1.5 py-0.2 border border-[#10B981]/30">
                          15 GB Besplatno
                        </span>
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                        Pohranjuje se u skrivenu mapu appDataFolder vašeg Google Drivea, nevidljivu u regularnom sučelju i zaštićenu AES-256-GCM enkripcijom.
                      </p>
                    </div>
                  </div>

                  {driveSync.error && (
                    <div className="p-2.5 bg-[#7F1D1D]/40 border border-[#EF4444] text-[#EF4444] text-xs font-mono flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{driveSync.error}</span>
                    </div>
                  )}

                  <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex-1 flex gap-2">
                        <input
                          type="password"
                          value={drivePinInput}
                          onChange={(e) => setDrivePinInput(e.target.value)}
                          placeholder="Opcionalni PIN za dodatno šifriranje..."
                          className="w-full bg-[var(--bg-surface)] text-white px-3 py-2 font-mono text-xs border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSyncToDrive}
                        disabled={!googleAuth.identity || driveSync.isSyncing}
                        className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-black font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer flex-shrink-0"
                      >
                        {driveSync.isSyncing ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Cloud className="w-4 h-4" />
                        )}
                        Sinkroniziraj na Google Drive
                      </button>
                    </div>

                    {driveSync.lastSyncTime && (
                      <div className="text-[11px] font-mono text-[#10B981] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          Zadnja uspješna sinkronizacija: {new Date(driveSync.lastSyncTime).toLocaleString('hr-HR')}
                        </span>
                      </div>
                    )}

                    {/* Popis sigurnosnih kopija na Driveu */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)] font-semibold mb-2">
                        <span>Spremljene verzije u AppData mapi ({driveSync.driveBackups.length}):</span>
                        <button
                          type="button"
                          onClick={driveSync.refreshDriveBackups}
                          className="text-[11px] text-[var(--accent-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Osvježi
                        </button>
                      </div>

                      {driveSync.driveBackups.length === 0 ? (
                        <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)] text-center">
                          Nema pronađenih sigurnosnih kopija u appDataFolder mapi. Prijavite se i kliknite &quot;Sinkroniziraj&quot; za izradu prve kopije.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {driveSync.driveBackups.map((f) => (
                            <div
                              key={f.id}
                              className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 font-mono text-xs"
                            >
                              <div className="truncate">
                                <div className="text-white font-semibold truncate">{f.name}</div>
                                <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-2">
                                  <span>{new Date(f.createdTime).toLocaleString('hr-HR')}</span>
                                  {f.size && <span>&bull; {f.size}</span>}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRestoreFromDrive(f.id)}
                                disabled={driveSync.isSyncing}
                                className="px-2.5 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-white border border-[var(--border-strong)] text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-all flex-shrink-0"
                              >
                                <RefreshCw className="w-3 h-3 text-[var(--accent-primary)]" />
                                Vrati ovu verziju
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Google AI Studio (Gemini Asistent BYOK) */}
                <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6] flex-shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
                        <span>Google AI Studio &bull; Gemini Asistent</span>
                        <span className="text-[10px] bg-[#4C1D95] text-[#C4B5FD] px-1.5 py-0.2 border border-[#C4B5FD]/30">
                          BYOK Model
                        </span>
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                        Bring-Your-Own-Key model: Koristite besplatni Gemini API ključ za automatsku preporuku KPD 2025 šifri i analizu uplatnica. Ključ ostaje isključivo na vašem računalu.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
                    <div>
                      <div className="flex justify-between items-center text-xs font-mono text-[var(--text-secondary)] font-semibold mb-1">
                        <label>Gemini API Ključ (Google AI Studio)</label>
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                        >
                          Preuzmite besplatan ključ <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showGeminiKey ? 'text' : 'password'}
                            value={geminiApiKeyInput}
                            onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full bg-[var(--bg-surface)] text-white px-3 py-2 pr-9 font-mono text-xs border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGeminiKey(!showGeminiKey)}
                            className="absolute right-2.5 top-2.5 text-[var(--text-muted)] hover:text-white"
                          >
                            {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveGeminiKey}
                          className="px-3.5 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-white border border-[var(--border-strong)] text-xs font-mono font-bold cursor-pointer"
                        >
                          Spremi
                        </button>
                        <button
                          type="button"
                          onClick={handleTestGeminiKey}
                          disabled={gemini.isAnalyzing || !geminiApiKeyInput}
                          className="px-3.5 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          {gemini.isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          Testiraj
                        </button>
                      </div>

                      {geminiTestStatus === 'SUCCESS' && (
                        <div className="mt-2 text-xs font-mono text-[#10B981] flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Povezivanje s Gemini modelom uspješno! Asistent je spreman.</span>
                        </div>
                      )}
                      {geminiTestStatus === 'ERROR' && gemini.error && (
                        <div className="mt-2 text-xs font-mono text-[#EF4444] flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{gemini.error}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[var(--text-secondary)] font-semibold mb-1">
                        Odabir Gemini AI Modela
                      </label>
                      <select
                        value={gemini.model}
                        onChange={(e) => gemini.setModel(e.target.value)}
                        className="w-full bg-[var(--bg-surface)] text-white px-3 py-2 font-mono text-xs border border-[var(--border-strong)] outline-none"
                      >
                        <option value="gemini-2.0-flash">gemini-2.0-flash (Najbrži, najprecizniji, besplatna kvota)</option>
                        <option value="gemini-1.5-flash">gemini-1.5-flash (Stabilan, standardni kontekst)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. Firebase / Firestore (Opcionalna Priprema) */}
                <details className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] font-mono text-xs">
                  <summary className="font-bold uppercase text-[var(--text-secondary)] cursor-pointer flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#F59E0B]" />
                    <span>Opcionalno: Firebase Cloud Firestore Postavke</span>
                  </summary>
                  <p className="text-[11px] text-[var(--text-muted)] mt-2">
                    Predviđeno za napredne korisnike koji žele uspostaviti vlastiti besplatni Firebase projekt za real-time replikaciju.
                  </p>
                  <div className="space-y-2 mt-3 pt-2 border-t border-[var(--border-subtle)]">
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] block">Firebase API Key:</label>
                      <input
                        type="text"
                        placeholder="AIzaSy..."
                        className="w-full bg-[var(--bg-surface)] text-white px-2.5 py-1.5 text-xs font-mono border border-[var(--border-strong)] outline-none mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] block">Project ID:</label>
                      <input
                        type="text"
                        placeholder="moj-obrt-firebase"
                        className="w-full bg-[var(--bg-surface)] text-white px-2.5 py-1.5 text-xs font-mono border border-[var(--border-strong)] outline-none mt-0.5"
                      />
                    </div>
                  </div>
                </details>
              </div>
            )}

            {/* Bottom Actions - only for profile editing tabs */}
            {activeTab !== 'backup' && activeTab !== 'cloud' && (
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
