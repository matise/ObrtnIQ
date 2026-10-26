import { useState, useEffect } from 'react';

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
    name: 'Knežev Purpur',
    hue: 268,
    previewColor: '#A855F7',
    description: 'Svečani baršun Kneževa dvora i noć nad Stradunom.',
  },
  {
    key: 'emerald',
    name: 'Zelenci s Luže',
    hue: 155,
    previewColor: '#10B981',
    description: 'Patinirana bronca Mara i Bara te borovi Lokruma.',
  },
  {
    key: 'cobalt',
    name: 'Jadranska Bonaca',
    hue: 218,
    previewColor: '#38BDF8',
    description: 'Kristalno modro more podno Lovrjenca i vedro nebo.',
  },
  {
    key: 'bronze',
    name: 'Dubrovački Dukat',
    hue: 34,
    previewColor: '#F59E0B',
    description: 'Kovano zlato Riznice Republike, mjera poštenja.',
  },
  {
    key: 'carbon',
    name: 'Klesani Kamen',
    hue: 0,
    previewColor: '#E4E4E7',
    description: 'Stoljećima glačani kamen pod Orlandovim mačem.',
  },
];

const STORAGE_KEY = 'obrtniq_theme_settings';

export interface ThemeSettings {
  preset: ThemePresetKey;
  customHue: number;
}

let globalThemeSettings: ThemeSettings = (() => {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return { preset: 'amethyst', customHue: 268 };
})();

function applyThemeToDOM(currentSettings: ThemeSettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (currentSettings.preset === 'carbon') {
    root.setAttribute('data-theme', 'carbon');
  } else {
    root.removeAttribute('data-theme');
    root.style.setProperty('--theme-hue', currentSettings.customHue.toString());
    root.style.setProperty('--theme-sat-factor', '1');
  }
}

const themeListeners = new Set<(s: ThemeSettings) => void>();

function notifyThemeListeners(newSettings: ThemeSettings) {
  globalThemeSettings = newSettings;
  applyThemeToDOM(newSettings);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  } catch {
    // tihi fallback
  }
  themeListeners.forEach(listener => listener(newSettings));
}

export function useTheme() {
  const [settings, setSettings] = useState<ThemeSettings>(globalThemeSettings);

  useEffect(() => {
    themeListeners.add(setSettings);
    applyThemeToDOM(globalThemeSettings);
    return () => {
      themeListeners.delete(setSettings);
    };
  }, []);

  const selectPreset = (presetKey: ThemePresetKey) => {
    const found = THEME_PRESETS.find(p => p.key === presetKey);
    const hue = found ? found.hue : 268;
    const newSettings: ThemeSettings = {
      preset: presetKey,
      customHue: hue,
    };
    notifyThemeListeners(newSettings);
  };

  const updateHue = (hue: number) => {
    const clampedHue = Math.min(360, Math.max(0, Math.round(hue)));
    const newSettings: ThemeSettings = {
      preset: 'amethyst', // Custom hue falls under custom dynamic theme
      customHue: clampedHue,
    };
    notifyThemeListeners(newSettings);
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
