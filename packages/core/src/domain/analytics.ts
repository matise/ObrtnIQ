import type { NaplataPromet } from './types';
import type { UlazniTrosak, KategorijaTroska } from './troskovi';
import { KATEGORIJE_TROSKA_LABELS, PRAG_DUGOTRAJNE_IMOVINE_EUR } from './troskovi';
import type { MjesecniObracunDoprinosa, KvartalniPorezNalog } from './doprinosi';
import { round2 } from '../utils/calculator';

export interface TrosakKategorijaUdio {
  kategorija: KategorijaTroska;
  naziv: string;
  iznosEur: number;
  postotak: number;
}

export interface TopPartnerStatistika {
  partnerNaziv: string;
  ukupnoUplacenoEur: number;
  brojUplata: number;
  postotakUdjela: number;
}

export interface MjesecniTrendStatistika {
  mjesec: number;
  nazivMjeseca: string;
  primiciEur: number;
  izdaciEur: number;
  netoDobitEur: number;
}

export interface GodisnjaAnalitikaObrta {
  godina: number;
  ukupniPrimiciEur: number;
  ukupniOperativniTroskoviEur: number;
  ukupnoPlaceniDoprinosiEur: number;
  ukupnoPlaceniPorezEur: number;
  ukupniIzdaciEur: number;
  netoDobitEur: number;
  profitnaMarzaPostotak: number;
  troskoviPoKategorijama: TrosakKategorijaUdio[];
  topPartneri: TopPartnerStatistika[];
  mjesecniTrend: MjesecniTrendStatistika[];
  dugotrajnaImovinaPopis: Array<{
    id: string;
    dobavljacNaziv: string;
    opis: string;
    iznosEur: number;
    datumRacuna: string;
    serijskiBroj?: string;
  }>;
  dugotrajnaImovinaUkupnoEur: number;
  pragLimitPausalEur: number;
  postotakIskoristenostiPraga: number;
}

const MJESECI_NAZIVI = [
  'Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj',
  'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'
];

/**
 * Izračunava sveobuhvatnu godišnju analitiku poslovanja obrta.
 * Sintetizira KPR primitke, plaćene operativne troškove, uplaćene doprinose i poreze.
 */
export function izracunajGodisnjuAnalitiku(params: {
  godina: number;
  kprStavke: NaplataPromet[];
  troskovi: UlazniTrosak[];
  doprinosiUplate?: MjesecniObracunDoprinosa[];
  kvartalniPorezi?: KvartalniPorezNalog[];
}): GodisnjaAnalitikaObrta {
  const { godina, kprStavke, troskovi, doprinosiUplate = [], kvartalniPorezi = [] } = params;

  // 1. Filtriranje po odabranoj godini
  const kprGodina = kprStavke.filter(s => {
    const god = parseInt(s.datumNaplate.slice(0, 4), 10);
    return god === godina;
  });

  const troskoviGodina = troskovi.filter(t => {
    const god = parseInt(t.datumRacuna.slice(0, 4), 10);
    return god === godina;
  });

  // 2. KPR Primici
  const ukupniPrimiciEur = round2(
    kprGodina.reduce((sum, s) => sum + s.ukupnoNaplaceno, 0)
  );

  // 3. Operativni troškovi (plaćeni)
  const placeniTroskovi = troskoviGodina.filter(t => t.status === 'PLACENO');
  const ukupniOperativniTroskoviEur = round2(
    placeniTroskovi.reduce((sum, t) => sum + t.ukupnoEur, 0)
  );

  // 4. Doprinosi i porezi
  const ukupnoPlaceniDoprinosiEur = round2(
    doprinosiUplate
      .filter(d => d.status === 'UPLACENO')
      .reduce((sum, d) => sum + d.ukupnoDoprinosiEur, 0)
  );

  const ukupnoPlaceniPorezEur = round2(
    kvartalniPorezi
      .filter(p => p.status === 'UPLACENO')
      .reduce((sum, p) => sum + p.iznosPorezaEur, 0)
  );

  const ukupniIzdaciEur = round2(
    ukupniOperativniTroskoviEur + ukupnoPlaceniDoprinosiEur + ukupnoPlaceniPorezEur
  );

  const netoDobitEur = round2(ukupniPrimiciEur - ukupniIzdaciEur);
  const profitnaMarzaPostotak = ukupniPrimiciEur > 0
    ? round2((netoDobitEur / ukupniPrimiciEur) * 100)
    : 0;

  // 5. Struktura troškova po kategorijama
  const kategorijeMap = new Map<KategorijaTroska, number>();
  for (const t of troskoviGodina) {
    const current = kategorijeMap.get(t.kategorija) || 0;
    kategorijeMap.set(t.kategorija, current + t.ukupnoEur);
  }

  const ukupnoSviTroskoviZaDistribuciju = Array.from(kategorijeMap.values()).reduce((a, b) => a + b, 0);

  const troskoviPoKategorijama: TrosakKategorijaUdio[] = Array.from(kategorijeMap.entries())
    .map(([kategorija, iznos]) => {
      const iznosEur = round2(iznos);
      const postotak = ukupnoSviTroskoviZaDistribuciju > 0
        ? round2((iznosEur / ukupnoSviTroskoviZaDistribuciju) * 100)
        : 0;
      return {
        kategorija,
        naziv: KATEGORIJE_TROSKA_LABELS[kategorija] || kategorija,
        iznosEur,
        postotak,
      };
    })
    .sort((a, b) => b.iznosEur - a.iznosEur);

  // 6. Top partneri (prema KPR uplatama)
  const partneriMap = new Map<string, { ukupno: number; brojUplata: number }>();
  for (const s of kprGodina) {
    const naziv = (s.opisPlatitelja || 'Nepoznati uplatitelj').trim();
    const current = partneriMap.get(naziv) || { ukupno: 0, brojUplata: 0 };
    partneriMap.set(naziv, {
      ukupno: current.ukupno + s.ukupnoNaplaceno,
      brojUplata: current.brojUplata + 1,
    });
  }

  const topPartneri: TopPartnerStatistika[] = Array.from(partneriMap.entries())
    .map(([partnerNaziv, data]) => {
      const ukupnoUplacenoEur = round2(data.ukupno);
      const postotakUdjela = ukupniPrimiciEur > 0
        ? round2((ukupnoUplacenoEur / ukupniPrimiciEur) * 100)
        : 0;
      return {
        partnerNaziv,
        ukupnoUplacenoEur,
        brojUplata: data.brojUplata,
        postotakUdjela,
      };
    })
    .sort((a, b) => b.ukupnoUplacenoEur - a.ukupnoUplacenoEur)
    .slice(0, 5);

  // 7. Mjesečni trend (12 mjeseci)
  const mjesecniTrend: MjesecniTrendStatistika[] = [];
  for (let m = 1; m <= 12; m++) {
    const prefix = `${godina}-${m.toString().padStart(2, '0')}`;

    const primiciMjesec = kprGodina
      .filter(s => s.datumNaplate.startsWith(prefix))
      .reduce((sum, s) => sum + s.ukupnoNaplaceno, 0);

    const troskoviMjesec = placeniTroskovi
      .filter(t => t.datumRacuna.startsWith(prefix))
      .reduce((sum, t) => sum + t.ukupnoEur, 0);

    const doprinosMjesec = doprinosiUplate
      .find(d => d.mjesec === m && d.status === 'UPLACENO')?.ukupnoDoprinosiEur || 0;

    // Kvartalni porez uplaćen u zadnjem mjesecu kvartala (3, 6, 9, 12)
    let porezMjesec = 0;
    if (m === 3 || m === 6 || m === 9 || m === 12) {
      const kvartal = (m / 3) as 1 | 2 | 3 | 4;
      porezMjesec = kvartalniPorezi.find(p => p.kvartal === kvartal && p.status === 'UPLACENO')?.iznosPorezaEur || 0;
    }

    const izdaciMjesec = round2(troskoviMjesec + doprinosMjesec + porezMjesec);
    const primiciMjesecRound = round2(primiciMjesec);
    const netoMjesec = round2(primiciMjesecRound - izdaciMjesec);

    mjesecniTrend.push({
      mjesec: m,
      nazivMjeseca: MJESECI_NAZIVI[m - 1]!,
      primiciEur: primiciMjesecRound,
      izdaciEur: izdaciMjesec,
      netoDobitEur: netoMjesec,
    });
  }

  // 8. Popis dugotrajne imovine
  const dugotrajnaImovina = troskoviGodina.filter(
    t => t.jeDugotrajnaImovina || t.ukupnoEur >= PRAG_DUGOTRAJNE_IMOVINE_EUR
  );

  const dugotrajnaImovinaPopis = dugotrajnaImovina.map(t => ({
    id: t.id,
    dobavljacNaziv: t.dobavljacNaziv,
    opis: t.opis,
    iznosEur: t.ukupnoEur,
    datumRacuna: t.datumRacuna,
    serijskiBroj: t.serijskiBrojOpreme,
  }));

  const dugotrajnaImovinaUkupnoEur = round2(
    dugotrajnaImovina.reduce((sum, t) => sum + t.ukupnoEur, 0)
  );

  // 9. Prag paušala (40.000 €)
  const pragLimitPausalEur = 40000;
  const postotakIskoristenostiPraga = round2(
    Math.min(100, (ukupniPrimiciEur / pragLimitPausalEur) * 100)
  );

  return {
    godina,
    ukupniPrimiciEur,
    ukupniOperativniTroskoviEur,
    ukupnoPlaceniDoprinosiEur,
    ukupnoPlaceniPorezEur,
    ukupniIzdaciEur,
    netoDobitEur,
    profitnaMarzaPostotak,
    troskoviPoKategorijama,
    topPartneri,
    mjesecniTrend,
    dugotrajnaImovinaPopis,
    dugotrajnaImovinaUkupnoEur,
    pragLimitPausalEur,
    postotakIskoristenostiPraga,
  };
}
