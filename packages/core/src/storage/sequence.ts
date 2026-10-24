import type { IDokumentRepository } from './interfaces';
import type { Dokument, VrstaDokumenta } from '../domain/types';

export interface NextSequenceResult {
  godina: number;
  brojSekvenca: number;
  poslovniProstorOznaka: string;
  naplatniUredjajOznaka: string;
  brojDokumenta: string; // Zakonski format: "1/POSL1/1"
}

/**
 * Formatira broj računa prema zakonskom propisu: {sekvenca}/{prostor}/{uređaj}
 * Primjer: "1/POSL1/1"
 */
export function formatBrojDokumenta(
  brojSekvenca: number, 
  poslovniProstorOznaka: string, 
  naplatniUredjajOznaka: string
): string {
  const prostor = poslovniProstorOznaka.trim() || 'POSL1';
  const uredjaj = naplatniUredjajOznaka.trim() || '1';
  return `${brojSekvenca}/${prostor}/${uredjaj}`;
}

/**
 * Generira sljedeći sekvencijalni broj računa bez rupa za zadanu godinu, prostor i uređaj
 */
export async function getNextSequenceNumber(
  repo: IDokumentRepository,
  godina: number,
  prostorOznaka: string,
  uredjajOznaka: string,
  vrsta: VrstaDokumenta = 'RACUN'
): Promise<NextSequenceResult> {
  const zadnji = await repo.getZadnjiBrojSekvence(godina, prostorOznaka, uredjajOznaka, vrsta);
  const brojSekvenca = zadnji + 1;
  const brojDokumenta = formatBrojDokumenta(brojSekvenca, prostorOznaka, uredjajOznaka);

  return {
    godina,
    brojSekvenca,
    poslovniProstorOznaka: prostorOznaka,
    naplatniUredjajOznaka: uredjajOznaka,
    brojDokumenta,
  };
}

/**
 * Pomoćna funkcija za storniranje računa:
 * 1. Postavlja status izvornog računa na 'STORNIRANO'
 * 2. Generira novi STORNO_RACUN dokument sa sljedećim brojem sekvence u nizu bez rupa
 */
export async function stornirajDokument(
  repo: IDokumentRepository,
  izvorniDokumentId: string,
  params: {
    datumIzdavanja: string;
    vrijemeIzdavanja: string;
    razlogStorna?: string;
  }
): Promise<Dokument> {
  const izvorni = await repo.getById(izvorniDokumentId);
  if (!izvorni) {
    throw new Error(`Izvorni dokument s ID-em ${izvorniDokumentId} nije pronađen.`);
  }

  if (izvorni.status === 'STORNIRANO') {
    throw new Error(`Dokument ${izvorni.brojDokumenta} je već storniran.`);
  }

  if (izvorni.vrstaDokumenta === 'STORNO_RACUN') {
    throw new Error('Nije moguće stornirati već postojeći storno račun.');
  }

  // Ažuriraj status izvornog dokumenta na STORNIRANO
  await repo.update(izvorni.id, {
    status: 'STORNIRANO',
  });

  // Generiraj sljedeći sekvencijalni broj
  const seq = await getNextSequenceNumber(
    repo,
    izvorni.godina,
    izvorni.poslovniProstorOznaka,
    izvorni.naplatniUredjajOznaka,
    'RACUN' // U Hrvatskoj storno računi dijele istu sekvencu kao i redovni računi
  );

  // Stvori storno stavke sa suprotnim predznakom
  const stornoStavke = izvorni.stavke.map((s, idx) => ({
    ...s,
    id: `${s.id}-storno`,
    redniBroj: idx + 1,
    kolicina: -Math.abs(s.kolicina),
    iznosPopusta: -Math.abs(s.iznosPopusta),
    osnovica: -Math.abs(s.osnovica),
    iznosPdv: -Math.abs(s.iznosPdv),
    ukupno: -Math.abs(s.ukupno),
  }));

  const stornoDokument: Dokument = {
    ...izvorni,
    id: `storno-${izvorni.id}-${Date.now()}`,
    vrstaDokumenta: 'STORNO_RACUN',
    izvorniDokumentId: izvorni.id,
    godina: seq.godina,
    brojSekvenca: seq.brojSekvenca,
    brojDokumenta: seq.brojDokumenta,
    datumIzdavanja: params.datumIzdavanja,
    vrijemeIzdavanja: params.vrijemeIzdavanja,
    datumDospijeca: params.datumIzdavanja,
    status: 'IZDANO',
    ukupnoOsnovica: -Math.abs(izvorni.ukupnoOsnovica),
    ukupnoPdv: -Math.abs(izvorni.ukupnoPdv),
    ukupnoIznos: -Math.abs(izvorni.ukupnoIznos),
    napomenaZaKupca: `Storno računa br. ${izvorni.brojDokumenta}. ${params.razlogStorna ? `Razlog: ${params.razlogStorna}` : ''}`.trim(),
    stavke: stornoStavke,
  };

  await repo.save(stornoDokument);
  return stornoDokument;
}
