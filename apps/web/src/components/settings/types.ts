import type React from 'react';
import type { ObrtProfil } from '@obrtniq/core';
import type { UseObrtProfileReturn } from '../../hooks/useObrtProfile';
import type { UseGoogleAuthReturn } from '../../hooks/useGoogleAuth';
import type { UseGoogleDriveSyncReturn } from '../../hooks/useGoogleDriveSync';
import type { UseGeminiAssistantReturn } from '../../hooks/useGeminiAssistant';

export type SettingsTabId = 'osnovno' | 'poslovanje' | 'memorandum' | 'backup' | 'cloud';

export interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  obrtProfileHook: UseObrtProfileReturn;
  googleAuthHook?: UseGoogleAuthReturn;
  driveSyncHook?: UseGoogleDriveSyncReturn;
  geminiHook?: UseGeminiAssistantReturn;
}

export interface SettingsTabsNavProps {
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
  isGoogleAuthenticated?: boolean;
}

export interface OsnovniPodaciTabProps {
  formData: ObrtProfil;
  onChange: (field: keyof ObrtProfil, val: any) => void;
}

export interface PoslovanjeTabProps {
  formData: ObrtProfil;
  onChange: (field: keyof ObrtProfil, val: any) => void;
}

export interface MemorandumTabProps {
  formData: ObrtProfil;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, field: 'logoImageData' | 'pecatPotpisImageData') => void;
  onRemoveImage: (field: 'logoImageData' | 'pecatPotpisImageData') => void;
}

export interface BackupRestoreTabProps {
  onProfileUpdated?: () => Promise<void>;
}

export interface CloudAiTabProps {
  googleAuth: UseGoogleAuthReturn;
  driveSync: UseGoogleDriveSyncReturn;
  gemini: UseGeminiAssistantReturn;
}
