import { describe, it, expect, vi, beforeEach } from 'vitest';
import { zigoMemoryService } from '../src/services/zigo-memory-service';
import { dexieStorage } from '../src/storage/dexie-db';
import type { ZigoUserMemory } from '@obrtniq/core';

const inMemoryMemories = new Map<string, ZigoUserMemory>();

describe('Zigo Memory Service ("Žigin Tefter") (Faza 14.2)', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    inMemoryMemories.clear();

    vi.spyOn(dexieStorage.memorija, 'getAll').mockImplementation(async () => Array.from(inMemoryMemories.values()));
    vi.spyOn(dexieStorage.memorija, 'save').mockImplementation(async (m: ZigoUserMemory) => { inMemoryMemories.set(m.id, m); });
    vi.spyOn(dexieStorage.memorija, 'delete').mockImplementation(async (id: string) => { inMemoryMemories.delete(id); });
    vi.spyOn(dexieStorage.memorija, 'clear').mockImplementation(async () => { inMemoryMemories.clear(); });
  });

  it('MEM-01: Izvlači činjenicu o identitetu (ime korisnika)', () => {
    const extracted = zigoMemoryService.extractPotentialMemories('Zovi me Matija kad pričamo.');
    expect(extracted.length).toBeGreaterThan(0);
    const ime = extracted.find((m) => m.kategorija === 'identitet');
    expect(ime).toBeDefined();
    expect(ime?.kljuc).toBe('ime_korisnika');
    expect(ime?.vrijednost).toBe('Matija');
  });

  it('MEM-02: Izvlači činjenicu o poslovanju i djelatnosti', () => {
    const extracted = zigoMemoryService.extractPotentialMemories('Bavim se izradom unikatnih robota i 3D printanjem.');
    expect(extracted.length).toBeGreaterThan(0);
    const posao = extracted.find((m) => m.kategorija === 'posao');
    expect(posao).toBeDefined();
    expect(posao?.vrijednost).toContain('izradom unikatnih robota');
  });

  it('MEM-03: Izvlači eksplicitnu naredbu za pamćenje ("Žigo, zapamti da...")', () => {
    const extracted = zigoMemoryService.extractPotentialMemories('Žigo, zapamti da za klijenta ACME uvijek ide valuta 30 dana.');
    expect(extracted.length).toBeGreaterThan(0);
    const pravilo = extracted.find((m) => m.kategorija === 'pravilo');
    expect(pravilo).toBeDefined();
    expect(pravilo?.vrijednost).toContain('za klijenta ACME uvijek ide valuta 30 dana');
  });

  it('MEM-04: Formatira zabilješke u Markdown sekciju za sistemski prompt', () => {
    const sampleMemories: ZigoUserMemory[] = [
      {
        id: 'mem-1',
        kategorija: 'identitet',
        kljuc: 'ime_korisnika',
        vrijednost: 'Matija',
        izvor: 'izricito_korisnik',
        pouzdanost: 1.0,
        azurirano: new Date().toISOString(),
      },
      {
        id: 'mem-2',
        kategorija: 'preferenca',
        kljuc: 'radni_ritam',
        vrijednost: 'Radi noću',
        izvor: 'spontano_nauceno',
        pouzdanost: 0.9,
        azurirano: new Date().toISOString(),
      },
    ];

    const formatted = zigoMemoryService.formatMemoriesForSystemPrompt(sampleMemories);
    expect(formatted).toContain('[ŠTO ZNAŠ O SVOM PRIJATELJU (KORISNIKU) — ŽIGIN TEFTER]');
    expect(formatted).toContain('[IDENTITET] ime_korisnika: Matija');
    expect(formatted).toContain('[PREFERENCA] radni_ritam: Radi noću');
  });

  it('MEM-05: Dexie spremanje, dohvat i brisanje zabilješki (CRUD)', async () => {
    const saved = await zigoMemoryService.saveMemory('posao', 'glavni_klijent', 'Tech Studio d.o.o.');
    expect(saved.id).toBe('mem-glavni_klijent');
    expect(saved.kljuc).toBe('glavni_klijent');

    const list = await zigoMemoryService.getAllMemories();
    expect(list.length).toBe(1);
    expect(list[0]?.vrijednost).toBe('Tech Studio d.o.o.');

    // Brisanje
    await zigoMemoryService.deleteMemory(saved.id);
    const afterDelete = await zigoMemoryService.getAllMemories();
    expect(afterDelete.length).toBe(0);
  });
});
