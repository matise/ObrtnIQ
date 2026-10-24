import { 
  validateOib, 
  validateIban, 
  generateKprCsv, 
  generatePosdXml, 
  izracunajKprSazetak,
  type Artikl, 
  type PoreznaZona,
  type ZigoToolResult,
  type IObrtnIQStorage
} from '@obrtniq/core';
import { dexieStorage } from '../storage/dexie-db';
import { appLogger } from './logger';
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
  const logger = appLogger.scope('AGENT:TOOL');

  logger.info(`Izvršavam agentni alat [${toolName}]`, args);

  try {
    switch (toolName) {
      // 1. Postavljanje kupca na radnu plohu
      case 'postavi_kupca': {
        const { partnerNaziv, oib, iban, taxZone, adresa } = args;
        if (!partnerNaziv || typeof partnerNaziv !== 'string' || !partnerNaziv.trim()) {
          return { uspjeh: false, poruka: 'Naziv kupca je obvezan parametar.' };
        }

        if (context.form) {
          context.form.setPartnerNaziv(partnerNaziv.trim());
          if (oib) {
            context.form.setOib(oib.trim());
            context.form.setIsOibValid(validateOib(oib.trim()));
          }
          if (iban) {
            context.form.setIban(iban.trim());
            context.form.setIsIbanValid(validateIban(iban.trim()));
          }
          if (taxZone) {
            context.form.setTaxZone(taxZone as PoreznaZona);
          }
        }

        return {
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
      }

      // 2. Dodavanje stavke na radnu plohu
      case 'dodaj_stavku_racuna': {
        const { naziv, kpdSifra, kolicina, cijena, jedinicaMjere } = args;
        if (!naziv || !kpdSifra) {
          return { uspjeh: false, poruka: 'Naziv i KPD 2025 šifra stavke su obvezni.' };
        }

        const parsedKolicina = Number(kolicina) > 0 ? Number(kolicina) : 1;
        const parsedCijena = Number(cijena) >= 0 ? Number(cijena) : 0;
        const jm = jedinicaMjere || 'sat';

        const novaStavka: FormItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          kpdSifra: kpdSifra.trim(),
          kpdNaziv: naziv.trim(),
          kolicina: parsedKolicina,
          cijena: parsedCijena,
          jedinicaMjere: jm,
        };

        if (context.items) {
          const currentItems = context.items.items || [];
          context.items.setItems([...currentItems, novaStavka]);
        }

        return {
          uspjeh: true,
          podaci: {
            stavka: novaStavka,
            ukupno: parsedKolicina * parsedCijena,
          },
          poruka: `Dodana stavka "${naziv.trim()}" (${parsedKolicina} ${jm} x ${parsedCijena.toFixed(2)} €).`,
        };
      }

      // 3. Čišćenje stavki s radne plohe
      case 'ocisti_stavke_racuna': {
        if (context.items) {
          context.items.resetItems();
        }
        return {
          uspjeh: true,
          poruka: 'Radna ploha je očišćena. Sve prethodne stavke su uklonjene.',
        };
      }

      // 4. Priprema i izdavanje aktivnog računa
      case 'izdaj_aktivni_racun': {
        const ukupno = context.items?.ukupniIznos || 0;
        const isSubmittable = context.workflow?.isFormSubmittable ?? false;

        return {
          uspjeh: true,
          podaci: {
            akcija: 'POTVRDA_IZDAVANJA',
            ukupno,
            isSubmittable,
          },
          poruka: `Račun u ukupnom iznosu od ${ukupno.toFixed(2)} € je pripremljen za izdavanje. Pritisnite F2 ili potvrdite karticu za konačno fiskalno pečaćenje.`,
        };
      }

      // 5. Storniranje računa
      case 'storniraj_racun': {
        const { brojDokumenta, razlog } = args;
        if (!brojDokumenta) {
          return { uspjeh: false, poruka: 'Broj dokumenta za storniranje je obvezan.' };
        }

        const sviDokumenti = await storage.dokumenti.getAll();
        const ciljaniDoc = sviDokumenti.find((d) => d.brojDokumenta === brojDokumenta.trim());

        if (!ciljaniDoc) {
          return {
            uspjeh: false,
            poruka: `Dokument s brojem "${brojDokumenta}" nije pronađen u bazi.`,
          };
        }

        return {
          uspjeh: true,
          podaci: {
            dokumentId: ciljaniDoc.id,
            brojDokumenta: ciljaniDoc.brojDokumenta,
            razlog: razlog || 'Stornirano na zahtjev korisnika.',
          },
          poruka: `Pripremljen storno za dokument ${ciljaniDoc.brojDokumenta}. Potvrdite radnju za generiranje storno računa.`,
        };
      }

      // 6. Pretraga cjenika
      case 'pretrazi_cjenik': {
        const pojam = (args.pojam || '').toLowerCase().trim();
        const artikli = await storage.artikli.getAll(true);
        const rezultati = pojam
          ? artikli.filter(
              (a) =>
                a.naziv.toLowerCase().includes(pojam) ||
                a.kpdSifra.includes(pojam) ||
                (a.opis && a.opis.toLowerCase().includes(pojam))
            )
          : artikli;

        return {
          uspjeh: true,
          podaci: rezultati,
          poruka: `Pronađeno ${rezultati.length} stavki u cjeniku.`,
        };
      }

      // 7. Spremanje u cjenik
      case 'dodaj_u_cjenik': {
        const { naziv, kpdSifra, cijena, jedinicaMjere, opis } = args;
        if (!naziv || !kpdSifra) {
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
        return {
          uspjeh: true,
          podaci: newArtikl,
          poruka: `Usluga "${newArtikl.naziv}" (KPD: ${newArtikl.kpdSifra}, ${newArtikl.cijenaOsnovica.toFixed(2)} €) spremljena je u cjenik.`,
        };
      }

      // 8. Pretraga partnera
      case 'pretrazi_partnere': {
        const pojam = (args.pojam || '').toLowerCase().trim();
        const partneri = await storage.partneri.getAll(true);
        const rezultati = pojam
          ? partneri.filter(
              (p) =>
                p.naziv.toLowerCase().includes(pojam) ||
                (p.oib && p.oib.includes(pojam)) ||
                (p.adresa && p.adresa.toLowerCase().includes(pojam))
            )
          : partneri;

        return {
          uspjeh: true,
          podaci: rezultati,
          poruka: `Pronađeno ${rezultati.length} partnera u adresaru.`,
        };
      }

      // 9. Financijski status i paušalni prag od 40.000 €
      case 'dohvati_financijski_status': {
        const tekuciDatum = new Date();
        const godina = tekuciDatum.getFullYear();
        const sveNaplate = await storage.kpr.getAll(godina);
        const sviDokumenti = await storage.dokumenti.getAll(godina);

        const ukupnoNaplaceno = sveNaplate.reduce((sum, n) => sum + (n.ukupnoNaplaceno || 0), 0);
        const zakonskiPrag = 40000.0;
        const ostaloDoPraga = Math.max(0, zakonskiPrag - ukupnoNaplaceno);
        const prekoracenPrag = ukupnoNaplaceno > zakonskiPrag;

        const izdaniRacuni = sviDokumenti.filter(
          (d) => d.vrstaDokumenta === 'RACUN' && d.status !== 'STORNIRANO'
        );

        return {
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
      }

      // 10. Izvoz KPR u CSV format (s Excel BOM)
      case 'izvezi_kpr_csv': {
        const godina = new Date().getFullYear();
        const naplate = await storage.kpr.getAll(godina);
        const profil = await storage.obrt.getProfil();

        const csvContent = generateKprCsv(naplate, godina, {
          obrtNaziv: profil?.naziv,
          obrtOib: profil?.oib,
        });

        downloadFile(csvContent, `KPR_${godina}_${profil?.oib || 'obrt'}.csv`, 'text/csv;charset=utf-8;');
        return {
          uspjeh: true,
          poruka: `Knjiga prometa (KPR) za ${godina}. godinu uspješno je preuzeta kao CSV datoteka prilagođena za Excel.`,
        };
      }

      // 11. Izvoz PO-SD XML obrasca za ePoreznu
      case 'izvezi_posd_xml': {
        const godina = new Date().getFullYear();
        const naplate = await storage.kpr.getAll(godina);
        const profil = await storage.obrt.getProfil();

        if (!profil || !profil.oib) {
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

        downloadFile(xmlContent, `PO-SD_${godina}_${profil.oib}.xml`, 'application/xml;charset=utf-8;');
        return {
          uspjeh: true,
          poruka: `Službeni PO-SD XML obrazac za ${godina}. godinu uspješno je pripremljen i preuzet za predaju na ePoreznu.`,
        };
      }

      // 12. Specijalna mehanika: Žigin Rez (Instant trijaža stanja u 3 točke)
      case 'aktiviraj_zigin_rez': {
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

        return {
          uspjeh: true,
          podaci: {
            stoGori,
            stoCeka,
            akcijaSad,
          },
          poruka: `Žigin Rez aktiviran:\n1. ŠTO GORI: ${stoGori}\n2. ŠTO ČEKA: ${stoCeka}\n3. AKCIJA SAD: ${akcijaSad}`,
        };
      }

      default:
        return {
          uspjeh: false,
          poruka: `Nepoznat alat sustava: "${toolName}".`,
        };
    }
  } catch (err: any) {
    logger.error(`Greška pri izvršavanju alata [${toolName}]`, { error: err?.message });
    return {
      uspjeh: false,
      poruka: `Greška alata: ${err?.message || 'Neobjašnjena greška dispečera.'}`,
    };
  }
}
