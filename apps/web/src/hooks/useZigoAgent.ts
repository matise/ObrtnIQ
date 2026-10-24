import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { 
  ZigoChatSesija, 
  ZigoChatPoruka, 
  ZigoAttachment,
  ZigoToolCall,
  ZigoToolResult 
} from '@obrtniq/core';
import { dexieStorage } from '../storage/dexie-db';
import { geminiService } from '../services/gemini-service';
import { executeZigoTool, type ZigoToolsContext } from '../services/zigo-tools-dispatcher';
import { appLogger } from '../services/logger';

export interface UseZigoAgentOptions {
  toolsContext?: ZigoToolsContext;
  apiKeyOverride?: string;
}

export interface UseZigoAgentReturn {
  sesije: ZigoChatSesija[];
  aktivnaSesija: ZigoChatSesija | null;
  poruke: ZigoChatPoruka[];
  isThinking: boolean;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (val: boolean) => void;
  toggleDrawer: () => void;
  stvoriNovuSesiju: (naslov?: string) => Promise<string>;
  odaberiSesiju: (sesijaId: string) => Promise<void>;
  obrisiSesiju: (sesijaId: string) => Promise<void>;
  posaljiPoruku: (tekst: string, privitci?: ZigoAttachment[]) => Promise<void>;
  aktivirajRez: () => Promise<void>;
  izvrsiPripremljeniAlat: (toolPoziv: ZigoToolCall) => Promise<ZigoToolResult>;
  osvjezi: () => Promise<void>;
}

export function useZigoAgent(options: UseZigoAgentOptions = {}): UseZigoAgentReturn {
  const [sesije, setSesije] = useState<ZigoChatSesija[]>([]);
  const [aktivnaSesijaId, setAktivnaSesijaId] = useState<string | null>(null);
  const [poruke, setPoruke] = useState<ZigoChatPoruka[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Čuvamo referencu na najnoviji toolsContext kako dispečer uvijek ima aktualne hookove
  const toolsContextRef = useRef<ZigoToolsContext | undefined>(options.toolsContext);
  useEffect(() => {
    toolsContextRef.current = options.toolsContext;
  }, [options.toolsContext]);

  const loggerSession = appLogger.scope('AGENT:SESSION');
  const loggerChat = appLogger.scope('AGENT:CHAT');
  const loggerRez = appLogger.scope('AGENT:REZ');
  const loggerAction = appLogger.scope('AGENT:ACTION');

  // Učitavanje svih sesija iz baze
  const loadSesije = useCallback(async () => {
    try {
      const list = await dexieStorage.chat.getAllSesije(false);
      setSesije(list);
      loggerSession.debug('Učitane sesije iz baze', { brojSesija: list.length });
      return list;
    } catch (err: any) {
      loggerSession.error('Greška pri dohvaćanju chat sesija:', { error: err?.message });
      return [];
    }
  }, []);

  // Učitavanje poruka za odabranu sesiju
  const loadPoruke = useCallback(async (sesijaId: string) => {
    try {
      const msgs = await dexieStorage.chat.getPorukeBySesijaId(sesijaId);
      setPoruke(msgs);
      loggerChat.debug('Učitane poruke za sesiju', { sesijaId, brojPoruka: msgs.length });
    } catch (err: any) {
      loggerChat.error(`Greška pri dohvaćanju poruka sesije ${sesijaId}:`, { error: err?.message });
    }
  }, []);

  // Inicijalno učitavanje ili kreiranje prve sesije
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const sve = await loadSesije();
      if (!isMounted) return;

      if (sve.length > 0 && sve[0] && !aktivnaSesijaId) {
        setAktivnaSesijaId(sve[0].id);
        await loadPoruke(sve[0].id);
      } else if (sve.length === 0) {
        // Kreiraj prvu sesiju dobrodošlice
        const novaId = `sesija-${Date.now()}`;
        const nova: ZigoChatSesija = {
          id: novaId,
          naslov: 'Razgovor sa Žigom',
          kreirano: new Date().toISOString(),
          azurirano: new Date().toISOString(),
          arhivirano: false,
        };
        await dexieStorage.chat.saveSesija(nova);

        const dobrodoslica: ZigoChatPoruka = {
          id: `msg-${Date.now()}`,
          sesijaId: novaId,
          uloga: 'assistant',
          tekst: 'Bog daj, gosparu. Ođe Orlando. Ni milimetra više državi nego što joj pripada, ni centa manje da ti ne zatvore vrata. Što ćemo danas riješiti?',
          kreirano: new Date().toISOString(),
        };
        await dexieStorage.chat.savePoruka(dobrodoslica);

        loggerSession.info('Inicijalizirana prva sesija dobrodošlice sa Žigom', { id: novaId });

        if (isMounted) {
          setSesije([nova]);
          setAktivnaSesijaId(novaId);
          setPoruke([dobrodoslica]);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Odabir sesije
  const odaberiSesiju = useCallback(
    async (sesijaId: string) => {
      loggerSession.info('Odabrana sesija razgovora', { sesijaId });
      setAktivnaSesijaId(sesijaId);
      await loadPoruke(sesijaId);
    },
    [loadPoruke]
  );

  // Stvaranje nove sesije
  const stvoriNovuSesiju = useCallback(
    async (naslov?: string): Promise<string> => {
      const novaId = `sesija-${Date.now()}`;
      const nova: ZigoChatSesija = {
        id: novaId,
        naslov: naslov || 'Novi razgovor',
        kreirano: new Date().toISOString(),
        azurirano: new Date().toISOString(),
        arhivirano: false,
      };

      await dexieStorage.chat.saveSesija(nova);
      const dobrodoslica: ZigoChatPoruka = {
        id: `msg-${Date.now()}`,
        sesijaId: novaId,
        uloga: 'assistant',
        tekst: 'Ođe Orlando na trgu. Reci što treba: priprema računa, provjera praga od 40k ili da presiječemo dramu?',
        kreirano: new Date().toISOString(),
      };
      await dexieStorage.chat.savePoruka(dobrodoslica);

      loggerSession.info('Stvorena nova sesija razgovora', { id: novaId, naslov: nova.naslov });
      await loadSesije();
      setAktivnaSesijaId(novaId);
      setPoruke([dobrodoslica]);
      return novaId;
    },
    [loadSesije]
  );

  // Brisanje sesije
  const obrisiSesiju = useCallback(
    async (sesijaId: string) => {
      loggerSession.warn('Brisanje sesije razgovora', { sesijaId });
      await dexieStorage.chat.deleteSesija(sesijaId);
      const preostale = await loadSesije();
      if (preostale.length > 0 && preostale[0]) {
        setAktivnaSesijaId(preostale[0].id);
        await loadPoruke(preostale[0].id);
      } else {
        await stvoriNovuSesiju();
      }
    },
    [loadSesije, loadPoruke, stvoriNovuSesiju]
  );

  // Izvršavanje pripremljenog alata (ručno ili preko akcijske kartice)
  const izvrsiPripremljeniAlat = useCallback(
    async (toolPoziv: ZigoToolCall): Promise<ZigoToolResult> => {
      loggerAction.info('Korisnik potvrdio ručno izvršavanje pripremljenog alata', {
        alat: toolPoziv.imeFunkcije,
        argumenti: toolPoziv.argumenti,
      });
      const ctx = toolsContextRef.current || {};
      const rez = await executeZigoTool(toolPoziv.imeFunkcije, toolPoziv.argumenti, ctx);
      return rez;
    },
    []
  );

  // Slanje poruke
  const posaljiPoruku = useCallback(
    async (tekst: string, privitci?: ZigoAttachment[]) => {
      let currentSesijaId = aktivnaSesijaId;
      if (!currentSesijaId) {
        currentSesijaId = await stvoriNovuSesiju();
      }

      const cleanTekst = tekst.trim();
      if (!cleanTekst && (!privitci || privitci.length === 0)) {
        return;
      }

      loggerChat.info('Korisnik šalje poruku agentu', {
        sesijaId: currentSesijaId,
        duljinaTeksta: cleanTekst.length,
        brojPrivitaka: privitci?.length || 0,
      });

      // 1. Stvori i spremi korisničku poruku
      const userMsg: ZigoChatPoruka = {
        id: `msg-${Date.now()}-user`,
        sesijaId: currentSesijaId,
        uloga: 'user',
        tekst: cleanTekst,
        privitci,
        kreirano: new Date().toISOString(),
      };

      await dexieStorage.chat.savePoruka(userMsg);
      const azuriranePoruke = [...poruke, userMsg];
      setPoruke(azuriranePoruke);
      setIsThinking(true);

      // Ažuriraj naslov sesije ako je još zadani
      const currSesija = sesije.find((s) => s.id === currentSesijaId);
      if (currSesija && (currSesija.naslov === 'Novi razgovor' || currSesija.naslov === 'Razgovor sa Žigom')) {
        const pametniNaslov = cleanTekst.slice(0, 36) + (cleanTekst.length > 36 ? '...' : '');
        if (pametniNaslov) {
          await dexieStorage.chat.updateSesija(currentSesijaId, { naslov: pametniNaslov });
          await loadSesije();
        }
      }

      const t0 = performance.now();
      try {
        // 2. Pozovi Gemini ili lokalni heuristički asistent
        loggerChat.debug('Pokretanje Gemini / heurističkog agenta', {
          brojPorukaUKontekstu: azuriranePoruke.length,
          imaApiKeyOverride: !!options.apiKeyOverride,
        });

        const agentResponse = await geminiService.chatWithAgent(
          azuriranePoruke,
          options.apiKeyOverride
        );
        const trajanjeMs = Math.round(performance.now() - t0);

        loggerChat.info('Žigo generirao odgovor', {
          sesijaId: currentSesijaId,
          trajanjeMs,
          jeAiGenerirano: agentResponse.jeAiGenerirano,
          imaToolPoziv: !!agentResponse.toolPoziv,
          toolIme: agentResponse.toolPoziv?.imeFunkcije,
        });

        let toolRezultat: ZigoToolResult | undefined = undefined;

        // 3. Ako postoji toolPoziv, automatski ga izvrši dispečerom
        if (agentResponse.toolPoziv) {
          const ctx = toolsContextRef.current || {};
          toolRezultat = await executeZigoTool(
            agentResponse.toolPoziv.imeFunkcije,
            agentResponse.toolPoziv.argumenti,
            ctx
          );
        }

        // 4. Stvori i spremi Žiginu poruku
        const assistantMsg: ZigoChatPoruka = {
          id: `msg-${Date.now()}-assistant`,
          sesijaId: currentSesijaId,
          uloga: 'assistant',
          tekst: agentResponse.odgovorTekst,
          toolPoziv: agentResponse.toolPoziv,
          toolRezultat,
          kreirano: new Date().toISOString(),
        };

        await dexieStorage.chat.savePoruka(assistantMsg);
        setPoruke([...azuriranePoruke, assistantMsg]);
      } catch (err: any) {
        const trajanjeMs = Math.round(performance.now() - t0);
        loggerChat.error('Greška pri obradi odgovora agenta:', {
          error: err?.message,
          stack: err?.stack,
          trajanjeMs,
        });
        const errorMsg: ZigoChatPoruka = {
          id: `msg-${Date.now()}-error`,
          sesijaId: currentSesijaId,
          uloga: 'assistant',
          tekst: `Naletio sam na birokratsku neveru: ${err?.message || 'Greška u obradi.'}. Popij čašu vode, ja držim stražu.`,
          kreirano: new Date().toISOString(),
        };
        await dexieStorage.chat.savePoruka(errorMsg);
        setPoruke([...azuriranePoruke, errorMsg]);
      } finally {
        setIsThinking(false);
      }
    },
    [aktivnaSesijaId, poruke, sesije, stvoriNovuSesiju, loadSesije, options.apiKeyOverride, loggerChat, loggerSession]
  );

  // Instant aktivacija Žiginog Reza
  const aktivirajRez = useCallback(async () => {
    loggerRez.info('Korisnik okinuo "Žigin Rez" (instant trijaža i presijecanje)');
    setIsDrawerOpen(true);
    await posaljiPoruku('Žigo, presijeci.');
  }, [posaljiPoruku, loggerRez]);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const aktivnaSesija = useMemo(() => {
    return sesije.find((s) => s.id === aktivnaSesijaId) || null;
  }, [sesije, aktivnaSesijaId]);

  return {
    sesije,
    aktivnaSesija,
    poruke,
    isThinking,
    isDrawerOpen,
    setIsDrawerOpen,
    toggleDrawer,
    stvoriNovuSesiju,
    odaberiSesiju,
    obrisiSesiju,
    posaljiPoruku,
    aktivirajRez,
    izvrsiPripremljeniAlat,
    osvjezi: async () => {
      await loadSesije();
    },
  };
}
