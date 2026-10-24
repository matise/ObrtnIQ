import type { GoogleAuthIdentity } from '@obrtniq/core';
import { appLogger } from './logger';

export interface GoogleAuthTokens {
  accessToken: string;
  expiresAt: number; // Unix timestamp in ms
}

const STORAGE_KEY_IDENTITY = 'obrtniq_google_identity';
const STORAGE_KEY_TOKENS = 'obrtniq_google_tokens';
const STORAGE_KEY_CLIENT_ID = 'obrtniq_google_client_id';

// Zadani službeni Web Client ID projekta ObrtIQ (Robot Hand Made)
export const DEFAULT_GOOGLE_CLIENT_ID = '46149025714-vkc36k4sh11d8sdimk13dsr135a9h0bo.apps.googleusercontent.com';

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
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
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
    return Boolean(
      this.getCustomClientId() ||
      (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
      (DEFAULT_GOOGLE_CLIENT_ID && !DEFAULT_GOOGLE_CLIENT_ID.includes('demo-client-id'))
    );
  }

  /**
   * Provjerava ispravnost formata korisnikovog Google Cloud Client ID-a
   */
  public validateClientIdFormat(clientId: string): { valid: boolean; message?: string } {
    const trimmed = (clientId || '').trim();
    if (!trimmed) {
      appLogger.scope('AUTH:GOOGLE:VALIDATE').debug('Client ID nije zadan (prazan niz).');
      return { valid: false, message: 'Client ID nije unesen.' };
    }
    if (!trimmed.endsWith('.apps.googleusercontent.com')) {
      appLogger.scope('AUTH:GOOGLE:VALIDATE').warn('Neispravan format Google Client ID-a:', { clientId: trimmed });
      return { 
        valid: false, 
        message: 'Google Client ID mora završavati sa ".apps.googleusercontent.com".' 
      };
    }
    appLogger.scope('AUTH:GOOGLE:VALIDATE').debug('Format Google Client ID-a je valjan.', { clientId: trimmed });
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
    appLogger.scope('AUTH:GOOGLE:INSPECT').debug('Započinjem provjeru valjanosti tokena i opsega (tokeninfo)...');

    if (accessToken.startsWith('demo-')) {
      appLogger.scope('AUTH:GOOGLE:INSPECT').info('Tokeninfo vraćen za lokalni demo token.');
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
        const errMsg = err.error_description || `Greška tokeninfo endpointa (${res.status})`;
        appLogger.scope('AUTH:GOOGLE:INSPECT').warn('Tokeninfo endpoint vratio grešku:', { status: res.status, error: errMsg });
        return {
          ok: false,
          scopes: [],
          error: errMsg,
        };
      }

      const data = await res.json();
      const scopeStr: string = data.scope || '';
      const scopes = scopeStr.split(' ').filter(Boolean);

      appLogger.scope('AUTH:GOOGLE:INSPECT').info('Token uspješno verificiran na Google poslužitelju', {
        email: data.email,
        scopesCount: scopes.length,
        scopes,
      });

      return {
        ok: true,
        scopes,
        email: data.email,
        clientId: data.azp || data.aud,
      };
    } catch (err: any) {
      appLogger.scope('AUTH:GOOGLE:INSPECT').error('Mrežna greška pri provjeri tokena:', { error: err?.message });
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
        appLogger.scope('AUTH:GOOGLE:TOKENS').debug('Pohranjeni Google token je istekao.');
        return null;
      }
      return tokens;
    } catch {
      return null;
    }
  }

  public getTokenRemainingMinutes(): number {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TOKENS);
      if (!raw) return 0;
      const tokens = JSON.parse(raw) as GoogleAuthTokens;
      const diffMs = tokens.expiresAt - Date.now();
      return Math.max(0, Math.floor(diffMs / 60000));
    } catch {
      return 0;
    }
  }

  public saveSession(identity: GoogleAuthIdentity, tokens?: GoogleAuthTokens): void {
    localStorage.setItem(STORAGE_KEY_IDENTITY, JSON.stringify(identity));
    if (tokens) {
      localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
    }
    const preostaloMinuta = tokens ? Math.max(0, Math.floor((tokens.expiresAt - Date.now()) / 60000)) : 0;
    appLogger.scope('AUTH:GOOGLE').info('Google sesija spremljena lokalno', {
      email: identity.email,
      provider: identity.provider,
      sub: identity.googleSub,
      tokenTrajanjeMinuta: preostaloMinuta,
    });
  }

  public clearSession(): void {
    const ident = this.getStoredIdentity();
    localStorage.removeItem(STORAGE_KEY_IDENTITY);
    localStorage.removeItem(STORAGE_KEY_TOKENS);
    appLogger.scope('AUTH:GOOGLE').info('Google sesija odjavljena i uklonjena iz lokalnog spremnika.', {
      odjavljeniKorisnik: ident?.email,
    });
  }

  /**
   * Tiho (silent) obnavlja Google OAuth access token bez otvaranja popup prozora (prompt: '')
   */
  public async requestSilentToken(): Promise<string | null> {
    const identity = this.getStoredIdentity();
    if (!identity) {
      appLogger.scope('AUTH:GOOGLE:SILENT').debug('Tiho obnavljanje preskočeno: nema aktivnog korisničkog identiteta.');
      return null;
    }

    // Ako je demo korisnik, produži demo sesiju
    if (identity.provider === 'GOOGLE' && identity.googleSub === '108392174981273981273') {
      const demoTokens: GoogleAuthTokens = {
        accessToken: 'demo-google-access-token-obrtniq',
        expiresAt: Date.now() + 24 * 3600 * 1000,
      };
      this.saveSession(identity, demoTokens);
      appLogger.scope('AUTH:GOOGLE:SILENT').info('Demo sesija automatski produžena na 24h.');
      return demoTokens.accessToken;
    }

    try {
      appLogger.scope('AUTH:GOOGLE:SILENT').info('Započinjem tiho (silent) obnavljanje Google OAuth access tokena...');
      await this.loadGisScript();
      if (!window.google?.accounts?.oauth2) {
        appLogger.scope('AUTH:GOOGLE:SILENT').warn('Google accounts.oauth2 objekt nije dostupan u prozoru.');
        return null;
      }
      if (!this.hasCustomClientId()) {
        appLogger.scope('AUTH:GOOGLE:SILENT').warn('Nema konfiguriranog Google Client ID-a za tiho obnavljanje.');
        return null;
      }

      const clientId = this.getEffectiveClientId();
      const scopes = [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/drive.appdata'
      ].join(' ');

      return await new Promise<string | null>((resolve) => {
        try {
          const client = window.google!.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: scopes,
            callback: (response) => {
              if (response.access_token) {
                const expiresIn = response.expires_in || 3600;
                const tokens: GoogleAuthTokens = {
                  accessToken: response.access_token,
                  expiresAt: Date.now() + expiresIn * 1000 - 60000,
                };
                this.saveSession(identity, tokens);
                appLogger.scope('AUTH:GOOGLE:SILENT').info('Google token uspješno tiho obnovljen u pozadini.', {
                  expiresInSec: expiresIn,
                });
                resolve(response.access_token);
              } else {
                appLogger.scope('AUTH:GOOGLE:SILENT').warn('Tiho obnavljanje tokena nije vratilo access_token:', {
                  error: response.error,
                });
                resolve(null);
              }
            },
          });

          // prompt: '' traži token u pozadini bez ponovnog ometanja korisnika ako je suglasnost već dana
          client.requestAccessToken({ prompt: '' });
        } catch (innerErr: any) {
          appLogger.scope('AUTH:GOOGLE:SILENT').error('Greška pri pozivu initTokenClient za tiho obnavljanje:', {
            error: innerErr?.message,
          });
          resolve(null);
        }
      });
    } catch (err: any) {
      appLogger.scope('AUTH:GOOGLE:SILENT').warn('Tiho obnavljanje nije uspjelo:', { error: err?.message });
      return null;
    }
  }

  /**
   * Dinamički učitava Google Identity Services (GIS) Web SDK
   */
  public async loadGisScript(): Promise<void> {
    if (this.scriptLoaded || (typeof window !== 'undefined' && window.google?.accounts)) {
      this.scriptLoaded = true;
      return;
    }

    appLogger.scope('AUTH:GOOGLE:SDK').debug('Učitavam vanjski Google Identity Services (GIS) SDK...');
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.scriptLoaded = true;
        appLogger.scope('AUTH:GOOGLE:SDK').info('Google Identity Services SDK uspješno učitan (accounts.google.com/gsi/client).');
        resolve();
      };
      script.onerror = () => {
        appLogger.scope('AUTH:GOOGLE:SDK').error('Neuspjelo učitavanje Google Identity Services SDK-a (mrežna greška).');
        reject(new Error('Neuspjelo učitavanje Google Identity Services SDK-a. Provjerite internetsku vezu.'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Pokreće interaktivni Google OAuth 2.0 flow za dohvat tokena i korisničkog profila
   */
  public async requestLogin(): Promise<{ identity: GoogleAuthIdentity; accessToken: string }> {
    appLogger.scope('AUTH:GOOGLE:LOGIN').info('Započinjem interaktivnu Google OAuth 2.0 prijavu...');
    await this.loadGisScript();

    if (!window.google?.accounts?.oauth2) {
      const err = new Error('Google Identity SDK nije inicijaliziran.');
      appLogger.scope('AUTH:GOOGLE:LOGIN').error(err.message);
      throw err;
    }

    if (!this.hasCustomClientId()) {
      const err = new Error(
        'Nije postavljen Google Cloud Client ID. Za trenutno testiranje kliknite "Isprobaj Demo Prijavu", ili unesite svoj Client ID u Naprednim postavkama.'
      );
      appLogger.scope('AUTH:GOOGLE:LOGIN').warn(err.message);
      throw err;
    }

    const clientId = this.getEffectiveClientId();
    const scopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/drive.appdata'
    ].join(' ');

    appLogger.scope('AUTH:GOOGLE:LOGIN').debug('Konfiguriran Google token client', {
      clientIdPrefix: clientId.slice(0, 15) + '...',
      scopes,
    });

    return new Promise((resolve, reject) => {
      try {
        const client = window.google!.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: scopes,
          callback: async (response) => {
            if (response.error || !response.access_token) {
              const err = response.error || 'Prijava je otkazana ili neuspjela.';
              appLogger.scope('AUTH:GOOGLE:LOGIN').warn('Google prijava otkazana ili neuspjela od strane korisnika:', { error: err });
              reject(new Error(err));
              return;
            }

            const accessToken = response.access_token;
            const expiresIn = response.expires_in || 3600;

            appLogger.scope('AUTH:GOOGLE:LOGIN').info('Google OAuth access token uspješno zaprimljen u callbacku.', {
              expiresInSec: expiresIn,
            });

            try {
              // Dohvati korisničke podatke (sub, email, name, picture)
              appLogger.scope('AUTH:GOOGLE:USERINFO').debug('Dohvaćam korisnički profil s Google UserInfo endpointa...');
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
              });

              if (!userInfoRes.ok) {
                const errText = await userInfoRes.text().catch(() => '');
                appLogger.scope('AUTH:GOOGLE:USERINFO').error('Google UserInfo API vratio grešku:', {
                  status: userInfoRes.status,
                  body: errText,
                });
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
              appLogger.scope('AUTH:GOOGLE:LOGIN').info('Korisnik uspješno prijavljen putem Google računa!', {
                email: identity.email,
                ime: identity.name,
                googleSub: identity.googleSub,
              });

              resolve({ identity, accessToken });
            } catch (err: any) {
              appLogger.scope('AUTH:GOOGLE:LOGIN').error('Greška pri dohvaćanju i obradi profila korisnika:', {
                error: err?.message,
              });
              reject(err);
            }
          },
        });

        appLogger.scope('AUTH:GOOGLE:LOGIN').debug('Otvaram Google OAuth popup prozor za odabir računa...');
        client.requestAccessToken();
      } catch (err: any) {
        appLogger.scope('AUTH:GOOGLE:LOGIN').error('Greška pri inicijalizaciji requestAccessToken:', {
          error: err?.message,
        });
        reject(err);
      }
    });
  }

  /**
   * Simulira prijavu u Demo / Offline načinu (korisno za demonstraciju, razvoj i testiranje bez Client ID-a)
   */
  public loginDemoUser(): GoogleAuthIdentity {
    appLogger.scope('AUTH:GOOGLE:DEMO').info('Aktivirana simulirana Demo prijava s determinističkim Google identitetom.');
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
