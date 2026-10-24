import { describe, it, expect, beforeEach } from 'vitest';
import { 
  validateDokumentForIssue, 
  izdajDokument, 
  azurirajNacrt, 
  pretvoriPonuduURacun 
} from '../src/domain/workflow';
import { stornirajDokument } from '../src/storage/sequence';
import { InMemoryObrtnIQStorage } from '../src/storage/memory-adapter';
import type { Dokument } from '../src/domain/types';

describe('Document Workflow & State Machine (Faza 5)', () => {
  let storage: InMemoryObrtnIQStorage;

  const validOib = '69435151530'; // Valid MOD 11,10 OIB
  
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

  const createBaseDraft = (id: string = 'draft-1'): Dokument => ({
    id,
    partnerId: 'partner-1',
    partnerNazivSnapshot: 'Alpha Inženjering d.o.o.',
    partnerOibSnapshot: validOib,
    partnerAdresaSnapshot: 'Ilica 242, Zagreb',
    vrstaDokumenta: 'RACUN',
    godina: 2026,
    brojSekvenca: 0,
    brojDokumenta: 'NACRT',
    poslovniProstorOznaka: 'POSL1',
    naplatniUredjajOznaka: '1',
    datumIzdavanja: '2026-10-24',
    vrijemeIzdavanja: '12:00:00',
    datumDospijeca: '2026-11-03',
    datumIsporuke: '2026-10-24',
    nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
    iban: validIban,
    pozivNaBroj: '',
    jeReverseCharge: false,
    zakonskaNapomena: 'Paušalni obrt, oslobođeno PDV-a po čl. 90. st. 2. Zakona o PDV-u.',
    status: 'NACRT',
    valuta: 'EUR',
    ukupnoOsnovica: 1250.00,
    ukupnoPdv: 0.00,
    ukupnoIznos: 1250.00,
    fiskalizacijaStatus: 'NIJE_POTREBNO',
    eracunStatus: 'NIJE_POTREBNO',
    stavke: [
      {
        id: 'st-1',
        dokumentId: id,
        redniBroj: 1,
        kpdSifra: '62.01.11',
        naziv: 'Razvoj web softvera po narudžbi',
        jedinicaMjere: 'sat',
        kolicina: 10,
        jedinicnaCijena: 125.00,
        popustPostotak: 0,
        iznosPopusta: 0,
        osnovica: 1250.00,
        stopaPdv: 0,
        iznosPdv: 0,
        ukupno: 1250.00,
      },
    ],
  });

  beforeEach(async () => {
    storage = new InMemoryObrtnIQStorage();
  });

  it('validira dokument i odbija izdavanje ako nedostaje partner ili stavke', () => {
    const invalidDoc = createBaseDraft();
    invalidDoc.partnerNazivSnapshot = '';
    invalidDoc.stavke = [];

    const res = validateDokumentForIssue(invalidDoc);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Naziv partnera je obvezan.');
    expect(res.errors).toContain('Dokument mora sadržavati barem jednu stavku.');
  });

  it('odbija izdavanje ako stavci nedostaje KPD klasifikacijska šifra (Fiskalizacija 2.0)', () => {
    const doc = createBaseDraft();
    doc.stavke[0].kpdSifra = '';

    const res = validateDokumentForIssue(doc);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes('KPD klasifikacijska šifra je obvezna'))).toBe(true);
  });

  it('uspješno izdaje nacrt i dodjeljuje sekvencu bez rupa (1/POSL1/1, 2/POSL1/1)', async () => {
    const draft1 = createBaseDraft('doc-1');
    const draft2 = createBaseDraft('doc-2');

    await storage.dokumenti.save(draft1);
    await storage.dokumenti.save(draft2);

    const issued1 = await izdajDokument(storage.dokumenti, draft1, { obrtNaziv: 'Moj Obrt' });
    expect(issued1.status).toBe('IZDANO');
    expect(issued1.brojSekvenca).toBe(1);
    expect(issued1.brojDokumenta).toBe('1/POSL1/1');
    expect(issued1.pozivNaBroj).toBe('HR00 1-2026');
    expect(issued1.hub3String).toBeDefined();
    expect(issued1.epcQrString).toBeDefined();

    const issued2 = await izdajDokument(storage.dokumenti, draft2, { obrtNaziv: 'Moj Obrt' });
    expect(issued2.status).toBe('IZDANO');
    expect(issued2.brojSekvenca).toBe(2);
    expect(issued2.brojDokumenta).toBe('2/POSL1/1');
  });

  it('zaključava izdani dokument i sprječava izmjene (Immutability Gate-Check)', async () => {
    const draft = createBaseDraft('doc-immutable');
    await storage.dokumenti.save(draft);

    const issued = await izdajDokument(storage.dokumenti, draft);
    expect(issued.status).toBe('IZDANO');

    // Pokušaj ponovnog izdavanja već izdanog dokumenta mora baciti grešku
    await expect(izdajDokument(storage.dokumenti, issued)).rejects.toThrow(/Samo nacrti se mogu izdati/);

    // Pokušaj izmjene izdanog dokumenta kroz azurirajNacrt mora baciti grešku
    await expect(
      azurirajNacrt(storage.dokumenti, issued.id, { partnerNazivSnapshot: 'Promijenjeni Naziv' })
    ).rejects.toThrow(/trajno je zaključan za izmjene/);
  });

  it('omogućuje ažuriranje nacrta i automatski preračunava totale', async () => {
    const draft = createBaseDraft('doc-calc');
    await storage.dokumenti.save(draft);

    const azurirano = await azurirajNacrt(storage.dokumenti, draft.id, {
      stavke: [
        {
          id: 'st-1',
          dokumentId: draft.id,
          redniBroj: 1,
          kpdSifra: '62.01.11',
          naziv: 'Konzultacije',
          jedinicaMjere: 'sat',
          kolicina: 2,
          jedinicnaCijena: 100.00,
          popustPostotak: 0,
          iznosPopusta: 0,
          osnovica: 200.00,
          stopaPdv: 0,
          iznosPdv: 0,
          ukupno: 200.00,
        },
        {
          id: 'st-2',
          dokumentId: draft.id,
          redniBroj: 2,
          kpdSifra: '62.02.10',
          naziv: 'Implementacija baze',
          jedinicaMjere: 'sat',
          kolicina: 5,
          jedinicnaCijena: 100.00,
          popustPostotak: 0,
          iznosPopusta: 0,
          osnovica: 500.00,
          stopaPdv: 0,
          iznosPdv: 0,
          ukupno: 500.00,
        },
      ],
    });

    expect(azurirano.ukupnoIznos).toBe(700.00);
    expect(azurirano.stavke.length).toBe(2);
  });

  it('omogućuje konverziju ponude u račun jednim klikom', async () => {
    const ponuda: Dokument = {
      ...createBaseDraft('ponuda-1'),
      vrstaDokumenta: 'PONUDA',
      brojDokumenta: 'Ponuda 10/2026',
    };
    await storage.dokumenti.save(ponuda);

    const noviRacun = await pretvoriPonuduURacun(storage.dokumenti, ponuda.id, {
      obrtNaziv: 'Moj Obrt',
      automatskiIzdaj: true,
    });

    expect(noviRacun.vrstaDokumenta).toBe('RACUN');
    expect(noviRacun.status).toBe('IZDANO');
    expect(noviRacun.brojSekvenca).toBe(1);
    expect(noviRacun.izvorniDokumentId).toBe('ponuda-1');
    expect(noviRacun.napomenaZaKupca).toContain('Ponuda 10/2026');
  });

  it('stornira račun, zaključava izvorni kao STORNIRANO i kreira negativni storno račun', async () => {
    const draft = createBaseDraft('doc-za-storno');
    await storage.dokumenti.save(draft);

    const izdan = await izdajDokument(storage.dokumenti, draft);
    expect(izdan.brojDokumenta).toBe('1/POSL1/1');

    const storno = await stornirajDokument(storage.dokumenti, izdan.id, {
      datumIzdavanja: '2026-10-25',
      vrijemeIzdavanja: '10:00:00',
      razlogStorna: 'Pogrešan iznos stavke',
    });

    expect(storno.vrstaDokumenta).toBe('STORNO_RACUN');
    expect(storno.brojSekvenca).toBe(2);
    expect(storno.brojDokumenta).toBe('2/POSL1/1');
    expect(storno.ukupnoIznos).toBe(-1250.00);
    expect(storno.stavke[0].kolicina).toBe(-10);

    const izvorniAžuriran = await storage.dokumenti.getById(izdan.id);
    expect(izvorniAžuriran?.status).toBe('STORNIRANO');
  });
});
