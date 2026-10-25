import { useState, useEffect, useCallback } from 'react';
import type { ObrtProfil } from '@obrtniq/core';
import { DEFAULT_OBRT_PROFIL } from '../engine/obrt-profile';
import { dexieStorage } from '../storage/dexie-db';
import { appLogger } from '../services/logger';

export interface UseObrtProfileReturn {
  profil: ObrtProfil;
  isLoading: boolean;
  saveProfil: (noviProfil: ObrtProfil) => Promise<void>;
  updateLogo: (base64Data?: string) => Promise<void>;
  updatePecat: (base64Data?: string) => Promise<void>;
  resetToDefault: () => Promise<void>;
  reloadProfil: () => Promise<void>;
}

export function useObrtProfile(): UseObrtProfileReturn {
  const [profil, setProfil] = useState<ObrtProfil>(DEFAULT_OBRT_PROFIL);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const reloadProfil = useCallback(async () => {
    try {
      setIsLoading(true);
      const spremljen = await dexieStorage.obrt.getProfil();
      if (spremljen) {
        setProfil(spremljen);
        appLogger.scope('PROFILE:LOAD').info(`Profil obrta "${spremljen.naziv}" uspješno učitan iz baze`, {
          oib: spremljen.oib,
        });
      } else {
        // Ako u bazi nema profila, inicijaliziramo ga sa zadanim postavkama
        await dexieStorage.obrt.saveProfil(DEFAULT_OBRT_PROFIL);
        setProfil(DEFAULT_OBRT_PROFIL);
        appLogger.scope('PROFILE:LOAD').info('Inicijaliziran zadani profil obrta.');
      }
    } catch (err: any) {
      appLogger.scope('PROFILE:LOAD').error('Greška pri učitavanju profila obrta:', {
        error: err?.message || String(err),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadProfil();
  }, [reloadProfil]);

  const saveProfil = useCallback(async (noviProfil: ObrtProfil) => {
    try {
      await dexieStorage.obrt.saveProfil(noviProfil);
      setProfil(noviProfil);
      appLogger.scope('PROFILE:SAVE').info(`Profil obrta "${noviProfil.naziv}" uspješno spremljen u Dexie bazu`, {
        oib: noviProfil.oib,
        vlasnik: noviProfil.vlasnikImePrezime,
      });
    } catch (err: any) {
      appLogger.scope('PROFILE:ERROR').error('Spremanje profila obrta nije uspjelo:', {
        error: err?.message || String(err),
      });
      throw err;
    }
  }, []);

  const updateLogo = useCallback(async (base64Data?: string) => {
    setProfil((prev) => {
      const updated = { ...prev, logoImageData: base64Data };
      dexieStorage.obrt.saveProfil(updated).catch(() => {});
      return updated;
    });
    appLogger.scope('PROFILE:LOGO').info(base64Data ? 'Logotip obrta ažuriran' : 'Logotip obrta uklonjen');
  }, []);

  const updatePecat = useCallback(async (base64Data?: string) => {
    setProfil((prev) => {
      const updated = { ...prev, pecatPotpisImageData: base64Data };
      dexieStorage.obrt.saveProfil(updated).catch(() => {});
      return updated;
    });
    appLogger.scope('PROFILE:STAMP').info(base64Data ? 'Digitalni pečat/potpis ažuriran' : 'Digitalni pečat/potpis uklonjen');
  }, []);

  const resetToDefault = useCallback(async () => {
    await dexieStorage.obrt.saveProfil(DEFAULT_OBRT_PROFIL);
    setProfil(DEFAULT_OBRT_PROFIL);
    appLogger.scope('PROFILE:RESET').info('Profil obrta vraćen na zadane tvorničke postavke');
  }, []);

  return {
    profil,
    isLoading,
    saveProfil,
    updateLogo,
    updatePecat,
    resetToDefault,
    reloadProfil,
  };
}
