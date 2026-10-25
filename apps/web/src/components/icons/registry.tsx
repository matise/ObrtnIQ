import { ObrtIconName, ObrtColorMode, IconDefinition } from './types';

/**
 * Pomoćna funkcija za renderiranje kružnog medaljona (podloge) za 'badge' varijantu
 */
function renderBadgeBase(colorMode: ObrtColorMode) {
  let baseStroke = 'var(--icon-layer-base-border)';
  if (colorMode === 'signal-error') baseStroke = 'rgba(239, 68, 68, 0.5)';
  if (colorMode === 'signal-warning') baseStroke = 'rgba(245, 158, 11, 0.5)';
  if (colorMode === 'signal-success') baseStroke = 'rgba(16, 185, 129, 0.5)';
  if (colorMode === 'neon-cyan') baseStroke = 'rgba(56, 189, 248, 0.5)';

  return (
    <g className="obrt-badge-bg">
      {/* Glavni vanjski kameni krug */}
      <circle cx="24" cy="24" r="22" className="obrt-layer-base" stroke={baseStroke} strokeWidth="1.5" />
      {/* Unutarnji urezani meandar prsten */}
      <circle cx="24" cy="24" r="19.5" fill="none" stroke="var(--icon-layer-base-border)" strokeWidth="0.75" strokeDasharray="3 1.5" opacity="0.6" />
    </g>
  );
}

/**
 * Pomoćna funkcija za određivanje boje akcenta na temelju colorModea
 */
function resolveAccent(colorMode: ObrtColorMode, defaultAccent: string = 'var(--icon-layer-accent)'): string {
  switch (colorMode) {
    case 'gold': return 'var(--icon-layer-gold)';
    case 'steel': return 'var(--icon-layer-metal)';
    case 'neon-cyan': return 'var(--icon-layer-cyan)';
    case 'signal-error': return 'var(--signal-red)';
    case 'signal-warning': return 'var(--signal-amber)';
    case 'signal-success': return 'var(--signal-green)';
    case 'themed':
    default:
      return defaultAccent;
  }
}

export const ALL_ICON_NAMES: ObrtIconName[] = [
  'app-seal',
  'zigo-emblem',
  'orlando-knight',
  'core-gear-q',
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
  'signal-error',
  'signal-warning',
  'signal-success',
  'signal-info',
  'telemetry-terminal',
];

/**
 * Registar svih ikona s vektorskim SVG definicijama
 */
export const ICON_REGISTRY: Record<ObrtIconName, IconDefinition> = {
  // ==========================================
  // 1. BRENDING I AMBLEMI
  // ==========================================

  'app-seal': {
    name: 'app-seal',
    title: 'ObrtnIQ Glavni Pečat (Dubrovački lakat, Mač i Q-Kruna)',
    viewBox: '0 0 48 48',
    render: (variant, colorMode) => {
      const isBadge = variant === 'badge';
      const accent = resolveAccent(colorMode);
      return (
        <g>
          {isBadge && renderBadgeBase(colorMode)}
          {/* Vanjski klesani prsten s labirintom */}
          <circle cx="24" cy="24" r={isBadge ? '18' : '22'} fill="none" stroke="var(--icon-layer-metal-dark)" strokeWidth="1" opacity="0.5" />
          
          {/* Robotska ruka (dubrovački lakat pod 90°) */}
          <path
            d="M 12 28 L 22 38 L 36 24 L 33 21 L 22 32 L 15 25 Z"
            fill="var(--icon-layer-metal)"
            stroke="var(--icon-layer-stroke)"
            strokeWidth="1.2"
          />
          {/* Šaka / zglob */}
          <circle cx="12" cy="28" r="3" fill="var(--icon-layer-gold)" stroke="var(--icon-layer-stroke)" strokeWidth="1" />

          {/* Središnji vertikalni mač */}
          <g className="obrt-anim-sword">
            {/* Oštrica mača */}
            <path d="M 23 9 L 25 9 L 25 39 L 24 43 L 23 39 Z" fill="var(--icon-layer-metal)" stroke="var(--icon-layer-stroke)" strokeWidth="1" />
            <line x1="24" y1="9" x2="24" y2="40" stroke="var(--icon-layer-cyan)" strokeWidth="0.8" opacity="0.8" className="obrt-anim-pulse" />
            {/* Držač i branik mača */}
            <rect x="20" y="17" width="8" height="2" rx="0.5" fill="var(--icon-layer-gold)" />
          </g>

          {/* Q-Kruna i mozak (aureola na vrhu) */}
          <circle cx="24" cy="11" r="5.5" fill="none" stroke={accent} strokeWidth="1.5" className="obrt-anim-pulse" />
          {/* Kruna desno, mozak lijevo */}
          <path d="M 21 9 Q 20 11 21 13 Q 23 14 24 13" fill="none" stroke="var(--icon-layer-cyan)" strokeWidth="0.8" />
          <path d="M 24 8 L 26 10 L 27 8 L 28 10 L 29 8 L 28 13 L 24 13 Z" fill="var(--icon-layer-gold)" />
          {/* Rep slova Q */}
          <line x1="27" y1="14" x2="30" y2="17" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      );
    },
  },

  'zigo-emblem': {
    name: 'zigo-emblem',
    title: 'Amblem Žigo Agenta (Orlando Cyber-Stone Seal: Mač, Munja, Mozak, Zupčanici i Sidro)',
    viewBox: '0 0 48 48',
    render: (variant, colorMode) => {
      const isBadge = variant === 'badge';
      const accent = resolveAccent(colorMode);
      return (
        <g>
          {isBadge && renderBadgeBase(colorMode)}

          {/* 1. Vanjski klesani prsten s labirintom i integriranim čipovima */}
          <circle cx="24" cy="24" r="23" fill="var(--icon-layer-base)" stroke="var(--icon-layer-gold)" strokeWidth="1" />
          <circle cx="24" cy="24" r="21.5" fill="none" stroke="var(--icon-layer-stroke)" strokeWidth="0.8" />
          
          {/* Kiber-čipovi na dijagonalnim osima */}
          <rect x="7" y="7" width="2.4" height="2.4" rx="0.3" fill="var(--icon-layer-metal-dark)" stroke="var(--icon-layer-stroke)" strokeWidth="0.5" />
          <rect x="38.6" y="7" width="2.4" height="2.4" rx="0.3" fill="var(--icon-layer-metal-dark)" stroke="var(--icon-layer-stroke)" strokeWidth="0.5" />
          <rect x="7" y="38.6" width="2.4" height="2.4" rx="0.3" fill="var(--icon-layer-metal-dark)" stroke="var(--icon-layer-stroke)" strokeWidth="0.5" />
          <rect x="38.6" y="38.6" width="2.4" height="2.4" rx="0.3" fill="var(--icon-layer-metal-dark)" stroke="var(--icon-layer-stroke)" strokeWidth="0.5" />
          
          {/* Urezani kameni žljebovi meandra */}
          <path d="M 12 7 C 7.5 11.5 5.5 17.5 5.5 24 C 5.5 30.5 7.5 36.5 12 41" fill="none" stroke="var(--icon-layer-metal-dark)" strokeWidth="0.8" opacity="0.7" />
          <path d="M 36 7 C 40.5 11.5 42.5 17.5 42.5 24 C 42.5 30.5 40.5 36.5 36 41" fill="none" stroke="var(--icon-layer-metal-dark)" strokeWidth="0.8" opacity="0.7" />

          {/* Unutarnji zlatni prsten jezgre */}
          <circle cx="24" cy="24" r="18" fill="var(--icon-layer-base)" stroke="var(--icon-layer-gold)" strokeWidth="1" />

          {/* 2. Desna strana: Mehanički prijenos sa zupčanicima */}
          <g className="obrt-anim-gear" style={{ transformOrigin: '30px 22px' }}>
            <circle cx="30" cy="22" r="7.5" fill="var(--icon-layer-metal-dark)" stroke="var(--icon-layer-stroke)" strokeWidth="1" />
            <circle cx="30" cy="22" r="3" fill="var(--icon-layer-base)" stroke="var(--icon-layer-stroke)" strokeWidth="0.6" />
            {/* Zupci velikog zupčanika */}
            <rect x="28.8" y="13.2" width="2.4" height="2" fill="var(--icon-layer-metal)" />
            <rect x="28.8" y="28.8" width="2.4" height="2" fill="var(--icon-layer-metal)" />
            <rect x="21.2" y="20.8" width="2" height="2.4" fill="var(--icon-layer-metal)" />
            <rect x="36.8" y="20.8" width="2" height="2.4" fill="var(--icon-layer-metal)" />
            <rect x="23.8" y="15.8" width="2" height="2" transform="rotate(45 24.8 16.8)" fill="var(--icon-layer-metal)" />
            <rect x="33.8" y="25.8" width="2" height="2" transform="rotate(45 34.8 26.8)" fill="var(--icon-layer-metal)" />
          </g>

          {/* Manji gonjeni zupčanik dolje desno */}
          <g className="obrt-anim-gear" style={{ transformOrigin: '33px 30px' }}>
            <circle cx="33" cy="30" r="4.2" fill="var(--icon-layer-metal-dark)" stroke="var(--icon-layer-stroke)" strokeWidth="0.8" />
            <circle cx="33" cy="30" r="1.6" fill="var(--icon-layer-base)" />
            <rect x="32" y="24.8" width="2" height="1.5" fill="var(--icon-layer-metal)" />
            <rect x="32" y="33.7" width="2" height="1.5" fill="var(--icon-layer-metal)" />
            <rect x="27.8" y="29" width="1.5" height="2" fill="var(--icon-layer-metal)" />
            <rect x="36.7" y="29" width="1.5" height="2" fill="var(--icon-layer-metal)" />
          </g>

          {/* 3. Lijeva strana: Kiber-mozak s neonskim vodovima */}
          <path
            d="M 19 13 C 15 13 13 16 14 18 C 12 20 13 24 16 25 C 18 25 19.5 24 20.5 22.5 L 20.5 15 C 20 13.5 19.5 13 19 13 Z"
            fill="var(--icon-layer-base)"
            stroke="var(--icon-layer-cyan)"
            strokeWidth="1.4"
          />
          {/* Unutarnje linije i čvorovi mozga */}
          <path d="M 15 16 L 18 18 L 16 20 M 18 18 L 19.5 18" fill="none" stroke="var(--icon-layer-cyan)" strokeWidth="0.9" strokeLinecap="round" />
          <circle cx="15" cy="16" r="1.1" fill="var(--icon-layer-cyan)" className="obrt-anim-pulse" />
          <circle cx="16" cy="20" r="1.1" fill="var(--icon-layer-cyan)" className="obrt-anim-pulse" />
          <circle cx="19.5" cy="18" r="1.1" fill="var(--icon-layer-cyan)" className="obrt-anim-pulse" />

          {/* 4. Podnožje: Zlatno pomorsko sidro */}
          <path d="M 15 32 C 17.5 39 30.5 39 33 32" fill="none" stroke="var(--icon-layer-gold)" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="13.5,33 16.5,30 18,33" fill="var(--icon-layer-gold)" />
          <polygon points="34.5,33 31.5,30 30,33" fill="var(--icon-layer-gold)" />

          {/* 5. Središnji okomiti mač koji probija donji rub */}
          <g className="obrt-anim-sword">
            <path
              d="M 22.8 4 L 25.2 4 L 25.2 40 L 24 45.5 L 22.8 40 Z"
              fill="var(--icon-layer-metal)"
              stroke="var(--icon-layer-stroke)"
              strokeWidth="1"
            />
            {/* Kiber-oštrica / energetski kanal s pulsiranjem */}
            <line x1="24" y1="5" x2="24" y2="42" stroke="var(--icon-layer-cyan)" strokeWidth="1" strokeLinecap="round" className="obrt-anim-pulse" />
            {/* Zlatni branik mača */}
            <rect x="21" y="16" width="6" height="1.5" rx="0.3" fill="var(--icon-layer-gold)" />
          </g>

          {/* 6. Dijagonalna munja / strelica rasta s vrhom */}
          <polyline
            points="12,35 21,24 23.5,27 34,14"
            fill="none"
            stroke="var(--icon-layer-gold)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="miter"
            className="obrt-anim-arrow"
          />
          <polyline
            points="12,35 21,24 23.5,27 34,14"
            fill="none"
            stroke={accent}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="miter"
          />
          {/* Oštra zlatna strelica */}
          <polygon
            points="34,14 27,17 31,21"
            fill="var(--icon-layer-gold)"
            stroke="var(--icon-layer-stroke)"
            strokeWidth="0.8"
          />
        </g>
      );
    },
  },

  'orlando-knight': {
    name: 'orlando-knight',
    title: 'Vitez Orlando (Persona Žigo Agenta)',
    viewBox: '0 0 48 48',
    render: (variant, colorMode) => {
      const isBadge = variant === 'badge';
      const accent = resolveAccent(colorMode);
      return (
        <g>
          {isBadge && renderBadgeBase(colorMode)}
          {/* Šljem i lice viteza */}
          <path
            d="M 17 19 C 17 13 31 13 31 19 L 31 27 C 31 31 27 34 24 34 C 21 34 17 31 17 27 Z"
            fill="var(--icon-layer-metal)"
            stroke="var(--icon-layer-stroke)"
            strokeWidth="1.4"
          />
          {/* T-vizir šljema */}
          <path d="M 19 22 L 29 22 M 24 22 L 24 30" stroke="var(--icon-layer-base)" strokeWidth="2.2" strokeLinecap="square" />
          {/* Oklop ramena */}
          <path d="M 13 34 L 17 28 L 31 28 L 35 34 L 38 41 L 10 41 Z" fill="var(--icon-layer-metal-dark)" stroke="var(--icon-layer-stroke)" strokeWidth="1.2" />
          
          {/* Mač u desnoj ruci */}
          <g className="obrt-anim-sword">
            <line x1="33" y1="36" x2="41" y2="14" stroke="var(--icon-layer-metal)" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="30" y1="33" x2="36" y2="35" stroke="var(--icon-layer-gold)" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* Lebdeća kruna iznad šljema s Q-aureolom */}
          <path d="M 19 12 L 21 14 L 24 10 L 27 14 L 29 12 L 28 15 L 20 15 Z" fill={accent} stroke="var(--icon-layer-stroke)" strokeWidth="0.8" />
          <ellipse cx="24" cy="9" rx="7" ry="2" fill="none" stroke="var(--icon-layer-gold)" strokeWidth="1" className="obrt-anim-pulse" />
        </g>
      );
    },
  },

  'core-gear-q': {
    name: 'core-gear-q',
    title: 'ObrtnIQ Core Engine (Mikročip s oznakom Q)',
    viewBox: '0 0 48 48',
    render: (variant, colorMode) => {
      const isBadge = variant === 'badge';
      const accent = resolveAccent(colorMode);
      return (
        <g>
          {isBadge && renderBadgeBase(colorMode)}
          {/* Veliki zupčanik (rotira se na hover) */}
          <g className="obrt-anim-gear" style={{ transformOrigin: '24px 24px' }}>
            <circle cx="24" cy="24" r="14" fill="var(--icon-layer-metal-dark)" stroke="var(--icon-layer-stroke)" strokeWidth="1.5" />
            {/* 8 zubaca zupčanika */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => (
              <rect
                key={idx}
                x="22"
                y="7"
                width="4"
                height="4"
                rx="0.5"
                fill="var(--icon-layer-metal)"
                stroke="var(--icon-layer-stroke)"
                strokeWidth="1"
                transform={`rotate(${angle} 24 24)`}
              />
            ))}
          </g>

          {/* Mikročip kvadrat u središtu */}
          <rect x="17" y="17" width="14" height="14" rx="2" fill="var(--icon-layer-base)" stroke={accent} strokeWidth="1.5" />
          {/* Nožice procesora */}
          <line x1="20" y1="14" x2="20" y2="17" stroke="var(--icon-layer-gold)" strokeWidth="1.2" />
          <line x1="24" y1="14" x2="24" y2="17" stroke="var(--icon-layer-gold)" strokeWidth="1.2" />
          <line x1="28" y1="14" x2="28" y2="17" stroke="var(--icon-layer-gold)" strokeWidth="1.2" />
          <line x1="20" y1="31" x2="20" y2="34" stroke="var(--icon-layer-gold)" strokeWidth="1.2" />
          <line x1="24" y1="31" x2="24" y2="34" stroke="var(--icon-layer-gold)" strokeWidth="1.2" />
          <line x1="28" y1="31" x2="28" y2="34" stroke="var(--icon-layer-gold)" strokeWidth="1.2" />

          {/* Oznaka Q unutar čipa */}
          <circle cx="23.5" cy="23.5" r="3.5" fill="none" stroke="var(--icon-layer-stroke)" strokeWidth="1.4" />
          <line x1="25" y1="25" x2="27.5" y2="27.5" stroke={accent} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );
    },
  },

  // ==========================================
  // 2. POSLOVNI I FINANCIJSKI MODULI
  // ==========================================

  'invoice-document': {
    name: 'invoice-document',
    title: 'Račun i Izdavanje (Dokument s kalkulatorom i eurom)',
    viewBox: '0 0 48 48',
    render: (variant, colorMode) => {
      const isBadge = variant === 'badge';
      const accent = resolveAccent(colorMode);
      return (
        <g>
          {isBadge && renderBadgeBase(colorMode)}
          {/* Dokument računa s preklopljenim kutom */}
          <path
            d="M 14 10 L 29 10 L 35 16 L 35 38 L 14 38 Z"
            fill="var(--icon-layer-metal)"
            stroke="var(--icon-layer-stroke)"
            strokeWidth="1.4"
          />
          {/* Preklopljeni kut gore desno */}
          <path d="M 29 10 L 29 16 L 35 16 Z" fill="var(--icon-layer-metal-dark)" stroke="var(--icon-layer-stroke)" strokeWidth="1" />
          
          {/* Matematički znakovi: + - * = */}
          <g stroke="var(--icon-layer-base)" strokeWidth="1.2" strokeLinecap="round">
            {/* Plus */}
            <line x1="18" y1="16" x2="22" y2="16" />
            <line x1="20" y1="14" x2="20" y2="18" />
            {/* Minus */}
            <line x1="25" y1="16" x2="29" y2="16" />
            {/* Puta */}
            <line x1="18" y1="22" x2="22" y2="26" />
            <line x1="22" y1="22" x2="18" y2="26" />
            {/* Jednako */}
            <line x1="25" y1="23" x2="29" y2="23" />
            <line x1="25" y1="25" x2="29" y2="25" />
          </g>

          {/* Linije teksta stavaka */}
          <line x1="18" y1="31" x2="27" y2="31" stroke="var(--icon-layer-metal-dark)" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="18" y1="34" x2="24" y2="34" stroke="var(--icon-layer-metal-dark)" strokeWidth="1.2" strokeLinecap="round" />

          {/* Euro kovanica u kutu */}
          <circle cx="34" cy="33" r="6" fill="var(--icon-layer-gold)" stroke={accent} strokeWidth="1.2" />
          {/* Znak eura € */}
          <path d="M 36 31 C 33 30 31.5 32 31.5 33 C 31.5 34 33 36 36 35 M 31 32.5 L 34 32.5 M 31 34 L 34 34" fill="none" stroke="var(--icon-layer-base)" strokeWidth="1" strokeLinecap="round" />
        </g>
      );
    },
  },

  'crypto-vault': {
    name: 'crypto-vault',
    title: 'Kripto Trezor (AES-256 Sef s Euro simbolom)',
    viewBox: '0 0 48 48',
    render: (variant, colorMode) => {
      const isBadge = variant === 'badge';
      const accent = resolveAccent(colorMode);
      return (
        <g>
          {isBadge && renderBadgeBase(colorMode)}
          {/* Kameno-čelični sef */}
          <rect x="12" y="13" width="24" height="22" rx="2" fill="var(--icon-layer-metal-dark)" stroke="var(--icon-layer-stroke)" strokeWidth="1.5" />
          
          {/* Zakovice po kutovima */}
          <circle cx="15" cy="16" r="1" fill="var(--icon-layer-gold)" />
          <circle cx="33" cy="16" r="1" fill="var(--icon-layer-gold)" />
          <circle cx="15" cy="32" r="1" fill="var(--icon-layer-gold)" />
          <circle cx="33" cy="32" r="1" fill="var(--icon-layer-gold)" />

          {/* Krug brave u sredini */}
          <circle cx="24" cy="24" r="6.5" fill="var(--icon-layer-base)" stroke={accent} strokeWidth="1.4" />
          {/* Euro znak unutar brave */}
          <path d="M 26 22 C 23.5 21 22 23 22 24 C 22 25 23.5 27 26 26 M 21.5 23.5 L 24.5 23.5 M 21.5 25 L 24.5 25" fill="none" stroke="var(--icon-layer-gold)" strokeWidth="1.2" strokeLinecap="round" />

          {/* Kiber-vodovi s lijeve i desne strane sefa */}
          <path d="M 8 18 L 12 18 M 7 24 L 12 24 M 9 30 L 12 30" stroke="var(--icon-layer-cyan)" strokeWidth="1.2" strokeLinecap="round" className="obrt-anim-pulse" />
          <path d="M 36 18 L 40 18 M 36 24 L 41 24 M 36 30 L 39 30" stroke="var(--icon-layer-cyan)" strokeWidth="1.2" strokeLinecap="round" className="obrt-anim-pulse" />
          <circle cx="7" cy="24" r="1" fill="var(--icon-layer-cyan)" />
          <circle cx="41" cy="24" r="1" fill="var(--icon-layer-cyan)" />
        </g>
      );
    },
  },

  'kpr-tower': {
    name: 'kpr-tower',
    title: 'Kula Minčeta i Knjiga Prometa (Grafikon Rasta)',
    viewBox: '0 0 48 48',
    render: (variant, colorMode) => {
      const isBadge = variant === 'badge';
      const accent = resolveAccent(colorMode);
      return (
        <g>
          {isBadge && renderBadgeBase(colorMode)}
          {/* Kula Minčeta s lijeve strane */}
          <path
            d="M 12 38 L 14 17 L 13 17 L 13 13 L 16 13 L 16 15 L 18 15 L 18 13 L 21 13 L 21 15 L 23 15 L 23 13 L 25 13 L 25 17 L 24 17 L 25 38 Z"
            fill="var(--icon-layer-metal)"
            stroke="var(--icon-layer-stroke)"
            strokeWidth="1.2"
          />
          {/* Portal vrata kule */}
          <path d="M 17 38 L 17 31 C 17 29 21 29 21 31 L 21 38 Z" fill="var(--icon-layer-base)" />

          {/* Stupčasti dijagram s desne strane kule */}
          <rect x="27" y="29" width="3.5" height="9" fill="var(--icon-layer-metal-dark)" stroke="var(--icon-layer-stroke)" strokeWidth="0.8" />
          <rect x="32" y="23" width="3.5" height="15" fill="var(--icon-layer-metal)" stroke="var(--icon-layer-stroke)" strokeWidth="0.8" />
          <rect x="37" y="17" width="3.5" height="21" fill="var(--icon-layer-gold)" stroke="var(--icon-layer-stroke)" strokeWidth="0.8" />

          {/* Uzlazna strelica rasta preko kule i grafa */}
          <g className="obrt-anim-arrow">
            <path
              d="M 15 32 L 27 20 L 33 24 L 41 12"
              fill="none"
              stroke={accent}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M 35 12 L 41 12 L 41 18" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      );
    },
  },

  'b2b-partners': {
    name: 'b2b-partners',
    title: 'Adresar Partnera i B2B Suradnja (Most i Rukovanje)',
    viewBox: '0 0 48 48',
    render: (variant, colorMode) => {
      const isBadge = variant === 'badge';
      const accent = resolveAccent(colorMode);
      return (
        <g>
          {isBadge && renderBadgeBase(colorMode)}
          {/* Dva kamena gradska luka (vrata od Pila i Ploča) */}
          <path d="M 10 36 L 10 16 L 22 16 L 22 36" fill="none" stroke="var(--icon-layer-metal-dark)" strokeWidth="2" />
          <path d="M 26 36 L 26 16 L 38 16 L 38 36" fill="none" stroke="var(--icon-layer-metal-dark)" strokeWidth="2" />

          {/* Dvije siluete partnera u luku */}
          <circle cx="16" cy="20" r="2.5" fill="var(--icon-layer-metal)" />
          <circle cx="32" cy="20" r="2.5" fill="var(--icon-layer-metal)" />

          {/* Strelice razmjene između partnera */}
          <path d="M 19 22 L 29 22" stroke="var(--icon-layer-gold)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 29 25 L 19 25" stroke="var(--icon-layer-cyan)" strokeWidth="1.2" strokeLinecap="round" />

          {/* Rukovanje (Handshake) u prvom planu */}
          <g transform="translate(14, 27)">
            <path
              d="M 2 8 L 6 4 L 10 7 L 14 4 L 18 8 L 14 11 L 10 9 L 6 11 Z"
              fill="var(--icon-layer-gold)"
              stroke="var(--icon-layer-stroke)"
              strokeWidth="1.2"
            />
            {/* Manšete rukava */}
            <rect x="0" y="6" width="3" height="4" fill="var(--icon-layer-metal)" />
            <rect x="17" y="6" width="3" height="4" fill={accent} />
          </g>
        </g>
      );
    },
  },

  'catalog-pricing': {
    name: 'catalog-pricing',
    title: 'Cjenik Artikala i Usluga (Katalog s KPD 2025 i etiketom)',
    viewBox: '0 0 48 48',
    render: (variant, colorMode) => {
      const isBadge = variant === 'badge';
      const accent = resolveAccent(colorMode);
      return (
        <g>
          {isBadge && renderBadgeBase(colorMode)}
          {/* Otvorena knjiga / registar */}
          <path
            d="M 12 14 Q 18 16 24 14 Q 30 16 36 14 L 36 34 Q 30 36 24 34 Q 18 36 12 34 Z"
            fill="var(--icon-layer-metal)"
            stroke="var(--icon-layer-stroke)"
            strokeWidth="1.4"
          />
          {/* Središnji hrbat knjige */}
          <line x1="24" y1="14" x2="24" y2="34" stroke="var(--icon-layer-metal-dark)" strokeWidth="1.5" />

          {/* Retci stavaka na lijevoj stranici */}
          <line x1="15" y1="19" x2="21" y2="19" stroke="var(--icon-layer-base)" strokeWidth="1" strokeLinecap="round" />
          <line x1="15" y1="23" x2="21" y2="23" stroke="var(--icon-layer-base)" strokeWidth="1" strokeLinecap="round" />
          <line x1="15" y1="27" x2="21" y2="27" stroke="var(--icon-layer-base)" strokeWidth="1" strokeLinecap="round" />

          {/* Etiketa s cijenom na desnoj stranici */}
          <path
            d="M 28 17 L 33 17 L 35 21 L 30 25 L 26 21 Z"
            fill="var(--icon-layer-gold)"
            stroke="var(--icon-layer-stroke)"
            strokeWidth="0.8"
          />
          <circle cx="29" cy="19" r="0.8" fill="var(--icon-layer-base)" />

          {/* Mali zupčanik u donjem desnom kutu */}
          <g className="obrt-anim-gear" style={{ transformOrigin: '35px 33px' }}>
            <circle cx="35" cy="33" r="4.5" fill="var(--icon-layer-metal-dark)" stroke={accent} strokeWidth="1" />
            <circle cx="35" cy="33" r="1.5" fill="var(--icon-layer-base)" />
          </g>
        </g>
      );
    },
  },

  'fiscal-quill': {
    name: 'fiscal-quill',
    title: 'Fiskalizacija 1.0 & e-Račun (Guščje pero, Zupčanik i Ovjera)',
    viewBox: '0 0 48 48',
    render: (variant, colorMode) => {
      const isBadge = variant === 'badge';
      const accent = resolveAccent(colorMode);
      return (
        <g>
          {isBadge && renderBadgeBase(colorMode)}
          {/* Industrijski zupčanik u pozadini */}
          <g className="obrt-anim-gear" style={{ transformOrigin: '22px 26px' }}>
            <circle cx="22" cy="26" r="10" fill="var(--icon-layer-metal-dark)" stroke="var(--icon-layer-stroke)" strokeWidth="1.2" opacity="0.6" />
            {[0, 60, 120, 180, 240, 300].map((angle, idx) => (
              <rect
                key={idx}
                x="20.5"
                y="14"
                width="3"
                height="3"
                fill="var(--icon-layer-metal)"
                transform={`rotate(${angle} 22 26)`}
              />
            ))}
          </g>

          {/* Službeni papir / certifikat s crvenim pečatom */}
          <rect x="18" y="16" width="16" height="20" rx="1" fill="var(--icon-layer-metal)" stroke="var(--icon-layer-stroke)" strokeWidth="1.2" />
          <circle cx="30" cy="32" r="2.5" fill="var(--signal-red)" />

          {/* Guščje pero koje potpisuje račun */}
          <g className="obrt-anim-sword" style={{ transformOrigin: '28px 20px' }}>
            <path
              d="M 36 10 C 34 14 28 20 23 27 L 22 29 L 24 28 C 29 25 35 18 36 10 Z"
              fill={accent}
              stroke="var(--icon-layer-stroke)"
              strokeWidth="1"
            />
            {/* Vrh pera */}
            <path d="M 22 29 L 20 32 L 23 30 Z" fill="var(--icon-layer-gold)" />
          </g>
        </g>
      );
    },
  },

  'legal-scales': {
    name: 'legal-scales',
    title: 'Pravna Vaga i Propisi (Porez, PO-SD i Članak 90. st. 2)',
    viewBox: '0 0 48 48',
    render: (variant, colorMode) => {
      const isBadge = variant === 'badge';
      const accent = resolveAccent(colorMode);
      return (
        <g>
          {isBadge && renderBadgeBase(colorMode)}
          {/* Postolje i središnji stup vage */}
          <rect x="22.5" y="12" width="3" height="24" fill="var(--icon-layer-metal)" stroke="var(--icon-layer-stroke)" strokeWidth="1" />
          <path d="M 18 36 L 30 36 L 27 33 L 21 33 Z" fill="var(--icon-layer-metal-dark)" stroke="var(--icon-layer-stroke)" strokeWidth="1" />
          <circle cx="24" cy="12" r="2" fill="var(--icon-layer-gold)" />

          {/* Vodoravna prečka vage */}
          <line x1="12" y1="16" x2="36" y2="16" stroke="var(--icon-layer-gold)" strokeWidth="1.8" strokeLinecap="round" />

          {/* Lijeva zdjela vage */}
          <line x1="13" y1="16" x2="10" y2="24" stroke="var(--icon-layer-stroke)" strokeWidth="0.8" />
          <line x1="15" y1="16" x2="18" y2="24" stroke="var(--icon-layer-stroke)" strokeWidth="0.8" />
          <path d="M 8 24 Q 14 28 20 24 Z" fill="var(--icon-layer-metal)" stroke="var(--icon-layer-stroke)" strokeWidth="1" />

          {/* Desna zdjela vage s hrpom kovanica */}
          <line x1="33" y1="16" x2="30" y2="22" stroke="var(--icon-layer-stroke)" strokeWidth="0.8" />
          <line x1="35" y1="16" x2="38" y2="22" stroke="var(--icon-layer-stroke)" strokeWidth="0.8" />
          <path d="M 28 22 Q 34 26 40 22 Z" fill="var(--icon-layer-metal)" stroke="var(--icon-layer-stroke)" strokeWidth="1" />
          {/* Hrpa kovanica na desnoj zdjeli */}
          <ellipse cx="34" cy="20" rx="3.5" ry="1.2" fill={accent} stroke="var(--icon-layer-stroke)" strokeWidth="0.6" />
          <ellipse cx="34" cy="18.5" rx="3.5" ry="1.2" fill="var(--icon-layer-gold)" stroke="var(--icon-layer-stroke)" strokeWidth="0.6" />
        </g>
      );
    },
  },

  'obrt-tools': {
    name: 'obrt-tools',
    title: 'Postavke Obrta i Alati (Prekriženi čekić i ravnalo)',
    viewBox: '0 0 48 48',
    render: (variant, colorMode) => {
      const isBadge = variant === 'badge';
      const accent = resolveAccent(colorMode);
      return (
        <g>
          {isBadge && renderBadgeBase(colorMode)}
          {/* Drveno/zlatno ravnalo s mjerilom pod kutom od 45° */}
          <g transform="rotate(45 24 24)">
            <rect x="10" y="21.5" width="28" height="5" rx="0.5" fill="var(--icon-layer-gold)" stroke="var(--icon-layer-stroke)" strokeWidth="1.2" />
            {/* Crtice mjerila */}
            {[13, 16, 19, 22, 25, 28, 31, 34].map((x, idx) => (
              <line key={idx} x1={x} y1="21.5" x2={x} y2={idx % 2 === 0 ? "24" : "23"} stroke="var(--icon-layer-base)" strokeWidth="0.8" />
            ))}
          </g>

          {/* Majstorski čekić pod suprotnim kutom od -45° */}
          <g transform="rotate(-45 24 24)">
            {/* Drška čekića */}
            <rect x="22" y="16" width="4" height="22" rx="1" fill="var(--icon-layer-metal)" stroke="var(--icon-layer-stroke)" strokeWidth="1.2" />
            {/* Čelična glava čekića */}
            <rect x="17" y="11" width="14" height="6" rx="1" fill={accent} stroke="var(--icon-layer-stroke)" strokeWidth="1.2" />
          </g>
        </g>
      );
    },
  },

  'bell-deadline': {
    name: 'bell-deadline',
    title: 'Dospijeće i Obavijesti (Zlatno zvono s kalendarom)',
    viewBox: '0 0 48 48',
    render: (variant, colorMode) => {
      const isBadge = variant === 'badge';
      const accent = resolveAccent(colorMode);
      return (
        <g>
          {isBadge && renderBadgeBase(colorMode)}
          {/* Kalendar u pozadini desno gore */}
          <g transform="translate(24, 11)">
            <rect x="0" y="0" width="13" height="11" rx="1" fill="var(--icon-layer-metal)" stroke="var(--icon-layer-stroke)" strokeWidth="1" />
            <rect x="0" y="0" width="13" height="3" fill={accent} />
            {/* Kalendarske točkice dana */}
            <circle cx="3" cy="5.5" r="0.75" fill="var(--icon-layer-base)" />
            <circle cx="6.5" cy="5.5" r="0.75" fill="var(--icon-layer-base)" />
            <circle cx="10" cy="5.5" r="0.75" fill="var(--icon-layer-base)" />
            <circle cx="3" cy="8.5" r="0.75" fill="var(--icon-layer-base)" />
            <circle cx="6.5" cy="8.5" r="0.75" fill="var(--signal-red)" />
          </g>

          {/* Zlatno zvono u prvom planu */}
          <g className="obrt-anim-pulse">
            <path
              d="M 22 17 C 22 14 16 14 16 17 L 14 27 C 12 28 11 30 13 32 L 25 32 C 27 30 26 28 24 27 Z"
              fill="var(--icon-layer-gold)"
              stroke="var(--icon-layer-stroke)"
              strokeWidth="1.4"
            />
            {/* Klatno zvona */}
            <circle cx="19" cy="34" r="2" fill="var(--icon-layer-metal)" stroke="var(--icon-layer-stroke)" strokeWidth="1" />
            {/* Ušica zvona na vrhu */}
            <circle cx="19" cy="14" r="1.5" fill="none" stroke="var(--icon-layer-stroke)" strokeWidth="1" />
          </g>
        </g>
      );
    },
  },

  'shield-security': {
    name: 'shield-security',
    title: 'Kriptografsko Sidro i Sigurnost (Štit s ključem i vodovima)',
    viewBox: '0 0 48 48',
    render: (variant, colorMode) => {
      const isBadge = variant === 'badge';
      const accent = resolveAccent(colorMode);
      return (
        <g>
          {isBadge && renderBadgeBase(colorMode)}
          {/* Kameni obrambeni štit */}
          <path
            d="M 24 10 L 34 14 L 34 25 C 34 32 24 38 24 38 C 24 38 14 32 14 25 L 14 14 Z"
            fill="var(--icon-layer-metal-dark)"
            stroke="var(--icon-layer-stroke)"
            strokeWidth="1.5"
          />
          {/* Unutarnji metalni obrub štita */}
          <path
            d="M 24 13 L 31 16 L 31 24 C 31 29 24 34 24 34 C 24 34 17 29 17 24 L 17 16 Z"
            fill="var(--icon-layer-metal)"
            stroke={accent}
            strokeWidth="0.8"
            opacity="0.8"
          />

          {/* Zlatni ključ u središtu štita */}
          <g className="obrt-anim-pulse">
            <circle cx="24" cy="20" r="3" fill="var(--icon-layer-gold)" stroke="var(--icon-layer-stroke)" strokeWidth="1" />
            <line x1="24" y1="23" x2="24" y2="30" stroke="var(--icon-layer-gold)" strokeWidth="2" strokeLinecap="round" />
            <line x1="24" y1="27" x2="26.5" y2="27" stroke="var(--icon-layer-gold)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="24" y1="29.5" x2="26.5" y2="29.5" stroke="var(--icon-layer-gold)" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Kiber-vodovi oko štita */}
          <path d="M 11 20 L 7 20 M 11 28 L 8 28 M 37 20 L 41 20 M 37 28 L 40 28" stroke="var(--icon-layer-cyan)" strokeWidth="1" strokeLinecap="round" />
          <circle cx="7" cy="20" r="0.8" fill="var(--icon-layer-cyan)" />
          <circle cx="41" cy="20" r="0.8" fill="var(--icon-layer-cyan)" />
        </g>
      );
    },
  },

  'storno-trash': {
    name: 'storno-trash',
    title: 'Storno i Poništavanje (Industrijska kanta sa zupčanicima)',
    viewBox: '0 0 48 48',
    render: (variant, colorMode) => {
      const isBadge = variant === 'badge';
      const accent = resolveAccent(colorMode);
      return (
        <g>
          {isBadge && renderBadgeBase(colorMode)}
          {/* Zupčanici u pozadini kante */}
          <g className="obrt-anim-gear" style={{ transformOrigin: '16px 28px' }}>
            <circle cx="16" cy="28" r="5" fill="var(--icon-layer-metal-dark)" opacity="0.6" />
          </g>
          <g className="obrt-anim-gear" style={{ transformOrigin: '32px 28px' }}>
            <circle cx="32" cy="28" r="5" fill="var(--icon-layer-metal-dark)" opacity="0.6" />
          </g>

          {/* Tijelo kante za otpad */}
          <path
            d="M 17 18 L 19 36 L 29 36 L 31 18 Z"
            fill="var(--icon-layer-metal)"
            stroke="var(--icon-layer-stroke)"
            strokeWidth="1.4"
          />
          {/* Okomite pregrade kante */}
          <line x1="21.5" y1="21" x2="22.5" y2="33" stroke="var(--icon-layer-base)" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="24" y1="21" x2="24" y2="33" stroke="var(--icon-layer-base)" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="26.5" y1="21" x2="25.5" y2="33" stroke="var(--icon-layer-base)" strokeWidth="1.2" strokeLinecap="round" />

          {/* Vodoravni pojas sa zakovicama */}
          <rect x="18" y="24" width="12" height="3" fill="var(--icon-layer-gold)" stroke={accent} strokeWidth="0.8" />

          {/* Poklopac i ručka kante */}
          <rect x="15" y="15" width="18" height="3" rx="0.5" fill="var(--icon-layer-metal-dark)" stroke="var(--icon-layer-stroke)" strokeWidth="1.2" />
          <path d="M 21 15 L 21 13 L 27 13 L 27 15" fill="none" stroke="var(--icon-layer-stroke)" strokeWidth="1.2" />
        </g>
      );
    },
  },

  // ==========================================
  // 3. STATUSNI I DIJAGNOSTIČKI SIGNALI
  // ==========================================

  'signal-error': {
    name: 'signal-error',
    title: 'Prekidajući Kvar / Greška (Crveni alarmni štit)',
    viewBox: '0 0 48 48',
    render: (variant, _colorMode) => {
      const isBadge = variant === 'badge';
      return (
        <g className="obrt-icon-error">
          {isBadge && renderBadgeBase('signal-error')}
          {/* Radarski pulsirajući val u pozadini */}
          <circle cx="24" cy="24" r="16" fill="rgba(239, 68, 68, 0.2)" className="obrt-anim-radar" />

          {/* Crveni kameni štit */}
          <path
            d="M 24 11 L 34 15 L 34 25 C 34 32 24 37 24 37 C 24 37 14 32 14 25 L 14 15 Z"
            fill="var(--signal-red-bg)"
            stroke="var(--signal-red)"
            strokeWidth="1.8"
          />

          {/* Znak X u sredini */}
          <line x1="19" y1="19" x2="29" y2="29" stroke="var(--signal-red)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="29" y1="19" x2="19" y2="29" stroke="var(--signal-red)" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    },
  },

  'signal-warning': {
    name: 'signal-warning',
    title: 'Upozorenje i Alarm (Trokut sa sirenom i vodovima)',
    viewBox: '0 0 48 48',
    render: (variant, _colorMode) => {
      const isBadge = variant === 'badge';
      return (
        <g className="obrt-icon-warning">
          {isBadge && renderBadgeBase('signal-warning')}
          {/* Sirena gore lijevo s radijacijskim linijama */}
          <g className="obrt-anim-pulse" transform="translate(10, 12)">
            <path d="M 3 6 C 3 3 6 1 8 1 C 10 1 13 3 13 6 Z" fill="var(--signal-red)" />
            <line x1="1" y1="2" x2="3" y2="4" stroke="var(--signal-red)" strokeWidth="1" strokeLinecap="round" />
            <line x1="8" y1="0" x2="8" y2="-2" stroke="var(--signal-red)" strokeWidth="1" strokeLinecap="round" />
          </g>

          {/* Glavni jantarni trokut upozorenja */}
          <path
            d="M 24 14 L 37 36 L 11 36 Z"
            fill="var(--icon-layer-base)"
            stroke="var(--signal-amber)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Unutarnja kamena tekstura */}
          <path d="M 24 17 L 34 34 L 14 34 Z" fill="var(--icon-layer-metal-dark)" opacity="0.4" />

          {/* Znak uskličnika u sredini */}
          <line x1="24" y1="21" x2="24" y2="28" stroke="var(--signal-amber)" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="24" cy="32" r="1.3" fill="var(--signal-amber)" />

          {/* Kiber-vodovi s desne strane */}
          <path d="M 32 23 L 38 23 M 34 28 L 39 28" stroke="var(--icon-layer-cyan)" strokeWidth="1" strokeLinecap="round" />
        </g>
      );
    },
  },

  'signal-success': {
    name: 'signal-success',
    title: 'Uspješno Ovjereno (Smaragdni štit s potpunom kvačicom)',
    viewBox: '0 0 48 48',
    render: (variant, _colorMode) => {
      const isBadge = variant === 'badge';
      return (
        <g>
          {isBadge && renderBadgeBase('signal-success')}
          {/* Smaragdni krug s dvostrukim zlatnim rubom */}
          <circle cx="24" cy="24" r="14" fill="var(--signal-green-bg)" stroke="var(--signal-green)" strokeWidth="1.8" />
          <circle cx="24" cy="24" r="16" fill="none" stroke="var(--icon-layer-gold)" strokeWidth="1" opacity="0.7" strokeDasharray="4 2" />

          {/* Masivna bijelo-zelena kvačica */}
          <path
            d="M 18 24 L 22 28 L 30 19"
            fill="none"
            stroke="var(--signal-green)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
    },
  },

  'signal-info': {
    name: 'signal-info',
    title: 'Informacija i Status (Čelični krug s plavim neonom)',
    viewBox: '0 0 48 48',
    render: (variant, _colorMode) => {
      const isBadge = variant === 'badge';
      return (
        <g>
          {isBadge && renderBadgeBase('neon-cyan')}
          {/* Plavo-čelični krug */}
          <circle cx="24" cy="24" r="13" fill="var(--icon-layer-base)" stroke="var(--icon-layer-cyan)" strokeWidth="1.8" />
          
          {/* Slovo "i" */}
          <circle cx="24" cy="18" r="1.6" fill="var(--icon-layer-cyan)" />
          <line x1="24" y1="22" x2="24" y2="30" stroke="var(--icon-layer-cyan)" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    },
  },

  'telemetry-terminal': {
    name: 'telemetry-terminal',
    title: 'Sustavni Dnevnik (Terminal s promptom >_)',
    viewBox: '0 0 48 48',
    render: (variant, colorMode) => {
      const isBadge = variant === 'badge';
      const accent = resolveAccent(colorMode);
      return (
        <g>
          {isBadge && renderBadgeBase(colorMode)}
          {/* Kućište terminala */}
          <rect x="11" y="13" width="26" height="22" rx="2" fill="var(--icon-layer-base)" stroke="var(--icon-layer-stroke)" strokeWidth="1.4" />
          {/* Gornja traka terminala s prozorčićima */}
          <rect x="11" y="13" width="26" height="5" fill="var(--icon-layer-metal-dark)" />
          <circle cx="15" cy="15.5" r="0.9" fill="var(--signal-red)" />
          <circle cx="18" cy="15.5" r="0.9" fill="var(--signal-amber)" />
          <circle cx="21" cy="15.5" r="0.9" fill="var(--signal-green)" />

          {/* Prompt znak > */}
          <path d="M 16 23 L 20 26 L 16 29" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Trepereći kursor _ */}
          <line x1="22" y1="29" x2="27" y2="29" stroke="var(--icon-layer-cyan)" strokeWidth="2" strokeLinecap="round" className="obrt-anim-pulse" />
        </g>
      );
    },
  },
};
