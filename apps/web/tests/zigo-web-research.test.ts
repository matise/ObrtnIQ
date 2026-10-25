import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tavilySearchService } from '../src/services/tavily-search-service';
import { executeZigoTool } from '../src/services/zigo-tools-dispatcher';
import { ZIGO_FUNCTION_DECLARATIONS } from '../src/services/gemini-service';
import { dexieStorage } from '../src/storage/dexie-db';

const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, String(value)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = mockLocalStorage;
}

describe('Tavily Web Research & Regulations Verification (Faza 14.3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockLocalStorage.clear();
    vi.spyOn(dexieStorage.memorija, 'save').mockImplementation(async () => {});
  });

  it('WEB-01: Spremanje i dohvat Tavily API ključa u lokalnu pohranu', () => {
    expect(tavilySearchService.getStoredApiKey()).toBe('');
    tavilySearchService.setStoredApiKey('tvly-test-key-12345');
    expect(tavilySearchService.getStoredApiKey()).toBe('tvly-test-key-12345');
    tavilySearchService.setStoredApiKey('');
    expect(tavilySearchService.getStoredApiKey()).toBe('');
  });

  it('WEB-02: searchRegulations vraća strukturirane rezultate s verificiranim propisima o paušalnom pragu', async () => {
    const res = await tavilySearchService.searchRegulations('paušalni obrt prag 40.000');
    expect(res.uspjeh).toBe(true);
    expect(res.query).toContain('prag 40.000');
    expect(res.odgovorSazetak).toContain('40.000,00 €');
    expect(res.results.length).toBeGreaterThan(0);
    expect(res.results.some((r) => r.url.includes('porezna-uprava.hr') || r.url.includes('narodne-novine.nn.hr'))).toBe(true);
  });

  it('WEB-03: istrazi_propise_web alat je ispravno deklariran u ZIGO_FUNCTION_DECLARATIONS', () => {
    const decl = ZIGO_FUNCTION_DECLARATIONS.find((f) => f.name === 'istrazi_propise_web');
    expect(decl).toBeDefined();
    expect(decl?.description).toContain('Porezne uprave');
    expect(decl?.parameters.properties.upit).toBeDefined();
  });

  it('WEB-04: executeZigoTool izvršava istrazi_propise_web i vraća provjerene rezultate', async () => {
    const res = await executeZigoTool('istrazi_propise_web', { upit: 'KPD 2025 šifre usluga' }, {});
    expect(res.uspjeh).toBe(true);
    expect(res.podaci).toBeDefined();
    expect(res.podaci.query).toBe('KPD 2025 šifre usluga');
    expect(res.podaci.odgovorSazetak).toContain('KPD 2025');
  });

  it('WEB-05: zapamti_cinjenicu alat je deklariran i uspješno sprema činjenicu preko dispečera', async () => {
    const decl = ZIGO_FUNCTION_DECLARATIONS.find((f) => f.name === 'zapamti_cinjenicu');
    expect(decl).toBeDefined();

    const res = await executeZigoTool('zapamti_cinjenicu', {
      kategorija: 'pravilo',
      kljuc: 'rok_placanja',
      vrijednost: 'Valuta plaćanja je uvijek 15 dana',
    }, {});

    expect(res.uspjeh).toBe(true);
    expect(res.poruka).toContain('Zapisano u tefter');
    expect(res.podaci.memorija.kljuc).toBe('rok_placanja');
  });
});
