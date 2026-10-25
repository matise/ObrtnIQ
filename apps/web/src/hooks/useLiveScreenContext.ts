import { useState, useEffect, useMemo } from 'react';
import type { 
  LiveScreenContextSnapshot, 
  ContextualActionChip,
  ActiveScreenView 
} from '../types/zigo-context';
import { 
  buildLiveScreenContextSnapshot, 
  generateContextualChips, 
  formatContextForSystemPrompt,
  type BuildContextInput 
} from '../services/zigo-context-builder';
import { appLogger } from '../services/logger';
import type { LogEntry } from '@obrtniq/core';

export interface UseLiveScreenContextOptions {
  activeScreen?: ActiveScreenView;
  openDrawers?: Record<string, boolean>;
  form?: BuildContextInput['form'];
  items?: BuildContextInput['items'];
  workflow?: BuildContextInput['workflow'];
  stats?: BuildContextInput['stats'];
  googleAuth?: {
    isAuthenticated?: boolean;
    identity?: { email?: string } | null;
  };
  geminiAssistant?: {
    model?: string;
    hasKey?: boolean;
  };
}

export interface UseLiveScreenContextReturn {
  snapshot: LiveScreenContextSnapshot;
  chips: ContextualActionChip[];
  formattedContextPrompt: string;
  refreshSnapshot: () => void;
}

export function useLiveScreenContext(options: UseLiveScreenContextOptions): UseLiveScreenContextReturn {
  const [posljednjaGreska, setPosljednjaGreska] = useState<{
    poruka: string;
    vrijeme: string;
    scope?: string;
  } | undefined>(undefined);

  const [posljednjiWarn, setPosljednjiWarn] = useState<{
    poruka: string;
    vrijeme: string;
    scope?: string;
  } | undefined>(undefined);

  // Pretplata na appLogger za hvatanje grešaka i upozorenja u stvarnom vremenu
  useEffect(() => {
    // Provjeri postoji li već povijest grešaka
    const povijest = appLogger.getHistory();
    const zadnjaG = povijest.slice().reverse().find((e) => e.level === 'ERROR');
    if (zadnjaG) {
      setPosljednjaGreska({
        poruka: zadnjaG.message,
        vrijeme: zadnjaG.displayTime,
        scope: zadnjaG.context,
      });
    }

    const unsub = appLogger.subscribe((entry: LogEntry) => {
      if (entry.level === 'ERROR') {
        setPosljednjaGreska({
          poruka: entry.message,
          vrijeme: entry.displayTime,
          scope: entry.context,
        });
      } else if (entry.level === 'WARN') {
        setPosljednjiWarn({
          poruka: entry.message,
          vrijeme: entry.displayTime,
          scope: entry.context,
        });
      }
    });

    return () => {
      unsub();
    };
  }, []);

  const [tick, setTick] = useState(0);

  // Periodički tick svakih 60 sekundi radi točnog vremena i noćnog/fjaka statusa
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const refreshSnapshot = () => setTick((t) => t + 1);

  // Sastavljanje snimka stanja
  const snapshot = useMemo(() => {
    return buildLiveScreenContextSnapshot({
      activeScreen: options.activeScreen,
      openDrawers: options.openDrawers,
      form: options.form,
      items: options.items,
      workflow: options.workflow,
      stats: options.stats,
      telemetry: {
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        isGoogleDriveConnected: !!options.googleAuth?.isAuthenticated,
        googleDriveUserEmail: options.googleAuth?.identity?.email,
        geminiModel: options.geminiAssistant?.model,
        hasGeminiKey: options.geminiAssistant?.hasKey,
        posljednjaGreska,
        posljednjiWarn,
      },
    });
  }, [
    options.activeScreen,
    options.openDrawers,
    options.form?.partnerNaziv,
    options.form?.oib,
    options.form?.isOibValid,
    options.form?.iban,
    options.form?.isIbanValid,
    options.form?.taxZone,
    options.form?.nacinPlacanja,
    options.form?.datumIzdavanja,
    options.form?.datumDospijeca,
    options.form?.datumIsporuke,
    options.items?.items,
    options.items?.ukupniIznos,
    options.workflow?.docType,
    options.workflow?.docStatus,
    options.workflow?.brojDokumenta,
    options.stats?.kprTotalEur,
    options.googleAuth?.isAuthenticated,
    options.googleAuth?.identity?.email,
    options.geminiAssistant?.model,
    options.geminiAssistant?.hasKey,
    posljednjaGreska,
    posljednjiWarn,
    tick,
  ]);

  const chips = useMemo(() => generateContextualChips(snapshot), [snapshot]);
  const formattedContextPrompt = useMemo(() => formatContextForSystemPrompt(snapshot), [snapshot]);

  // Logiranje promjena živog konteksta i čipova po razinama
  useEffect(() => {
    const loggerCtx = appLogger.scope('AI:CONTEXT:LIVE');
    loggerCtx.debug('Ažuriran živi snimak ekrana (LiveScreenContext)', {
      ekran: snapshot.aktivniEkran,
      brojStavki: snapshot.racun.brojStavki,
      ukupnoEur: snapshot.racun.ukupniIznos,
      kprYtd: snapshot.financije.kprPrometYtd,
      statusUgroze: snapshot.financije.statusUgroze,
      oib: snapshot.racun.oib,
    });
    loggerCtx.verbose('Puni LiveScreenContextSnapshot objekt', snapshot);
  }, [snapshot]);

  useEffect(() => {
    if (chips.length > 0) {
      const loggerChips = appLogger.scope('AI:CONTEXT:CHIPS');
      loggerChips.debug('Generirani dinamički kontekstualni čipovi', {
        brojCipova: chips.length,
        oznake: chips.map((c) => c.tekst),
      });
      loggerChips.verbose('Puni popis kontekstualnih čipova', chips);
    }
  }, [chips]);

  return {
    snapshot,
    chips,
    formattedContextPrompt,
    refreshSnapshot,
  };
}
