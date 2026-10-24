// packages/core/src/domain/certificate-vault.ts

import { validateOib } from '../utils/oib';

export interface CertificateMetadata {
  id: string;
  naziv: string; // Npr. "FINA Fiskalni DEMO Certifikat"
  oib: string;   // OIB subjekta iz certifikata
  serijskiBroj: string;
  izdavatelj: string; // Npr. "FINA RDC 2020 CA"
  vrijediOd: string;  // ISO datum
  vrijediDo: string;  // ISO datum
  jeIstekao: boolean;
  jeDemo: boolean;
}

export interface StoredEncryptedVaultEntry {
  metadata: CertificateMetadata;
  encryptedPrivateKeyBase64: string; // AES-256-GCM enkriptirani privatni ključ
  saltBase64: string;
  ivBase64: string;
  certificatePem: string; // Javni certifikat (ne treba biti enkriptiran)
}

/**
 * Ugrađeni FINA DEMO certifikat i metapodaci za razvoj i testno okruženje Porezne uprave
 */
export const FINA_DEMO_CERTIFICATE: CertificateMetadata = {
  id: 'fina-demo-default-2026',
  naziv: 'FINA DEMO Certifikat za Fiskalizaciju',
  oib: '79102730089',
  serijskiBroj: '4A2F8B91CD34E567',
  izdavatelj: 'FINA DEMO Root CA',
  vrijediOd: '2026-01-01T00:00:00Z',
  vrijediDo: '2028-12-31T23:59:59Z',
  jeIstekao: false,
  jeDemo: true,
};

function getSubtle(): SubtleCrypto {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (!c || !c.subtle) {
    throw new Error('Web Crypto API nije dostupan za upravljanje trezorom certifikata.');
  }
  return c.subtle;
}

/**
 * Iz korisničkog PIN-a izvodi AES-256-GCM ključ pomoću PBKDF2 s 100.000 iteracija
 */
async function deriveKeyFromPin(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = getSubtle();
  const enc = new TextEncoder();
  const baseKey = await subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Enkriptira privatni ključ pomoću korisničkog PIN-a (AES-256-GCM)
 */
export async function encryptPrivateKeyWithPin(
  privateKeyPemOrBytes: string | Uint8Array,
  pin: string,
  metadata: CertificateMetadata
): Promise<StoredEncryptedVaultEntry> {
  const subtle = getSubtle();
  const salt = new Uint8Array(16);
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    globalThis.crypto.getRandomValues(salt);
  } else {
    for (let i = 0; i < 16; i++) salt[i] = Math.floor(Math.random() * 256);
  }

  const iv = new Uint8Array(12);
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    globalThis.crypto.getRandomValues(iv);
  } else {
    for (let i = 0; i < 12; i++) iv[i] = Math.floor(Math.random() * 256);
  }

  const aesKey = await deriveKeyFromPin(pin, salt);
  const dataBytes = typeof privateKeyPemOrBytes === 'string'
    ? new TextEncoder().encode(privateKeyPemOrBytes)
    : privateKeyPemOrBytes;

  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    aesKey,
    dataBytes as unknown as BufferSource
  );

  function bufToBase64(b: ArrayBuffer | Uint8Array): string {
    const arr = b instanceof Uint8Array ? b : new Uint8Array(b);
    let s = '';
    for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]!);
    return btoa(s);
  }

  return {
    metadata,
    encryptedPrivateKeyBase64: bufToBase64(ciphertext),
    saltBase64: bufToBase64(salt),
    ivBase64: bufToBase64(iv),
    certificatePem: '-----BEGIN CERTIFICATE-----\nMIID...[FINA DEMO]...==\n-----END CERTIFICATE-----',
  };
}

/**
 * Dekriptira privatni ključ iz trezora pomoću korisničkog PIN-a
 */
export async function decryptPrivateKeyWithPin(
  entry: StoredEncryptedVaultEntry,
  pin: string
): Promise<string> {
  const subtle = getSubtle();

  function base64ToBuf(b64: string): Uint8Array {
    const s = atob(b64);
    const arr = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) arr[i] = s.charCodeAt(i);
    return arr;
  }

  const salt = base64ToBuf(entry.saltBase64);
  const iv = base64ToBuf(entry.ivBase64);
  const ciphertext = base64ToBuf(entry.encryptedPrivateKeyBase64);

  const aesKey = await deriveKeyFromPin(pin, salt);

  try {
    const decrypted = await subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      aesKey,
      ciphertext as unknown as BufferSource
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error('Neispravan PIN ili oštećeni podaci u trezoru certifikata.');
  }
}

/**
 * Provjerava valjanost metapodataka certifikata prema datumu i OIB-u
 */
export function validateCertificateMetadata(meta: CertificateMetadata): {
  validan: boolean;
  greske: string[];
} {
  const greske: string[] = [];
  if (!validateOib(meta.oib)) {
    greske.push(`Neispravan OIB subjekta na certifikatu: ${meta.oib}`);
  }

  const sad = new Date();
  const doDatuma = new Date(meta.vrijediDo);
  const odDatuma = new Date(meta.vrijediOd);

  if (sad > doDatuma) {
    greske.push(`Certifikat je istekao dana ${doDatuma.toLocaleDateString('hr-HR')}.`);
  }

  if (sad < odDatuma) {
    greske.push(`Certifikat još nije postao važeći (vrijedi od ${odDatuma.toLocaleDateString('hr-HR')}).`);
  }

  return {
    validan: greske.length === 0,
    greske,
  };
}
