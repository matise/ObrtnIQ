// packages/core/src/domain/audio-transport.ts

/**
 * Tipovi sekcija u Žigovoj poruci koji odgovaraju semantičkim cjelinama.
 */
export type ZigoAudioSectionType =
  | 'opservacija'
  | 'dijagnoza'
  | 'rez'
  | 'stogori'
  | 'stoceka'
  | 'akcijasad'
  | 'intro'
  | 'general';

/**
 * Stavka u redu čekanja za reprodukciju zvuka (Audio Playlist Item).
 */
export interface AudioQueueItem {
  id: string; // npr. 'msg-1730000000-sec-0'
  messageId: string;
  sectionIndex: number;
  sectionType: ZigoAudioSectionType;
  label: string; // npr. '1. Opservacija', '2. Dijagnoza', '3. Žigin Rez'
  rawText: string;
  cleanTextForSpeech: string;
}

/**
 * Status globalnog sustava za reprodukciju zvuka (Master Audio Transport).
 */
export type AudioTransportStatus = 'idle' | 'playing' | 'paused' | 'stopped';

/**
 * Motor za sintezu govora (Text-to-Speech / TTS).
 * - 'google_cloud': Google Cloud Text-to-Speech API (v1 / v1beta1 REST) s Wavenet muškim baritonom.
 * - 'browser': Lokalni Web Speech Synthesis API (Microsoft Matej / instalirani glasovi).
 */
export type TtsEngine = 'google_cloud' | 'browser';

/**
 * Konfiguracijski parametri za Google Cloud Text-to-Speech V1/V2 REST API.
 */
export interface GoogleTtsConfig {
  engine: TtsEngine;
  apiKey: string;
  useSttApiKey: boolean; // Automatski preuzmi ključ iz STT konfiguracije ako je prazan
  languageCode: string; // Zadano: 'hr-HR'
  voiceName: string; // npr. 'hr-HR-Wavenet-B'
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  audioEncoding: 'MP3' | 'OGG_OPUS';
  speakingRate: number; // 0.25 do 4.0 (zadano 0.94)
  pitchSemitones: number; // -20.0 do 20.0 (zadano -2.0 za duboki viteški bariton)
}

/**
 * Zadani parametri za Google Cloud Text-to-Speech motor.
 */
export const DEFAULT_GOOGLE_TTS_CONFIG: GoogleTtsConfig = {
  engine: 'google_cloud',
  apiKey: '',
  useSttApiKey: true,
  languageCode: 'hr-HR',
  voiceName: 'hr-HR-Wavenet-B',
  ssmlGender: 'MALE',
  audioEncoding: 'MP3',
  speakingRate: 0.94,
  pitchSemitones: -2.0,
};

/**
 * Konfiguracija naratora i postavke izgovora.
 */
export interface VoiceNarratorConfig {
  engine: TtsEngine; // Primarni motor za izgovor (google_cloud ili browser)
  rate: number; // Brzina izgovora (zadano 0.94 za miran, stoički ritam)
  pitch: number; // Visina tona (zadano 0.86 za duboki autoritativni bariton viteza Orlanda)
  autoRead: boolean; // Automatsko čitanje novih pristiglih poruka
  isMuted: boolean; // Utišano stanje
  preferredVoiceURI?: string; // Korisnički odabran identifikator lokalnog pregledničkog glasa
  googleTts?: GoogleTtsConfig; // Google Cloud TTS postavke
}

/**
 * Validira konfiguraciju za Google Cloud TTS pozive.
 */
export function validateGoogleTtsConfig(
  config: Partial<GoogleTtsConfig>,
  fallbackApiKey?: string
): {
  isValid: boolean;
  effectiveApiKey: string;
  error?: string;
} {
  const effectiveKey =
    (config.apiKey || '').trim() ||
    (fallbackApiKey || '').trim() ||
    (config.useSttApiKey ? (fallbackApiKey || '').trim() : '');

  if (!effectiveKey) {
    return {
      isValid: false,
      effectiveApiKey: '',
      error:
        'Google Cloud API ključ nije pronađen. Unesite ključ ili omogućite dijeljenje ključa iz aplikacije.',
    };
  }

  const isApiKey = effectiveKey.startsWith('AIza') && effectiveKey.length >= 35;
  const isOAuthToken = effectiveKey.startsWith('ya29.') && effectiveKey.length >= 30;

  if (!isApiKey && !isOAuthToken) {
    return {
      isValid: false,
      effectiveApiKey: effectiveKey,
      error: 'Google Cloud API ključ mora započinjati s "AIza..." i imati barem 35 znakova.',
    };
  }

  if (config.speakingRate !== undefined && (config.speakingRate < 0.25 || config.speakingRate > 4.0)) {
    return {
      isValid: false,
      effectiveApiKey: effectiveKey,
      error: 'Brzina govora mora biti između 0.25 i 4.0.',
    };
  }

  if (config.pitchSemitones !== undefined && (config.pitchSemitones < -20.0 || config.pitchSemitones > 20.0)) {
    return {
      isValid: false,
      effectiveApiKey: effectiveKey,
      error: 'Visina tona mora biti u rasponu od -20.0 do 20.0 polutonova.',
    };
  }

  return {
    isValid: true,
    effectiveApiKey: effectiveKey,
  };
}

/**
 * Zadani parametri za glas viteza Orlanda (Žiga).
 */
export const DEFAULT_ZIGO_VOICE_CONFIG: VoiceNarratorConfig = {
  engine: 'google_cloud',
  rate: 0.94,
  pitch: 0.86,
  autoRead: false,
  isMuted: false,
  googleTts: DEFAULT_GOOGLE_TTS_CONFIG,
};

/**
 * Deskriptor glasa koji odgovara Web SpeechSynthesisVoice sučelju
 * i omogućuje čisto testiranje u svim okruženjima.
 */
export interface VoiceDescriptor {
  name: string;
  lang: string;
  voiceURI?: string;
  default?: boolean;
}

/**
 * Rezultat klasifikacije glasa prema jeziku, spolu i prikladnosti za Žiga.
 */
export interface ClassifiedVoice<T extends VoiceDescriptor = VoiceDescriptor> {
  voice: T;
  isCroatian: boolean;
  isSlavic: boolean;
  isMale: boolean;
  isFemale: boolean;
  score: number;
}

/**
 * Poznate oznake i imena ženskih glasova sintetizatora (kako bismo izbjegli piskutav ženski glas).
 */
export const FEMALE_VOICE_MARKERS = [
  'female',
  'woman',
  'girl',
  'femme',
  'donna',
  'gabrijela',
  'gabriela',
  'zira',
  'hazel',
  'susan',
  'catherine',
  'samantha',
  'victoria',
  'karen',
  'jenny',
  'aria',
  'sonia',
  'kalina',
  'nevena',
  'jelena',
  'ana',
  'marija',
  'ivana',
  'petra',
  'elena',
  'linda',
  'mia',
  'maja',
  'sanja',
  'vesna',
  'dora',
  'nina',
  'ivanka',
  'tina',
  'branka',
];

/**
 * Poznate oznake i imena muških glasova sintetizatora (idealan bariton za Žiga).
 */
export const MALE_VOICE_MARKERS = [
  'male',
  'man',
  'boy',
  'homme',
  'uomo',
  'matej',
  'ivan',
  'luka',
  'marko',
  'goran',
  'filip',
  'stefan',
  'nikola',
  'josip',
  'antonio',
  'milan',
  'dragan',
  'boris',
  'tomislav',
  'davor',
  'vedran',
  'petar',
  'mario',
  'igor',
  'damir',
  'zeljko',
  'željko',
  'david',
  'guy',
  'george',
  'mark',
  'james',
  'daniel',
  'oliver',
  'alex',
  'fred',
  'thomas',
  'paul',
  'brian',
  'richard',
];

/**
 * Klasificira glas i dodjeljuje mu bodove prema prikladnosti za lik viteza Orlanda.
 */
export function classifyVoice<T extends VoiceDescriptor>(
  voice: T,
  preferredURI?: string
): ClassifiedVoice<T> {
  const nameLower = (voice.name || '').toLowerCase();
  const langLower = (voice.lang || '').toLowerCase();
  const uri = voice.voiceURI || voice.name || '';

  const isCroatian = langLower.startsWith('hr');
  const isSlavic =
    isCroatian ||
    langLower.startsWith('sr') ||
    langLower.startsWith('bs') ||
    langLower.startsWith('sl') ||
    langLower.startsWith('mk');

  // Provjera ženskih i muških markera
  const isFemale = FEMALE_VOICE_MARKERS.some((marker) => nameLower.includes(marker));
  const isMale = !isFemale && MALE_VOICE_MARKERS.some((marker) => nameLower.includes(marker));

  let score = 0;

  // 1. Ako je korisnik izričito odabrao ovaj glas putem postavki (apsolutni prioritet)
  if (preferredURI && (uri === preferredURI || voice.name === preferredURI)) {
    score += 10000;
  }

  // 2. Bodovanje prema jeziku i spolu (Žigo je zreo muškarac, dubrovački vitez)
  if (isCroatian) {
    if (isMale) {
      score += 2000; // Idealan izbor: Hrvatski muški glas (npr. Microsoft Matej)
    } else if (!isFemale) {
      score += 1400; // Hrvatski glas neutralnog imena (npr. Google hrvatski)
    } else {
      score += 900; // Hrvatski ženski glas (npr. Gabrijela) — zadnji hrvatski izbor
    }
  } else if (isSlavic) {
    if (isMale) {
      score += 1200; // Južnoslavenski muški glas (npr. Nikola, Stefan, Filip)
    } else if (!isFemale) {
      score += 800;
    } else {
      score += 400;
    }
  } else {
    // Neslavenski jezici (npr. en-US)
    if (isMale) {
      score += 300; // npr. Microsoft David, George
    } else {
      score += 50;
    }
  }

  if (voice.default) {
    score += 10;
  }

  return {
    voice,
    isCroatian,
    isSlavic,
    isMale,
    isFemale,
    score,
  };
}

/**
 * Bira optimalni muški glas za Žiga iz popisa dostupnih glasova preglednika.
 */
export function selectBestMasculineVoice<T extends VoiceDescriptor>(
  voices: T[],
  preferredURI?: string
): T | null {
  if (!voices || voices.length === 0) return null;

  const classified = voices.map((v) => classifyVoice(v, preferredURI));
  classified.sort((a, b) => b.score - a.score);

  return classified[0]?.voice || null;
}

/**
 * Čisti Markdown sintaksu i prilagođava akronime za razgovijetnu glasovnu sintezu.
 */
export function cleanTextForSpeech(rawText: string): string {
  if (!rawText || !rawText.trim()) return '';

  let text = rawText.trim();

  // 1. Uklanjanje Markdown slika i poveznica
  text = text.replace(/!\[.*?\]\(.*?\)/g, ''); // Slike
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Poveznice -> samo tekst

  // 2. Uklanjanje Markdown blokova koda i inline koda
  text = text.replace(/```[\s\S]*?```/g, 'blok koda');
  text = text.replace(/`([^`]+)`/g, '$1');

  // 3. Uklanjanje Markdown formatiranja (bold, italic, strikethrough, headers)
  text = text.replace(/#{1,6}\s+/g, '');
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/__(.*?)__/g, '$1');
  text = text.replace(/\*(.*?)\*/g, '$1');
  text = text.replace(/_(.*?)_/g, '$1');
  text = text.replace(/~~(.*?)~~/g, '$1');

  // 4. Uklanjanje oznaka listi i horizontalnih linija
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');
  text = text.replace(/^\s*[-*_]{3,}\s*$/gm, '');

  // 5. Fonetska optimizacija fiskalnih i zakonskih kratica za prirodniji izgovor
  text = text.replace(/\bKPR\b/g, 'K P R');
  text = text.replace(/\bOIB\b/g, 'O I B');
  text = text.replace(/\bZKI\b/g, 'Z K I');
  text = text.replace(/\bJIR\b/g, 'J I R');
  text = text.replace(/\bPO-SD\b/gi, 'P O S D obrazac');
  text = text.replace(/\bKPD\b/g, 'K P D');
  text = text.replace(/\bMOD\s+11\b/gi, 'mod jedanaest');
  text = text.replace(/\bMOD\s+97\b/gi, 'mod devedeset sedam');
  text = text.replace(/\bPDV\b/g, 'P D V');
  text = text.replace(/\bHZZO\b/g, 'H Z Z O');
  text = text.replace(/\bFINA\b/g, 'Fina');
  text = text.replace(/\bIBAN\b/g, 'I B A N');
  text = text.replace(/\bFRO\b/g, 'F R O');
  text = text.replace(/\bEP\b/g, 'E P');

  // 6. Zamjena valuta, iznosa i postotaka
  text = text.replace(/(\d+)[.,](\d{2})\s*(?:€|EUR|eura)/gi, '$1 i $2 centi');
  text = text.replace(/(\d+)\s*(?:€|EUR|eura)/gi, '$1 eura');
  text = text.replace(/€/g, ' eura');
  text = text.replace(/\bEUR\b/g, ' eura');
  text = text.replace(/(\d+)\s*%/g, '$1 posto');
  text = text.replace(/40\.000/g, 'četrdeset tisuća');
  text = text.replace(/\b40000\b/g, 'četrdeset tisuća');

  // Uklanjanje višestrukih razmaka i novih redaka
  return text.replace(/\s+/g, ' ').trim();
}

const SECTION_HEADER_REGEX =
  /(?:^|\n)\s*(?:#{1,6}\s+)?(?:\*{1,2})?(?:(\d+)\.\s*)?(Opservacija|Dijagnoza|Žigin Rez|Orlandov Rez|Što gori(?:\s*\(<24h\))?|Što čeka|Akcija sad):?(?:\*{1,2})?:?\s*/gi;

/**
 * Raščlanjuje sirovu Žiginu poruku na semantičke elemente spremne za asinkronu glasovnu reprodukciju (AudioQueueItem[]).
 */
export function prepareMessageForNarration(
  messageId: string,
  rawText: string
): AudioQueueItem[] {
  if (!rawText || !rawText.trim()) return [];

  const matches: Array<{
    startIndex: number;
    endIndex: number;
    rawTitle: string;
    sectionType: ZigoAudioSectionType;
  }> = [];

  let match: RegExpExecArray | null;
  while ((match = SECTION_HEADER_REGEX.exec(rawText)) !== null) {
    const rawTitle = (match[2] || '').trim();
    const lower = rawTitle.toLowerCase();
    let sectionType: ZigoAudioSectionType = 'general';

    if (lower.includes('opservacija')) {
      sectionType = 'opservacija';
    } else if (lower.includes('dijagnoza')) {
      sectionType = 'dijagnoza';
    } else if (lower.includes('rez')) {
      sectionType = 'rez';
    } else if (lower.includes('gori')) {
      sectionType = 'stogori';
    } else if (lower.includes('čeka') || lower.includes('ceka')) {
      sectionType = 'stoceka';
    } else if (lower.includes('akcija')) {
      sectionType = 'akcijasad';
    }

    matches.push({
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      rawTitle,
      sectionType,
    });
  }

  // Ako nema nijednog prepoznatog zaglavlja sekcije, cijeli tekst tretiramo kao jedan element
  if (matches.length === 0) {
    const cleaned = cleanTextForSpeech(rawText);
    if (!cleaned) return [];
    return [
      {
        id: `${messageId}-sec-0`,
        messageId,
        sectionIndex: 0,
        sectionType: 'general',
        label: 'Žigo govori',
        rawText: rawText.trim(),
        cleanTextForSpeech: cleaned,
      },
    ];
  }

  const items: AudioQueueItem[] = [];
  let itemIndex = 0;

  // 1. Ako postoji uvodni tekst prije prvog zaglavlja (npr. pozdrav)
  if (matches[0] && matches[0].startIndex > 0) {
    const introRaw = rawText.slice(0, matches[0].startIndex).trim();
    const introClean = cleanTextForSpeech(introRaw);
    if (introClean) {
      items.push({
        id: `${messageId}-sec-${itemIndex++}`,
        messageId,
        sectionIndex: 0,
        sectionType: 'intro',
        label: 'Uvod',
        rawText: introRaw,
        cleanTextForSpeech: introClean,
      });
    }
  }

  // 2. Obrada pojedinačnih sekcija
  for (let i = 0; i < matches.length; i++) {
    const curr = matches[i];
    if (!curr) continue;
    const nextStart = i + 1 < matches.length ? matches[i + 1]?.startIndex : rawText.length;
    const sectionContent = rawText.slice(curr.endIndex, nextStart).trim();
    const cleanContent = cleanTextForSpeech(sectionContent);

    if (!cleanContent) continue;

    let label = curr.rawTitle;
    switch (curr.sectionType) {
      case 'opservacija':
        label = '1. Opservacija';
        break;
      case 'dijagnoza':
        label = '2. Dijagnoza';
        break;
      case 'rez':
        label = '3. Žigin Rez';
        break;
      case 'stogori':
        label = 'Što gori';
        break;
      case 'stoceka':
        label = 'Što čeka';
        break;
      case 'akcijasad':
        label = 'Akcija sad';
        break;
    }

    items.push({
      id: `${messageId}-sec-${itemIndex++}`,
      messageId,
      sectionIndex: i + (items.length > 0 && items[0]?.sectionType === 'intro' ? 1 : 0),
      sectionType: curr.sectionType,
      label,
      rawText: sectionContent,
      cleanTextForSpeech: `${label}. ${cleanContent}`,
    });
  }

  return items;
}
