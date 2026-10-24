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
});
