import React, { useState } from 'react';
import {
  Globe,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { tavilySearchService, WHITELISTED_TAX_DOMAINS } from '../../../services/tavily-search-service';
import { appLogger } from '../../../services/logger';

export const TavilySettingsCard: React.FC = () => {
  const logger = appLogger.scope('SETTINGS:TAVILY');

  const [tavilyApiKeyInput, setTavilyApiKeyInput] = useState(tavilySearchService.getStoredApiKey());
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'TESTING' | 'SUCCESS' | 'ERROR' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSaveKey = () => {
    logger.info('Spremanje Tavily API ključa u lokalnu pohranu', {
      postavljen: !!tavilyApiKeyInput,
      duljina: tavilyApiKeyInput?.length || 0,
    });
    tavilySearchService.setStoredApiKey(tavilyApiKeyInput);
    alert('Tavily API ključ spremljen lokalno u preglednik.');
  };

  const handleTestKey = async () => {
    logger.info('Pokretanje testiranja valjanosti Tavily API ključa');
    setTestStatus('TESTING');
    setErrorMessage(null);
    try {
      const ok = await tavilySearchService.testApiKey(tavilyApiKeyInput);
      if (ok) {
        setTestStatus('SUCCESS');
        setTimeout(() => setTestStatus(null), 4000);
      }
    } catch (err: any) {
      logger.warn('Test Tavily API ključa nije uspio:', { error: err?.message });
      setTestStatus('ERROR');
      setErrorMessage(err?.message || 'Greška povezivanja.');
    }
  };

  return (
    <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-4 font-mono">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0">
          <Globe className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-bold uppercase text-white flex items-center gap-2">
            <span>Tavily AI Search &bull; Istraživanje Propisa RH</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.2 border border-cyan-500/30">
              HITL Model
            </span>
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Specijalizirani pretraživački API za AI agente s fokusiranim sažetcima zakona, pravilnika i mišljenja Porezne uprave RH. Žigo nikada ne pretražuje web bez vašeg eksplicitnog dopuštenja.
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
        <div>
          <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] font-semibold mb-1">
            <label>Tavily API Ključ</label>
            <a
              href="https://tavily.com"
              target="_blank"
              rel="noreferrer"
              className="text-[#ffd700] hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>Dohvatite besplatni ključ (1.000 mjesečno)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={tavilyApiKeyInput}
                onChange={(e) => setTavilyApiKeyInput(e.target.value)}
                placeholder="tvly-..."
                className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none pr-9 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                title={showKey ? 'Sakrij ključ' : 'Prikaži ključ'}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button
              type="button"
              onClick={handleSaveKey}
              className="px-3 py-1.5 bg-[#252830] hover:bg-[#2e313b] text-[#ffd700] border border-[#b89758]/50 hover:border-[#ffd700] text-xs font-semibold"
            >
              Spremi
            </button>
            <button
              type="button"
              onClick={handleTestKey}
              disabled={testStatus === 'TESTING' || !tavilyApiKeyInput}
              className="px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/50 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
            >
              {testStatus === 'TESTING' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Testiram...</span>
                </>
              ) : testStatus === 'SUCCESS' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Povezano!</span>
                </>
              ) : testStatus === 'ERROR' ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-red-400">Neuspješno</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Testiraj</span>
                </>
              )}
            </button>
          </div>
          {errorMessage && (
            <p className="text-[11px] text-red-400 mt-1">
              Greška: {errorMessage}
            </p>
          )}
        </div>

        {/* Ciljane domene od povjerenja */}
        <div className="bg-[#141518] p-2.5 border border-white/5 space-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5 text-gray-300 font-bold uppercase text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fokusirane porezno-pravne domene (Whitelisted):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {WHITELISTED_TAX_DOMAINS.map((domain) => (
              <span
                key={domain}
                className="px-2 py-0.5 bg-[#1b1c21] border border-cyan-500/20 text-cyan-300 text-[10px]"
              >
                {domain}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
