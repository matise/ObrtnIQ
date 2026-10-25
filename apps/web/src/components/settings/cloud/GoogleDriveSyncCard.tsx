import React, { useState } from 'react';
import {
  Cloud,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { UseGoogleAuthReturn } from '../../../hooks/useGoogleAuth';
import type { UseGoogleDriveSyncReturn } from '../../../hooks/useGoogleDriveSync';
import { appLogger } from '../../../services/logger';

export interface GoogleDriveSyncCardProps {
  googleAuth: UseGoogleAuthReturn;
  driveSync: UseGoogleDriveSyncReturn;
}

export const GoogleDriveSyncCard: React.FC<GoogleDriveSyncCardProps> = ({
  googleAuth,
  driveSync,
}) => {
  const loggerDrive = appLogger.scope('SETTINGS:DRIVE');
  const [drivePinInput, setDrivePinInput] = useState('');

  const handleSyncToDrive = async () => {
    const t0 = performance.now();
    loggerDrive.info('Pokretanje sinkronizacije baze na Google Drive', {
      imaZastitniPin: !!drivePinInput,
    });
    try {
      await driveSync.syncToDrive(drivePinInput || undefined);
      const trajanjeMs = Math.round(performance.now() - t0);
      loggerDrive.info('Baza podataka uspješno sinkronizirana na Google Drive', { trajanjeMs });
      alert('Baza podataka uspješno je sinkronizirana na Google Drive!');
    } catch (err: any) {
      loggerDrive.error('Sinkronizacija na Google Drive nije uspjela:', { error: err?.message });
    }
  };

  const handleRestoreFromDrive = async (fileId: string) => {
    const confirmed = confirm(
      'POZOR: Vraćanje baze s Google Drivea zamijenit će trenutne lokalne podatke. Želite li nastaviti?'
    );
    if (!confirmed) {
      loggerDrive.info('Korisnik odustao od vraćanja baze s Google Drivea');
      return;
    }
    const t0 = performance.now();
    loggerDrive.warn('Pokretanje obnove baze s Google Drivea', { fileId, imaZastitniPin: !!drivePinInput });
    try {
      await driveSync.restoreFromDrive(fileId, drivePinInput || undefined);
      const trajanjeMs = Math.round(performance.now() - t0);
      loggerDrive.info('Baza podataka uspješno vraćena s Google Drivea', { fileId, trajanjeMs });
      alert('Baza podataka uspješno je vraćena s Google Drivea!');
      window.location.reload();
    } catch (err: any) {
      loggerDrive.error('Vraćanje baze s Google Drivea nije uspjelo:', { error: err?.message });
    }
  };

  const handleRefreshDriveBackups = async () => {
    loggerDrive.info('Osvježavanje popisa sigurnosnih kopija na Google Driveu');
    await driveSync.refreshDriveBackups();
  };

  return (
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
        <div className="p-2.5 bg-[#7F1D1D]/40 border border-[#EF4444] text-[#EF4444] text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{driveSync.error}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {(driveSync.error.includes('401') || driveSync.error.includes('istek') || driveSync.error.includes('autorizir')) && (
              <button
                type="button"
                onClick={() => googleAuth.login()}
                className="px-2.5 py-1 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-all shadow-sm"
              >
                <RefreshCw className="w-3 h-3" />
                Obnovi prijavu
              </button>
            )}
            {driveSync.error.includes('enable it by visiting') && (
              <a
                href={driveSync.error.match(/https:\/\/[^\s]+/)?.[0] || 'https://console.cloud.google.com/apis/library/drive.googleapis.com'}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[11px] font-mono flex items-center gap-1 transition-all"
              >
                Aktiviraj Drive API
              </a>
            )}
          </div>
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
              onClick={handleRefreshDriveBackups}
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
  );
};
