import { describe, it, expect } from 'vitest';
import { parseStackTrace, CoreLogger } from '../src/logger';

describe('Call Stack Parser & Error Inspector (Faza 10.5)', () => {
  it('ispravno raščlanjuje V8 / Chrome / Edge stack trace s funkcijom i putanjom', () => {
    const rawStack = `Error: Greška pri izdavanju
    at handleIssueDocument (http://localhost:5173/src/hooks/useInvoiceWorkflow.ts:142:15)
    at onClick (http://localhost:5173/src/components/desk/InvoiceDeskActions.tsx:45:22)
    at HTMLButtonElement.dispatch (http://localhost:5173/node_modules/react-dom/client.js:1200:10)`;

    const frames = parseStackTrace(rawStack);
    expect(frames.length).toBe(3);

    // Prvi okvir je u kodu aplikacije
    expect(frames[0].functionName).toBe('handleIssueDocument');
    expect(frames[0].lineNumber).toBe(142);
    expect(frames[0].columnNumber).toBe(15);
    expect(frames[0].isAppCode).toBe(true);
    expect(frames[0].relativePath).toBe('src/hooks/useInvoiceWorkflow.ts');

    // Drugi okvir je također aplikacijski kod
    expect(frames[1].functionName).toBe('onClick');
    expect(frames[1].isAppCode).toBe(true);
    expect(frames[1].relativePath).toBe('src/components/desk/InvoiceDeskActions.tsx');

    // Treći okvir je node_modules (nije aplikacijski kod)
    expect(frames[2].isAppCode).toBe(false);
  });

  it('ispravno raščlanjuje Firefox / Safari format (@ separator)', () => {
    const rawStack = `generateInvoicePdf@http://localhost:5173/src/utils/pdf-generator.ts:88:20
renderInvoice@http://localhost:5173/src/components/InvoiceLivePreview.tsx:120:10
@http://localhost:5173/node_modules/scheduler/index.js:50:5`;

    const frames = parseStackTrace(rawStack);
    expect(frames.length).toBe(3);

    expect(frames[0].functionName).toBe('generateInvoicePdf');
    expect(frames[0].lineNumber).toBe(88);
    expect(frames[0].columnNumber).toBe(20);
    expect(frames[0].isAppCode).toBe(true);
    expect(frames[0].relativePath).toBe('src/utils/pdf-generator.ts');

    expect(frames[2].isAppCode).toBe(false);
  });

  it('podržava Windows lokalne datotečne putanje (d:\\...\\src\\...)', () => {
    const rawStack = `Error: Test
    at Object.test (d:\\Documents\\Robot Hand Made\\ObrtnIQ\\packages\\core\\src\\calculator.ts:55:12)`;

    const frames = parseStackTrace(rawStack);
    expect(frames.length).toBe(1);
    expect(frames[0].isAppCode).toBe(true);
    expect(frames[0].relativePath).toBe('src/calculator.ts');
    expect(frames[0].lineNumber).toBe(55);
  });

  it('vraća prazan niz za prazan ili nevaljan stack', () => {
    expect(parseStackTrace(undefined)).toEqual([]);
    expect(parseStackTrace('')).toEqual([]);
    expect(parseStackTrace('Samo običan string bez stack linija')).toEqual([]);
  });

  it('CoreLogger automatski obogaćuje LogEntryError sa strukturiranim frames poljem', () => {
    const logger = new CoreLogger('INFO', 10);
    const err = new Error('Simulirani kvar u servisu');
    
    const entry = logger.error('TEST:STACK', 'Dogodila se greška', err);
    expect(entry).not.toBeNull();
    expect(entry?.error).toBeDefined();
    expect(entry?.error?.name).toBe('Error');
    expect(entry?.error?.message).toBe('Simulirani kvar u servisu');
    expect(Array.isArray(entry?.error?.frames)).toBe(true);
    expect(entry?.error?.frames?.length).toBeGreaterThan(0);
  });
});
