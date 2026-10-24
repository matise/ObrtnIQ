import { describe, it, expect } from 'vitest';
import { generateHub3Payload, parseHub3Payload, type Hub3Nalog } from '../src/utils/hub3';

describe('HUB-3 / HUB-3A Barkod Generator (PDF417 standard HRVHUB30)', () => {
  const nalog: Hub3Nalog = {
    iznosEur: 125.50,
    platiteljImeAdresa: 'Ivan Horvat',
    platiteljUlica: 'Ilica 10',
    platiteljMjesto: '10000 Zagreb',
    primateljImeAdresa: 'Robot Hand Made, vl. Matija',
    primateljUlica: 'Gundulićeva 5',
    primateljMjesto: '10000 Zagreb',
    primateljIban: 'HR12 2360 0001 1012 3456 7',
    model: 'HR00',
    pozivNaBroj: '14-2026',
    sifraNamjene: 'GDSV',
    opisPlacanja: 'Račun 14/POSL1/1',
  };

  it('treba generirati ispravan HRVHUB30 string s točno 14 redaka', () => {
    const payload = generateHub3Payload(nalog);
    const lines = payload.split('\n');

    expect(lines).toHaveLength(14);
    expect(lines[0]).toBe('HRVHUB30');
    expect(lines[1]).toBe('EUR');
    // Iznos u centima, 15 znamenki s vodećim nulama: 125.50 -> 12550 -> 000000000012550
    expect(lines[2]).toBe('000000000012550');
    expect(lines[3]).toBe('Ivan Horvat');
    expect(lines[4]).toBe('Ilica 10');
    expect(lines[5]).toBe('10000 Zagreb');
    expect(lines[6]).toBe('Robot Hand Made, vl. Matija');
    expect(lines[7]).toBe('Gundulićeva 5');
    expect(lines[8]).toBe('10000 Zagreb');
    // IBAN mora biti očišćen od razmaka
    expect(lines[9]).toBe('HR1223600001101234567');
    expect(lines[10]).toBe('HR00');
    expect(lines[11]).toBe('14-2026');
    expect(lines[12]).toBe('GDSV');
    expect(lines[13]).toBe('Račun 14/POSL1/1');
  });

  it('treba točno formatirati razne decimalne iznose u 15 znamenki', () => {
    const p1 = generateHub3Payload({ ...nalog, iznosEur: 1.00 });
    expect(p1.split('\n')[2]).toBe('000000000000100');

    const p2 = generateHub3Payload({ ...nalog, iznosEur: 0.05 });
    expect(p2.split('\n')[2]).toBe('000000000000005');

    const p3 = generateHub3Payload({ ...nalog, iznosEur: 99999.99 });
    expect(p3.split('\n')[2]).toBe('000000009999999');
  });

  it('treba skratiti polja koja prelaze HUB maksimalnu dopuštenu duljinu od 35 znakova', () => {
    const dugiNalog: Hub3Nalog = {
      ...nalog,
      platiteljImeAdresa: 'Ovo je iznimno dugi naziv platitelja koji prelazi granicu od 35 znakova',
      opisPlacanja: 'Dugi opis plaćanja koji premašuje dopušteni limit polja',
    };

    const payload = generateHub3Payload(dugiNalog);
    const lines = payload.split('\n');

    expect(lines[3]?.length).toBe(35);
    expect(lines[13]?.length).toBe(35);
  });

  it('treba postaviti zadanu šifru namjene GDSV ako nije specificirana', () => {
    const payload = generateHub3Payload({ ...nalog, sifraNamjene: '' });
    expect(payload.split('\n')[12]).toBe('GDSV');
  });

  it('parseHub3Payload treba točno rekonstruirati podatke naloga iz teksta', () => {
    const payload = generateHub3Payload(nalog);
    const parsed = parseHub3Payload(payload);

    expect(parsed).not.toBeNull();
    expect(parsed?.iznosEur).toBe(125.50);
    expect(parsed?.primateljIban).toBe('HR1223600001101234567');
    expect(parsed?.model).toBe('HR00');
    expect(parsed?.pozivNaBroj).toBe('14-2026');
    expect(parsed?.opisPlacanja).toBe('Račun 14/POSL1/1');
  });

  it('parseHub3Payload treba vratiti null za neispravan format zaglavlja', () => {
    expect(parseHub3Payload('NEVALJAN_HEADER\nEUR\n000000000012550')).toBeNull();
    expect(parseHub3Payload('')).toBeNull();
  });
});
