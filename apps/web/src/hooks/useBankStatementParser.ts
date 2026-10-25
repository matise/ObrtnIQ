// apps/web/src/hooks/useBankStatementParser.ts

import { useState, useCallback } from 'react';
import { 
  parseBankStatementCsv,
  upariTransakcijuSRacunom,
  evidentirajNaplatu,
  type BankStatementParseResult,
  type StavkaIzvoda
} from '@obrtniq/core';
import { dexieStorage } from '../storage/dexie-db';
import { appLogger } from '../services/logger';

export function useBankStatementParser(onReconciled?: () => void) {
  const [statementData, setStatementData] = useState<BankStatementParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Učitavanje i parsiranje datoteke
  const parseFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const text = await file.text();
      const parsed = parseBankStatementCsv(text);

      // Dohvati sve izdane dokumente za automatsko uparivanje
      const allDocs = await dexieStorage.dokumenti.getAll();
      const unplacedDocs = allDocs.filter(d => d.status === 'IZDANO');

      // Pokušaj automatskog uparivanja za svaku stavku
      const stavkeWithMatches: StavkaIzvoda[] = parsed.stavke.map(st => {
        if (st.smjer === 'UPLATA') {
          const matchId = upariTransakcijuSRacunom(st, unplacedDocs);
          if (matchId) {
            return {
              ...st,
              povezaniDokumentId: matchId,
            };
          }
        }
        return st;
      });

      setStatementData({
        ...parsed,
        stavke: stavkeWithMatches,
      });

      appLogger.scope('STATEMENT:PARSER').info(`Uspješno parsiran bankovni izvod: ${file.name} (${parsed.brojStavaka} stavaka)`, {
        uplate: parsed.ukupnoUplateEur,
        isplate: parsed.ukupnoIsplateEur,
      });
    } catch (err: any) {
      const msg = err?.message || 'Neuspjelo parsiranje datoteke bankovnog izvoda.';
      setErrorMessage(msg);
      appLogger.scope('STATEMENT:PARSER').error('Greška pri parsiranju izvoda:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Jednoklikno knjiženje odabrane uplate u KPR i saldiranje računa
  const proknjiziUplatuUKpr = useCallback(async (stavkaId: string, dokumentId?: string) => {
    if (!statementData) return;

    const stavka = statementData.stavke.find(s => s.id === stavkaId);
    if (!stavka) return;

    try {
      const targetDocId = dokumentId || stavka.povezaniDokumentId;

      await evidentirajNaplatu(dexieStorage.kpr, dexieStorage.dokumenti, {
        dokumentId: targetDocId,
        datumNaplate: stavka.datumKnjizenja,
        iznos: stavka.iznosEur,
        nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
        opisPlatitelja: stavka.nazivPartnera,
        brojIzvoda: stavka.brojIzvoda,
      });

      // Ažuriraj stanje stavke u memoriji
      setStatementData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          stavke: prev.stavke.map(s => {
            if (s.id === stavkaId) {
              return {
                ...s,
                statusPovezivanja: 'POVEZANO_KPR',
                povezaniDokumentId: targetDocId,
              };
            }
            return s;
          }),
        };
      });

      appLogger.scope('STATEMENT:RECONCILE').info(`Uplata ${stavka.nazivPartnera} (${stavka.iznosEur} €) uspješno proknjižena u KPR!`);

      if (onReconciled) {
        onReconciled();
      }
    } catch (err: any) {
      appLogger.scope('STATEMENT:RECONCILE').error('Greška pri knjiženju uplate u KPR:', err);
      alert(`Greška pri knjiženju u KPR: ${err?.message || 'Nepoznata greška'}`);
    }
  }, [statementData, onReconciled]);

  // Poništavanje / čišćenje učitanog izvoda
  const resetStatement = useCallback(() => {
    setStatementData(null);
    setErrorMessage(null);
  }, []);

  return {
    statementData,
    isProcessing,
    errorMessage,
    parseFile,
    proknjiziUplatuUKpr,
    resetStatement,
  };
}
