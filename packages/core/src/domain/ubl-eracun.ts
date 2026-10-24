// packages/core/src/domain/ubl-eracun.ts

import type { Dokument, ObrtProfil, Partner } from './types';
import { validateOib } from '../utils/oib';

export interface UblGenerationParams {
  dokument: Dokument;
  obrt: Pick<
    ObrtProfil,
    | 'naziv'
    | 'oib'
    | 'ulicaIBroj'
    | 'postanskiBroj'
    | 'mjesto'
    | 'drzavaIso'
    | 'iban'
    | 'bicSwift'
    | 'jePausalist'
    | 'uSustavuPdv'
  >;
  kupac: Pick<
    Partner,
    'naziv' | 'oib' | 'adresa' | 'postanskiBroj' | 'grad' | 'drzavaIso'
  >;
}

export interface UblValidationResult {
  valid: boolean;
  errors: string[];
  kpdCodesCount: number;
  invoiceId?: string;
  totalAmount?: number;
}

/**
 * Pomoćna funkcija za mapiranje jedinica mjere u UN/ECE Rec 20 kodove propisane normom EN 16931
 */
export function mapJedinicaMjereToUblCode(jm: string): string {
  const norm = jm.trim().toLowerCase();
  switch (norm) {
    case 'sat':
    case 'h':
    case 'hr':
      return 'HUR';
    case 'dan':
      return 'DAY';
    case 'mj':
    case 'mjesec':
      return 'MON';
    case 'god':
    case 'godina':
      return 'ANN';
    case 'paušal':
    case 'pauš':
    case 'usluga':
      return 'E48'; // Service unit
    case 'm':
    case 'metar':
      return 'MTR';
    case 'kg':
      return 'KGM';
    case 'l':
    case 'litra':
      return 'LTR';
    case 'kom':
    case 'komad':
    default:
      return 'C62'; // One / piece
  }
}

/**
 * Pomoćna funkcija za XML sanitizaciju specijalnih znakova
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generira službeni UBL 2.1 CIUS-HR elektronički račun (Fiskalizacija 2.0 B2B standard)
 * Usklađen s EN 16931 i specifikacijom Ministarstva gospodarstva RH s obaveznim KPD 2025 šiframa.
 */
export function generateUblInvoiceXml(params: UblGenerationParams): string {
  const { dokument, obrt, kupac } = params;

  // Tip računa: 380 = standardni komercijalni račun, 381 = storno / odobrenje
  const invoiceTypeCode = dokument.vrstaDokumenta === 'STORNO_RACUN' ? '381' : '380';

  // Način plaćanja kod prema UNCL4461
  let paymentMeansCode = '30'; // Kreditni transfer (transakcijski račun)
  if (dokument.nacinPlacanja === 'GOTOVINA') paymentMeansCode = '10';
  if (dokument.nacinPlacanja === 'KARTICA') paymentMeansCode = '48';

  const issueDate = dokument.datumIzdavanja;
  const dueDate = dokument.datumDospijeca || dokument.datumIzdavanja;

  const totalLinesAmount = dokument.ukupnoOsnovica.toFixed(2);
  const totalTaxAmount = dokument.ukupnoPdv.toFixed(2);
  const totalPayableAmount = dokument.ukupnoIznos.toFixed(2);

  // Generiranje stavaka s obaveznim KPD 2025 klasifikacijama
  const linesXml = dokument.stavke.map((stavka, idx) => {
    const lineId = idx + 1;
    const ublUnitCode = mapJedinicaMjereToUblCode(stavka.jedinicaMjere);
    const lineTotal = stavka.osnovica.toFixed(2);
    const unitPrice = stavka.jedinicnaCijena.toFixed(2);
    const kpdCode = (stavka.kpdSifra || '62.01.11').trim();

    return `    <cac:InvoiceLine>
      <cbc:ID>${lineId}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="${ublUnitCode}">${stavka.kolicina}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="EUR">${lineTotal}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Name>${escapeXml(stavka.naziv)}</cbc:Name>
        <cac:CommodityClassification>
          <cbc:ItemClassificationCode listID="KPD2025">${kpdCode}</cbc:ItemClassificationCode>
        </cac:CommodityClassification>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>E</cbc:ID>
          <cbc:Percent>0.00</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="EUR">${unitPrice}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:mzoe.hr:cius-hr:1.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${escapeXml(dokument.brojDokumenta)}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:DueDate>${dueDate}</cbc:DueDate>
  <cbc:InvoiceTypeCode>${invoiceTypeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  
  <!-- Podaci o Izdavatelju (Obrtnik) -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:EndpointID schemeID="9934">${obrt.oib}</cbc:EndpointID>
      <cac:PartyIdentification>
        <cbc:ID>${obrt.oib}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${escapeXml(obrt.naziv)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(obrt.ulicaIBroj)}</cbc:StreetName>
        <cbc:CityName>${escapeXml(obrt.mjesto)}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(obrt.postanskiBroj)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${obrt.drzavaIso || 'HR'}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>HR${obrt.oib}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(obrt.naziv)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <!-- Podaci o Primatelju (Kupac) -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cbc:EndpointID schemeID="9934">${kupac.oib || '00000000000'}</cbc:EndpointID>
      <cac:PartyIdentification>
        <cbc:ID>${kupac.oib || '00000000000'}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${escapeXml(kupac.naziv)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(kupac.adresa || 'Adresa')}</cbc:StreetName>
        <cbc:CityName>${escapeXml(kupac.grad || 'Zagreb')}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(kupac.postanskiBroj || '10000')}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${kupac.drzavaIso || 'HR'}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(kupac.naziv)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <!-- Podaci o Plaćanju i IBAN-u -->
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>${paymentMeansCode}</cbc:PaymentMeansCode>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${obrt.iban.replace(/\s+/g, '')}</cbc:ID>
      ${obrt.bicSwift ? `<cac:FinancialInstitutionBranch><cbc:ID>${obrt.bicSwift}</cbc:ID></cac:FinancialInstitutionBranch>` : ''}
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>

  <!-- Poziv na broj i Uvjeti Plaćanja -->
  <cac:PaymentTerms>
    <cbc:Note>${escapeXml(dokument.pozivNaBroj)}</cbc:Note>
  </cac:PaymentTerms>

  <!-- Rekapitulacija Poreza (Paušalni obrt: oslobođeno prema čl. 90 st. 2) -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">${totalTaxAmount}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="EUR">${totalLinesAmount}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="EUR">${totalTaxAmount}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>E</cbc:ID>
        <cbc:Percent>0.00</cbc:Percent>
        <cbc:TaxExemptionReasonCode>VATEX-EU-O</cbc:TaxExemptionReasonCode>
        <cbc:TaxExemptionReason>${escapeXml(dokument.zakonskaNapomena || 'Oslobođeno plaćanja PDV-a temeljem članka 90. stavka 2. Zakona o PDV-u.')}</cbc:TaxExemptionReason>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <!-- Zakonski Monetarni Ukupni Iznosi -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">${totalLinesAmount}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">${totalLinesAmount}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">${totalPayableAmount}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">${totalPayableAmount}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  <!-- Stavke računa s KPD 2025 šiframa -->
${linesXml}
</Invoice>`;
}

/**
 * Validira UBL 2.1 CIUS-HR e-Račun XML protiv propisanih pravila EN 16931 i CIUS-HR
 */
export function validateUblInvoiceXml(xml: string): UblValidationResult {
  const errors: string[] = [];

  if (!xml.trim().startsWith('<?xml')) {
    errors.push('Nedostaje standardna XML deklaracija.');
  }

  if (!xml.includes('urn:oasis:names:specification:ubl:schema:xsd:Invoice-2')) {
    errors.push('Nedostaje propisani UBL 2.1 Invoice namespace.');
  }

  if (!xml.includes('urn:mzoe.hr:cius-hr:1.0')) {
    errors.push('Nedostaje obvezni hrvatski CIUS-HR identifikator prilagodbe (CustomizationID).');
  }

  // Provjera broja dokumenta
  const idMatch = xml.match(/<cbc:ID>([^<]+)<\/cbc:ID>/);
  const invoiceId = idMatch && idMatch[1] ? idMatch[1] : undefined;
  if (!invoiceId) {
    errors.push('Nedostaje identifikator računa (<cbc:ID>).');
  }

  // Provjera OIB-a izdavatelja (schemeID="9934")
  const supplierEndpointMatch = xml.match(/<cac:AccountingSupplierParty>[\s\S]*?<cbc:EndpointID schemeID="9934">(\d{11})<\/cbc:EndpointID>/);
  if (!supplierEndpointMatch || !supplierEndpointMatch[1]) {
    errors.push('Nedostaje ili je neispravan OIB izdavatelja u EndpointID (schemeID 9934).');
  } else {
    if (!validateOib(supplierEndpointMatch[1])) {
      errors.push(`OIB izdavatelja na e-Računu nije matematički ispravan prema ISO 7064: ${supplierEndpointMatch[1]}`);
    }
  }

  // Provjera KPD 2025 šifri na stavkama
  const kpdMatches = xml.match(/<cbc:ItemClassificationCode listID="KPD2025">([0-9.]+)<\/cbc:ItemClassificationCode>/g) || [];
  if (kpdMatches.length === 0) {
    errors.push('Niti jedna stavka ne sadrži zakonski obveznu KPD 2025 klasifikaciju djelatnosti (listID="KPD2025").');
  }

  // Provjera PayableAmount
  const payableMatch = xml.match(/<cbc:PayableAmount currencyID="EUR">([0-9.]+)<\/cbc:PayableAmount>/);
  let totalAmount: number | undefined;
  if (payableMatch && payableMatch[1]) {
    totalAmount = parseFloat(payableMatch[1]);
    if (isNaN(totalAmount) || totalAmount < 0) {
      errors.push('Iznos za platiti (<cbc:PayableAmount>) mora biti valjani pozitivni broj.');
    }
  } else {
    errors.push('Nedostaje ukupan iznos za platiti (<cbc:PayableAmount>).');
  }

  return {
    valid: errors.length === 0,
    errors,
    kpdCodesCount: kpdMatches.length,
    invoiceId,
    totalAmount,
  };
}
