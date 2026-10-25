// apps/web/src/hooks/useTroskovnik.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  izracunajTroskovnikSazetak,
  izracunajCashFlow,
  provjeriPragDugotrajneImovine,
  type UlazniTrosak, 
  type KategorijaTroska, 
  type TroskovnikSazetak,
  type CashFlowRezultat
} from '@obrtniq/core';
import { dexieStorage } from '../storage/dexie-db';
import { appLogger } from '../services/logger';

export interface UseTroskovnikOptions {
  godina: number;
  ukupniPrometKprEur?: number;
  ukupnoPlaceniDoprinosiEur?: number;
  ukupnoPlaceniPorezEur?: number;
}

export function useTroskovnik({
  godina,
  ukupniPrometKprEur = 0,
  ukupnoPlaceniDoprinosiEur = 0,
  ukupnoPlaceniPorezEur = 0,
}: UseTroskovnikOptions) {
  const [troskovi, setTroskovi] = useState<UlazniTrosak[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterKategorija, setFilterKategorija] = useState<KategorijaTroska | 'SVE'>('SVE');
  const [filterStatus, setFilterStatus] = useState<'SVE' | 'PLACENO' | 'NEPLACENO'>('SVE');
  const [searchTerm, setSearchTerm] = useState('');

  const loadTroskovi = useCallback(async () => {
    setIsLoading(true);
    try {
      if (dexieStorage.troskovi) {
        const items = await dexieStorage.troskovi.getAll(godina);
        setTroskovi(items);
      }
    } catch (err: any) {
      appLogger.scope('TROSKOVNIK:HOOK').error('Greška pri dohvaćanju ulaznih troškova:', err);
    } finally {
      setIsLoading(false);
    }
  }, [godina]);

  useEffect(() => {
    loadTroskovi();
  }, [loadTroskovi]);

  // Filtrirani troškovi
  const filtriraniTroskovi = useMemo(() => {
    return troskovi.filter(t => {
      if (filterKategorija !== 'SVE' && t.kategorija !== filterKategorija) return false;
      if (filterStatus !== 'SVE' && t.status !== filterStatus) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchNaziv = t.dobavljacNaziv.toLowerCase().includes(q);
        const matchOpis = t.opis.toLowerCase().includes(q);
        const matchBroj = t.brojUlaznogDokumenta.toLowerCase().includes(q);
        if (!matchNaziv && !matchOpis && !matchBroj) return false;
      }
      return true;
    });
  }, [troskovi, filterKategorija, filterStatus, searchTerm]);

  // Sažetak troškova
  const sazetak: TroskovnikSazetak = useMemo(() => {
    return izracunajTroskovnikSazetak(troskovi, godina);
  }, [troskovi, godina]);

  // Financijska slika i Cash-Flow
  const cashFlow: CashFlowRezultat = useMemo(() => {
    return izracunajCashFlow({
      ukupnoNaplacenoKprEur: ukupniPrometKprEur,
      ukupnoPlaceniTroskoviEur: sazetak.ukupnoPlacenoEur,
      ukupnoPlaceniDoprinosiEur: ukupnoPlaceniDoprinosiEur,
      ukupnoPlaceniPorezEur: ukupnoPlaceniPorezEur,
    });
  }, [ukupniPrometKprEur, sazetak.ukupnoPlacenoEur, ukupnoPlaceniDoprinosiEur, ukupnoPlaceniPorezEur]);

  // Dodavanje novog troška
  const dodajTrosak = useCallback(async (input: Omit<UlazniTrosak, 'id' | 'jeDugotrajnaImovina' | 'kreirano'>) => {
    try {
      const jeDugotrajna = provjeriPragDugotrajneImovine(input.ukupnoEur);
      const noviTrosak: UlazniTrosak = {
        ...input,
        id: `trosak-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        jeDugotrajnaImovina: jeDugotrajna,
        kreirano: new Date().toISOString(),
      };

      if (dexieStorage.troskovi) {
        await dexieStorage.troskovi.save(noviTrosak);
      }

      setTroskovi(prev => [noviTrosak, ...prev]);

      appLogger.scope('TROSKOVNIK').info(`Dodan novi ulazni trošak: ${noviTrosak.dobavljacNaziv} (${noviTrosak.ukupnoEur} €)`, {
        id: noviTrosak.id,
        kategorija: noviTrosak.kategorija,
        iznos: noviTrosak.ukupnoEur,
        jeDugotrajna,
      });

      return noviTrosak;
    } catch (err: any) {
      appLogger.scope('TROSKOVNIK').error('Greška pri dodavanju troška:', err);
      throw err;
    }
  }, []);

  // Izmjena postojećeg troška
  const azurirajTrosak = useCallback(async (id: string, partial: Partial<UlazniTrosak>) => {
    try {
      if (dexieStorage.troskovi) {
        await dexieStorage.troskovi.update(id, partial);
      }

      setTroskovi(prev => prev.map(t => t.id === id ? { ...t, ...partial } : t));
      appLogger.scope('TROSKOVNIK').info(`Ažuriran trošak: ${id}`);
    } catch (err: any) {
      appLogger.scope('TROSKOVNIK').error(`Greška pri ažuriranju troška ${id}:`, err);
      throw err;
    }
  }, []);

  // Brisanje troška
  const obrisiTrosak = useCallback(async (id: string) => {
    try {
      if (dexieStorage.troskovi) {
        await dexieStorage.troskovi.delete(id);
      }

      setTroskovi(prev => prev.filter(t => t.id !== id));
      appLogger.scope('TROSKOVNIK').info(`Obrisan trošak: ${id}`);
    } catch (err: any) {
      appLogger.scope('TROSKOVNIK').error(`Greška pri brisanju troška ${id}:`, err);
      throw err;
    }
  }, []);

  return {
    troskovi,
    filtriraniTroskovi,
    sazetak,
    cashFlow,
    isLoading,
    filterKategorija,
    setFilterKategorija,
    filterStatus,
    setFilterStatus,
    searchTerm,
    setSearchTerm,
    dodajTrosak,
    azurirajTrosak,
    obrisiTrosak,
    reload: loadTroskovi,
  };
}
