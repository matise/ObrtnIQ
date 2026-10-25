// apps/web/tests/audit-export.test.ts
// Faza 20: Testovi za 1-klik arhivski revizorski paket (ZIP Export) - Gate-Check V20-6

import { describe, it, expect, beforeEach } from 'vitest';
import JSZip from 'jszip';
import {
  createInMemoryStorage,
  type ObrtProfil,
  validatePosdXml,
} from '@obrtniq/core';
import { generateAuditZipPackage } from '../src/services/audit-export-service';

describe('Faza 20: 1-Klik Arhivski Revizorski Paket (ZIP) - Gate-Check V20-6', () => {
  const sampleObrt: ObrtProfil = {
    id: 'obrt-1',
    naziv: 'ROBOT HAND MADE',
    vlasnikImePrezime: 'Matija Obrtnik',
    oib: '79102730089',
    ulicaIBroj: 'Ilica 10',
    postanskiBroj: '10000',
    mjesto: 'Zagreb',
    drzavaIso: 'HR',
    email: 'info@robothandmade.hr',
    iban: 'HR1224070001123456789',
    jePausalist: true,
    uSustavuPdv: false,
    poslovniProstorOznaka: 'POSL1',
    naplatniUredjajOznaka: '1',
    eracunPosrednik: 'BEZ_POSREDNIKA',
  };

  it('V20-6: Generira kompletan ZIP arhiv sa svim propisanim mapama i datotekama', async () => {
    const storage = createInMemoryStorage();
    const res = await generateAuditZipPackage({
      godina: 2026,
      obrtProfil: sampleObrt,
      storage,
    });

    expect(res).toBeDefined();
    expect(res.filename).toBe('ObrtnIQ_Porezni_Paket_79102730089_2026.zip');
    expect(res.fileCount).toBeGreaterThanOrEqual(7);
    expect(res.blob.size).toBeGreaterThan(0);

    // Otpakiravanje i verifikacija sadržaja ZIP-a pomoću JSZip
    const loadedZip = await JSZip.loadAsync(res.blob);
    const rootName = `ObrtnIQ_Porezni_Paket_79102730089_2026/`;

    // 1. KPR CSV
    const kprCsvFile = loadedZip.file(`${rootName}01_Knjiga_Prometa/KPR_2026.csv`);
    expect(kprCsvFile).not.toBeNull();
    const kprText = await kprCsvFile!.async('string');
    expect(kprText).toContain('Datum uplate');

    // 2. KPR Sažetak
    const kprSazetakFile = loadedZip.file(`${rootName}01_Knjiga_Prometa/KPR_Sazetak_2026.txt`);
    expect(kprSazetakFile).not.toBeNull();
    const kprSazetakText = await kprSazetakFile!.async('string');
    expect(kprSazetakText).toContain('KNJIGA PROMETA (KPR)');

    // 3. Obrazac PO-SD XML za ePoreznu
    const posdXmlFile = loadedZip.file(`${rootName}02_Obrazac_POSD/Obrazac_POSD_2026.xml`);
    expect(posdXmlFile).not.toBeNull();
    const xmlText = await posdXmlFile!.async('string');
    expect(xmlText).toContain('<ObrazacPOSD');
    expect(xmlText).toContain('79102730089');

    // Provjera sheme PO-SD XML-a
    const posdVal = validatePosdXml(xmlText);
    expect(posdVal.valid).toBe(true);

    // 4. Troškovnik i Registar DI
    const troskoviFile = loadedZip.file(`${rootName}03_Troskovnik_I_Imovina/Evidencija_Troskova_2026.csv`);
    expect(troskoviFile).not.toBeNull();

    const diFile = loadedZip.file(`${rootName}03_Troskovnik_I_Imovina/Registar_Dugotrajne_Imovine_2026.csv`);
    expect(diFile).not.toBeNull();

    // 5. Godišnja analitika
    const analitikaFile = loadedZip.file(`${rootName}04_Godisnja_Analitika/Financijski_Izvjestaj_Poslovanja_2026.txt`);
    expect(analitikaFile).not.toBeNull();

    // 6. Metapodaci revizije
    const metaFile = loadedZip.file(`${rootName}METAPODACI_REVIZIJA.json`);
    expect(metaFile).not.toBeNull();
    const metaJson = JSON.parse(await metaFile!.async('string'));
    expect(metaJson.aplikacija).toBe('ObrtnIQ');
    expect(metaJson.poreznaGodina).toBe(2026);
    expect(metaJson.obrt.oib).toBe('79102730089');
  });
});
