import { useState, useMemo, useCallback } from 'react';
import type { FormItem, InvoicePreviewItem } from '../engine/types';
import type { Artikl } from '@obrtniq/core';
import { DEFAULT_INITIAL_ITEMS } from '../engine/obrt-profile';
import { mapFormItemsToPreviewItems } from '../engine/invoice-mapper';
import { appLogger } from '../services/logger';

export interface UseInvoiceItemsReturn {
  items: FormItem[];
  setItems: React.Dispatch<React.SetStateAction<FormItem[]>>;
  addItem: () => void;
  addArticleItem: (artikl: Artikl) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, partial: Partial<FormItem>) => void;
  resetItems: () => void;
  ukupniIznos: number;
  previewItems: InvoicePreviewItem[];
  isItemsValid: boolean;
}

export function useInvoiceItems(isLocked = false): UseInvoiceItemsReturn {
  const [items, setItems] = useState<FormItem[]>(DEFAULT_INITIAL_ITEMS);

  const ukupniIznos = useMemo(() => {
    return items.reduce((sum, it) => sum + it.kolicina * it.cijena, 0);
  }, [items]);

  const previewItems = useMemo(() => {
    return mapFormItemsToPreviewItems(items);
  }, [items]);

  const isItemsValid = useMemo(() => {
    if (items.length === 0) return false;
    return items.every((it) => it.kpdSifra.trim().length > 0 && it.kolicina > 0 && it.cijena >= 0);
  }, [items]);

  const addItem = useCallback(() => {
    if (isLocked) return;
    const newItem: FormItem = {
      id: `item-${Date.now()}`,
      kpdSifra: '62.02.10',
      kpdNaziv: 'Usluge savjetovanja u vezi s računalnim softverom',
      kolicina: 1,
      jedinicaMjere: 'sat',
      cijena: 100.0,
    };
    setItems((prev) => [...prev, newItem]);
    appLogger.scope('INVOICE:ITEMS').info('Dodana nova stavka na radnu plohu (Alt+N)', {
      ukupnoStavaka: items.length + 1,
    });
  }, [isLocked, items.length]);

  const addArticleItem = useCallback(
    (artikl: Artikl) => {
      if (isLocked) return;
      const newItem: FormItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        kpdSifra: artikl.kpdSifra,
        kpdNaziv: artikl.naziv,
        kolicina: 1,
        jedinicaMjere: artikl.jedinicaMjere || 'kom',
        cijena: artikl.cijenaOsnovica,
      };
      setItems((prev) => [...prev, newItem]);
      appLogger.scope('INVOICE:ITEMS').info('Dodana stavka iz cjenika artikala/usluga', {
        artiklId: artikl.id,
        naziv: artikl.naziv,
        kpd: artikl.kpdSifra,
        cijena: artikl.cijenaOsnovica,
      });
    },
    [isLocked]
  );

  const removeItem = useCallback(
    (id: string) => {
      if (isLocked) return;
      if (items.length <= 1) {
        alert('Dokument mora sadržavati barem jednu stavku.');
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== id));
    },
    [isLocked, items.length]
  );

  const updateItem = useCallback(
    (id: string, partial: Partial<FormItem>) => {
      if (isLocked) return;
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...partial } : it)));
    },
    [isLocked]
  );

  const resetItems = useCallback(() => {
    setItems([
      {
        id: `item-${Date.now()}`,
        kpdSifra: '62.01.11',
        kpdNaziv: 'Usluge dizajna i razvoja aplikacijskog softvera',
        kolicina: 1,
        jedinicaMjere: 'sat',
        cijena: 1250.0,
      },
    ]);
  }, []);

  return {
    items,
    setItems,
    addItem,
    addArticleItem,
    removeItem,
    updateItem,
    resetItems,
    ukupniIznos,
    previewItems,
    isItemsValid,
  };
}
