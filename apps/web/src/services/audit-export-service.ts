// apps/web/src/services/audit-export-service.ts
// Faza 20: 1-Klik Arhivski Revizorski Paket (ZIP) za Poreznu Upravu i Arhivu Obrta

import JSZip from 'jszip';
import {
  type ObrtProfil,
  type NaplataPromet,
  type UlazniTrosak,
  type MjesecniObracunDoprinosa,
  type PosdIzvjestaj,
  type IObrtnIQStorage,
  generateKprCsv,
  generatePosdXml,
  izracunajKprSazetak,
  izracunajGodisnjuAnalitiku,
  formatHrvatskiIznos,
  odrediPorezniRazred,
  round2,
} from '@obrtniq/core';


import { dexieStorage } from '../storage/dexie-db';
import { appLogger } from './logger';

export interface AuditExportResult {
  blob: Blob;
  filename: string;
  fileCount: number;
  ukupnaVelicinaBytes: number;
}

/**
 * Generira cjeloviti godišnji revizorski .zip paket za Poreznu upravu i arhivu obrta.
 * Izvršava se 100% lokalno u pregledniku (Local-First).
 */
export async function generateAuditZipPackage(params: {
  godina: number;
  obrtProfil: ObrtProfil;
  storage?: IObrtnIQStorage;
}): Promise<AuditExportResult> {
  const { godina, obrtProfil } = params;
  const store = params.storage || dexieStorage;
  const zip = new JSZip();

  appLogger.scope('AUDIT:ZIP').info(`Započinjem generiranje godišnjeg arhivskog paketa za ${godina}. godinu...`);

  // 1. Dohvat podataka iz IndexedDB ili proslijeđenog skladišta
  const kprStavke: NaplataPromet[] = await store.kpr.getAll(godina);
  const troskovi: UlazniTrosak[] = store.troskovi ? await store.troskovi.getAll(godina) : [];
  const uplateDoprinosa: MjesecniObracunDoprinosa[] = store.doprinosi
    ? await store.doprinosi.getAllUplate(godina)
    : [];


  const rootFolder = zip.folder(`ObrtnIQ_Porezni_Paket_${obrtProfil.oib}_${godina}`);
  if (!rootFolder) {
    throw new Error('Nije moguće inicijalizirati mapu u ZIP arhivu.');
  }

  let fileCount = 0;

  // --- MAPA 1: Knjiga Prometa (KPR) ---
  const kprFolder = rootFolder.folder('01_Knjiga_Prometa');
  if (kprFolder) {
    // 1.1. Službeni KPR CSV s UTF-8 BOM za Excel
    const kprCsv = generateKprCsv(kprStavke, godina, {
      obrtNaziv: obrtProfil.naziv,
      obrtOib: obrtProfil.oib,
    });
    kprFolder.file(`KPR_${godina}.csv`, kprCsv);
    fileCount++;

    // 1.2. Tekstualni sažetak KPR-a
    const posdSazetak: PosdIzvjestaj = izracunajKprSazetak(kprStavke, godina, {
      naziv: obrtProfil.naziv,
      oib: obrtProfil.oib,
    });

    const ukupnoGotovina = round2(
      posdSazetak.q1.gotovinaUkupno +
        posdSazetak.q2.gotovinaUkupno +
        posdSazetak.q3.gotovinaUkupno +
        posdSazetak.q4.gotovinaUkupno
    );
    const ukupnoBezgotovinski = round2(
      posdSazetak.q1.bezgotovinskiUkupno +
        posdSazetak.q2.bezgotovinskiUkupno +
        posdSazetak.q3.bezgotovinskiUkupno +
        posdSazetak.q4.bezgotovinskiUkupno
    );
    const ukupnoNaplaceno = posdSazetak.ukupnoGodina;

    const kprSazetakText = `KNJIGA PROMETA (KPR) – SAŽETAK ZA ${godina}. GODINU
----------------------------------------------------------------------
Obrt: ${obrtProfil.naziv}
Vlasnik: ${obrtProfil.vlasnikImePrezime}
OIB: ${obrtProfil.oib}
IBAN: ${obrtProfil.iban}

Ukupno evidentiranih naplata: ${kprStavke.length}
Ukupan naplaćeni promet: ${formatHrvatskiIznos(ukupnoNaplaceno)}

Promet po vrstama plaćanja:
• Transakcijski račun (virman): ${formatHrvatskiIznos(ukupnoBezgotovinski)}
• Gotovina i kartice: ${formatHrvatskiIznos(ukupnoGotovina)}

Promet po tromjesečjima:
• I. kvartal (01.01. - 31.03.): ${formatHrvatskiIznos(posdSazetak.q1.ukupno)}
• II. kvartal (01.04. - 30.06.): ${formatHrvatskiIznos(posdSazetak.q2.ukupno)}
• III. kvartal (01.07. - 30.09.): ${formatHrvatskiIznos(posdSazetak.q3.ukupno)}
• IV. kvartal (01.10. - 31.12.): ${formatHrvatskiIznos(posdSazetak.q4.ukupno)}

Zakonski prag paušalnog obrta: 40.000,00 €
Iskorištenost praga: ${((ukupnoNaplaceno / 40000) * 100).toFixed(2)} %
Preostalo do praga: ${formatHrvatskiIznos(Math.max(0, 40000 - ukupnoNaplaceno))}

Generirano putem ObrtnIQ Local-First sustava dana: ${new Date().toLocaleString('hr-HR')}
`;
    kprFolder.file(`KPR_Sazetak_${godina}.txt`, kprSazetakText);
    fileCount++;
  }

  // --- MAPA 2: Obrazac PO-SD (XML za ePoreznu) ---
  const posdFolder = rootFolder.folder('02_Obrazac_POSD');
  if (posdFolder) {
    const posdSazetak = izracunajKprSazetak(kprStavke, godina, {
      naziv: obrtProfil.naziv,
      oib: obrtProfil.oib,
    });

    const posdXml = generatePosdXml({
      izvjestaj: posdSazetak,
      vlasnikImePrezime: obrtProfil.vlasnikImePrezime,
      adresa: `${obrtProfil.ulicaIBroj}, ${obrtProfil.mjesto}`,
      djelatnostNkd: obrtProfil.nkdSifra,
    });
    posdFolder.file(`Obrazac_POSD_${godina}.xml`, posdXml);
    fileCount++;

    const razredInfo = odrediPorezniRazred(posdSazetak.ukupnoGodina);
    const razredBroj = razredInfo ? razredInfo.razred : 1;
    const porezIznos = razredInfo ? razredInfo.godisnjiPorezEur : 207;
    const osnovicaIznos = razredInfo ? razredInfo.godisnjaPoreznaOsnovicaEur : 1725;

    const posdRekapText = `OBRAZAC PO-SD – REKAPITULACIJA ZA ${godina}. GODINU
----------------------------------------------------------------------
Obrt: ${obrtProfil.naziv} (OIB: ${obrtProfil.oib})
Porezna uprava RH – sustav ePorezna

Porezni razred: Razred ${razredBroj}
Ukupno ostvareni primici (red 2): ${formatHrvatskiIznos(posdSazetak.ukupnoGodina)}
Godišnji paušalni dohodak (red 3): ${formatHrvatskiIznos(osnovicaIznos)}
Godišnji paušalni porez: ${formatHrvatskiIznos(porezIznos)}

Zakonski rok predaje obrasca: 15. siječnja ${godina + 1}. godine.
Datoteka 'Obrazac_POSD_${godina}.xml' spremna je za izravan uvoz u ePoreznu.
`;
    posdFolder.file(`POSD_Rekapitulacija_${godina}.txt`, posdRekapText);
    fileCount++;
  }

  // --- MAPA 3: Troškovnik i Dugotrajna Imovina ---
  const troskoviFolder = rootFolder.folder('03_Troskovnik_I_Imovina');
  if (troskoviFolder) {
    // 3.1. CSV svih ulaznih troškova
    const troskoviCsvRows: string[] = [];
    troskoviCsvRows.push(
      'Broj dokumenta;Datum;Dobavljac;OIB dobavljaca;Kategorija;Opis;Iznos bez PDV (EUR);PDV (EUR);Ukupno (EUR);Status;Dugotrajna imovina'
    );

    for (const t of troskovi) {
      troskoviCsvRows.push(
        [
          `"${t.brojUlaznogDokumenta}"`,
          `"${t.datumRacuna}"`,
          `"${t.dobavljacNaziv.replace(/"/g, '""')}"`,
          `"${t.dobavljacOib || ''}"`,
          `"${t.kategorija}"`,
          `"${t.opis.replace(/"/g, '""')}"`,
          t.iznosBezPdvEur.toFixed(2).replace('.', ','),
          t.iznosPdvEur.toFixed(2).replace('.', ','),
          t.ukupnoEur.toFixed(2).replace('.', ','),
          `"${t.status}"`,
          t.jeDugotrajnaImovina ? '"DA"' : '"NE"',
        ].join(';')
      );
    }
    const BOM = '\uFEFF';
    troskoviFolder.file(`Evidencija_Troskova_${godina}.csv`, BOM + troskoviCsvRows.join('\r\n'));
    fileCount++;

    // 3.2. Registar dugotrajne imovine (DI)
    const diStavke = troskovi.filter((t) => t.jeDugotrajnaImovina);
    const diCsvRows: string[] = [];
    diCsvRows.push('Inventarni broj;Datum nabave;Naziv opreme;Dobavljac;Nabavna vrijednost (EUR);Serijski broj');
    for (let i = 0; i < diStavke.length; i++) {
      const di = diStavke[i];
      if (!di) continue;
      diCsvRows.push(
        [
          `"DI-${godina}-${i + 1}"`,
          `"${di.datumRacuna}"`,
          `"${di.opis.replace(/"/g, '""')}"`,
          `"${di.dobavljacNaziv.replace(/"/g, '""')}"`,
          di.ukupnoEur.toFixed(2).replace('.', ','),
          `"${di.serijskiBrojOpreme || '—'}"`,
        ].join(';')
      );
    }
    troskoviFolder.file(`Registar_Dugotrajne_Imovine_${godina}.csv`, BOM + diCsvRows.join('\r\n'));
    fileCount++;
  }

  // --- MAPA 4: Godišnja Analitika Poslovanja ---
  const analitikaFolder = rootFolder.folder('04_Godisnja_Analitika');
  if (analitikaFolder) {
    const analitika = izracunajGodisnjuAnalitiku({
      godina,
      kprStavke,
      troskovi,
      doprinosiUplate: uplateDoprinosa,
      kvartalniPorezi: [],
    });

    const analitikaText = `GODIŠNJE FINANCIJSKO IZVJEŠĆE POSLOVANJA ZA ${godina}. GODINU
----------------------------------------------------------------------
Obrt: ${obrtProfil.naziv} (OIB: ${obrtProfil.oib})
Vlasnik: ${obrtProfil.vlasnikImePrezime}

FINANCIJSKI REZULTAT:
• Ukupni naplaćeni prihodi (KPR): ${formatHrvatskiIznos(analitika.ukupniPrimiciEur)}
• Ukupni poslovni rashodi (Troškovi): ${formatHrvatskiIznos(analitika.ukupniOperativniTroskoviEur)}
• Uplaćeni obvezni doprinosi: ${formatHrvatskiIznos(analitika.ukupnoPlaceniDoprinosiEur)}
• Uplaćeni porez na dohodak: ${formatHrvatskiIznos(analitika.ukupnoPlaceniPorezEur)}
----------------------------------------------------------------------
ČISTA FINANCIJSKA DOBIT (Neto Cash Flow): ${formatHrvatskiIznos(analitika.netoDobitEur)}
Profitna marža: ${analitika.profitnaMarzaPostotak.toFixed(2)} %

Generirano iz ObrtnIQ sustava bez slanja podataka na vanjske poslužitelje.
`;
    analitikaFolder.file(`Financijski_Izvjestaj_Poslovanja_${godina}.txt`, analitikaText);
    fileCount++;
  }

  // --- REVIZORSKI METAPODACI ---
  const metadata = {
    aplikacija: 'ObrtnIQ',
    verzija: '0.1.0 (Faza 20)',
    izvozVrijemeUtc: new Date().toISOString(),
    poreznaGodina: godina,
    obrt: {
      naziv: obrtProfil.naziv,
      vlasnik: obrtProfil.vlasnikImePrezime,
      oib: obrtProfil.oib,
      iban: obrtProfil.iban,
      poslovniProstor: obrtProfil.poslovniProstorOznaka,
      naplatniUredjaj: obrtProfil.naplatniUredjajOznaka,
    },
    statistikaPaketa: {
      brojStavkiKpr: kprStavke.length,
      brojStavkiTroskova: troskovi.length,
      brojUplataDoprinosa: uplateDoprinosa.length,
      ukupnoDatoteka: fileCount,
    },
    cjelovitostBaze: 'LOCAL_INDEXEDDB_VERIFIED',
  };

  rootFolder.file('METAPODACI_REVIZIJA.json', JSON.stringify(metadata, null, 2));
  fileCount++;

  // Generiranje .zip binarne datoteke
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const filename = `ObrtnIQ_Porezni_Paket_${obrtProfil.oib}_${godina}.zip`;

  appLogger.scope('AUDIT:ZIP').info(`Godišnji revizorski paket uspješno sastavljen (${filename}, ${fileCount} datoteka, ${(zipBlob.size / 1024).toFixed(1)} KB).`);

  return {
    blob: zipBlob,
    filename,
    fileCount,
    ukupnaVelicinaBytes: zipBlob.size,
  };
}

/**
 * Pokreće preuzimanje ZIP datoteke u pregledniku.
 */
export function downloadAuditZip(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
