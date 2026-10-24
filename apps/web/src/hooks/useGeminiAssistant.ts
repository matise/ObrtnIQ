import { useState, useCallback } from 'react';
import { geminiService, type KpdRecommendation } from '../services/gemini-service';

export interface UseGeminiAssistantReturn {
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (m: string) => void;
  isAnalyzing: boolean;
  error: string | null;
  hasKey: boolean;
  testKey: (keyToTest?: string) => Promise<boolean>;
  recommendKpd: (opis: string) => Promise<KpdRecommendation>;
}

export function useGeminiAssistant(): UseGeminiAssistantReturn {
  const [apiKey, setApiKeyState] = useState<string>(() => geminiService.getStoredApiKey());
  const [model, setModelState] = useState<string>(() => geminiService.getStoredModel());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setApiKey = useCallback((newKey: string) => {
    geminiService.setStoredApiKey(newKey);
    setApiKeyState(newKey);
    setError(null);
  }, []);

  const setModel = useCallback((newModel: string) => {
    geminiService.setStoredModel(newModel);
    setModelState(newModel);
  }, []);

  const testKey = useCallback(async (keyToTest?: string): Promise<boolean> => {
    const key = keyToTest || apiKey;
    try {
      setIsAnalyzing(true);
      setError(null);
      await geminiService.testApiKey(key);
      return true;
    } catch (err: any) {
      const msg = err?.message || 'Greška provjere Gemini API ključa.';
      setError(msg);
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  }, [apiKey]);

  const recommendKpd = useCallback(async (opis: string): Promise<KpdRecommendation> => {
    try {
      setIsAnalyzing(true);
      setError(null);
      return await geminiService.recommendKpd(opis, apiKey);
    } catch (err: any) {
      const msg = err?.message || 'Greška pri analizi djelatnosti.';
      setError(msg);
      return geminiService.recommendKpdLocalHeuristic(opis);
    } finally {
      setIsAnalyzing(false);
    }
  }, [apiKey]);

  return {
    apiKey,
    setApiKey,
    model,
    setModel,
    isAnalyzing,
    error,
    hasKey: apiKey.trim().length > 0,
    testKey,
    recommendKpd,
  };
}
