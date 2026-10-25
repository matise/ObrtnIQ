// apps/web/tests/premises-workflow.test.ts
// Faza 20: Testovi za više poslovnih prostora i naplatnih uređaja (Gate-Check V20-4)

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInMemoryStorage,
  izdajDokument,
  type Dokument,
  formatirajBrojDokumenta,
  validirajOznakuProstora,
  validirajOznakuUredjaja,
} from '@obrtniq/core';

describe('Faza 20: Multi-Location & Multi-Device Workflow (Gate-Check V20-4)', () => {
  let storage: ReturnType<typeof createInMemoryStorage>;

  beforeEach(() => {
    storage = createInMemoryStorage();
  });

  const validOib = '69435151530';
  function generateValidHrIban(vbdi: string, racun10: string): string {
    const bban = vbdi + racun10;
    const numericString = bban + '172700';
    let remainder = 0;
    for (let i = 0; i < numericString.length; i += 7) {
      const chunk = remainder.toString() + numericString.slice(i, i + 7);
      remainder = parseInt(chunk, 10) % 97;
    }
    const checkDigits = (98 - remainder).toString().padStart(2, '0');
    return `HR${checkDigits}${bban}`;
  }
  const validIban = generateValidHrIban('2360000', '1101234567');

  const createDraft = (id: string, prostor: string, uredjaj: string): Dokument => ({
    id,
    partnerId: 'part-1',
    partnerNazivSnapshot: 'Adria Consulting d.o.o.',
    partnerOibSnapshot: validOib,
    partnerAdresaSnapshot: 'Zagreb',
    vrstaDokumenta: 'RACUN',
    godina: 2026,
    brojSekvenca: 0,
    brojDokumenta: 'NACRT',
    poslovniProstorOznaka: prostor,
    naplatniUredjajOznaka: uredjaj,
    datumIzdavanja: '2026-10-25',
    vrijemeIzdavanja: '12:00:00',
    datumDospijeca: '2026-11-10',
    datumIsporuke: '2026-10-25',
    nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
    iban: validIban,
    pozivNaBroj: '',
    jeReverseCharge: false,
    zakonskaNapomena: 'Paušalni obrt, oslobođeno PDV-a.',
    status: 'NACRT',
    valuta: 'EUR',
    ukupnoOsnovica: 500,
    ukupnoPdv: 0,
    ukupnoIznos: 500,
    fiskalizacijaStatus: 'NIJE_POTREBNO',
    eracunStatus: 'NIJE_POTREBNO',
    stavke: [
      {
        id: `${id}-st-1`,
        dokumentId: id,
        redniBroj: 1,
        naziv: 'Savjetodavne usluge',
        kolicina: 1,
        jedinicnaCijena: 500,
        osnovica: 500,
        stopaPdv: 0,
        iznosPdv: 0,
        ukupno: 500,
        kpdSifra: '62.01.1',
      },
    ],
  });

  it('V20-4: Neovisni numerički sljedovi za različite poslovne prostore', async () => {
    // 1. Izdavanje računa na POSL1 (Glavno sjedište)
    const draft1 = createDraft('draft-1', 'POSL1', '1');
    const doc1 = await izdajDokument(storage.dokumenti, draft1, { obrtNaziv: 'Moj Obrt' });
    expect(doc1.brojDokumenta).toBe('1/POSL1/1');
    expect(doc1.brojSekvenca).toBe(1);

    // 2. Izdavanje računa na TEREN (Rad na terenu) - mora početi od 1/TEREN/1 bez kolizije
    const draftTeren1 = createDraft('draft-teren-1', 'TEREN', '1');
    const docTeren1 = await izdajDokument(storage.dokumenti, draftTeren1, { obrtNaziv: 'Moj Obrt' });
    expect(docTeren1.brojDokumenta).toBe('1/TEREN/1');
    expect(docTeren1.brojSekvenca).toBe(1);

    // 3. Izdavanje drugog računa na POSL1 - sekvenca mora biti 2
    const draft2 = createDraft('draft-2', 'POSL1', '1');
    const doc2 = await izdajDokument(storage.dokumenti, draft2, { obrtNaziv: 'Moj Obrt' });
    expect(doc2.brojDokumenta).toBe('2/POSL1/1');
    expect(doc2.brojSekvenca).toBe(2);

    // 4. Izdavanje drugog računa na TEREN - sekvenca mora biti 2
    const draftTeren2 = createDraft('draft-teren-2', 'TEREN', '1');
    const docTeren2 = await izdajDokument(storage.dokumenti, draftTeren2, { obrtNaziv: 'Moj Obrt' });
    expect(docTeren2.brojDokumenta).toBe('2/TEREN/1');
    expect(docTeren2.brojSekvenca).toBe(2);
  });

  it('V20-4: Validacija oznaka prostora i uređaja', () => {
    expect(validirajOznakuProstora('POSL1').valjano).toBe(true);
    expect(validirajOznakuProstora('TEREN-ZG').valjano).toBe(true);
    expect(validirajOznakuProstora('').valjano).toBe(false);

    expect(validirajOznakuUredjaja('1').valjano).toBe(true);
    expect(validirajOznakuUredjaja('POS-1').valjano).toBe(true);
    expect(validirajOznakuUredjaja('').valjano).toBe(false);
  });

  it('V20-4: Formatiranje broja računa točno poštuje čl. 9 Zakona o fiskalizaciji', () => {
    expect(formatirajBrojDokumenta(1, 'POSL1', '1')).toBe('1/POSL1/1');
    expect(formatirajBrojDokumenta(42, 'TEREN', '2')).toBe('42/TEREN/2');
    expect(formatirajBrojDokumenta(100, 'URED2', '1')).toBe('100/URED2/1');
  });
});
