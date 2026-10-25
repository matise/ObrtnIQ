// apps/web/tests/recurring-invoices.test.ts
// Faza 20: Testovi za pohranu i motor ponavljajućih računa (Gate-Check V20-2)

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInMemoryStorage,
  type RecurringProfile,
  type Dokument,
  izracunajUkupnoPretplate,
  izracunajSljedeceDospijece,
} from '@obrtniq/core';

describe('Faza 20: Ponavljajući računi (Dexie/Memory Storage & Workflow) - Gate-Check V20-2', () => {
  let storage: ReturnType<typeof createInMemoryStorage>;

  beforeEach(() => {
    storage = createInMemoryStorage();
  });

  const sampleProfil: RecurringProfile = {
    id: 'rec-test-1',
    nazivPredloska: 'Mjesečni IT paušal',
    partnerId: 'partner-1',
    partnerNaziv: 'Acme Hrvatska d.o.o.',
    partnerOib: '12345678901',
    partnerTaxZone: 'DOMACI',
    partnerIban: 'HR1224070001123456789',
    frekvencija: 'MJESECNO',
    danUMjesecu: 1,
    nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
    rokPlacanjaDana: 15,
    aktivan: true,
    datumPocetka: '2026-01-01',
    sljedeceDospijeceDatum: '2026-05-01',
    stavke: [
      {
        naziv: 'Redovito održavanje web aplikacije',
        kolicina: 1,
        cijena: 600.0,
      },
    ],
    biljeska: 'Ugovor br. 15/2026',
  };

  it('V20-2: Pohrana, dohvat i ažuriranje profila pretplate', async () => {
    expect(storage.recurring).toBeDefined();
    await storage.recurring!.save(sampleProfil);

    const dohvaceni = await storage.recurring!.getById('rec-test-1');
    expect(dohvaceni).not.toBeNull();
    expect(dohvaceni?.nazivPredloska).toBe('Mjesečni IT paušal');
    expect(dohvaceni?.partnerNaziv).toBe('Acme Hrvatska d.o.o.');

    // Ažuriranje
    await storage.recurring!.update('rec-test-1', { aktivan: false });
    const azurirani = await storage.recurring!.getById('rec-test-1');
    expect(azurirani?.aktivan).toBe(false);

    // Dohvat aktivnih
    const aktivni = await storage.recurring!.getAll(true);
    expect(aktivni).toHaveLength(0);

    const svi = await storage.recurring!.getAll();
    expect(svi).toHaveLength(1);

    // Brisanje
    await storage.recurring!.delete('rec-test-1');
    const nakonBrisanja = await storage.recurring!.getById('rec-test-1');
    expect(nakonBrisanja).toBeNull();
  });

  it('V20-2: getDospjeli točno filtrira samo aktivne profile kojima je dospio termin', async () => {
    // 1. Profil koji dospijeva 2026-05-01 (aktivan)
    await storage.recurring!.save(sampleProfil);

    // 2. Profil koji dospijeva 2026-06-01 (budući)
    await storage.recurring!.save({
      ...sampleProfil,
      id: 'rec-future',
      sljedeceDospijeceDatum: '2026-06-01',
    });

    // 3. Profil koji dospijeva 2026-04-01 ali je NEAKTIVAN
    await storage.recurring!.save({
      ...sampleProfil,
      id: 'rec-inactive',
      sljedeceDospijeceDatum: '2026-04-01',
      aktivan: false,
    });

    // Na dan 2026-05-02 dospio je samo 'rec-test-1'
    const dospjeli = await storage.recurring!.getDospjeli('2026-05-02');
    expect(dospjeli).toHaveLength(1);
    expect(dospjeli[0]!.id).toBe('rec-test-1');
  });

  it('V20-2: Simulacija generiranja nacrta i ažuriranje sljedećeg termina', async () => {
    await storage.recurring!.save(sampleProfil);

    const profil = await storage.recurring!.getById('rec-test-1');
    expect(profil).not.toBeNull();

    // Generiranje nacrta dokumenta
    const docId = `draft-${Date.now()}`;
    const ukupno = izracunajUkupnoPretplate(profil!.stavke);

    const draftDoc: Dokument = {
      id: docId,
      partnerId: profil!.partnerId,
      partnerNazivSnapshot: profil!.partnerNaziv,
      partnerOibSnapshot: profil!.partnerOib,
      partnerAdresaSnapshot: 'Hrvatska',
      vrstaDokumenta: 'RACUN',
      godina: 2026,
      brojSekvenca: 0,
      brojDokumenta: 'NACRT',
      poslovniProstorOznaka: 'POSL1',
      naplatniUredjajOznaka: '1',
      datumIzdavanja: '2026-05-01',
      vrijemeIzdavanja: '10:00:00',
      datumDospijeca: '2026-05-16',
      datumIsporuke: '2026-05-01',
      nacinPlacanja: profil!.nacinPlacanja,
      iban: profil!.partnerIban || '',
      pozivNaBroj: '',
      jeReverseCharge: false,
      zakonskaNapomena: 'Paušalni obrt, oslobođeno PDV-a.',
      status: 'NACRT',
      valuta: 'EUR',
      ukupnoOsnovica: ukupno,
      ukupnoPdv: 0,
      ukupnoIznos: ukupno,
      fiskalizacijaStatus: 'NIJE_POTREBNO',
      eracunStatus: 'NIJE_POTREBNO',
      stavke: profil!.stavke.map((s, idx) => ({
        id: `${docId}-st-${idx + 1}`,
        dokumentId: docId,
        redniBroj: idx + 1,
        naziv: s.naziv,
        jedinicaMjere: s.jedinicaMjere || 'kom',
        kolicina: s.kolicina,
        jedinicnaCijena: s.cijena,
        popustPostotak: s.popustPostotak || 0,
        iznosPopusta: 0,
        osnovica: s.kolicina * s.cijena,
        stopaPdv: 0,
        iznosPdv: 0,
        ukupno: s.kolicina * s.cijena,
      })),
    };

    // Spremanje u dokumente
    await storage.dokumenti.save(draftDoc);
    const spremljeniDoc = await storage.dokumenti.getById(docId);
    expect(spremljeniDoc).not.toBeNull();
    expect(spremljeniDoc?.status).toBe('NACRT');
    expect(spremljeniDoc?.ukupnoIznos).toBe(600.0);

    // Pomicanje termina na sljedeći mjesec (1. lipnja 2026.)
    const sljedeciDatum = izracunajSljedeceDospijece(
      profil!.sljedeceDospijeceDatum,
      profil!.danUMjesecu,
      profil!.frekvencija
    );
    expect(sljedeciDatum).toBe('2026-06-01');

    await storage.recurring!.update(profil!.id, {
      zadnjeGeneriranoDatum: '2026-05-01',
      sljedeceDospijeceDatum: sljedeciDatum,
    });

    const azuriraniProfil = await storage.recurring!.getById(profil!.id);
    expect(azuriraniProfil?.sljedeceDospijeceDatum).toBe('2026-06-01');
    expect(azuriraniProfil?.zadnjeGeneriranoDatum).toBe('2026-05-01');
  });
});
