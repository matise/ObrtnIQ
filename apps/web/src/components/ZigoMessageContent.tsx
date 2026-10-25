import React from 'react';
import { 
  Compass, 
  Activity, 
  Sword, 
  Flame, 
  Clock, 
  ArrowRight,
  Volume2
} from 'lucide-react';
import { useAudioTransport } from '../context/AudioTransportContext';

export type ZigoSectionType = 
  | 'opservacija' 
  | 'dijagnoza' 
  | 'rez' 
  | 'stogori' 
  | 'stoceka' 
  | 'akcijasad' 
  | 'intro' 
  | 'general';

export interface ParsedSection {
  type: ZigoSectionType;
  title: string;
  subtitle?: string;
  content: string;
}

interface ZigoMessageContentProps {
  tekst: string;
  isUser?: boolean;
  className?: string;
  messageId?: string;
}

/**
 * Parsira poruku Žiga u strukturirane sekcije na temelju zaglavlja (Opservacija, Dijagnoza, Žigin Rez, Što gori, itd.)
 */
export function parseZigoSections(rawText: string): ParsedSection[] {
  if (!rawText || !rawText.trim()) {
    return [{ type: 'general', title: '', content: '' }];
  }

  const HEADER_REGEX = /(?:^|\n)\s*(?:\*{1,2})?(?:(\d+)\.\s*)?(Opservacija|Dijagnoza|Žigin Rez|Orlandov Rez|Što gori(?:\s*\(<24h\))?|Što čeka|Akcija sad):?(?:\*{1,2})?:?\s*/gi;

  const matches: Array<{
    startIndex: number;
    endIndex: number;
    numPrefix?: string;
    rawTitle: string;
    sectionType: ZigoSectionType;
  }> = [];

  let match: RegExpExecArray | null;
  while ((match = HEADER_REGEX.exec(rawText)) !== null) {
    const rawTitle = (match[2] || '').trim();
    const lower = rawTitle.toLowerCase();
    let sectionType: ZigoSectionType = 'general';

    if (lower.includes('opservacija')) {
      sectionType = 'opservacija';
    } else if (lower.includes('dijagnoza')) {
      sectionType = 'dijagnoza';
    } else if (lower.includes('rez')) {
      sectionType = 'rez';
    } else if (lower.includes('gori')) {
      sectionType = 'stogori';
    } else if (lower.includes('čeka') || lower.includes('ceka')) {
      sectionType = 'stoceka';
    } else if (lower.includes('akcija')) {
      sectionType = 'akcijasad';
    }

    matches.push({
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      numPrefix: match[1],
      rawTitle,
      sectionType,
    });
  }

  // Ako nema nijednog prepoznatog zaglavlja, vrati cijeli tekst kao 'general'
  if (matches.length === 0) {
    return [{ type: 'general', title: '', content: rawText.trim() }];
  }

  const sections: ParsedSection[] = [];

  // Provjeri postoji li uvodni tekst prije prvog zaglavlja
  if (matches[0] && matches[0].startIndex > 0) {
    const introText = rawText.slice(0, matches[0].startIndex).trim();
    if (introText) {
      sections.push({
        type: 'intro',
        title: '',
        content: introText,
      });
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const curr = matches[i];
    if (!curr) continue;
    const nextStart = i + 1 < matches.length ? matches[i + 1]?.startIndex : rawText.length;
    const content = rawText.slice(curr.endIndex, nextStart).trim();

    let title = curr.rawTitle;
    let subtitle: string | undefined = undefined;

    switch (curr.sectionType) {
      case 'opservacija':
        title = '1. Opservacija';
        subtitle = 'Dubrovački osvrt';
        break;
      case 'dijagnoza':
        title = '2. Dijagnoza';
        subtitle = 'Stanje papira & propisa';
        break;
      case 'rez':
        title = '3. Žigin Rez';
        subtitle = 'Kirurški rez & akcija';
        break;
      case 'stogori':
        title = '1. Što gori (<24h)';
        subtitle = 'Hitno za rješavanje';
        break;
      case 'stoceka':
        title = '2. Što čeka';
        subtitle = 'Neka kisne do ponedjeljka';
        break;
      case 'akcijasad':
        title = '3. Akcija sad';
        subtitle = 'Jedan najelegantniji potez';
        break;
      default:
        break;
    }

    sections.push({
      type: curr.sectionType,
      title,
      subtitle,
      content,
    });
  }

  return sections;
}

/**
 * Pomoćna funkcija za renderiranje inline formata:
 * - Prečaci s tipkovnice: **F2**, **Enter**, **Esc**, itd. -> <kbd>
 * - Inline kod: `kod` -> <code>
 * - Podebljano: **tekst** -> <strong>
 * - Kurziv: *tekst* -> <em>
 */
export function renderFormattedInline(text: string): React.ReactNode[] {
  // Regex koji hvata ključne uzorke redom prioriteta:
  // 1: Shortcut tipke npr. **F2**, **Ctrl+S**
  // 2: Inline code `...`
  // 3: Bold **...**
  // 4: Italic *...*
  const pattern = /(\*\*(?:F\d+|Enter|Esc|Tab|Ctrl\+[A-Za-z0-9]+|Alt\+[A-Za-z0-9]+)\*\*)|(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    const fullMatch = match[0];

    // 1. Tipkovnički prečac
    if (match[1]) {
      const keyName = fullMatch.replace(/\*\*/g, '');
      elements.push(
        <kbd
          key={match.index}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 bg-[#1b222d] border border-[#3b82f6]/50 text-[#93c5fd] font-mono text-[10.5px] font-bold rounded shadow-sm align-middle"
        >
          {keyName}
        </kbd>
      );
    }
    // 2. Inline kod
    else if (match[2]) {
      const codeVal = fullMatch.slice(1, -1);
      elements.push(
        <code
          key={match.index}
          className="inline-block px-1.5 py-0.2 mx-0.5 bg-black/60 border border-[#b89758]/40 text-[#ffd700] font-mono text-[11px] font-semibold rounded align-middle"
        >
          {codeVal}
        </code>
      );
    }
    // 3. Bold tekst
    else if (match[3]) {
      const boldText = fullMatch.slice(2, -2);
      elements.push(
        <strong key={match.index} className="font-bold text-white">
          {boldText}
        </strong>
      );
    }
    // 4. Italic tekst
    else if (match[4]) {
      const italicText = fullMatch.slice(1, -1);
      elements.push(
        <em key={match.index} className="italic text-[#fef3c7]">
          {italicText}
        </em>
      );
    }

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
}

/**
 * Renderira tekst koji može imati više odlomaka i novih redaka
 */
function renderFormattedContent(content: string) {
  const paragraphs = content.split(/\n\s*\n/);
  return (
    <div className="space-y-1.5">
      {paragraphs.map((p, pIdx) => {
        const lines = p.split('\n');
        return (
          <p key={pIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {renderFormattedInline(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export const ZigoMessageContent: React.FC<ZigoMessageContentProps> = ({
  tekst,
  isUser = false,
  className = '',
  messageId,
}) => {
  // Siguran dohvat audio transporta (ako je unutar Providera)
  let activeItem: any = null;
  let audioStatus = 'idle';
  try {
    const transport = useAudioTransport();
    activeItem = transport.activeItem;
    audioStatus = transport.status;
  } catch {
    // Tihi fallback ako se komponenta renderira u izoliranim testovima
  }

  // Ako je poruka korisnička, renderiraj je jednostavno i elegantno
  if (isUser) {
    return (
      <div className={`leading-relaxed font-sans text-[12px] ${className}`}>
        {renderFormattedContent(tekst)}
      </div>
    );
  }

  // Za asistenta Žiga parsiramo sekcije i primjenjujemo vizualni stil
  const sections = parseZigoSections(tekst);

  return (
    <div className={`space-y-2 font-sans text-[12px] ${className}`}>
      {sections.map((sec, idx) => {
        const isSpeaking =
          !!messageId &&
          activeItem?.messageId === messageId &&
          activeItem?.sectionIndex === idx &&
          (audioStatus === 'playing' || audioStatus === 'paused');

        // 1. Opservacija (Dubrovački aristokratski osvrt i stoički mir)
        if (sec.type === 'opservacija') {
          return (
            <div
              key={idx}
              className={`relative bg-gradient-to-r from-[#211f18]/95 via-[#1a1915]/85 to-[#141412]/95 border-l-[3px] border-l-[#d4af37] border-y border-r border-[#b89758]/30 rounded-r-md p-3 shadow-md my-1.5 transition-all duration-300 ${
                isSpeaking ? 'ring-2 ring-[#ffd700] shadow-[0_0_18px_rgba(255,215,0,0.35)] bg-[#2a261c]' : ''
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#b89758]/20">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 rounded bg-[#d4af37]/15 text-[#ffd700] border border-[#d4af37]/35">
                    <Compass className="w-3.5 h-3.5 text-[#ffd700]" />
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#ffd700]">
                    {sec.title}
                  </span>
                  {sec.subtitle && (
                    <span className="text-[9px] text-[#b89758] font-serif italic">
                      • {sec.subtitle}
                    </span>
                  )}
                  {isSpeaking && (
                    <span className="flex items-center gap-1 text-[9px] font-mono text-[#ffd700] animate-pulse ml-1">
                      <Volume2 size={11} />
                      <span>Govori...</span>
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-mono text-[#ffd700]/80 uppercase px-1.5 py-0.5 bg-[#ffd700]/10 border border-[#ffd700]/25 rounded">
                  Mirovanje
                </span>
              </div>
              <div className="font-serif italic text-[#f4ebd0] text-[12.5px] leading-relaxed tracking-wide">
                {renderFormattedContent(sec.content)}
              </div>
            </div>
          );
        }

        // 2. Dijagnoza (Tehnički operativni pregled papira i poreznih zona)
        if (sec.type === 'dijagnoza') {
          return (
            <div
              key={idx}
              className={`relative bg-gradient-to-r from-[#141b25]/95 via-[#161a22]/85 to-[#121419]/95 border-l-[3px] border-l-[#38bdf8] border-y border-r border-[#38bdf8]/30 rounded-r-md p-3 shadow-md my-1.5 transition-all duration-300 ${
                isSpeaking ? 'ring-2 ring-[#ffd700] shadow-[0_0_18px_rgba(255,215,0,0.35)] bg-[#192230]' : ''
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#38bdf8]/20">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 rounded bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/35">
                    <Activity className="w-3.5 h-3.5 text-[#38bdf8]" />
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#38bdf8]">
                    {sec.title}
                  </span>
                  {sec.subtitle && (
                    <span className="text-[9px] text-[#7dd3fc]/80 font-mono">
                      • {sec.subtitle}
                    </span>
                  )}
                  {isSpeaking && (
                    <span className="flex items-center gap-1 text-[9px] font-mono text-[#ffd700] animate-pulse ml-1">
                      <Volume2 size={11} />
                      <span>Govori...</span>
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-mono text-[#38bdf8]/90 uppercase px-1.5 py-0.5 bg-[#38bdf8]/10 border border-[#38bdf8]/25 rounded">
                  Fiskalni radar
                </span>
              </div>
              <div className="font-sans text-gray-200 text-[12px] leading-relaxed">
                {renderFormattedContent(sec.content)}
              </div>
            </div>
          );
        }

        // 3. Žigin Rez (Odlučna akcija, prečaci i kirurški zahvat)
        if (sec.type === 'rez') {
          return (
            <div
              key={idx}
              className={`relative bg-gradient-to-r from-[#0b241b]/95 via-[#0d1e18]/85 to-[#0a1713]/95 border-l-[3px] border-l-[#10b981] border-y border-r border-[#10b981]/35 rounded-r-md p-3 shadow-md my-1.5 transition-all duration-300 ${
                isSpeaking ? 'ring-2 ring-[#ffd700] shadow-[0_0_18px_rgba(255,215,0,0.35)] bg-[#102b21]' : ''
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#10b981]/25">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 rounded bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/40">
                    <Sword className="w-3.5 h-3.5 text-[#34d399]" />
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#34d399]">
                    {sec.title}
                  </span>
                  {sec.subtitle && (
                    <span className="text-[9px] text-[#6ee7b7]/80 font-mono">
                      • {sec.subtitle}
                    </span>
                  )}
                  {isSpeaking && (
                    <span className="flex items-center gap-1 text-[9px] font-mono text-[#ffd700] animate-pulse ml-1">
                      <Volume2 size={11} />
                      <span>Govori...</span>
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-mono text-[#10b981] uppercase px-1.5 py-0.5 bg-[#10b981]/15 border border-[#10b981]/30 rounded font-bold animate-pulse">
                  PULS 60
                </span>
              </div>
              <div className="font-sans text-[#ecfdf5] text-[12px] font-medium leading-relaxed">
                {renderFormattedContent(sec.content)}
              </div>
            </div>
          );
        }

        // 4. Što gori (<24h)
        if (sec.type === 'stogori') {
          return (
            <div
              key={idx}
              className="bg-gradient-to-r from-[#291113]/90 to-[#190d0e]/90 border-l-[3px] border-l-[#ef4444] border-y border-r border-red-500/30 rounded-r-md p-2.5 my-1.5 shadow"
            >
              <div className="flex items-center gap-1.5 mb-1 text-[#f87171] font-mono font-bold text-[10px] uppercase">
                <Flame className="w-3.5 h-3.5 text-[#ef4444]" />
                <span>{sec.title}</span>
              </div>
              <div className="text-[#fee2e2] text-[11.5px] leading-relaxed">
                {renderFormattedContent(sec.content)}
              </div>
            </div>
          );
        }

        // 5. Što čeka
        if (sec.type === 'stoceka') {
          return (
            <div
              key={idx}
              className="bg-gradient-to-r from-[#291e0e]/90 to-[#1a140b]/90 border-l-[3px] border-l-[#f59e0b] border-y border-r border-amber-500/30 rounded-r-md p-2.5 my-1.5 shadow"
            >
              <div className="flex items-center gap-1.5 mb-1 text-[#fbbf24] font-mono font-medium text-[10px] uppercase">
                <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />
                <span>{sec.title}</span>
              </div>
              <div className="text-[#fef3c7] text-[11.5px] leading-relaxed">
                {renderFormattedContent(sec.content)}
              </div>
            </div>
          );
        }

        // 6. Akcija sad
        if (sec.type === 'akcijasad') {
          return (
            <div
              key={idx}
              className="bg-gradient-to-r from-[#0a231a]/90 to-[#0a1713]/90 border-l-[3px] border-l-[#10b981] border-y border-r border-emerald-500/35 rounded-r-md p-2.5 my-1.5 shadow"
            >
              <div className="flex items-center gap-1.5 mb-1 text-[#34d399] font-mono font-bold text-[10px] uppercase">
                <ArrowRight className="w-3.5 h-3.5 text-[#10b981]" />
                <span>{sec.title}</span>
              </div>
              <div className="text-white font-medium text-[11.5px] leading-relaxed">
                {renderFormattedContent(sec.content)}
              </div>
            </div>
          );
        }

        // 7. Intro ili općeniti tekst
        return (
          <div key={idx} className="text-gray-200 text-[12px] leading-relaxed my-1">
            {renderFormattedContent(sec.content)}
          </div>
        );
      })}
    </div>
  );
};
