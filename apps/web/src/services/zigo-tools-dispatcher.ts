import { 
  validateOib, 
  validateIban, 
  generateKprCsv, 
  generatePosdXml, 
  izracunajKprSazetak,
  type Artikl, 
  type PoreznaZona,
  type ZigoToolResult,
  type IObrtnIQStorage,
  type ZigoMemoryKategorija
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
