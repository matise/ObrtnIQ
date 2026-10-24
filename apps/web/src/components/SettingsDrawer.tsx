import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  CheckCircle2,
  RotateCcw,
  Save,
} from 'lucide-react';
import type { ObrtProfil } from '@obrtniq/core';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGoogleDriveSync } from '../hooks/useGoogleDriveSync';
import { useGeminiAssistant } from '../hooks/useGeminiAssistant';
import { appLogger } from '../services/logger';
import type { SettingsDrawerProps, SettingsTabId } from './settings/types';
import { SettingsTabsNav } from './settings/SettingsTabsNav';
import { OsnovniPodaciTab } from './settings/tabs/OsnovniPodaciTab';
import { PoslovanjeTab } from './settings/tabs/PoslovanjeTab';
import { MemorandumTab } from './settings/tabs/MemorandumTab';
import { BackupRestoreTab } from './settings/tabs/BackupRestoreTab';
import { CloudAiTab } from './settings/tabs/CloudAiTab';

export type { SettingsDrawerProps, SettingsTabId } from './settings/types';

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  obrtProfileHook,
  googleAuthHook,
  driveSyncHook,
  geminiHook,
}) => {
  const { profil, saveProfil, resetToDefault } = obrtProfileHook;
  const [activeTab, setActiveTab] = useState<SettingsTabId>('osnovno');
  const [formData, setFormData] = useState<ObrtProfil>(profil);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Scoped Loggeri za postavke
  const logger = appLogger.scope('SETTINGS');
  const loggerProfile = appLogger.scope('SETTINGS:PROFILE');
  const loggerMemorandum = appLogger.scope('SETTINGS:MEMORANDUM');

  // Google, Drive & Gemini Hooks (koriste proslijeđene ili fallback instance)
  const internalGoogleAuth = useGoogleAuth();
  const googleAuth = googleAuthHook || internalGoogleAuth;

  const internalDriveSync = useGoogleDriveSync(googleAuth.identity, googleAuth.getAccessToken);
  const driveSync = driveSyncHook || internalDriveSync;

  const internalGemini = useGeminiAssistant();
  const gemini = geminiHook || internalGemini;

  useEffect(() => {
    setFormData(profil);
  }, [profil, isOpen]);

  useEffect(() => {
    if (isOpen) {
      logger.info('Otvoren prozor postavki obrta', { aktivniTab: activeTab });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTabChange = (tab: SettingsTabId) => {
    logger.debug('Korisnik promijenio tab postavki', { prethodniTab: activeTab, noviTab: tab });
    setActiveTab(tab);
  };

  const handleTextChange = (field: keyof ObrtProfil, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setSavedSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    loggerProfile.info('Spremanje profila obrta', {
      naziv: formData.naziv,
      oib: formData.oib,
      ibanPostavljen: !!formData.iban,
      uSustavuPdv: formData.uSustavuPdv,
      jePausalist: formData.jePausalist,
    });
    try {
      await saveProfil(formData);
      setSavedSuccess(true);
      loggerProfile.info('Profil obrta uspješno spremljen');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      loggerProfile.error('Greška pri spremanju profila obrta:', { error: err?.message });
    }
  };

  const handleReset = async () => {
    const confirmReset = confirm('Jeste li sigurni da želite vratiti profil obrta na tvorničke postavke?');
    if (!confirmReset) {
      loggerProfile.debug('Korisnik odustao od tvorničkog reseta profila obrta');
      return;
    }
    loggerProfile.warn('Korisnik potvrdio tvornički reset profila obrta na početne vrijednosti');
    try {
      await resetToDefault();
      setFormData(profil);
      loggerProfile.info('Profil obrta uspješno vraćen na početno');
    } catch (err: any) {
      loggerProfile.error('Greška pri vraćanju profila obrta na početno:', { error: err?.message });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoImageData' | 'pecatPotpisImageData') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      loggerMemorandum.warn('Učitavanje slike memoranduma odbijeno: premašuje 500 KB', {
        polje: field,
        velicinaKb: Math.round(file.size / 1024),
        maxKb: 500,
      });
      alert('Veličina slike ne smije premašiti 500 KB.');
      return;
    }

    loggerMemorandum.info('Učitavanje datoteke slike memoranduma', {
      polje: field,
      naziv: file.name,
      velicinaKb: Math.round(file.size / 1024),
    });

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormData((prev) => ({ ...prev, [field]: base64 }));
      setSavedSuccess(false);
      loggerMemorandum.info('Slika memoranduma uspješno pročitana u Base64', { polje: field });
    };
    reader.onerror = (err) => {
      loggerMemorandum.error('Greška pri čitanju datoteke slike memoranduma:', { error: err });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (field: 'logoImageData' | 'pecatPotpisImageData') => {
    loggerMemorandum.info(`Uklonjena slika memoranduma: ${field}`);
    handleTextChange(field, undefined);
  };

  const handleProfileUpdated = async () => {
    const updated = await obrtProfileHook.profil;
    setFormData(updated);
    loggerProfile.info('Profil obrta ponovno sinkroniziran nakon obnove baze');
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
              <div className="w-8 h-8 rounded bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-mono font-bold uppercase tracking-wider text-white">
                  Postavke Obrta &amp; Poslovanja
                </h2>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  Konfiguracija računa, memoranduma, sigurnosne kopije i oblaka
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <SettingsTabsNav
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isGoogleAuthenticated={!!googleAuth.identity}
          />

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
              <OsnovniPodaciTab
                formData={formData}
                onChange={handleTextChange}
              />
            )}

            {/* TAB 2: Poslovanje & Račun */}
            {activeTab === 'poslovanje' && (
              <PoslovanjeTab
                formData={formData}
                onChange={handleTextChange}
              />
            )}

            {/* TAB 3: Logo & Pečat */}
            {activeTab === 'memorandum' && (
              <MemorandumTab
                formData={formData}
                onFileUpload={handleFileUpload}
                onRemoveImage={handleRemoveImage}
              />
            )}

            {/* TAB 4: Sigurnosna Kopija & Trezor Podataka */}
            {activeTab === 'backup' && (
              <BackupRestoreTab
                onProfileUpdated={handleProfileUpdated}
              />
            )}

            {/* TAB 5: Google Račun, Drive & Gemini AI */}
            {activeTab === 'cloud' && (
              <CloudAiTab
                googleAuth={googleAuth}
                driveSync={driveSync}
                gemini={gemini}
              />
            )}

            {/* Bottom Actions - only for profile editing tabs */}
            {activeTab !== 'backup' && activeTab !== 'cloud' && (
              <div className="pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Vrati na Početno
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-black font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Spremi Promjene
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
