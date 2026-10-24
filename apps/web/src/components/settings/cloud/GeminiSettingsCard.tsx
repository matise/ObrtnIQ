import React, { useState } from 'react';
import {
  Sparkles,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { UseGeminiAssistantReturn } from '../../../hooks/useGeminiAssistant';
import { appLogger } from '../../../services/logger';

export interface GeminiSettingsCardProps {
  gemini: UseGeminiAssistantReturn;
}

export const GeminiSettingsCard: React.FC<GeminiSettingsCardProps> = ({
  gemini,
}) => {
  const loggerGemini = appLogger.scope('SETTINGS:GEMINI');

  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState(gemini.apiKey);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiTestStatus, setGeminiTestStatus] = useState<'TESTING' | 'SUCCESS' | 'ERROR' | null>(null);

  const handleSaveGeminiKey = () => {
    loggerGemini.info('Spremanje Gemini API ključa u lokalnu pohranu', {
      postavljen: !!geminiApiKeyInput,
      duljina: geminiApiKeyInput?.length || 0,
    });
    gemini.setApiKey(geminiApiKeyInput);
    alert('Gemini API ključ spremljen lokalno u preglednik.');
  };

  const handleTestGeminiKey = async () => {
    const t0 = performance.now();
    loggerGemini.info('Pokretanje testiranja valjanosti Gemini API ključa', { model: gemini.model });
    setGeminiTestStatus('TESTING');
    const ok = await gemini.testKey(geminiApiKeyInput);
    const trajanjeMs = Math.round(performance.now() - t0);
    if (ok) {
      loggerGemini.info('Test Gemini API ključa uspješan', { model: gemini.model, trajanjeMs });
      setGeminiTestStatus('SUCCESS');
      setTimeout(() => setGeminiTestStatus(null), 4000);
    } else {
      loggerGemini.warn('Test Gemini API ključa nije uspio', { model: gemini.model, trajanjeMs, error: gemini.error });
      setGeminiTestStatus('ERROR');
    }
  };

  const handleModelChange = (noviModel: string) => {
    loggerGemini.info('Promijenjen odabrani Gemini AI model', { model: noviModel });
    gemini.setModel(noviModel);
  };

  return (
    <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6] flex-shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
            <span>Google AI Studio &bull; Gemini Asistent</span>
            <span className="text-[10px] bg-[#4C1D95] text-[#C4B5FD] px-1.5 py-0.2 border border-[#C4B5FD]/30">
              BYOK Model
            </span>
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
            Bring-Your-Own-Key model: Koristite besplatni Gemini API ključ za automatsku preporuku KPD 2025 šifri i analizu uplatnica. Ključ ostaje isključivo na vašem računalu.
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
        <div>
          <div className="flex justify-between items-center text-xs font-mono text-[var(--text-secondary)] font-semibold mb-1">
            <label>Gemini API Ključ (Google AI Studio)</label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-[var(--accent-primary)] hover:underline flex items-center gap-1"
            >
              Preuzmite besplatan ključ <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiApiKeyInput}
                onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-[var(--bg-surface)] text-white px-3 py-2 pr-9 font-mono text-xs border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-2.5 top-2.5 text-[var(--text-muted)] hover:text-white cursor-pointer"
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={handleSaveGeminiKey}
              className="px-3.5 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-white border border-[var(--border-strong)] text-xs font-mono font-bold cursor-pointer"
            >
              Spremi
            </button>
            <button
              type="button"
              onClick={handleTestGeminiKey}
              disabled={gemini.isAnalyzing || !geminiApiKeyInput}
              className="px-3.5 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {gemini.isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Testiraj
            </button>
          </div>

          {geminiTestStatus === 'SUCCESS' && (
            <div className="mt-2 text-xs font-mono text-[#10B981] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Povezivanje s Gemini modelom uspješno! Asistent je spreman.</span>
            </div>
          )}
          {geminiTestStatus === 'ERROR' && gemini.error && (
            <div className="mt-2 text-xs font-mono text-[#EF4444] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>{gemini.error}</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-mono text-[var(--text-secondary)] font-semibold mb-1">
            Odabir Gemini AI Modela
          </label>
          <select
            value={gemini.model}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full bg-[var(--bg-surface)] text-white px-3 py-2 font-mono text-xs border border-[var(--border-strong)] outline-none cursor-pointer"
          >
            <option value="gemini-3.8-flash">gemini-3.8-flash (Preporučeno: Najnoviji Flash model, ultra brz, besplatna kvota)</option>
            <option value="gemini-4-argon">gemini-4-argon (Flagship Reasoning: Duboko rezoniranje i napredni agentni rad)</option>
            <option value="gemini-3.7-flash">gemini-3.7-flash (Visoka točnost za kodiranje i strukturirane dokumente)</option>
            <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra lagan, minimalna potrošnja i brz odziv)</option>
            <option value="gemini-2.5-pro">gemini-2.5-pro (Veliki kontekst 1M+ tokena za opsežne arhive)</option>
            <option value="gemini-flash-latest">gemini-flash-latest (Uvijek najnovija stabilna Flash verzija)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
