import { useState, useEffect, useCallback } from 'react';
import type { GoogleAuthIdentity } from '@obrtniq/core';
import { 
  googleAuthService, 
  type GoogleAuthErrorDiagnosis, 
  type GoogleAuthFullHealthReport 
} from '../services/google-auth-service';
import { appLogger } from '../services/logger';

export interface UseGoogleAuthReturn {
  identity: GoogleAuthIdentity | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clientId: string;
  hasCustomClientId: boolean;
  tokenRemainingMinutes: number;
  setClientId: (id: string) => void;
  login: () => Promise<void>;
  logout: () => void;
  loginDemo: () => void;
  getAccessToken: (forceRefresh?: boolean) => Promise<string | null>;
  refreshAccessToken: () => Promise<string | null>;
  runFullHealthCheck: () => Promise<GoogleAuthFullHealthReport>;
  diagnoseError: (err: any) => GoogleAuthErrorDiagnosis;
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [identity, setIdentity] = useState<GoogleAuthIdentity | null>(() => {
    return googleAuthService.getStoredIdentity();
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientIdState] = useState<string>(() => {
    return googleAuthService.getCustomClientId();
  });
  const [tokenRemainingMinutes, setTokenRemainingMinutes] = useState<number>(() => {
    return googleAuthService.getTokenRemainingMinutes();
  });

  const logger = appLogger.scope('AUTH:HOOK');

  useEffect(() => {
    // 1. Provjeri postojeću sesiju pri inicijalizaciji
    const existing = googleAuthService.getStoredIdentity();
    if (existing) {
      setIdentity(existing);
      const remaining = googleAuthService.getTokenRemainingMinutes();
      setTokenRemainingMinutes(remaining);
      logger.info('Učitana postojeća Google sesija pri pokretanju', {
        email: existing.email,
        sub: existing.googleSub,
        tokenPreostaloMinuta: remaining,
      });
    } else {
      logger.info('Inicijalizacija: Google račun nije povezan (lokalni način rada).');
    }

    // 2. Automatsko održavanje sesije: provjera svake minute
    const interval = setInterval(async () => {
      const remaining = googleAuthService.getTokenRemainingMinutes();
      setTokenRemainingMinutes(remaining);

      // Ako je korisnik prijavljen i token istječe za manje od 5 minuta (ili je istekao),
      // tiho obnovi token u pozadini bez ometanja korisnika
      const currentIdentity = googleAuthService.getStoredIdentity();
      if (currentIdentity && remaining <= 5) {
        logger.info('Token je pri kraju ili istekao (<=5 min), pokrećem pozadinsko tiho obnavljanje...');
        const refreshed = await googleAuthService.requestSilentToken();
        if (refreshed) {
          const newRemaining = googleAuthService.getTokenRemainingMinutes();
          setTokenRemainingMinutes(newRemaining);
          logger.info('Automatsko tiho obnavljanje uspješno', { novoTrajanjeMinuta: newRemaining });
        } else {
          logger.warn('Automatsko tiho obnavljanje tokena nije uspjelo (korisnik će možda morati ponoviti prijavu).');
        }
      }
    }, 60000);

    // 3. Cross-Tab sinkronizacija sesije (ako se korisnik prijavi ili odjavi u drugom tabu)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'obrtniq_google_identity' || e.key === 'obrtniq_google_tokens' || e.key === 'obrtniq_google_client_id') {
        logger.info('Detektirana promjena stanja Google sesije u drugom tabu preglednika', { kljuc: e.key });
        const updatedIdentity = googleAuthService.getStoredIdentity();
        setIdentity(updatedIdentity);
        setTokenRemainingMinutes(googleAuthService.getTokenRemainingMinutes());
        setClientIdState(googleAuthService.getCustomClientId());
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setClientId = useCallback((newId: string) => {
    logger.info('Ažuriranje Google Client ID-a u stanju hooka', {
      duzina: newId.trim().length,
      postavljen: Boolean(newId.trim()),
    });
    googleAuthService.setCustomClientId(newId);
    setClientIdState(newId);
  }, []);

  const login = useCallback(async () => {
    const t0 = performance.now();
    logger.info('useGoogleAuth.login: Započinjem interaktivni postupak Google OAuth prijave...');
    try {
      setIsLoading(true);
      setError(null);
      logger.info('useGoogleAuth.login: Pozivam googleAuthService.requestLogin() za otvaranje skočnog prozora...');
      const res = await googleAuthService.requestLogin();
      logger.info('useGoogleAuth.login: Zaprimljene vjerodajnice, ažuriram korisnički identitet i stanje tokena...', {
        email: res.identity.email,
        sub: res.identity.googleSub,
      });
      setIdentity(res.identity);
      const remaining = googleAuthService.getTokenRemainingMinutes();
      setTokenRemainingMinutes(remaining);
      const trajanjeMs = Math.round(performance.now() - t0);
      logger.info(`useGoogleAuth.login: Google prijava u potpunosti dovršena! Korisnik: ${res.identity.email}`, {
        trajanjeMs,
        tokenPreostaloMinuta: remaining,
      });
    } catch (err: any) {
      const trajanjeMs = Math.round(performance.now() - t0);
      const diagnosis = googleAuthService.diagnoseAuthError(err);
      const friendlyMessage = `${diagnosis.userMessage} ${diagnosis.actionableAdvice}`;
      setError(friendlyMessage);
      logger.error('useGoogleAuth.login: Google prijava nije uspjela:', {
        trajanjeMs,
        kod: diagnosis.code,
        poruka: diagnosis.userMessage,
        savjet: diagnosis.actionableAdvice,
        stack: err?.stack,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginDemo = useCallback(() => {
    logger.info('useGoogleAuth.loginDemo: Pokrećem postavljanje offline Demo profila...');
    setError(null);
    const demo = googleAuthService.loginDemoUser();
    setIdentity(demo);
    const remaining = googleAuthService.getTokenRemainingMinutes();
    setTokenRemainingMinutes(remaining);
    logger.info(`useGoogleAuth.loginDemo: Demo identitet uspješno postavljen (${demo.email}, preostalo: ${remaining} min).`);
  }, []);

  const logout = useCallback(() => {
    const emailPrije = identity?.email;
    logger.info('useGoogleAuth.logout: Pokrećem odjavu sesije i brisanje tokena...', { odjavljeniEmail: emailPrije });
    googleAuthService.clearSession();
    setIdentity(null);
    setTokenRemainingMinutes(0);
    setError(null);
    logger.info('useGoogleAuth.logout: Korisnik je uspješno odjavljen, stanje je resetirano.');
  }, [identity]);

  const getAccessToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    logger.info('useGoogleAuth.getAccessToken: Provjera dostupnosti važećeg OAuth tokena...', { forceRefresh });
    if (!forceRefresh) {
      const tokens = googleAuthService.getStoredTokens();
      if (tokens) {
        logger.info('useGoogleAuth.getAccessToken: Važeći token pronađen u lokalnom spremniku.');
        return tokens.accessToken;
      }
    }
    // Ako nema aktivnog tokena ili je zatraženo prisilno osvježavanje, a korisnik je prijavljen:
    if (identity) {
      logger.info('useGoogleAuth.getAccessToken: Token nije u predmemoriji, istekao je ili je zatraženo osvježavanje, pokušavam tiho obnavljanje...');
      // 1. Prvo pokušaj tiho (silent) pozadinsko obnavljanje
      const silentToken = await googleAuthService.requestSilentToken();
      if (silentToken) {
        setTokenRemainingMinutes(googleAuthService.getTokenRemainingMinutes());
        logger.info('useGoogleAuth.getAccessToken: Tiho obnavljanje uspješno osiguralo novi pristupni token!');
        return silentToken;
      }
      // 2. Ako tiho obnavljanje ne uspije (npr. odjava iz Googlea), zatraži interaktivnu prijavu
      try {
        logger.warn('useGoogleAuth.getAccessToken: Tiho obnavljanje nije uspjelo, pokrećem interaktivnu prijavu...');
        const res = await googleAuthService.requestLogin();
        setTokenRemainingMinutes(googleAuthService.getTokenRemainingMinutes());
        return res.accessToken;
      } catch (err: any) {
        logger.error('useGoogleAuth.getAccessToken: Interaktivna obnova tokena nije uspjela:', { error: err?.message });
        return null;
      }
    }
    logger.info('useGoogleAuth.getAccessToken: Nema prijavljenog korisnika, vraćam null.');
    return null;
  }, [identity]);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    logger.info('Zatraženo ručno osvježavanje Google pristupnog tokena');
    const res = await googleAuthService.requestSilentToken();
    if (res) {
      setTokenRemainingMinutes(googleAuthService.getTokenRemainingMinutes());
      logger.info('Ručno tiho osvježavanje tokena uspješno');
      return res;
    }
    logger.info('Tiho osvježavanje nije bilo moguće, pokrećem interaktivni dijalog...');
    const loginRes = await googleAuthService.requestLogin();
    setIdentity(loginRes.identity);
    setTokenRemainingMinutes(googleAuthService.getTokenRemainingMinutes());
    return loginRes.accessToken;
  }, []);

  const runFullHealthCheck = useCallback(async () => {
    return await googleAuthService.checkFullAuthHealth();
  }, []);

  const diagnoseError = useCallback((err: any) => {
    return googleAuthService.diagnoseAuthError(err);
  }, []);

  return {
    identity,
    isAuthenticated: identity !== null,
    isLoading,
    error,
    clientId,
    hasCustomClientId: Boolean(clientId || googleAuthService.hasCustomClientId()),
    tokenRemainingMinutes,
    setClientId,
    login,
    logout,
    loginDemo,
    getAccessToken,
    refreshAccessToken,
    runFullHealthCheck,
    diagnoseError,
  };
}
