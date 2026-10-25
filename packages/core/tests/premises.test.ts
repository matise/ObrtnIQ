// packages/core/tests/premises.test.ts
// Faza 20: Testovi za poslovne prostore i naplatne uređaje

import { describe, it, expect } from 'vitest';
import {
  formatirajBrojDokumenta,
  parsirajBrojDokumenta,
  validirajOznakuProstora,
  validirajOznakuUredjaja,
  generirajKljuceveSekvence,
  ZADANI_POSLOVNI_PROSTOR,
} from '../src';

describe('Faza 20: Više poslovnih prostora i numeriranje računa (čl. 9 Fiskalizacije)', () => {
  it('V20-1: formatirajBrojDokumenta točno kreira zakonski format Broj/Prostor/Uređaj', () => {
    expect(formatirajBrojDokumenta(1)).toBe('1/POSL1/1');
    expect(formatirajBrojDokumenta(25, 'teren', '2')).toBe('25/TEREN/2');
    expect(formatirajBrojDokumenta(100, 'ured-1', 'pos-1')).toBe('100/URED-1/POS-1');
  });

  it('V20-1: parsirajBrojDokumenta točno rastavlja formatirani broj računa', () => {
    const parsed = parsirajBrojDokumenta('15/POSL1/1');
    expect(parsed).toEqual({
      broj: 15,
      prostorOznaka: 'POSL1',
      uredjajOznaka: '1',
    });

    // Neispravni formati vraćaju null
    expect(parsirajBrojDokumenta('')).toBeNull();
    expect(parsirajBrojDokumenta('15/POSL1')).toBeNull();
    expect(parsirajBrojDokumenta('abc/POSL1/1')).toBeNull();
    expect(parsirajBrojDokumenta('0/POSL1/1')).toBeNull();
  });

  it('V20-1: validira oznake poslovnog prostora i uređaja', () => {
    expect(validirajOznakuProstora('POSL1').valjano).toBe(true);
    expect(validirajOznakuProstora('TEREN_01').valjano).toBe(true);
    expect(validirajOznakuProstora('').valjano).toBe(false);
    expect(validirajOznakuProstora('PROSTOR SA RAZMAKOM').valjano).toBe(false);
    expect(validirajOznakuProstora('PredugackaOznakaProstoraKojaPrelaziLimit20Znakova').valjano).toBe(false);

    expect(validirajOznakuUredjaja('1').valjano).toBe(true);
    expect(validirajOznakuUredjaja('POS-1').valjano).toBe(true);
    expect(validirajOznakuUredjaja('').valjano).toBe(false);
    expect(validirajOznakuUredjaja('UREĐAJ NEVAŽEĆI ČĆŽŠ').valjano).toBe(false);
  });

  it('V20-1: generirajKljuceveSekvence stvara jedinstveni ključ za brojač', () => {
    expect(generirajKljuceveSekvence(2026, 'POSL1', '1')).toBe('2026_POSL1_1');
    expect(generirajKljuceveSekvence(2026, 'teren', '2')).toBe('2026_TEREN_2');
  });

  it('V20-1: Zadani poslovni prostor ima ispravne vrijednosti', () => {
    expect(ZADANI_POSLOVNI_PROSTOR.oznaka).toBe('POSL1');
    expect(ZADANI_POSLOVNI_PROSTOR.jeZadano).toBe(true);
    expect(ZADANI_POSLOVNI_PROSTOR.uredjaji[0].oznaka).toBe('1');
  });
});
