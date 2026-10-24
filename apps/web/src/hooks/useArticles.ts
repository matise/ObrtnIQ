import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Artikl } from '@obrtniq/core';
import { dexieStorage } from '../storage/dexie-db';
import { appLogger } from '../services/logger';

export const INITIAL_DEMO_ARTICLES: Omit<Artikl, 'id'>[] = [
  {
    sifra: 'USL-01',
    kpdSifra: '62.01.11',
    naziv: 'Razvoj aplikacijskog softvera i programiranje',
    opis: 'Arhitektura, izrada i testiranje prilagođenih programskih rješenja',
    jedinicaMjere: 'sat',
    cijenaOsnovica: 75.00,
    stopaPdv: 0.00,
    pdvKategorijaPoreza: 'E',
    jeUsluga: true,
    aktivan: true,
  },
  {
    sifra: 'USL-02',
    kpdSifra: '62.02.20',
    naziv: 'Savjetovanje o računalnoj opremi i sistemima',
    opis: 'Stručna analiza, planiranje i optimizacija IT infrastrukture',
    jedinicaMjere: 'sat',
    cijenaOsnovica: 60.00,
    stopaPdv: 0.00,
    pdvKategorijaPoreza: 'E',
    jeUsluga: true,
    aktivan: true,
  },
  {
    sifra: 'USL-03',
    kpdSifra: '74.10.11',
    naziv: 'Usluge grafičkog, web i vizualnog dizajna',
    opis: 'Izrada korisničkih sučelja (UI/UX), prototipa i vizualnog identiteta',
    jedinicaMjere: 'sat',
    cijenaOsnovica: 50.00,
    stopaPdv: 0.00,
    pdvKategorijaPoreza: 'E',
    jeUsluga: true,
    aktivan: true,
  },
  {
    sifra: 'USL-04',
    kpdSifra: '70.22.11',
    naziv: 'Usluge strateškog i poslovnog savjetovanja',
    opis: 'Vođenje projekata, optimizacija poslovnih procesa i analiza',
    jedinicaMjere: 'sat',
    cijenaOsnovica: 80.00,
    stopaPdv: 0.00,
    pdvKategorijaPoreza: 'E',
    jeUsluga: true,
    aktivan: true,
  },
  {
    sifra: 'USL-05',
    kpdSifra: '74.30.11',
    naziv: 'Usluge stručnog prevođenja tekstova',
    opis: 'Prijevod stručne i tehničke dokumentacije (engleski/njemački)',
    jedinicaMjere: 'kartica',
    cijenaOsnovica: 25.00,
    stopaPdv: 0.00,
    pdvKategorijaPoreza: 'E',
    jeUsluga: true,
    aktivan: true,
  },
  {
    sifra: 'USL-06',
    kpdSifra: '62.03.11',
    naziv: 'Mjesečno održavanje i podrška softverskih sustava',
    opis: 'Redovito ažuriranje, nadzor i sigurnosna podrška poslužitelja',
    jedinicaMjere: 'mjesec',
    cijenaOsnovica: 350.00,
    stopaPdv: 0.00,
    pdvKategorijaPoreza: 'E',
    jeUsluga: true,
    aktivan: true,
  },
];

export interface UseArticlesReturn {
  artikli: Artikl[];
  filteredArticles: Artikl[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterType: 'SVE' | 'USLUGE' | 'ROBA';
  setFilterType: (val: 'SVE' | 'USLUGE' | 'ROBA') => void;
  isLoading: boolean;
  addArtikl: (artiklData: Omit<Artikl, 'id'>) => Promise<Artikl>;
  updateArtikl: (id: string, partial: Partial<Artikl>) => Promise<void>;
  deleteArtikl: (id: string) => Promise<void>;
  refreshArticles: () => Promise<void>;
  seedDefaultArticles: () => Promise<void>;
}

export function useArticles(): UseArticlesReturn {
  const [artikli, setArtikli] = useState<Artikl[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'SVE' | 'USLUGE' | 'ROBA'>('SVE');
  const [isLoading, setIsLoading] = useState(true);

  const refreshArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await dexieStorage.artikli.getAll();
      if (list.length === 0) {
        // Inicijalni seed oglednog kataloga usluga
        const seeded: Artikl[] = [];
        for (let i = 0; i < INITIAL_DEMO_ARTICLES.length; i++) {
          const item = INITIAL_DEMO_ARTICLES[i]!;
          const seededItem: Artikl = {
            ...item,
            id: `artikl-seed-${i + 1}`,
          };
          await dexieStorage.artikli.save(seededItem);
          seeded.push(seededItem);
        }
        setArtikli(seeded);
        appLogger.scope('ARTICLES:SEED').info('Inicijaliziran ogledni cjenik usluga za paušaliste', {
          count: seeded.length,
        });
      } else {
        setArtikli(list);
      }
    } catch (err: any) {
      appLogger.scope('ARTICLES:LOAD').error('Greška pri učitavanju cjenika iz baze:', {
        error: err?.message || String(err),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

  const addArtikl = useCallback(async (artiklData: Omit<Artikl, 'id'>): Promise<Artikl> => {
    const id = `artikl-${Date.now()}`;
    const newArtikl: Artikl = { ...artiklData, id };
    await dexieStorage.artikli.save(newArtikl);
    setArtikli((prev) => [newArtikl, ...prev]);
    appLogger.scope('ARTICLES:ADD').info(`Dodan novi artikl u cjenik: "${newArtikl.naziv}" (${newArtikl.cijenaOsnovica} €)`);
    return newArtikl;
  }, []);

  const updateArtikl = useCallback(async (id: string, partial: Partial<Artikl>) => {
    const current = artikli.find((a) => a.id === id);
    if (!current) return;
    const updated = { ...current, ...partial };
    await dexieStorage.artikli.save(updated);
    setArtikli((prev) => prev.map((a) => (a.id === id ? updated : a)));
    appLogger.scope('ARTICLES:UPDATE').info(`Ažuriran artikl: "${updated.naziv}"`);
  }, [artikli]);

  const deleteArtikl = useCallback(async (id: string) => {
    await dexieStorage.artikli.delete(id);
    setArtikli((prev) => prev.filter((a) => a.id !== id));
    appLogger.scope('ARTICLES:DELETE').info(`Obrisan artikl ID: ${id}`);
  }, []);

  const seedDefaultArticles = useCallback(async () => {
    for (let i = 0; i < INITIAL_DEMO_ARTICLES.length; i++) {
      const item = INITIAL_DEMO_ARTICLES[i]!;
      const seededItem: Artikl = {
        ...item,
        id: `artikl-seed-${Date.now()}-${i}`,
      };
      await dexieStorage.artikli.save(seededItem);
    }
    await refreshArticles();
  }, [refreshArticles]);

  const filteredArticles = useMemo(() => {
    return artikli.filter((a) => {
      // 1. Filter tipa
      if (filterType === 'USLUGE' && !a.jeUsluga) return false;
      if (filterType === 'ROBA' && a.jeUsluga) return false;

      // 2. Tražilica
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        a.naziv.toLowerCase().includes(q) ||
        a.kpdSifra.includes(q) ||
        Boolean(a.sifra && a.sifra.toLowerCase().includes(q)) ||
        Boolean(a.opis && a.opis.toLowerCase().includes(q))
      );
    });
  }, [artikli, searchQuery, filterType]);

  return {
    artikli,
    filteredArticles,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    isLoading,
    addArtikl,
    updateArtikl,
    deleteArtikl,
    refreshArticles,
    seedDefaultArticles,
  };
}
