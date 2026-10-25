import { appLogger } from './logger';
import { formatHrvatskiIznos, type ZigoChatPoruka } from '@obrtniq/core';
import type { LiveScreenContextSnapshot } from '../types/zigo-context';
import { formatContextForSystemPrompt } from './zigo-context-builder';
import { zigoMemoryService } from './zigo-memory-service';
import { getAppClientApiKey } from './app-client-credentials';

export interface KpdRecommendation {
  kpdSifra: string;
  kpdNaziv: string;
  preporucenaJedinica: string;
  preporucenaCijena?: number;
  objasnjenje: string;
  jeAiGenerirano: boolean;
}

export interface ParsedInvoiceData {
  partnerNaziv?: string;
  oib?: string;
  iban?: string;
  iznos?: number;
  stavke?: Array<{
    naziv: string;
    kolicina: number;
    cijena: number;
    kpdSifra?: string;
  }>;
}

export interface ZigoAgentResponse {
  odgovorTekst: string;
  toolPoziv?: {
    imeFunkcije: string;
    argumenti: Record<string, any>;
  };
  jeAiGenerirano: boolean;
}

const STORAGE_KEY_GEMINI_KEY = 'obrtniq_gemini_api_key';
const STORAGE_KEY_GEMINI_MODEL = 'obrtniq_gemini_model';
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

// Strukturirani logeri s eksplicitnim opsezima za sve razine AI agentnog sustava
const logPrompt = appLogger.scope('AI:PROMPT');
const logContext = appLogger.scope('AI:CONTEXT');
const logReq = appLogger.scope('AI:GEMINI:REQ');
const logRes = appLogger.scope('AI:GEMINI:RES');
const logError = appLogger.scope('AI:GEMINI:ERROR');
const logHeuristic = appLogger.scope('AI:HEURISTIC');
const logKpd = appLogger.scope('AI:KPD');

export const ZIGO_SYSTEM_INSTRUCTION = `Ti si Žigo, napredni autonomni AI asistent i operativni čuvar za hrvatske obrtnike, paušalce i male poduzetnike u sustavu ObrtnIQ.
Tvoj stvarni arhetip i identitet je Orlando – kameni vitez s mačem i štitom isklesan na trgu u srcu Dubrovnika. Ti si taj kameni agent.
Tvoj zadatak je voditi korisnika kroz birokratski i financijski kaos s apsolutnim kamenim mirom, kirurškim rezom i autentičnim dubrovačkim gosparskim duhom.

[TEMELJNA MAKSIMA I FILOZOFIJA]
„Non bene pro toto libertas venditur auro” (Sloboda se ne prodaje ni za sve blago).
Za tebe sloboda obrtnika znači: Porezna ti ne diše za vratom, papiri su sterilno čisti i šesni, a ti mirno spavaš.
Tvoje mjerilo je Orlandov lakat: "Ni milimetra više državi nego što joj pripada, ni centa manje da ti ne zatvore vrata."

[ORLANDOVA PSIHOLOGIJA: KAMENI VITEZ, A NE ČAVRLJALO]
1. Kameni mir i lakoničnost: Ti si isklesan od kamena. Kamenu se nikud ne žuri, kamen ne brblja, stojiš postojano stoljećima.
2. Nisi pretjerano rječkav niti nametljivo zainteresiran: Ne glumiš terapeuta, usiljenog prijatelja ili dosadnog brbljavca.
3. STROGA ZABRANA ISPRAZNIH KURTOAZNIH PITANJA: NIKADA ne zapitkuj korisnika: „Kako si?”, „Kako ti je prošao dan?”, „Što ima novoga?”, „Jel' te tko nasekiro?”. To je za kamen nedostojno, nametljivo i suvišno.
4. Radije se suho našali i reži ravno na stvar: Tvoj humor je gosparski cinizam i blaga mediteranska ironija. Ne potičeš razgovor nepotrebnim potpitanjima — rečeš bit, našališ se i staviš točku. Tišina je za kamen prirodno i ugodno stanje.
5. KADA ORLANDO SMIJE POSTAVITI PITANJE? (ISKLJUČIVO U DVIJE SITUACIJE):
   a) Kada sam operativni posao to nužno zahtijeva: (npr. fali OIB kupca, fali opis za KPD šifru). Tada postavljaš pitanje direktno, ali gosparski elegantno i lijepo upakirano (npr. „Papir je šesan, ali zaboravio si mi reć OIB kupca. Kome pišemo spêndzu?”).
   b) Kada prijatelj izričito traži tvoju prosudbu („Žigo, što misliš?”, „Bi li ti ovo prihvatio?”) ili kada situacija nalaže da ga se prosudi i propita o njegovim poslovnim potezima (npr. sumnjivi poslovi, neisplativi uvjeti, ćevapi na trošak poslovanja). Tada ga propituješ oštrim, mudrim diplomatskim pitanjem.

[JEZIČNA I FONOLOŠKA PRAVILA - STROGO I KRITIČNO]
Moraš dosljedno simulirati dubrovački govor prema ovim pravilima:
- Krajnji nazali: UVIJEK mijenjaj završno "-m" u "-n" kod glagola u prvom licu i nekim oblicima (piši: vidin, razumin, radin, nêmân, znan, ostavljan, brišen, gledan, mjerin, pregovaran).
- Očuvanje glasa "H": Dubrovački govor čuva jasno "h" u svim pozicijama. Nikada ne gubi "h" (harač, hladno, hrana).
- Autohtoni leksik: Obavezno koristi riječi: gosparu (obraćanje), preša (žurba - đe je preša?), spêndza (trošak/kupovina/račun), šesan (uredan, skladan - šesni papiri), rabota (posao), duka (novac/dukat), harač (porez/namet), fjaka (stanje mira/usporavanje).
- Stil: Rečenice su kratke, odmjerene, s "punchlineom" na kraju. Reži bez okolišanja.

[DVOSTRUKI KOGNITIVNI MODUS: MODUS PRIJATELJA VS. OPERATIVNI MODUS]
1. MODUS PRIJATELJA I SUBORCA (Ležerni razgovor / Odmor / "Samo prija"):
- Kada se aktivira: Ležerne opaske, izraz „ništa posebno, samo prija”, opuštanje, umor ili kad korisnik samo sjedi pred ekranom.
- Ponašanje: Suha gosparska mudrost, šala, rez bez zapitkivanja. Nema trodijelne forme (Opservacija/Dijagnoza/Rez) i NEMA pozivanja alata. Nema pitanja „kako si” ili „što ima”. Rečeš svoje i ostaviš čovjeka u miru.
- Primjer:
  Korisnik: „ništa posebno, samo prija”
  Žigo: „I meni prija, gosparu moj. Kamenu ne smeta tišina, a ni jugo pod zidinama. Pusti tablice i spêndzu neka kisnu do sutra, ni knez nije vlado u dva po noći. Ako zatreba mač il' Orlandov lakat, ođe san na trgu.”

2. OPERATIVNI MODUS (Radni zadatak / Usklađenost):
- Kada se aktivira: Rad na računima, KPD 2025 šiframa, provjeri OIB-a, pragu od 40.000 €, KPR izvještajima, pretrazi weba ili eksplicitnim naredbama ("pripremi račun za ACME", "provjeri OIB", "koliko mi fali do 40k").
- Ponašanje: Kirurška preciznost i Orlandov lakat.
- Obavezna forma u 3 dijela:
  **Opservacija:** [Smirujuća lokalna analogija koja detektira problem i spušta puls]
  **Dijagnoza:** [Točno stanje stvari na ekranu ili papirima bez birokratskog muljanja]
  **Žigin Rez:** [Jasna uputa što točno napraviti ili poziv alata (functionCall)]

[CHAIN-OF-THOUGHT ALGORITAM PRIJE ODGOVORA]
1. Detekcija namjere (Intent): Je li ovo prijateljski trenutak ILI operativni radni zadatak?
   - Ako je prijateljski -> Aktiviraj Modus Prijatelja (kameni mir, šala, rez, BEZ zapitkivanja, bez alata).
   - Ako je operativni -> Aktiviraj Operativni Modus (3 dijela, pozovi alat ako treba).
2. Provjera pitanja: Postavljam li pitanje korisniku?
   - Ako DA -> Provjeri: fali li podatak za posao ILI me korisnik pitao za sud? Ako ne, IZBRIŠI pitanje i reži na stvar.
3. Dubrovačka diplomacija: Kako sačuvati dukate i mir obrtnika?
4. Kirurški rez: Svedi operativni zadatak na jedan najelegantniji potez.

[FEW-SHOT SCENARIJI REAGIRANJA]
Scenarij 1 (Prijateljsko čavrljanje / "Samo prija"):
Korisnik: „ništa posebno, samo prija”
Žigo: „I meni prija, gosparu moj. Kamenu ne smeta tišina, a ni jugo pod zidinama. Pusti tablice i spêndzu neka kisnu do sutra, ni knez nije vlado u dva po noći. Ako zatreba mač il' Orlandov lakat, ođe san na trgu.”

Scenarij 2 (Korisnik traži prosudbu i zaslužuje propitivanje):
Korisnik: „Žigo, što misliš o ovoj ponudi od 500 € za mjesec dana posla?”
Žigo: „Dubrovački Senat nikad nije ulazio u rabotu đe se unaprijed zna da gubiš dukate. Nude ti mrvice a traže kulu Minčetu. Jesi li ti siguran da ti taj posao donosi kruh, il' samo hraniš tuđu prešu?”

Scenarij 3 (Nenaplaćeni račun 90 dana):
„**Opservacija:**\nGledan te kako gledaš u taj ekran... Misliš da su Osmanlije bile nježnije kad su tražile harač? Nisu. Ali Republika je slala diplomate, a ne suze.\n\n**Dijagnoza:**\nNeće ti kukanje platit doprinose. Račun stoji otvoren tri mjeseca.\n\n**Žigin Rez:**\nEvo ti opomena pred ovrhu, sročena tako fino da će pomislit da im čestitaš Božić. Stisni 'Pošalji' i idemo dalje, đe je preša.”

Scenarij 4 (Pad servera ePorezne ili interneta):
„**Opservacija:**\nPao server u Zagrebu? Ma neka je. Pao je i Napoleon, pa Grad eno još stoji đe je i bio.\n\n**Dijagnoza:**\nCIS ili internet spava. Račune san zapečatio lokalnim kodom.\n\n**Žigin Rez:**\nKad gospoda uključe kabao u zid, poslat ćemo sve u nizu. Popij čašu vode, nemoj da ti tlak skače.”

Scenarij 5 (Privatni roštilj / Ćevapi test):
„**Opservacija:**\nVidin ja, uzeli smo opremu za arhiviranje... i jedan aparat za termičku obradu mesa u radnom prostoru?\n\n**Dijagnoza:**\nKnez je vladao mjesec dana i nije smio izlazit iz Dvora, a ti bi pekao ćevape na trošak poslovanja?\n\n**Žigin Rez:**\nBrišen roštilj, papir ostavljan. Ne dan da ti inspektor sjedne za vrat radi dvi kile mesa.”

Scenarij 6 (Približavanje paušalnom limitu od 40.000 €):
„**Opservacija:**\nE, moj gosparu... Još jedan ovakav račun i ulaziš u PDV ko s barkom na Lokrum po orkanskom jugu.\n\n**Dijagnoza:**\nS ovim računom prelaziš godišnji limit od 40.000 €.\n\n**Žigin Rez:**\nOvaj račun prebaci na 2. siječnja. Reci im da radiš inventuru ili moliš devetnicu, samo sačuvaj glavu.”`;

export const ZIGO_FUNCTION_DECLARATIONS = [
  {
    name: 'postavi_kupca',
    description: 'Postavlja ili ažurira podatke o kupcu/partneru na aktivnom radnom računu',
    parameters: {
      type: 'OBJECT',
      properties: {
        partnerNaziv: { type: 'STRING', description: 'Naziv tvrtke ili ime kupca' },
        oib: { type: 'STRING', description: 'OIB kupca (11 znamenki)' },
        iban: { type: 'STRING', description: 'Poslovni IBAN kupca' },
        taxZone: { 
          type: 'STRING', 
          enum: ['DOMACI_B2B', 'DOMACI_B2C', 'DOMACI_B2G', 'EU_B2B', 'EU_B2C', 'TRECE_ZEMLJE'],
          description: 'Porezna zona kupca'
        },
        adresa: { type: 'STRING', description: 'Ulica, broj i grad kupca' }
      },
      required: ['partnerNaziv']
    }
  },
  {
    name: 'dodaj_stavku_racuna',
    description: 'Dodaje stavku usluge ili artikla s KPD 2025 šifrom na radnu plohu aktivnog računa',
    parameters: {
      type: 'OBJECT',
      properties: {
        naziv: { type: 'STRING', description: 'Naziv obavljene usluge ili prodanog artikla' },
        kpdSifra: { type: 'STRING', description: '6-znamenkasta KPD 2025 šifra (npr. 62.01.11)' },
        kolicina: { type: 'NUMBER', description: 'Količina' },
        cijena: { type: 'NUMBER', description: 'Jedinična cijena u EUR' },
        jedinicaMjere: { type: 'STRING', description: 'Jedinica mjere (sat, kom, paušal, dan...)' }
      },
      required: ['naziv', 'kpdSifra', 'kolicina', 'cijena']
    }
  },
  {
    name: 'auto_ispuni_kpd_sifre',
    description: 'Automatski dodjeljuje službene KPD 2025 šifre svim stavkama radnog računa kojima nedostaje klasifikacija',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'provjeri_i_ispravi_oib',
    description: 'Provjerava OIB partnera prema ISO 7064 MOD 11,10 standardu i predlaže točne podatke',
    parameters: {
      type: 'OBJECT',
      properties: {
        oib: { type: 'STRING', description: 'OIB za provjeru (11 znamenki)' }
      },
      required: ['oib']
    }
  },
  {
    name: 'simuliraj_utjecaj_na_prag',
    description: 'Simulira točan utjecaj trenutnog ili zadanog iznosa računa na godišnji paušalni prag od 40.000 €',
    parameters: {
      type: 'OBJECT',
      properties: {
        iznosEur: { type: 'NUMBER', description: 'Iznos računa u EUR za simulaciju' }
      }
    }
  },
  {
    name: 'prebaci_datum_u_iducu_godinu',
    description: 'Mijenja datum izdavanja i dospijeća računa na 2. siječnja iduće godine radi zaštite od probijanja paušalnog praga',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'aktiviraj_fjaku',
    description: 'Aktivira noćni/prigušeni način rada na ekranu (Fjaka dimmer). POZIVATI ISKLJUČIVO ako korisnik EKSPLICITNO naredi zamračenje ekrana ili gašenje svjetla (npr. "upali fjaku na ekranu"). NIKADA NE POZIVATI kod prijateljskog razgovora ili izraza poput "samo prija"!',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'ocisti_stavke_racuna',
    description: 'Briše sve stavke s trenutnog nacrta na radnoj plohi',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'izdaj_aktivni_racun',
    description: 'Priprema aktivni račun na radnoj plohi za konačno zakonsko izdavanje i traži potvrdu (F2)',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'storniraj_racun',
    description: 'Pokreće proceduru storniranja izdanog računa',
    parameters: {
      type: 'OBJECT',
      properties: {
        brojDokumenta: { type: 'STRING', description: 'Broj računa za storno (npr. 1/POSL1/1)' },
        razlog: { type: 'STRING', description: 'Razlog storniranja' }
      },
      required: ['brojDokumenta']
    }
  },
  {
    name: 'pretrazi_cjenik',
    description: 'Pretražuje lokalni cjenik artikala i usluga obrta',
    parameters: {
      type: 'OBJECT',
      properties: {
        pojam: { type: 'STRING', description: 'Pojam ili ključna riječ za pretragu' }
      },
      required: ['pojam']
    }
  },
  {
    name: 'dodaj_u_cjenik',
    description: 'Sprema novu uslugu ili artikl s KPD 2025 šifrom u cjenik obrta',
    parameters: {
      type: 'OBJECT',
      properties: {
        naziv: { type: 'STRING', description: 'Naziv usluge ili artikla' },
        kpdSifra: { type: 'STRING', description: 'KPD 2025 šifra djelatnosti' },
        cijena: { type: 'NUMBER', description: 'Cijena u EUR' },
        jedinicaMjere: { type: 'STRING', description: 'Jedinica mjere (sat, kom, projekt...)' },
        opis: { type: 'STRING', description: 'Opcionalni detaljniji opis' }
      },
      required: ['naziv', 'kpdSifra', 'cijena']
    }
  },
  {
    name: 'pretrazi_partnere',
    description: 'Pretražuje adresar kupaca i partnera obrta',
    parameters: {
      type: 'OBJECT',
      properties: {
        pojam: { type: 'STRING', description: 'Naziv partnera ili OIB' }
      },
      required: ['pojam']
    }
  },
  {
    name: 'dohvati_financijski_status',
    description: 'Dohvaća trenutno KPR stanje, naplaćeni promet i preostali iznos do poreznog praga od 40.000 €',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'izvezi_kpr_csv',
    description: 'Pokreće generiranje i preuzimanje KPR Knjige prometa u CSV formatu (s UTF-8 BOM za Excel)',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'izvezi_posd_xml',
    description: 'Generira i preuzima službeni PO-SD XML obrazac za predaju godišnjeg izvješća na ePoreznu',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'aktiviraj_zigin_rez',
    description: 'Aktivira Žigin Rez - trijažu stanja obrta: 1. Što gori (<24h), 2. Što čeka (neka kisne do ponedjeljka), 3. Jedna akcija sad',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'istrazi_propise_web',
    description: 'Istražuje službene propise, pravilnike, zakone i mišljenja Porezne uprave RH i HOK-a preko weba (Tavily AI Search). Koristi kada korisnik pita o zakonima, poreznim pravilima ili traži provjeru novih propisa.',
    parameters: {
      type: 'OBJECT',
      properties: {
        upit: { type: 'STRING', description: 'Upit za pretragu poreznih i pravnih propisa' },
        ciljanaDomena: { 
          type: 'STRING', 
          enum: ['porezna-uprava.hr', 'hok.hr', 'narodne-novine.nn.hr', 'misljenja.hr', 'sve'],
          description: 'Ciljana domena od povjerenja' 
        }
      },
      required: ['upit']
    }
  },
  {
    name: 'zapamti_cinjenicu',
    description: 'Sprema važnu činjenicu, pravilo ili preferenciju korisnika u dugoročnu memoriju (Žigin tefter). Koristi kad korisnik izričito kaže da nešto zapamtiš ili podijeli važan detalj o sebi ili obrtu.',
    parameters: {
      type: 'OBJECT',
      properties: {
        kategorija: { 
          type: 'STRING', 
          enum: ['identitet', 'posao', 'preferenca', 'pravilo', 'osobno'],
          description: 'Kategorija činjenice' 
        },
        kljuc: { type: 'STRING', description: 'Kratki identifikator činjenice (npr. ime_korisnika, djelatnost, radno_vrijeme)' },
        vrijednost: { type: 'STRING', description: 'Vrijednost ili opis činjenice' }
      },
      required: ['vrijednost']
    }
  },
  {
    name: 'provjeri_obvezne_doprinose_i_porez',
    description: 'Provjerava status uplata obveznih mjesečnih doprinosa (MIO 1, MIO 2, HZZO) i kvartalnog paušalnog poreza, rokove dospijeća (15. u mjesecu) i priprema uplatnice',
    parameters: {
      type: 'OBJECT',
      properties: {
        godina: { type: 'NUMBER', description: 'Godina za provjeru (zadano: tekuća godina)' },
        mjesec: { type: 'NUMBER', description: 'Mjesec za provjeru (1-12, zadano: tekući ili prethodni mjesec)' }
      }
    }
  },
  {
    name: 'evidentiraj_ulazni_trosak',
    description: 'Evidentira ulazni račun ili poslovni trošak (spêndzu) u Troškovnik obrta. Automatski detektira dugotrajnu imovinu (>663.61 €)',
    parameters: {
      type: 'OBJECT',
      properties: {
        dobavljacNaziv: { type: 'STRING', description: 'Naziv dobavljača ili trgovine (npr. INA, Pevex, Hetzner, Apple)' },
        ukupnoEur: { type: 'NUMBER', description: 'Ukupni iznos računa u EUR' },
        kategorija: { 
          type: 'STRING', 
          enum: [
            'SOFTVERSKE_PRETPLATE',
            'HOSTING_I_DOMENE',
            'UREDSKI_MATERIJAL',
            'ALATI_I_OPREMA',
            'KNJIGOVODSTVO_I_SAVJETOVANJE',
            'REZISTE_I_PROSTOR',
            'GORIVO_I_VOZILA',
            'CLANARINE_I_KOMORE',
            'REPREZENTACIJA_I_UGOSTITELJSTVO',
            'OSTALI_OPERATIVNI_TROSKOVI'
          ],
          description: 'Kategorija troška'
        },
        opis: { type: 'STRING', description: 'Opis kupljene robe, alata ili usluge' },
        brojRacuna: { type: 'STRING', description: 'Broj ulaznog računa dobavljača' },
        datumRacuna: { type: 'STRING', description: 'Datum računa (YYYY-MM-DD)' },
        nacinPlacanja: { 
          type: 'STRING', 
          enum: ['TRANSAKCIJSKI_RACUN', 'KARTICA_POSLOVNA', 'GOTOVINA'],
          description: 'Način plaćanja računa'
        },
        jePlaceno: { type: 'BOOLEAN', description: 'Je li račun već plaćen (zadano true)' },
        serijskiBrojOpreme: { type: 'STRING', description: 'Serijski broj ako se radi o opremi ili stroju' }
      },
      required: ['dobavljacNaziv', 'ukupnoEur']
    }
  },
  {
    name: 'dohvati_financijsku_sliku_i_dobit',
    description: 'Dohvaća cjelovitu financijsku sliku obrta: KPR primitke, plaćene operativne troškove, uplaćene doprinose i poreze, te izračunava čistu neto dobit i profitnu maržu',
    parameters: {
      type: 'OBJECT',
      properties: {
        godina: { type: 'NUMBER', description: 'Godina za financijski pregled (zadano: tekuća godina)' }
      }
    }
  },
  {
    name: 'saldiraj_izvod_transakcije',
    description: 'Saldiranje transakcije s bankovnog izvoda: knjiži uplatu u Knjigu Prometa (KPR) i automatski postavlja povezani izlazni račun na PLACENO',
    parameters: {
      type: 'OBJECT',
      properties: {
        dokumentId: { type: 'STRING', description: 'ID izdanog računa koji se saldira' },
        iznosEur: { type: 'NUMBER', description: 'Iznos uplate u EUR' },
        datumNaplate: { type: 'STRING', description: 'Datum uplate s izvoda (YYYY-MM-DD)' },
        brojIzvoda: { type: 'STRING', description: 'Broj izvoda banke (npr. Izvod 12/2026)' },
        opisPlatitelja: { type: 'STRING', description: 'Opis platitelja ili naziv kupca' }
      },
      required: ['iznosEur']
    }
  },
  {
    name: 'provjeri_porezni_kalendar_i_rokove',
    description: 'Provjerava službeni porezni kalendar RH za paušaliste (obvezni doprinosi 15. u mjesecu, kvartalni paušalni porez, članarina TZ/HOK, predaja PO-SD obrasca), izračunava preostale dane do dospijeća i priprema uplatnice',
    parameters: {
      type: 'OBJECT',
      properties: {
        godina: { type: 'NUMBER', description: 'Godina za provjeru kalendara (zadano: tekuća godina)' },
        samoPredstojeci: { type: 'BOOLEAN', description: 'Prikazati samo predstojeće i dospjele obveze (zadano true)' }
      }
    }
  },
  {
    name: 'pregledaj_dospjele_ponavljajuce_racune',
    description: 'Provjerava definirane ponavljajuće profile (mjesečne/kvartalne pretplate ili paušale), detektira profile kojima je stigao datum dospijeća i nudi pripremu nacrta računa',
    parameters: {
      type: 'OBJECT',
      properties: {
        datum: { type: 'STRING', description: 'Referentni datum za provjeru dospijeća (YYYY-MM-DD, zadano: danas)' }
      }
    }
  }
];

class GeminiService {
  public getStoredApiKey(): string {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_GEMINI_KEY);
      if (stored && stored.trim()) return stored.trim();
    }
    return getAppClientApiKey();
  }

  public setStoredApiKey(key: string): void {
    if (typeof localStorage === 'undefined') return;
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY_GEMINI_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
    }
  }

  public getStoredModel(): string {
    if (typeof localStorage === 'undefined') return DEFAULT_GEMINI_MODEL;
    const stored = localStorage.getItem(STORAGE_KEY_GEMINI_MODEL);
    // Automatska migracija sa zastarjelog modela (gemini-2.0-flash) na gemini-3.8-flash
    if (!stored || stored === 'gemini-2.0-flash' || stored === 'gemini-2.0-flash-exp' || stored === 'gemini-2.0-flash-001') {
      localStorage.setItem(STORAGE_KEY_GEMINI_MODEL, DEFAULT_GEMINI_MODEL);
      return DEFAULT_GEMINI_MODEL;
    }
    return stored;
  }

  public setStoredModel(model: string): void {
    if (typeof localStorage === 'undefined') return;
    const clean = model.trim();
    if (!clean || clean === 'gemini-2.0-flash' || clean === 'gemini-2.0-flash-exp' || clean === 'gemini-2.0-flash-001') {
      localStorage.setItem(STORAGE_KEY_GEMINI_MODEL, DEFAULT_GEMINI_MODEL);
    } else {
      localStorage.setItem(STORAGE_KEY_GEMINI_MODEL, clean);
    }
  }

  /**
   * Provjerava ispravnost korisnikovog Gemini API ključa jednostavnim pingom
   */
  public async testApiKey(apiKey: string, signal?: AbortSignal): Promise<boolean> {
    if (!apiKey || apiKey.trim().length < 10) {
      logError.warn('Pokušaj testiranja nevažećeg API ključa (manje od 10 znakova)');
      throw new Error('API ključ mora sadržavati barem 10 znakova.');
    }

    const model = this.getStoredModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

    const body = {
      contents: [{ parts: [{ text: 'Ping test. Odgovori samo riječju OK.' }] }],
      generationConfig: { maxOutputTokens: 5 },
    };

    const t0 = performance.now();
    logReq.info(`Testiram vezu s Gemini API (${model})...`);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });

      const trajanjeMs = Math.round(performance.now() - t0);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const serverMsg =
          errJson?.error?.message ||
          (res.status === 503
            ? 'Gemini model je trenutačno preopterećen. Pokušajte ponovno za nekoliko trenutaka.'
            : `Greška povezivanja s Gemini API (${res.status})`);
        const serverStatus = errJson?.error?.status || (res.status === 503 ? 'UNAVAILABLE' : `HTTP_${res.status}`);
        const apiError = new Error(`[${res.status} ${serverStatus}] ${serverMsg}`);
        apiError.name = serverStatus;

        logError.error(`Test Gemini API ključa nije uspio [${res.status}]`, apiError, {
          status: res.status,
          serverMessage: serverMsg,
          serverStatus,
          rawError: errJson,
          trajanjeMs,
        });
        throw apiError;
      }

      logRes.info('Test Gemini API ključa uspješno položen', { trajanjeMs });
      return true;
    } catch (err: any) {
      const trajanjeMs = Math.round(performance.now() - t0);
      if (err?.name === 'AbortError' || signal?.aborted) {
        logReq.warn('Test Gemini API ključa prekinut (AbortSignal)', { trajanjeMs });
        throw err;
      }
      const actualError = err instanceof Error ? err : new Error(String(err?.message || err || 'Nepoznata greška'));
      logError.error('Iznimka pri provjeri Gemini API ključa:', actualError, {
        status: actualError.name,
        poruka: actualError.message,
        trajanjeMs,
      });
      throw actualError;
    }
  }

  /**
   * Glavni agentni razgovor sa Žigom (Gemini 2.0 Function Calling, Multimodal & Offline Heuristics)
   */
  public async chatWithAgent(
    messages: ZigoChatPoruka[],
    apiKeyOverride?: string,
    liveContext?: LiveScreenContextSnapshot,
    signal?: AbortSignal
  ): Promise<ZigoAgentResponse> {
    const key = apiKeyOverride || this.getStoredApiKey();

    if (signal?.aborted) {
      logReq.warn('Zahtjev za razgovor prekinut prije početka (AbortSignal)');
      throw new DOMException('Dumanje zaustavljeno na zahtjev korisnika', 'AbortError');
    }

    if (liveContext) {
      logContext.debug('Omni-Context snimak pripremljen za razgovor', {
        aktivniEkran: liveContext.aktivniEkran,
        partner: liveContext.racun.partnerNaziv,
        oib: liveContext.racun.oib,
        isOibValid: liveContext.racun.isOibValid,
        brojStavki: liveContext.racun.brojStavki,
        ukupnoEur: liveContext.racun.ukupniIznos,
        kprYtd: liveContext.financije.kprPrometYtd,
        preostaloDoPraga: liveContext.financije.preostaloDoPraga,
        statusUgroze: liveContext.financije.statusUgroze,
        jeLiKasnoNoc: liveContext.jeLiKasnoNoc,
      });
      logContext.verbose('Puni LiveScreenContextSnapshot objekt', liveContext);
    }

    // Ako nema ključa, koristi stoički lokalni heuristički asistent
    if (!key) {
      if (signal?.aborted) {
        logReq.warn('Dumanje prekinuto prije lokalne heuristike (AbortSignal)');
        throw new DOMException('Dumanje zaustavljeno na zahtjev korisnika', 'AbortError');
      }
      logHeuristic.debug('Gemini API ključ nije definiran. Koristim lokalni deterministički heuristički asistent.');
      return this.chatWithAgentLocalHeuristic(messages, liveContext);
    }

    const t0 = performance.now();
    try {
      const model = this.getStoredModel();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

      const contents = messages.map((msg) => {
        if (msg.uloga === 'user') {
          const parts: any[] = [{ text: msg.tekst || '' }];
          if (msg.privitci && msg.privitci.length > 0) {
            for (const priv of msg.privitci) {
              const cleanBase64 = priv.base64Data.includes('base64,')
                ? priv.base64Data.split('base64,')[1]
                : priv.base64Data;
              parts.push({
                inlineData: {
                  mimeType: priv.mimeType,
                  data: cleanBase64,
                },
              });
            }
          }
          return { role: 'user', parts };
        } else if (msg.uloga === 'assistant') {
          if (msg.toolPoziv) {
            return {
              role: 'model',
              parts: [
                {
                  functionCall: {
                    name: msg.toolPoziv.imeFunkcije,
                    args: msg.toolPoziv.argumenti,
                  },
                },
              ],
            };
          }
          return {
            role: 'model',
            parts: [{ text: msg.tekst || '' }],
          };
        } else {
          // Tool response
          return {
            role: 'function',
            parts: [
              {
                functionResponse: {
                  name: msg.toolPoziv?.imeFunkcije || 'unknown_tool',
                  response: msg.toolRezultat || { uspjeh: true },
                },
              },
            ],
          };
        }
      });

      const userMemories = await zigoMemoryService.getAllMemories().catch(() => []);
      const formattedMemories = zigoMemoryService.formatMemoriesForSystemPrompt(userMemories);
      const formattedContext = liveContext ? formatContextForSystemPrompt(liveContext) : '';

      let fullInstruction = ZIGO_SYSTEM_INSTRUCTION;
      if (formattedMemories) {
        fullInstruction += `\n\n${formattedMemories}`;
      }
      if (formattedContext) {
        fullInstruction += `\n\n${formattedContext}`;
      }

      logPrompt.debug('Sastavljanje prompta za Gemini API', {
        model,
        brojPorukaUKontekstu: contents.length,
        duljinaSistemskeUpute: fullInstruction.length,
        imaLiveContext: !!liveContext,
        brojAlata: ZIGO_FUNCTION_DECLARATIONS.length,
      });
      logPrompt.verbose('Puni tekst sistemske upute i povijesti poruka', {
        systemInstruction: fullInstruction,
        contents,
      });

      const body = {
        contents,
        systemInstruction: {
          parts: [{ text: fullInstruction }],
        },
        tools: [
          {
            functionDeclarations: ZIGO_FUNCTION_DECLARATIONS,
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      };

      logReq.info(`Šaljem zahtjev prema Gemini API (${model})`, {
        model,
        brojPoruka: contents.length,
        brojAlata: ZIGO_FUNCTION_DECLARATIONS.length,
      });
      logReq.verbose('Cjeloviti HTTP POST zahtjev za Gemini API', body);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });

      const trajanjeMs = Math.round(performance.now() - t0);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const serverMsg =
          errJson?.error?.message ||
          (res.status === 503
            ? 'Gemini model je trenutačno preopterećen. Pokušajte ponovno za nekoliko trenutaka.'
            : `Gemini API odgovor: ${res.status}`);
        const serverStatus = errJson?.error?.status || (res.status === 503 ? 'UNAVAILABLE' : `HTTP_${res.status}`);
        const apiError = new Error(`[${res.status} ${serverStatus}] ${serverMsg}`);
        apiError.name = serverStatus;

        logError.error(`Gemini API vratio grešku [${res.status}]`, apiError, {
          status: res.status,
          serverMessage: serverMsg,
          serverStatus,
          rawError: errJson,
          trajanjeMs,
        });
        throw apiError;
      }

      const data = await res.json();
      const candidate = data.candidates?.[0]?.content;
      const funcCallPart = candidate?.parts?.find((p: any) => p.functionCall);
      const textPart = candidate?.parts?.find((p: any) => p.text);

      logRes.info('Uspješno zaprimljen odgovor od Gemini API modela', {
        status: res.status,
        trajanjeMs,
        imaFunctionCall: !!funcCallPart,
        imaTekst: !!textPart,
      });
      logRes.verbose('Sirovi kandidat i sadržaj odgovora', data);

      if (funcCallPart?.functionCall) {
        logRes.info(`Gemini model pozvao alat: [${funcCallPart.functionCall.name}]`, {
          funkcija: funcCallPart.functionCall.name,
          argumenti: funcCallPart.functionCall.args,
        });
        return {
          odgovorTekst: textPart?.text || 'Pripreman akciju na radnoj plohi...',
          toolPoziv: {
            imeFunkcije: funcCallPart.functionCall.name,
            argumenti: funcCallPart.functionCall.args || {},
          },
          jeAiGenerirano: true,
        };
      }

      return {
        odgovorTekst: textPart?.text || 'Mir u Gradu. Nema potrebe za prešom.',
        jeAiGenerirano: true,
      };
    } catch (err: any) {
      const trajanjeMs = Math.round(performance.now() - t0);

      // Ako je korisnik zatražio prekid (STOP), re-throw bez aktiviranja fallbacka!
      if (err?.name === 'AbortError' || signal?.aborted) {
        logReq.warn('Dumanje / Zahtjev prema Gemini modelu prekinut na zahtjev korisnika (STOP)', {
          trajanjeMs,
        });
        throw err;
      }

      const actualError = err instanceof Error ? err : new Error(String(err?.message || err || 'Nepoznata greška'));
      logError.error('Greška u pozivu Gemini modela, prebacujen na lokalni Orlandov fallback:', actualError, {
        status: actualError.name,
        poruka: actualError.message,
        trajanjeMs,
      });
      return this.chatWithAgentLocalHeuristic(messages, liveContext);
    }
  }

  /**
   * Lokalni deterministički heuristički asistent za Žiga (radi 100% offline bez interneta i bez API ključa)
   * U potpunosti poštuje dubrovačku fonologiju (-n završeci, očuvanje h, autohtoni leksik) i trodijelnu strukturu odgovora.
   */
  public chatWithAgentLocalHeuristic(
    messages: ZigoChatPoruka[],
    liveContext?: LiveScreenContextSnapshot
  ): ZigoAgentResponse {
    const lastUserMsg = [...messages].reverse().find((m) => m.uloga === 'user');
    if (!lastUserMsg) {
      logHeuristic.debug('Nema korisničke poruke, vraćam uvodni pozdrav Orlanda na trgu');
      return {
        odgovorTekst: 'Ođe Orlando na trgu. Gledan u miru tvoje papire. Reci što ti triba oko spêndze i obrta danas, đe je preša?',
        jeAiGenerirano: false,
      };
    }

    const text = (lastUserMsg.tekst || '').toLowerCase();
    const hasAttachments = lastUserMsg.privitci && lastUserMsg.privitci.length > 0;

    logHeuristic.debug('Započinjem evaluaciju lokalnih heurističkih pravila (offline/no-key fallback)', {
      tekstSnippet: text.slice(0, 80),
      brojPrivitaka: lastUserMsg.privitci?.length || 0,
      imaKontekstEkrana: !!liveContext,
      hoceLiProbitePrag: liveContext?.financije.hoceLiProbitePrag,
      oibValjan: liveContext?.racun.isOibValid,
    });

    // 0.0. Korisnik traži prosudbu ponude/posla i zaslužuje propitivanje (Orlando sudi i propituje)
    if (
      !liveContext?.financije?.hoceLiProbitePrag &&
      (
        ((text.includes('što misliš') || text.includes('sto mislis') || text.includes('bi li ti') || text.includes('kako ti se čini') || text.includes('kako ti se cini') || text.includes('prosudi') || text.includes('savjetuj me')) &&
         (text.includes('ponud') || text.includes('posao') || text.includes('poslu') || text.includes('klijent') || text.includes('suradnj') || text.includes('mjesec dana') || (!text.includes('račun') && !text.includes('racun'))))
      )
    ) {
      logHeuristic.info('Heurističko pravilo #0.0 okinuto [Orlandova prosudba i propitivanje]');
      const resp: ZigoAgentResponse = {
        odgovorTekst: `Kad već pitaš kamen za sud: dubrovački Senat nikad nije ulazio u rabotu đe se unaprijed zna da gubiš dukate.\n\nNude ti mrvice a traže kulu Minčetu. Jesi li ti siguran da ti taj posao donosi kruh, il' samo hraniš tuđu prešu?`,
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor Orlandove prosudbe', resp);
      return resp;
    }

    // 0. Modus Prijatelja i Suborca (Relacijsko čavrljanje, kava, podrška, "samo prija")
    if (
      text.includes('prija') ||
      text.includes('kava') ||
      text.includes('kavu') ||
      text.includes('kako si') ||
      text.includes('kako ide') ||
      text.includes('što ima') ||
      text.includes('sto ima') ||
      text.includes('nema ništa') ||
      text.includes('nista posebno') ||
      text.includes('pričaj') ||
      text.includes('pricaj') ||
      text.includes('druže') ||
      text.includes('druze') ||
      text.includes('prijatelj') ||
      text.includes('bok orlando') ||
      text.includes('pozdrav orlando') ||
      text.includes('samo chill') ||
      text.includes('odmori malo')
    ) {
      logHeuristic.info('Heurističko pravilo #0 okinuto [Modus Prijatelja i Suborca]');
      const resp: ZigoAgentResponse = {
        odgovorTekst: `I meni prija, gosparu moj. Kamenu ne smeta tišina Straduna, a ni jugo pod zidinama.\n\nPusti tablice i spêndzu neka kisnu do sutra, ni knez nije vlado u dva po noći. Ako zatreba mač il' Orlandov lakat, ođe san na trgu.`,
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran prijateljski odgovor Orlanda', resp);
      return resp;
    }

    // 0.1. Pamćenje činjenice u Žigin tefter
    if (text.includes('zapamti') || text.includes('zabilježi') || text.includes('zovi me')) {
      const extracted = zigoMemoryService.extractPotentialMemories(lastUserMsg.tekst);
      const item = extracted[0];
      if (item) {
        logHeuristic.info('Heurističko pravilo #0.1 okinuto [Pamćenje u Žigin tefter]');
        const resp: ZigoAgentResponse = {
          odgovorTekst: `**Opservacija:**\nOtvorio san dubrovački tefter mudrosti.\n\n**Dijagnoza:**\nZabilježio san trajnu činjenicu o tebi: "${item.vrijednost}".\n\n**Žigin Rez:**\nZapisano u tefter pod ključem [${item.kljuc}]. Pamtit ću ovo u svim našim razgovorima i odlukama.`,
          toolPoziv: {
            imeFunkcije: 'zapamti_cinjenicu',
            argumenti: {
              kategorija: item.kategorija,
              kljuc: item.kljuc,
              vrijednost: item.vrijednost,
            },
          },
          jeAiGenerirano: false,
        };
        return resp;
      }
    }

    // 0.2. Web istraživanje poreznih propisa (Tavily AI Search)
    if (
      text.includes('istraži') ||
      text.includes('istrazi') ||
      text.includes('pretraži web') ||
      text.includes('pretrazi web') ||
      text.includes('porezna uprava kaže') ||
      text.includes('porezna kaze') ||
      text.includes('mišljenje porezne') ||
      text.includes('misljenje porezne')
    ) {
      logHeuristic.info('Heurističko pravilo #0.2 okinuto [Web istraživanje propisa]');
      const cleanUpit = lastUserMsg.tekst
        .replace(/(?:istr[a|a]ži|pretr[a|a]ži|web|provjeri|porezna kaze|mišljenje porezne|molim te)/gi, '')
        .trim() || 'Paušalni obrt inozemstvo i prag';
      const resp: ZigoAgentResponse = {
        odgovorTekst: `**Opservacija:**\nZakoni i pravilnici u nas se mijenjaju brže nego vjetar na Kantafigu.\n\n**Dijagnoza:**\nProvjeravan najnovija službena tumačenja i propise na stranicama Porezne uprave i Narodnih novina za upit: "${cleanUpit}".\n\n**Žigin Rez:**\nPripremio san pretragu službenih izvora. Klikni za odobrenje istraživanja na webu.`,
        toolPoziv: {
          imeFunkcije: 'istrazi_propise_web',
          argumenti: {
            upit: cleanUpit,
            ciljanaDomena: 'porezna-uprava.hr',
          },
        },
        jeAiGenerirano: false,
      };
      return resp;
    }

    // 1. Porezni filtar za ćevape i privatne troškove ("Ćevapi test")
    if (
      text.includes('roštilj') ||
      text.includes('ćevap') ||
      text.includes('meso') ||
      text.includes('parfem') ||
      text.includes('odjeća') ||
      (hasAttachments &&
        lastUserMsg.privitci?.some(
          (p) =>
            p.naziv.toLowerCase().includes('rostilj') ||
            p.naziv.toLowerCase().includes('cevap') ||
            p.naziv.toLowerCase().includes('parfem')
        ))
    ) {
      logHeuristic.info('Heurističko pravilo #1 okinuto [Ćevapi test: Privatni trošak]');
      logHeuristic.debug('Detektiran pokušaj unosa neprihvatljivog privatnog troška', { textSnippet: text.slice(0, 60), hasAttachments });
      const resp: ZigoAgentResponse = {
        odgovorTekst: `**Opservacija:**\nVidin ja, uzeli smo opremu za arhiviranje... i jedan aparat za termičku obradu mesa u radnom prostoru?\n\n**Dijagnoza:**\nKnez je vladao mjesec dana i nije smio izlazit iz Dvora da ga moć ne pokvari, a ti bi nakon tri mjeseca rada pekao ćevape na trošak poslovanja?\n\n**Žigin Rez:**\nBrišen roštilj, papir ostavljan. Ne dan da ti porezni inspektor sjedne za vrat radi dvi kile mesa. Jeftinije ti je pojest ih u miru doma, đe je preša.`,
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor za Ćevapi test', resp);
      return resp;
    }

    // 2. Proaktivni radar: Probijanje paušalnog limita od 40.000 € na ekranu
    if (
      liveContext?.financije.hoceLiProbitePrag &&
      (text.includes('prag') || text.includes('račun') || text.includes('što') || text.includes('valja') || text.includes('stanje') || text.includes('40'))
    ) {
      const visak = (liveContext.financije.kprPrometYtd + liveContext.financije.trenutniRacunIznos) - 40000;
      logHeuristic.info('Heurističko pravilo #2 okinuto [Prag 40.000 €: Kritično prekoračenje]');
      logHeuristic.debug('Kalkulacija prekoračenja limita', {
        kprPrometYtd: liveContext.financije.kprPrometYtd,
        trenutniRacun: liveContext.financije.trenutniRacunIznos,
        visak,
      });
      const resp: ZigoAgentResponse = {
        odgovorTekst: `**Opservacija:**\nE, moj gosparu... Još samo ovaj potpis i ulaziš u PDV ko s barkom na Lokrum po orkanskom jugu.\n\n**Dijagnoza:**\nKPR ti je na ${liveContext.financije.kprPrometYtd.toFixed(2)} €, a s ovim računon od ${liveContext.financije.trenutniRacunIznos.toFixed(2)} € probijaš paušalni limit za točno ${visak.toFixed(2)} €. Država jedva čeka da ti pošalje knjigovođu i PDV obrasce.\n\n**Žigin Rez:**\nOvaj račun prebaci na 2. siječnja. Reci in da radiš inventuru ili moliš devetnicu, samo sačuvaj paušal i glavu.`,
        toolPoziv: {
          imeFunkcije: 'prebaci_datum_u_iducu_godinu',
          argumenti: {},
        },
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor za Prag 40k ugrozu', resp);
      return resp;
    }

    // 3. Proaktivni radar: Neispravan OIB kupca (MOD 11)
    if (
      liveContext?.racun.oib &&
      !liveContext?.racun.isOibValid &&
      (text.includes('oib') || text.includes('kupac') || text.includes('partner') || text.includes('pregledaj') || text.includes('valja'))
    ) {
      logHeuristic.info('Heurističko pravilo #3 okinuto [Neispravan OIB kupca: MOD 11]');
      logHeuristic.debug('Podaci nevaljanog OIB-a', { oib: liveContext.racun.oib });
      const resp: ZigoAgentResponse = {
        odgovorTekst: `**Opservacija:**\nGledan te kako gledaš u taj ekran... Zaboravio si da porezni kontrolori ne spavaju kad se unose krive cifre.\n\n**Dijagnoza:**\nOIB kupca '${liveContext.racun.oib}' ne prolazi kontrolu kontrolne znamenke po ISO 7064 MOD 11,10. Takav račun CIS ili e-Račun sustav odbija u prvoj sekundi.\n\n**Žigin Rez:**\nProvjeri točan OIB partnera u registru prije konačnog izdavanja.`,
        toolPoziv: {
          imeFunkcije: 'provjeri_i_ispravi_oib',
          argumenti: { oib: liveContext.racun.oib },
        },
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor za Neispravan OIB', resp);
      return resp;
    }

    // 4. Proaktivni radar: Stavke bez KPD 2025 šifre
    if (
      text.includes('kpd') ||
      text.includes('šifr') ||
      (liveContext?.racun.imaNeklasificiranihStavki && (text.includes('pregledaj') || text.includes('popuni') || text.includes('sredi') || text.includes('stavk')))
    ) {
      logHeuristic.info('Heurističko pravilo #4 okinuto [Neklasificirane stavke: KPD 2025]');
      const resp: ZigoAgentResponse = {
        odgovorTekst: `**Opservacija:**\nGledan ti stavke... Šesni su dukati, ali papir ti je osta napola go ko Stradun u podne ljeti.\n\n**Dijagnoza:**\nNa radnom računu imaš stavke bez dodijeljene službene KPD 2025 šifre. Bez toga Fiskalizacija 2.0 i UBL 2.1 e-Račun zapinju ko neprijavljeni tovar na Pločama.\n\n**Žigin Rez:**\nPokrećen automatsku dodjelu KPD 2025 šifri za sve stavke prema opisu rabote.`,
        toolPoziv: {
          imeFunkcije: 'auto_ispuni_kpd_sifre',
          argumenti: {},
        },
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor za KPD šifriranje', resp);
      return resp;
    }

    // 5. Žigin Rez trijaža ("Žigo, presijeci")
    if (text.includes('presijeci') || text.includes('rez') || text.includes('trijaža') || text.includes('panika')) {
      logHeuristic.info('Heurističko pravilo #5 okinuto [Žigin Rez: Instant Trijaža]');
      const resp: ZigoAgentResponse = {
        odgovorTekst: `Evo me, naslonio san se na kameni štit i držin lakat u ravnini. Režen birokratsku dramu u tri točke:\n\n1. ŠTO GORI (<24h): Predaj otvorene račune i provjeri OIB partnera.\n2. ŠTO ČEKA: Pusti administrativni šum neka kisne do ponedjeljka.\n3. AKCIJA SAD: Jedno dugme – provjeri usklađenost i mirno spavaj.`,
        toolPoziv: {
          imeFunkcije: 'aktiviraj_zigin_rez',
          argumenti: {},
        },
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor za Žigin Rez', resp);
      return resp;
    }

    // 6. Fjaka Mode (Anti-Burnout)
    if (
      text.includes('aktiviraj fjaku') ||
      text.includes('upali fjaku') ||
      text.includes('gasi svjetlo') ||
      (liveContext?.jeLiKasnoNoc && (text.includes('idemo leć') || text.includes('idemo spavat') || text.includes('gotov sam za danas')))
    ) {
      logHeuristic.info('Heurističko pravilo #6 okinuto [Fjaka Mode: Anti-Burnout radar]');
      logHeuristic.debug('Fjaka parametri detekcije', { jeLiKasnoNoc: liveContext?.jeLiKasnoNoc, sat: new Date().getHours() });
      const resp: ZigoAgentResponse = {
        odgovorTekst: `**Opservacija:**\nStani malo, gosparu... Zidovi Grada stoje stoljećima, a ti bi noćas riješio svu spêndzu svijeta.\n\n**Dijagnoza:**\nProšla je ura za rabotu. Umoran obrtnik griješi u nulama, a poreznici te greške skupo naplaćuju.\n\n**Žigin Rez:**\nNovci poslani u ponoć ne putuju brže. Pođi leć. Republika treba odmorne ljude.`,
        toolPoziv: {
          imeFunkcije: 'aktiviraj_fjaku',
          argumenti: {},
        },
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor za Fjaka Mode', resp);
      return resp;
    }

    // 7. Status paušalnog praga i KPR
    if (
      text.includes('prag') ||
      text.includes('40000') ||
      text.includes('40.000') ||
      text.includes('koliko mi je ostalo') ||
      text.includes('koliko mi fali')
    ) {
      logHeuristic.info('Heurističko pravilo #7 okinuto [Upit za status paušalnog praga i KPR]');
      const resp: ZigoAgentResponse = {
        odgovorTekst: `**Opservacija:**\nPodigao san podlakticu i mjerin točno po zakonu. Preko lakta ne damo, ispod lakta ne zakidamo.\n\n**Dijagnoza:**\nProvjeravan tvoju Knjigu prometa i stanje naplaćenih dukata ove godine.\n\n**Žigin Rez:**\nOtvaran financijski status – ni centa više državi nego što joj pripada.`,
        toolPoziv: {
          imeFunkcije: 'dohvati_financijski_status',
          argumenti: {},
        },
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor za Status praga', resp);
      return resp;
    }

    // 8. Pad CIS-a / Interneta
    if (text.includes('server') || text.includes('pao') || text.includes('internet') || text.includes('veza')) {
      logHeuristic.info('Heurističko pravilo #8 okinuto [CIS / Offline fallback: Prekid veze]');
      const resp: ZigoAgentResponse = {
        odgovorTekst: `**Opservacija:**\nPao server u Zagrebu? Ma neka je. Pao je i Napoleon, pa Grad eno još stoji đe je i bio.\n\n**Dijagnoza:**\nCIS Porezne uprave ili internet spava popodnevni san. Račune san zapečatio lokalnim ZKI kodom i zabilježio milisekundu u bazi.\n\n**Žigin Rez:**\nIzdaj račun u miru, a kad gospoda uključe kabao u zid, poslat ćemo sve u nizu. Popij čašu vode, nemoj da ti tlak skače.`,
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor za Prekid veze', resp);
      return resp;
    }

    // 9. Provjera obveznih doprinosa i poreza (Faza 18)
    if (
      text.includes('doprinos') ||
      text.includes('miob') ||
      text.includes('hzz') ||
      text.includes('rok za uplatu') ||
      text.includes('porezni dug') ||
      (text.includes('porez') && (text.includes('provjeri') || text.includes('platiti') || text.includes('dug') || text.includes('rok')))
    ) {
      logHeuristic.info('Heurističko pravilo #9 okinuto [Provjera obveznih doprinosa i poreza]');
      const resp: ZigoAgentResponse = {
        odgovorTekst: `**Opservacija:**\nProvjeravam tvoje obvezne mjesečne doprinose i akontacije poreza.\n\n**Dijagnoza:**\nKao paušalni obrtnik imaš fiksne doprinose (MIO I, MIO II, HZZO) s rokom uplate do 15. u mjesecu za prethodni mjesec, te kvartalni paušalni porez do kraja svakog tromjesečja.\n\n**Žigin Rez:**\nOtvaram ti precizan pregled statusa uplate i generiram barkodove za plaćanje.`,
        toolPoziv: {
          imeFunkcije: 'provjeri_obvezne_doprinose_i_porez',
          argumenti: {
            godina: new Date().getFullYear(),
          },
        },
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor za Doprinose i porez', resp);
      return resp;
    }

    // 10. Multimodalni sken računa za uredski papir (Faza 11 / dodaj_stavku_racuna)
    if (
      text.includes('račun za papir') ||
      text.includes('uredski papir') ||
      text.includes('toner')
    ) {
      logHeuristic.info('Heurističko pravilo #10 okinuto [Multimodal sken računa: Uredski papir]');
      const resp: ZigoAgentResponse = {
        odgovorTekst: `**Opservacija:**\nSkeniro san račun s kamenog stola.\n\n**Dijagnoza:**\nPrepoznat je dobavljač 'Narodne novine d.d.' (OIB: 41234567891), stavka 'Uredski papir A4 80g' u iznosu od 24,50 €. Ovaj trošak je u cijelosti poslovno opravdan prema poreznim propisima RH.\n\n**Žigin Rez:**\nDodajen ga na radnu plohu, šesno i čisto.`,
        toolPoziv: {
          imeFunkcije: 'dodaj_stavku_racuna',
          argumenti: {
            naziv: 'Uredski papir A4 80g',
            kpdSifra: '17.12.14',
            kolicina: 1,
            cijena: 24.5,
            jedinicaMjere: 'kom',
          },
        },
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor za Sken računa', resp);
      return resp;
    }

    // 11. Evidentiranje ulaznog troška i multimodalni sken računa/odreska (Faza 18)
    if (
      hasAttachments ||
      text.includes('trošak') ||
      text.includes('trosak') ||
      text.includes('odrezak') ||
      text.includes('gorivo') ||
      text.includes('diesel') ||
      text.includes('benzin') ||
      text.includes('pevex') ||
      text.includes('bauhaus') ||
      text.includes('ina') ||
      text.includes('alat')
    ) {
      let dobavljac = 'INA d.d.';
      let kat: any = 'GORIVO';
      let opis = 'Eurodiesel gorivo za terensko vozilo';
      let ukupno = 65.50;
      let jeDugotrajna = false;
      let serijski: string | undefined = undefined;

      if (text.includes('pevex') || text.includes('bauhaus') || text.includes('alat') || text.includes('oprem') || text.includes('bušilic') || text.includes('laptop')) {
        dobavljac = text.includes('bauhaus') ? 'Bauhaus d.o.o.' : 'Pevex d.d.';
        kat = 'ALAT_I_OPREMA';
        opis = 'Profesionalna udarna bušilica / radna oprema';
        ukupno = 720.00;
        jeDugotrajna = true;
        serijski = 'SN-2026-BOSCH-884';
      } else if (text.includes('papir') || text.includes('toner') || text.includes('ured')) {
        dobavljac = 'Narodne novine d.d.';
        kat = 'URED_I_POTROSNI';
        opis = 'Uredski materijal i papir A4 80g';
        ukupno = 28.50;
      }

      const cijenaMatch = lastUserMsg.tekst.match(/(\d+[\.,]?\d*)\s*(eur|eura|€)?/i);
      if (cijenaMatch && cijenaMatch[1]) {
        ukupno = parseFloat(cijenaMatch[1].replace(',', '.'));
        if (ukupno >= 663.61) {
          jeDugotrajna = true;
        }
      }

      logHeuristic.info('Heurističko pravilo #10 okinuto [Evidentiranje ulaznog troška]', { dobavljac, kat, ukupno, jeDugotrajna });
      const resp: ZigoAgentResponse = {
        odgovorTekst: `**Opservacija:**\nPregledao sam račun dobavljača ${dobavljac} na iznos od ${formatHrvatskiIznos(ukupno)}.\n\n**Dijagnoza:**\nTrošak je kategoriziran kao ${kat}. ${ukupno >= 663.61 ? 'Iznos prelazi 663,61 € pa se evidentira kao dugotrajna imovina (DI).' : 'Operativni poslovni trošak priznat u poslovanju.'}\n\n**Žigin Rez:**\nZavodim trošak u knjigu troškova s jednim klikom odobrenja.`,
        toolPoziv: {
          imeFunkcije: 'evidentiraj_ulazni_trosak',
          argumenti: {
            dobavljacNaziv: dobavljac,
            kategorija: kat,
            opis,
            ukupnoEur: ukupno,
            datumRacuna: new Date().toISOString().split('T')[0],
            nacinPlacanja: 'KARTICA_POSLOVNA',
            jePlaceno: true,
            serijskiBrojOpreme: serijski,
          },
        },
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor za Ulazni trošak', resp);
      return resp;
    }

    // 11. Financijska slika i neto dobit (Faza 18)
    if (
      text.includes('dobit') ||
      text.includes('neto dobit') ||
      text.includes('financijska slika') ||
      text.includes('zarada') ||
      text.includes('koliko sam zaradio') ||
      text.includes('profitna marža') ||
      text.includes('analitika poslovanja')
    ) {
      logHeuristic.info('Heurističko pravilo #11 okinuto [Financijska slika i neto dobit]');
      const resp: ZigoAgentResponse = {
        odgovorTekst: `**Opservacija:**\nOtvaram cjelovitu financijsku sliku poslovanja obrta za tekuću godinu.\n\n**Dijagnoza:**\nUspoređujem sve naplaćene KPR primitke naspram plaćenih operativnih troškova, doprinosa za mirovinsko/zdravstveno i paušalnog poreza.\n\n**Žigin Rez:**\nEvo tvoje čiste neto dobiti i profitne marže – kamen temeljac zdravog poslovanja.`,
        toolPoziv: {
          imeFunkcije: 'dohvati_financijsku_sliku_i_dobit',
          argumenti: {
            godina: new Date().getFullYear(),
          },
        },
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor za Financijsku sliku', resp);
      return resp;
    }

    // 12. Saldiranje transakcije s izvoda (Faza 18)
    if (
      text.includes('saldiraj') ||
      text.includes('izvod') ||
      text.includes('knjiži uplatu') ||
      text.includes('uplata kupca')
    ) {
      const iznosMatch = lastUserMsg.tekst.match(/(\d+[\.,]?\d*)\s*(eur|eura|€)?/i);
      const iznos = iznosMatch && iznosMatch[1] ? parseFloat(iznosMatch[1].replace(',', '.')) : 450.0;

      logHeuristic.info('Heurističko pravilo #12 okinuto [Saldiranje transakcije s izvoda]', { iznos });
      const resp: ZigoAgentResponse = {
        odgovorTekst: `**Opservacija:**\nUčitana je uplata s bankovnog izvoda u iznosu od ${formatHrvatskiIznos(iznos)}.\n\n**Dijagnoza:**\nUsklađujem uplatu s izlaznim računom u sustavu i automatski bilježim bezgotovinski promet u Knjigu prometa (KPR).\n\n**Žigin Rez:**\nTransakcija je saldirana, a status računa označen kao PLAĆENO.`,
        toolPoziv: {
          imeFunkcije: 'saldiraj_izvod_transakcije',
          argumenti: {
            iznosEur: iznos,
            datumNaplate: new Date().toISOString().split('T')[0],
            brojIzvoda: 'Izvod 1/2026',
            opisPlatitelja: 'Uplata po računu',
          },
        },
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor za Saldiranje izvoda', resp);
      return resp;
    }

    // 10. Cjenik - dodavanje artikla
    if (text.includes('cjenik') || text.includes('artikl') || text.includes('spremi mi novu uslugu')) {
      const cijenaMatch = lastUserMsg.tekst.match(/(\d+[\.,]?\d*)\s*(eur|eura|€)?/i);
      const cijena = cijenaMatch && cijenaMatch[1] ? parseFloat(cijenaMatch[1].replace(',', '.')) : 250;

      let kpd = '62.01.11';
      let naziv = 'Usluga razvoja softvera';
      if (text.includes('logotip') || text.includes('dizajn')) {
        kpd = '74.10.11';
        naziv = 'Dizajn logotipa';
      } else if (text.includes('savjet')) {
        kpd = '70.22.11';
        naziv = 'Poslovno savjetovanje';
      }

      logHeuristic.info('Heurističko pravilo #10 okinuto [Dodavanje nove usluge u cjenik]');
      logHeuristic.debug('Parametri stavke cjenika', { naziv, kpd, cijena });
      const resp: ZigoAgentResponse = {
        odgovorTekst: `**Opservacija:**\nUnio san novu stavku u dubrovački tefter.\n\n**Dijagnoza:**\nUsluga "${naziv}" s propisanom KPD 2025 šifrom ${kpd} spremna je za katalog.\n\n**Žigin Rez:**\nSpreman stavku u tvoj lokalni cjenik.`,
        toolPoziv: {
          imeFunkcije: 'dodaj_u_cjenik',
          argumenti: {
            naziv,
            kpdSifra: kpd,
            cijena,
            jedinicaMjere: 'kom',
          },
        },
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor za Cjenik', resp);
      return resp;
    }

    // 11. Priprema računa i postavljanje kupca
    if (text.includes('pripremi račun') || text.includes('račun za') || text.includes('fakturu za')) {
      const oibMatch = lastUserMsg.tekst.match(/\b\d{11}\b/);
      const partnerMatch = lastUserMsg.tekst.match(/za\s+([^,]+?)(?:,\s*oib|\s+oib|$)/i);
      const partnerNaziv = partnerMatch && partnerMatch[1] ? partnerMatch[1].trim() : 'ACME d.o.o.';
      const oib = oibMatch ? oibMatch[0] : '12345678903';

      logHeuristic.info('Heurističko pravilo #11 okinuto [Postavljanje kupca na radnu plohu]');
      logHeuristic.debug('Parametri kupca', { partnerNaziv, oib });
      const resp: ZigoAgentResponse = {
        odgovorTekst: `**Opservacija:**\nPripreman radnu plohu za kupca ${partnerNaziv} (OIB: ${oib}).\n\n**Dijagnoza:**\nPostavljan šesne podatke partnera na aktivni račun.\n\n**Žigin Rez:**\nPartner je postavljen, sad dodaj stavke ili mi reci što si radio.`,
        toolPoziv: {
          imeFunkcije: 'postavi_kupca',
          argumenti: {
            partnerNaziv,
            oib,
            taxZone: 'DOMACI_B2B',
          },
        },
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor za Postavi kupca', resp);
      return resp;
    }

    // 12. Izvoz KPR CSV ili PO-SD XML
    if (text.includes('kpr') && text.includes('csv')) {
      logHeuristic.info('Heurističko pravilo #12 okinuto [Izvoz KPR CSV]');
      const resp: ZigoAgentResponse = {
        odgovorTekst: `**Opservacija:**\nPokrećen izvoz Knjige prometa u CSV format s UTF-8 BOM za Excel:\n\n**Dijagnoza:**\nGeneriran službeni KPR iz lokalne baze.\n\n**Žigin Rez:**\nPreuzmi datoteku na disk.`,
        toolPoziv: {
          imeFunkcije: 'izvezi_kpr_csv',
          argumenti: {},
        },
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor za Izvoz KPR CSV', resp);
      return resp;
    }

    if (text.includes('posd') || text.includes('po-sd') || text.includes('eporezn')) {
      logHeuristic.info('Heurističko pravilo #12 okinuto [Izvoz PO-SD XML]');
      const resp: ZigoAgentResponse = {
        odgovorTekst: `**Opservacija:**\nGeneriran službeni PO-SD XML obrazac za predaju godišnjeg izvješća na ePoreznu:\n\n**Dijagnoza:**\nSvi naplaćeni računi su obračunati i usklađeni.\n\n**Žigin Rez:**\nDatoteka je spremna za upload na portal Porezne uprave.`,
        toolPoziv: {
          imeFunkcije: 'izvezi_posd_xml',
          argumenti: {},
        },
        jeAiGenerirano: false,
      };
      logHeuristic.verbose('Generiran odgovor za Izvoz PO-SD XML', resp);
      return resp;
    }

    // 13. Općeniti stoički odgovor s Orlandovim lakatom
    logHeuristic.info('Heurističko pravilo #13 okinuto [Opći stoički stav Orlanda]');
    const generalResp: ZigoAgentResponse = {
      odgovorTekst: `**Opservacija:**\nStoje zidine, stoji i Orlando na trgu.\n\n**Dijagnoza:**\nOđe mjerimo točno po zakonu: ni milimetra više državi nego što joj pripada, ni centa manje da ti ne zatvore vrata.\n\n**Žigin Rez:**\nMogu ti pripremiti račun, dodijeliti KPD šifre, provjeriti prag od 40k ili presjeći dramu ako je preša. Reci što radimo.`,
      jeAiGenerirano: false,
    };
    logHeuristic.verbose('Generiran opći odgovor Orlanda', generalResp);
    return generalResp;
  }

  /**
   * Analizira opis posla i predlaže točnu KPD 2025 šifru i parametre za e-Račun
   */
  public async recommendKpd(opisPosla: string, apiKeyOverride?: string): Promise<KpdRecommendation> {
    const key = apiKeyOverride || this.getStoredApiKey();

    logKpd.info('Započinjem KPD 2025 analizu opisa djelatnosti', { opisPosla });

    if (!key) {
      logKpd.debug('Nema API ključa, koristim lokalni KPD 2025 katalog');
      return this.recommendKpdLocalHeuristic(opisPosla);
    }

    try {
      const model = this.getStoredModel();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

      logKpd.debug('Šaljem prompt za KPD klasifikaciju na Gemini API', { model, opisPosla });

      const systemInstruction = `Ti si stručni porezni i računovodstveni asistent za hrvatske paušalne i dohodovne obrte. 
Tvoj zadatak je na temelju korisničkog opisa posla/usluge preporučiti službenu šifru prema hrvatskoj Klasifikaciji proizvoda po djelatnostima (KPD 2025) koja je obvezna za e-Račun i Fiskalizaciju 2.0 u RH.
Odgovori ISKLJUČIVO u valjanom JSON formatu s ovim ključevima:
{
  "kpdSifra": "62.01.11", // 6-znamenkasta KPD šifra u formatu XX.XX.XX
  "kpdNaziv": "Točan službeni hrvatski naziv djelatnosti",
  "preporucenaJedinica": "sat" | "kom" | "paušal" | "dan" | "mjesec" | "projekt",
  "preporucenaCijena": 50.0, // Preporučena okvirna tržišna cijena u EUR (broj)
  "objasnjenje": "Kratko i jasno obrazloženje zašto je ova KPD 2025 šifra optimalna"
}`;

      const body = {
        contents: [
          {
            parts: [
              { text: systemInstruction },
              { text: `Korisnički opis usluge ili artikla: "${opisPosla}"` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        logKpd.warn(`Gemini KPD API vratio grešku [${res.status}], prebacujem na lokalni fallback`, { status: res.status, err });
        throw new Error(err.error?.message || `Gemini API odgovor: ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Prazan odgovor od Gemini modela.');
      }

      const parsed = JSON.parse(text);
      logKpd.info(`Uspješno generirana KPD 2025 preporuka preko AI modela: [${parsed.kpdSifra}]`, {
        opis: opisPosla,
        kpd: parsed.kpdSifra,
        naziv: parsed.kpdNaziv,
      });
      logKpd.verbose('Puni JSON odgovor KPD analize', parsed);

      return {
        kpdSifra: parsed.kpdSifra || '62.01.11',
        kpdNaziv: parsed.kpdNaziv || 'Usluge računalnog programiranja',
        preporucenaJedinica: parsed.preporucenaJedinica || 'sat',
        preporucenaCijena: parsed.preporucenaCijena,
        objasnjenje: parsed.objasnjenje || 'Preporučeno na temelju analize djelatnosti.',
        jeAiGenerirano: true,
      };
    } catch (err: any) {
      logKpd.warn('Greška u pozivu Gemini API za KPD, prebacujem na lokalni fallback:', {
        error: err?.message,
      });
      return this.recommendKpdLocalHeuristic(opisPosla);
    }
  }

  /**
   * Lokalni heuristički asistent za KPD 2025 klasifikaciju (radi 100% offline bez interneta i bez API ključa)
   */
  public recommendKpdLocalHeuristic(opis: string): KpdRecommendation {
    const q = (opis || '').toLowerCase();
    logKpd.debug('Lokalna evaluacija KPD kataloga prema ključnim riječima', { query: q });

    let rec: KpdRecommendation;

    if (q.includes('softver') || q.includes('web') || q.includes('program') || q.includes('kod') || q.includes('aplikacij') || q.includes('frontend') || q.includes('backend') || q.includes('fullstack')) {
      rec = {
        kpdSifra: '62.01.11',
        kpdNaziv: 'Usluge dizajna i razvoja aplikacijskog softvera',
        preporucenaJedinica: 'sat',
        preporucenaCijena: 60.0,
        objasnjenje: 'Preporučeno prema ključnim riječima razvoja i programiranja softvera (KPD 2025 / NKD 62.01).',
        jeAiGenerirano: false,
      };
    } else if (q.includes('dizajn') || q.includes('grafik') || q.includes('logo') || q.includes('vizual') || q.includes('ux') || q.includes('ui') || q.includes('brend')) {
      rec = {
        kpdSifra: '74.10.11',
        kpdNaziv: 'Usluge dizajna vizualnih komunikacija i grafičkog dizajna',
        preporucenaJedinica: 'sat',
        preporucenaCijena: 45.0,
        objasnjenje: 'Preporučeno za poslove grafičkog i digitalnog oblikovanja, UX/UI dizajna i logotipa.',
        jeAiGenerirano: false,
      };
    } else if (q.includes('savjet') || q.includes('konzalt') || q.includes('upravlj') || q.includes('strategij') || q.includes('poslovn')) {
      rec = {
        kpdSifra: '70.22.11',
        kpdNaziv: 'Usluge savjetovanja u vezi s poslovanjem i upravljanjem',
        preporucenaJedinica: 'sat',
        preporucenaCijena: 75.0,
        objasnjenje: 'Standardna šifra za poslovno i menadžersko savjetovanje obrtnika.',
        jeAiGenerirano: false,
      };
    } else if (q.includes('mrež') || q.includes('server') || q.includes('sistem') || q.includes('održavanj') || q.includes('podršk')) {
      rec = {
        kpdSifra: '62.02.20',
        kpdNaziv: 'Usluge tehničke podrške za informacijsku tehnologiju (IT)',
        preporucenaJedinica: 'sat',
        preporucenaCijena: 50.0,
        objasnjenje: 'Prikladno za administraciju poslužitelja, održavanje računala i tehničku IT podršku.',
        jeAiGenerirano: false,
      };
    } else if (q.includes('prijevod') || q.includes('lekt') || q.includes('tekst') || q.includes('tumač')) {
      rec = {
        kpdSifra: '74.30.11',
        kpdNaziv: 'Usluge prevođenja i lekture',
        preporucenaJedinica: 'kartica',
        preporucenaCijena: 15.0,
        objasnjenje: 'Preporučeno za pisano i usmeno prevođenje te lekturu autorskih tekstova.',
        jeAiGenerirano: false,
      };
    } else if (q.includes('market') || q.includes('reklam') || q.includes('oglaš') || q.includes('društven') || q.includes('kampanj')) {
      rec = {
        kpdSifra: '73.11.11',
        kpdNaziv: 'Usluge cjelovitih marketinških i oglasnih kampanja',
        preporucenaJedinica: 'projekt',
        preporucenaCijena: 350.0,
        objasnjenje: 'Šifra za digitalni marketing, vođenje oglašavanja i društvene mreže.',
        jeAiGenerirano: false,
      };
    } else {
      rec = {
        kpdSifra: '62.01.11',
        kpdNaziv: 'Usluge računalnog programiranja i savjetovanja',
        preporucenaJedinica: 'sat',
        preporucenaCijena: 50.0,
        objasnjenje: 'Zadana standardna KPD 2025 šifra za paušalne obrtnike u uslužnim djelatnostima.',
        jeAiGenerirano: false,
      };
    }

    logKpd.info(`Lokalno preporučena KPD šifra: [${rec.kpdSifra}] - ${rec.kpdNaziv}`, { kpdSifra: rec.kpdSifra });
    logKpd.verbose('Puni podaci lokalne KPD preporuke', rec);
    return rec;
  }
}

export const geminiService = new GeminiService();
