import React, { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  type AudioQueueItem,
  type AudioTransportStatus,
  type TtsEngine,
  prepareMessageForNarration,
  selectBestMasculineVoice,
  classifyVoice,
  DEFAULT_ZIGO_VOICE_CONFIG,
} from '@obrtniq/core';
import { googleTtsService } from '../services/google-tts-service';
import { appLogger } from '../services/logger';

export interface AudioTransportContextValue {
  queue: AudioQueueItem[];
  currentIndex: number;
  status: AudioTransportStatus;
  activeItem: AudioQueueItem | null;
  isMuted: boolean;
  autoRead: boolean;

  // TTS motor i konfiguracija glasova
  ttsEngine: TtsEngine;
  setTtsEngine: (engine: TtsEngine) => void;
  isGoogleTtsConfigured: boolean;

  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceURI: string;
  voicePitch: number;
  voiceRate: number;
  currentVoice: SpeechSynthesisVoice | null;
  setVoiceURI: (uri: string) => void;
  setVoicePitch: (pitch: number) => void;
  setVoiceRate: (rate: number) => void;
  resetVoiceSettings: () => void;

  playMessage: (messageId: string, text: string) => void;
  enqueueMessage: (messageId: string, text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  clearQueue: () => void;
  reloadVoices: () => void;
  toggleMute: () => void;
  toggleAutoRead: () => void;
  skipNext: () => void;
  skipPrev: () => void;
}

const AudioTransportContext = createContext<AudioTransportContextValue | null>(null);

const STORAGE_KEY_MUTED = 'obrtniq_audio_muted';
const STORAGE_KEY_AUTOREAD = 'obrtniq_auto_read';
const STORAGE_KEY_VOICE_URI = 'obrtniq_preferred_voice_uri';
const STORAGE_KEY_VOICE_PITCH = 'obrtniq_voice_pitch';
const STORAGE_KEY_VOICE_RATE = 'obrtniq_voice_rate';
const STORAGE_KEY_TTS_ENGINE = 'obrtniq_tts_engine';

export const AudioTransportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const logger = appLogger.scope('AUDIO:TRANSPORT');

  const [queue, setQueue] = useState<AudioQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [status, setStatus] = useState<AudioTransportStatus>('idle');
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_MUTED) === 'true';
    } catch {
      return false;
    }
  });
  const [autoRead, setAutoRead] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_AUTOREAD) === 'true';
    } catch {
      return false;
    }
  });

  // Odabir primarnog motora (Google Cloud TTS vs Lokalni preglednik)
  const [ttsEngine, setTtsEngineState] = useState<TtsEngine>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TTS_ENGINE) as TtsEngine;
      return stored === 'google_cloud' || stored === 'browser' ? stored : DEFAULT_ZIGO_VOICE_CONFIG.engine;
    } catch {
      return DEFAULT_ZIGO_VOICE_CONFIG.engine;
    }
  });
  const ttsEngineRef = useRef<TtsEngine>(ttsEngine);
  ttsEngineRef.current = ttsEngine;

  const [isGoogleTtsConfigured, setIsGoogleTtsConfigured] = useState<boolean>(() => {
    return googleTtsService.isConfigured();
  });

  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Dostupni glasovi i korisničke preference sinteze govora
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_VOICE_URI) || '';
    } catch {
      return '';
    }
  });
  const [voicePitch, setVoicePitch] = useState<number>(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY_VOICE_PITCH);
      return val ? parseFloat(val) : DEFAULT_ZIGO_VOICE_CONFIG.pitch;
    } catch {
      return DEFAULT_ZIGO_VOICE_CONFIG.pitch;
    }
  });
  const [voiceRate, setVoiceRate] = useState<number>(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY_VOICE_RATE);
      return val ? parseFloat(val) : DEFAULT_ZIGO_VOICE_CONFIG.rate;
    } catch {
      return DEFAULT_ZIGO_VOICE_CONFIG.rate;
    }
  });

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const queueRef = useRef<AudioQueueItem[]>(queue);
  queueRef.current = queue;

  const currentIndexRef = useRef<number>(currentIndex);
  currentIndexRef.current = currentIndex;

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const selectedVoiceURIRef = useRef<string>(selectedVoiceURI);
  selectedVoiceURIRef.current = selectedVoiceURI;

  const voicePitchRef = useRef<number>(voicePitch);
  voicePitchRef.current = voicePitch;

  const voiceRateRef = useRef<number>(voiceRate);
  voiceRateRef.current = voiceRate;

  // Učitavanje i sinkronizacija glasova iz Web SpeechSynthesis API-ja
  const loadVoices = useCallback(() => {
    setIsGoogleTtsConfigured(googleTtsService.isConfigured());
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const available = window.speechSynthesis.getVoices();
      if (available && available.length > 0) {
        voicesRef.current = available;
        setAvailableVoices(available);
      }
    } catch {
      // Tihi fallback
    }
  }, []);

  useEffect(() => {
    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    const timers = [100, 300, 800, 2000].map((t) => setTimeout(loadVoices, t));
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [loadVoices]);

  // Trenutno odabrani ili optimalni muški glas za lik viteza Orlanda
  const currentVoice = useMemo(() => {
    return selectBestMasculineVoice(availableVoices, selectedVoiceURI || undefined);
  }, [availableVoices, selectedVoiceURI]);

  const getResolvedVoice = useCallback((): SpeechSynthesisVoice | null => {
    const list = availableVoices.length > 0 ? availableVoices : voicesRef.current;
    return selectBestMasculineVoice(list, selectedVoiceURIRef.current || undefined);
  }, [availableVoices]);

  // Watchdog za sprječavanje zamrzavanja Chromium sintetizatora
  useEffect(() => {
    if (status !== 'playing') return;
    const interval = setInterval(() => {
      if (
        typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        window.speechSynthesis.speaking &&
        !window.speechSynthesis.paused
      ) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [status]);

  // Izvršavanje izgovora pojedinačne stavke (Single Active Speaker Invariant)
  const speakCurrentItem = useCallback(
    async (item: AudioQueueItem, targetIndex: number) => {
      if (isMutedRef.current) {
        logger.debug('Izgovor preskočen jer je zvuk utišan (MUTE aktivan)');
        return;
      }

      // Single Active Speaker: trenutno prekini sve prethodne izgovore (HTML5 Audio + Web Speech)
      if (audioElementRef.current) {
        try {
          audioElementRef.current.pause();
          audioElementRef.current.currentTime = 0;
          audioElementRef.current = null;
        } catch {}
      }

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {
          logger.debug('Greška pri speechSynthesis.cancel():', e);
        }
      }

      const advanceQueue = () => {
        const nextIndex = targetIndex + 1;
        const currentQ = queueRef.current;
        if (nextIndex < currentQ.length && currentQ[nextIndex]) {
          speakCurrentItem(currentQ[nextIndex]!, nextIndex);
        } else {
          logger.info('Dovršeno čitanje cijele playliste');
          setStatus('idle');
          setCurrentIndex(-1);
          setQueue([]);
        }
      };

      const fallbackToWebSpeech = () => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
          logger.warn('Web SpeechSynthesis API nije podržan u ovom pregledniku.');
          setStatus('idle');
          return;
        }

        const voice = getResolvedVoice();
        let effectivePitch = voicePitchRef.current;

        if (voice) {
          const classification = classifyVoice(voice);
          if (classification.isFemale && voicePitchRef.current >= 0.86) {
            effectivePitch = 0.78;
          }
        }

        logger.info('Aktiviran lokalni Web Speech izgovor (Microsoft/Preglednički fallback):', {
          label: item.label,
          messageId: item.messageId,
          sectionIndex: item.sectionIndex,
          duljina: item.cleanTextForSpeech.length,
          glas: voice?.name || 'Zadani sustav',
          pitch: effectivePitch,
          rate: voiceRateRef.current,
        });

        const utterance = new SpeechSynthesisUtterance(item.cleanTextForSpeech);
        utterance.lang = voice?.lang || 'hr-HR';
        utterance.rate = voiceRateRef.current;
        utterance.pitch = effectivePitch;

        if (voice) {
          utterance.voice = voice;
        }

        utterance.onstart = () => {
          setStatus('playing');
          setCurrentIndex(targetIndex);
        };

        utterance.onend = () => {
          logger.debug('Web Speech završio izgovor stavke:', { label: item.label, index: targetIndex });
          advanceQueue();
        };

        utterance.onerror = (e: any) => {
          if (e.error === 'canceled' || e.error === 'interrupted') {
            logger.debug('Web Speech izgovor prekinut (STOP ili novi unos).');
          } else {
            logger.warn('SpeechSynthesis greška:', { error: e?.error });
            setStatus('idle');
          }
        };

        try {
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          logger.error('Neuspješan poziv speechSynthesis.speak:', err);
          setStatus('idle');
        }
      };

      // 1. Primarni pokušaj: Google Cloud Text-to-Speech API
      if (ttsEngineRef.current === 'google_cloud' && googleTtsService.isConfigured()) {
        try {
          logger.info('Pokrećem sintezu preko Google Cloud Text-to-Speech API:', {
            label: item.label,
            tekstSnippet: item.cleanTextForSpeech.slice(0, 40),
          });

          const pitchSemitones = Math.round((voicePitchRef.current - 1.0) * 15 * 10) / 10;
          const { audioUrl } = await googleTtsService.synthesize(item.cleanTextForSpeech, {
            speakingRate: voiceRateRef.current,
            pitchSemitones,
          });

          if (isMutedRef.current) return;

          const audio = new Audio(audioUrl);
          audioElementRef.current = audio;

          audio.onplay = () => {
            setStatus('playing');
            setCurrentIndex(targetIndex);
          };

          audio.onended = () => {
            logger.debug('Google TTS završio izgovor stavke:', { label: item.label, index: targetIndex });
            audioElementRef.current = null;
            advanceQueue();
          };

          audio.onerror = (e) => {
            logger.warn('Greška pri reprodukciji Google TTS audio zapisa, prebacujem na Web Speech fallback:', e);
            audioElementRef.current = null;
            fallbackToWebSpeech();
          };

          await audio.play();
          return;
        } catch (err: any) {
          logger.warn('Google Cloud TTS sinteza nije uspjela, automatski aktiviram lokalni Web Speech fallback:', {
            poruka: err?.message,
          });
          // Ne prekidamo izgovor — glatki prijelaz na lokalni Web Speech
        }
      }

      // 2. Lokalni motor ili Fallback: Web Speech Synthesis API
      fallbackToWebSpeech();
    },
    [getResolvedVoice, logger]
  );

  // Metode za upravljanje TTS postavkama
  const setTtsEngine = useCallback(
    (engine: TtsEngine) => {
      setTtsEngineState(engine);
      try {
        localStorage.setItem(STORAGE_KEY_TTS_ENGINE, engine);
      } catch {
        // Tihi fallback
      }
      logger.info('Promijenjen primarni TTS motor:', { engine });
    },
    [logger]
  );

  const setVoiceURI = useCallback(
    (uri: string) => {
      setSelectedVoiceURI(uri);
      try {
        if (uri) {
          localStorage.setItem(STORAGE_KEY_VOICE_URI, uri);
        } else {
          localStorage.removeItem(STORAGE_KEY_VOICE_URI);
        }
      } catch {
        // Tihi fallback
      }
      logger.info('Promijenjen odabrani TTS glas:', { voiceURI: uri || 'AUTOMATSKI' });
    },
    [logger]
  );

  const setVoicePitchHandler = useCallback((pitch: number) => {
    const clamped = Math.max(0.5, Math.min(1.5, Math.round(pitch * 100) / 100));
    setVoicePitch(clamped);
    try {
      localStorage.setItem(STORAGE_KEY_VOICE_PITCH, String(clamped));
    } catch {
      // Tihi fallback
    }
  }, []);

  const setVoiceRateHandler = useCallback((rate: number) => {
    const clamped = Math.max(0.5, Math.min(1.5, Math.round(rate * 100) / 100));
    setVoiceRate(clamped);
    try {
      localStorage.setItem(STORAGE_KEY_VOICE_RATE, String(clamped));
    } catch {
      // Tihi fallback
    }
  }, []);

  const resetVoiceSettings = useCallback(() => {
    setSelectedVoiceURI('');
    setVoicePitch(DEFAULT_ZIGO_VOICE_CONFIG.pitch);
    setVoiceRate(DEFAULT_ZIGO_VOICE_CONFIG.rate);
    try {
      localStorage.removeItem(STORAGE_KEY_VOICE_URI);
      localStorage.setItem(STORAGE_KEY_VOICE_PITCH, String(DEFAULT_ZIGO_VOICE_CONFIG.pitch));
      localStorage.setItem(STORAGE_KEY_VOICE_RATE, String(DEFAULT_ZIGO_VOICE_CONFIG.rate));
    } catch {
      // Tihi fallback
    }
    logger.info('Postavke glasa Žiga vraćene na zadane viteške vrijednosti');
  }, [logger]);

  // 1. Pokretanje čitanja određene poruke (zamjenjuje trenutnu playlistu)
  const playMessage = useCallback(
    (messageId: string, text: string) => {
      const items = prepareMessageForNarration(messageId, text);
      if (items.length === 0) {
        logger.warn('Nema teksta za naraciju u poruci:', { messageId });
        return;
      }

      logger.info('Učitana poruka za naraciju u playlistu:', {
        messageId,
        brojElemenata: items.length,
      });

      setQueue(items);
      setCurrentIndex(0);
      speakCurrentItem(items[0]!, 0);
    },
    [speakCurrentItem, logger]
  );

  // 2. Dodavanje poruke na kraj reda
  const enqueueMessage = useCallback(
    (messageId: string, text: string) => {
      const items = prepareMessageForNarration(messageId, text);
      if (items.length === 0) return;

      setQueue((prev) => {
        const updated = [...prev, ...items];
        if (status === 'idle') {
          setTimeout(() => {
            speakCurrentItem(updated[0]!, 0);
          }, 0);
        }
        return updated;
      });
    },
    [status, speakCurrentItem]
  );

  // 3. Globalni STOP (trenutačni prekid i pražnjenje liste)
  const stop = useCallback(() => {
    logger.info('Globalni STOP: trenutačni prekid audio naracije i pražnjenje reda');
    if (audioElementRef.current) {
      try {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
        audioElementRef.current = null;
      } catch {
        // Tihi fallback
      }
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Tihi fallback
      }
    }
    setStatus('stopped');
    setQueue([]);
    setCurrentIndex(-1);
    setTimeout(() => setStatus('idle'), 50);
  }, [logger]);

  // 3b. Eksplicitno čišćenje reda i zaustavljanje
  const clearQueue = useCallback(() => {
    logger.info('Eksplicitno pražnjenje audio transport reda i reset stanja');
    if (audioElementRef.current) {
      try {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
        audioElementRef.current = null;
      } catch {
        // Tihi fallback
      }
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Tihi fallback
      }
    }
    setQueue([]);
    setCurrentIndex(-1);
    setStatus('idle');
  }, [logger]);

  // 3c. Ponovno osvježavanje dostupnih sintetiziranih glasova
  const reloadVoices = useCallback(() => {
    setIsGoogleTtsConfigured(googleTtsService.isConfigured());
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const available = window.speechSynthesis.getVoices();
        voicesRef.current = available;
        setAvailableVoices(available);
        logger.info('Glasovi audio transporta ponovno sinkronizirani', {
          brojGlasova: available.length,
          googleTtsKonfiguriran: googleTtsService.isConfigured(),
        });
      } catch (err) {
        logger.debug('Greška pri dohvaćanju glasova:', err);
      }
    }
  }, [logger]);

  // 4. Pauza
  const pause = useCallback(() => {
    if (audioElementRef.current && !audioElementRef.current.paused) {
      try {
        audioElementRef.current.pause();
      } catch {
        // Tihi fallback
      }
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
      } catch {
        // Tihi fallback
      }
    }
    setStatus('paused');
    logger.debug('Audio naracija pauzirana.');
  }, [logger]);

  // 5. Nastavak
  const resume = useCallback(() => {
    if (audioElementRef.current && audioElementRef.current.paused) {
      try {
        audioElementRef.current.play().catch(() => {});
        setStatus('playing');
        logger.debug('Google TTS reprodukcija nastavljena.');
        return;
      } catch {
        // Tihi fallback
      }
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        setStatus('playing');
        logger.debug('Audio naracija nastavljena.');
      } catch {
        // Tihi fallback
      }
    }
  }, [logger]);

  // 6. Utišavanje (Mute / Unmute)
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_MUTED, String(next));
      } catch {
        // Tihi fallback
      }
      if (next) {
        if (audioElementRef.current) {
          try {
            audioElementRef.current.pause();
            audioElementRef.current = null;
          } catch {
            // Tihi fallback
          }
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
          } catch {
            // Tihi fallback
          }
        }
        setStatus('idle');
      }
      return next;
    });
  }, []);

  // 7. Auto-Read prekidač
  const toggleAutoRead = useCallback(() => {
    setAutoRead((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_AUTOREAD, String(next));
      } catch {
        // Tihi fallback
      }
      logger.info('Postavka Auto-čitaj promijenjena:', { autoRead: next });
      return next;
    });
  }, [logger]);

  // 8. Preskakanje na idući element
  const skipNext = useCallback(() => {
    const nextIdx = currentIndexRef.current + 1;
    const currentQ = queueRef.current;
    if (nextIdx < currentQ.length && currentQ[nextIdx]) {
      speakCurrentItem(currentQ[nextIdx]!, nextIdx);
    } else {
      stop();
    }
  }, [speakCurrentItem, stop]);

  // 9. Povratak na prethodni element
  const skipPrev = useCallback(() => {
    const prevIdx = currentIndexRef.current - 1;
    const currentQ = queueRef.current;
    if (prevIdx >= 0 && currentQ[prevIdx]) {
      speakCurrentItem(currentQ[prevIdx]!, prevIdx);
    }
  }, [speakCurrentItem]);

  const activeItem = currentIndex >= 0 && queue[currentIndex] ? queue[currentIndex] || null : null;

  return (
    <AudioTransportContext.Provider
      value={{
        queue,
        currentIndex,
        status,
        activeItem,
        isMuted,
        autoRead,
        ttsEngine,
        setTtsEngine,
        isGoogleTtsConfigured,
        availableVoices,
        selectedVoiceURI,
        voicePitch,
        voiceRate,
        currentVoice,
        setVoiceURI,
        setVoicePitch: setVoicePitchHandler,
        setVoiceRate: setVoiceRateHandler,
        resetVoiceSettings,
        playMessage,
        enqueueMessage,
        pause,
        resume,
        stop,
        clearQueue,
        reloadVoices,
        toggleMute,
        toggleAutoRead,
        skipNext,
        skipPrev,
      }}
    >
      {children}
    </AudioTransportContext.Provider>
  );
};

export function useAudioTransport(): AudioTransportContextValue {
  const ctx = useContext(AudioTransportContext);
  if (!ctx) {
    throw new Error('useAudioTransport must be used within an AudioTransportProvider');
  }
  return ctx;
}
