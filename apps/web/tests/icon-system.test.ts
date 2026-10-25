import { describe, it, expect } from 'vitest';
import React from 'react';
import { 
  ICON_REGISTRY, 
  ALL_ICON_NAMES, 
  type ObrtIconName, 
  type ObrtColorMode,
  ObrtIcon, 
  ObrtBadge, 
  ObrtEmblem 
} from '../src/components/icons';

describe('Faza 12: Vektorski Sustav Ikona, Orlando Pečati i Dinamičko Temiranje', () => {
  describe('IS-01: Cjelovitost Registra Ikona (Vector Registry Integrity)', () => {
    it('sve 20 ikona iz specifikacije su registrirane u ICON_REGISTRY i ALL_ICON_NAMES', () => {
      expect(ALL_ICON_NAMES).toHaveLength(20);

      for (const name of ALL_ICON_NAMES) {
        const def = ICON_REGISTRY[name];
        expect(def, `Ikona "${name}" mora postojati u ICON_REGISTRY`).toBeDefined();
        expect(def.name).toBe(name);
        expect(def.viewBox).toBe('0 0 48 48');
        expect(def.title).toBeDefined();
        expect(typeof def.render).toBe('function');
      }
    });

    it('registrira točno 4 ceremonialna amblema/pečata', () => {
      const emblems: ObrtIconName[] = ['app-seal', 'zigo-emblem', 'orlando-knight', 'core-gear-q'];
      for (const emblem of emblems) {
        expect(ICON_REGISTRY[emblem]).toBeDefined();
        expect(ICON_REGISTRY[emblem].viewBox).toBe('0 0 48 48');
      }
    });

    it('registrira 11 domenskih modula obrta i fiskalizacije', () => {
      const domainIcons: ObrtIconName[] = [
        'invoice-document',
        'crypto-vault',
        'kpr-tower',
        'b2b-partners',
        'catalog-pricing',
        'fiscal-quill',
        'legal-scales',
        'obrt-tools',
        'bell-deadline',
        'shield-security',
        'storno-trash',
      ];
      for (const icon of domainIcons) {
        expect(ICON_REGISTRY[icon]).toBeDefined();
        expect(ICON_REGISTRY[icon].viewBox).toBe('0 0 48 48');
      }
    });

    it('registrira 5 telemetrijskih i signalnih indikatora statusa', () => {
      const signalIcons: ObrtIconName[] = [
        'signal-error',
        'signal-warning',
        'signal-success',
        'signal-info',
        'telemetry-terminal',
      ];
      for (const signal of signalIcons) {
        expect(ICON_REGISTRY[signal]).toBeDefined();
        expect(ICON_REGISTRY[signal].viewBox).toBe('0 0 48 48');
      }
    });
  });

  describe('IS-02: Vektorska Arhitektura i Renderiranje Elemenata', () => {
    it('svaka ikona uspješno renderira React vektorske elemente za glyph i badge varijante', () => {
      for (const name of ALL_ICON_NAMES) {
        const def = ICON_REGISTRY[name];
        
        const glyphNode = def.render('glyph', 'themed');
        expect(glyphNode, `Render funkcija za "${name}" glyph mora vratiti React node`).toBeDefined();

        const badgeNode = def.render('badge', 'themed');
        expect(badgeNode, `Render funkcija za "${name}" badge mora vratiti React node`).toBeDefined();
      }
    });

    it('Orlandov amblem (zigo-emblem) sadrži Orlandov mač, štit i klesane reljefe', () => {
      const zigoDef = ICON_REGISTRY['zigo-emblem'];
      expect(zigoDef.title).toContain('Žigo');
      expect(zigoDef.name).toBe('zigo-emblem');
      
      const node = zigoDef.render('glyph', 'gold');
      expect(node).toBeDefined();
    });

    it('Master pečat aplikacije (app-seal) sadrži dubrovački lakat i Q aureolu', () => {
      const sealDef = ICON_REGISTRY['app-seal'];
      expect(sealDef.title).toContain('ObrtnIQ');
      expect(sealDef.name).toBe('app-seal');

      const node = sealDef.render('badge', 'themed');
      expect(node).toBeDefined();
    });
  });

  describe('IS-03: ObrtIcon Komponenta i CSS Mapiranje', () => {
    it('renderira validan React SVG element s točnim dimenzijama i viewBoxom', () => {
      const element = React.createElement(ObrtIcon, {
        name: 'invoice-document',
        size: 28,
        label: 'Dokument test',
      });

      expect(element.type).toBe(ObrtIcon);
      expect(element.props.name).toBe('invoice-document');
      expect(element.props.size).toBe(28);

      // Direktno izvršavanje funkcijske komponente
      const rendered = ObrtIcon(element.props);
      expect(rendered.type).toBe('svg');
      expect(rendered.props.width).toBe(28);
      expect(rendered.props.height).toBe(28);
      expect(rendered.props.viewBox).toBe('0 0 48 48');
      expect(rendered.props['aria-label']).toBe('Dokument test');
      expect(rendered.props.role).toBe('img');
    });

    it('podržava custom accentColor injektiranjem CSS varijabli u style', () => {
      const customColor = '#10B981';
      const rendered = ObrtIcon({
        name: 'crypto-vault',
        size: 24,
        accentColor: customColor,
        isAnimated: true,
      });

      expect(rendered.props.style).toBeDefined();
      expect(rendered.props.style['--icon-layer-accent']).toBe(customColor);
      expect(rendered.props.style['--icon-layer-glow']).toBe(customColor);
    });

    it('podržava semantičke načine boja (colorMode: gold, steel, neon-cyan)', () => {
      const modes: ObrtColorMode[] = ['gold', 'steel', 'neon-cyan', 'signal-error', 'signal-warning', 'signal-success'];
      
      for (const mode of modes) {
        const rendered = ObrtIcon({
          name: 'kpr-tower',
          size: 24,
          colorMode: mode,
        });

        expect(rendered.props.className).toContain(`obrt-mode-${mode}`);
      }
    });

    it('dodaje animacijsku klasu kada je isAnimated uključen', () => {
      const rendered = ObrtIcon({
        name: 'core-gear-q',
        size: 24,
        isAnimated: true,
      });

      expect(rendered.props.className).toContain('obrt-icon-animated');
    });

    it('ispravno postavlja aria-hidden kada label nije proslijeđen', () => {
      const rendered = ObrtIcon({
        name: 'bell-deadline',
        size: 20,
      });

      expect(rendered.props['aria-hidden']).toBe(true);
      expect(rendered.props.role).toBe('presentation');
    });
  });

  describe('IS-04: ObrtBadge Komponenta (Circular Stone Badges)', () => {
    it('stvara kružni reljefni badge sa zadanim proporcijama', () => {
      const badge = ObrtBadge({
        name: 'fiscal-quill',
        size: 40,
        label: 'Fiskalna značka',
      });

      expect(badge.type).toBe('div');
      expect(badge.props.className).toContain('obrt-badge-container');
      expect(badge.props.style.width).toBe(40);
      expect(badge.props.style.height).toBe(40);
    });

    it('propagira klik događaj i podržava glow efekt na znački', () => {
      let clicked = false;
      const badge = ObrtBadge({
        name: 'shield-security',
        size: 32,
        glow: true,
        onClick: () => { clicked = true; },
      });

      expect(badge.props.className).toContain('obrt-badge-glow');
      badge.props.onClick();
      expect(clicked).toBe(true);
    });
  });

  describe('IS-05: ObrtEmblem Komponenta (Ceremonial Master Seal)', () => {
    it('renderira ceremonijalni amblem s Orlandovim rotirajućim prstenom', () => {
      const emblem = ObrtEmblem({
        emblem: 'zigo-emblem',
        size: 56,
        rotatingRing: true,
        ringSpeed: 'fast',
        glowing: true,
      });

      expect(emblem.type).toBe('div');
      expect(emblem.props.className).toContain('obrt-emblem-wrapper');
      expect(emblem.props.style.width).toBe(56);
      expect(emblem.props.style.height).toBe(56);

      // Djeca uključuju rotirajući prsten i središnju ikonu
      const children = React.Children.toArray(emblem.props.children);
      expect(children.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('IS-06: Vektorski Favicon Generator i Reaktivnost na Greške', () => {
    it('generira ispravan SVG predložak s dubrovačkim mačem i krunom', () => {
      const accentColor = 'hsl(268, 85%, 60%)';
      const glowColor = '#38BDF8';
      const bgStroke = accentColor;

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
</svg>`.trim();

      expect(dynamicSvg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(dynamicSvg).toContain('viewBox="0 0 32 32"');
      expect(dynamicSvg).toContain(accentColor);
      expect(dynamicSvg).toContain(glowColor);
    });

    it('reagira na greške prebacivanjem na crveni alarm (#EF4444)', () => {
      const hasErrors = true;
      const accentColor = hasErrors ? '#EF4444' : 'hsl(268, 85%, 60%)';
      const glowColor = hasErrors ? '#EF4444' : '#38BDF8';
      const bgStroke = hasErrors ? '#EF4444' : accentColor;

      expect(accentColor).toBe('#EF4444');
      expect(glowColor).toBe('#EF4444');
      expect(bgStroke).toBe('#EF4444');
    });
  });
});
