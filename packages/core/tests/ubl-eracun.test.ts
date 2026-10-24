// packages/core/tests/ubl-eracun.test.ts

import { describe, it, expect } from 'vitest';
import {
  generateUblInvoiceXml,
  validateUblInvoiceXml,
  mapJedinicaMjereToUblCode,
} from '../src/domain/ubl-eracun';
import type { Dokument, ObrtProfil, Partner } from '../src/domain/types';

describe('Fiskalizacija 2.0 - UBL 2.1 CIUS-HR i KPD 2025', () => {
  const mockObrt: ObrtProfil = {
    id: 'obrt-1',
    naziv: 'ROBOT HAND MADE, vl. Matija Capan',
    vlasnikImePrezime: 'Matija Capan',
    oib: '79102730089',
    ulicaIBroj: 'Ilica 242',
    postanskiBroj: '10000',
    mjesto: 'Zagreb',
    drzavaIso: 'HR',
    email: 'info@robothandmade.hr',
    iban: 'HR12 2360 0001 1234 5678',
    bicSwift: 'ZABAHR2X',
    jePausalist: true,
    uSustavuPdv: false,
    poslovniProstorOznaka: 'POSL1',
    naplatniUredjajOznaka: '1',
    eracunPosrednik: 'FINA',
  };

  const mockKupac: Partner = {
    id: 'partner-1',
    tipPartnera: 'PRAVNA_OSOBA',
    naziv: 'ACME d.o.o.',
    oib: '79102730089', // Koristimo validan ISO 7064 OIB za test
    adresa: 'Radnička cesta 80',
    postanskiBroj: '10000',
    grad: 'Zagreb',
    drzavaIso: 'HR',
    poreznaZona: 'DOMACI_B2B',
    aktivan: true,
  };

  const mockDokument: Dokument = {
    id: 'doc-1',
    partnerId: 'partner-1',
    partnerNazivSnapshot: 'ACME d.o.o.',
    partnerOibSnapshot: '79102730089',
    partnerAdresaSnapshot: 'Radnička cesta 80, Zagreb',
    vrstaDokumenta: 'RACUN',
    godina: 2026,
    brojSekvenca: 1,
    brojDokumenta: '1/POSL1/1',
    poslovniProstorOznaka: 'POSL1',
    naplatniUredjajOznaka: '1',
    datumIzdavanja: '2026-10-24',
    vrijemeIzdavanja: '14:30:00',
    datumDospijeca: '2026-11-07',
    datumIsporuke: '2026-10-24',
    nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
    iban: 'HR12 2360 0001 1234 5678',
    pozivNaBroj: 'HR00 1-2026',
    jeReverseCharge: false,
    zakonskaNapomena: 'Oslobođeno plaćanja PDV-a temeljem članka 90. stavka 2. Zakona o PDV-u.',
    status: 'IZDANO',
    valuta: 'EUR',
    ukupnoOsnovica: 1250.0,
    ukupnoPdv: 0.0,
    ukupnoIznos: 1250.0,
    fiskalizacijaStatus: 'NIJE_POTREBNO',
    eracunStatus: 'SPREMNO_ZA_SLANJE',
    stavke: [
      {
        id: 'stavka-1',
        dokumentId: 'doc-1',
        redniBroj: 1,
        kpdSifra: '62.01.11',
        naziv: 'Usluge računalnog programiranja i savjetovanja',
        jedinicaMjere: 'sat',
        kolicina: 25,
        jedinicnaCijena: 50.0,
        popustPostotak: 0,
        iznosPopusta: 0,
        osnovica: 1250.0,
        stopaPdv: 0,
        iznosPdv: 0,
        ukupno: 1250.0,
      },
    ],
  };

  it('ispravno mapira mjerne jedinice u propisane UN/ECE Rec 20 kodove', () => {
    expect(mapJedinicaMjereToUblCode('sat')).toBe('HUR');
    expect(mapJedinicaMjereToUblCode('h')).toBe('HUR');
    expect(mapJedinicaMjereToUblCode('kom')).toBe('C62');
    expect(mapJedinicaMjereToUblCode('usluga')).toBe('E48');
    expect(mapJedinicaMjereToUblCode('dan')).toBe('DAY');
    expect(mapJedinicaMjereToUblCode('mjesec')).toBe('MON');
  });

  it('generira valjani UBL 2.1 CIUS-HR XML s obaveznim KPD 2025 elementima', () => {
    const xml = generateUblInvoiceXml({
      dokument: mockDokument,
      obrt: mockObrt,
      kupac: mockKupac,
    });

    expect(xml).toContain('urn:cen.eu:en16931:2017#compliant#urn:mzoe.hr:cius-hr:1.0');
    expect(xml).toContain('<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>');
    expect(xml).toContain('<cbc:EndpointID schemeID="9934">79102730089</cbc:EndpointID>');
    expect(xml).toContain('<cbc:ItemClassificationCode listID="KPD2025">62.01.11</cbc:ItemClassificationCode>');
    expect(xml).toContain('<cbc:ID>E</cbc:ID>'); // Oslobođeno PDV-a
    expect(xml).toContain('članka 90. stavka 2.');
    expect(xml).toContain('<cbc:PayableAmount currencyID="EUR">1250.00</cbc:PayableAmount>');
  });

  it('generira InvoiceTypeCode 381 za storno račun', () => {
    const stornoDoc: Dokument = {
      ...mockDokument,
      vrstaDokumenta: 'STORNO_RACUN',
      brojDokumenta: '1-STORNO/POSL1/1',
      ukupnoIznos: -1250.0,
      ukupnoOsnovica: -1250.0,
    };

    const xml = generateUblInvoiceXml({
      dokument: stornoDoc,
      obrt: mockObrt,
      kupac: mockKupac,
    });

    expect(xml).toContain('<cbc:InvoiceTypeCode>381</cbc:InvoiceTypeCode>');
  });

  it('validira ispravno generiran UBL 2.1 e-Račun XML bez grešaka', () => {
    const xml = generateUblInvoiceXml({
      dokument: mockDokument,
      obrt: mockObrt,
      kupac: mockKupac,
    });

    const validation = validateUblInvoiceXml(xml);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(validation.kpdCodesCount).toBe(1);
    expect(validation.invoiceId).toBe('1/POSL1/1');
    expect(validation.totalAmount).toBe(1250.0);
  });

  it('detektira nedostatak KPD 2025 šifre ili nevažeći OIB', () => {
    const corruptedXml = `<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
      <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:mzoe.hr:cius-hr:1.0</cbc:CustomizationID>
      <cbc:ID>1/POSL1/1</cbc:ID>
      <cac:AccountingSupplierParty>
        <cac:Party>
          <cbc:EndpointID schemeID="9934">11111111111</cbc:EndpointID>
        </cac:Party>
      </cac:AccountingSupplierParty>
      <cac:LegalMonetaryTotal>
        <cbc:PayableAmount currencyID="EUR">100.00</cbc:PayableAmount>
      </cac:LegalMonetaryTotal>
    </Invoice>`;

    const validation = validateUblInvoiceXml(corruptedXml);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes('KPD 2025'))).toBe(true);
    expect(validation.errors.some((e) => e.includes('ISO 7064'))).toBe(true);
  });
});
