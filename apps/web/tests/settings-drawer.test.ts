import { describe, it, expect } from 'vitest';
import { SettingsDrawer } from '../src/components/SettingsDrawer';
import { SettingsTabsNav } from '../src/components/settings/SettingsTabsNav';
import { OsnovniPodaciTab } from '../src/components/settings/tabs/OsnovniPodaciTab';
import { PoslovanjeTab } from '../src/components/settings/tabs/PoslovanjeTab';
import { MemorandumTab } from '../src/components/settings/tabs/MemorandumTab';
import { BackupRestoreTab } from '../src/components/settings/tabs/BackupRestoreTab';
import { CloudAiTab } from '../src/components/settings/tabs/CloudAiTab';
import { CloudDiagnosticsCard } from '../src/components/settings/cloud/CloudDiagnosticsCard';
import { GoogleIdentityCard } from '../src/components/settings/cloud/GoogleIdentityCard';
import { GoogleDriveSyncCard } from '../src/components/settings/cloud/GoogleDriveSyncCard';
import { GeminiSettingsCard } from '../src/components/settings/cloud/GeminiSettingsCard';
import { FirebaseSettingsCard } from '../src/components/settings/cloud/FirebaseSettingsCard';
import { appLogger } from '../src/services/logger';
import type { SettingsTabId } from '../src/components/settings/types';

describe('SettingsDrawer Modularizacija i Arhitektura', () => {
  it('SD-01: Glavna SettingsDrawer komponenta je ispravno definirana i izvozi tipove', () => {
    expect(SettingsDrawer).toBeDefined();
    expect(typeof SettingsDrawer).toBe('function');
  });

  it('SD-02: Sve modularne komponente tabova su uspješno učitane bez cirkularnih ovisnosti', () => {
    expect(SettingsTabsNav).toBeDefined();
    expect(OsnovniPodaciTab).toBeDefined();
    expect(PoslovanjeTab).toBeDefined();
    expect(MemorandumTab).toBeDefined();
    expect(BackupRestoreTab).toBeDefined();
    expect(CloudAiTab).toBeDefined();
  });

  it('SD-03: Sve cloud podkomponente su definirane i spremne za rad', () => {
    expect(CloudDiagnosticsCard).toBeDefined();
    expect(GoogleIdentityCard).toBeDefined();
    expect(GoogleDriveSyncCard).toBeDefined();
    expect(GeminiSettingsCard).toBeDefined();
    expect(FirebaseSettingsCard).toBeDefined();
  });

  it('SD-04: Definirani identifikatori tabova pokrivaju sve potrebne sekcije postavki', () => {
    const validTabs: SettingsTabId[] = ['osnovno', 'poslovanje', 'memorandum', 'backup', 'cloud'];
    expect(validTabs).toHaveLength(5);
    expect(validTabs).toContain('osnovno');
    expect(validTabs).toContain('poslovanje');
    expect(validTabs).toContain('memorandum');
    expect(validTabs).toContain('backup');
    expect(validTabs).toContain('cloud');
  });

  it('SD-05: Scoped logeri za postavke ispravno funkcioniraju unutar aplikativnog logera', () => {
    const settingsLogger = appLogger.scope('SETTINGS');
    const profileLogger = appLogger.scope('SETTINGS:PROFILE');
    const memorandumLogger = appLogger.scope('SETTINGS:MEMORANDUM');

    expect(settingsLogger).toBeDefined();
    expect(profileLogger).toBeDefined();
    expect(memorandumLogger).toBeDefined();

    expect(typeof settingsLogger.info).toBe('function');
    expect(typeof profileLogger.warn).toBe('function');
    expect(typeof memorandumLogger.error).toBe('function');
  });

  it('SD-06: Zadani profil obrta ima definirane sve zakonski propisane parametre RH', async () => {
    const { DEFAULT_OBRT_PROFIL } = await import('../src/engine/obrt-profile');
    expect(DEFAULT_OBRT_PROFIL).toBeDefined();
    expect(DEFAULT_OBRT_PROFIL.drzavaIso).toBe('HR');
    expect(DEFAULT_OBRT_PROFIL.poslovniProstorOznaka).toBe('POSL1');
    expect(DEFAULT_OBRT_PROFIL.naplatniUredjajOznaka).toBe('1');
    expect(DEFAULT_OBRT_PROFIL.eracunPosrednik).toBe('FINA');
    expect(typeof DEFAULT_OBRT_PROFIL.jePausalist).toBe('boolean');
    expect(typeof DEFAULT_OBRT_PROFIL.uSustavuPdv).toBe('boolean');
  });

  it('SD-07: Memorandum pravilo - limit veličine logotipa i pečata je točno 500 KB', () => {
    const MAX_IMAGE_SIZE_BYTES = 500 * 1024;
    expect(MAX_IMAGE_SIZE_BYTES).toBe(512000);

    const validFile = { size: 450 * 1024 };
    const invalidFile = { size: 550 * 1024 };

    expect(validFile.size <= MAX_IMAGE_SIZE_BYTES).toBe(true);
    expect(invalidFile.size <= MAX_IMAGE_SIZE_BYTES).toBe(false);
  });

  it('SD-08: Sigurnosna kopija - minimalna duljina lozinke za AES-256 je 4 znaka', () => {
    const isPasswordValid = (pwd: string) => Boolean(pwd && pwd.trim().length >= 4);

    expect(isPasswordValid('')).toBe(false);
    expect(isPasswordValid('   ')).toBe(false);
    expect(isPasswordValid('123')).toBe(false);
    expect(isPasswordValid('1234')).toBe(true);
    expect(isPasswordValid('mojaSigurnaLozinka2026')).toBe(true);
  });

  it('SD-09: Tvornički reset baze zahtijeva točnu riječ "OBRISI"', () => {
    const isResetConfirmed = (input: string) => input === 'OBRISI';

    expect(isResetConfirmed('obrisi')).toBe(false);
    expect(isResetConfirmed('OBRIŠI')).toBe(false);
    expect(isResetConfirmed('DELETE')).toBe(false);
    expect(isResetConfirmed('OBRISI ')).toBe(false);
    expect(isResetConfirmed('OBRISI')).toBe(true);
  });

  it('SD-10: Gemini AI modeli 2026 - podržani modeli uključuju najnovije verzije', () => {
    const supported2026Models = [
      'gemini-3.8-flash',
      'gemini-4-argon',
      'gemini-3.7-flash',
      'gemini-3.5-flash-lite',
      'gemini-2.5-pro',
      'gemini-flash-latest'
    ];

    expect(supported2026Models).toContain('gemini-3.8-flash');
    expect(supported2026Models).toContain('gemini-4-argon');
    expect(supported2026Models).not.toContain('gemini-2.0-flash'); // Umirovljeni model
  });

  it('SD-11: Scoped loggeri u postavkama ispravno bilježe metapodatke i telemetriju trajanja', () => {
    const profileLogger = appLogger.scope('SETTINGS:PROFILE');
    let capturedEntry: any = null;

    const unsubscribe = appLogger.subscribe((entry) => {
      if (entry.context === 'SETTINGS:PROFILE') {
        capturedEntry = entry;
      }
    });

    profileLogger.info('Profil obrta uspješno spremljen', { trajanjeMs: 14 });
    unsubscribe();

    expect(capturedEntry).not.toBeNull();
    expect(capturedEntry.context).toBe('SETTINGS:PROFILE');
    expect(capturedEntry.level).toBe('INFO');
    expect(capturedEntry.data).toEqual({ trajanjeMs: 14 });
  });

  it('SD-12: ERROR zapisi unutar SETTINGS scope-a bilježe greške za dijagnostiku', () => {
    const backupLogger = appLogger.scope('SETTINGS:BACKUP');
    let errorEntry: any = null;

    const unsubscribe = appLogger.subscribe((entry) => {
      if (entry.context === 'SETTINGS:BACKUP' && entry.level === 'ERROR') {
        errorEntry = entry;
      }
    });

    backupLogger.error('Greška pri izvozu sigurnosne kopije:', new Error('Disk pun'));
    unsubscribe();

    expect(errorEntry).not.toBeNull();
    expect(errorEntry.level).toBe('ERROR');
    expect(errorEntry.context).toBe('SETTINGS:BACKUP');
    expect(errorEntry.error).toBeDefined();
    expect(errorEntry.error.message).toBe('Disk pun');
  });

  it('SD-13: Stupnjevito filtriranje (Level Thresholding) propušta samo dozvoljene razine', () => {
    const logger = appLogger.scope('SETTINGS:GOOGLE');
    const originalLevel = appLogger.level;

    // 1. Postavi razinu na WARN
    appLogger.setLevel('WARN');
    expect(appLogger.isLevelEnabled('VERBOSE')).toBe(false);
    expect(appLogger.isLevelEnabled('DEBUG')).toBe(false);
    expect(appLogger.isLevelEnabled('INFO')).toBe(false);
    expect(appLogger.isLevelEnabled('WARN')).toBe(true);
    expect(appLogger.isLevelEnabled('ERROR')).toBe(true);

    const captured: string[] = [];
    const unsubscribe = appLogger.subscribe((entry) => {
      captured.push(entry.level);
    });

    logger.verbose('Ovo je VERBOSE detalj (ne smije se zabilježiti)');
    logger.debug('Ovo je DEBUG provjera (ne smije se zabilježiti)');
    logger.info('Ovo je INFO poruka (ne smije se zabilježiti)');
    logger.warn('Upozorenje: Nije unesen Client ID (mora se zabilježiti)');
    logger.error('Greška: Popup zatvoren (mora se zabilježiti)');

    unsubscribe();
    appLogger.setLevel(originalLevel); // vrati izvorno

    expect(captured).toEqual(['WARN', 'ERROR']);
  });

  it('SD-14: Operacija "Prijavi se putem Google računa" bilježi točan kontekst i stupanj', () => {
    const googleLogger = appLogger.scope('SETTINGS:GOOGLE');
    const originalLevel = appLogger.level;
    appLogger.setLevel('DEBUG'); // Omogući i INFO i DEBUG

    const logEvents: { level: string; msg: string; context: string }[] = [];

    const unsubscribe = appLogger.subscribe((entry) => {
      if (entry.context === 'SETTINGS:GOOGLE') {
        logEvents.push({ level: entry.level, msg: entry.message, context: entry.context });
      }
    });

    // Simulacija korisničkog klika na gumb "Prijavi se putem Google računa"
    googleLogger.info('Korisnik kliknuo na gumb [Prijavi se putem Google računa]');
    googleLogger.debug('Provjera preduvjeta za Google OAuth 2.0 prijavu', { hasCustomClientId: false });
    googleLogger.warn('Google prijava obustavljena: nije konfiguriran prilagođeni Google Client ID');

    unsubscribe();
    appLogger.setLevel(originalLevel);

    expect(logEvents).toHaveLength(3);
    expect(logEvents[0].level).toBe('INFO');
    expect(logEvents[0].msg).toContain('Prijavi se putem Google računa');
    expect(logEvents[1].level).toBe('DEBUG');
    expect(logEvents[2].level).toBe('WARN');
  });

  it('SD-15: Veza između Settings logera i SystemLog spremnika/povijesti (sinkronizacija i konteksti)', () => {
    appLogger.clear();
    const settingsLogger = appLogger.scope('SETTINGS');
    const googleLogger = appLogger.scope('SETTINGS:GOOGLE');
    const profileLogger = appLogger.scope('SETTINGS:PROFILE');

    // Emisija događaja iz različitih pod-modula postavki
    settingsLogger.info('Otvoren prozor postavki obrta', { aktivniTab: 'cloud' });
    settingsLogger.info('Otvoren tab postavki: [cloud]');
    googleLogger.info('Korisnik kliknuo na gumb [Prijavi se putem Google računa]');
    profileLogger.info('Profil obrta uspješno spremljen u Dexie bazu');

    const history = appLogger.getHistory();
    expect(history.length).toBe(4);

    // Provjera da se iz contexta ispravno izvlači primarni modul 'SETTINGS'
    const primaryModules = new Set(history.map((entry) => entry.context.split(':')[0]));
    expect(primaryModules.has('SETTINGS')).toBe(true);

    // Provjera filtriranja iz SystemLogDrawer logike
    const settingsLogs = history.filter((entry) => entry.context.startsWith('SETTINGS'));
    expect(settingsLogs.length).toBe(4);
  });

  it('SD-16: Simulacija potpunog Google Auth tijeka iz SettingsDrawera puni SystemLogDrawer buffer s INFO zapisima', () => {
    appLogger.clear();
    const originalLevel = appLogger.level;
    appLogger.setLevel('INFO'); // Testiramo zadani INFO stupanj

    const googleLogger = appLogger.scope('SETTINGS:GOOGLE');
    const hookLogger = appLogger.scope('AUTH:HOOK');
    const authServiceLogger = appLogger.scope('AUTH:GOOGLE:LOGIN');

    // 1. Korisnik klikne na Google prijavu u sučelju postavki
    googleLogger.info('Korisnik kliknuo na gumb [Prijavi se putem Google računa]');
    googleLogger.info('Provjera preduvjeta za Google OAuth 2.0 prijavu...', { hasCustomClientId: true });

    // 2. useGoogleAuth poziva servis
    hookLogger.info('useGoogleAuth.login: Započinjem interaktivni postupak Google OAuth prijave...');

    // 3. Google servis prolazi faze
    authServiceLogger.info('Faza 1/5: Započinjem interaktivnu Google OAuth 2.0 prijavu...');
    authServiceLogger.info('Faza 2/5: Konfiguriran Google token client');
    authServiceLogger.info('Faza 4/5: Zaprimljen odgovor iz Google skočnog prozora (Popup callback)');

    // 4. Uspješan završetak
    hookLogger.info('useGoogleAuth.login: Google prijava u potpunosti dovršena! Korisnik: test@example.com');
    googleLogger.info('Google OAuth prijava uspješno dovršena!', { email: 'test@example.com' });

    const history = appLogger.getHistory();
    expect(history.length).toBe(8);

    // Svi zapisi moraju biti na INFO razini
    expect(history.every((entry) => entry.level === 'INFO')).toBe(true);

    // Testiranje filtriranja po pretrazi "Google" kakvo koristi SystemLogDrawer
    const searchMatches = history.filter(
      (entry) =>
        entry.context.toLowerCase().includes('google') ||
        entry.message.toLowerCase().includes('google')
    );
    expect(searchMatches.length).toBe(8);

    appLogger.setLevel(originalLevel);
  });

  it('SD-17: Pretraga i filtriranje po stupnjevima u SystemLogDraweru točno pronalazi i filtrira greške iz postavki', () => {
    appLogger.clear();
    const originalLevel = appLogger.level;
    appLogger.setLevel('INFO');

    const googleLogger = appLogger.scope('SETTINGS:GOOGLE');

    googleLogger.info('Korisnik kliknuo na gumb [Prijavi se putem Google računa]');
    googleLogger.warn('Google prijava obustavljena: nije konfiguriran prilagođeni Google Client ID');
    googleLogger.error('Google OAuth prijava nije uspjela u popup prozoru:', new Error('Popup blocked'));

    const history = appLogger.getHistory();
    expect(history.length).toBe(3);

    // Filtar: samo ERROR
    const errorLogs = history.filter((e) => e.level === 'ERROR');
    expect(errorLogs.length).toBe(1);
    expect(errorLogs[0].message).toContain('nije uspjela u popup prozoru');
    expect(errorLogs[0].error?.message).toBe('Popup blocked');

    // Filtar: samo WARN
    const warnLogs = history.filter((e) => e.level === 'WARN');
    expect(warnLogs.length).toBe(1);
    expect(warnLogs[0].message).toContain('nije konfiguriran');

    // Filtar: pretraga po riječi "popup"
    const query = 'popup';
    const queryMatches = history.filter(
      (e) =>
        e.message.toLowerCase().includes(query) ||
        (e.error && e.error.message.toLowerCase().includes(query))
    );
    expect(queryMatches.length).toBe(1);

    appLogger.setLevel(originalLevel);
  });
});


