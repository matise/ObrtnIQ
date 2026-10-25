import { describe, it, expect } from 'vitest';
import {
  normalizeZigoVoiceTranscript,
  getZigoDumanjeLabel,
  ZIGO_DUBROVNIK_PHRASES,
  ZIGO_FISCAL_PHRASES,
  validateGcpSttConfig,
  DEFAULT_ZIGO_STT_CONFIG,
  parseServiceAccountJson,
} from '../src/domain/voice';

describe('Voice Domain & In-Browser Speech Normalizer', () => {
  it('normalizira fiskalne i zakonske akronime razdvojene slovima ili točkama', () => {
    expect(normalizeZigoVoiceTranscript('pokaži mi k p r')).toBe('pokaži mi KPR');
    expect(normalizeZigoVoiceTranscript('što kaže knjiga prometa')).toBe('što kaže KPR');
    expect(normalizeZigoVoiceTranscript('unesi z.k.i. i j i r kod')).toBe('unesi ZKI i JIR kod');
    expect(normalizeZigoVoiceTranscript('provjeri o i b kupca')).toBe('provjeri OIB kupca');
    expect(normalizeZigoVoiceTranscript('izvezi p o s d obrazac')).toBe('izvezi PO-SD obrazac');
    expect(normalizeZigoVoiceTranscript('dodaj k p d šifru')).toBe('dodaj KPD šifru');
    expect(normalizeZigoVoiceTranscript('pošalji e-racun kupcu')).toBe('pošalji e-Račun kupcu');
  });

  it('normalizira porezni prag od 40.000 € u kanonski oblik', () => {
    expect(normalizeZigoVoiceTranscript('koliko fali do praga od 40000 eura')).toBe(
      'koliko fali do prag od 40.000 €'
    );
    expect(normalizeZigoVoiceTranscript('hoće li račun probiti prag od 40 tisuća eura')).toBe(
      'hoće li račun probiti prag od 40.000 €'
    );
  });

  it('normalizira specifične Žigine naredbe i fraze', () => {
    expect(normalizeZigoVoiceTranscript('žigo presjeci')).toBe('Žigo, presijeci');
    expect(normalizeZigoVoiceTranscript('Žigo, presijeci dramu')).toBe('Žigo, presijeci dramu');
    expect(normalizeZigoVoiceTranscript('izmjerimo ovo kroz orlandov lakat')).toBe(
      'izmjerimo ovo kroz Orlandov lakat'
    );
    expect(normalizeZigoVoiceTranscript('nema prese')).toBe('nema preše');
  });

  it('ispravno rukuje praznim ili nepostojećim unosom', () => {
    expect(normalizeZigoVoiceTranscript('')).toBe('');
    expect(normalizeZigoVoiceTranscript('   ')).toBe('');
  });

  it('vraća točan status dumanja ovisno o aktivnom ekranu', () => {
    expect(getZigoDumanjeLabel('KprDrawer')).toContain('poreznin limiton');
    expect(getZigoDumanjeLabel('InvoiceDesk')).toContain('pragom od 40.000 €');
    expect(getZigoDumanjeLabel('FiscalDrawer')).toContain('fiskalnog pečata');
    expect(getZigoDumanjeLabel('SettingsDrawer')).toContain('trezore');
    expect(getZigoDumanjeLabel('SystemLogDrawer')).toContain('bilješkama');
    expect(getZigoDumanjeLabel('NepoznatiEkran')).toContain('stanjem obrta');
  });

  it('sadrži definirane rječnike fraza s težinama', () => {
    expect(ZIGO_DUBROVNIK_PHRASES.length).toBeGreaterThan(5);
    expect(ZIGO_FISCAL_PHRASES.length).toBeGreaterThan(5);

    const duman = ZIGO_DUBROVNIK_PHRASES.find((p) => p.value === 'duman');
    expect(duman).toBeDefined();
    expect(duman?.boost).toBe(15.0);

    const kpr = ZIGO_FISCAL_PHRASES.find((p) => p.value === 'KPR');
    expect(kpr).toBeDefined();
    expect(kpr?.boost).toBe(15.0);
  });

  describe('Google Cloud STT V2 Config Validation', () => {
    it('ima ispravne zadane postavke s pregledničkim motorom', () => {
      expect(DEFAULT_ZIGO_STT_CONFIG.engine).toBe('browser');
      expect(DEFAULT_ZIGO_STT_CONFIG.gcpLocation).toBe('eu');
      expect(DEFAULT_ZIGO_STT_CONFIG.gcpModel).toBe('chirp_2');
      expect(DEFAULT_ZIGO_STT_CONFIG.enablePhraseAdaptation).toBe(true);

      const result = validateGcpSttConfig(DEFAULT_ZIGO_STT_CONFIG);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('validira obavezna polja kada je odabran gcp_stt_v2 motor s api_key načinom', () => {
      const invalid = validateGcpSttConfig({ engine: 'gcp_stt_v2', authMode: 'api_key' });
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.gcpApiKey).toBeDefined();
      expect(invalid.errors.gcpProjectId).toBeDefined();
      expect(invalid.errors.gcpLocation).toBeDefined();
    });

    it('provjerava format API ključa koji mora započinjati s AIza i imati dovoljnu duljinu', () => {
      const wrongPrefix = validateGcpSttConfig({
        engine: 'gcp_stt_v2',
        authMode: 'api_key',
        gcpApiKey: 'bad-key-without-prefix',
        gcpProjectId: 'obrtniq-prod',
        gcpLocation: 'eu',
      });
      expect(wrongPrefix.isValid).toBe(false);
      expect(wrongPrefix.errors.gcpApiKey).toContain('AIza');

      const tooShort = validateGcpSttConfig({
        engine: 'gcp_stt_v2',
        authMode: 'api_key',
        gcpApiKey: 'AIzaSyShort',
        gcpProjectId: 'obrtniq-prod',
        gcpLocation: 'eu',
      });
      expect(tooShort.isValid).toBe(false);
      expect(tooShort.errors.gcpApiKey).toContain('prekratak');
    });

    it('provjerava valjanost formata GCP Project ID-ja', () => {
      const invalidChars = validateGcpSttConfig({
        engine: 'gcp_stt_v2',
        authMode: 'api_key',
        gcpApiKey: 'AIzaSyD-123456789012345678901234567890123',
        gcpProjectId: 'Obrtniq_Prod!', // Velika slova, uskličnik, podvlaka
        gcpLocation: 'eu',
      });
      expect(invalidChars.isValid).toBe(false);
      expect(invalidChars.errors.gcpProjectId).toContain('Nevaljan Project ID');
    });

    it('prihvaća potpuno ispravnu konfiguraciju za gcp_stt_v2 s API ključem', () => {
      const valid = validateGcpSttConfig({
        engine: 'gcp_stt_v2',
        authMode: 'api_key',
        gcpApiKey: 'AIzaSyD-123456789012345678901234567890123',
        gcpProjectId: 'obrtniq-prod-123',
        gcpLocation: 'eu',
        gcpRecognizerId: 'zigo-recognizer-chirp2',
        gcpModel: 'chirp_2',
        enablePhraseAdaptation: true,
      });
      expect(valid.isValid).toBe(true);
      expect(Object.keys(valid.errors).length).toBe(0);
    });

    it('validira i parsira Service Account JSON u service_account načinu', () => {
      // 1. Prazan JSON
      const emptySa = validateGcpSttConfig({
        engine: 'gcp_stt_v2',
        authMode: 'service_account',
        gcpProjectId: 'obrtniq-prod',
        gcpLocation: 'eu',
      });
      expect(emptySa.isValid).toBe(false);
      expect(emptySa.errors.gcpServiceAccountJson).toBeDefined();

      // 2. Nevaljan JSON
      const invalidJson = validateGcpSttConfig({
        engine: 'gcp_stt_v2',
        authMode: 'service_account',
        gcpProjectId: 'obrtniq-prod',
        gcpLocation: 'eu',
        gcpServiceAccountJson: 'nije-json',
      });
      expect(invalidJson.isValid).toBe(false);
      expect(invalidJson.errors.gcpServiceAccountJson).toContain('Nevaljan JSON');

      // 3. Valjan Service Account JSON
      const validSaJson = JSON.stringify({
        type: 'service_account',
        project_id: 'obrtniq-project',
        private_key_id: 'abc123keyid',
        private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n',
        client_email: 'zigo-stt-runner@obrtniq-project.iam.gserviceaccount.com',
        client_id: '1234567890',
      });

      const validSa = validateGcpSttConfig({
        engine: 'gcp_stt_v2',
        authMode: 'service_account',
        gcpProjectId: 'obrtniq-project',
        gcpLocation: 'eu',
        gcpServiceAccountJson: validSaJson,
      });
      expect(validSa.isValid).toBe(true);
      expect(Object.keys(validSa.errors).length).toBe(0);

      // 4. parseServiceAccountJson izdvaja metapodatke
      const parsedMeta = parseServiceAccountJson(validSaJson);
      expect(parsedMeta.isValid).toBe(true);
      expect(parsedMeta.projectId).toBe('obrtniq-project');
      expect(parsedMeta.clientEmail).toBe('zigo-stt-runner@obrtniq-project.iam.gserviceaccount.com');
    });
  });
});
