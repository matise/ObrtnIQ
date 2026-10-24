import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Partner } from '@obrtniq/core';
import { dexieStorage } from '../storage/dexie-db';
import { appLogger } from '../services/logger';

export interface UsePartnersReturn {
  partneri: Partner[];
  filteredPartneri: Partner[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  isLoading: boolean;
  addPartner: (partner: Omit<Partner, 'id'>) => Promise<Partner>;
  updatePartner: (id: string, partial: Partial<Partner>) => Promise<void>;
  deletePartner: (id: string) => Promise<void>;
  refreshPartners: () => Promise<void>;
}

export function usePartners(): UsePartnersReturn {
  const [partneri, setPartneri] = useState<Partner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const refreshPartners = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await dexieStorage.partneri.getAll();
      if (list.length === 0) {
        // Inicijalni ogledni partner za demonstraciju
        const demoPartner: Partner = {
          id: 'partner-demo-1',
          tipPartnera: 'PRAVNA_OSOBA',
          naziv: 'Domaći Kupac Čistoća i Održavanje d.o.o.',
          oib: '69435151530',
          adresa: 'Radnička cesta 80',
          postanskiBroj: '10000',
          grad: 'Zagreb',
          drzavaIso: 'HR',
          poreznaZona: 'DOMACI_B2B',
          aktivan: true,
          kontaktEmail: 'racuni@cistoca-odrzavanje.hr',
        };
        await dexieStorage.partneri.save(demoPartner);
        setPartneri([demoPartner]);
      } else {
        setPartneri(list);
      }
    } catch (err: any) {
      appLogger.scope('PARTNERS:LOAD').error('Greška pri učitavanju partnera iz baze:', {
        error: err?.message || String(err),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPartners();
  }, [refreshPartners]);

  const addPartner = useCallback(async (partnerData: Omit<Partner, 'id'>): Promise<Partner> => {
    const id = `partner-${Date.now()}`;
    const newPartner: Partner = { ...partnerData, id };
    await dexieStorage.partneri.save(newPartner);
    setPartneri((prev) => [newPartner, ...prev]);
    appLogger.scope('PARTNERS:ADD').info(`Dodan novi partner: "${newPartner.naziv}" (${newPartner.oib})`);
    return newPartner;
  }, []);

  const updatePartner = useCallback(async (id: string, partial: Partial<Partner>) => {
    const current = partneri.find((p) => p.id === id);
    if (!current) return;
    const updated = { ...current, ...partial };
    await dexieStorage.partneri.save(updated);
    setPartneri((prev) => prev.map((p) => (p.id === id ? updated : p)));
    appLogger.scope('PARTNERS:UPDATE').info(`Ažuriran partner: "${updated.naziv}"`);
  }, [partneri]);

  const deletePartner = useCallback(async (id: string) => {
    await dexieStorage.partneri.delete(id);
    setPartneri((prev) => prev.filter((p) => p.id !== id));
    appLogger.scope('PARTNERS:DELETE').info(`Obrisan partner ID: ${id}`);
  }, []);

  const filteredPartneri = useMemo(() => {
    if (!searchQuery.trim()) return partneri;
    const q = searchQuery.toLowerCase().trim();
    return partneri.filter(
      (p) =>
        p.naziv.toLowerCase().includes(q) ||
        Boolean(p.oib && p.oib.includes(q)) ||
        (p.grad && p.grad.toLowerCase().includes(q))
    );
  }, [partneri, searchQuery]);

  return {
    partneri,
    filteredPartneri,
    searchQuery,
    setSearchQuery,
    isLoading,
    addPartner,
    updatePartner,
    deletePartner,
    refreshPartners,
  };
}
