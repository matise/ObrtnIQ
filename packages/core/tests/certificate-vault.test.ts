// packages/core/tests/certificate-vault.test.ts

import { describe, it, expect } from 'vitest';
import {
  FINA_DEMO_CERTIFICATE,
  encryptPrivateKeyWithPin,
  decryptPrivateKeyWithPin,
  validateCertificateMetadata,
} from '../src/domain/certificate-vault';

describe('Web Crypto Trezor Certifikata (Certificate Vault)', () => {
  it('ima valjani ugrađeni FINA DEMO certifikat usklađen s ISO 7064 OIB pravilima', () => {
    const val = validateCertificateMetadata(FINA_DEMO_CERTIFICATE);
    expect(val.validan).toBe(true);
    expect(val.greske).toHaveLength(0);
    expect(FINA_DEMO_CERTIFICATE.jeDemo).toBe(true);
  });

  it('uspješno enkriptira i dekriptira privatni ključ pomoću ispravnog korisničkog PIN-a', async () => {
    const testPrivateKeyPem = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...[TEST KEY]...=\n-----END RSA PRIVATE KEY-----';
    const pin = '1234';

    const vaultEntry = await encryptPrivateKeyWithPin(
      testPrivateKeyPem,
      pin,
      FINA_DEMO_CERTIFICATE
    );

    expect(vaultEntry.encryptedPrivateKeyBase64).toBeDefined();
    expect(vaultEntry.saltBase64).toBeDefined();
    expect(vaultEntry.ivBase64).toBeDefined();
    expect(vaultEntry.encryptedPrivateKeyBase64).not.toBe(testPrivateKeyPem);

    // Dekripcija s točnim PIN-om
    const decrypted = await decryptPrivateKeyWithPin(vaultEntry, pin);
    expect(decrypted).toBe(testPrivateKeyPem);
  });

  it('odbija dekripciju i baca grešku ako se unese pogrešan PIN', async () => {
    const testKey = 'SUPER_SECRET_PRIVATE_KEY';
    const vaultEntry = await encryptPrivateKeyWithPin(
      testKey,
      '9999',
      FINA_DEMO_CERTIFICATE
    );

    // Pokušaj dekripcije s krivim PIN-om
    await expect(decryptPrivateKeyWithPin(vaultEntry, '0000')).rejects.toThrow(
      /Neispravan PIN/
    );
  });

  it('detektira istekli certifikat ili neispravan OIB', () => {
    const invalidCert = {
      ...FINA_DEMO_CERTIFICATE,
      oib: '11111111111', // Nevažeći OIB
      vrijediDo: '2020-01-01T00:00:00Z', // Istekao
    };

    const val = validateCertificateMetadata(invalidCert);
    expect(val.validan).toBe(false);
    expect(val.greske.some((g) => g.includes('OIB'))).toBe(true);
    expect(val.greske.some((g) => g.includes('istekao'))).toBe(true);
  });
});
