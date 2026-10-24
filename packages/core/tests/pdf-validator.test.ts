import { describe, it, expect } from 'vitest';
import { validatePdfStructure } from '../src/utils/pdf-validator';

describe('PDF File Structure Validator (ISO 32000-1)', () => {
  it('ispravno validira ispravan PDF string', () => {
    const validPdfMock = 
      '%PDF-1.4\n' +
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
      '3 0 obj\n<< /Type /Page >>\nendobj\n' +
      'xref\n0 4\n' +
      'trailer\n<< /Root 1 0 R >>\n' +
      'startxref\n120\n%%EOF\n';

    const result = validatePdfStructure(validPdfMock);

    expect(result.isValidPdf).toBe(true);
    expect(result.hasMagicHeader).toBe(true);
    expect(result.version).toBe('1.4');
    expect(result.hasEofTrailer).toBe(true);
    expect(result.hasCatalog).toBe(true);
    expect(result.hasPages).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detektira neispravan PDF bez magic header-a', () => {
    const invalidHeader = 'Ovo nije PDF datoteka\n%%EOF';
    const result = validatePdfStructure(invalidHeader);

    expect(result.isValidPdf).toBe(false);
    expect(result.hasMagicHeader).toBe(false);
    expect(result.errors.some(e => e.includes('%PDF-1.x'))).toBe(true);
  });

  it('detektira neispravan PDF bez završnog EOF markera', () => {
    const missingEof = '%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    const result = validatePdfStructure(missingEof);

    expect(result.isValidPdf).toBe(false);
    expect(result.hasEofTrailer).toBe(false);
    expect(result.errors.some(e => e.includes('%%EOF'))).toBe(true);
  });

  it('ispravno obrađuje Uint8Array i ArrayBuffer formate', () => {
    const raw = '%PDF-1.5\n/Catalog /Pages\n%%EOF\n' + ' '.repeat(100);
    const uint8 = new TextEncoder().encode(raw);

    const resultUint8 = validatePdfStructure(uint8);
    expect(resultUint8.isValidPdf).toBe(true);
    expect(resultUint8.version).toBe('1.5');
    expect(resultUint8.byteLength).toBe(uint8.byteLength);

    const resultBuffer = validatePdfStructure(uint8.buffer);
    expect(resultBuffer.isValidPdf).toBe(true);
  });
});
