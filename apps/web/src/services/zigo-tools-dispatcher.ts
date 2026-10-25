import { 
  validateOib, 
  validateIban, 
  generateKprCsv, 
  generatePosdXml, 
  izracunajKprSazetak,
  generirajGodisnjeDoprinose,
  generirajKvartalnePorezneNaloge,
  evidentirajNaplatu,
  izracunajCashFlow,
  formatHrvatskiIznos,
  formatHrvatskiDatum,
  PRAG_DUGOTRAJNE_IMOVINE_EUR,
  KATEGORIJE_TROSKA_LABELS,
  generirajPorezniKalendar,
  izracunajPreostaleDane,
  odrediStatusRoka,
  dohvatiSljedeciPorezniRok,
  jeDospjeloZaIzdavanje,
  izracunajUkupnoPretplate,
  type Artikl, 
  type PoreznaZona,
  type ZigoToolResult,
  type IObrtnIQStorage,
  type ZigoMemoryKategorija,
  type KategorijaTroska,
  type UlazniTrosak
} from '@obrtniq/core';
import { dexieStorage } from '../storage/dexie-db';
import { appLogger } from './logger';
import { tavilySearchService } from './tavily-search-service';
import { zigoMemoryService } from './zigo-memory-service';
import type { FormItem } from '../engine/types';

export interface ZigoToolsContext {
  form?: {
    partnerNaziv: string;
    setPartnerNaziv: (val: string) => void;
    oib: string;
    setOib: (val: string) => void;
    setIsOibValid: (val: boolean) => void;
    taxZone: PoreznaZona;
    setTaxZone: (val: PoreznaZona) => void;
    iban: string;
    setIban: (val: string) => void;
    setIsIbanValid: (val: boolean) => void;
  };
  items?: {
    items: FormItem[];
    setItems: React.Dispatch<React.SetStateAction<FormItem[]>> | ((items: FormItem[]) => void);
    addItem: () => void;
    resetItems: () => void;
    ukupniIznos: number;
  };
  workflow?: {
    docType: string;
    docStatus: string;
    isLocked: boolean;
    isFormSubmittable: boolean;
    handleIssueDocument: () => Promise<void>;
    handleStorno: () => Promise<void>;
    datumIzdavanja?: string;
    setDatumIzdavanja?: (val: string) => void;
    datumDospijeca?: string;
    setDatumDospijeca?: (val: string) => void;
    datumIsporuke?: string;
    setDatumIsporuke?: (val: string) => void;
  };
  drawers?: {
    setIsKprDrawerOpen?: (val: boolean) => void;
    setIsDocDrawerOpen?: (val: boolean) => void;
    setIsArticleDrawerOpen?: (val: boolean) => void;
  };
  storage?: IObrtnIQStorage;
  refreshStats?: () => Promise<void>;
}

/**
 * Pomoćna funkcija za sigurno preuzimanje datoteke u pregledniku
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * ZigoToolsDispatcher - Izvršitelj autonomnih funkcija nad stanjem aplikacije i bazom podataka
 */
export async function executeZigoTool(
  toolName: string,
  args: Record<string, any> = {},
  context: ZigoToolsContext
): Promise<ZigoToolResult> {
  const storage = context.storage || dexieStorage;
  const startTime = performance.now();
  const toolScope = `AGENT:TOOL:${toolName.toUpperCase()}`;
  const logger = appLogger.scope(toolScope);

  logger.info(`Započinjem izvršavanje alata [${toolName}]`, {
    argumenti: args,
    timestamp: new Date().toISOString(),
  });

  try {
    let result: ZigoToolResult;

    switch (toolName) {
      // 1. Postavljanje kupca na radnu plohu
      case 'postavi_kupca': {
        const { partnerNaziv, oib, iban, taxZone, adresa } = args;
        if (!partnerNaziv || typeof partnerNaziv !== 'string' || !partnerNaziv.trim()) {
          logger.warn('Neuspjelo postavljanje kupca: naziv nije zadan.');
          return { uspjeh: false, poruka: 'Naziv kupca je obvezan parametar.' };
        }

        const isOibVal = oib ? validateOib(oib.trim()) : false;
        const isIbanVal = iban ? validateIban(iban.trim()) : false;

        logger.debug('Validacija podataka partnera', {
          partnerNaziv: partnerNaziv.trim(),
          oib: oib?.trim(),
          isOibValid: isOibVal,
          iban: iban?.trim(),
          isIbanValid: isIbanVal,
          taxZone: taxZone || 'DOMACI_B2B',
        });

        if (context.form) {
          context.form.setPartnerNaziv(partnerNaziv.trim());
          if (oib) {
            context.form.setOib(oib.trim());
            context.form.setIsOibValid(isOibVal);
          }
          if (iban) {
            context.form.setIban(iban.trim());
            context.form.setIsIbanValid(isIbanVal);
          }
          if (taxZone) {
            context.form.setTaxZone(taxZone as PoreznaZona);
          }
        }

        result = {
          uspjeh: true,
          podaci: {
            partnerNaziv: partnerNaziv.trim(),
            oib: oib?.trim(),
            iban: iban?.trim(),
            taxZone: taxZone || 'DOMACI_B2B',
            adresa: adresa?.trim(),
          },
          poruka: `Kupac "${partnerNaziv.trim()}" postavljen je na radnu plohu.`,
        };
        break;
      }

      // 2. Dodavanje stavke na radnu plohu
      case 'dodaj_stavku_racuna': {
        const { naziv, kpdSifra, kolicina, cijena, jedinicaMjere } = args;
        if (!naziv || !kpdSifra) {
          logger.warn('Neuspjelo dodavanje stavke: nedostaje naziv ili KPD šifra.');
          return { uspjeh: false, poruka: 'Naziv i KPD 2025 šifra stavke su obvezni.' };
        }

        const parsedKolicina = Number(kolicina) > 0 ? Number(kolicina) : 1;
        const parsedCijena = Number(cijena) >= 0 ? Number(cijena) : 0;
        const jm = jedinicaMjere || 'sat';
        const redakUkupno = parsedKolicina * parsedCijena;

        const novaStavka: FormItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          kpdSifra: kpdSifra.trim(),
          kpdNaziv: naziv.trim(),
          kolicina: parsedKolicina,
          cijena: parsedCijena,
          jedinicaMjere: jm,
        };

        logger.debug('Izračunata nova stavka računa', {
          kpdSifra: novaStavka.kpdSifra,
          naziv: novaStavka.kpdNaziv,
          iznos: redakUkupno,
        });

        if (context.items) {
          const currentItems = context.items.items || [];
          context.items.setItems([...currentItems, novaStavka]);
        }

        result = {
          uspjeh: true,
          podaci: {
            stavka: novaStavka,
            ukupno: redakUkupno,
          },
          poruka: `Dodana stavka "${naziv.trim()}" (${parsedKolicina} ${jm} x ${parsedCijena.toFixed(2)} €).`,
        };
        break;
      }

      // 3. Čišćenje stavki s radne plohe
      case 'ocisti_stavke_racuna': {
        if (context.items) {
          context.items.resetItems();
        }
        logger.info('Radna ploha očišćena od stavki (reset).');
        result = {
          uspjeh: true,
          poruka: 'Radna ploha je očišćena. Sve prethodne stavke su uklonjene.',
        };
        break;
      }

      // 4. Priprema i izdavanje aktivnog računa
      case 'izdaj_aktivni_racun': {
        const ukupno = context.items?.ukupniIznos || 0;
        const isSubmittable = context.workflow?.isFormSubmittable ?? false;

        logger.info('Pripremljeno izdavanje aktivnog računa', {
          ukupnoIznos: ukupno,
          isSubmittable,
        });

        result = {
          uspjeh: true,
          podaci: {
            akcija: 'POTVRDA_IZDAVANJA',
            ukupno,
            isSubmittable,
          },
          poruka: `Račun u ukupnom iznosu od ${ukupno.toFixed(2)} € je pripremljen za izdavanje. Pritisnite F2 ili potvrdite karticu za konačno fiskalno pečaćenje.`,
        };
        break;
      }

      // 5. Storniranje računa
      case 'storniraj_racun': {
        const { brojDokumenta, razlog } = args;
        if (!brojDokumenta) {
          logger.warn('Storniranje odbijeno: brojDokumenta nije naveden.');
          return { uspjeh: false, poruka: 'Broj dokumenta za storniranje je obvezan.' };
        }

        logger.debug('Pretražujem bazu za storno dokumenta:', { brojDokumenta });
        const sviDokumenti = await storage.dokumenti.getAll();
        const ciljaniDoc = sviDokumenti.find((d) => d.brojDokumenta === brojDokumenta.trim());

        if (!ciljaniDoc) {
          logger.warn('Dokument za storno nije pronađen u bazi', { brojDokumenta });
          return {
            uspjeh: false,
            poruka: `Dokument s brojem "${brojDokumenta}" nije pronađen u bazi.`,
          };
        }

        logger.info('Pronađen dokument za storniranje', {
          id: ciljaniDoc.id,
          broj: ciljaniDoc.brojDokumenta,
          iznos: ciljaniDoc.ukupnoIznos,
        });

        result = {
          uspjeh: true,
          podaci: {
            dokumentId: ciljaniDoc.id,
            brojDokumenta: ciljaniDoc.brojDokumenta,
            razlog: razlog || 'Stornirano na zahtjev korisnika.',
          },
          poruka: `Pripremljen storno za dokument ${ciljaniDoc.brojDokumenta}. Potvrdite radnju za generiranje storno računa.`,
        };
        break;
      }

      // 6. Pretraga cjenika
      case 'pretrazi_cjenik': {
        const pojam = (args.pojam || '').toLowerCase().trim();
        logger.debug('Pretražujem katalog artikala', { pojam });
        const artikli = await storage.artikli.getAll(true);
        const rezultati = pojam
          ? artikli.filter(
              (a) =>
                a.naziv.toLowerCase().includes(pojam) ||
                a.kpdSifra.includes(pojam) ||
                (a.opis && a.opis.toLowerCase().includes(pojam))
            )
          : artikli;

        logger.info(`Pronađeno ${rezultati.length} artikala u cjeniku za pojam "${pojam}".`);
        result = {
          uspjeh: true,
          podaci: rezultati,
          poruka: `Pronađeno ${rezultati.length} stavki u cjeniku.`,
        };
        break;
      }

      // 7. Spremanje u cjenik
      case 'dodaj_u_cjenik': {
        const { naziv, kpdSifra, cijena, jedinicaMjere, opis } = args;
        if (!naziv || !kpdSifra) {
          logger.warn('Neuspjelo spremanje u cjenik: nedostaje naziv ili KPD šifra.');
          return { uspjeh: false, poruka: 'Naziv i KPD šifra su obvezni za cjenik.' };
        }

        const newArtikl: Artikl = {
          id: `art-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          naziv: naziv.trim(),
          kpdSifra: kpdSifra.trim(),
          cijenaOsnovica: Number(cijena) || 0,
          jedinicaMjere: jedinicaMjere || 'sat',
          opis: opis?.trim(),
          stopaPdv: 0,
          pdvKategorijaPoreza: 'E',
          jeUsluga: true,
          aktivan: true,
        };

        await storage.artikli.save(newArtikl);
        logger.info('Novi artikl uspješno spremljen u cjenik', {
          id: newArtikl.id,
          naziv: newArtikl.naziv,
          kpdSifra: newArtikl.kpdSifra,
          cijena: newArtikl.cijenaOsnovica,
        });

        result = {
          uspjeh: true,
          podaci: newArtikl,
          poruka: `Usluga "${newArtikl.naziv}" (KPD: ${newArtikl.kpdSifra}, ${newArtikl.cijenaOsnovica.toFixed(2)} €) spremljena je u cjenik.`,
        };
        break;
      }

      // 8. Pretraga partnera
      case 'pretrazi_partnere': {
        const pojam = (args.pojam || '').toLowerCase().trim();
        logger.debug('Pretražujem adresar partnera', { pojam });
        const partneri = await storage.partneri.getAll(true);
        const rezultati = pojam
          ? partneri.filter(
              (p) =>
                p.naziv.toLowerCase().includes(pojam) ||
                (p.oib && p.oib.includes(pojam)) ||
                (p.adresa && p.adresa.toLowerCase().includes(pojam))
            )
          : partneri;

        logger.info(`Pronađeno ${rezultati.length} partnera u adresaru za pojam "${pojam}".`);
        result = {
          uspjeh: true,
          podaci: rezultati,
          poruka: `Pronađeno ${rezultati.length} partnera u adresaru.`,
        };
        break;
      }

      // 9. Financijski status i paušalni prag od 40.000 €
      case 'dohvati_financijski_status': {
        const tekuciDatum = new Date();
        const godina = tekuciDatum.getFullYear();
        logger.debug('Dohvaćam financijsko stanje za godinu:', { godina });
        const sveNaplate = await storage.kpr.getAll(godina);
        const sviDokumenti = await storage.dokumenti.getAll(godina);

        const ukupnoNaplaceno = sveNaplate.reduce((sum, n) => sum + (n.ukupnoNaplaceno || 0), 0);
        const zakonskiPrag = 40000.0;
        const ostaloDoPraga = Math.max(0, zakonskiPrag - ukupnoNaplaceno);
        const prekoracenPrag = ukupnoNaplaceno > zakonskiPrag;

        const izdaniRacuni = sviDokumenti.filter(
          (d) => d.vrstaDokumenta === 'RACUN' && d.status !== 'STORNIRANO'
        );

        logger.info('Izračunat financijski status KPR-a', {
          godina,
          ukupnoNaplaceno,
          ostaloDoPraga,
          prekoracenPrag,
          brojIzdatihRacuna: izdaniRacuni.length,
        });

        result = {
          uspjeh: true,
          podaci: {
            godina,
            ukupnoNaplaceno,
            zakonskiPrag,
            ostaloDoPraga,
            prekoracenPrag,
            brojIzdatihRacuna: izdaniRacuni.length,
          },
          poruka: `U ${godina}. godini naplaćeno je ukupno ${ukupnoNaplaceno.toFixed(2)} €. Do poreznog praga od 40.000,00 € preostalo je ${ostaloDoPraga.toFixed(2)} €.`,
        };
        break;
      }

      // 10. Izvoz KPR u CSV format (s Excel BOM)
      case 'izvezi_kpr_csv': {
        const godina = new Date().getFullYear();
        logger.info('Započinjem izvoz Knjige prometa (KPR) u CSV za godinu:', { godina });
        const naplate = await storage.kpr.getAll(godina);
        const profil = await storage.obrt.getProfil();

        const csvContent = generateKprCsv(naplate, godina, {
          obrtNaziv: profil?.naziv,
          obrtOib: profil?.oib,
        });

        const filename = `KPR_${godina}_${profil?.oib || 'obrt'}.csv`;
        downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
        logger.info(`KPR CSV uspješno generiran i poslan na preuzimanje (${filename})`, {
          brojStavaka: naplate.length,
        });

        result = {
          uspjeh: true,
          poruka: `Knjiga prometa (KPR) za ${godina}. godinu uspješno je preuzeta kao CSV datoteka prilagođena za Excel.`,
        };
        break;
      }

      // 11. Izvoz PO-SD XML obrasca za ePoreznu
      case 'izvezi_posd_xml': {
        const godina = new Date().getFullYear();
        logger.info('Započinjem generiranje službenog PO-SD XML obrasca za godinu:', { godina });
        const naplate = await storage.kpr.getAll(godina);
        const profil = await storage.obrt.getProfil();

        if (!profil || !profil.oib) {
          logger.warn('Generiranje PO-SD XML-a odbijeno: profil obrta ili OIB nije popunjen.');
          return { uspjeh: false, poruka: 'Profil obrta s valjanim OIB-om mora biti popunjen za generiranje PO-SD obrasca.' };
        }

        const izvjestaj = izracunajKprSazetak(naplate, godina, {
          oib: profil.oib,
          naziv: profil.naziv,
        });

        const xmlContent = generatePosdXml({
          izvjestaj,
          vlasnikImePrezime: profil.vlasnikImePrezime,
          adresa: `${profil.ulicaIBroj}, ${profil.mjesto}`,
          djelatnostNkd: profil.nkdSifra,
        });

        const filename = `PO-SD_${godina}_${profil.oib}.xml`;
        downloadFile(xmlContent, filename, 'application/xml;charset=utf-8;');
        logger.info(`PO-SD XML obrazac uspješno generiran (${filename})`, {
          ukupnoGodina: izvjestaj.ukupnoGodina,
        });

        result = {
          uspjeh: true,
          poruka: `Službeni PO-SD XML obrazac za ${godina}. godinu uspješno je pripremljen i preuzet za predaju na ePoreznu.`,
        };
        break;
      }

      // 12. Specijalna mehanika: Žigin Rez (Instant trijaža stanja u 3 točke)
      case 'aktiviraj_zigin_rez': {
        logger.info('Aktivirana instant trijaža stanja (Žigin Rez)');
        const godina = new Date().getFullYear();
        const naplate = await storage.kpr.getAll(godina);
        const ukupnoNaplaceno = naplate.reduce((sum, n) => sum + (n.ukupnoNaplaceno || 0), 0);
        const ostaloDoPraga = Math.max(0, 40000.0 - ukupnoNaplaceno);

        const sviDokumenti = await storage.dokumenti.getAll(godina);
        const neplaceni = sviDokumenti.filter(
          (d) => d.status === 'IZDANO' || d.status === 'DJELOMICNO_PLACENO'
        );

        // 1. Što gori (< 24h, porezni prag ili neplaćeni s istekom roka)
        let stoGori = 'Nema hitnih poreznih požara. Sve obveze i računi su pod kontrolom.';
        if (ostaloDoPraga < 1000) {
          stoGori = `POZOR: Fali ti samo ${ostaloDoPraga.toFixed(2)} € do praga od 40.000 €! Svaki novi izdani račun gura te u sustav PDV-a.`;
        } else if (neplaceni.length > 0) {
          stoGori = `Imaš ${neplaceni.length} neplaćenih izdanih računa. Ukupno čekaš ${neplaceni
            .reduce((s, d) => s + d.ukupnoIznos, 0)
            .toFixed(2)} €.`;
        }

        // 2. Što čeka ("Neka kisne do ponedjeljka")
        const nacrti = sviDokumenti.filter((d) => d.status === 'NACRT');
        const stoCeka =
          nacrti.length > 0
            ? `${nacrti.length} nacrta na čekanju. Neka kisne do ponedjeljka, sad nije preša.`
            : 'Nema zaostalih nacrta. Pusti administraciju neka miruje.';

        // 3. Akcija sad (Jedno veliko rješenje)
        let akcijaSad = 'Zatvori laptop, prošetaj uz more i spusti puls na 60. Sve je sterilno čisto.';
        if (ostaloDoPraga < 1000) {
          akcijaSad = 'Odgodi fakturiranje novih poslova na 1. siječnja i sačuvaj paušalni status.';
        } else if (neplaceni.length > 0) {
          akcijaSad = `Pošalji uglađeni dubrovački podsjetnik kupcu za račun br. ${neplaceni[0]?.brojDokumenta}.`;
        } else if (context.items && context.items.items.length > 0) {
          akcijaSad = 'Izdaj račun koji je trenutno otvoren na radnoj plohi (F2).';
        }

        logger.info('Žigin Rez trijaža uspješno formirana', {
          ostaloDoPraga,
          neplaceniCount: neplaceni.length,
          nacrtiCount: nacrti.length,
        });

        result = {
          uspjeh: true,
          podaci: {
            stoGori,
            stoCeka,
            akcijaSad,
          },
          poruka: `Žigin Rez aktiviran:\n1. ŠTO GORI: ${stoGori}\n2. ŠTO ČEKA: ${stoCeka}\n3. AKCIJA SAD: ${akcijaSad}`,
        };
        break;
      }

      // 13. Automatsko dodjeljivanje KPD 2025 šifri stavkama računa
      case 'auto_ispuni_kpd_sifre': {
        logger.info('Pokrećem automatsko dodjeljivanje KPD 2025 šifri stavkama');
        if (!context.items || !context.items.items || context.items.items.length === 0) {
          return { uspjeh: false, poruka: 'Nema stavki na radnoj plohi za dodjelu KPD šifri.' };
        }

        let azuriranoBroj = 0;
        const azuriraneStavke = context.items.items.map((it) => {
          if (it.kpdSifra && it.kpdSifra.trim()) {
            return it;
          }
          azuriranoBroj++;
          const text = (it.kpdNaziv || '').toLowerCase();
          let novaSifra = '62.02.20';
          let novNaziv = it.kpdNaziv || 'Usluga';

          if (text.includes('programir') || text.includes('softver') || text.includes('kod') || text.includes('web') || text.includes('aplikacij') || text.includes('razvoj')) {
            novaSifra = '62.01.11';
            novNaziv = it.kpdNaziv || 'Usluge računalnog programiranja';
          } else if (text.includes('dizajn') || text.includes('logo') || text.includes('grafik') || text.includes('ui') || text.includes('ux')) {
            novaSifra = '74.10.11';
            novNaziv = it.kpdNaziv || 'Usluge grafičkog oblikovanja';
          } else if (text.includes('savjet') || text.includes('konzult') || text.includes('mentor')) {
            novaSifra = '70.22.11';
            novNaziv = it.kpdNaziv || 'Usluge poslovnog savjetovanja';
          } else if (text.includes('prijevod') || text.includes('tumač')) {
            novaSifra = '74.30.11';
            novNaziv = it.kpdNaziv || 'Prevoditeljske usluge';
          } else if (text.includes('edukacij') || text.includes('tečaj') || text.includes('radionic') || text.includes('predavanj')) {
            novaSifra = '85.59.19';
            novNaziv = it.kpdNaziv || 'Ostalo obrazovanje i poučavanje';
          } else if (text.includes('foto') || text.includes('snimanj') || text.includes('video')) {
            novaSifra = '74.20.21';
            novNaziv = it.kpdNaziv || 'Fotografske usluge';
          } else if (text.includes('održavanj') || text.includes('podršk') || text.includes('server')) {
            novaSifra = '62.02.30';
            novNaziv = it.kpdNaziv || 'Usluge tehničke podrške za informacijsku tehnologiju';
          }

          return {
            ...it,
            kpdSifra: novaSifra,
            kpdNaziv: novNaziv,
          };
        });

        logger.verbose('Ažurirane stavke s novim KPD 2025 šiframa', { azuriranoBroj });
        context.items.setItems(azuriraneStavke);
        result = {
          uspjeh: true,
          podaci: { azuriranoStavki: azuriranoBroj },
          poruka: `Dodijeljene su KPD 2025 šifre za ${azuriranoBroj} stavki. Papiri su sad šesni i spremni za e-Račun.`,
        };
        break;
      }

      // 14. Provjera i ispravak OIB-a partnera (MOD 11)
      case 'provjeri_i_ispravi_oib': {
        const oibParam = args.oib || context.form?.oib;
        if (!oibParam || typeof oibParam !== 'string') {
          return { uspjeh: false, poruka: 'OIB nije zadan za provjeru.' };
        }
        const cleanOib = oibParam.trim();
        const isValid = validateOib(cleanOib);
        logger.verbose('MOD 11 provjera kontrolne znamenke OIB-a', { oib: cleanOib, isValid });

        if (isValid) {
          if (context.form) {
            context.form.setOib(cleanOib);
            context.form.setIsOibValid(true);
          }
          result = {
            uspjeh: true,
            podaci: { oib: cleanOib, isOibValid: true },
            poruka: `OIB ${cleanOib} je valjan prema ISO 7064 MOD 11,10 kontroli.`,
          };
        } else {
          // Pokušaj pronaći partnera u adresaru po sličnosti ako postoji
          const sviPartneri = await storage.partneri.getAll();
          const partnerQuery = (context.form?.partnerNaziv || '').trim().toLowerCase();
          const pronadjeni = partnerQuery
            ? sviPartneri.find((p) => p.oib && validateOib(p.oib) && p.naziv.toLowerCase().includes(partnerQuery))
            : undefined;

          if (pronadjeni && pronadjeni.oib && context.form) {
            context.form.setOib(pronadjeni.oib);
            context.form.setIsOibValid(true);
            logger.verbose('Pronađen zamjenski OIB partnera u adresaru', { partner: pronadjeni.naziv, oib: pronadjeni.oib });
            result = {
              uspjeh: true,
              podaci: { oib: pronadjeni.oib, isOibValid: true, partnerNaziv: pronadjeni.naziv },
              poruka: `Pronađen je točan OIB partnera iz adresara: ${pronadjeni.oib} (${pronadjeni.naziv}). Ažurirano na radnoj plohi.`,
            };
          } else {
            result = {
              uspjeh: false,
              podaci: { oib: cleanOib, isOibValid: false },
              poruka: `OIB '${cleanOib}' je nevaljan prema MOD 11 kontrolnoj znamenki. Provjeri cifre u sudskom registru.`,
            };
          }
        }
        break;
      }

      // 15. Simulacija utjecaja na paušalni prag od 40.000 €
      case 'simuliraj_utjecaj_na_prag': {
        const godina = new Date().getFullYear();
        const naplate = await storage.kpr.getAll(godina);
        const kprPromet = naplate.reduce((sum, n) => sum + (n.ukupnoNaplaceno || 0), 0);
        const iznosEur = args.iznosEur !== undefined ? Number(args.iznosEur) : (context.items?.ukupniIznos || 0);
        const noviUkupno = kprPromet + iznosEur;
        const prekoracenje = noviUkupno > 40000;
        const preostalo = Math.max(0, 40000 - noviUkupno);

        logger.verbose('Izračun simulacije utjecaja na paušalni prag', {
          godina,
          kprPrometYtd: kprPromet,
          iznosEur,
          noviUkupno,
          prekoracenje,
          preostalo,
        });

        result = {
          uspjeh: true,
          podaci: {
            kprPrometYtd: kprPromet,
            dodatniIznosEur: iznosEur,
            noviUkupno,
            prekoracenje,
            preostaloDoPraga: preostalo,
          },
          poruka: prekoracenje
            ? `POZOR: S ovim računom od ${iznosEur.toFixed(2)} € ukupni promet iznosit će ${noviUkupno.toFixed(2)} €, čime probijaš limit od 40.000 € za ${(noviUkupno - 40000).toFixed(2)} €!`
            : `Unutar praga si. Nakon ovog računa od ${iznosEur.toFixed(2)} €, do limita od 40.000 € preostaje ti još ${preostalo.toFixed(2)} €.`,
        };
        break;
      }

      // 16. Prebacivanje datuma u iduću kalendarsku godinu radi zaštite praga
      case 'prebaci_datum_u_iducu_godinu': {
        const nextYear = new Date().getFullYear() + 1;
        const datumIzd = `${nextYear}-01-02`;
        const datumDosp = `${nextYear}-01-17`;

        logger.verbose('Postavljanje datuma u iduću godinu', { datumIzd, datumDosp, nextYear });

        if (context.workflow?.setDatumIzdavanja) {
          context.workflow.setDatumIzdavanja(datumIzd);
        }
        if (context.workflow?.setDatumDospijeca) {
          context.workflow.setDatumDospijeca(datumDosp);
        }
        if (context.workflow?.setDatumIsporuke) {
          context.workflow.setDatumIsporuke(datumIzd);
        }

        result = {
          uspjeh: true,
          podaci: { datumIzdavanja: datumIzd, datumDospijeca: datumDosp },
          poruka: `Datum izdavanja i isporuke postavljen je na 02.01.${nextYear}. Sačuvan je paušalni status i mirna glava.`,
        };
        break;
      }

      // 17. Stoički Fjaka Mode (Anti-Burnout)
      case 'aktiviraj_fjaku': {
        logger.verbose('Aktivacija Fjaka načina rada (Anti-Burnout)', { sat: new Date().getHours() });
        result = {
          uspjeh: true,
          podaci: { fjakaAktivna: true },
          poruka: `Fjaka je aktivirana. Novci poslani u ponoć ne putuju brže. Zidovi Grada stoje stoljećima – pođi leć, Republika treba odmorne ljude.`,
        };
        break;
      }

      // 18. Web istraživanje propisa (Tavily AI Search)
      case 'istrazi_propise_web': {
        const { upit, ciljanaDomena } = args;
        if (!upit || typeof upit !== 'string' || !upit.trim()) {
          return { uspjeh: false, poruka: 'Upit za pretragu propisa je obvezan.' };
        }
        logger.info(`Pokrećem web istraživanje propisa: "${upit.trim()}"`, { ciljanaDomena });
        const searchRes = await tavilySearchService.searchRegulations(upit.trim(), undefined, ciljanaDomena);
        result = {
          uspjeh: searchRes.uspjeh,
          podaci: {
            query: searchRes.query,
            odgovorSazetak: searchRes.odgovorSazetak,
            izvor: searchRes.izvor,
            results: searchRes.results,
          },
          poruka: searchRes.odgovorSazetak
            ? `Istraživanje dovršeno (${searchRes.izvor}): ${searchRes.odgovorSazetak}`
            : `Pretraženi službeni propisi za: "${upit.trim()}".`,
        };
        break;
      }

      // 19. Pamćenje činjenice u Žigin tefter
      case 'zapamti_cinjenicu': {
        const { kategorija, kljuc, vrijednost } = args;
        if (!vrijednost || typeof vrijednost !== 'string' || !vrijednost.trim()) {
          return { uspjeh: false, poruka: 'Vrijednost za pamćenje je obvezna.' };
        }
        const cleanKljuc = (kljuc && typeof kljuc === 'string' && kljuc.trim()) 
          ? kljuc.trim() 
          : vrijednost.trim().slice(0, 24);
        const memKat = (kategorija as ZigoMemoryKategorija) || 'posao';
        const saved = await zigoMemoryService.saveMemory(memKat, cleanKljuc, vrijednost.trim(), 'izricito_korisnik');
        result = {
          uspjeh: true,
          podaci: { memorija: saved },
          poruka: `Zapisano u tefter: "${saved.vrijednost}" pod ključem [${saved.kljuc}].`,
        };
        break;
      }

      // 20. Provjera obveznih doprinosa i poreza (Faza 18)
      case 'provjeri_obvezne_doprinose_i_porez': {
        const godina = typeof args.godina === 'number' ? args.godina : new Date().getFullYear();
        const profil = await storage.obrt.getProfil();
        const oib = profil?.oib || '00000000000';

        const kprStavke = await storage.kpr.getAll(godina);
        const kprSazetak = izracunajKprSazetak(kprStavke, godina, { oib, naziv: profil?.naziv || 'Obrt' });

        const spremljeneUplate = storage.doprinosi ? await storage.doprinosi.getAllUplate(godina) : [];
        const uplaceniMjeseci = new Map<number, string>();
        for (const u of spremljeneUplate) {
          if (u.status === 'UPLACENO') {
            uplaceniMjeseci.set(u.mjesec, u.datumUplate || '');
          }
        }

        const mjesecniDoprinosi = generirajGodisnjeDoprinose(oib, godina, uplaceniMjeseci);
        const kvartalniPorezi = generirajKvartalnePorezneNaloge(oib, godina, kprSazetak.ukupnoGodina, new Map());

        const danas = new Date();
        const tekuciMjesec = danas.getMonth() + 1;
        const provjeraMjesec = typeof args.mjesec === 'number' ? args.mjesec : Math.max(1, tekuciMjesec - 1);

        const obracunZaMjesec = mjesecniDoprinosi.find(m => m.mjesec === provjeraMjesec);
        const neplaceniDospjeli = mjesecniDoprinosi.filter(m => m.status !== 'UPLACENO' && new Date(m.rokPlacanja) < danas);
        const ukupnoNeplacenoDospjeloEur = neplaceniDospjeli.reduce((sum, m) => sum + m.ukupnoDoprinosiEur, 0);

        result = {
          uspjeh: true,
          podaci: {
            godina,
            provjeraMjesec,
            obracunZaMjesec,
            ukupnoNeplacenoDospjeloEur,
            brojNeplacenihDospjelih: neplaceniDospjeli.length,
            doprinosi: mjesecniDoprinosi,
            mjesecniDoprinosi,
            kvartalniPorezi,
          },
          poruka: obracunZaMjesec?.status === 'UPLACENO'
            ? `Doprinosi za ${provjeraMjesec}. mjesec (${godina}.) su uplaćeni (${formatHrvatskiIznos(obracunZaMjesec.ukupnoDoprinosiEur)}).`
            : `Doprinosi za ${provjeraMjesec}. mjesec (${godina}.) čekaju uplatu (${formatHrvatskiIznos(obracunZaMjesec?.ukupnoDoprinosiEur || 262.51)}). Rok dospijeća je ${formatHrvatskiDatum(obracunZaMjesec?.rokPlacanja || '')}.`,
        };
        break;
      }

      // 21. Evidentiranje ulaznog troška (Faza 18)
      case 'evidentiraj_ulazni_trosak': {
        const {
          dobavljacNaziv,
          ukupnoEur,
          kategorija = 'OSTALO_POSLOVNO',
          opis,
          brojRacuna,
          datumRacuna,
          nacinPlacanja = 'TRANSAKCIJSKI_RACUN',
          jePlaceno = true,
          serijskiBrojOpreme,
        } = args;

        if (!dobavljacNaziv || typeof dobavljacNaziv !== 'string' || !dobavljacNaziv.trim()) {
          return { uspjeh: false, poruka: 'Naziv dobavljača je obvezan.' };
        }
        const iznos = typeof ukupnoEur === 'number' ? ukupnoEur : parseFloat(ukupnoEur);
        if (isNaN(iznos) || iznos <= 0) {
          return { uspjeh: false, poruka: 'Iznos troška mora biti veći od 0 EUR.' };
        }

        const danas = new Date().toISOString().slice(0, 10);
        const datum = datumRacuna && typeof datumRacuna === 'string' ? datumRacuna : danas;
        const jeDugotrajna = iznos >= PRAG_DUGOTRAJNE_IMOVINE_EUR;

        // Normalizacija kategorije u valjanu KategorijaTroska
        const rawKat = String(kategorija || '').toUpperCase().trim();
        let kat: KategorijaTroska = 'OSTALO_POSLOVNO';
        if (rawKat === 'GORIVO' || rawKat.includes('GORIVO') || rawKat.includes('PUTOVANJ')) {
          kat = 'GORIVO_I_PUTOVANJA';
        } else if (rawKat === 'ALAT_I_OPREMA' || rawKat.includes('OPREM') || rawKat.includes('HARDVER') || rawKat.includes('ALAT')) {
          kat = 'OPREMA_I_HARDVER';
        } else if (rawKat === 'URED_I_POTROSNI' || rawKat.includes('UREDSK') || rawKat.includes('PAPIR') || rawKat.includes('TONER')) {
          kat = 'UREDSKI_MATERIJAL';
        } else if (rawKat === 'TELEKOMUNIKACIJE' || rawKat.includes('TELEKOM') || rawKat.includes('INTERNET')) {
          kat = 'TELEKOMUNIKACIJE_NET';
        } else if (rawKat.includes('SOFTVER') || rawKat.includes('CLOUD') || rawKat.includes('LICENC')) {
          kat = 'SOFTVERSKE_PRETPLATE';
        } else if (rawKat.includes('BANK') || rawKat.includes('NAKNAD')) {
          kat = 'BANKOVNE_NAKNADE';
        } else if (rawKat.includes('KNJIGOVOD') || rawKat.includes('PRAVN')) {
          kat = 'KNJIGOVODSTVO_PRAVNO';
        } else if (rawKat.includes('REZ') || rawKat.includes('KOMUNAL') || rawKat.includes('ZAKUP')) {
          kat = 'KOMUNALIJE_REZANJE';
        } else if (rawKat.includes('EDUKACI') || rawKat.includes('LITERATUR')) {
          kat = 'EDUKACIJA_I_LITERATURA';
        } else if ((KATEGORIJE_TROSKA_LABELS as Record<string, string>)[rawKat]) {
          kat = rawKat as KategorijaTroska;
        }

        const noviTrosak: UlazniTrosak = {
          id: `trosak-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          brojUlaznogDokumenta: brojRacuna ? String(brojRacuna).trim() : `UL-${Date.now().toString().slice(-6)}`,
          dobavljacNaziv: dobavljacNaziv.trim(),
          datumRacuna: datum,
          datumDospijeca: datum,
          datumPlacanja: jePlaceno ? datum : undefined,
          kategorija: kat,
          opis: opis ? String(opis).trim() : (KATEGORIJE_TROSKA_LABELS[kat] || kat),
          iznosBezPdvEur: Math.round((iznos / 1.25) * 100) / 100,
          iznosPdvEur: Math.round((iznos - (iznos / 1.25)) * 100) / 100,
          ukupnoEur: iznos,
          nacinPlacanja: nacinPlacanja || 'TRANSAKCIJSKI_RACUN',
          status: jePlaceno ? 'PLACENO' : 'NEPLACENO',
          jeDugotrajnaImovina: jeDugotrajna,
          serijskiBrojOpreme: serijskiBrojOpreme ? String(serijskiBrojOpreme).trim() : undefined,
          kreirano: new Date().toISOString(),
        };

        if (storage.troskovi) {
          await storage.troskovi.save(noviTrosak);
        }

        if (context.refreshStats) {
          await context.refreshStats();
        }

        result = {
          uspjeh: true,
          podaci: {
            trosak: noviTrosak,
            jeDugotrajnaImovina: jeDugotrajna,
          },
          poruka: jeDugotrajna
            ? `Evidentiran trošak: ${noviTrosak.dobavljacNaziv} (${formatHrvatskiIznos(iznos)}). Prekoračen prag dugotrajne imovine (663,61 €), označeno kao oprema.`
            : `Evidentiran trošak: ${noviTrosak.dobavljacNaziv} (${formatHrvatskiIznos(iznos)}) u kategoriji "${KATEGORIJE_TROSKA_LABELS[kat]}".`,
        };
        break;
      }

      // 22. Dohvaćanje financijske slike i dobiti (Faza 18)
      case 'dohvati_financijsku_sliku_i_dobit': {
        const godina = typeof args.godina === 'number' ? args.godina : new Date().getFullYear();
        const profil = await storage.obrt.getProfil();
        const oib = profil?.oib || '00000000000';
        const kprStavke = await storage.kpr.getAll(godina);
        const kprSazetak = izracunajKprSazetak(kprStavke, godina, { oib, naziv: profil?.naziv || 'Obrt' });
        const troskovi = storage.troskovi ? await storage.troskovi.getAll(godina) : [];
        const placeniTroskovi = troskovi.filter(t => t.status === 'PLACENO');
        const ukupnoPlaceniTroskovi = placeniTroskovi.reduce((sum, t) => sum + t.ukupnoEur, 0);

        const spremljeneUplate = storage.doprinosi ? await storage.doprinosi.getAllUplate(godina) : [];
        const uplaceniMjeseci = new Map<number, string>();
        for (const u of spremljeneUplate) {
          if (u.status === 'UPLACENO') {
            uplaceniMjeseci.set(u.mjesec, u.datumUplate || '');
          }
        }

        const doprinosi = generirajGodisnjeDoprinose(oib, godina, uplaceniMjeseci);
        const ukupnoUplaceniDoprinosi = doprinosi.filter(d => d.status === 'UPLACENO').reduce((sum, d) => sum + d.ukupnoDoprinosiEur, 0);

        const cashFlow = izracunajCashFlow({
          ukupnoNaplacenoKprEur: kprSazetak.ukupnoGodina,
          ukupnoPlaceniTroskoviEur: ukupnoPlaceniTroskovi,
          ukupnoPlaceniDoprinosiEur: ukupnoUplaceniDoprinosi,
          ukupnoPlaceniPorezEur: 0,
        });

        result = {
          uspjeh: true,
          podaci: {
            godina,
            kprPrimiciEur: cashFlow.ukupniPrimiciEur,
            operativniTroskoviEur: ukupnoPlaceniTroskovi,
            doprinosiEur: ukupnoUplaceniDoprinosi,
            ukupniIzdaciEur: cashFlow.ukupniIzdaciEur,
            netoDobitEur: cashFlow.netoDobitEur,
            profitnaMarzaPostotak: cashFlow.profitnaMarzaPostotak,
          },
          poruka: `Financijska slika za ${godina}.: Primici ${formatHrvatskiIznos(cashFlow.ukupniPrimiciEur)}, Izdaci ${formatHrvatskiIznos(cashFlow.ukupniIzdaciEur)}, Čista neto dobit ${formatHrvatskiIznos(cashFlow.netoDobitEur)} (marža ${cashFlow.profitnaMarzaPostotak}%).`,
        };
        break;
      }

      // 23. Saldiranje transakcije s bankovnog izvoda (Faza 18)
      case 'saldiraj_izvod_transakcije': {
        const { dokumentId, iznosEur, datumNaplate, brojIzvoda, opisPlatitelja } = args;
        const iznos = typeof iznosEur === 'number' ? iznosEur : parseFloat(iznosEur);
        if (isNaN(iznos) || iznos <= 0) {
          return { uspjeh: false, poruka: 'Iznos transakcije mora biti veći od 0 EUR.' };
        }

        const datum = datumNaplate && typeof datumNaplate === 'string' 
          ? datumNaplate 
          : new Date().toISOString().slice(0, 10);

        const kprStavka = await evidentirajNaplatu(storage.kpr, storage.dokumenti, {
          dokumentId: dokumentId ? String(dokumentId).trim() : undefined,
          datumNaplate: datum,
          iznos: iznos,
          nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
          opisPlatitelja: opisPlatitelja ? String(opisPlatitelja).trim() : 'Uplata s bankovnog izvoda',
          brojIzvoda: brojIzvoda ? String(brojIzvoda).trim() : 'Bankovni izvod',
        });

        if (context.refreshStats) {
          await context.refreshStats();
        }

        result = {
          uspjeh: true,
          podaci: { kprStavka },
          poruka: `Transakcija saldirana u KPR pod rednim brojem #${kprStavka.brojKprStavke} (${formatHrvatskiIznos(iznos)}).`,
        };
        break;
      }

      // 24. Provjera poreznog kalendara i rokova (Faza 20)
      case 'provjeri_porezni_kalendar_i_rokove': {
        const godina = typeof args.godina === 'number' ? args.godina : new Date().getFullYear();
        const samoPredstojeci = args.samoPredstojeci !== false;
        const danas = new Date().toISOString().slice(0, 10);

        // Provjeri profil i uplate doprinosa iz baze
        const profil = await storage.obrt.getProfil();
        const oib = profil?.oib || '00000000000';
        const spremljeneUplate = storage.doprinosi ? await storage.doprinosi.getAllUplate(godina) : [];
        const uplaceniMjeseci = new Set<number>();
        for (const u of spremljeneUplate) {
          if (u.status === 'UPLACENO') {
            uplaceniMjeseci.add(u.mjesec);
          }
        }

        const sviRokovi = generirajPorezniKalendar(godina, oib).map(rok => {
          let uplaceno = false;
          if (rok.vrsta === 'DOPRINOSI' && rok.mjesec && uplaceniMjeseci.has(rok.mjesec)) {
            uplaceno = true;
          }
          const preostaliDani = izracunajPreostaleDane(rok.datumDospijeca, danas);
          const status = odrediStatusRoka(preostaliDani, uplaceno);
          return {
            ...rok,
            uplaceno,
            preostaliDani,
            status,
          };
        });

        const sljedeci = dohvatiSljedeciPorezniRok(sviRokovi, danas);
        const sljedeciRok = sljedeci ? {
          ...sljedeci.rok,
          preostaliDani: sljedeci.preostaloDana,
          jeHitno: sljedeci.jeHitno,
          uplaceno: sljedeci.rok.vrsta === 'DOPRINOSI' && sljedeci.rok.mjesec ? uplaceniMjeseci.has(sljedeci.rok.mjesec) : false,
          status: odrediStatusRoka(
            sljedeci.preostaloDana,
            sljedeci.rok.vrsta === 'DOPRINOSI' && sljedeci.rok.mjesec ? uplaceniMjeseci.has(sljedeci.rok.mjesec) : false
          ),
        } : null;

        const filtriraniRokovi = samoPredstojeci 
          ? sviRokovi.filter(r => r.status === 'CEKA_UPLATU' || r.status === 'PREKORACENO')
          : sviRokovi;

        let poruka = '';
        if (sljedeciRok) {
          const preostaloTekst = sljedeciRok.preostaliDani === 0 
            ? 'danas' 
            : sljedeciRok.preostaliDani === 1 
              ? 'sutra' 
              : sljedeciRok.preostaliDani > 1
                ? `za ${sljedeciRok.preostaliDani} dana (${formatHrvatskiDatum(sljedeciRok.datumDospijeca)})`
                : `prije ${Math.abs(sljedeciRok.preostaliDani)} dana (${formatHrvatskiDatum(sljedeciRok.datumDospijeca)})`;
          const iznosTekst = sljedeciRok.okvirniIznosEur ? ` u iznosu od ${formatHrvatskiIznos(sljedeciRok.okvirniIznosEur)}` : '';

          if (sljedeciRok.status === 'PREKORACENO') {
            poruka = `Gosparu, porezna straža ne spava! Obveza "${sljedeciRok.naslov}" dospjela je ${formatHrvatskiDatum(sljedeciRok.datumDospijeca)}${iznosTekst} i kasni ${Math.abs(sljedeciRok.preostaliDani)} dana. Valja to odma riješit da ne šalju opomene.`;
          } else if (sljedeciRok.preostaliDani <= 7) {
            poruka = `Orlandov lakat motri kalendar, gosparu moj. Pred nama je obveza "${sljedeciRok.naslov}" koja dospijeva ${preostaloTekst}${iznosTekst}. Pripremi dukate na vrijeme, neka papiri budu čisti i šesni.`;
          } else {
            poruka = `Porezni kalendar za ${godina}. godinu je miran. Sljedeća obveza je "${sljedeciRok.naslov}", dospijeva ${preostaloTekst}${iznosTekst}.`;
          }
        } else {
          poruka = `Za ${godina}. godinu sve su porezne i zakonske obveze podmirene ili arhivirane. Dubrovnik mirno plovi!`;
        }

        result = {
          uspjeh: true,
          podaci: {
            godina,
            danas,
            sljedeciRok,
            rokovi: filtriraniRokovi,
          },
          poruka,
        };
        break;
      }

      // 25. Pregled dospjelih ponavljajućih računa / pretplata (Faza 20)
      case 'pregledaj_dospjele_ponavljajuce_racune': {
        if (!storage.recurring) {
          return {
            uspjeh: false,
            poruka: 'Spremište ponavljajućih računa nije konfigurirano.',
          };
        }

        const referentniDatum = args.datum && typeof args.datum === 'string' 
          ? args.datum 
          : new Date().toISOString().slice(0, 10);

        const aktivniProfili = await storage.recurring.getAll(true);
        const dospjeliProfili = aktivniProfili.filter(p => jeDospjeloZaIzdavanje(p.sljedeceDospijeceDatum, referentniDatum));

        const ukupnoEur = dospjeliProfili.reduce((sum, p) => sum + izracunajUkupnoPretplate(p.stavke), 0);

        let poruka = '';
        if (dospjeliProfili.length === 0) {
          poruka = `Gosparu moj, sve pretplate i ponavljajući računi miruju ko barke pod zidinama. Nema profila koji čekaju izdavanje na dan ${formatHrvatskiDatum(referentniDatum)}.`;
        } else {
          const nazivi = dospjeliProfili.map(p => `${p.partnerNaziv} (${formatHrvatskiIznos(izracunajUkupnoPretplate(p.stavke))})`).join(', ');
          poruka = `Imamo ${dospjeliProfili.length} dospjela ponavljajuća računa spremna za izdavanje ukupne vrijednosti ${formatHrvatskiIznos(ukupnoEur)}: ${nazivi}. Jednim klikom možemo generirati sve nacrte!`;
        }

        result = {
          uspjeh: true,
          podaci: {
            referentniDatum,
            brojAktivnih: aktivniProfili.length,
            brojDospjelih: dospjeliProfili.length,
            ukupnoDospjeloEur: ukupnoEur,
            dospjeliProfili,
          },
          poruka,
        };
        break;
      }

      default:
        logger.warn(`Pozvan nepoznat alat: "${toolName}"`);
        return {
          uspjeh: false,
          poruka: `Nepoznat alat sustava: "${toolName}".`,
        };
    }

    const durationMs = Math.round(performance.now() - startTime);
    logger.info(`Alat [${toolName}] uspješno dovršen u ${durationMs}ms`, {
      uspjeh: result.uspjeh,
      trajanjeMs: durationMs,
    });
    logger.verbose(`Cjeloviti podaci rezultata alata [${toolName}]`, result);
    return result;
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startTime);
    logger.error(`Greška pri izvršavanju alata [${toolName}] nakon ${durationMs}ms:`, {
      error: err?.message,
      stack: err?.stack,
      trajanjeMs: durationMs,
    });
    return {
      uspjeh: false,
      poruka: `Greška alata: ${err?.message || 'Neobjašnjena greška dispečera.'}`,
    };
  }
}
