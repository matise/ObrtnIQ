// packages/core/src/domain/premises.ts
// Faza 20: Više poslovnih prostora i naplatnih uređaja (čl. 9 i 10 Zakona o fiskalizaciji RH)

export interface NaplatniUredjajConfig {
  oznaka: string; // npr. "1", "2"
  naziv: string;  // npr. "Glavno računalo", "Mobilni POS"
  jeAktivan: boolean;
}

export interface PoslovniProstorConfig {
  oznaka: string;      // npr. "POSL1", "TEREN", "URED2"
  naziv: string;       // npr. "Sjedište obrta - Ured", "Rad na terenu"
  adresa: string;      // npr. "Ilica 10, Zagreb"
  radnoVrijeme?: string; // npr. "Pon-Pet 08:00 - 16:00"
  jeZadano: boolean;
  uredjaji: NaplatniUredjajConfig[];
}

/**
 * Zadani poslovni prostor za obrtnike s jednom lokacijom.
 */
export const ZADANI_POSLOVNI_PROSTOR: PoslovniProstorConfig = {
  oznaka: 'POSL1',
  naziv: 'Sjedište obrta (Glavni prostor)',
  adresa: 'Sjedište obrta',
  radnoVrijeme: 'Pon-Pet 08:00 - 16:00',
  jeZadano: true,
  uredjaji: [
    {
      oznaka: '1',
      naziv: 'Glavni naplatni uređaj',
      jeAktivan: true,
    },
  ],
};

/**
 * Formatira puni broj računa prema članku 9. Zakona o fiskalizaciji u prometu gotovinom.
 * Format: Broj/OznakaProstora/OznakaUređaja (npr. 1/POSL1/1 ili 24/TEREN/1)
 */
export function formatirajBrojDokumenta(
  redniBroj: number,
  prostorOznaka: string = 'POSL1',
  uredjajOznaka: string = '1'
): string {
  const cBroj = Math.max(1, Math.floor(redniBroj));
  const cProstor = (prostorOznaka || 'POSL1').trim().toUpperCase();
  const cUredjaj = (uredjajOznaka || '1').trim().toUpperCase();
  return `${cBroj}/${cProstor}/${cUredjaj}`;
}

/**
 * Parsira puni formatirani broj dokumenta (npr. "12/POSL1/1") na sastavne dijelove.
 */
export function parsirajBrojDokumenta(
  brojString: string
): { broj: number; prostorOznaka: string; uredjajOznaka: string } | null {
  if (!brojString || typeof brojString !== 'string') return null;
  const parts = brojString.trim().split('/');
  if (parts.length !== 3) return null;

  const p0 = parts[0];
  const p1 = parts[1];
  const p2 = parts[2];
  if (!p0 || !p1 || !p2) return null;

  const broj = parseInt(p0, 10);
  if (isNaN(broj) || broj <= 0) return null;

  const prostorOznaka = p1.trim().toUpperCase();
  const uredjajOznaka = p2.trim().toUpperCase();

  if (!prostorOznaka || !uredjajOznaka) return null;

  return {
    broj,
    prostorOznaka,
    uredjajOznaka,
  };
}

/**
 * Validiranje oznake poslovnog prostora prema specifikacijama Porezne uprave RH.
 * Oznaka mora imati između 1 i 20 alfanumeričkih znakova, bez razmaka.
 */
export function validirajOznakuProstora(oznaka: string): {
  valjano: boolean;
  poruka?: string;
} {
  if (!oznaka || typeof oznaka !== 'string') {
    return { valjano: false, poruka: 'Oznaka poslovnog prostora je obvezna.' };
  }
  const clean = oznaka.trim();
  if (clean.length < 1 || clean.length > 20) {
    return { valjano: false, poruka: 'Oznaka mora imati između 1 i 20 znakova.' };
  }
  const regex = /^[A-Z0-9_\-]+$/i;
  if (!regex.test(clean)) {
    return { valjano: false, poruka: 'Oznaka smije sadržavati samo slova, brojeve, crtice i podvlake.' };
  }
  return { valjano: true };
}

/**
 * Validiranje oznake naplatnog uređaja.
 * Oznaka mora biti numerička ili alfanumerička, obično 1-10 znakova.
 */
export function validirajOznakuUredjaja(oznaka: string): {
  valjano: boolean;
  poruka?: string;
} {
  if (!oznaka || typeof oznaka !== 'string') {
    return { valjano: false, poruka: 'Oznaka naplatnog uređaja je obvezna.' };
  }
  const clean = oznaka.trim();
  if (clean.length < 1 || clean.length > 10) {
    return { valjano: false, poruka: 'Oznaka uređaja mora imati između 1 i 10 znakova.' };
  }
  const regex = /^[A-Z0-9_\-]+$/i;
  if (!regex.test(clean)) {
    return { valjano: false, poruka: 'Oznaka uređaja smije sadržavati samo slova, brojeve, crtice i podvlake.' };
  }
  return { valjano: true };
}

/**
 * Generira jedinstveni ključ za sekvencijalni brojač računa.
 * Svaka kombinacija godine, poslovnog prostora i naplatnog uređaja ima neovisni numerički slijed.
 */
export function generirajKljuceveSekvence(
  godina: number,
  prostorOznaka: string = 'POSL1',
  uredjajOznaka: string = '1'
): string {
  const p = (prostorOznaka || 'POSL1').trim().toUpperCase();
  const u = (uredjajOznaka || '1').trim().toUpperCase();
  return `${godina}_${p}_${u}`;
}
