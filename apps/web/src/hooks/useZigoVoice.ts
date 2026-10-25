import { useState, useRef, useCallback, useEffect } from 'react';
import {
  normalizeZigoVoiceTranscript,
  getZigoDumanjeLabel,
  type ScreenContextData,
  type ZigoSttEngine,
  type ZigoSttConfig,
} from '@obrtniq/core';
import { googleSttService } from '../services/google-stt-service';
import { appLogger } from '../services/logger';

// Tipizacija za Web Speech API koji može imati webkit prefiks
interface IWindowSpeechRecognition extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export interface UseZigoVoiceOptions {
  screenContext?: ScreenContextData;
  onFinalTranscript?: (text: string) => Promise<void> | void;
  onStop?: () => void;
}

export interface UseZigoVoiceReturn {
  isSupported: boolean;
  isRecording: boolean;
  isDumando: boolean;
  interimText: string;
  finalText: string;
  errorMessage: string | null;
  dumanjeLabel: string;
  activeEngine: ZigoSttEngine;
  sttConfig: ZigoSttConfig;
  startListening: () => Promise<void>;
  stopListening: () => void;
  stopAll: () => void; // STOP tipka: trenutačni prekid i abort svih dumanja
}

export function useZigoVoice(options: UseZigoVoiceOptions = {}): UseZigoVoiceReturn {
  const logger = appLogger.scope('VOICE:STT');

  const [isSupported, setIsSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isDumando, setIsDumando] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sttConfig, setSttConfig] = useState<ZigoSttConfig>(() => googleSttService.getConfig());

  const recognitionRef = useRef<any>(null);
  const isExplicitStopRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Provjera podrške u pregledniku (Chromium, Edge, Safari, itd.)
  useEffect(() => {
    const win = window as IWindowSpeechRecognition;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setIsSupported(false);
      logger.warn('Web Speech API nije podržan u ovom pregledniku.');
    }
  }, [logger]);

  // Trenutačni prekid svega (STOP dugme)
  const stopAll = useCallback(() => {
    logger.info('STOP: Korisnik zatražio trenutačni prekid audio prepoznavanja i dumanja');
    isExplicitStopRef.current = true;

    if (recognitionRef.current) {
      try {
        // abort() odmah prekida bez čekanja zaostalih međuspremnika
        recognitionRef.current.abort();
      } catch (err) {
        logger.debug('Pogreška pri abortu SpeechRecognition:', err);
      }
      recognitionRef.current = null;
    }

    setIsRecording(false);
    setIsDumando(false);
    setInterimText('');

    if (optionsRef.current.onStop) {
      optionsRef.current.onStop();
    }
  }, [logger]);

  const stopListening = useCallback(() => {
    logger.debug('Korisnik zaustavio govor');
    isExplicitStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Tihi fallback ako je već zaustavljeno
      }
    }
    setIsRecording(false);
  }, [logger]);

  const startListening = useCallback(async () => {
    stopAll();
    setErrorMessage(null);
    setInterimText('');
    setFinalText('');
    isExplicitStopRef.current = false;

    const win = window as IWindowSpeechRecognition;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      const msg = 'Tvoj preglednik ne podržava Web Speech API. Koristi Google Chrome, Brave ili Edge.';
      setErrorMessage(msg);
      logger.warn(msg);
      return;
    }

    const latestConfig = googleSttService.getConfig();
    setSttConfig(latestConfig);

    try {
      const recognition = new SpeechRec();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'hr-HR';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        logger.info('Audio snimanje pokrenuto', {
          engine: latestConfig.engine,
          model: latestConfig.engine === 'gcp_stt_v2' ? latestConfig.gcpModel : 'browser-native',
          lang: 'hr-HR',
        });
        setIsRecording(true);
        setIsDumando(false);
      };

      recognition.onresult = async (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item?.[0]?.transcript || '';

          if (item.isFinal) {
            currentFinal += transcript;
          } else {
            currentInterim += transcript;
          }
        }

        if (currentInterim) {
          setInterimText(currentInterim);
        }

        if (currentFinal) {
          // Primjena klijentskog normalizatora za dubrovački govor i fiskalne pojmove
          const normalized = normalizeZigoVoiceTranscript(currentFinal);
          logger.info('Prepoznat konačni govor:', { sirovo: currentFinal, normalizirano: normalized });

          setFinalText(normalized);
          setInterimText('');
          setIsDumando(true);

          if (optionsRef.current.onFinalTranscript && normalized.trim()) {
            try {
              await optionsRef.current.onFinalTranscript(normalized.trim());
            } finally {
              setIsDumando(false);
            }
          }
        }
      };

      recognition.onerror = (event: any) => {
        const errorType = event?.error;
        logger.warn('SpeechRecognition greška:', { error: errorType });

        if (errorType === 'not-allowed') {
          setErrorMessage('Pristup mikrofonu je odbijen u pregledniku. Omogući mikrofon u postavkama stranice.');
          stopAll();
        } else if (errorType === 'no-speech') {
          // Korisnik je šutio, ne prekidamo
        } else if (errorType === 'network') {
          setErrorMessage('Mrežna greška pri pregledničkom prepoznavanju govora.');
          stopAll();
        } else if (!isExplicitStopRef.current) {
          setErrorMessage(`Greška glasovnog unosa: ${errorType}`);
        }
      };

      recognition.onend = () => {
        logger.debug('SpeechRecognition završio rad.');
        // Ako korisnik nije eksplicitno stisnuo stop i još je u modu snimanja, osvježi
        if (!isExplicitStopRef.current && isRecording) {
          try {
            recognition.start();
            return;
          } catch {
            // Završi ako ponovni start ne uspije
          }
        }
        setIsRecording(false);
      };

      recognition.start();
    } catch (err: any) {
      logger.error('Neuspješno pokretanje prepoznavanja govora:', err);
      setErrorMessage(err?.message || 'Greška pri pokretanju mikrofona.');
      stopAll();
    }
  }, [stopAll, isRecording, logger]);

  // Čišćenje pri demontaži
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Tihi fallback
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const dumanjeLabel = getZigoDumanjeLabel(options.screenContext?.currentScreen || '');

  return {
    isSupported,
    isRecording,
    isDumando,
    interimText,
    finalText,
    errorMessage,
    dumanjeLabel,
    activeEngine: sttConfig.engine,
    sttConfig,
    startListening,
    stopListening,
    stopAll,
  };
}
