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

  const logger = appLogger.scope('AGENT:ZIGO');

  // Učitavanje svih sesija iz baze
  const loadSesije = useCallback(async () => {
    try {
      const list = await dexieStorage.chat.getAllSesije(false);
      setSesije(list);
      return list;
    } catch (err: any) {
      logger.error('Greška pri dohvaćanju chat sesija:', { error: err?.message });
      return [];
    }
  }, []);

  // Učitavanje poruka za odabranu sesiju
  const loadPoruke = useCallback(async (sesijaId: string) => {
    try {
      const msgs = await dexieStorage.chat.getPorukeBySesijaId(sesijaId);
      setPoruke(msgs);
    } catch (err: any) {
      logger.error(`Greška pri dohvaćanju poruka sesije ${sesijaId}:`, { error: err?.message });
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

      try {
        // 2. Pozovi Gemini ili lokalni heuristički asistent
        const agentResponse = await geminiService.chatWithAgent(
          azuriranePoruke,
          options.apiKeyOverride
        );

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
        logger.error('Greška pri obradi odgovora agenta:', { error: err?.message });
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
    [aktivnaSesijaId, poruke, sesije, stvoriNovuSesiju, loadSesije, options.apiKeyOverride, logger]
  );

  // Instant aktivacija Žiginog Reza
  const aktivirajRez = useCallback(async () => {
    setIsDrawerOpen(true);
    await posaljiPoruku('Žigo, presijeci.');
  }, [posaljiPoruku]);

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
