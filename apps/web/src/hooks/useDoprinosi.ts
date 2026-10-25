// apps/web/src/hooks/useDoprinosi.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  generirajGodisnjeDoprinose,
  generirajKvartalnePorezneNaloge,
  DEFAULT_DOPRINOSI_CONFIG_2026,
  type MjesecniObracunDoprinosa,
  type KvartalniPorezNalog,
  type DoprinosiPostavke
} from '@obrtniq/core';
import { dexieStorage } from '../storage/dexie-db';
import { appLogger } from '../services/logger';

export interface UseDoprinosiOptions {
  oib: string;
  godina: number;
  ukupniPrometKprEur?: number;
  config?: Partial<DoprinosiPostavke>;
}

export function useDoprinosi({
  oib,
  godina,
  ukupniPrometKprEur = 0,
  config
}: UseDoprinosiOptions) {
  const [uplaceniMjeseci, setUplaceniMjeseci] = useState<Map<number, string>>(new Map());
  const [uplaceniKvartali, setUplaceniKvartali] = useState<Map<number, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const activeConfig: DoprinosiPostavke = useMemo(() => {
    return {
      ...DEFAULT_DOPRINOSI_CONFIG_2026,
      ...config,
      godina,
    };
  }, [godina, config]);

  const loadUplate = useCallback(async () => {
    if (!oib) return;
    setIsLoading(true);
    try {
      if (dexieStorage.doprinosi) {
        const uplate = await dexieStorage.doprinosi.getAllUplate(godina);
        const mapMjeseci = new Map<number, string>();
        const mapKvartali = new Map<number, string>();

        for (const u of uplate) {
          if (u.mjesec && u.datumUplate) {
            mapMjeseci.set(u.mjesec, u.datumUplate);
          }
          if (u.kvartal && u.datumUplate) {
            mapKvartali.set(u.kvartal, u.datumUplate);
          }
        }

        setUplaceniMjeseci(mapMjeseci);
        setUplaceniKvartali(mapKvartali);
      }
    } catch (err: any) {
      appLogger.scope('DOPRINOSI:HOOK').error('Greška pri učitavanju uplata doprinosa iz IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, [oib, godina]);

  useEffect(() => {
    loadUplate();
  }, [loadUplate]);

  // Izračun svih 12 mjeseci doprinosa
  const mjesecniDoprinosi: MjesecniObracunDoprinosa[] = useMemo(() => {
    if (!oib) return [];
    return generirajGodisnjeDoprinose(oib, godina, uplaceniMjeseci, activeConfig);
  }, [oib, godina, uplaceniMjeseci, activeConfig]);

  // Izračun 4 kvartalna naloga poreza
  const kvartalniPorezi: KvartalniPorezNalog[] = useMemo(() => {
    if (!oib) return [];
    return generirajKvartalnePorezneNaloge(oib, godina, ukupniPrometKprEur, uplaceniKvartali, activeConfig);
  }, [oib, godina, ukupniPrometKprEur, uplaceniKvartali, activeConfig]);

  // Akcija: Označi doprinos za mjesec kao uplaćen
  const oznaciDoprinosUplacenim = useCallback(async (mjesec: number, datumUplate: string = new Date().toISOString().slice(0, 10)) => {
    try {
      const obracun = mjesecniDoprinosi.find(m => m.mjesec === mjesec);
      if (!obracun) return;

      const updated = {
        ...obracun,
        status: 'UPLACENO' as const,
        datumUplate,
      };

      if (dexieStorage.doprinosi) {
        await dexieStorage.doprinosi.saveUplata(updated);
      }

      setUplaceniMjeseci(prev => {
        const next = new Map(prev);
        next.set(mjesec, datumUplate);
        return next;
      });

      appLogger.scope('DOPRINOSI').info(`Uplaćeni doprinosi za ${mjesec}/${godina} (${obracun.ukupnoDoprinosiEur} €)`, {
        mjesec,
        godina,
        datumUplate,
        iznos: obracun.ukupnoDoprinosiEur,
      });
    } catch (err: any) {
      appLogger.scope('DOPRINOSI').error(`Neuspjelo spremanje uplate doprinosa za ${mjesec}/${godina}:`, err);
      throw err;
    }
  }, [mjesecniDoprinosi, godina]);

  // Akcija: Poništi uplatu doprinosa
  const ponistiUplatuDoprinosa = useCallback(async (mjesec: number) => {
    try {
      const id = `doprinos-${godina}-${String(mjesec).padStart(2, '0')}`;
      if (dexieStorage.doprinosi) {
        await dexieStorage.doprinosi.deleteUplata(id);
      }

      setUplaceniMjeseci(prev => {
        const next = new Map(prev);
        next.delete(mjesec);
        return next;
      });

      appLogger.scope('DOPRINOSI').info(`Poništena uplata doprinosa za ${mjesec}/${godina}`);
    } catch (err: any) {
      appLogger.scope('DOPRINOSI').error(`Greška pri poništavanju uplate doprinosa za ${mjesec}/${godina}:`, err);
      throw err;
    }
  }, [godina]);

  // Akcija: Označi porez kao uplaćen
  const oznaciPorezUplacenim = useCallback(async (kvartal: 1 | 2 | 3 | 4, datumUplate: string = new Date().toISOString().slice(0, 10)) => {
    try {
      const nalog = kvartalniPorezi.find(k => k.kvartal === kvartal);
      if (!nalog) return;

      const zapis = {
        id: `porez-${godina}-q${kvartal}`,
        godina,
        kvartal,
        status: 'UPLACENO',
        datumUplate,
        iznosEur: nalog.iznosPorezaEur,
      };

      if (dexieStorage.doprinosi) {
        await dexieStorage.doprinosi.saveUplata(zapis);
      }

      setUplaceniKvartali(prev => {
        const next = new Map(prev);
        next.set(kvartal, datumUplate);
        return next;
      });

      appLogger.scope('DOPRINOSI:POREZ').info(`Uplaćen paušalni porez Q${kvartal}/${godina} (${nalog.iznosPorezaEur} €)`);
    } catch (err: any) {
      appLogger.scope('DOPRINOSI:POREZ').error(`Greška pri evidentiranju uplate poreza Q${kvartal}:`, err);
      throw err;
    }
  }, [kvartalniPorezi, godina]);

  // Agregati
  const statistika = useMemo(() => {
    let ukupnoDoprinosaGodina = 0;
    let ukupnoUplacenoDoprinosa = 0;
    let brojNeplacenihDospjelih = 0;

    for (const m of mjesecniDoprinosi) {
      ukupnoDoprinosaGodina += m.ukupnoDoprinosiEur;
      if (m.status === 'UPLACENO') {
        ukupnoUplacenoDoprinosa += m.ukupnoDoprinosiEur;
      } else if (m.status === 'PREKORACEN_ROK') {
        brojNeplacenihDospjelih++;
      }
    }

    let ukupnoPorezaGodina = 0;
    let ukupnoUplacenoPoreza = 0;
    for (const p of kvartalniPorezi) {
      ukupnoPorezaGodina += p.iznosPorezaEur;
      if (p.status === 'UPLACENO') {
        ukupnoUplacenoPoreza += p.iznosPorezaEur;
      }
    }

    return {
      ukupnoDoprinosaGodina: Math.round(ukupnoDoprinosaGodina * 100) / 100,
      ukupnoUplacenoDoprinosa: Math.round(ukupnoUplacenoDoprinosa * 100) / 100,
      preostaloDoprinosa: Math.round((ukupnoDoprinosaGodina - ukupnoUplacenoDoprinosa) * 100) / 100,
      brojNeplacenihDospjelih,
      ukupnoPorezaGodina: Math.round(ukupnoPorezaGodina * 100) / 100,
      ukupnoUplacenoPoreza: Math.round(ukupnoUplacenoPoreza * 100) / 100,
    };
  }, [mjesecniDoprinosi, kvartalniPorezi]);

  return {
    mjesecniDoprinosi,
    kvartalniPorezi,
    activeConfig,
    isLoading,
    statistika,
    oznaciDoprinosUplacenim,
    ponistiUplatuDoprinosa,
    oznaciPorezUplacenim,
    reload: loadUplate,
  };
}
