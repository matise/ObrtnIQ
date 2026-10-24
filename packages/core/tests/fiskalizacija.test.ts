// packages/core/tests/fiskalizacija.test.ts

import { describe, it, expect } from 'vitest';
import {
  generirajZkiRawString,
  md5Hex,
  izracunajZki,
  generateRacunZahtjevSoap,
  parseRacunOdgovorSoap,
  provjeriRokNaknadnogSlanja,
} from '../src/domain/fiskalizacija';

describe('Fiskalizacija 1.0 - ZKI i CIS SOAP Protokol', () => {
  it('ispravno računa RFC 1321 MD5 sažetke za standardne testne vektore', () => {
    // Prazan string
    expect(md5Hex('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    // Standardni RFC vektor
    expect(md5Hex('The quick brown fox jumps over the lazy dog')).toBe(
      '9e107d9d372bb6826bd81d3542a419d6'
    );
  });

  it('generira standardizirani sirovi niz znakova za potpis ZKI-ja prema specifikaciji Porezne uprave', () => {
    const raw = generirajZkiRawString({
      oib: '79102730089',
      datumVrijeme: '24.10.2026 14:30:00',
      brojOznakaRacuna: 1,
      oznakaPoslovnogProstora: 'POSL1',
      oznakaNaplatnogUredjaja: '1',
      ukupniIznos: 1250.0,
    });

    // OIB + DatumVrijeme + BrOznRac + OznPosPr + OznNapUr + UkupIzn
    expect(raw).toBe('7910273008924.10.2026 14:30:001POSL111250.00');
  });

  it('izračunava Zaštitni kod izdavatelja (ZKI) kao točno 32 heksadecimalna znaka', async () => {
    const zki = await izracunajZki({
      oib: '79102730089',
      datumVrijeme: '24.10.2026 14:30:00',
      brojOznakaRacuna: 1,
      oznakaPoslovnogProstora: 'POSL1',
      oznakaNaplatnogUredjaja: '1',
      ukupniIznos: 1250.0,
    });

    expect(zki).toHaveLength(32);
    expect(/^[a-f0-9]{32}$/.test(zki)).toBe(true);
  });

  it('odbija izračun ZKI-ja s nevažećim OIB-om', async () => {
    await expect(
      izracunajZki({
        oib: '12345678901', // Nevažeća kontrolna znamenka
        datumVrijeme: '24.10.2026 14:30:00',
        brojOznakaRacuna: 1,
        oznakaPoslovnogProstora: 'POSL1',
        oznakaNaplatnogUredjaja: '1',
        ukupniIznos: 100.0,
      })
    ).rejects.toThrow(/Neispravan OIB/);
  });

  it('generira ispravan SOAP XML zahtjev prema Poreznoj upravi (CIS f73)', () => {
    const soapXml = generateRacunZahtjevSoap({
      idPoruke: '12345678-1234-4234-8234-123456789abc',
      datumVrijeme: '24.10.2026T14:30:00',
      oib: '79102730089',
      uSustavuPdv: false,
      brojOznakaRacuna: 1,
      oznakaPoslovnogProstora: 'POSL1',
      oznakaNaplatnogUredjaja: '1',
      ukupniIznos: 1250.0,
      nacinPlacanja: 'G',
      oibOperatera: '79102730089',
      zki: 'd41d8cd98f00b204e9800998ecf8427e',
      naknadnaDostava: false,
    });

    expect(soapXml).toContain('xmlns:f73="http://www.apis-it.hr/fin/2012/types/f73"');
    expect(soapXml).toContain('<f73:Oib>79102730089</f73:Oib>');
    expect(soapXml).toContain('<f73:USustPdv>false</f73:USustPdv>');
    expect(soapXml).toContain('<f73:BrOznRac>1</f73:BrOznRac>');
    expect(soapXml).toContain('<f73:OznPosPr>POSL1</f73:OznPosPr>');
    expect(soapXml).toContain('<f73:OznNapUr>1</f73:OznNapUr>');
    expect(soapXml).toContain('<f73:UkupIzn>1250.00</f73:UkupIzn>');
    expect(soapXml).toContain('<f73:NacPlac>G</f73:NacPlac>');
    expect(soapXml).toContain('<f73:Zki>d41d8cd98f00b204e9800998ecf8427e</f73:Zki>');
    expect(soapXml).toContain('<f73:NakDost>false</f73:NakDost>');
  });

  it('uspješno parsira JIR iz uspješnog odgovora CIS poslužitelja', () => {
    const mockSuccessResponse = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:f73="http://www.apis-it.hr/fin/2012/types/f73">
  <soapenv:Body>
    <f73:RacunOdgovor Id="RacunOdgovor">
      <f73:Zaglavlje>
        <f73:DatumVrijeme>24.10.2026T14:30:01</f73:DatumVrijeme>
        <f73:IdPoruke>12345678-1234-4234-8234-123456789abc</f73:IdPoruke>
      </f73:Zaglavlje>
      <f73:Jir>e5b8d5f2-901e-450a-8d18-36c1e95fa110</f73:Jir>
    </f73:RacunOdgovor>
  </soapenv:Body>
</soapenv:Envelope>`;

    const parsed = parseRacunOdgovorSoap(mockSuccessResponse);
    expect(parsed.uspjesno).toBe(true);
    expect(parsed.jir).toBe('e5b8d5f2-901e-450a-8d18-36c1e95fa110');
    expect(parsed.porukaId).toBe('12345678-1234-4234-8234-123456789abc');
  });

  it('detektira greške Porezne uprave kada CIS vrati odbijenicu', () => {
    const mockErrorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:f73="http://www.apis-it.hr/fin/2012/types/f73">
  <soapenv:Body>
    <f73:RacunOdgovor Id="RacunOdgovor">
      <f73:Greske>
        <f73:Greska>
          <f73:Sifra>s002</f73:Sifra>
          <f73:Poruka>OIB obveznika iz poruke ne odgovara OIB-u iz certifikata</f73:Poruka>
        </f73:Greska>
      </f73:Greske>
    </f73:RacunOdgovor>
  </soapenv:Body>
</soapenv:Envelope>`;

    const parsed = parseRacunOdgovorSoap(mockErrorResponse);
    expect(parsed.uspjesno).toBe(false);
    expect(parsed.jir).toBeUndefined();
    expect(parsed.greske).toBeDefined();
    expect(parsed.greske?.[0]?.sifra).toBe('s002');
  });

  it('ispravno prati 48-satni rok za naknadno slanje offline izdanih računa', () => {
    // Upravo izdano
    const nowIso = new Date().toISOString();
    const statusSad = provjeriRokNaknadnogSlanja(nowIso);
    expect(statusSad.istekao).toBe(false);
    expect(statusSad.preostaloSati).toBeGreaterThanOrEqual(47);

    // Izdano prije 50 sati (isteklo)
    const prije50Sati = new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString();
    const statusIsteklo = provjeriRokNaknadnogSlanja(prije50Sati);
    expect(statusIsteklo.istekao).toBe(true);
    expect(statusIsteklo.preostaloSati).toBe(0);
  });
});
