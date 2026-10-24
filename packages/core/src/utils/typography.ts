/**
 * Hrvatska Tipografija i Formatiranje
 * Pravila:
 * 1. Dijačkritici: Puna podrška za Č, Ć, Ž, Š, Đ, č, ć, ž, š, đ (bez zamjene u c, s, z, dj).
 * 2. Valutni format: Zarez (,) za decimale, točka (.) za tisućice, razmak i simbol € na kraju (npr. 1.250,50 €).
 * 3. Datumski format: DD.MM.YYYY. (s obaveznom završnom točkom prema hrvatskom pravopisu).
 * 4. Tipografski nedjeljivi razmaci (non-breaking space \u00A0):
 *    - Između broja i valute / mjerne jedinice (10\u00A0kom, 1.250,00\u00A0€).
 *    - Iza jednoslovnih veznika i prijedloga (u, i, o, s, k, a) radi sprječavanja "siročića" (orphans) na kraju retka.
 */

export interface TipografskaValidacijaRezultat {
  sadrziDijakritike: boolean;
  potencijalnoOsakaceniZnakovi: string[]; // npr. detektira upitnike '?' ili čudne zamjene
  jeValjanUtf8: boolean;
  upozorenja: string[];
}

/**
 * Validira tekst na prisutnost i očuvanost hrvatskih dijakritika
 */
export function validateHrvatskaTipografija(tekst: string): TipografskaValidacijaRezultat {
  const dijakriticiRegex = /[čćžšđČĆŽŠĐ]/;
  const sadrziDijakritike = dijakriticiRegex.test(tekst);

  // Provjera sumnjivih znakova koji nastaju kada generator ili font nema UTF-8 / Latin-2 podršku
  // npr. '?', '\uFFFD' (replacement character), 'Ã¨', 'Ã¦', 'È', itd.
  const osteceniZnakoviRegex = /[\uFFFD]|(\b[A-Za-z]+\?[A-Za-z]+\b)|(\u00C3[\u00A0-\u00BF])/g;
  const osteceniPronadjeni = tekst.match(osteceniZnakoviRegex) || [];

  const upozorenja: string[] = [];
  if (osteceniPronadjeni.length > 0) {
    upozorenja.push(`Detektirani su oštećeni znakovi nastali gubitkom kodne stranice: ${osteceniPronadjeni.join(', ')}`);
  }

  // Provjera "ošišane latinice" u službenim pravnim izrazima (npr. "racun" umjesto "račun")
  const osisaniPojmovi: Array<{ krivo: RegExp; tocno: string }> = [
    { krivo: /\bracun\b/i, tocno: 'račun' },
    { krivo: /\bposiljka\b/i, tocno: 'pošiljka' },
    { krivo: /\bplacanje\b/i, tocno: 'plaćanje' },
    { krivo: /\bdospijece\b/i, tocno: 'dospijeće' },
    { krivo: /\bklauzula\b/i, tocno: 'klauzula' },
    { krivo: /\bpausalni\b/i, tocno: 'paušalni' },
    { krivo: /\bjedinicna\b/i, tocno: 'jedinična' },
    { krivo: /\bkolicina\b/i, tocno: 'količina' },
  ];

  osisaniPojmovi.forEach(({ krivo, tocno }) => {
    if (krivo.test(tekst)) {
      upozorenja.push(`Prepoznata ošišana latinica: preporučuje se '${tocno}' umjesto '${tekst.match(krivo)?.[0]}'`);
    }
  });

  return {
    sadrziDijakritike,
    potencijalnoOsakaceniZnakovi: osteceniPronadjeni,
    jeValjanUtf8: osteceniPronadjeni.length === 0,
    upozorenja,
  };
}

/**
 * Formatira broj u službeni hrvatski valutni standard (npr. 1250.5 -> "1.250,50\u00A0€")
 * Koristi nedjeljivi razmak (\u00A0) prije simbola valute.
 */
export function formatHrvatskiIznos(iznosEur: number, includeSymbol = true): string {
  const fiksirano = iznosEur.toFixed(2);
  const [cijeliDio, decimalniDio] = fiksirano.split('.') as [string, string];

  // Dodavanje točke za tisućice
  const formatiranCijeli = cijeliDio.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const iznosTekst = `${formatiranCijeli},${decimalniDio}`;

  if (!includeSymbol) {
    return iznosTekst;
  }

  // Nedjeljivi razmak prije oznake €
  return `${iznosTekst}\u00A0€`;
}

/**
 * Formatira datum u službeni hrvatski standard s završnom točkom (DD.MM.YYYY.)
 */
export function formatHrvatskiDatum(datumStr: string | Date): string {
  if (datumStr instanceof Date) {
    const d = datumStr.getDate().toString().padStart(2, '0');
    const m = (datumStr.getMonth() + 1).toString().padStart(2, '0');
    const y = datumStr.getFullYear();
    return `${d}.${m}.${y}.`;
  }

  // Ako je YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(datumStr)) {
    const parts = datumStr.split('-');
    return `${parts[2]}.${parts[1]}.${parts[0]}.`;
  }

  // Ako već završava točkom i u DD.MM.YYYY formatu je
  if (/^\d{1,2}\.\d{1,2}\.\d{4}\.?$/.test(datumStr)) {
    return datumStr.endsWith('.') ? datumStr : `${datumStr}.`;
  }

  return datumStr;
}

/**
 * Primjenjuje hrvatska tipografska pravila prijeloma retka:
 * Zamjenjuje obične razmake iza jednoslovnih veznika i prijedloga (u, i, o, s, k, a)
 * s nedjeljivim razmakom (\u00A0), kako ne bi ostali na kraju retka.
 */
export function primijeniHrvatskiPrijelom(tekst: string): string {
  // Povezuje jednoslovne prijedloge i veznike s idućom riječi
  return tekst.replace(/\b([uUiIoOsSkKaA])\s+/g, '$1\u00A0');
}
