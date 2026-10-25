import React from 'react';
import type { CloudAiTabProps } from '../types';
import { CloudDiagnosticsCard } from '../cloud/CloudDiagnosticsCard';
import { GoogleIdentityCard } from '../cloud/GoogleIdentityCard';
import { GoogleDriveSyncCard } from '../cloud/GoogleDriveSyncCard';
import { GeminiSettingsCard } from '../cloud/GeminiSettingsCard';
import { GoogleSttSettingsCard } from '../cloud/GoogleSttSettingsCard';
import { TavilySettingsCard } from '../cloud/TavilySettingsCard';
import { FirebaseSettingsCard } from '../cloud/FirebaseSettingsCard';

export const CloudAiTab: React.FC<CloudAiTabProps> = ({
  googleAuth,
  driveSync,
  gemini,
}) => {
  return (
    <div className="space-y-6">
      {/* 0. Dijagnostika API-ja i dozvola (Automatska provjera servisa) */}
      <CloudDiagnosticsCard
        googleAuth={googleAuth}
        gemini={gemini}
      />

      {/* 1. Google Identity & Kripto Sidro (Zero-Server Auth) */}
      <GoogleIdentityCard
        googleAuth={googleAuth}
      />

      {/* 2. Google Drive AppData Trezor (Besplatna Skrivena Pohrana) */}
      <GoogleDriveSyncCard
        googleAuth={googleAuth}
        driveSync={driveSync}
      />

      {/* 3. Google AI Studio (Gemini Asistent BYOK) */}
      <GeminiSettingsCard
        gemini={gemini}
      />

      {/* 4. Google Cloud Speech-to-Text V2 (Glasovni Asistent Žigo & Chirp 2 BYOK) */}
      <GoogleSttSettingsCard />

      {/* 5. Tavily AI Search (Web Istraživanje Propisa RH - HITL) */}
      <TavilySettingsCard />

      {/* 6. Firebase / Firestore (Opcionalna Priprema) */}
      <FirebaseSettingsCard />
    </div>
  );
};
