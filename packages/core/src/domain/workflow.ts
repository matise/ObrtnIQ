import type { 
  Dokument, 
  StavkaDokumenta 
} from './types';
import type { IDokumentRepository } from '../storage/interfaces';
import { getNextSequenceNumber } from '../storage/sequence';
import { calculateDocumentTotals } from '../utils/calculator';
import { validateOib } from '../utils/oib';
import { validateIban } from '../utils/iban';
import { generateHub3Payload } from '../utils/hub3';
import { generateEpcQrPayload } from '../utils/epc-qr';

export interface WorkflowValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validira dokument prije službenog izdavanja i zaključavanja
 */
export function validateDokumentForIssue(doc: Dokument): WorkflowValidationResult {
  const errors: string[] = [];

  // 1. Provjera partnera
  if (!doc.partnerNazivSnapshot || doc.partnerNazivSnapshot.trim().length === 0) {
    errors.push('Naziv partnera je obvezan.');
  }

  if (doc.partnerOibSnapshot) {
    const oibClean = doc.partnerOibSnapshot.trim();
    if (oibClean.length > 0 && !validateOib(oibClean)) {
      errors.push(`OIB partnera "${oibClean}" nije valjan prema ISO 7064 MOD 11, 10.`);
    }
  }

  // 2. Provjera IBAN-a
  const ibanClean = (doc.iban || '').replace(/\s+/g, '');
  if (!ibanClean) {
    errors.push('Poslovni IBAN je obvezan.');
  } else if (!validateIban(ibanClean)) {
    errors.push(`Poslovni IBAN "${ibanClean}" nije valjan prema MOD 97.`);
  }

  // 3. Provjera stavaka
  if (!doc.stavke || doc.stavke.length === 0) {
    errors.push('Dokument mora sadržavati barem jednu stavku.');
  } else {
    doc.stavke.forEach((stavka, idx) => {
      const rbr = stavka.redniBroj || idx + 1;
      if (!stavka.naziv || stavka.naziv.trim().length === 0) {
        errors.push(`Stavka #${rbr}: Naziv stavke ne smije biti prazan.`);
      }
      if (stavka.kolicina <= 0) {
        errors.push(`Stavka #${rbr}: Količina mora biti veća od nule.`);
      }
      if (stavka.jedinicnaCijena < 0) {
        errors.push(`Stavka #${rbr}: Jedinična cijena ne smije biti negativna.`);
      }
      if (!stavka.kpdSifra || stavka.kpdSifra.trim().length === 0) {
        errors.push(`Stavka #${rbr}: KPD klasifikacijska šifra je obvezna za Fiskalizaciju 2.0.`);
      }
    });
  }

  // 4. Provjera iznosa (osim ako je storno)
  if (doc.vrstaDokumenta !== 'STORNO_RACUN' && doc.ukupnoIznos <= 0) {
    errors.push('Ukupan iznos dokumenta mora biti veći od 0,00 €.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Statusni automat: Prelazak dokumenta iz statusa 'NACRT' u status 'IZDANO'.
 * Dodjeljuje službeni sekvencijalni broj bez rupa, generira HUB-3 i EPC kodove te trajno zaključava dokument.
 */
export async function izdajDokument(
  repo: IDokumentRepository,
  draft: Dokument,
  options?: {
    datumIzdavanja?: string;
    vrijemeIzdavanja?: string;
    datumDospijeca?: string;
    obrtNaziv?: string;
  }
): Promise<Dokument> {
  // Immutability provjera: samo NACRT može prijeći u IZDANO
  if (draft.status !== 'NACRT') {
    throw new Error(
      `Nije moguće izdati dokument ${draft.brojDokumenta || draft.id} jer ima status "${draft.status}". Samo nacrti se mogu izdati.`
    );
  }

  // Provjera valjanosti
  const val = validateDokumentForIssue(draft);
  if (!val.valid) {
    throw new Error(`Izdavanje blokirano: ${val.errors.join(' | ')}`);
  }

  const now = new Date();
  const datumIzdavanja = options?.datumIzdavanja || now.toISOString().slice(0, 10);
  const vrijemeIzdavanja = options?.vrijemeIzdavanja || now.toTimeString().slice(0, 8);
  const godina = parseInt(datumIzdavanja.slice(0, 4), 10) || now.getFullYear();

  // Dodjela sekvence za račune i ponude
  const seq = await getNextSequenceNumber(
    repo,
    godina,
    draft.poslovniProstorOznaka || 'POSL1',
    draft.naplatniUredjajOznaka || '1',
    draft.vrstaDokumenta
  );

  // Rekapitulacija iznosa
  const totals = calculateDocumentTotals(draft.stavke);

  // Poziv na broj (npr. HR00 1-2026)
  const pozivNaBroj = `HR00 ${seq.brojSekvenca}-${godina}`;

  // Generiranje kodova za plaćanje (HUB-3 PDF417 i EPC QR)
  let hub3String: string | undefined;
  let epcQrString: string | undefined;

  try {
    hub3String = generateHub3Payload({
      iznosEur: totals.ukupnoIznos,
      platiteljImeAdresa: draft.partnerNazivSnapshot,
      primateljImeAdresa: options?.obrtNaziv || 'Obrt',
      primateljIban: draft.iban.replace(/\s+/g, ''),
      model: 'HR00',
      pozivNaBroj: `${seq.brojSekvenca}-${godina}`,
      sifraNamjene: 'GDSV',
      opisPlacanja: `${draft.vrstaDokumenta} ${seq.brojDokumenta}`,
    });
  } catch {
    // Ako nije moguće generirati (npr. inozemni kupac), ostaje undefined
  }

  try {
    epcQrString = generateEpcQrPayload({
      primateljIban: draft.iban.replace(/\s+/g, ''),
      primateljIme: options?.obrtNaziv || 'Obrt',
      iznosEur: totals.ukupnoIznos,
      opisPlacanja: `${draft.vrstaDokumenta} ${seq.brojDokumenta}`,
      pozivNaBroj: `${seq.brojSekvenca}-${godina}`,
    });
  } catch {
    // Inozemni / nepodržani
  }

  const izdaniDokument: Dokument = {
    ...draft,
    godina,
    brojSekvenca: seq.brojSekvenca,
    brojDokumenta: seq.brojDokumenta,
    datumIzdavanja,
    vrijemeIzdavanja,
    datumDospijeca: options?.datumDospijeca || draft.datumDospijeca || datumIzdavanja,
    pozivNaBroj,
    status: 'IZDANO',
    ukupnoOsnovica: totals.ukupnoOsnovica,
    ukupnoPdv: totals.ukupnoPdv,
    ukupnoIznos: totals.ukupnoIznos,
    hub3String,
    epcQrString,
  };

  // Trajno spremanje u perzistentni repozitorij
  await repo.save(izdaniDokument);

  return Object.freeze(izdaniDokument);
}

/**
 * Ažurira postojeći nacrt dokumenta.
 * Bacit će grešku ako se pokuša izmijeniti već izdani ili stornirani dokument (Immutability).
 */
export async function azurirajNacrt(
  repo: IDokumentRepository,
  id: string,
  partial: Partial<Dokument>
): Promise<Dokument> {
  const postojeci = await repo.getById(id);
  if (!postojeci) {
    throw new Error(`Dokument s ID-em "${id}" nije pronađen.`);
  }

  if (postojeci.status !== 'NACRT') {
    throw new Error(
      `Zakonski zabranjeno: Dokument ${postojeci.brojDokumenta} je u statusu "${postojeci.status}" i trajno je zaključan za izmjene. Za ispravke stvorite Storno račun.`
    );
  }

  // Ako su ažurirane stavke, ponovno izračunaj totale
  let azuriraniUkupno = {
    ukupnoOsnovica: postojeci.ukupnoOsnovica,
    ukupnoPdv: postojeci.ukupnoPdv,
    ukupnoIznos: postojeci.ukupnoIznos,
  };

  if (partial.stavke) {
    const totals = calculateDocumentTotals(partial.stavke);
    azuriraniUkupno = {
      ukupnoOsnovica: totals.ukupnoOsnovica,
      ukupnoPdv: totals.ukupnoPdv,
      ukupnoIznos: totals.ukupnoIznos,
    };
  }

  const azurirano: Dokument = {
    ...postojeci,
    ...partial,
    ...azuriraniUkupno,
    status: 'NACRT', // Osigurava da status ostane NACRT
  };

  await repo.update(id, azurirano);
  return azurirano;
}

/**
 * Logika konverzije ponude u gotov račun jednim klikom.
 * Klonira partnera i stavke iz ponude te stvara novi dokument vrste 'RACUN'.
 */
export async function pretvoriPonuduURacun(
  repo: IDokumentRepository,
  ponudaId: string,
  options?: {
    automatskiIzdaj?: boolean;
    obrtNaziv?: string;
  }
): Promise<Dokument> {
  const ponuda = await repo.getById(ponudaId);
  if (!ponuda) {
    throw new Error(`Ponuda s ID-em "${ponudaId}" ne postoji.`);
  }

  if (ponuda.vrstaDokumenta !== 'PONUDA') {
    throw new Error(`Dokument ${ponuda.brojDokumenta} nije ponuda, nego "${ponuda.vrstaDokumenta}".`);
  }

  const now = new Date();
  const datumIzdavanja = now.toISOString().slice(0, 10);
  const vrijemeIzdavanja = now.toTimeString().slice(0, 8);

  // Kloniranje stavaka s novim ID-evima
  const noviDokumentId = `racun-from-ponuda-${ponuda.id}-${Date.now()}`;
  const kloniraneStavke: StavkaDokumenta[] = ponuda.stavke.map((s, idx) => ({
    ...s,
    id: `${noviDokumentId}-st-${idx + 1}`,
    dokumentId: noviDokumentId,
    redniBroj: idx + 1,
  }));

  const noviRacunNacrt: Dokument = {
    ...ponuda,
    id: noviDokumentId,
    vrstaDokumenta: 'RACUN',
    izvorniDokumentId: ponuda.id,
    brojSekvenca: 0,
    brojDokumenta: 'NACRT',
    datumIzdavanja,
    vrijemeIzdavanja,
    status: 'NACRT',
    stavke: kloniraneStavke,
    napomenaZaKupca: `Izrađeno na temelju ponude br. ${ponuda.brojDokumenta}. ${ponuda.napomenaZaKupca || ''}`.trim(),
    hub3String: undefined,
    epcQrString: undefined,
  };

  if (options?.automatskiIzdaj) {
    return izdajDokument(repo, noviRacunNacrt, {
      obrtNaziv: options.obrtNaziv,
      datumIzdavanja,
      vrijemeIzdavanja,
    });
  }

  await repo.save(noviRacunNacrt);
  return noviRacunNacrt;
}
