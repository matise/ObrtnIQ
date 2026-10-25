import type { GoogleAuthIdentity } from '@obrtniq/core';
import { appLogger } from './logger';

export interface GoogleAuthTokens {
  accessToken: string;
  expiresAt: number; // Unix timestamp in ms
}

export interface GoogleAuthErrorDiagnosis {
  code: string;
  userMessage: string;
  actionableAdvice: string;
  technicalDetails?: string;
  isRecoverable: boolean;
}

export interface GoogleAuthOriginCheck {
  valid: boolean;
  origin: string;
  protocol: string;
  isLocalhost: boolean;
  warning?: string;
}

export interface GoogleAuthNetworkCheck {
  googleAccountsOk: boolean;
  googleApisOk: boolean;
  latencyMs: number;
  error?: string;
}

export interface GoogleAuthSessionIntegrity {
  valid: boolean;
  reason?: string;
  identity?: GoogleAuthIdentity;
  tokenStatus: 'VALID' | 'EXPIRED' | 'MISSING';
  remainingMinutes: number;
}

export interface GoogleAuthScopeVerification {
  hasProfile: boolean;
  hasEmail: boolean;
  hasDrive: boolean;
  allRequiredGranted: boolean;
  grantedScopes: string[];
  missingScopes: string[];
}

export interface GoogleAuthFullHealthReport {
  timestamp: string;
  clientId: {
    configured: boolean;
    value: string;
    validFormat: boolean;
    message?: string;
  };
  origin: GoogleAuthOriginCheck;
  network: GoogleAuthNetworkCheck;
  sdkLoaded: boolean;
  session: GoogleAuthSessionIntegrity;
  tokenInfo?: {
    ok: boolean;
    scopes: string[];
    email?: string;
    error?: string;
    scopeVerification: GoogleAuthScopeVerification;
  };
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'CONFIG_REQUIRED' | 'OFFLINE';
  recommendations: string[];
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

  /**
   * Provjerava je li trenutni protokol i domena podržana od strane Google OAuth servisa
   */
  public validateAuthorizedOrigin(): GoogleAuthOriginCheck {
    if (typeof window === 'undefined') {
      return { valid: true, origin: '', protocol: '', isLocalhost: true };
    }
    const origin = window.location.origin;
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';

    if (protocol === 'http:' && !isLocalhost) {
      const warning = `UPOZORENJE: Google OAuth zabranjuje HTTP protokol za vanjske domene (${origin}). Google prijava će raditi samo na HTTPS protokolu ili na localhost-u.`;
      appLogger.scope('AUTH:GOOGLE:ORIGIN').warn(warning, { origin, protocol });
      return { valid: false, origin, protocol, isLocalhost: false, warning };
    }

    appLogger.scope('AUTH:GOOGLE:ORIGIN').debug('Domena i protokol su valjani za Google OAuth', { origin, protocol, isLocalhost });
    return { valid: true, origin, protocol, isLocalhost };
  }

  /**
   * Provjerava jesu li Google poslužitelji dostupni putem klijentske mreže
   */
  public async testGoogleEndpointsReachability(): Promise<GoogleAuthNetworkCheck> {
    const t0 = performance.now();
    let googleAccountsOk = false;
    let googleApisOk = false;
    let error: string | undefined;

    try {
      await fetch('https://accounts.google.com/gsi/client', { method: 'HEAD', mode: 'no-cors' });
      googleAccountsOk = true;
    } catch (e: any) {
      error = `Neuspjelo povezivanje s accounts.google.com: ${e?.message}`;
      appLogger.scope('AUTH:GOOGLE:NETWORK').warn(error);
    }

    try {
      await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { method: 'HEAD', mode: 'no-cors' });
      googleApisOk = true;
    } catch (e: any) {
      if (!error) error = `Neuspjelo povezivanje s googleapis.com: ${e?.message}`;
      appLogger.scope('AUTH:GOOGLE:NETWORK').warn(`Neuspjelo povezivanje s googleapis.com: ${e?.message}`);
    }

    const latencyMs = Math.round(performance.now() - t0);
    appLogger.scope('AUTH:GOOGLE:NETWORK').info('Provjera dostupnosti Google poslužitelja završena', {
      googleAccountsOk,
      googleApisOk,
      latencyMs,
    });

    return {
      googleAccountsOk,
      googleApisOk,
      latencyMs,
      error,
    };
  }

  /**
   * Provjerava integritet i valjanost lokalno pohranjene Google sesije
   */
  public verifySessionIntegrity(): GoogleAuthSessionIntegrity {
    const rawIdentity = localStorage.getItem(STORAGE_KEY_IDENTITY);
    const rawTokens = localStorage.getItem(STORAGE_KEY_TOKENS);
    const remainingMinutes = this.getTokenRemainingMinutes();

    if (!rawIdentity) {
      return {
        valid: false,
        reason: 'Nema pohranjenog korisničkog identiteta u lokalnoj pohrani.',
        tokenStatus: 'MISSING',
        remainingMinutes: 0,
      };
    }

    try {
      const identity = JSON.parse(rawIdentity) as GoogleAuthIdentity;
      if (!identity.email || !identity.googleSub || identity.provider !== 'GOOGLE') {
        appLogger.scope('AUTH:GOOGLE:INTEGRITY').warn('Oštećen identitet u lokalnoj pohrani, čistim nevažeće podatke.');
        this.clearSession();
        return {
          valid: false,
          reason: 'Identitet ima nevažeću strukturu ili nedostaje googleSub/email.',
          tokenStatus: 'MISSING',
          remainingMinutes: 0,
        };
      }

      let tokenStatus: 'VALID' | 'EXPIRED' | 'MISSING' = 'MISSING';
      if (rawTokens) {
        try {
          const tokens = JSON.parse(rawTokens) as GoogleAuthTokens;
          if (tokens.accessToken && tokens.expiresAt) {
            tokenStatus = Date.now() < tokens.expiresAt ? 'VALID' : 'EXPIRED';
          }
        } catch {
          tokenStatus = 'MISSING';
        }
      }

      appLogger.scope('AUTH:GOOGLE:INTEGRITY').debug('Integritet sesije uspješno provjeren', {
        email: identity.email,
        sub: identity.googleSub,
        tokenStatus,
        remainingMinutes,
      });

      return {
        valid: true,
        identity,
        tokenStatus,
        remainingMinutes,
      };
    } catch (e: any) {
      appLogger.scope('AUTH:GOOGLE:INTEGRITY').error('JSON greška pri parsiranju identiteta, čistim sesiju:', { error: e?.message });
      this.clearSession();
      return {
        valid: false,
        reason: `JSON greška: ${e?.message}`,
        tokenStatus: 'MISSING',
        remainingMinutes: 0,
      };
    }
  }

  /**
   * Provjerava jesu li dodijeljeni svi potrebni OAuth scope-ovi (posebice drive.appdata)
   */
  public verifyScopesGranted(scopes: string[]): GoogleAuthScopeVerification {
    const normalized = scopes.map((s) => s.trim().toLowerCase());
    const hasProfile = normalized.some((s) => s.includes('profile') || s.includes('userinfo.profile'));
    const hasEmail = normalized.some((s) => s.includes('email') || s.includes('userinfo.email'));
    const hasDrive = normalized.some((s) => s.includes('drive.appdata'));
    const allRequiredGranted = hasProfile && hasEmail && hasDrive;

    const missingScopes: string[] = [];
    if (!hasProfile) missingScopes.push('profile');
    if (!hasEmail) missingScopes.push('email');
    if (!hasDrive) missingScopes.push('drive.appdata');

    if (!allRequiredGranted) {
      appLogger.scope('AUTH:GOOGLE:SCOPES').warn('Nedostaju ključne Google dozvole (scopes)', {
        granted: scopes,
        missing: missingScopes,
      });
    } else {
      appLogger.scope('AUTH:GOOGLE:SCOPES').debug('Sve potrebne Google dozvole su uspješno dodijeljene.', {
        granted: scopes,
      });
    }

    return {
      hasProfile,
      hasEmail,
      hasDrive,
      allRequiredGranted,
      grantedScopes: scopes,
      missingScopes,
    };
  }

  /**
   * Detaljno analizira Google OAuth greške i vraća strukturiranu dijagnozu i preporuku za korisnika
   */
  public diagnoseAuthError(rawError: any): GoogleAuthErrorDiagnosis {
    const msg = (typeof rawError === 'string' ? rawError : rawError?.message || rawError?.error || '').toLowerCase();
    const technical = rawError?.stack || (typeof rawError === 'object' ? JSON.stringify(rawError) : String(rawError));

    let diagnosis: GoogleAuthErrorDiagnosis;

    if (msg.includes('popup_closed') || msg.includes('closed by user')) {
      diagnosis = {
        code: 'POPUP_CLOSED',
        userMessage: 'Prijava je prekinuta jer je prozor za prijavu zatvoren.',
        actionableAdvice: 'Kliknite ponovno na "Prijavi se putem Google računa" i dovršite odabir računa u skočnom prozoru.',
        technicalDetails: technical,
        isRecoverable: true,
      };
    } else if (msg.includes('access_denied')) {
      diagnosis = {
        code: 'ACCESS_DENIED',
        userMessage: 'Pristup Google računu je odbijen.',
        actionableAdvice: 'U prozoru prijave morate označiti sve zatražene dozvole (uključujući pristup mapi aplikacije na Driveu).',
        technicalDetails: technical,
        isRecoverable: true,
      };
    } else if (msg.includes('origin_mismatch') || msg.includes('idpiframe_initialization_failed')) {
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      diagnosis = {
        code: 'ORIGIN_MISMATCH',
        userMessage: 'Domena aplikacije nije autorizirana u Google Cloud konzoli.',
        actionableAdvice: `Otvorite Google Cloud Console > Credentials > Vaš OAuth Client ID i dodajte točno "${currentOrigin}" u "Authorized JavaScript origins".`,
        technicalDetails: technical,
        isRecoverable: false,
      };
    } else if (msg.includes('invalid_client') || msg.includes('unauthorized_client')) {
      diagnosis = {
        code: 'INVALID_CLIENT',
        userMessage: 'Google Cloud Client ID nije valjan ili je obrisan.',
        actionableAdvice: 'Provjerite uneseni Client ID u postavkama. Provjerite da je tip klijenta u Google konzoli "Web application".',
        technicalDetails: technical,
        isRecoverable: false,
      };
    } else if (msg.includes('network') || msg.includes('failed to fetch')) {
      diagnosis = {
        code: 'NETWORK_ERROR',
        userMessage: 'Nije moguće uspostaviti vezu s Google poslužiteljem.',
        actionableAdvice: 'Provjerite internetsku vezu, ad-blockere ili vatrozid koji možda blokira accounts.google.com.',
        technicalDetails: technical,
        isRecoverable: true,
      };
    } else {
      diagnosis = {
        code: 'UNKNOWN_AUTH_ERROR',
        userMessage: rawError?.message || 'Neočekivana greška pri Google autentifikaciji.',
        actionableAdvice: 'Pokušajte ponovno osvježiti stranicu ili provjerite postavke u tabu Google & AI.',
        technicalDetails: technical,
        isRecoverable: true,
      };
    }

    appLogger.scope('AUTH:GOOGLE:DIAGNOSE').warn('Dijagnosticirana greška autentifikacije:', {
      kod: diagnosis.code,
      poruka: diagnosis.userMessage,
      savjet: diagnosis.actionableAdvice,
    });

    return diagnosis;
  }

  /**
   * Pokreće sveobuhvatnu analizu zdravlja Google računa, Client ID-a, mreže i sesije
   */
  public async checkFullAuthHealth(): Promise<GoogleAuthFullHealthReport> {
    appLogger.scope('AUTH:GOOGLE:HEALTH').info('Pokrećem sveobuhvatnu analizu zdravlja Google računa i autentifikacije...');

    const origin = this.validateAuthorizedOrigin();
    const network = await this.testGoogleEndpointsReachability();
    const session = this.verifySessionIntegrity();
    const clientIdVal = this.getEffectiveClientId();
    const formatCheck = this.validateClientIdFormat(clientIdVal);

    const recommendations: string[] = [];
    let overallStatus: 'HEALTHY' | 'DEGRADED' | 'CONFIG_REQUIRED' | 'OFFLINE' = 'HEALTHY';

    if (!network.googleAccountsOk) {
      overallStatus = 'OFFLINE';
      recommendations.push('Uređaj nema pristup Google poslužiteljima. Provjerite internetsku vezu.');
    }

    if (!formatCheck.valid) {
      if (overallStatus !== 'OFFLINE') overallStatus = 'CONFIG_REQUIRED';
      recommendations.push('Unesite valjani Google Cloud Client ID (koji završava sa .apps.googleusercontent.com).');
    }

    if (!origin.valid) {
      if (overallStatus === 'HEALTHY') overallStatus = 'DEGRADED';
      recommendations.push(origin.warning || 'Protokol mora biti HTTPS za vanjske domene.');
    }

    let tokenInfo: any = undefined;
    if (session.valid && session.tokenStatus === 'VALID') {
      const storedTokens = this.getStoredTokens();
      if (storedTokens?.accessToken) {
        const inspected = await this.inspectToken(storedTokens.accessToken);
        const scopeVer = this.verifyScopesGranted(inspected.scopes);
        tokenInfo = {
          ...inspected,
          scopeVerification: scopeVer,
        };

        if (!scopeVer.hasDrive) {
          if (overallStatus === 'HEALTHY') overallStatus = 'DEGRADED';
          recommendations.push('Korisnik nije odobrio dozvolu za Google Drive (appdata). Sinkronizacija u oblak neće raditi bez ponovne prijave.');
        }
      }
    } else if (session.valid && session.tokenStatus === 'EXPIRED') {
      if (overallStatus === 'HEALTHY') overallStatus = 'DEGRADED';
      recommendations.push('Google pristupni token je istekao. Pokrenite tiho obnavljanje ili ponovnu prijavu.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Google autentifikacija, sesija i dozvole su u potpunosti ispravni i spremni za rad.');
    }

    appLogger.scope('AUTH:GOOGLE:HEALTH').info('Sveobuhvatna analiza završena', {
      overallStatus,
      sessionValid: session.valid,
      tokenStatus: session.tokenStatus,
      recommendationsCount: recommendations.length,
    });

    return {
      timestamp: new Date().toISOString(),
      clientId: {
        configured: this.hasCustomClientId(),
        value: clientIdVal,
        validFormat: formatCheck.valid,
        message: formatCheck.message,
      },
      origin,
      network,
      sdkLoaded: this.scriptLoaded || !!window.google?.accounts,
      session,
      tokenInfo,
      overallStatus,
      recommendations,
    };
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
                const diagnosis = this.diagnoseAuthError(response.error);
                appLogger.scope('AUTH:GOOGLE:SILENT').warn('Tiho obnavljanje tokena nije vratilo access_token:', {
                  error: response.error,
                  kod: diagnosis.code,
                  poruka: diagnosis.userMessage,
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
      appLogger.scope('AUTH:GOOGLE:SDK').info('Google Identity Services (GIS) SDK je dostupan i spreman u radnoj memoriji.');
      return;
    }

    appLogger.scope('AUTH:GOOGLE:SDK').info('Preuzimam vanjski Google Identity Services (GIS) SDK sa službenog poslužitelja (accounts.google.com/gsi/client)...');
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.scriptLoaded = true;
        appLogger.scope('AUTH:GOOGLE:SDK').info('Google Identity Services SDK uspješno preuzet i inicijaliziran (window.google.accounts).');
        resolve();
      };
      script.onerror = () => {
        appLogger.scope('AUTH:GOOGLE:SDK').error('Neuspjelo učitavanje Google Identity Services SDK-a (mrežna greška). Provjerite internetsku vezu.');
        reject(new Error('Neuspjelo učitavanje Google Identity Services SDK-a. Provjerite internetsku vezu.'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Pokreće interaktivni Google OAuth 2.0 flow za dohvat tokena i korisničkog profila
   */
  public async requestLogin(): Promise<{ identity: GoogleAuthIdentity; accessToken: string }> {
    const loggerLogin = appLogger.scope('AUTH:GOOGLE:LOGIN');
    loggerLogin.info('Faza 1/5: Započinjem interaktivnu Google OAuth 2.0 prijavu...');
    await this.loadGisScript();

    if (!window.google?.accounts?.oauth2) {
      const err = new Error('Google Identity SDK nije inicijaliziran u window.google.accounts.oauth2.');
      loggerLogin.error(err.message);
      throw err;
    }

    if (!this.hasCustomClientId()) {
      const err = new Error(
        'Nije postavljen Google Cloud Client ID. Za trenutno testiranje kliknite "Isprobaj Demo Prijavu", ili unesite svoj Client ID u Naprednim postavkama.'
      );
      loggerLogin.warn(err.message);
      throw err;
    }

    const clientId = this.getEffectiveClientId();
    const scopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/drive.appdata'
    ].join(' ');

    loggerLogin.info('Faza 2/5: Konfiguriran Google token client', {
      clientIdPrefix: clientId.slice(0, 15) + '...',
      scopes: ['openid', 'email', 'profile', 'drive.appdata'],
      origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
    });

    return new Promise((resolve, reject) => {
      try {
        const client = window.google!.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: scopes,
          callback: async (response) => {
            loggerLogin.info('Faza 4/5: Zaprimljen odgovor iz Google skočnog prozora (Popup callback)', {
              imaAccessToken: Boolean(response.access_token),
              imaGresku: Boolean(response.error),
            });

            if (response.error || !response.access_token) {
              const rawErr = response.error || 'Prijava je otkazana ili neuspjela.';
              const diagnosis = this.diagnoseAuthError(rawErr);
              loggerLogin.warn('Google prijava neuspjela ili otkazana:', {
                error: rawErr,
                kod: diagnosis.code,
                poruka: diagnosis.userMessage,
                savjet: diagnosis.actionableAdvice,
              });
              reject(new Error(`${diagnosis.userMessage} ${diagnosis.actionableAdvice}`));
              return;
            }

            const accessToken = response.access_token;
            const expiresIn = response.expires_in || 3600;

            loggerLogin.info('Google OAuth access token uspješno zaprimljen u callbacku!', {
              expiresInSec: expiresIn,
              tipTokena: (response as any).token_type || 'Bearer',
            });

            try {
              // Dohvati korisničke podatke (sub, email, name, picture)
              appLogger.scope('AUTH:GOOGLE:USERINFO').info('Faza 5/5: Šaljem zahtjev za dohvat profila na Google UserInfo endpoint (https://www.googleapis.com/oauth2/v3/userinfo)...');
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
              appLogger.scope('AUTH:GOOGLE:USERINFO').info('Korisnički profil uspješno preuzet s Google poslužitelja!', {
                email: userInfo.email,
                name: userInfo.name,
                subSidro: userInfo.sub,
              });

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

              loggerLogin.info('Pohranjujem Google identitet i kriptografsko sidro u lokalni spremnik preglednika...');
              this.saveSession(identity, tokens);
              loggerLogin.info(`Google autorizacija u potpunosti uspješna za korisnika: ${identity.email}! Kripto-sidro i Drive spremni.`);

              resolve({ identity, accessToken });
            } catch (err: any) {
              loggerLogin.error('Greška pri dohvaćanju i obradi profila korisnika:', {
                error: err?.message,
              });
              reject(err);
            }
          },
        });

        appLogger.scope('AUTH:GOOGLE:POPUP').info('Faza 3/5: Otvaram Google OAuth 2.0 skočni prozor za odabir računa... (Provjerite blokira li preglednik Pop-up prozor)');
        client.requestAccessToken();
        appLogger.scope('AUTH:GOOGLE:POPUP').info('Google Identity Services preuzeo kontrolu nad skočnim prozorom, čekam autorizaciju...');
      } catch (err: any) {
        loggerLogin.error('Greška pri inicijalizaciji requestAccessToken:', {
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
