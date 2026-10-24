import { describe, it, expect, beforeEach } from 'vitest';
import { 
  odrediKvartal, 
  odrediPorezniRazred, 
  evidentirajNaplatu, 
  izracunajKprSazetak,
  POREZNI_RAZREDI 
} from '../src/domain/kpr';
import { generatePosdXml, validatePosdXml } from '../src/domain/posd-xml';
import { InMemoryObrtnIQStorage } from '../src/storage/memory-adapter';
import type { Dokument } from '../src/domain/types';

describe('Knjiga Prometa (KPR) & Obrazac PO-SD (Faza 6)', () => {
  let storage: InMemoryObrtnIQStorage;

  const validOib = '69435151530';
  const obrtInfo = {
    oib: validOib,
    naziv: 'Robot Hand Made, obrt za računalno programiranje',
  };

  beforeEach(() => {
    storage = new InMemoryObrtnIQStorage();
  });

  it('točno određuje kvartale na temelju datuma uplate', () => {
    expect(odrediKvartal('2026-01-15')).toBe(1);
    expect(odrediKvartal('2026-03-31')).toBe(1);
    expect(odrediKvartal('2026-04-01')).toBe(2);
    expect(odrediKvartal('2026-06-30')).toBe(2);
    expect(odrediKvartal('2026-07-01')).toBe(3);
    expect(odrediKvartal('2026-09-30')).toBe(3);
    expect(odrediKvartal('2026-10-01')).toBe(4);
    expect(odrediKvartal('2026-12-31')).toBe(4);
  });

  it('točno mapira porezne razrede za paušalni obrt (1 do 5 i prag 40.000 €)', () => {
    expect(odrediPorezniRazred(5000)?.razred).toBe(1);
    expect(odrediPorezniRazred(11500)?.razred).toBe(1);
    expect(odrediPorezniRazred(11500.01)?.razred).toBe(2);
    expect(odrediPorezniRazred(15000)?.razred).toBe(2);
    expect(odrediPorezniRazred(18500)?.razred).toBe(3);
    expect(odrediPorezniRazred(25000)?.razred).toBe(4);
    expect(odrediPorezniRazred(39999)?.razred).toBe(5);
    expect(odrediPorezniRazred(40000)?.razred).toBe(5);
    // Iznad 40.000 € je prekoračenje praga
    expect(odrediPorezniRazred(40000.01)).toBeNull();
  });

  it('evidentira naplatu računa u KPR tek činom uplate i ažurira status dokumenta u PLACENO', async () => {
    const doc: Dokument = {
      id: 'doc-kpr-1',
      partnerId: 'p-1',
      partnerNazivSnapshot: 'Alpha d.o.o.',
      partnerOibSnapshot: validOib,
      partnerAdresaSnapshot: 'Zagreb',
      vrstaDokumenta: 'RACUN',
      godina: 2026,
      brojSekvenca: 1,
      brojDokumenta: '1/POSL1/1',
      poslovniProstorOznaka: 'POSL1',
      naplatniUredjajOznaka: '1',
      datumIzdavanja: '2026-01-10',
      vrijemeIzdavanja: '10:00:00',
      datumDospijeca: '2026-01-25',
      datumIsporuke: '2026-01-10',
      nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
      iban: 'HR3123600001101234567',
      pozivNaBroj: 'HR00 1-2026',
      jeReverseCharge: false,
      zakonskaNapomena: '',
      status: 'IZDANO',
      valuta: 'EUR',
      ukupnoOsnovica: 1250.00,
      ukupnoPdv: 0,
      ukupnoIznos: 1250.00,
      fiskalizacijaStatus: 'NIJE_POTREBNO',
      eracunStatus: 'NIJE_POTREBNO',
      stavke: [],
    };
    await storage.dokumenti.save(doc);

    // Evidencija uplate s datumom izvoda
    const kprStavka = await evidentirajNaplatu(storage.kpr, storage.dokumenti, {
      dokumentId: doc.id,
      datumNaplate: '2026-01-18',
      iznos: 1250.00,
      nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
      opisPlatitelja: 'Alpha d.o.o. - uplata po računu 1/POSL1/1',
      brojIzvoda: 'Izvod br. 12/2026',
    });

    expect(kprStavka.brojKprStavke).toBe(1);
    expect(kprStavka.kvartal).toBe(1);
    expect(kprStavka.iznosBezgotovinski).toBe(1250.00);
    expect(kprStavka.iznosGotovina).toBe(0);

    // Provjera statusa dokumenta
    const azuriraniDoc = await storage.dokumenti.getById(doc.id);
    expect(azuriraniDoc?.status).toBe('PLACENO');
  });

  it('obračunava kvartalni sažetak prometa za PO-SD', async () => {
    // 1 uplata u Q1 (1.000 €), 1 uplata u Q2 (2.000 €), 1 uplata u Q3 (3.000 € gotovina), 1 uplata u Q4 (4.000 €)
    await evidentirajNaplatu(storage.kpr, storage.dokumenti, {
      datumNaplate: '2026-02-10',
      iznos: 1000.00,
      nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
      opisPlatitelja: 'Kupac 1',
    });
    await evidentirajNaplatu(storage.kpr, storage.dokumenti, {
      datumNaplate: '2026-05-15',
      iznos: 2000.00,
      nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
      opisPlatitelja: 'Kupac 2',
    });
    await evidentirajNaplatu(storage.kpr, storage.dokumenti, {
      datumNaplate: '2026-08-20',
      iznos: 3000.00,
      nacinPlacanja: 'GOTOVINA',
      opisPlatitelja: 'Kupac 3',
    });
    await evidentirajNaplatu(storage.kpr, storage.dokumenti, {
      datumNaplate: '2026-11-05',
      iznos: 4000.00,
      nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
      opisPlatitelja: 'Kupac 4',
    });

    const sveStavke = await storage.kpr.getAll(2026);
    const posd = izracunajKprSazetak(sveStavke, 2026, obrtInfo);

    expect(posd.godina).toBe(2026);
    expect(posd.q1.ukupno).toBe(1000.00);
    expect(posd.q2.ukupno).toBe(2000.00);
    expect(posd.q3.gotovinaUkupno).toBe(3000.00);
    expect(posd.q3.ukupno).toBe(3000.00);
    expect(posd.q4.ukupno).toBe(4000.00);
    expect(posd.ukupnoGodina).toBe(10000.00);
    expect(posd.prekoracenPrag).toBe(false);
  });

  it('generira službeni PO-SD XML koji prolazi validaciju ePorezne', async () => {
    await evidentirajNaplatu(storage.kpr, storage.dokumenti, {
      datumNaplate: '2026-03-01',
      iznos: 5000.00,
      nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
      opisPlatitelja: 'Partner Q1',
    });
    await evidentirajNaplatu(storage.kpr, storage.dokumenti, {
      datumNaplate: '2026-06-01',
      iznos: 7000.00,
      nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
      opisPlatitelja: 'Partner Q2',
    });

    const sveStavke = await storage.kpr.getAll(2026);
    const posd = izracunajKprSazetak(sveStavke, 2026, obrtInfo);

    const xml = generatePosdXml({
      izvjestaj: posd,
      vlasnikImePrezime: 'Matija Obrtović',
      adresa: 'Ulica grada Vukovara 284, Čakovec',
      djelatnostNkd: '62.01',
    });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<ObrazacPOSD xmlns="http://e-porezna.porezna-uprava.hr/sheme/zahtjevi/ObrazacPOSD/v2_0"');
    expect(xml).toContain(`<OIB>${validOib}</OIB>`);
    expect(xml).toContain('<UkupnoOstvareniPrimici>12000.00</UkupnoOstvareniPrimici>');
    expect(xml).toContain('<PorezniRazred>2</PorezniRazred>'); // 11.500,01 do 15.000 € je razred 2

    // Validacija generiranog XML-a
    const val = validatePosdXml(xml);
    expect(val.valid).toBe(true);
    expect(val.errors.length).toBe(0);
    expect(val.godina).toBe(2026);
    expect(val.ukupnoPrimici).toBe(12000.00);
    expect(val.porezniRazred).toBe(2);
  });

  it('validator odbija neispravan XML s pogrešnim zbrojem ili nevažećim OIB-om', () => {
    const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<ObrazacPOSD xmlns="http://e-porezna.porezna-uprava.hr/sheme/zahtjevi/ObrazacPOSD/v2_0" verzijaSheme="2.0">
  <Zaglavlje>
    <RazdobljeOd>2026-01-01</RazdobljeOd>
    <PorezniObveznik>
      <OIB>12345678901</OIB>
    </PorezniObveznik>
  </Zaglavlje>
  <PodaciOPrometu>
    <Kvartal1><Gotovina>100.00</Gotovina><Bezgotovinski>0.00</Bezgotovinski><Ukupno>500.00</Ukupno></Kvartal1>
    <Kvartal2><Gotovina>0.00</Gotovina><Bezgotovinski>0.00</Bezgotovinski><Ukupno>0.00</Ukupno></Kvartal2>
    <Kvartal3><Gotovina>0.00</Gotovina><Bezgotovinski>0.00</Bezgotovinski><Ukupno>0.00</Ukupno></Kvartal3>
    <Kvartal4><Gotovina>0.00</Gotovina><Bezgotovinski>0.00</Bezgotovinski><Ukupno>0.00</Ukupno></Kvartal4>
    <UkupnoOstvareniPrimici>9999.00</UkupnoOstvareniPrimici>
  </PodaciOPrometu>
</ObrazacPOSD>`;

    const val = validatePosdXml(invalidXml);
    expect(val.valid).toBe(false);
    expect(val.errors.some(e => e.includes('Neispravan ili nepostojeći OIB'))).toBe(true);
    expect(val.errors.some(e => e.includes('Matematička neusklađenost u Kvartalu 1'))).toBe(true);
    expect(val.errors.some(e => e.includes('Neusklađena ukupna suma'))).toBe(true);
  });
});
