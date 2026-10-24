import { useState, useEffect, useCallback } from 'react';

export type ThemePresetKey = 'amethyst' | 'emerald' | 'cobalt' | 'bronze' | 'carbon';

export interface ThemePreset {
  key: ThemePresetKey;
  name: string;
  hue: number;
  previewColor: string;
  description: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    key: 'amethyst',
    name: 'Midnight Amethyst',
    hue: 268,
    previewColor: '#A855F7',
    description: 'Izvorna tamno-ljubičasta tema s neonskim akcentima.',
  },
  {
    key: 'emerald',
    name: 'Obsidian Emerald',
    hue: 155,
    previewColor: '#10B981',
    description: 'Duboka smaragdno-zelena mat podloga visokog kontrasta.',
  },
  {
    key: 'cobalt',
    name: 'Cyber Cobalt',
    hue: 218,
    previewColor: '#38BDF8',
    description: 'Financijska safirno-plava tema s tehnološkim ugođajem.',
  },
  {
    key: 'bronze',
    name: 'Titanium Bronze',
    hue: 34,
    previewColor: '#F59E0B',
    description: 'Topla ugljen-jantarna tema industrijskog karaktera.',
  },
  {
    key: 'carbon',
    name: 'Carbon Monolith',
    hue: 0,
    previewColor: '#E4E4E7',
    description: '100% neutralna siva monokromatska radna površina.',
  },
];

const STORAGE_KEY = 'obrtniq_theme_settings';

export interface ThemeSettings {
  preset: ThemePresetKey;
  customHue: number;
}

export function useTheme() {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return { preset: 'amethyst', customHue: 268 };
  });

  const applyThemeToDOM = useCallback((currentSettings: ThemeSettings) => {
    const root = document.documentElement;

    if (currentSettings.preset === 'carbon') {
      root.setAttribute('data-theme', 'carbon');
    } else {
      root.removeAttribute('data-theme');
      root.style.setProperty('--theme-hue', currentSettings.customHue.toString());
      root.style.setProperty('--theme-sat-factor', '1');
    }
  }, []);

  useEffect(() => {
    applyThemeToDOM(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // localStorage may be disabled
    }
  }, [settings, applyThemeToDOM]);

  const selectPreset = (presetKey: ThemePresetKey) => {
    const found = THEME_PRESETS.find(p => p.key === presetKey);
    const hue = found ? found.hue : 268;
    setSettings({
      preset: presetKey,
      customHue: hue,
    });
  };

  const updateHue = (hue: number) => {
    const clampedHue = Math.min(360, Math.max(0, Math.round(hue)));
    setSettings(prev => ({
      ...prev,
      preset: 'amethyst', // Custom hue falls under custom dynamic theme
      customHue: clampedHue,
    }));
  };

  const activePreset = THEME_PRESETS.find(p => p.key === settings.preset) || THEME_PRESETS[0]!;

  return {
    preset: settings.preset,
    hue: settings.customHue,
    activePreset,
    presets: THEME_PRESETS,
    selectPreset,
    updateHue,
  };
}
