/**
 * ObrtnIQ Core - Strukturirani Call Stack Parser
 */

export interface StackFrame {
  raw: string;
  functionName: string;
  fileName: string;
  relativePath: string;
  lineNumber: number;
  columnNumber: number;
  isAppCode: boolean;
}

/**
 * Raščlanjuje sirovi JavaScript stack trace u strukturirani niz okvira (StackFrame[])
 */
export function parseStackTrace(stack?: string): StackFrame[] {
  if (!stack || typeof stack !== 'string') return [];

  const lines = stack.split('\n');
  const frames: StackFrame[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Preskoči naslovni redak iznimke (npr. "Error: Nešto je pošlo po zlu")
    if (!trimmed.startsWith('at ') && !trimmed.includes('@')) continue;

    let functionName = '<anonymous>';
    let fileName = '';
    let lineNumber = 0;
    let columnNumber = 0;

    // 1. Chrome / Edge / Node.js V8 format: "at FunctionName (http://localhost:5173/src/file.ts:12:34)"
    // ili bez naziva funkcije: "at http://localhost:5173/src/file.ts:12:34"
    if (trimmed.startsWith('at ')) {
      const v8WithParen = trimmed.match(/^at\s+(?:async\s+)?(.+?)\s+\((.+?):(\d+):(\d+)\)$/);
      const v8WithoutParen = trimmed.match(/^at\s+(?:async\s+)?(.+?):(\d+):(\d+)$/);

      if (v8WithParen && v8WithParen[1] && v8WithParen[2] && v8WithParen[3] && v8WithParen[4]) {
        functionName = v8WithParen[1].trim();
        fileName = v8WithParen[2].trim();
        lineNumber = parseInt(v8WithParen[3], 10);
        columnNumber = parseInt(v8WithParen[4], 10);
      } else if (v8WithoutParen && v8WithoutParen[1] && v8WithoutParen[2] && v8WithoutParen[3]) {
        fileName = v8WithoutParen[1].trim();
        lineNumber = parseInt(v8WithoutParen[2], 10);
        columnNumber = parseInt(v8WithoutParen[3], 10);
      }
    } 
    // 2. Firefox / Safari format: "functionName@http://localhost:5173/src/file.ts:12:34"
    else if (trimmed.includes('@')) {
      const parts = trimmed.split('@');
      functionName = (parts[0] ? parts[0].trim() : '') || '<anonymous>';
      const location = parts[1] || '';
      const locMatch = location.match(/(.+?):(\d+):(\d+)$/);
      if (locMatch && locMatch[1] && locMatch[2] && locMatch[3]) {
        fileName = locMatch[1].trim();
        lineNumber = parseInt(locMatch[2], 10);
        columnNumber = parseInt(locMatch[3], 10);
      } else {
        fileName = location;
      }
    }

    if (!fileName) continue;

    // Određivanje je li okvir dio koda naše aplikacije ili vanjske biblioteke
    const isNodeModules = fileName.includes('node_modules');
    const hasSrc = fileName.includes('/src/') || fileName.includes('\\src\\');
    const isAppCode = hasSrc && !isNodeModules;

    // Izračun čitljivije relativne putanje
    let relativePath = fileName;
    if (fileName.includes('/src/')) {
      const splitSrc = fileName.split('/src/')[1];
      relativePath = splitSrc ? `src/${splitSrc}` : fileName;
    } else if (fileName.includes('\\src\\')) {
      const splitBack = fileName.split('\\src\\')[1];
      relativePath = splitBack ? `src/${splitBack.replace(/\\/g, '/')}` : fileName;
    } else {
      // Ukloni query stringove i hash (npr. ?t=1729812739)
      const cleanUrl = fileName.split('?')[0]?.split('#')[0] || fileName;
      const segments = cleanUrl.split('/');
      relativePath = segments.slice(-2).join('/');
    }

    // Ukloni Vite query parametre iz relativePath
    relativePath = relativePath.split('?')[0] || relativePath;

    frames.push({
      raw: trimmed,
      functionName,
      fileName,
      relativePath,
      lineNumber,
      columnNumber,
      isAppCode,
    });
  }

  return frames;
}
