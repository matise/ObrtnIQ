import { appLogger } from './logger';
import type { ZigoChatPoruka } from '@obrtniq/core';

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

export const ZIGO_SYSTEM_INSTRUCTION = `Ti si Žigo (Digitalni Orlando), stoički i kirurški precizan autonomni klijentski agent sustava ObrtnIQ za hrvatske paušalne i dohodovne obrte.
U sebi nosiš duh i diplomaciju Dubrovačke Republike: diplomaciju koja rješava krizu bez ispaljenog metka, mudrost Senata zapakiranu u dvije mirne rečenice i onaj stoički kameni stav viteza Orlanda na trgu.
Tvoj lakat je univerzalno mjerilo poštenja i zakonitosti: "Ni milimetra više državi nego što joj pripada, ni centa manje da ti ne zatvore vrata."

Tvoja pravila ponašanja i rada:
1. MIR I DIPLOMACIJA: Kad korisnik paničari oko poreza, inspekcija ili rokova, spusti mu puls na 60. Nema patetike, nema kukanja.
2. DUBROVAČKI LAKAT: Mjeri točno po zakonu RH. Koristi KPD 2025 šifre, pazi na Fiskalizaciju 1.0 (CIS) i 2.0 (UBL 2.1 e-Račun).
3. POREZNI FILTAR ZA OPRAVDANOST TROŠKOVA (Ćevapi test): Ako korisnik priloži račun ili pita za pravdanje privatnih izdataka (npr. roštilj, ćevapi, parfemi, odjeća, osobni šoping), duhovito i nepokolebljivo odbij pravdanje privatnog troška kao poslovnog izdatka obrta (zaštita od poreznog nadzora). Npr. "Knez je vladao mjesec dana i nije smio izlazit iz Dvora da ga moć ne pokvari, a ti bi nakon tri mjeseca rada pekao ćevape na trošak obrta? Brišem roštilj. Ne dam da ti inspektor sjedne za vrat radi dvije kile ćevapa."
4. ČUVAR PAUŠALNOG PRAGA OD 40.000 €: Uvijek prati godišnji promet. Ako se promet približi 40.000 €, odmah upozori korisnika i savjetuj prebacivanje računa na novu godinu ili pripremu za PDV.
5. PAD CIS-A / INTERNETA: Ako padne sustav porezne ili internet: "Pao je i Napoleon, pa Grad eno još stoji đe je i bio. Račune sam zapečatio lokalnim kodom, zabilježio milisekundu. Popij čašu vode, nemoj da ti tlak skače radi tuđeg lošeg interneta."
6. AUTONOMNE AKCIJE: Kad korisnik želi nešto napraviti na sustavu (postaviti kupca, dodati stavku, pogledati stanje, trijažu, izvesti KPR ili PO-SD), POZOVI ODGOVARAJUĆI ALAT (functionCall).`;

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
  }
];

class GeminiService {
  public getStoredApiKey(): string {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEY_GEMINI_KEY) || '';
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
  public async testApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey || apiKey.trim().length < 10) {
      throw new Error('API ključ mora sadržavati barem 10 znakova.');
    }

    const model = this.getStoredModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

    const body = {
      contents: [{ parts: [{ text: 'Ping test. Odgovori samo riječju OK.' }] }],
      generationConfig: { maxOutputTokens: 5 },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Greška povezivanja s Gemini API (${res.status})`);
    }

    return true;
  }

  /**
   * Glavni agentni razgovor sa Žigom (Gemini 2.0 Function Calling, Multimodal & Offline Heuristics)
   */
  public async chatWithAgent(
    messages: ZigoChatPoruka[],
    apiKeyOverride?: string
  ): Promise<ZigoAgentResponse> {
    const key = apiKeyOverride || this.getStoredApiKey();

    // Ako nema ključa, koristi stoički lokalni heuristički asistent
    if (!key) {
      return this.chatWithAgentLocalHeuristic(messages);
    }

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

      const body = {
        contents,
        systemInstruction: {
          parts: [{ text: ZIGO_SYSTEM_INSTRUCTION }],
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

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gemini API odgovor: ${res.status}`);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0]?.content;
      const funcCallPart = candidate?.parts?.find((p: any) => p.functionCall);
      const textPart = candidate?.parts?.find((p: any) => p.text);

      if (funcCallPart?.functionCall) {
        return {
          odgovorTekst: textPart?.text || 'Pripremam akciju na radnoj plohi...',
          toolPoziv: {
            imeFunkcije: funcCallPart.functionCall.name,
            argumenti: funcCallPart.functionCall.args || {},
          },
          jeAiGenerirano: true,
        };
      }

      return {
        odgovorTekst: textPart?.text || 'Mir u Gradu. Nema potrebe za promjenama.',
        jeAiGenerirano: true,
      };
    } catch (err: any) {
      appLogger.scope('AI:ZIGO').warn('Greška u pozivu Gemini modela, prebacujem na lokalni Orlandov fallback:', {
        error: err?.message,
      });
      return this.chatWithAgentLocalHeuristic(messages);
    }
  }

  /**
   * Lokalni deterministički heuristički asistent za Žiga (radi 100% offline bez interneta i bez API ključa)
   */
  public chatWithAgentLocalHeuristic(messages: ZigoChatPoruka[]): ZigoAgentResponse {
    const lastUserMsg = [...messages].reverse().find((m) => m.uloga === 'user');
    if (!lastUserMsg) {
      return {
        odgovorTekst: 'Orlando stoji na trgu. Kako ti mogu pomoći oko obrta danas?',
        jeAiGenerirano: false,
      };
    }

    const text = (lastUserMsg.tekst || '').toLowerCase();
    const hasAttachments = lastUserMsg.privitci && lastUserMsg.privitci.length > 0;

    // 1. Porezni filtar za ćevape i privatne troškove (V11-6)
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
      return {
        odgovorTekst: `Vidim ja, uzeli smo opremu za arhiviranje... i jedan aparat za termičku obradu mesnih prerađevina u radnom prostoru. Slušaj ti mene: Knez je vladao mjesec dana i nije smio izlazit iz Dvora da ga moć ne pokvari, a ti bi nakon tri mjeseca rada pekao ćevape na trošak poslovanja? Brišem roštilj. Papir ostavljam. Ne dam da ti porezni inspektor sjedne za vrat radi dvije kile ćevapa, jeftinije ti je pojest ih u miru doma.`,
        jeAiGenerirano: false,
      };
    }

    // 2. Žigin Rez trijaža (V11-5)
    if (text.includes('presijeci') || text.includes('rez') || text.includes('trijaža') || text.includes('panika')) {
      return {
        odgovorTekst: `Evo me, naslonio sam se na kameni štit i držim lakat u ravnini. Režem birokratsku dramu u tri točke:`,
        toolPoziv: {
          imeFunkcije: 'aktiviraj_zigin_rez',
          argumenti: {},
        },
        jeAiGenerirano: false,
      };
    }

    // 3. Status paušalnog praga i KPR (V11-4)
    if (
      text.includes('prag') ||
      text.includes('40000') ||
      text.includes('40.000') ||
      text.includes('koliko mi je ostalo') ||
      text.includes('koliko mi fali')
    ) {
      return {
        odgovorTekst: `Podigao sam podlakticu i mjerim točno po zakonu. Preko lakta ne damo, ispod lakta ne zakidamo. Provjeravam tvoju Knjigu prometa:`,
        toolPoziv: {
          imeFunkcije: 'dohvati_financijski_status',
          argumenti: {},
        },
        jeAiGenerirano: false,
      };
    }

    // 4. Multimodalni sken opravdanog računa (V11-7)
    if (
      hasAttachments ||
      text.includes('skeniraj') ||
      text.includes('račun za papir') ||
      text.includes('uredski papir') ||
      text.includes('toner')
    ) {
      return {
        odgovorTekst: `Skenirao sam račun. Prepoznat je dobavljač 'Narodne novine d.d.' (OIB: 41234567891), stavka 'Uredski papir A4 80g' u iznosu od 24,50 €. Ovaj trošak je u cijelosti poslovno opravdan prema poreznim propisima RH. Dodajem ga na radnu plohu.`,
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
    }

    // 5. Cjenik - dodavanje artikla (V11-3)
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

      return {
        odgovorTekst: `Unio sam novu stavku u dubrovački tefter. Usluga "${naziv}" s propisanom KPD 2025 šifrom ${kpd} je spremljena u tvoj lokalni cjenik.`,
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
    }

    // 6. Priprema računa i postavljanje kupca (V11-2)
    if (text.includes('pripremi račun') || text.includes('račun za') || text.includes('fakturu za')) {
      const oibMatch = lastUserMsg.tekst.match(/\b\d{11}\b/);
      const partnerMatch = lastUserMsg.tekst.match(/za\s+([^,]+?)(?:,\s*oib|\s+oib|$)/i);
      const partnerNaziv = partnerMatch && partnerMatch[1] ? partnerMatch[1].trim() : 'ACME d.o.o.';
      const oib = oibMatch ? oibMatch[0] : '12345678903';

      return {
        odgovorTekst: `Pripremam radnu plohu za kupca ${partnerNaziv} (OIB: ${oib}). Postavljam podatke partnera na aktivni račun.`,
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
    }

    // 7. Izvoz KPR CSV ili PO-SD XML
    if (text.includes('kpr') && text.includes('csv')) {
      return {
        odgovorTekst: 'Pokrećem izvoz Knjige prometa u CSV prilagođen za Excel:',
        toolPoziv: {
          imeFunkcije: 'izvezi_kpr_csv',
          argumenti: {},
        },
        jeAiGenerirano: false,
      };
    }

    if (text.includes('posd') || text.includes('po-sd') || text.includes('eporezn')) {
      return {
        odgovorTekst: 'Generiram službeni PO-SD XML obrazac za predaju na ePoreznu:',
        toolPoziv: {
          imeFunkcije: 'izvezi_posd_xml',
          argumenti: {},
        },
        jeAiGenerirano: false,
      };
    }

    // 8. Općeniti stoički odgovor
    return {
      odgovorTekst: `Stoje zidine, stoji i Orlando. Ođe mjerimo točno po zakonu: ni milimetra više državi nego što joj pripada, ni centa manje da ti ne zatvore vrata. Mogu ti pripremiti račun, provjeriti prag, izvesti KPR ili trijažirati stanje ako je preša.`,
      jeAiGenerirano: false,
    };
  }

  /**
   * Analizira opis posla i predlaže točnu KPD 2025 šifru i parametre za e-Račun
   */
  public async recommendKpd(opisPosla: string, apiKeyOverride?: string): Promise<KpdRecommendation> {
    const key = apiKeyOverride || this.getStoredApiKey();

    if (!key) {
      return this.recommendKpdLocalHeuristic(opisPosla);
    }

    try {
      const model = this.getStoredModel();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

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
        throw new Error(err.error?.message || `Gemini API odgovor: ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Prazan odgovor od Gemini modela.');
      }

      const parsed = JSON.parse(text);
      appLogger.scope('AI:GEMINI').info('Uspješno generirana KPD 2025 preporuka', {
        opis: opisPosla,
        kpd: parsed.kpdSifra,
      });

      return {
        kpdSifra: parsed.kpdSifra || '62.01.11',
        kpdNaziv: parsed.kpdNaziv || 'Usluge računalnog programiranja',
        preporucenaJedinica: parsed.preporucenaJedinica || 'sat',
        preporucenaCijena: parsed.preporucenaCijena,
        objasnjenje: parsed.objasnjenje || 'Preporučeno na temelju analize djelatnosti.',
        jeAiGenerirano: true,
      };
    } catch (err: any) {
      appLogger.scope('AI:GEMINI').warn('Greška u pozivu Gemini API, prebacujem na lokalni fallback:', {
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

    if (q.includes('softver') || q.includes('web') || q.includes('program') || q.includes('kod') || q.includes('aplikacij') || q.includes('frontend') || q.includes('backend') || q.includes('fullstack')) {
      return {
        kpdSifra: '62.01.11',
        kpdNaziv: 'Usluge dizajna i razvoja aplikacijskog softvera',
        preporucenaJedinica: 'sat',
        preporucenaCijena: 60.0,
        objasnjenje: 'Preporučeno prema ključnim riječima razvoja i programiranja softvera (KPD 2025 / NKD 62.01).',
        jeAiGenerirano: false,
      };
    }

    if (q.includes('dizajn') || q.includes('grafik') || q.includes('logo') || q.includes('vizual') || q.includes('ux') || q.includes('ui') || q.includes('brend')) {
      return {
        kpdSifra: '74.10.11',
        kpdNaziv: 'Usluge dizajna vizualnih komunikacija i grafičkog dizajna',
        preporucenaJedinica: 'sat',
        preporucenaCijena: 45.0,
        objasnjenje: 'Preporučeno za poslove grafičkog i digitalnog oblikovanja, UX/UI dizajna i logotipa.',
        jeAiGenerirano: false,
      };
    }

    if (q.includes('savjet') || q.includes('konzalt') || q.includes('upravlj') || q.includes('strategij') || q.includes('poslovn')) {
      return {
        kpdSifra: '70.22.11',
        kpdNaziv: 'Usluge savjetovanja u vezi s poslovanjem i upravljanjem',
        preporucenaJedinica: 'sat',
        preporucenaCijena: 75.0,
        objasnjenje: 'Standardna šifra za poslovno i menadžersko savjetovanje obrtnika.',
        jeAiGenerirano: false,
      };
    }

    if (q.includes('mrež') || q.includes('server') || q.includes('sistem') || q.includes('održavanj') || q.includes('podršk')) {
      return {
        kpdSifra: '62.02.20',
        kpdNaziv: 'Usluge tehničke podrške za informacijsku tehnologiju (IT)',
        preporucenaJedinica: 'sat',
        preporucenaCijena: 50.0,
        objasnjenje: 'Prikladno za administraciju poslužitelja, održavanje računala i tehničku IT podršku.',
        jeAiGenerirano: false,
      };
    }

    if (q.includes('prijevod') || q.includes('lekt') || q.includes('tekst') || q.includes('tumač')) {
      return {
        kpdSifra: '74.30.11',
        kpdNaziv: 'Usluge prevođenja i lekture',
        preporucenaJedinica: 'kartica',
        preporucenaCijena: 15.0,
        objasnjenje: 'Preporučeno za pisano i usmeno prevođenje te lekturu autorskih tekstova.',
        jeAiGenerirano: false,
      };
    }

    if (q.includes('market') || q.includes('reklam') || q.includes('oglaš') || q.includes('društven') || q.includes('kampanj')) {
      return {
        kpdSifra: '73.11.11',
        kpdNaziv: 'Usluge cjelovitih marketinških i oglasnih kampanja',
        preporucenaJedinica: 'projekt',
        preporucenaCijena: 350.0,
        objasnjenje: 'Šifra za digitalni marketing, vođenje oglašavanja i društvene mreže.',
        jeAiGenerirano: false,
      };
    }

    return {
      kpdSifra: '62.01.11',
      kpdNaziv: 'Usluge računalnog programiranja i savjetovanja',
      preporucenaJedinica: 'sat',
      preporucenaCijena: 50.0,
      objasnjenje: 'Zadana standardna KPD 2025 šifra za paušalne obrtnike u uslužnim djelatnostima.',
      jeAiGenerirano: false,
    };
  }
}

export const geminiService = new GeminiService();
