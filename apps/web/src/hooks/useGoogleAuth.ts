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
  setClientId: (id: string) => void;
  login: () => Promise<void>;
  logout: () => void;
  loginDemo: () => void;
  getAccessToken: () => Promise<string | null>;
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

  useEffect(() => {
    // Provjeri postojeću sesiju pri inicijalizaciji
    const existing = googleAuthService.getStoredIdentity();
    if (existing) {
      setIdentity(existing);
    }
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
  }, []);

  const logout = useCallback(() => {
    googleAuthService.clearSession();
    setIdentity(null);
    setError(null);
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const tokens = googleAuthService.getStoredTokens();
    if (tokens) {
      return tokens.accessToken;
    }
    // Ako nema aktivnog tokena, a korisnik je prijavljen, zatraži ponovnu autorizaciju
    if (identity) {
      try {
        const res = await googleAuthService.requestLogin();
        return res.accessToken;
      } catch {
        return null;
      }
    }
    return null;
  }, [identity]);

  return {
    identity,
    isAuthenticated: identity !== null,
    isLoading,
    error,
    clientId,
    hasCustomClientId: Boolean(clientId || googleAuthService.hasCustomClientId()),
    setClientId,
    login,
    logout,
    loginDemo,
    getAccessToken,
  };
}
