import { describe, it, expect } from 'vitest';
import { parseZigoSections, renderFormattedInline } from '../src/components/ZigoMessageContent';

describe('ZigoMessageContent: Parsiranje i stiliziranje odgovora', () => {
  it('ispravno raščlanjuje trodijelni odgovor iz korisničke slike (Opservacija, Dijagnoza, Žigin Rez)', () => {
    const rawScreenshotText = `**Opservacija:**
Gledan u ovaj ekran u dva po ponoći... U ove ure ni dubrovački knez nije potpisivao mjenice nego slušao more pod Dvorom. Ali kad već bdiješ nad rabotom, red je da izmjerin svaki milimetar Orlandovim laktom.
**Dijagnoza:**
Papiri su sterilno čisti i šesni, k'o da ih je sam kancelar Republike slagao. Kupac prolazi MOD 11 kontrolu bez greške, zona \`DOMACI_B2B\` je zakonski na mistu, a KPD šifra \`62.01.11\` za razvoj softvera stoji točno đe pripada. Sa spêndzom od 1.250 eura trošiš tek 3% haračkog limita — do crvene linije od 40.000 € imaš još plovit i plovit.
**Žigin Rez:**
Nacrt je bez mane. Ako baš inzistiraš na raboti usred noći, stisni **F2** i zapečati račun. No moj ti je savjet: ugasi ekran, pusti neka te obuzme fjaka, a račun pošalji ujutro uz kavu kad se gospoda probude. Đe je preša?`;

    const sections = parseZigoSections(rawScreenshotText);

    expect(sections).toHaveLength(3);

    // 1. Opservacija
    expect(sections[0].type).toBe('opservacija');
    expect(sections[0].title).toBe('1. Opservacija');
    expect(sections[0].subtitle).toBe('Dubrovački osvrt');
    expect(sections[0].content).toContain('Gledan u ovaj ekran u dva po ponoći');
    expect(sections[0].content).not.toContain('**Opservacija:**');

    // 2. Dijagnoza
    expect(sections[1].type).toBe('dijagnoza');
    expect(sections[1].title).toBe('2. Dijagnoza');
    expect(sections[1].subtitle).toBe('Stanje papira & propisa');
    expect(sections[1].content).toContain('Papiri su sterilno čisti');
    expect(sections[1].content).toContain('`DOMACI_B2B`');
    expect(sections[1].content).not.toContain('**Dijagnoza:**');

    // 3. Žigin Rez
    expect(sections[2].type).toBe('rez');
    expect(sections[2].title).toBe('3. Žigin Rez');
    expect(sections[2].subtitle).toBe('Kirurški rez & akcija');
    expect(sections[2].content).toContain('stisni **F2** i zapečati račun');
    expect(sections[2].content).not.toContain('**Žigin Rez:**');
  });

  it('ispravno parsira trijažni odgovor s uvodom i točkama Što gori, Što čeka, Akcija sad', () => {
    const rawTriageText = `Evo me, naslonio san se na kameni štit i držin lakat u ravnini. Režen birokratsku dramu u tri točke:

1. ŠTO GORI (<24h): Predaj otvorene račune i provjeri OIB partnera.
2. ŠTO ČEKA: Pusti administrativni šum neka kisne do ponedjeljka.
3. AKCIJA SAD: Jedno dugme – provjeri usklađenost i mirno spavaj.`;

    const sections = parseZigoSections(rawTriageText);

    expect(sections).toHaveLength(4);

    expect(sections[0].type).toBe('intro');
    expect(sections[0].content).toContain('Režen birokratsku dramu');

    expect(sections[1].type).toBe('stogori');
    expect(sections[1].title).toBe('1. Što gori (<24h)');
    expect(sections[1].content).toContain('Predaj otvorene račune');

    expect(sections[2].type).toBe('stoceka');
    expect(sections[2].title).toBe('2. Što čeka');
    expect(sections[2].content).toContain('Pusti administrativni šum');

    expect(sections[3].type).toBe('akcijasad');
    expect(sections[3].title).toBe('3. Akcija sad');
    expect(sections[3].content).toContain('Jedno dugme');
  });

  it('obrađuje općenite jednostavne poruke bez sekcija kao jedinstveni general odlomak', () => {
    const genericMsg = 'Bog daj, gosparu. Ođe Orlando na trgu. Reci što ćemo danas riješiti?';
    const sections = parseZigoSections(genericMsg);

    expect(sections).toHaveLength(1);
    expect(sections[0].type).toBe('general');
    expect(sections[0].content).toBe(genericMsg);
  });

  it('renderFormattedInline prepoznaje tipkovničke prečace poput **F2**, kod pod navodnicima i bold', () => {
    const text = 'Pritisni **F2** za spremanje, odaberi zonu `DOMACI_B2B` i provjeri **OIB**.';
    const rendered = renderFormattedInline(text);

    // Provjeravamo da je vratio elemente s tipovima
    expect(rendered.length).toBeGreaterThan(1);

    // Provjeri postoji li React element s kbd tagom
    const hasKbd = rendered.some(
      (node: any) => node && typeof node === 'object' && node.type === 'kbd'
    );
    expect(hasKbd).toBe(true);

    // Provjeri postoji li React element s code tagom
    const hasCode = rendered.some(
      (node: any) => node && typeof node === 'object' && node.type === 'code'
    );
    expect(hasCode).toBe(true);

    // Provjeri postoji li React element sa strong tagom
    const hasStrong = rendered.some(
      (node: any) => node && typeof node === 'object' && node.type === 'strong'
    );
    expect(hasStrong).toBe(true);
  });
});
