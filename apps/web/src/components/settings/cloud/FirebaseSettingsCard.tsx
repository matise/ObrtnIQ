import React from 'react';
import { Flame } from 'lucide-react';

export const FirebaseSettingsCard: React.FC = () => {
  return (
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
  );
};
