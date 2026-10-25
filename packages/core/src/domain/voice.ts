// packages/core/src/domain/voice.ts

/**
 * Podaci o kontekstu radne plohe koji se šalju STT poslužitelju
 * radi prilagodbe i sinkronizacije stanja sa Žigom.
 */
export interface ScreenContextData {
  currentScreen: 'InvoiceDesk' | 'KprDrawer' | 'SettingsDrawer' | 'FiscalDrawer' | 'PartnerDrawer' | 'ArticleDrawer' | 'SystemLogDrawer' | string;
  totalRevenueYTD: number;
  revenueLimit: number; // Obično 40.000 € (prag za paušalni obrt)
  unpaidInvoicesCount: number;
  timestamp?: string;
}

/**
 * Protokol WebSocket poruka između klijentskog sučelja i STT streaming gatewaya.
 */
export type ZigoVoiceMessageType = 'INIT' | 'STOP' | 'INTERIM' | 'FINAL' | 'REPLY_READY' | 'ERROR';

export interface ZigoVoiceInitMessage {
  type: 'INIT';
  screenContext: ScreenContextData;
}

export interface ZigoVoiceStopMessage {
  type: 'STOP';
}

export interface ZigoVoiceInterimMessage {
  type: 'INTERIM';
  transcript: string;
}

export interface ZigoVoiceFinalMessage {
  type: 'FINAL';
  transcript: string;
}

export interface ZigoVoiceReplyReadyMessage {
  type: 'REPLY_READY';
}

export interface ZigoVoiceErrorMessage {
  type: 'ERROR';
  error: string;
}

export type ZigoVoiceServerMessage =
  | ZigoVoiceInterimMessage
  | ZigoVoiceFinalMessage
  | ZigoVoiceReplyReadyMessage
  | ZigoVoiceErrorMessage;

export type ZigoVoiceClientMessage =
  | ZigoVoiceInitMessage
  | ZigoVoiceStopMessage;

/**
 * Rječnik i težine fraza za Google Cloud Speech-to-Text V2 (SpeechAdaptation / PhraseSet).
 */
export interface AdaptationPhrase {
  value: string;
  boost: number;
}

export const ZIGO_DUBROVNIK_PHRASES: readonly AdaptationPhrase[] = [
  { value: 'duman', boost: 15.0 },
  { value: 'nema preše', boost: 12.0 },
  { value: 'Orlando', boost: 10.0 },
  { value: 'orlandov lakat', boost: 15.0 },
  { value: 'Senat', boost: 10.0 },
  { value: 'spenza', boost: 12.0 },
  { value: 'čeljade', boost: 10.0 },
  { value: 'gledan', boost: 12.0 },
  { value: 'računan', boost: 12.0 },
  { value: 'vidihnuh', boost: 10.0 },
  { value: 'gosparu', boost: 12.0 },
  { value: 'fjaka', boost: 10.0 },
  { value: 'šesan', boost: 10.0 },
  { value: 'rabota', boost: 10.0 },
] as const;

export const ZIGO_FISCAL_PHRASES: readonly AdaptationPhrase[] = [
  { value: 'KPR', boost: 15.0 },
  { value: 'knjiga prometa', boost: 12.0 },
  { value: 'prag od 40000 eura', boost: 15.0 },
  { value: 'fiskalni certifikat', boost: 12.0 },
  { value: 'paušalni obrt', boost: 12.0 },
  { value: 'JIR', boost: 15.0 },
  { value: 'ZKI', boost: 15.0 },
  { value: 'OIB', boost: 10.0 },
  { value: 'KPD 2025', boost: 12.0 },
  { value: 'e-Račun', boost: 12.0 },
  { value: 'PO-SD', boost: 15.0 },
  { value: 'Žigo, presijeci', boost: 15.0 },
] as const;

/**
 * Vraća autentični dubrovački status dumanja ovisno o aktivnom ekranu.
 */
export function getZigoDumanjeLabel(currentScreen: string): string {
  switch (currentScreen) {
    case 'KprDrawer':
    case 'KPR':
      return 'Žigo duma nad poreznin limiton i stavkama knjige...';
    case 'InvoiceDesk':
    case 'INVOICE_CREATE':
      return 'Žigo duma nad iznoson računa i pragom od 40.000 €...';
    case 'FiscalDrawer':
    case 'CERTIFICATES':
      return 'Žigo duma nad valjanošću fiskalnog pečata...';
    case 'SettingsDrawer':
      return 'Žigo provjerava ključeve i trezore sustava...';
    case 'SystemLogDrawer':
      return 'Žigo prebire po bilješkama u dnevniku...';
    default:
      return 'Žigo duma nad stanjem obrta...';
  }
}

/**
 * Klijentski leksički normalizator za prepoznavanje govora (In-Browser Speech Adaptation).
 * 
 * Preglednički Web Speech API često fonetski razdvaja kratice (npr. "k p r", "z k i", "o i b")
 * ili transkribira standardne izraze malim slovima. Ovaj normalizator u milisekundi,
 * 100% unutar korisničkog preglednika bez ikakvog poslužitelja, prevodi prepoznati govor
 * u kanonske domenske pojmove sustava ObrtnIQ.
 */
export function normalizeZigoVoiceTranscript(rawText: string): string {
  if (!rawText || !rawText.trim()) return '';

  let normalized = rawText.trim();

  // 1. Fiskalne i računovodstvene kratice (razmaknuta slova, točke, crtice)
  normalized = normalized.replace(/(?<![a-z0-9čćžšđ])k[\s\.\-]?p[\s\.\-]?r\.?(?![a-z0-9čćžšđ])/giu, 'KPR');
  normalized = normalized.replace(/(?<![a-z0-9čćžšđ])knjig[aeiou]?\s+prometa(?![a-z0-9čćžšđ])/giu, 'KPR');
  normalized = normalized.replace(/(?<![a-z0-9čćžšđ])z[\s\.\-]?k[\s\.\-]?i\.?(?![a-z0-9čćžšđ])/giu, 'ZKI');
  normalized = normalized.replace(/(?<![a-z0-9čćžšđ])j[\s\.\-]?i[\s\.\-]?r\.?(?![a-z0-9čćžšđ])/giu, 'JIR');
  normalized = normalized.replace(/(?<![a-z0-9čćžšđ])o[\s\.\-]?i[\s\.\-]?b\.?(?![a-z0-9čćžšđ])/giu, 'OIB');
  normalized = normalized.replace(/(?<![a-z0-9čćžšđ])p[\s\.\-]?o[\s\.\-]?s[\s\.\-]?d\.?(?![a-z0-9čćžšđ])/giu, 'PO-SD');
  normalized = normalized.replace(/(?<![a-z0-9čćžšđ])k[\s\.\-]?p[\s\.\-]?d\.?(?![a-z0-9čćžšđ])/giu, 'KPD');
  normalized = normalized.replace(/(?<![a-z0-9čćžšđ])e[\s\-]ra[čc]un[aeiou]?(?![a-z0-9čćžšđ])/giu, 'e-Račun');

  // 2. Porezni pragi i brojevi
  normalized = normalized.replace(/prag(?:u|om|a)?\s+(?:od\s+)?(?:40000|40\.000|40\s+tisu[ćc]a)(?:\s*(?:eura|euri|€))?/giu, 'prag od 40.000 €');

  // 3. Posebne naredbe Žigu
  normalized = normalized.replace(/(?<![a-z0-9čćžšđ])(?:žigo|zigo)[,]?\s+presi?j?eci(?![a-z0-9čćžšđ])/giu, 'Žigo, presijeci');
  normalized = normalized.replace(/(?<![a-z0-9čćžšđ])orlandov[\s]+lakat(?![a-z0-9čćžšđ])/giu, 'Orlandov lakat');

  // 4. Dubrovački leksik (kapitalizacija i pravopis)
  normalized = normalized.replace(/(?<![a-z0-9čćžšđ])nema[\s]+pre[sš]e(?![a-z0-9čćžšđ])/giu, 'nema preše');

  // Uklanjanje višestrukih razmaka
  return normalized.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Odabir mehanizma za prepoznavanje govora (STT Engine).
 * - 'browser': Nativni Web Speech API u klijentu (besplatno, bez konfiguracije).
 * - 'gcp_stt_v2': Google Cloud Speech-to-Text V2 s modelom Chirp 2 (BYOK model).
 */
export type ZigoSttEngine = 'browser' | 'gcp_stt_v2';

/**
 * Način autorizacije prema Google Cloud Speech-to-Text V2:
 * - 'service_account': GCP Service Account JSON ključ (Preporučeno za streaming & gRPC).
 * - 'api_key': Klasični Google API ključ (Samo sinkroni REST pozivi).
 */
export type GcpSttAuthMode = 'service_account' | 'api_key';

/**
 * Konfiguracijski model za Speech-to-Text postavke.
 */
export interface ZigoSttConfig {
  engine: ZigoSttEngine;
  authMode: GcpSttAuthMode;
  gcpApiKey: string;
  gcpProjectId: string;
  gcpServiceAccountJson?: string;
  gcpClientEmail?: string;
  gcpLocation: string;
  gcpRecognizerId: string;
  gcpModel: 'chirp_2' | 'chirp' | 'latest_short' | 'long' | 'short';
  enablePhraseAdaptation: boolean;
}

/**
 * Zadane početne postavke za STT modul.
 */
export const DEFAULT_ZIGO_STT_CONFIG: ZigoSttConfig = {
  engine: 'browser',
  authMode: 'service_account',
  gcpApiKey: '',
  gcpProjectId: '',
  gcpServiceAccountJson: '',
  gcpClientEmail: '',
  gcpLocation: 'eu',
  gcpRecognizerId: 'zigo-recognizer-chirp2',
  gcpModel: 'chirp_2',
  enablePhraseAdaptation: true,
};

/**
 * Pomoćna funkcija za parsiranje i provjeru Service Account JSON ključa.
 */
export function parseServiceAccountJson(jsonString: string): {
  isValid: boolean;
  projectId?: string;
  clientEmail?: string;
  privateKeyId?: string;
  error?: string;
} {
  if (!jsonString || !jsonString.trim()) {
    return { isValid: false, error: 'Service Account JSON je prazan.' };
  }

  try {
    const parsed = JSON.parse(jsonString.trim());
    if (parsed.type !== 'service_account') {
      return { isValid: false, error: 'Učitana datoteka nije GCP Service Account ključ (nedostaje type: "service_account").' };
    }
    if (!parsed.project_id) {
      return { isValid: false, error: 'Service Account JSON ne sadrži "project_id".' };
    }
    if (!parsed.private_key) {
      return { isValid: false, error: 'Service Account JSON ne sadrži "private_key".' };
    }
    if (!parsed.client_email) {
      return { isValid: false, error: 'Service Account JSON ne sadrži "client_email".' };
    }

    return {
      isValid: true,
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKeyId: parsed.private_key_id,
    };
  } catch (err: any) {
    return { isValid: false, error: `Nevaljan JSON format: ${err?.message || 'Greška parsiranja'}` };
  }
}

/**
 * Rezultat statičke validacije GCP STT V2 postavki.
 */
export interface GcpSttValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Statička provjera valjanosti konfiguracije za Google Cloud Speech-to-Text V2.
 */
export function validateGcpSttConfig(config: Partial<ZigoSttConfig>): GcpSttValidationResult {
  const errors: Record<string, string> = {};

  // Ako se koristi lokalni preglednički motor, nisu potrebne GCP postavke
  if (config.engine === 'browser' || !config.engine) {
    return { isValid: true, errors };
  }

  const authMode = config.authMode || (config.gcpServiceAccountJson ? 'service_account' : 'api_key');

  // 1. Validacija autorizacije ovisno o authMode
  if (authMode === 'service_account') {
    const json = config.gcpServiceAccountJson?.trim() || '';
    if (!json) {
      errors.gcpServiceAccountJson = 'Service Account JSON ključ je obavezan za streaming način rada.';
    } else {
      const saParsed = parseServiceAccountJson(json);
      if (!saParsed.isValid) {
        errors.gcpServiceAccountJson = saParsed.error || 'Nevaljan Service Account JSON.';
      }
    }
  } else {
    // Klasični API ključ
    const key = config.gcpApiKey?.trim() || '';
    if (!key) {
      errors.gcpApiKey = 'Google Cloud API ključ je obavezan za REST STT V2.';
    } else if (!key.startsWith('AIza')) {
      errors.gcpApiKey = 'Nevaljan format: Google API ključ mora započinjati s "AIza".';
    } else if (key.length < 35) {
      errors.gcpApiKey = 'Google API ključ je prekratak (očekuje se 39 znakova).';
    }
  }

  // 2. Validacija Project ID-ja
  const projectId = config.gcpProjectId?.trim() || '';
  const projectIdRegex = /^[a-z0-9][a-z0-9\-]{4,28}[a-z0-9]$/;
  if (!projectId) {
    errors.gcpProjectId = 'GCP Project ID je obavezan.';
  } else if (!projectIdRegex.test(projectId)) {
    errors.gcpProjectId = 'Nevaljan Project ID: mora imati 6-30 malih slova, brojeva ili crtica i ne smije završavati crticom.';
  }

  // 3. Validacija lokacije
  const location = config.gcpLocation?.trim() || '';
  if (!location) {
    errors.gcpLocation = 'Lokacija je obavezna (preporučeno: "eu").';
  }

  // 4. Validacija Recognizer ID-ja (ako je naveden)
  const recognizerId = config.gcpRecognizerId?.trim() || '';
  if (recognizerId && !/^[a-z0-9\-_]{1,63}$/i.test(recognizerId)) {
    errors.gcpRecognizerId = 'Recognizer ID smije sadržavati samo slova, brojeve, crtice i podvlake (max 63 znaka).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

