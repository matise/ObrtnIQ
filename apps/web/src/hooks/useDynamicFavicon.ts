import { useEffect } from 'react';
import { useTheme } from './useTheme';

/**
 * Hook koji dinamički sinkronizira vektorski SVG favicon u kartici preglednika
 * s trenutnom temom (kut tona --theme-hue) ili crvenim alarmom pri pojavi neuhvaćene greške.
 */
export function useDynamicFavicon(hasErrors: boolean = false) {
  const { preset, hue } = useTheme();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'shortcut icon';
      link.type = 'image/svg+xml';
      document.head.appendChild(link);
    }

    const accentColor = hasErrors
      ? '#EF4444'
      : preset === 'carbon'
        ? '#FFFFFF'
        : `hsl(${hue}, 85%, 60%)`;

    const glowColor = hasErrors ? '#EF4444' : '#38BDF8';
    const bgStroke = hasErrors ? '#EF4444' : accentColor;

    const dynamicSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="15" fill="#09090B" stroke="${bgStroke}" stroke-width="1.8" />
  <circle cx="16" cy="16" r="12" fill="none" stroke="#27272A" stroke-width="0.8" stroke-dasharray="2 2" />
  <path d="M 15 5 L 17 5 L 17 26 L 16 28 L 15 26 Z" fill="#E4E4E7" stroke="#09090B" stroke-width="0.5" />
  <line x1="16" y1="5" x2="16" y2="26" stroke="${glowColor}" stroke-width="0.7" />
  <rect x="13" y="11" width="6" height="1.6" rx="0.4" fill="#F59E0B" />
  <circle cx="16" cy="9" r="4.5" fill="none" stroke="${accentColor}" stroke-width="1.4" />
  <line x1="18.5" y1="11.5" x2="20.5" y2="13.5" stroke="${accentColor}" stroke-width="1.4" stroke-linecap="round" />
  <path d="M 14.5 7 L 15.2 8 L 16 7 L 16.8 8 L 17.5 7 L 17 9.5 L 15 9.5 Z" fill="#F59E0B" />
</svg>
    `.trim();

    link.href = `data:image/svg+xml,${encodeURIComponent(dynamicSvg)}`;
  }, [hue, preset, hasErrors]);
}
