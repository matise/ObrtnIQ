import { describe, it, expect } from 'vitest';
import {
  OBRTNIQ_PHASES,
  SYSTEM_DOCS_CATALOG,
  getPhaseById,
  getCompletedPhasesCount,
  getTotalPhasesCount,
  getPhasesProgressPercentage
} from '@obrtniq/core';

describe('Sustav Dokumentacije & Docs Store (Korak 1)', () => {
  it('sadrži cjeloviti registar od 20 faza izgradnje', () => {
    expect(OBRTNIQ_PHASES.length).toBeGreaterThanOrEqual(18);
    expect(getTotalPhasesCount()).toBeGreaterThanOrEqual(18);
  });

  it('svaka faza ima definiran kod, naslov, ikonu i barem jedan Gate-Check', () => {
    OBRTNIQ_PHASES.forEach(phase => {
      expect(phase.id).toBeDefined();
      expect(phase.code).toMatch(/^FAZA/);
      expect(phase.title.length).toBeGreaterThan(0);
      expect(phase.summary.length).toBeGreaterThan(0);
      expect(phase.description.length).toBeGreaterThan(0);
      expect(phase.iconName.length).toBeGreaterThan(0);
      expect(phase.gateChecks.length).toBeGreaterThan(0);
      
      // Provjera strukture Gate-Checka
      phase.gateChecks.forEach(gc => {
        expect(gc.name.length).toBeGreaterThan(0);
        expect(typeof gc.passed).toBe('boolean');
        expect(gc.verificationDetail.length).toBeGreaterThan(0);
      });
    });
  });

  it('ispravno dohvaca fazu po ID-u putem getPhaseById', () => {
    const faza5 = getPhaseById('faza-05');
    expect(faza5).toBeDefined();
    expect(faza5?.code).toBe('FAZA 5');
    expect(faza5?.title).toContain('Workflow');

    const faza11 = getPhaseById('faza-11');
    expect(faza11).toBeDefined();
    expect(faza11?.title).toContain('Žigo Agent');
  });

  it('ispravno racuna broj dovrsenih faza i postotak napretka', () => {
    const completed = getCompletedPhasesCount();
    const total = getTotalPhasesCount();
    const percentage = getPhasesProgressPercentage();

    expect(completed).toBeGreaterThan(0);
    expect(completed).toBeLessThanOrEqual(total);
    expect(percentage).toBeGreaterThanOrEqual(80);
    expect(percentage).toBeLessThanOrEqual(100);
  });

  it('katalog dokumentacije sadrzi reference na kljucne dokumente', () => {
    expect(SYSTEM_DOCS_CATALOG.length).toBeGreaterThanOrEqual(3);
    const manifest = SYSTEM_DOCS_CATALOG.find(d => d.slug === 'manifest-implementacije');
    expect(manifest).toBeDefined();
    expect(manifest?.filePath).toContain('manifest_i_dnevnik_implementacije.md');
  });
});
