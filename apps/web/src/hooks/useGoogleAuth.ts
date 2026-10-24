import { useState, useEffect, useCallback } from 'react';
import type { GoogleAuthIdentity } from '@obrtniq/core';
import { googleAuthService } from '../services/google-auth-service';

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
  getAccessToken: () => Promise<string | null>;
  refreshAccessToken: () => Promise<string | null>;
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

  useEffect(() => {
    // 1. Provjeri postojeću sesiju pri inicijalizaciji
    const existing = googleAuthService.getStoredIdentity();
    if (existing) {
      setIdentity(existing);
      setTokenRemainingMinutes(googleAuthService.getTokenRemainingMinutes());
    }

    // 2. Automatsko održavanje sesije: provjera svake minute
    const interval = setInterval(async () => {
      const remaining = googleAuthService.getTokenRemainingMinutes();
      setTokenRemainingMinutes(remaining);

      // Ako je korisnik prijavljen i token istječe za manje od 5 minuta (ili je istekao),
      // tiho obnovi token u pozadini bez ometanja korisnika
      const currentIdentity = googleAuthService.getStoredIdentity();
      if (currentIdentity && remaining <= 5) {
        const refreshed = await googleAuthService.requestSilentToken();
        if (refreshed) {
          setTokenRemainingMinutes(googleAuthService.getTokenRemainingMinutes());
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const setClientId = useCallback((newId: string) => {
    googleAuthService.setCustomClientId(newId);
    setClientIdState(newId);
  }, []);

  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await googleAuthService.requestLogin();
      setIdentity(res.identity);
      setTokenRemainingMinutes(googleAuthService.getTokenRemainingMinutes());
    } catch (err: any) {
      const msg = err?.message || 'Greška pri prijavi putem Google računa.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginDemo = useCallback(() => {
    setError(null);
    const demo = googleAuthService.loginDemoUser();
    setIdentity(demo);
    setTokenRemainingMinutes(googleAuthService.getTokenRemainingMinutes());
  }, []);

  const logout = useCallback(() => {
    googleAuthService.clearSession();
    setIdentity(null);
    setTokenRemainingMinutes(0);
    setError(null);
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const tokens = googleAuthService.getStoredTokens();
    if (tokens) {
      return tokens.accessToken;
    }
    // Ako nema aktivnog tokena, a korisnik je prijavljen:
    if (identity) {
      // 1. Prvo pokušaj tiho (silent) pozadinsko obnavljanje
      const silentToken = await googleAuthService.requestSilentToken();
      if (silentToken) {
        setTokenRemainingMinutes(googleAuthService.getTokenRemainingMinutes());
        return silentToken;
      }
      // 2. Ako tiho obnavljanje ne uspije (npr. odjava iz Googlea), zatraži interaktivnu prijavu
      try {
        const res = await googleAuthService.requestLogin();
        setTokenRemainingMinutes(googleAuthService.getTokenRemainingMinutes());
        return res.accessToken;
      } catch {
        return null;
      }
    }
    return null;
  }, [identity]);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const res = await googleAuthService.requestSilentToken();
    if (res) {
      setTokenRemainingMinutes(googleAuthService.getTokenRemainingMinutes());
      return res;
    }
    const loginRes = await googleAuthService.requestLogin();
    setIdentity(loginRes.identity);
    setTokenRemainingMinutes(googleAuthService.getTokenRemainingMinutes());
    return loginRes.accessToken;
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
  };
}
