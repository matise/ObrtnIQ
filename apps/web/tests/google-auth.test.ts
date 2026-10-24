import { describe, it, expect, beforeEach, vi } from 'vitest';
import { googleAuthService } from '../src/services/google-auth-service';
import type { GoogleAuthIdentity } from '@obrtniq/core';

// Mock localStorage for headless Node test environment
const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, String(value)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
  get length() {
    return store.size;
  },
  key: (index: number) => Array.from(store.keys())[index] || null,
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = mockLocalStorage;
}

// Mock window & location if not present
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    location: {
      origin: 'http://localhost:5173',
      protocol: 'http:',
      hostname: 'localhost',
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

describe('GoogleAuthService Diagnostics & Error Checking', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.restoreAllMocks();
  });

  describe('validateClientIdFormat', () => {
    it('validates a standard Google Client ID correctly', () => {
      const validId = '46149025714-vkc36k4sh11d8sdimk13dsr135a9h0bo.apps.googleusercontent.com';
      const result = googleAuthService.validateClientIdFormat(validId);
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('rejects empty or whitespace Client ID', () => {
      const result = googleAuthService.validateClientIdFormat('   ');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('nije unesen');
    });

    it('flags non-standard domains or missing .apps.googleusercontent.com', () => {
      const result = googleAuthService.validateClientIdFormat('my-custom-client-id-12345');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('apps.googleusercontent.com');
    });
  });

  describe('validateAuthorizedOrigin', () => {
    it('identifies localhost origin correctly', () => {
      const check = googleAuthService.validateAuthorizedOrigin();
      expect(check.origin).toBeDefined();
      expect(typeof check.valid).toBe('boolean');
      expect(typeof check.isLocalhost).toBe('boolean');
    });
  });

  describe('diagnoseAuthError', () => {
    it('diagnoses popup_closed_by_user', () => {
      const diag = googleAuthService.diagnoseAuthError({ error: 'popup_closed_by_user' });
      expect(diag.code).toBe('POPUP_CLOSED');
      expect(diag.userMessage).toContain('zatvoren');
      expect(diag.actionableAdvice).toContain('Kliknite ponovno');
    });

    it('diagnoses access_denied / scopes rejected', () => {
      const diag = googleAuthService.diagnoseAuthError('access_denied');
      expect(diag.code).toBe('ACCESS_DENIED');
      expect(diag.userMessage).toContain('odbijen');
      expect(diag.actionableAdvice).toContain('označiti sve zatražene dozvole');
    });

    it('diagnoses origin_mismatch', () => {
      const diag = googleAuthService.diagnoseAuthError('origin_mismatch');
      expect(diag.code).toBe('ORIGIN_MISMATCH');
      expect(diag.userMessage).toContain('nije autorizirana');
      expect(diag.actionableAdvice).toContain('Authorized JavaScript origins');
    });

    it('diagnoses invalid_client', () => {
      const diag = googleAuthService.diagnoseAuthError('invalid_client');
      expect(diag.code).toBe('INVALID_CLIENT');
      expect(diag.userMessage).toContain('Client ID');
    });

    it('diagnoses network_error', () => {
      const diag = googleAuthService.diagnoseAuthError(new Error('Failed to fetch from accounts.google.com'));
      expect(diag.code).toBe('NETWORK_ERROR');
      expect(diag.userMessage).toContain('Nije moguće uspostaviti vezu');
    });

    it('falls back to unknown_error for unexpected errors', () => {
      const diag = googleAuthService.diagnoseAuthError('something_completely_random');
      expect(diag.code).toBe('UNKNOWN_AUTH_ERROR');
      expect(diag.actionableAdvice).toBeDefined();
    });
  });

  describe('verifyScopesGranted', () => {
    it('confirms all required scopes when drive.appdata is included', () => {
      const scopes = [
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/drive.appdata'
      ];
      const res = googleAuthService.verifyScopesGranted(scopes);
      expect(res.allRequiredGranted).toBe(true);
      expect(res.hasDrive).toBe(true);
      expect(res.missingScopes).toHaveLength(0);
    });

    it('flags missing drive scope when only basic profile is granted', () => {
      const scopes = ['openid', 'email', 'profile'];
      const res = googleAuthService.verifyScopesGranted(scopes);
      expect(res.allRequiredGranted).toBe(false);
      expect(res.hasDrive).toBe(false);
      expect(res.missingScopes).toContain('drive.appdata');
    });
  });

  describe('verifySessionIntegrity & session management', () => {
    it('returns valid=false and tokenStatus=MISSING when storage is empty', () => {
      const integrity = googleAuthService.verifySessionIntegrity();
      expect(integrity.valid).toBe(false);
      expect(integrity.tokenStatus).toBe('MISSING');
      expect(integrity.reason).toContain('Nema pohranjenog');
    });

    it('verifies valid session with numeric 21-digit googleSub and provider GOOGLE', () => {
      const testIdentity: GoogleAuthIdentity = {
        provider: 'GOOGLE',
        googleSub: '109876543210987654321',
        email: 'obrtnik@test.hr',
        name: 'Test Obrtnik',
        pictureUrl: 'https://lh3.googleusercontent.com/test'
      };
      googleAuthService.saveSession(testIdentity, {
        accessToken: 'mock_token_123',
        expiresAt: Date.now() + 3600 * 1000,
      });

      const integrity = googleAuthService.verifySessionIntegrity();
      expect(integrity.valid).toBe(true);
      expect(integrity.tokenStatus).toBe('VALID');
      expect(integrity.identity?.googleSub).toBe('109876543210987654321');
      expect(integrity.remainingMinutes).toBeGreaterThan(0);
    });

    it('recovers gracefully from corrupt JSON in localStorage', () => {
      mockLocalStorage.setItem('obrtniq_google_identity', 'CORRUPT_JSON_{{');
      const integrity = googleAuthService.verifySessionIntegrity();
      expect(integrity.valid).toBe(false);
      expect(integrity.tokenStatus).toBe('MISSING');
      // Corrupt identity was automatically cleared
      expect(mockLocalStorage.getItem('obrtniq_google_identity')).toBeNull();
    });
  });

  describe('checkFullAuthHealth', () => {
    it('generates a complete structured health report', async () => {
      const report = await googleAuthService.checkFullAuthHealth();
      expect(report.timestamp).toBeDefined();
      expect(report.clientId).toBeDefined();
      expect(report.origin).toBeDefined();
      expect(report.network).toBeDefined();
      expect(report.session).toBeDefined();
      expect(report.overallStatus).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });
});
