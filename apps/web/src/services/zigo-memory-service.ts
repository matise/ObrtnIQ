import type { ZigoUserMemory, ZigoMemoryKategorija } from '@obrtniq/core';
import { dexieStorage } from '../storage/dexie-db';
import { appLogger } from './logger';

const logger = appLogger.scope('AGENT:MEMORY');

/**
 * Pomoćna funkcija za generiranje slug ključa iz teksta
 */
function slugifyKey(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
}

export class ZigoMemoryService {
  /**
   * Dohvaća sve spremljene činjenice i preferencije o korisniku
   */
  async getAllMemories(): Promise<ZigoUserMemory[]> {
    try {
      const memories = await dexieStorage.memorija.getAll();
      logger.debug('Dohvaćene zabilješke iz memorije', { brojZabiljeski: memories.length });
      return memories;
    } catch (err: any) {
      logger.error('Greška pri dohvaćanju memorije:', { error: err?.message });
      return [];
    }
  }

  /**
   * Sprema novu činjenicu ili ažurira postojeću
   */
  async saveMemory(
    kategorija: ZigoMemoryKategorija,
    kljuc: string,
    vrijednost: string,
    izvor: 'izricito_korisnik' | 'spontano_nauceno' = 'izricito_korisnik',
    pouzdanost: number = 1.0
  ): Promise<ZigoUserMemory> {
    const cleanKljuc = slugifyKey(kljuc) || `mem_${Date.now()}`;
    const id = `mem-${cleanKljuc}`;

    const novaMemorija: ZigoUserMemory = {
      id,
      kategorija,
      kljuc: cleanKljuc,
      vrijednost: vrijednost.trim(),
      izvor,
      pouzdanost: Math.min(1.0, Math.max(0.0, pouzdanost)),
      azurirano: new Date().toISOString(),
    };

    logger.info(`Spremanje zabilješke u Žigin tefter: [${cleanKljuc}]`, {
      kategorija,
      vrijednost: novaMemorija.vrijednost,
      izvor,
    });

    await dexieStorage.memorija.save(novaMemorija);
    return novaMemorija;
  }

  /**
   * Briše pojedinačnu zabilješku
   */
  async deleteMemory(id: string): Promise<void> {
    logger.info(`Brisanje zabilješke iz memorije: [${id}]`);
    await dexieStorage.memorija.delete(id);
  }

  /**
   * Briše sve zabilješke (reset teftera)
   */
  async clearAllMemories(): Promise<void> {
    logger.warn('Brisanje svih zabilješki iz Žiginog teftera');
    await dexieStorage.memorija.clear();
  }

  /**
   * Formatira zabilješke u sažetak prikladan za injekciju u sistemski prompt
   */
  formatMemoriesForSystemPrompt(memories: ZigoUserMemory[]): string {
    if (!memories || memories.length === 0) {
      return '';
    }

    const lines: string[] = [
      '[ŠTO ZNAŠ O SVOM PRIJATELJU (KORISNIKU) — ŽIGIN TEFTER]',
      'Ovo su trajne činjenice, navike i preferencije koje si naučio o korisniku. Koristi ih prirodno u razgovoru i odlukama:',
    ];

    for (const mem of memories) {
      const katOznaka = mem.kategorija.toUpperCase();
      lines.push(`• [${katOznaka}] ${mem.kljuc}: ${mem.vrijednost}`);
    }

    return lines.join('\n');
  }

  /**
   * Heurističko prepoznavanje činjenica iz korisničkog teksta (npr. ime, djelatnost, pravila)
   */
  extractPotentialMemories(text: string): Array<{
    kategorija: ZigoMemoryKategorija;
    kljuc: string;
    vrijednost: string;
    izvor: 'izricito_korisnik' | 'spontano_nauceno';
  }> {
    const extracted: Array<{
      kategorija: ZigoMemoryKategorija;
      kljuc: string;
      vrijednost: string;
      izvor: 'izricito_korisnik' | 'spontano_nauceno';
    }> = [];

    const lower = text.trim();

    // 1. Eksplicitno pamćenje: "Žigo, zapamti da...", "zapamti: ..."
    const zapamtiMatch = lower.match(/(?:žigo,?\s*)?(?:zapamti|zabilježi|nemoj zaboravit)\s*(?:da|:)?\s*(.+)/i);
    if (zapamtiMatch && zapamtiMatch[1]) {
      const rawFact = zapamtiMatch[1].trim();
      if (rawFact.length > 3) {
        extracted.push({
          kategorija: 'pravilo',
          kljuc: slugifyKey(rawFact.slice(0, 24)),
          vrijednost: rawFact,
          izvor: 'izricito_korisnik',
        });
      }
    }

    // 2. Ime i obraćanje: "Zovi me Ivo", "Moje ime je Matija", "Ja sam Marko"
    const imeMatch = lower.match(/(?:zovi me|moje ime je|ja san|ja sam)\s+([A-ZČĆŠĐŽa-zčćšđž]{2,20})\b/i);
    if (imeMatch && imeMatch[1]) {
      const ime = imeMatch[1].trim();
      const capitalized = ime.charAt(0).toUpperCase() + ime.slice(1).toLowerCase();
      // Izbjegavaj lažne pozitivne poput "ja sam umoran", "ja sam gotov"
      const nonNames = ['umoran', 'gotov', 'oprezan', 'tu', 'ovdje', 'spreman', 'sam', 'sama'];
      if (!nonNames.includes(capitalized.toLowerCase())) {
        extracted.push({
          kategorija: 'identitet',
          kljuc: 'ime_korisnika',
          vrijednost: capitalized,
          izvor: 'spontano_nauceno',
        });
      }
    }

    // 3. Djelatnost: "Bavim se keramikom", "Ja sam grafički dizajner", "Moj obrt se bavi programiranjem"
    const djelatnostMatch = lower.match(/(?:bavim se|radim kao|moj obrt se bavi)\s+([^,.]+)/i);
    if (djelatnostMatch && djelatnostMatch[1]) {
      const posao = djelatnostMatch[1].trim();
      if (posao.length > 4 && posao.length < 60) {
        extracted.push({
          kategorija: 'posao',
          kljuc: 'djelatnost_obrta',
          vrijednost: posao,
          izvor: 'spontano_nauceno',
        });
      }
    }

    // 4. Glavni klijent: "Moj glavni klijent je X"
    const klijentMatch = lower.match(/(?:glavni klijent|najveći klijent)\s+(?:mi\s+)?je\s+([^,.]+)/i);
    if (klijentMatch && klijentMatch[1]) {
      extracted.push({
        kategorija: 'posao',
        kljuc: 'glavni_klijent',
        vrijednost: klijentMatch[1].trim(),
        izvor: 'spontano_nauceno',
      });
    }

    // 5. Preferenca radnog vremena: "radim noću", "ne volim jutro"
    if (lower.includes('radim noću') || lower.includes('noćna ptica') || lower.includes('volim radit po noći')) {
      extracted.push({
        kategorija: 'preferenca',
        kljuc: 'radni_ritam',
        vrijednost: 'Radi noću u miru, produktivniji je u kasnim satima',
        izvor: 'spontano_nauceno',
      });
    }

    return extracted;
  }
}

export const zigoMemoryService = new ZigoMemoryService();
