import { describe, it, expect } from 'vitest';
import { 
  buildIdentitySecret, 
  encryptBackupWithGoogleSub, 
  decryptBackupWithGoogleSub,
  type ObrtnIQBackupData 
} from '../src';

describe('FAZA 10: Google Identity kao Kriptografsko Sidro (Web Crypto PBKDF2 + AES-GCM)', () => {
  const dummyGoogleSub = '108392174981273981273';
  const dummyBackupData: ObrtnIQBackupData = {
    shemaVerzija: '3.0',
    sustav: 'ObrtnIQ',
    datumIzvoza: new Date().toISOString(),
    obrt: {
      id: 'obrt-1',
      naziv: 'Matija Cloud Softver, obrt',
      vlasnikImePrezime: 'Matija Obrtnik',
      oib: '69435151530',
      ulicaIBroj: 'Ilica 20',
      postanskiBroj: '10000',
      mjesto: 'Zagreb',
      drzavaIso: 'HR',
      email: 'matija@obrtniq.cloud',
      iban: 'HR1223600001101234567',
      jePausalist: true,
      uSustavuPdv: false,
      poslovniProstorOznaka: 'POSL1',
      naplatniUredjajOznaka: '1',
      eracunPosrednik: 'FINA',
      authIdentity: {
        provider: 'GOOGLE',
        googleSub: dummyGoogleSub,
        email: 'matija@obrtniq.cloud',
        name: 'Matija Obrtnik',
      },
    },
    partneri: [
      {
        id: 'part-1',
        tipPartnera: 'PRAVNA_OSOBA',
        naziv: 'Cloud Klijent d.o.o.',
        oib: '01234567896',
        adresa: 'Savska 10',
        postanskiBroj: '10000',
        grad: 'Zagreb',
        drzavaIso: 'HR',
        poreznaZona: 'DOMACI_B2B',
        aktivan: true,
      },
    ],
    artikli: [
      {
        id: 'art-1',
        kpdSifra: '62.01.11',
        naziv: 'Razvoj Cloud rješenja',
        jedinicaMjere: 'sat',
        cijenaOsnovica: 80.0,
        stopaPdv: 0,
        pdvKategorijaPoreza: 'E',
        jeUsluga: true,
        aktivan: true,
      },
    ],
    dokumenti: [],
    kpr: [],
  };

  it('V10-1: buildIdentitySecret validira Google Sub i formatira tajni seed', () => {
    expect(() => buildIdentitySecret('')).toThrow();
    expect(() => buildIdentitySecret('123')).toThrow();

    const secretWithoutPin = buildIdentitySecret(dummyGoogleSub);
    expect(secretWithoutPin).toBe(`OBRTNIQ:GOOGLE_SUB:${dummyGoogleSub}`);

    const secretWithPin = buildIdentitySecret(dummyGoogleSub, '9876');
    expect(secretWithPin).toBe(`OBRTNIQ:GOOGLE_SUB:${dummyGoogleSub}:9876`);
  });

  it('V10-2: Kriptiranje i dekripcija sigurnosne kopije pomoću Google Sub identifikatora', async () => {
    // 1. Kriptiranje arhive
    const envelope = await encryptBackupWithGoogleSub(dummyBackupData, dummyGoogleSub);
    expect(envelope.format).toBe('OBRTNIQ-AES-256-GCM');
    expect(envelope.salt).toBeDefined();
    expect(envelope.iv).toBeDefined();
    expect(envelope.ciphertext).toBeDefined();

    // 2. Dekripcija s točnim Google Sub-om
    const decrypted = await decryptBackupWithGoogleSub(envelope, dummyGoogleSub);
    expect(decrypted.shemaVerzija).toBe('3.0');
    expect(decrypted.obrt?.naziv).toBe('Matija Cloud Softver, obrt');
    expect(decrypted.partneri).toHaveLength(1);
    expect(decrypted.artikli).toHaveLength(1);
    expect(decrypted.artikli[0]?.kpdSifra).toBe('62.01.11');

    // 3. Dekripcija s drugim Google Sub-om mora biti odbijena
    const pogresanGoogleSub = '999999999999999999999';
    await expect(decryptBackupWithGoogleSub(envelope, pogresanGoogleSub)).rejects.toThrow();
  });

  it('V10-3: Google Sub s opcionalnim PIN-om dodatno štiti arhivu', async () => {
    const pin = '4321';
    const envelope = await encryptBackupWithGoogleSub(dummyBackupData, dummyGoogleSub, pin);

    // Točan Sub + točan PIN
    const decrypted = await decryptBackupWithGoogleSub(envelope, dummyGoogleSub, pin);
    expect(decrypted.obrt?.oib).toBe('69435151530');

    // Točan Sub, ali krivi PIN
    await expect(decryptBackupWithGoogleSub(envelope, dummyGoogleSub, '0000')).rejects.toThrow();

    // Točan Sub, ali bez PIN-a
    await expect(decryptBackupWithGoogleSub(envelope, dummyGoogleSub)).rejects.toThrow();
  });
});
