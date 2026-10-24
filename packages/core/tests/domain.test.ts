import { describe, it, expect } from 'vitest';
import type { VrstaDokumenta, NacinPlacanja, PoreznaZona } from '../src/domain/types';

describe('Domain Types Sanity Test (Faza 0 Setup Check)', () => {
  it('should correctly assert document and payment types', () => {
    const doc: VrstaDokumenta = 'RACUN';
    const payment: NacinPlacanja = 'TRANSAKCIJSKI_RACUN';
    const zone: PoreznaZona = 'DOMACI_B2B';

    expect(doc).toBe('RACUN');
    expect(payment).toBe('TRANSAKCIJSKI_RACUN');
    expect(zone).toBe('DOMACI_B2B');
  });
});
