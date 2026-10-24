import { appLogger } from './logger';

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

const STORAGE_KEY_GEMINI_KEY = 'obrtniq_gemini_api_key';
const STORAGE_KEY_GEMINI_MODEL = 'obrtniq_gemini_model';
export const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

class GeminiService {
  public getStoredApiKey(): string {
    return localStorage.getItem(STORAGE_KEY_GEMINI_KEY) || '';
  }

  public setStoredApiKey(key: string): void {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY_GEMINI_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
    }
  }

  public getStoredModel(): string {
    return localStorage.getItem(STORAGE_KEY_GEMINI_MODEL) || DEFAULT_GEMINI_MODEL;
  }

  public setStoredModel(model: string): void {
    localStorage.setItem(STORAGE_KEY_GEMINI_MODEL, model.trim() || DEFAULT_GEMINI_MODEL);
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
   * Analizira opis posla i predlaže točnu KPD 2025 šifru i parametre za e-Račun
   */
  public async recommendKpd(opisPosla: string, apiKeyOverride?: string): Promise<KpdRecommendation> {
    const key = apiKeyOverride || this.getStoredApiKey();

    // Ako korisnik nema unesen API ključ, koristi inteligentni lokalni heuristički fallback
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
        throw new Error(`Gemini API odgovor: ${res.status}`);
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
      // Fallback na lokalnu heuristiku u slučaju prekida mreže ili isteka kvote
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

    // Default
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
