import { useState, useMemo, useCallback } from 'react';
import { 
  izdajDokument, 
  pretvoriPonuduURacun, 
  stornirajDokument, 
  evidentirajNaplatu, 
  formatHrvatskiIznos,
  type VrstaDokumenta, 
  type StatusDokumenta, 
  type Dokument 
} from '@obrtniq/core';
import type { UseInvoiceFormReturn } from './useInvoiceForm';
import type { UseInvoiceItemsReturn } from './useInvoiceItems';
import { DEFAULT_OBRT_PROFIL } from '../engine/obrt-profile';
import { buildDraftDokument, mapStavkeToFormItems } from '../engine/invoice-mapper';
import { fiscalService } from '../services/fiscal-service';
import { dexieStorage } from '../storage/dexie-db';
import { appLogger } from '../services/logger';

export interface UseInvoiceWorkflowOptions {
  form: UseInvoiceFormReturn;
  items: UseInvoiceItemsReturn;
  onStatsUpdate?: () => Promise<void>;
}

export interface UseInvoiceWorkflowReturn {
  docId: string;
  docType: VrstaDokumenta;
  docStatus: StatusDokumenta;
  brojDokumenta: string;
  datumIzdavanja: string;
  datumDospijeca: string;
  datumIsporuke: string;
  setDatumIzdavanja: (val: string) => void;
  setDatumDospijeca: (val: string) => void;
  setDatumIsporuke: (val: string) => void;
  poslovniProstorOznaka: string;
  setPoslovniProstorOznaka: (val: string) => void;
  naplatniUredjajOznaka: string;
  setNaplatniUredjajOznaka: (val: string) => void;
  zki?: string;
  jir?: string;
  fiskalniQrUrl?: string;
  fiskalizacijaStatus?: string;
  isLocked: boolean;
  isFormSubmittable: boolean;
  handleIssueDocument: () => Promise<void>;
  handleNewDocument: (vrsta?: VrstaDokumenta) => void;
  handleSelectDocument: (doc: Dokument) => void;
  handleStorno: () => Promise<void>;
  handleConvertOffer: () => Promise<void>;
  handleRecordPayment: () => Promise<void>;
  handleFiscalUpdated: (updatedDoc: Dokument) => void;
}

export function useInvoiceWorkflow({
  form,
  items,
  onStatsUpdate,
}: UseInvoiceWorkflowOptions): UseInvoiceWorkflowReturn {
  const [docId, setDocId] = useState<string>(() => `draft-${Date.now()}`);
  const [docType, setDocType] = useState<VrstaDokumenta>('RACUN');
  const [docStatus, setDocStatus] = useState<StatusDokumenta>('NACRT');
  const [brojDokumenta, setBrojDokumenta] = useState<string>('NACRT');
  const [datumIzdavanja, setDatumIzdavanja] = useState<string>('24.10.2026.');
  const [datumDospijeca, setDatumDospijeca] = useState<string>('03.11.2026.');
  const [datumIsporuke, setDatumIsporuke] = useState<string>('24.10.2026.');
  const [poslovniProstorOznaka, setPoslovniProstorOznaka] = useState<string>(
    () => DEFAULT_OBRT_PROFIL.poslovniProstorOznaka || 'POSL1'
  );
  const [naplatniUredjajOznaka, setNaplatniUredjajOznaka] = useState<string>(
    () => DEFAULT_OBRT_PROFIL.naplatniUredjajOznaka || '1'
  );

  const [zki, setZki] = useState<string | undefined>(undefined);
  const [jir, setJir] = useState<string | undefined>(undefined);
  const [fiskalniQrUrl, setFiskalniQrUrl] = useState<string | undefined>(undefined);
  const [fiskalizacijaStatus, setFiskalizacijaStatus] = useState<string | undefined>(undefined);

  const isLocked = docStatus !== 'NACRT';

  const isFormSubmittable = useMemo(() => {
    if (isLocked) return false;
    return form.isPartnerFormValid && items.isItemsValid;
  }, [isLocked, form.isPartnerFormValid, items.isItemsValid]);

  // Službeno izdavanje računa / fiskalizacija (F2)
  const handleIssueDocument = useCallback(async () => {
    if (!isFormSubmittable) return;

    try {
      const draftDokument = buildDraftDokument({
        docId,
        docType,
        partnerNaziv: form.partnerNaziv,
        oib: form.oib,
        iban: form.iban,
        items: items.items,
        ukupniIznos: items.ukupniIznos,
        datumIzdavanja,
        datumDospijeca,
        datumIsporuke,
        nacinPlacanja: form.nacinPlacanja,
        poslovniProstorOznaka,
        naplatniUredjajOznaka,
      });

      // Pohrani nacrt u Dexie bazu
      await dexieStorage.dokumenti.save(draftDokument);

      // Izvrši prijelaz stanja u IZDANO kroz Core Workflow Engine
      const izdani = await izdajDokument(dexieStorage.dokumenti, draftDokument, {
        obrtNaziv: DEFAULT_OBRT_PROFIL.naziv,
      });

      // Ako je gotovinski ili kartični račun, pokreni automatsku Fiskalizaciju 1.0 (ZKI + JIR)
      const isGotovinaIliKartica = form.nacinPlacanja.toUpperCase().includes('GOTOVINA') || 
                                  form.nacinPlacanja.toUpperCase().includes('KARTICA');

      if (docType === 'RACUN' && isGotovinaIliKartica) {
        const fiscalRes = await fiscalService.fiskalizirajDokument(izdani, DEFAULT_OBRT_PROFIL.oib, false);
        const updatedWithFiscal: Dokument = {
          ...izdani,
          zki: fiscalRes.zki,
          jir: fiscalRes.jir,
          qrKodUrl: fiscalRes.qrKodUrl,
          fiskalizacijaStatus: fiscalRes.status,
          fiskalizacijaGreska: fiscalRes.greska,
        };
        await dexieStorage.dokumenti.save(updatedWithFiscal);
        setZki(fiscalRes.zki);
        setJir(fiscalRes.jir);
        setFiskalniQrUrl(fiscalRes.qrKodUrl);
        setFiskalizacijaStatus(fiscalRes.status);
      } else {
        setZki(undefined);
        setJir(undefined);
        setFiskalniQrUrl(undefined);
        setFiskalizacijaStatus('NIJE_POTREBNO');
      }

      setBrojDokumenta(izdani.brojDokumenta);
      setDocStatus('IZDANO');
      if (onStatsUpdate) await onStatsUpdate();

      appLogger.scope('INVOICE:ISSUE').info(`Račun ${izdani.brojDokumenta} uspješno izdan i trajno zaključan!`, {
        brojDokumenta: izdani.brojDokumenta,
        iznos: izdani.ukupnoIznos,
        stavaka: izdani.stavke.length,
      });
    } catch (err: any) {
      appLogger.scope('INVOICE:ERROR').error(`Izdavanje računa nije uspjelo: ${err?.message || String(err)}`, {
        error: err?.message,
      });
      alert(`Greška pri izdavanju: ${err?.message || 'Nepoznata greška'}`);
    }
  }, [
    isFormSubmittable,
    docId,
    docType,
    form.partnerNaziv,
    form.oib,
    form.iban,
    form.nacinPlacanja,
    items.items,
    items.ukupniIznos,
    datumIzdavanja,
    datumDospijeca,
    datumIsporuke,
    poslovniProstorOznaka,
    naplatniUredjajOznaka,
    onStatsUpdate,
  ]);

  // Novi dokument (Reset forme na novi NACRT)
  const handleNewDocument = useCallback((vrsta: VrstaDokumenta = 'RACUN') => {
    const newId = `doc-${Date.now()}`;
    setDocId(newId);
    setDocType(vrsta);
    setDocStatus('NACRT');
    setBrojDokumenta('NACRT');
    setPoslovniProstorOznaka(DEFAULT_OBRT_PROFIL.poslovniProstorOznaka || 'POSL1');
    setNaplatniUredjajOznaka(DEFAULT_OBRT_PROFIL.naplatniUredjajOznaka || '1');
    setZki(undefined);
    setJir(undefined);
    setFiskalniQrUrl(undefined);
    setFiskalizacijaStatus(undefined);
    items.resetItems();
    appLogger.scope('INVOICE:DRAFT').info(`Otvoren novi prazan nacrt (${vrsta})`, {
      docId: newId,
    });
  }, [items]);

  // Učitavanje postojećeg dokumenta iz Dexie baze
  const handleSelectDocument = useCallback((doc: Dokument) => {
    setDocId(doc.id);
    setDocType(doc.vrstaDokumenta);
    setDocStatus(doc.status);
    setBrojDokumenta(doc.brojDokumenta);
    if (doc.poslovniProstorOznaka) setPoslovniProstorOznaka(doc.poslovniProstorOznaka);
    if (doc.naplatniUredjajOznaka) setNaplatniUredjajOznaka(doc.naplatniUredjajOznaka);
    form.hydrateFromDocument(doc);
    setDatumIzdavanja(doc.datumIzdavanja);
    setDatumDospijeca(doc.datumDospijeca);
    if (doc.datumIsporuke) setDatumIsporuke(doc.datumIsporuke);
    setZki(doc.zki);
    setJir(doc.jir);
    setFiskalniQrUrl(doc.qrKodUrl);
    setFiskalizacijaStatus(doc.fiskalizacijaStatus);

    if (doc.stavke && doc.stavke.length > 0) {
      items.setItems(mapStavkeToFormItems(doc.stavke));
    }

    appLogger.scope('INVOICE:LOAD').info(`Učitan dokument ${doc.brojDokumenta} (${doc.status})`, {
      docId: doc.id,
      brojDokumenta: doc.brojDokumenta,
    });
  }, [form, items]);

  // Storniranje izdanog računa
  const handleStorno = useCallback(async () => {
    if (docStatus !== 'IZDANO') return;
    const confirmStorno = confirm(`Jeste li sigurni da želite stornirati račun ${brojDokumenta}? Stvorit će se novi storno račun u nizu.`);
    if (!confirmStorno) return;

    try {
      const stornoDoc = await stornirajDokument(dexieStorage.dokumenti, docId, {
        datumIzdavanja: new Date().toISOString().slice(0, 10),
        vrijemeIzdavanja: new Date().toLocaleTimeString('hr-HR'),
        razlogStorna: 'Korisnički storno računa',
      });

      handleSelectDocument(stornoDoc);
      if (onStatsUpdate) await onStatsUpdate();

      appLogger.scope('INVOICE:STORNO').warn(`Račun ${brojDokumenta} storniran. Izdan storno račun ${stornoDoc.brojDokumenta}`, {
        stornoBroj: stornoDoc.brojDokumenta,
        izvorniBroj: brojDokumenta,
      });
    } catch (err: any) {
      alert(`Greška pri storniranju: ${err?.message || 'Nepoznata greška'}`);
    }
  }, [docStatus, brojDokumenta, docId, handleSelectDocument, onStatsUpdate]);

  // Konverzija ponude u račun jednim klikom
  const handleConvertOffer = useCallback(async () => {
    if (docType !== 'PONUDA') return;
    try {
      const noviRacun = await pretvoriPonuduURacun(dexieStorage.dokumenti, docId, {
        obrtNaziv: DEFAULT_OBRT_PROFIL.naziv,
        automatskiIzdaj: true,
      });
      handleSelectDocument(noviRacun);
      if (onStatsUpdate) await onStatsUpdate();

      appLogger.scope('INVOICE:CONVERT').info(`Ponuda ${brojDokumenta} uspješno pretvorena u račun ${noviRacun.brojDokumenta}`, {
        noviBroj: noviRacun.brojDokumenta,
      });
    } catch (err: any) {
      alert(`Greška pri konverziji: ${err?.message || 'Nepoznata greška'}`);
    }
  }, [docType, docId, handleSelectDocument, onStatsUpdate, brojDokumenta]);

  // Evidentiranje uplate u KPR
  const handleRecordPayment = useCallback(async () => {
    if (docStatus !== 'IZDANO') return;
    const datum = prompt('Unesite datum uplate po bankovnom izvodu (YYYY-MM-DD):', new Date().toISOString().slice(0, 10));
    if (!datum) return;
    const izvod = prompt('Unesite broj izvoda (opcionalno):', 'Izvod 1/2026') || undefined;

    try {
      await evidentirajNaplatu(dexieStorage.kpr, dexieStorage.dokumenti, {
        dokumentId: docId,
        datumNaplate: datum,
        iznos: items.ukupniIznos,
        nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
        opisPlatitelja: `${form.partnerNaziv} - Račun ${brojDokumenta}`,
        brojIzvoda: izvod,
      });

      setDocStatus('PLACENO');
      if (onStatsUpdate) await onStatsUpdate();

      appLogger.scope('KPR:PAYMENT').info(`Račun ${brojDokumenta} evidentiran kao plaćen u KPR-u (${formatHrvatskiIznos(items.ukupniIznos)})`, {
        brojDokumenta,
        iznos: items.ukupniIznos,
        datum,
        izvod,
      });
    } catch (err: any) {
      alert(`Greška pri upisu u KPR: ${err?.message || 'Nepoznata greška'}`);
    }
  }, [docStatus, docId, items.ukupniIznos, form.partnerNaziv, brojDokumenta, onStatsUpdate]);

  const handleFiscalUpdated = useCallback((updatedDoc: Dokument) => {
    setZki(updatedDoc.zki);
    setJir(updatedDoc.jir);
    setFiskalniQrUrl(updatedDoc.qrKodUrl);
    setFiskalizacijaStatus(updatedDoc.fiskalizacijaStatus);
  }, []);

  return {
    docId,
    docType,
    docStatus,
    brojDokumenta,
    datumIzdavanja,
    datumDospijeca,
    datumIsporuke,
    setDatumIzdavanja,
    setDatumDospijeca,
    setDatumIsporuke,
    poslovniProstorOznaka,
    setPoslovniProstorOznaka,
    naplatniUredjajOznaka,
    setNaplatniUredjajOznaka,
    zki,
    jir,
    fiskalniQrUrl,
    fiskalizacijaStatus,
    isLocked,
    isFormSubmittable,
    handleIssueDocument,
    handleNewDocument,
    handleSelectDocument,
    handleStorno,
    handleConvertOffer,
    handleRecordPayment,
    handleFiscalUpdated,
  };
}
