import { describe, it, expect } from 'vitest';
import {
  cleanTextForSpeech,
  prepareMessageForNarration,
} from '../src/domain/audio-transport';

describe('Audio Transport Domain & Narration Parser', () => {
  describe('cleanTextForSpeech', () => {
    it('čisti Markdown formatiranje (bold, italic, poveznice, kod)', () => {
      const raw = 'Ovo je **važna** poruka s *italic* tekstom, `kodom` i [poveznicom](https://porezna.gov.hr).';
      const clean = cleanTextForSpeech(raw);
      expect(clean).toBe('Ovo je važna poruka s italic tekstom, kodom i poveznicom.');
    });

    it('fonetski prilagođava fiskalne akronime za razgovijetan izgovor', () => {
      const raw = 'Provjeri KPR, unesi OIB, zabilježi ZKI i JIR te provjeri KPD šifru.';
      const clean = cleanTextForSpeech(raw);
      expect(clean).toContain('K P R');
      expect(clean).toContain('O I B');
      expect(clean).toContain('Z K I');
      expect(clean).toContain('J I R');
      expect(clean).toContain('K P D');
    });

    it('zamjenjuje valutu € i porezni prag od 40.000 s prirodnim izgovorom', () => {
      const raw = 'Ukupan iznos je 450 € i pazimo na prag od 40.000 €.';
      const clean = cleanTextForSpeech(raw);
      expect(clean).toContain('450 eura');
      expect(clean).toContain('četrdeset tisuća eura');
    });

    it('ispravno rukuje praznim unosom', () => {
      expect(cleanTextForSpeech('')).toBe('');
      expect(cleanTextForSpeech('   ')).toBe('');
    });
  });

  describe('prepareMessageForNarration', () => {
    it('raščlanjuje standardnu trodijelnu Žiginu poruku na 3 elementa (Opservacija, Dijagnoza, Rez)', () => {
      const rawText = `**1. Opservacija:**
Pao server u Zagrebu? Ma neka je. Pao je i Napoleon, pa Grad eno još stoji đe je i bio.

**2. Dijagnoza:**
CIS ili internet spava. Račune san zapečatio lokalnim kodom.

**3. Žigin Rez:**
Kad gospoda uključe kabao u zid, poslat ćemo sve u nizu. Popij čašu vode.`;

      const items = prepareMessageForNarration('msg-101', rawText);

      expect(items.length).toBe(3);

      expect(items[0]?.sectionType).toBe('opservacija');
      expect(items[0]?.label).toBe('1. Opservacija');
      expect(items[0]?.cleanTextForSpeech).toContain('Pao server u Zagrebu');

      expect(items[1]?.sectionType).toBe('dijagnoza');
      expect(items[1]?.label).toBe('2. Dijagnoza');
      expect(items[1]?.cleanTextForSpeech).toContain('CIS ili internet spava');

      expect(items[2]?.sectionType).toBe('rez');
      expect(items[2]?.label).toBe('3. Žigin Rez');
      expect(items[2]?.cleanTextForSpeech).toContain('poslat ćemo sve u nizu');
    });

    it('ako poruka ima uvodni pozdrav prije sekcija, izdvaja ga kao uvodni element', () => {
      const rawText = `Bog daj, gosparu!

**Opservacija:**
Miran budi.

**Dijagnoza:**
Sve je u redu.`;

      const items = prepareMessageForNarration('msg-102', rawText);
      expect(items.length).toBe(3);
      expect(items[0]?.sectionType).toBe('intro');
      expect(items[0]?.cleanTextForSpeech).toBe('Bog daj, gosparu!');
      expect(items[1]?.sectionType).toBe('opservacija');
      expect(items[2]?.sectionType).toBe('dijagnoza');
    });

    it('ako poruka nema sekcije, vraća jedan generalni element', () => {
      const rawText = 'Samo kratka obavijest: račun je uspješno izdan i poslan.';
      const items = prepareMessageForNarration('msg-103', rawText);

      expect(items.length).toBe(1);
      expect(items[0]?.sectionType).toBe('general');
      expect(items[0]?.cleanTextForSpeech).toBe('Samo kratka obavijest: račun je uspješno izdan i poslan.');
    });

    it('vraća praznu listu za prazan tekst', () => {
      expect(prepareMessageForNarration('msg-empty', '')).toEqual([]);
    });
  });
});
