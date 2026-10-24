import type { GoogleAuthIdentity } from '@obrtniq/core';
import { appLogger } from './logger';

export interface GoogleAuthTokens {
  accessToken: string;
  expiresAt: number; // Unix timestamp in ms
}

const STORAGE_KEY_IDENTITY = 'obrtniq_google_identity';
const STORAGE_KEY_TOKENS = 'obrtniq_google_tokens';
const STORAGE_KEY_CLIENT_ID = 'obrtniq_google_client_id';

// Zadani javni Web Client ID za demonstraciju i lokalni razvoj
export const DEFAULT_GOOGLE_CLIENT_ID = '938172948172-demo-client-id.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; expires_in?: number }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

class GoogleAuthService {
  private scriptLoaded = false;

  public getCustomClientId(): string {
    return localStorage.getItem(STORAGE_KEY_CLIENT_ID) || '';
  }

  public setCustomClientId(clientId: string): void {
    if (clientId.trim()) {
      localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
    }
  }

  public hasCustomClientId(): boolean {
    return Boolean(this.getCustomClientId() || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID);
  }

  /**
   * Provjerava ispravnost formata korisnikovog Google Cloud Client ID-a
   */
  public validateClientIdFormat(clientId: string): { valid: boolean; message?: string } {
    const trimmed = (clientId || '').trim();
    if (!trimmed) {
      return { valid: false, message: 'Client ID nije unesen.' };
    }
    if (!trimmed.endsWith('.apps.googleusercontent.com')) {
      return { 
        valid: false, 
        message: 'Google Client ID mora završavati sa ".apps.googleusercontent.com".' 
      };
    }
    return { valid: true };
  }

  /**
   * Dohvaća detaljne informacije o tokenu i odobrenim scope-ovima s Google tokeninfo endpointa
   */
  public async inspectToken(accessToken: string): Promise<{
    ok: boolean;
    scopes: string[];
    email?: string;
    clientId?: string;
    error?: string;
  }> {
    if (accessToken.startsWith('demo-')) {
      return {
        ok: true,
        scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/drive.appdata'],
        email: 'obrtnik.demo@gmail.com',
        clientId: 'demo-client-id',
      };
    }

    try {
      const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          ok: false,
          scopes: [],
          error: err.error_description || `Greška tokeninfo endpointa (${res.status})`,
        };
      }

      const data = await res.json();
      const scopeStr: string = data.scope || '';
      const scopes = scopeStr.split(' ').filter(Boolean);

      return {
        ok: true,
        scopes,
        email: data.email,
        clientId: data.azp || data.aud,
      };
    } catch (err: any) {
      return {
        ok: false,
        scopes: [],
        error: err?.message || 'Neuspjelo dohvaćanje informacija o tokenu.',
      };
    }
  }

  public getEffectiveClientId(): string {
    const custom = this.getCustomClientId();
    if (custom) return custom;
    // Opcionalno env var
    const envId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (envId) return envId;
    return DEFAULT_GOOGLE_CLIENT_ID;
  }

  public getStoredIdentity(): GoogleAuthIdentity | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_IDENTITY);
      if (!raw) return null;
      return JSON.parse(raw) as GoogleAuthIdentity;
    } catch {
      return null;
    }
  }

  public getStoredTokens(): GoogleAuthTokens | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TOKENS);
      if (!raw) return null;
      const tokens = JSON.parse(raw) as GoogleAuthTokens;
      // Provjeri valjanost
      if (Date.now() > tokens.expiresAt) {
        return null;
      }
      return tokens;
    } catch {
      return null;
    }
  }

  public saveSession(identity: GoogleAuthIdentity, tokens?: GoogleAuthTokens): void {
    localStorage.setItem(STORAGE_KEY_IDENTITY, JSON.stringify(identity));
    if (tokens) {
      localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
    }
    appLogger.scope('AUTH:GOOGLE').info('Google sesija spremljena lokalno', {
      email: identity.email,
      provider: identity.provider,
      sub: identity.googleSub,
    });
  }

  public clearSession(): void {
    localStorage.removeItem(STORAGE_KEY_IDENTITY);
    localStorage.removeItem(STORAGE_KEY_TOKENS);
    appLogger.scope('AUTH:GOOGLE').info('Google sesija odjavljena.');
  }

  /**
   * Dinamički učitava Google Identity Services (GIS) Web SDK
   */
  public async loadGisScript(): Promise<void> {
    if (this.scriptLoaded || (typeof window !== 'undefined' && window.google?.accounts)) {
      this.scriptLoaded = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Neuspjelo učitavanje Google Identity Services SDK-a. Provjerite internetsku vezu.'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Pokreće interaktivni Google OAuth 2.0 flow za dohvat tokena i korisničkog profila
   */
  public async requestLogin(): Promise<{ identity: GoogleAuthIdentity; accessToken: string }> {
    await this.loadGisScript();

    if (!window.google?.accounts?.oauth2) {
      throw new Error('Google Identity SDK nije inicijaliziran.');
    }

    if (!this.hasCustomClientId()) {
      throw new Error(
        'Nije postavljen Google Cloud Client ID. Za trenutno testiranje kliknite "Isprobaj Demo Prijavu", ili unesite svoj Client ID u Naprednim postavkama.'
      );
    }

    const clientId = this.getEffectiveClientId();
    const scopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/drive.appdata'
    ].join(' ');

    return new Promise((resolve, reject) => {
      try {
        const client = window.google!.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: scopes,
          callback: async (response) => {
            if (response.error || !response.access_token) {
              const err = response.error || 'Prijava je otkazana ili neuspjela.';
              appLogger.scope('AUTH:GOOGLE').warn('Google prijava neuspjela:', { error: err });
              reject(new Error(err));
              return;
            }

            const accessToken = response.access_token;
            const expiresIn = response.expires_in || 3600;

            try {
              // Dohvati korisničke podatke (sub, email, name, picture)
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
              });

              if (!userInfoRes.ok) {
                throw new Error('Neuspjelo dohvaćanje korisničkog profila s Google API-ja.');
              }

              const userInfo = await userInfoRes.json();
              const identity: GoogleAuthIdentity = {
                provider: 'GOOGLE',
                googleSub: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name,
                pictureUrl: userInfo.picture,
                connectedAt: new Date().toISOString(),
                scopes: scopes.split(' '),
              };

              const tokens: GoogleAuthTokens = {
                accessToken,
                expiresAt: Date.now() + expiresIn * 1000 - 60000, // 1 min buffer
              };

              this.saveSession(identity, tokens);
              resolve({ identity, accessToken });
            } catch (err: any) {
              reject(err);
            }
          },
        });

        client.requestAccessToken();
      } catch (err: any) {
        reject(err);
      }
    });
  }

  /**
   * Simulira prijavu u Demo / Offline načinu (korisno za demonstraciju, razvoj i testiranje bez Client ID-a)
   */
  public loginDemoUser(): GoogleAuthIdentity {
    const demoIdentity: GoogleAuthIdentity = {
      provider: 'GOOGLE',
      googleSub: '108392174981273981273', // Deterministički 21-znamenkasti ID
      email: 'obrtnik.demo@gmail.com',
      name: 'Matija Obrtnik (Google Demo)',
      pictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      connectedAt: new Date().toISOString(),
      scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/drive.appdata'],
    };

    const demoTokens: GoogleAuthTokens = {
      accessToken: 'demo-google-access-token-obrtniq',
      expiresAt: Date.now() + 24 * 3600 * 1000,
    };

    this.saveSession(demoIdentity, demoTokens);
    return demoIdentity;
  }
}

export const googleAuthService = new GoogleAuthService();
