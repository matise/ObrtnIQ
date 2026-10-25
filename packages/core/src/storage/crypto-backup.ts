import type { IObrtnIQStorage } from './interfaces';
import type { 
  ObrtProfil, 
  Partner, 
  Artikl, 
  Dokument, 
  NaplataPromet,
  ZigoChatSesija,
  ZigoChatPoruka
} from '../domain/types';

export interface ObrtnIQBackupData {
  shemaVerzija: '3.0';
  sustav: 'ObrtnIQ';
  datumIzvoza: string;
  obrt: ObrtProfil | null;
  partneri: Partner[];
  artikli: Artikl[];
  dokumenti: Dokument[];
  kpr: NaplataPromet[];
  chatSesije?: ZigoChatSesija[];
  chatPoruke?: ZigoChatPoruka[];
  troskovi?: any[];
  doprinosi?: any[];
}

export interface EncryptedPayloadEnvelope {
  format: 'OBRTNIQ-AES-256-GCM';
  salt: string; // Base64
  iv: string;   // Base64
  ciphertext: string; // Base64
}

/**
 * Pomoćna funkcija za dohvat Web Crypto API-ja (radi i u browseru i u Node.js okruženju)
 */
function getSubtleCrypto(): SubtleCrypto {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (!c || !c.subtle) {
    throw new Error('Web Crypto API (crypto.subtle) nije podržan u ovom okruženju.');
  }
  return c.subtle;
}

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Kreira kompletan JSON snapshot svih podataka iz repozitorija
 */
export async function createBackupSnapshot(storage: IObrtnIQStorage): Promise<ObrtnIQBackupData> {
  const obrt = await storage.obrt.getProfil();
  const partneri = await storage.partneri.getAll();
  const artikli = await storage.artikli.getAll();
  const dokumenti = await storage.dokumenti.getAll();
  const kpr = await storage.kpr.getAll();

  let chatSesije: ZigoChatSesija[] | undefined;
  let chatPoruke: ZigoChatPoruka[] | undefined;

  if (storage.chat) {
    chatSesije = await storage.chat.getAllSesije();
    const allPoruke: ZigoChatPoruka[] = [];
    for (const sesija of chatSesije) {
      const msgs = await storage.chat.getPorukeBySesijaId(sesija.id);
      allPoruke.push(...msgs);
    }
    chatPoruke = allPoruke;
  }

  let troskovi: any[] | undefined;
  if (storage.troskovi) {
    troskovi = await storage.troskovi.getAll();
  }

  let doprinosi: any[] | undefined;
  if (storage.doprinosi) {
    doprinosi = await storage.doprinosi.getAllUplate();
  }

  return {
    shemaVerzija: '3.0',
    sustav: 'ObrtnIQ',
    datumIzvoza: new Date().toISOString(),
    obrt,
    partneri,
    artikli,
    dokumenti,
    kpr,
    chatSesije,
    chatPoruke,
    troskovi,
    doprinosi,
  };
}

/**
 * Vraća podatke iz JSON snapshota u repozitorij (zamjenjuje ili nadopunjuje postojeće)
 */
export async function restoreBackupSnapshot(
  storage: IObrtnIQStorage, 
  backup: ObrtnIQBackupData,
  ocistiPrijeUnosa: boolean = true
): Promise<void> {
  if (backup.sustav !== 'ObrtnIQ') {
    throw new Error('Neispravan format sigurnosne kopije (nepoznat sustav).');
  }

  if (ocistiPrijeUnosa) {
    await storage.clearAll();
  }

  if (backup.obrt) {
    await storage.obrt.saveProfil(backup.obrt);
  }

  for (const partner of backup.partneri) {
    await storage.partneri.save(partner);
  }

  for (const artikl of backup.artikli) {
    await storage.artikli.save(artikl);
  }

  for (const dokument of backup.dokumenti) {
    await storage.dokumenti.save(dokument);
  }

  for (const kprStavka of backup.kpr) {
    await storage.kpr.save(kprStavka);
  }

  if (storage.chat) {
    if (backup.chatSesije && backup.chatSesije.length > 0) {
      for (const sesija of backup.chatSesije) {
        await storage.chat.saveSesija(sesija);
      }
    }
    if (backup.chatPoruke && backup.chatPoruke.length > 0) {
      for (const poruka of backup.chatPoruke) {
        await storage.chat.savePoruka(poruka);
      }
    }
  }

  if (storage.troskovi && backup.troskovi && backup.troskovi.length > 0) {
    for (const trosak of backup.troskovi) {
      await storage.troskovi.save(trosak);
    }
  }

  if (storage.doprinosi && backup.doprinosi && backup.doprinosi.length > 0) {
    for (const doprinos of backup.doprinosi) {
      await storage.doprinosi.saveUplata(doprinos);
    }
  }
}

/**
 * Kriptira sigurnosnu kopiju lozinkom koristeći AES-256-GCM i PBKDF2 izvođenje ključa
 */
export async function encryptBackupData(
  data: ObrtnIQBackupData, 
  lozinka: string
): Promise<string> {
  if (!lozinka || lozinka.length < 4) {
    throw new Error('Lozinka za enkripciju mora imati najmanje 4 znaka.');
  }

  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  // Generiraj slučajni salt (16 bajtova) i IV (12 bajtova)
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));

  // Uvezi sirovu lozinku kao ključ
  const passwordKey = await subtle.importKey(
    'raw',
    encoder.encode(lozinka),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Izvedi AES-256-GCM ključ pomoću PBKDF2 (100.000 iteracija, SHA-256)
  const aesKey = await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  // Kriptiraj podatke
  const ciphertextBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    aesKey,
    plaintext
  );

  const envelope: EncryptedPayloadEnvelope = {
    format: 'OBRTNIQ-AES-256-GCM',
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
  };

  return JSON.stringify(envelope);
}

/**
 * Dekriptira šifriranu sigurnosnu kopiju pomoću korisničke lozinke
 */
export async function decryptBackupData(
  encryptedEnvelopeJson: string, 
  lozinka: string
): Promise<ObrtnIQBackupData> {
  const envelope: EncryptedPayloadEnvelope = JSON.parse(encryptedEnvelopeJson);

  if (envelope.format !== 'OBRTNIQ-AES-256-GCM') {
    throw new Error('Nepoznat ili nepodržan format šifrirane arhive.');
  }

  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();
  const salt = base64ToArrayBuffer(envelope.salt);
  const iv = base64ToArrayBuffer(envelope.iv);
  const ciphertext = base64ToArrayBuffer(envelope.ciphertext);

  const passwordKey = await subtle.importKey(
    'raw',
    encoder.encode(lozinka),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const aesKey = await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  try {
    const decryptedBuffer = await subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      aesKey,
      ciphertext as BufferSource
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString) as ObrtnIQBackupData;
  } catch {
    throw new Error('Dekripcija nije uspjela. Pogrešna lozinka ili oštećena datoteka.');
  }
}

/**
 * Kriptira sigurnosnu kopiju i vraća strukturirani objekt kuverte (EncryptedPayloadEnvelope)
 */
export async function encryptBackup(
  data: ObrtnIQBackupData,
  lozinka: string
): Promise<EncryptedPayloadEnvelope> {
  const jsonString = await encryptBackupData(data, lozinka);
  return JSON.parse(jsonString) as EncryptedPayloadEnvelope;
}

/**
 * Dekriptira sigurnosnu kopiju iz objekta kuverte ili JSON stringa
 */
export async function decryptBackup(
  envelopeOrJson: EncryptedPayloadEnvelope | string,
  lozinka: string
): Promise<ObrtnIQBackupData> {
  const jsonString = typeof envelopeOrJson === 'string' 
    ? envelopeOrJson 
    : JSON.stringify(envelopeOrJson);
  return decryptBackupData(jsonString, lozinka);
}

/**
 * Pomoćna funkcija za formiranje tajnog seeda iz Google sub identifikatora i opcionalnog korisničkog PIN-a
 */
export function buildIdentitySecret(googleSub: string, userPin?: string): string {
  if (!googleSub || googleSub.trim().length < 5) {
    throw new Error('Google Sub identifikator mora sadržavati valjan ID.');
  }
  return `OBRTNIQ:GOOGLE_SUB:${googleSub.trim()}${userPin ? `:${userPin.trim()}` : ''}`;
}

/**
 * Kriptira sigurnosnu kopiju koristeći Google Sub identifikator korisnika kao kriptografsko sidro
 */
export async function encryptBackupWithGoogleSub(
  data: ObrtnIQBackupData,
  googleSub: string,
  userPin?: string
): Promise<EncryptedPayloadEnvelope> {
  const secret = buildIdentitySecret(googleSub, userPin);
  return encryptBackup(data, secret);
}

/**
 * Dekriptira sigurnosnu kopiju koristeći Google Sub identifikator korisnika kao kriptografsko sidro
 */
export async function decryptBackupWithGoogleSub(
  envelopeOrJson: EncryptedPayloadEnvelope | string,
  googleSub: string,
  userPin?: string
): Promise<ObrtnIQBackupData> {
  const secret = buildIdentitySecret(googleSub, userPin);
  return decryptBackup(envelopeOrJson, secret);
}
