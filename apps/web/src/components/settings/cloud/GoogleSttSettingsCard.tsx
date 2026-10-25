import React, { useState } from 'react';
import {
  Mic,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Cloud,
  HelpCircle,
  Key,
  FileCode,
  Upload,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import {
  type ZigoSttConfig,
  type ZigoSttEngine,
  type GcpSttAuthMode,
  type GoogleTtsConfig,
  DEFAULT_ZIGO_STT_CONFIG,
  parseServiceAccountJson,
  classifyVoice,
  DEFAULT_ZIGO_VOICE_CONFIG,
} from '@obrtniq/core';
import { useAudioTransport } from '../../../context/AudioTransportContext';
import { googleSttService } from '../../../services/google-stt-service';
import { googleTtsService } from '../../../services/google-tts-service';
import { getAppClientApiKey, maskApiKey } from '../../../services/app-client-credentials';
import { appLogger } from '../../../services/logger';

export const GoogleSttSettingsCard: React.FC = () => {
  const logger = appLogger.scope('SETTINGS:GOOGLE_STT');

  const [config, setConfig] = useState<ZigoSttConfig>(() => googleSttService.getConfig());
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [testStatus, setTestStatus] = useState<'TESTING' | 'SUCCESS' | 'ERROR' | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Google Cloud Text-to-Speech konfiguracija i dijagnostika
  const [ttsConfig, setTtsConfig] = useState<GoogleTtsConfig>(() => googleTtsService.getConfig());
  const [ttsTestStatus, setTtsTestStatus] = useState<'TESTING' | 'SUCCESS' | 'ERROR' | null>(null);
  const [ttsTestMessage, setTtsTestMessage] = useState<string | null>(null);
  const [showTtsApiKey, setShowTtsApiKey] = useState(false);

  // Provjera valjanosti formata polja
  const isApiKeyFormatValid =
    config.gcpApiKey?.trim().startsWith('AIza') && config.gcpApiKey.trim().length >= 35;
  const isProjectIdFormatValid =
    /^[a-z0-9][a-z0-9\-]{4,28}[a-z0-9]$/.test(config.gcpProjectId?.trim());
  const isServiceAccountValid =
    config.authMode === 'service_account' &&
    !!config.gcpServiceAccountJson &&
    parseServiceAccountJson(config.gcpServiceAccountJson).isValid;

  const isReadyForTesting =
    isProjectIdFormatValid &&
    (config.authMode === 'service_account' ? isServiceAccountValid : isApiKeyFormatValid);

  const credentialsUrl = config.gcpProjectId
    ? `https://console.cloud.google.com/apis/credentials?project=${encodeURIComponent(config.gcpProjectId)}`
    : 'https://console.cloud.google.com/apis/credentials';

  const serviceAccountsUrl = config.gcpProjectId
    ? `https://console.cloud.google.com/iam-admin/serviceaccounts?project=${encodeURIComponent(config.gcpProjectId)}`
    : 'https://console.cloud.google.com/iam-admin/serviceaccounts';

  const enableApiUrl = config.gcpProjectId
    ? `https://console.cloud.google.com/marketplace/product/google/speech.googleapis.com?project=${encodeURIComponent(config.gcpProjectId)}`
    : 'https://console.cloud.google.com/marketplace/product/google/speech.googleapis.com';

  // Siguran dohvat globalnog audio transporta
  let audioTransport: ReturnType<typeof useAudioTransport> | null = null;
  try {
    audioTransport = useAudioTransport();
  } catch {
    // Tihi fallback ako se komponenta montira izvan Providera
  }

  const handleEngineChange = (engine: ZigoSttEngine) => {
    logger.info('Promijenjen STT engine:', { engine });
    setConfig((prev) => ({ ...prev, engine }));
    setSaveSuccess(false);
    setTestStatus(null);
    setTestMessage(null);

    // Čišćenje i rekreacija transporta s novom konfiguracijom
    audioTransport?.clearQueue();
    audioTransport?.reloadVoices();
  };

  const handleAuthModeChange = (authMode: GcpSttAuthMode) => {
    logger.info('Promijenjen STT auth mode:', { authMode });
    setConfig((prev) => ({ ...prev, authMode }));
    setSaveSuccess(false);
    setTestStatus(null);
    setTestMessage(null);

    // Čišćenje transporta
    audioTransport?.clearQueue();
  };

  const handleChange = <K extends keyof ZigoSttConfig>(field: K, val: ZigoSttConfig[K]) => {
    setConfig((prev) => ({ ...prev, [field]: val }));
    setSaveSuccess(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = (event.target?.result as string) || '';
          const parsed = parseServiceAccountJson(content);
          if (parsed.isValid) {
            setConfig((prev) => ({
              ...prev,
              authMode: 'service_account',
              gcpServiceAccountJson: content,
              gcpProjectId: parsed.projectId || prev.gcpProjectId,
              gcpClientEmail: parsed.clientEmail || '',
            }));
            logger.info('Učitan Service Account JSON:', {
              projectId: parsed.projectId,
              clientEmail: parsed.clientEmail,
            });
            setSaveSuccess(false);
            setTestStatus(null);
            setTestMessage(null);

            // Počisti trenutni transport
            audioTransport?.clearQueue();
          } else {
            alert(parsed.error || 'Datoteka nije valjan Service Account JSON ključ.');
          }
        } catch (err: any) {
          alert(`Greška pri čitanju datoteke: ${err?.message || 'Nevaljan JSON'}`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSave = () => {
    try {
      googleSttService.saveConfig(config);
      logger.info('STT postavke spremljene lokalno u preglednik');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Nakon spremanja konfiguracije počisti transport i re-sinkroniziraj glasove
      audioTransport?.clearQueue();
      audioTransport?.reloadVoices();
    } catch (err: any) {
      alert(`Greška pri spremanju STT postavki: ${err?.message || 'Nepoznata greška'}`);
    }
  };

  const handleTest = async () => {
    logger.info('Pokretanje testiranja Google Cloud STT V2 konfiguracije', {
      authMode: config.authMode,
      engine: config.engine,
    });
    setTestStatus('TESTING');
    setTestMessage('Inicijalizacija provjere GCP STT V2...');

    const result = await googleSttService.testConnection(config);
    if (result.success) {
      setTestStatus('SUCCESS');
      setTestMessage(result.message);
      setTimeout(() => {
        setTestStatus((curr) => (curr === 'SUCCESS' ? null : curr));
      }, 6000);
    } else {
      setTestStatus('ERROR');
      setTestMessage(result.message);
    }
  };

  const handlePlayTestNarration = () => {
    if (!audioTransport) {
      alert('Audio transport nije dostupan u ovom pregledniku.');
      return;
    }
    logger.info('Pokretanje testne naracije Žiga iz postavki STT/TTS');
    const testMsg = `### 1. Opservacija
Gosparu, provjeravan audio transport i stanje glasovnog bedema.

### 2. Dijagnoza
Konfiguracija motora je osvježena. Leksikalni normalizator za KPR, ZKI, JIR i prag od 40.000 eura je u punoj pripravnosti.

### 3. Žigin Rez
Nema preše! Transportna lista procesira stavke element po element, a ti slobodno nastavi rabotu.`;

    audioTransport.playMessage('test-settings-narration', testMsg);
  };

  const handleStopNarration = () => {
    logger.info('Zaustavljanje naracije i pražnjenje transport liste iz postavki');
    audioTransport?.clearQueue();
  };

  const handleTtsConfigChange = <K extends keyof GoogleTtsConfig>(field: K, val: GoogleTtsConfig[K]) => {
    setTtsConfig((prev) => {
      const updated = { ...prev, [field]: val };
      googleTtsService.saveConfig(updated);
      audioTransport?.reloadVoices();
      return updated;
    });
  };

  const handleTtsTest = async () => {
    logger.info('Testiranje Google Cloud TTS veze...', {
      voiceName: ttsConfig.voiceName,
      useSttApiKey: ttsConfig.useSttApiKey,
    });
    setTtsTestStatus('TESTING');
    setTtsTestMessage('Sintetiziram testni govor preko Google Cloud TTS API-ja...');

    const result = await googleTtsService.testConnection(ttsConfig);
    if (result.success) {
      setTtsTestStatus('SUCCESS');
      setTtsTestMessage(result.message);
      if (result.audioUrl) {
        try {
          const testAudio = new Audio(result.audioUrl);
          testAudio.play().catch(() => {});
        } catch {}
      }
      setTimeout(() => {
        setTtsTestStatus((curr) => (curr === 'SUCCESS' ? null : curr));
      }, 7000);
    } else {
      setTtsTestStatus('ERROR');
      setTtsTestMessage(result.message);
    }
  };

  const handleReset = () => {
    if (confirm('Želite li vratiti postavke prepoznavanja govora na zadane vrijednosti?')) {
      setConfig({ ...DEFAULT_ZIGO_STT_CONFIG });
      googleSttService.saveConfig({ ...DEFAULT_ZIGO_STT_CONFIG });
      setSaveSuccess(true);
      setTestStatus(null);
      setTestMessage(null);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Počisti transport i sinkroniziraj
      audioTransport?.clearQueue();
      audioTransport?.reloadVoices();
    }
  };

  return (
    <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-4 font-mono">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded bg-[#ffd700]/15 border border-[#ffd700]/40 flex items-center justify-center text-[#ffd700] flex-shrink-0">
          <Mic className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-bold uppercase text-white flex items-center gap-2">
            <span>Žigo Glasovni Asistent &bull; Speech-to-Text V2</span>
            <span className="text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.2 border border-amber-500/30">
              Hibrid / BYOK
            </span>
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Konfigurirajte motor za glasovno prepoznavanje govora (STT). Odaberite besplatni lokalni preglednički motor ili napredni Google Cloud Speech-to-Text V2 (Chirp 2) s dubrovačkom i poreznom adaptacijom.
          </p>
        </div>
      </div>

      {/* Engine Selection Toggle */}
      <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
        <label className="text-xs text-[var(--text-secondary)] font-semibold block">
          Odabir STT Motora za Prepoznavanje Govora
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Option 1: Browser Web Speech API */}
          <button
            type="button"
            onClick={() => handleEngineChange('browser')}
            className={`p-3 text-left border transition-all cursor-pointer flex items-start gap-2.5 ${
              config.engine === 'browser'
                ? 'bg-amber-500/10 border-[#ffd700] text-white shadow-sm'
                : 'bg-[var(--bg-surface)] border-[var(--border-strong)] text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4 text-[#ffd700] mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>Preglednički Web Speech API</span>
                {config.engine === 'browser' && (
                  <span className="text-[9px] bg-amber-400 text-black px-1 font-bold">AKTIVAN</span>
                )}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                100% lokalno u pregledniku, besplatno, bez API ključeva i trenutno spremno.
              </p>
            </div>
          </button>

          {/* Option 2: Google Cloud STT V2 */}
          <button
            type="button"
            onClick={() => handleEngineChange('gcp_stt_v2')}
            className={`p-3 text-left border transition-all cursor-pointer flex items-start gap-2.5 ${
              config.engine === 'gcp_stt_v2'
                ? 'bg-blue-500/10 border-blue-400 text-white shadow-sm'
                : 'bg-[var(--bg-surface)] border-[var(--border-strong)] text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>Google Cloud STT V2 (Chirp 2)</span>
                {config.engine === 'gcp_stt_v2' && (
                  <span className="text-[9px] bg-blue-500 text-white px-1 font-bold">AKTIVAN</span>
                )}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                Vrhunski model za hrvatski jezik uz SpeechAdaptation i podršku za raguzejski leksik.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Cloud Configuration Fields (Visible when gcp_stt_v2 is selected) */}
      {config.engine === 'gcp_stt_v2' && (
        <div className="space-y-4 pt-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-3 border">
          {/* Quick Setup Guide Accordion */}
          <div className="p-3 bg-[#131b2e] border border-blue-500/30 rounded-none text-xs text-blue-200">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full flex items-center justify-between text-left font-bold text-blue-300 hover:text-blue-100 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#ffd700]" />
                <span>Kako konfigurirati Google Cloud za STT V2? (Vodič u 3 koraka)</span>
              </span>
              {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showGuide && (
              <div className="mt-3 pt-3 border-t border-blue-500/20 space-y-2.5 text-[11px] text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-900 border border-blue-400 flex items-center justify-center font-bold text-[10px] text-white flex-shrink-0">
                    A
                  </span>
                  <div>
                    <strong className="text-white">Omogućite Cloud Speech-to-Text API:</strong>
                    <p className="text-slate-400">
                      U Google Cloud konzoli provjerite je li uključen Speech-to-Text API za projekt <strong>{config.gcpProjectId || 'obrtiq-project'}</strong>.
                    </p>
                    <a
                      href={enableApiUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#ffd700] hover:underline inline-flex items-center gap-1 mt-0.5 font-semibold"
                    >
                      Otvori stranicu za omogućavanje API-ja <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-900 border border-blue-400 flex items-center justify-center font-bold text-[10px] text-white flex-shrink-0">
                    B
                  </span>
                  <div>
                    <strong className="text-white">Kreirajte Service Account (Preporučeno za Streaming):</strong>
                    <p className="text-slate-400">
                      Idite na <strong>IAM & Admin &gt; Service Accounts</strong>, kliknite <strong>&quot;+ CREATE SERVICE ACCOUNT&quot;</strong>, dodijelite ulogu <strong>Cloud Speech Client</strong>, pod tabom <em>Keys</em> kreirajte <strong>JSON</strong> ključ i učitajte ga ispod.
                    </p>
                    <a
                      href={serviceAccountsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#ffd700] hover:underline inline-flex items-center gap-1 mt-0.5 font-semibold"
                    >
                      Otvori Service Accounts konzolu <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-900 border border-blue-400 flex items-center justify-center font-bold text-[10px] text-white flex-shrink-0">
                    C
                  </span>
                  <div>
                    <strong className="text-white">Ili kreirajte klasični API Key (za REST pozive):</strong>
                    <p className="text-slate-400">
                      Ako koristite jednostavni API ključ, idite na <strong>APIs & Services &gt; Credentials</strong>, kliknite <strong>&quot;+ CREATE CREDENTIALS &gt; API key&quot;</strong> i ograničite ga samo na <em>Cloud Speech-to-Text API</em>.
                    </p>
                    <a
                      href={credentialsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#ffd700] hover:underline inline-flex items-center gap-1 mt-0.5 font-semibold"
                    >
                      Otvori GCP Credentials konzolu <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Project ID */}
          <div>
            <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] font-semibold mb-1">
              <label className="flex items-center gap-1.5">
                <span>Google Cloud Project ID</span>
                {config.gcpProjectId && isProjectIdFormatValid && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </label>
              <span className="text-[10px] text-[var(--text-muted)]">npr. obrtiq-project-12345</span>
            </div>
            <input
              type="text"
              value={config.gcpProjectId}
              onChange={(e) => handleChange('gcpProjectId', e.target.value.trim())}
              placeholder="obrtniq-demo-project"
              className={`w-full bg-[var(--bg-surface)] text-white px-3 py-2 font-mono text-xs border outline-none ${
                config.gcpProjectId && !isProjectIdFormatValid
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-[var(--border-strong)] focus:border-[#ffd700]'
              }`}
            />
            <div className="flex justify-between items-center mt-1 text-[10px]">
              <span className="text-[var(--text-muted)]">
                Pronađite točan ID u gornjem izborniku Google Cloud konzole (Project info).
              </span>
              {config.gcpProjectId && !isProjectIdFormatValid && (
                <span className="text-rose-400">Mora imati 6-30 malih slova, brojeva ili crtica.</span>
              )}
            </div>
          </div>

          {/* Dual-Mode Auth Switcher */}
          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
            <label className="text-xs text-[var(--text-secondary)] font-semibold block">
              Način Autorizacije prema Google Cloud STT V2
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAuthModeChange('service_account')}
                className={`p-2.5 text-left border transition-all cursor-pointer flex items-start gap-2 ${
                  config.authMode === 'service_account'
                    ? 'bg-amber-500/10 border-amber-400 text-amber-200'
                    : 'bg-[var(--bg-surface)] border-[var(--border-strong)] text-[var(--text-muted)] hover:text-white'
                }`}
              >
                <FileCode className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold">🔑 Service Account JSON</div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    Preporučeno za streaming u stvarnom vremenu s gRPC protokolom.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAuthModeChange('api_key')}
                className={`p-2.5 text-left border transition-all cursor-pointer flex items-start gap-2 ${
                  config.authMode === 'api_key'
                    ? 'bg-blue-500/10 border-blue-400 text-blue-200'
                    : 'bg-[var(--bg-surface)] border-[var(--border-strong)] text-[var(--text-muted)] hover:text-white'
                }`}
              >
                <Key className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold">⚡ Klasični API Key</div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    Za sinkrone REST pozive (transkripcija snimljenih isječaka).
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Auth Input: Service Account JSON Upload */}
          {config.authMode === 'service_account' ? (
            <div className="space-y-2 p-3 bg-[var(--bg-surface)] border border-[var(--border-strong)]">
              <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] font-semibold">
                <label className="flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#ffd700]" />
                  <span>Service Account JSON Ključ</span>
                </label>
                <a
                  href={serviceAccountsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-[#ffd700] hover:underline flex items-center gap-1 font-semibold"
                >
                  Otvori GCP Service Accounts <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-[#ffd700] file:text-black hover:file:bg-[#ffe135] cursor-pointer"
                />
                {isServiceAccountValid && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Učitan Service Account: {config.gcpClientEmail || 'zigo-stt-runner'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">
                Preuzmite JSON ključ iz GCP konzole (IAM & Admin &gt; Service Accounts &gt; Keys &gt; Create new key &gt; JSON).
              </p>
            </div>
          ) : (
            /* Auth Input: Standard API Key */
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] font-semibold mb-1">
                <label className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#ffd700]" />
                  <span>Google Cloud API Ključ (REST)</span>
                  {config.gcpApiKey && isApiKeyFormatValid && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </label>
                <a
                  href={credentialsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-[#ffd700] hover:underline flex items-center gap-1 font-semibold"
                >
                  Kreirajte ključ na GCP konzoli <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={config.gcpApiKey}
                    onChange={(e) => handleChange('gcpApiKey', e.target.value.trim())}
                    placeholder={getAppClientApiKey() ? `Web Client ključ aplikacije (${maskApiKey(getAppClientApiKey())})` : 'AIzaSy...'}
                    className={`w-full bg-[var(--bg-surface)] text-white px-3 py-2 pr-9 font-mono text-xs border outline-none ${
                      config.gcpApiKey && !isApiKeyFormatValid
                        ? 'border-rose-500 focus:border-rose-400'
                        : 'border-[var(--border-strong)] focus:border-[#ffd700]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                    title={showApiKey ? 'Sakrij ključ' : 'Prikaži ključ'}
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              {getAppClientApiKey() && !config.gcpApiKey && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold pt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Ugrađeni Web Client API ključ aplikacije je aktivan ({maskApiKey(getAppClientApiKey())}). Koristi se automatski.</span>
                </div>
              )}
              <p className="text-[10px] text-amber-300/80 pt-0.5">
                ⚠️ Napomena: Standardni API ključ omogućuje transkripciju snimljenih audio isječaka (REST), dok je za neprekinuti gRPC streaming u stvarnom vremenu potreban Service Account ili preglednički Web Speech API.
              </p>
            </div>
          )}

          {/* Location & Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] font-semibold mb-1 block">
                Lokacija / Regija (GCP Region)
              </label>
              <select
                value={config.gcpLocation}
                onChange={(e) => handleChange('gcpLocation', e.target.value)}
                className="w-full bg-[var(--bg-surface)] text-white px-3 py-2 font-mono text-xs border border-[var(--border-strong)] focus:border-[#ffd700] outline-none cursor-pointer"
              >
                <option value="eu">eu (Europska Unija &bull; Preporučeno za GDPR)</option>
                <option value="us-central1">us-central1 (SAD Centralno)</option>
                <option value="global">global (Globalno)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-[var(--text-secondary)] font-semibold mb-1 block">
                Model Prepoznavanja
              </label>
              <select
                value={config.gcpModel}
                onChange={(e) => handleChange('gcpModel', e.target.value as any)}
                className="w-full bg-[var(--bg-surface)] text-white px-3 py-2 font-mono text-xs border border-[var(--border-strong)] focus:border-[#ffd700] outline-none cursor-pointer"
              >
                <option value="chirp_2">chirp_2 (Najnoviji višejezični model)</option>
                <option value="latest_short">latest_short (Kratke naredbe)</option>
                <option value="chirp">chirp (Prva generacija)</option>
                <option value="long">long (Za duže govore)</option>
              </select>
            </div>
          </div>

          {/* Advanced Accordion: Recognizer ID, Audio Format & Adaptation */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] text-[var(--text-muted)] hover:text-white flex items-center gap-1 cursor-pointer pt-1"
            >
              <span>Napredne opcije (Recognizer ID, Audio Format & Phrase Adaptation)</span>
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showAdvanced && (
              <div className="space-y-3 pt-2 mt-2 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 border">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] font-semibold mb-1 block">
                    GCP Recognizer ID
                  </label>
                  <input
                    type="text"
                    value={config.gcpRecognizerId}
                    onChange={(e) => handleChange('gcpRecognizerId', e.target.value.trim())}
                    placeholder="zigo-recognizer-chirp2 (ili _ za automatski)"
                    className="w-full bg-[var(--bg-surface)] text-white px-3 py-2 font-mono text-xs border border-[var(--border-strong)] focus:border-[#ffd700] outline-none"
                  />
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    ID konfiguriranog prepoznavača u GCP lokaciji (zadano: zigo-recognizer-chirp2, ili _ za zadani).
                  </p>
                </div>

                <div className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-slate-300 space-y-1">
                  <div className="text-[11px] font-bold text-amber-300">Format ulaznog audio toka:</div>
                  <div className="text-[10px] text-slate-400">
                    &bull; Standard: <code>Linear PCM 16.000 Hz, 1-kanal (Mono)</code><br />
                    &bull; Klijentski preglednik: <code>AudioWorkletNode / WebM Opus capture</code>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="phrase-adaptation-toggle"
                    checked={config.enablePhraseAdaptation}
                    onChange={(e) => handleChange('enablePhraseAdaptation', e.target.checked)}
                    className="w-4 h-4 accent-[#ffd700] cursor-pointer"
                  />
                  <label htmlFor="phrase-adaptation-toggle" className="text-xs text-white cursor-pointer">
                    Aktiviraj SpeechAdaptation za dubrovački govor i fiskalne pojmove (KPR, ZKI, JIR, prag 40.000 €)
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Test connection results */}
          {testStatus === 'SUCCESS' && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-emerald-200">Veza je uspješno uspostavljena!</p>
                <p className="mt-0.5 text-[11px] text-emerald-300/90">{testMessage}</p>
              </div>
            </div>
          )}

          {testStatus === 'ERROR' && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div>
                  <p className="font-bold text-rose-200">Provjera veze nije uspjela:</p>
                  <p className="mt-0.5 text-[11px] text-rose-300/90 leading-relaxed">{testMessage}</p>
                </div>

                {/* Kontekstualni koraci za rješenje ovisno o uzroku greške */}
                {config.authMode === 'service_account' && (
                  <div className="pt-2 border-t border-rose-500/30">
                    <p className="text-[10px] text-rose-200 mb-1">
                      💡 <strong>Uputa:</strong> Preuzmite Service Account JSON ključ s Google Cloud konzole:
                    </p>
                    <a
                      href={serviceAccountsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#ffd700] hover:underline font-bold"
                    >
                      <span>Otvori GCP Service Accounts konzolu</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {config.authMode === 'api_key' &&
                  (!config.gcpApiKey ||
                    testMessage?.includes('AIza') ||
                    testMessage?.includes('ključ') ||
                    testMessage?.includes('API_KEY')) && (
                    <div className="pt-2 border-t border-rose-500/30">
                      <p className="text-[10px] text-rose-200 mb-1">
                        💡 <strong>Uputa:</strong> Potrebno je generirati i unijeti API ključ na Google Cloud konzoli:
                      </p>
                      <a
                        href={credentialsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#ffd700] hover:underline font-bold"
                      >
                        <span>Otvori GCP Credentials konzolu i kreiraj API ključ</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                {(testMessage?.includes('nije omogućen') ||
                  testMessage?.includes('disabled') ||
                  testMessage?.includes('403')) && (
                  <div className="pt-2 border-t border-rose-500/30">
                    <p className="text-[10px] text-rose-200 mb-1">
                      💡 <strong>Uputa:</strong> Uključite Cloud Speech-to-Text API za projekt <strong>{config.gcpProjectId}</strong>:
                    </p>
                    <a
                      href={enableApiUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#ffd700] hover:underline font-bold"
                    >
                      <span>Omogući Cloud Speech API u Google Cloud konzoli</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status i Kontrole Audio Transporta & Testna Naracija Žiga */}
      <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#ffd700]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Status Naratora & Audio Transport
            </span>
          </div>
          <div className="flex items-center gap-2">
            {audioTransport?.status === 'playing' && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ŽIGO GOVORI
              </span>
            )}
            {audioTransport?.status === 'paused' && (
              <span className="px-2 py-0.5 bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                PAUZIRANO
              </span>
            )}
            {(!audioTransport || audioTransport.status === 'idle' || audioTransport.status === 'stopped') && (
              <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                MIROVANJE (IDLE)
              </span>
            )}
          </div>
        </div>

        {/* Konfiguracija TTS Motora: Google Cloud Text-to-Speech (Primarno) & Microsoft/Preglednik (Fallback) */}
        {(() => {
          const currentVoice = audioTransport?.currentVoice;
          const classification = currentVoice ? classifyVoice(currentVoice) : null;
          const isGoogleEngine = audioTransport?.ttsEngine === 'google_cloud';
          const effectiveAuth = googleTtsService.getEffectiveAuth(ttsConfig);
          const effectiveApiKey = effectiveAuth.apiKey || effectiveAuth.accessToken || '';
          const isGoogleConfigured = googleTtsService.isConfigured();
          const appClientKey = getAppClientApiKey();

          return (
            <div className="p-3 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3">
              {/* Zaglavlje TTS odjeljka */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#ffd700]" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                    Sinteza Govora Žiga &bull; Text-to-Speech (TTS):
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isGoogleEngine && isGoogleConfigured ? (
                    <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                      <Cloud className="w-3 h-3 text-emerald-400" />
                      GOOGLE CLOUD TTS AKTIVAN
                    </span>
                  ) : isGoogleEngine ? (
                    <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      ČEKA GOOGLE API KLJUČ (FALLBACK AKTIVAN)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-slate-400" />
                      LOKALNI PREGLEDNIK / MICROSOFT
                    </span>
                  )}
                </div>
              </div>

              {/* Preklopnik motora: Google Cloud TTS vs Lokalni preglednik */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    audioTransport?.setTtsEngine('google_cloud');
                    handleTtsConfigChange('engine', 'google_cloud');
                  }}
                  className={`p-2.5 border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    isGoogleEngine
                      ? 'bg-[#ffd700]/10 border-[#ffd700] text-white shadow-sm'
                      : 'bg-[var(--bg-elevated)] border-[var(--border-strong)] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    isGoogleEngine ? 'border-[#ffd700] bg-[#ffd700]' : 'border-slate-500'
                  }`}>
                    {isGoogleEngine && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Google Cloud Text-to-Speech (Primarno)
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                      Vrhunska WaveNet/Neural sinteza, muški duboki bariton, prirodna intonacija.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioTransport?.setTtsEngine('browser');
                    handleTtsConfigChange('engine', 'browser');
                  }}
                  className={`p-2.5 border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    !isGoogleEngine
                      ? 'bg-[#ffd700]/10 border-[#ffd700] text-white shadow-sm'
                      : 'bg-[var(--bg-elevated)] border-[var(--border-strong)] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    !isGoogleEngine ? 'border-[#ffd700] bg-[#ffd700]' : 'border-slate-500'
                  }`}>
                    {!isGoogleEngine && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Lokalni preglednik / Microsoft (Fallback)
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                      100% lokalno u pregledniku (Microsoft Matej), radi offline bez API ključa.
                    </span>
                  </div>
                </button>
              </div>

              {/* Sekcija za konfiguraciju i testiranje Google Cloud TTS API-ja */}
              {isGoogleEngine && (
                <div className="p-3 bg-[#13151b] border border-[#ffd700]/30 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-bold text-[#ffd700]">
                    <div className="flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Postavke Google Cloud Text-to-Speech API-ja</span>
                    </div>
                    <a
                      href="https://console.cloud.google.com/marketplace/product/google/texttospeech.googleapis.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <span>GCP Text-to-Speech Konzola</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Korištenje postojećeg STT API ključa */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="checkbox"
                      id="useSttApiKeyCheck"
                      checked={ttsConfig.useSttApiKey}
                      onChange={(e) => handleTtsConfigChange('useSttApiKey', e.target.checked)}
                      className="accent-[#ffd700] cursor-pointer"
                    />
                    <label htmlFor="useSttApiKeyCheck" className="text-[11px] text-slate-300 cursor-pointer select-none">
                      Koristi isti Google API ključ kao i za Speech-to-Text V2
                    </label>
                  </div>

                  {/* Ako korisnik želi zaseban TTS API ključ */}
                  {!ttsConfig.useSttApiKey && (
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        Zaseban Google Cloud API ključ za Text-to-Speech:
                      </label>
                      <div className="relative">
                        <input
                          type={showTtsApiKey ? 'text' : 'password'}
                          value={ttsConfig.apiKey}
                          onChange={(e) => handleTtsConfigChange('apiKey', e.target.value)}
                          placeholder={appClientKey ? `Web Client ključ aplikacije (${maskApiKey(appClientKey)})` : 'AIzaSy...'}
                          className="w-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2.5 py-1.5 text-xs text-white pr-9 focus:outline-none focus:border-[#ffd700]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowTtsApiKey((p) => !p)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showTtsApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {appClientKey && !ttsConfig.apiKey && (
                        <p className="text-[10px] text-emerald-400 font-semibold pt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>Ugrađeni Web Client API ključ aplikacije je aktivan ({maskApiKey(appClientKey)}). Koristi se automatski.</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Odabir Google Cloud Glasa */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        Google Cloud Glas za Orlanda:
                      </label>
                      <select
                        value={ttsConfig.voiceName}
                        onChange={(e) => handleTtsConfigChange('voiceName', e.target.value)}
                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ffd700]"
                      >
                        <option value="hr-HR-Wavenet-B">hr-HR-Wavenet-B (Muški bariton - Preporučeno)</option>
                        <option value="hr-HR-Wavenet-A">hr-HR-Wavenet-A (Ženski Wavenet)</option>
                        <option value="hr-HR-Standard-A">hr-HR-Standard-A (Standardni glas)</option>
                        <option value="sr-RS-Wavenet-A">sr-RS-Wavenet-A (Južnoslavenski muški)</option>
                        <option value="sr-RS-Standard-A">sr-RS-Standard-A (Južnoslavenski standard)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        Format zvuka (Audio Encoding):
                      </label>
                      <select
                        value={ttsConfig.audioEncoding}
                        onChange={(e) => handleTtsConfigChange('audioEncoding', e.target.value as any)}
                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ffd700]"
                      >
                        <option value="MP3">MP3 (Najšira podrška, niska latencija)</option>
                        <option value="OGG_OPUS">OGG Opus (Visoka kompresija)</option>
                      </select>
                    </div>
                  </div>

                  {/* Debug & Test Panel za Google TTS */}
                  <div className="p-2.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-300 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span>Aktivni ključ / vjerodajnica:</span>
                          <strong className={effectiveApiKey ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                            {effectiveApiKey ? maskApiKey(effectiveApiKey) : 'Nije postavljen'}
                          </strong>
                        </div>
                        {effectiveAuth.source !== 'none' && (
                          <div className="text-[10px] text-[#ffd700]/90 font-sans flex items-center gap-1">
                            <span>Izvor:</span>
                            <span className="font-semibold">{effectiveAuth.sourceLabel}</span>
                          </div>
                        )}
                        {effectiveAuth.source === 'oauth_token' && (
                          <div className="text-[10px] text-amber-300/90 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 mt-1">
                            ⚠️ Napomena: Google prijava je autorizirana za Google Drive. Za Cloud TTS preporučuje se unijeti Google Cloud API ključ (AIzaSy...) u polje iznad.
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleTtsTest}
                        disabled={ttsTestStatus === 'TESTING' || !effectiveApiKey}
                        className="px-3 py-1.5 bg-[#ffd700]/15 hover:bg-[#ffd700]/25 border border-[#ffd700]/50 text-[#ffd700] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm active:scale-95"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${ttsTestStatus === 'TESTING' ? 'animate-spin' : ''}`} />
                        <span>{ttsTestStatus === 'TESTING' ? 'Provjeravam...' : 'Testiraj i Debugiraj Google TTS Vezu'}</span>
                      </button>
                    </div>

                    {ttsTestStatus && (
                      <div
                        className={`p-2.5 text-xs border flex items-start gap-2 ${
                          ttsTestStatus === 'SUCCESS'
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                            : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                        }`}
                      >
                        {ttsTestStatus === 'SUCCESS' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div className="text-[11px] leading-relaxed flex-1">
                          <p className="font-semibold">{ttsTestMessage}</p>
                          {ttsTestStatus === 'ERROR' && (
                            <div className="mt-1 space-y-1">
                              {(ttsTestMessage || '').toLowerCase().includes('scopes') ? (
                                <div className="p-2 bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[10px] space-y-1 mt-1.5">
                                  <p className="font-bold text-amber-300">💡 Kako riješiti grešku (Scopes / Ovlasti):</p>
                                  <p>
                                    Prijavljeni Google račun ima OAuth dozvole isključivo za privatni <strong>Google Drive</strong>. Za Google Cloud Text-to-Speech <strong>nije potrebno dodavati rizične OAuth opsege</strong> na korisnički račun.
                                  </p>
                                  <p>
                                    <strong>Preporučeni korak:</strong> U Google Cloud konzoli stvorite standardni <strong>API ključ (AIzaSy...)</strong> i zalijepite ga u polje <em>"Google Cloud API ključ"</em> ili u <code>.env</code> datoteku kao <code>VITE_GOOGLE_CLIENT_API_KEY</code>. API ključ radi automatski za sve korisnike bez ikakvih OAuth dozvola.
                                  </p>
                                </div>
                              ) : (
                                <p className="text-rose-300/80 mt-1">
                                  Provjerite je li na Google Cloud projektu uključen <strong>Cloud Text-to-Speech API</strong> i ima li API ključ odgovarajuća prava.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sekcija: Lokalni Microsoft / Preglednički fallback & Tonalitet */}
              <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[#ffd700]" />
                    <span className="text-[11px] font-bold text-slate-200 uppercase">
                      Lokalni preglednički glas (Fallback &amp; Offline):
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {classification?.isMale && (
                      <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[9px] font-bold">
                        MUŠKI BARITON (MATEJ)
                      </span>
                    )}
                    {classification?.isFemale && (
                      <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[9px] font-bold">
                        ŽENSKI GLAS (DUBOKI KOREKCIJSKI REGISTAR)
                      </span>
                    )}
                  </div>
                </div>

                {/* Upozorenje ako lokalni fallback ima samo ženski glas */}
                {classification?.isFemale && (
                  <div className="p-2 bg-amber-950/30 border border-amber-600/40 text-amber-200 text-[10px] leading-relaxed">
                    Za optimalan lokalni fallback u Windowsima preporučujemo instalaciju hrvatskog muškog glasa <strong>(Microsoft Matej)</strong> u postavkama sustava (Settings &gt; Time &amp; Language &gt; Speech).
                  </div>
                )}

                {/* Odabir lokalnog glasa */}
                <div>
                  <select
                    value={audioTransport?.selectedVoiceURI || ''}
                    onChange={(e) => audioTransport?.setVoiceURI(e.target.value)}
                    className="w-full bg-[var(--bg-canvas)] border border-[var(--border-strong)] px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#ffd700]"
                  >
                    <option value="">
                      Automatski odabir (Prioritet muškog stoičkog baritona viteza Orlanda)
                    </option>
                    {(audioTransport?.availableVoices || []).map((v) => {
                      const c = classifyVoice(v);
                      const prefix = c.isCroatian
                        ? c.isMale
                          ? '🇭🇷 [HR Muški - Matej] '
                          : '🇭🇷 [HR Ženski] '
                        : c.isSlavic
                        ? c.isMale
                          ? '🛡️ [Slavenski Muški] '
                          : '🛡️ [Slavenski Ženski] '
                        : c.isMale
                        ? '🎙️ [Muški] '
                        : '';
                      const uri = v.voiceURI || v.name;
                      return (
                        <option key={uri} value={uri}>
                          {prefix}{v.name} ({v.lang})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Zajednički klizači za Pitch i Rate (vrijede za Google TTS i Local Fallback) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-2 bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-300 font-medium">
                        Dubina tona (Pitch): <strong className="text-[#ffd700]">{audioTransport?.voicePitch}</strong>
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        Zadano: {DEFAULT_ZIGO_VOICE_CONFIG.pitch}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.60"
                      max="1.20"
                      step="0.02"
                      value={audioTransport?.voicePitch || DEFAULT_ZIGO_VOICE_CONFIG.pitch}
                      onChange={(e) => audioTransport?.setVoicePitch(parseFloat(e.target.value))}
                      className="w-full accent-[#ffd700] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-gray-500 mt-0.5">
                      <span>Duboki bas (0.60)</span>
                      <span>Visoki ton (1.20)</span>
                    </div>
                  </div>

                  <div className="p-2 bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-300 font-medium">
                        Tempo izgovora (Rate): <strong className="text-[#ffd700]">{audioTransport?.voiceRate}</strong>
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        Zadano: {DEFAULT_ZIGO_VOICE_CONFIG.rate}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.75"
                      max="1.25"
                      step="0.02"
                      value={audioTransport?.voiceRate || DEFAULT_ZIGO_VOICE_CONFIG.rate}
                      onChange={(e) => audioTransport?.setVoiceRate(parseFloat(e.target.value))}
                      className="w-full accent-[#ffd700] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-gray-500 mt-0.5">
                      <span>Miran stoički (0.75)</span>
                      <span>Brzi ritam (1.25)</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-[10px] text-emerald-400/80">
                    🛡️ Automatski fallback: Ako Google API zakaže, govor trenutno preuzima lokalni preglednik.
                  </span>
                  <button
                    type="button"
                    onClick={() => audioTransport?.resetVoiceSettings()}
                    className="px-2 py-1 text-[10px] text-[var(--text-muted)] hover:text-white flex items-center gap-1 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
                    title="Vrati ton (0.86) i tempo (0.94) na viteški zadane vrijednosti"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Vrati viteški zadano</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-[var(--text-muted)]">
          <div className="p-2 bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-secondary)] block">Stavke u transportnoj listi:</span>
            <span className="font-bold text-white">
              {audioTransport?.queue.length ? `${audioTransport.currentIndex + 1} / ${audioTransport.queue.length}` : 'Prazno (0)'}
            </span>
          </div>
          <div className="p-2 bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-secondary)] block">Globalni zvuk:</span>
            <span className={`font-bold ${audioTransport?.isMuted ? 'text-rose-400' : 'text-emerald-400'}`}>
              {audioTransport?.isMuted ? 'Utišano (MUTED)' : 'Aktivno (Zvuk ON)'}
            </span>
          </div>
          <div className="p-2 bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-secondary)] block">Auto-čitaj poruke:</span>
            <span className={`font-bold ${audioTransport?.autoRead ? 'text-[#ffd700]' : 'text-slate-400'}`}>
              {audioTransport?.autoRead ? 'Uključeno (ON)' : 'Isključeno (OFF)'}
            </span>
          </div>
        </div>

        {audioTransport?.activeItem && (
          <div className="p-2 bg-[#12141a] border border-[#ffd700]/30 text-xs">
            <div className="text-[10px] font-bold text-[#ffd700] uppercase">
              {audioTransport.activeItem.label}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 italic truncate">
              &quot;{audioTransport.activeItem.cleanTextForSpeech}&quot;
            </p>
          </div>
        )}

        {/* Kontrolne tipke naracije i transporta */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlayTestNarration}
              className="px-3 py-1.5 bg-[#ffd700]/15 hover:bg-[#ffd700]/25 border border-[#ffd700]/50 text-[#ffd700] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Pošalji Testnu Naraciju na Transport</span>
            </button>

            {(audioTransport?.status === 'playing' || (audioTransport?.queue.length || 0) > 0) && (
              <button
                type="button"
                onClick={handleStopNarration}
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Očisti Transport</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => audioTransport?.toggleMute()}
              className="px-2.5 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-strong)] hover:border-slate-500 text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer"
            >
              {audioTransport?.isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{audioTransport?.isMuted ? 'Uključi zvuk' : 'Utišaj'}</span>
            </button>

            <button
              type="button"
              onClick={() => audioTransport?.toggleAutoRead()}
              className={`px-2.5 py-1.5 border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                audioTransport?.autoRead
                  ? 'bg-[#ffd700]/10 border-[#ffd700]/50 text-[#ffd700]'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-strong)] text-slate-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-čitaj: {audioTransport?.autoRead ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {config.engine === 'gcp_stt_v2' && (
            <div className="relative group">
              <button
                type="button"
                onClick={handleTest}
                disabled={testStatus === 'TESTING' || !isReadyForTesting}
                className="px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-strong)] hover:border-[#ffd700] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${testStatus === 'TESTING' ? 'animate-spin text-[#ffd700]' : ''}`}
                />
                <span>{testStatus === 'TESTING' ? 'Provjeravam...' : 'Testiraj STT vezu'}</span>
              </button>
              {!isReadyForTesting && (
                <div className="hidden group-hover:block absolute left-0 bottom-full mb-1 z-20 w-64 p-2 bg-[#1e2026] text-[10px] text-slate-200 border border-slate-700 shadow-xl">
                  {config.authMode === 'service_account'
                    ? 'Učitajte valjan Service Account JSON i provjerite Project ID.'
                    : 'Unesite valjan Project ID i Google API ključ (AIzaSy...).'}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-[var(--text-muted)] hover:text-white text-xs transition-colors cursor-pointer"
          >
            Vrati na početno
          </button>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Spremljeno lokalno
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 bg-[#ffd700] hover:bg-[#ffe135] text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Spremi STT Postavke
          </button>
        </div>
      </div>
    </div>
  );
};
