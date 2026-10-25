// apps/web/src/hooks/useRecurringInvoices.ts
// Faza 20: Upravljanje ponavljajućim računima i pretplatama (Subscriptions)

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  type RecurringProfile,
  type Dokument,
  type StavkaDokumenta,
  validirajRecurringProfil,
  izracunajSljedeceDospijece,
  izracunajUkupnoPretplate,
  jeDospjeloZaIzdavanje,
} from '@obrtniq/core';
import { dexieStorage } from '../storage/dexie-db';
import { appLogger } from '../services/logger';

export interface UseRecurringInvoicesReturn {
  profili: RecurringProfile[];
  dospjeliProfili: RecurringProfile[];
  ukupnoDospjeloEur: number;
  isLoading: boolean;
  loadProfili: () => Promise<void>;
  spasiProfil: (profil: RecurringProfile) => Promise<{ uspjeh: boolean; greske?: string[] }>;
  obrisiProfil: (id: string) => Promise<void>;
  promijeniAktivnost: (id: string, aktivan: boolean) => Promise<void>;
  generirajNacrt: (profilId: string) => Promise<Dokument | null>;
  generirajSveDospjele: () => Promise<Dokument[]>;
}

export function useRecurringInvoices(): UseRecurringInvoicesReturn {
  const [profili, setProfili] = useState<RecurringProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadProfili = useCallback(async () => {
    setIsLoading(true);
    try {
      if (dexieStorage.recurring) {
        const items = await dexieStorage.recurring.getAll();
        setProfili(items);
      }
    } catch (err: any) {
      appLogger.scope('RECURRING:HOOK').error('Greška pri dohvaćanju ponavljajućih računa:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfili();
  }, [loadProfili]);

  // Dospjeli profili za izdavanje na današnji datum
  const dospjeliProfili = useMemo(() => {
    const danas = new Date().toISOString().slice(0, 10);
    return profili.filter((p) => p.aktivan && jeDospjeloZaIzdavanje(p.sljedeceDospijeceDatum, danas));
  }, [profili]);

  // Ukupan iznos svih dospjelih pretplata
  const ukupnoDospjeloEur = useMemo(() => {
    return dospjeliProfili.reduce((acc, p) => acc + izracunajUkupnoPretplate(p.stavke), 0);
  }, [dospjeliProfili]);

  // Spremanje ili ažuriranje profila
  const spasiProfil = useCallback(
    async (profil: RecurringProfile): Promise<{ uspjeh: boolean; greske?: string[] }> => {
      const validacija = validirajRecurringProfil(profil);
      if (!validacija.valjano) {
        return { uspjeh: false, greske: validacija.greske };
      }

      try {
        if (dexieStorage.recurring) {
          await dexieStorage.recurring.save(profil);
          await loadProfili();
          appLogger.scope('RECURRING:SAVE').info(`Spremljen profil pretplate: ${profil.nazivPredloska}`, {
            id: profil.id,
          });
          return { uspjeh: true };
        }
        return { uspjeh: false, greske: ['Spremište nije inicijalizirano.'] };
      } catch (err: any) {
        appLogger.scope('RECURRING:SAVE').error('Greška pri spremanju profila:', err);
        return { uspjeh: false, greske: [err.message || 'Greška u bazi podataka.'] };
      }
    },
    [loadProfili]
  );

  // Brisanje profila
  const obrisiProfil = useCallback(
    async (id: string) => {
      try {
        if (dexieStorage.recurring) {
          await dexieStorage.recurring.delete(id);
          await loadProfili();
          appLogger.scope('RECURRING:DELETE').info(`Obrisan profil pretplate: ${id}`);
        }
      } catch (err: any) {
        appLogger.scope('RECURRING:DELETE').error('Greška pri brisanju profila:', err);
      }
    },
    [loadProfili]
  );

  // Uključivanje / isključivanje aktivnosti profila
  const promijeniAktivnost = useCallback(
    async (id: string, aktivan: boolean) => {
      try {
        if (dexieStorage.recurring) {
          await dexieStorage.recurring.update(id, { aktivan });
          await loadProfili();
        }
      } catch (err: any) {
        appLogger.scope('RECURRING:UPDATE').error('Greška pri promjeni aktivnosti profila:', err);
      }
    },
    [loadProfili]
  );

  // Generiranje jednog nacrta iz profila
  const generirajNacrt = useCallback(
    async (profilId: string): Promise<Dokument | null> => {
      try {
        if (!dexieStorage.recurring) return null;
        const profil = await dexieStorage.recurring.getById(profilId);
        if (!profil) return null;

        const now = new Date();
        const danasIso = now.toISOString().slice(0, 10);
        const docId = `draft-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Rok dospijeća (danas + rokPlacanjaDana)
        const dospijeceDate = new Date(now.getTime() + (profil.rokPlacanjaDana || 15) * 24 * 60 * 60 * 1000);
        const dospijeceIso = dospijeceDate.toISOString().slice(0, 10);

        // Mapiranje stavki iz profila u stavke dokumenta
        const stavke: StavkaDokumenta[] = profil.stavke.map((st, idx) => {
          const osnovica = st.kolicina * st.cijena;
          const popustIznos = st.popustPostotak ? (osnovica * st.popustPostotak) / 100 : 0;
          const net = osnovica - popustIznos;
          return {
            id: `${docId}-st-${idx + 1}`,
            dokumentId: docId,
            redniBroj: idx + 1,
            kpdSifra: st.kpdSifra || '62.01.11',
            naziv: st.naziv,
            jedinicaMjere: st.jedinicaMjere || 'kom',
            kolicina: st.kolicina,
            jedinicnaCijena: st.cijena,
            popustPostotak: st.popustPostotak || 0,
            iznosPopusta: popustIznos,
            osnovica: net,
            stopaPdv: 0,
            iznosPdv: 0,
            ukupno: net,
          };
        });

        const ukupnoIznos = stavke.reduce((acc, s) => acc + s.ukupno, 0);

        const noviDokument: Dokument = {
          id: docId,
          partnerId: profil.partnerId,
          partnerNazivSnapshot: profil.partnerNaziv,
          partnerOibSnapshot: profil.partnerOib,
          partnerAdresaSnapshot: profil.partnerAdresa || 'Hrvatska',
          vrstaDokumenta: 'RACUN',
          godina: now.getFullYear(),
          brojSekvenca: 0,
          brojDokumenta: 'NACRT',
          poslovniProstorOznaka: 'POSL1',
          naplatniUredjajOznaka: '1',
          datumIzdavanja: danasIso,
          vrijemeIzdavanja: now.toLocaleTimeString('hr-HR'),
          datumDospijeca: dospijeceIso,
          datumIsporuke: danasIso,
          nacinPlacanja: profil.nacinPlacanja,
          iban: (profil.partnerIban || '').replace(/\s+/g, ''),
          pozivNaBroj: '',
          jeReverseCharge: false,
          zakonskaNapomena: 'Paušalni obrt, oslobođeno PDV-a po čl. 90. st. 2. Zakona o PDV-u.',
          status: 'NACRT',
          valuta: 'EUR',
          ukupnoOsnovica: ukupnoIznos,
          ukupnoPdv: 0,
          ukupnoIznos: ukupnoIznos,
          fiskalizacijaStatus: 'NIJE_POTREBNO',
          eracunStatus: 'NIJE_POTREBNO',
          stavke,
          napomenaZaKupca: profil.biljeska,
        };

        // Spremi nacrt u bazu dokumenata
        await dexieStorage.dokumenti.save(noviDokument);

        // Ažuriraj datum sljedećeg dospijeća u profilu
        const sljedeciDatum = izracunajSljedeceDospijece(
          profil.sljedeceDospijeceDatum,
          profil.danUMjesecu,
          profil.frekvencija
        );

        await dexieStorage.recurring.update(profil.id, {
          zadnjeGeneriranoDatum: danasIso,
          sljedeceDospijeceDatum: sljedeciDatum,
        });

        await loadProfili();

        appLogger.scope('RECURRING:GENERATE').info(
          `Uspješno stvoren nacrt računa iz pretplate '${profil.nazivPredloska}'. Sljedeće dospijeće: ${sljedeciDatum}`
        );

        return noviDokument;
      } catch (err: any) {
        appLogger.scope('RECURRING:GENERATE').error('Greška pri generiranju nacrta računa:', err);
        return null;
      }
    },
    [loadProfili]
  );

  // Masovno generiranje svih dospjelih računa
  const generirajSveDospjele = useCallback(async (): Promise<Dokument[]> => {
    const generirani: Dokument[] = [];
    for (const profil of dospjeliProfili) {
      const doc = await generirajNacrt(profil.id);
      if (doc) {
        generirani.push(doc);
      }
    }
    return generirani;
  }, [dospjeliProfili, generirajNacrt]);

  return {
    profili,
    dospjeliProfili,
    ukupnoDospjeloEur,
    isLoading,
    loadProfili,
    spasiProfil,
    obrisiProfil,
    promijeniAktivnost,
    generirajNacrt,
    generirajSveDospjele,
  };
}
