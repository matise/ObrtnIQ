import { describe, it, expect, beforeEach } from 'vitest';
import { appLogger } from '../src/services/logger';
import { geminiService } from '../src/services/gemini-service';
import { executeZigoTool } from '../src/services/zigo-tools-dispatcher';
import { buildLiveScreenContextSnapshot } from '../src/services/zigo-context-builder';
import type { ZigoChatPoruka } from '@obrtniq/core';

describe('AI Agent Sustav: Detaljno logiranje po razinama (Leveled Logging)', () => {
  beforeEach(() => {
    appLogger.clear();
    appLogger.setLevel('VERBOSE'); // Omogućavamo sve razine: ERROR, WARN, INFO, DEBUG, VERBOSE
  });

  it('LL-01: chatWithAgent bilježi AI:CONTEXT i AI:HEURISTIC zapise na DEBUG, INFO i VERBOSE razinama', async () => {
    const liveContext = buildLiveScreenContextSnapshot({
      activeScreen: 'InvoiceDesk',
      form: {
        partnerNaziv: 'Dubrovnik Soft d.o.o.',
        oib: '01234567890',
        isOibValid: false,
        taxZone: 'DOMACI_B2B',
      },
      items: {
        items: [
          {
            id: '1',
            kpdNaziv: 'Razvoj web portala',
            kpdSifra: '62.01.11',
            kolicina: 5,
            cijena: 100,
            jedinicaMjere: 'sat',
          },
        ],
        ukupniIznos: 500,
      },
      stats: {
        kprTotalEur: 12000,
      },
    });

    const messages: ZigoChatPoruka[] = [
      {
        id: 'msg-1',
        sesijaId: 'ses-1',
        uloga: 'user',
        tekst: 'Kupio sam roštilj i meso za radni prostor.',
        kreirano: new Date().toISOString(),
      },
    ];

    // Poziv bez API ključa pokreće lokalni heuristički asistent
    const response = await geminiService.chatWithAgent(messages, '', liveContext);

    expect(response.odgovorTekst).toMatch(/ćevap/i);

    const history = appLogger.getHistory();

    // 1. Provjera AI:CONTEXT zapisa
    const contextDebugLog = history.find((e) => e.context === 'AI:CONTEXT' && e.level === 'DEBUG');
    expect(contextDebugLog).toBeDefined();
    expect((contextDebugLog?.data as any)?.aktivniEkran).toBe('InvoiceDesk');
    expect((contextDebugLog?.data as any)?.partner).toBe('Dubrovnik Soft d.o.o.');

    const contextVerboseLog = history.find((e) => e.context === 'AI:CONTEXT' && e.level === 'VERBOSE');
    expect(contextVerboseLog).toBeDefined();

    // 2. Provjera AI:HEURISTIC zapisa
    const heuristicDebugLog = history.find((e) => e.context === 'AI:HEURISTIC' && e.level === 'DEBUG');
    expect(heuristicDebugLog).toBeDefined();

    const heuristicInfoLog = history.find((e) => e.context === 'AI:HEURISTIC' && e.level === 'INFO');
    expect(heuristicInfoLog).toBeDefined();
    expect(heuristicInfoLog?.message).toContain('Ćevapi test');

    const heuristicVerboseLog = history.find((e) => e.context === 'AI:HEURISTIC' && e.level === 'VERBOSE');
    expect(heuristicVerboseLog).toBeDefined();
  });

  it('LL-02: recommendKpd bilježi AI:KPD klasifikaciju na INFO, DEBUG i VERBOSE razinama', async () => {
    const rec = await geminiService.recommendKpd('Izrada frontend aplikacije u Reactu');

    expect(rec.kpdSifra).toBe('62.01.11');

    const history = appLogger.getHistory();

    // AI:KPD INFO log
    const kpdInfoLog = history.find((e) => e.context === 'AI:KPD' && e.level === 'INFO');
    expect(kpdInfoLog).toBeDefined();
    expect(kpdInfoLog?.message).toContain('KPD');

    // AI:KPD DEBUG log
    const kpdDebugLog = history.find((e) => e.context === 'AI:KPD' && e.level === 'DEBUG');
    expect(kpdDebugLog).toBeDefined();

    // AI:KPD VERBOSE log
    const kpdVerboseLog = history.find((e) => e.context === 'AI:KPD' && e.level === 'VERBOSE');
    expect(kpdVerboseLog).toBeDefined();
    expect((kpdVerboseLog?.data as any)?.kpdSifra).toBe('62.01.11');
  });

  it('LL-03: executeZigoTool bilježi opseg AGENT:TOOL s vremenskom procjenom i VERBOSE podacima', async () => {
    let partnerSet = '';
    const mockContext = {
      form: {
        partnerNaziv: '',
        setPartnerNaziv: (naziv: string) => {
          partnerSet = naziv;
        },
        setOib: () => {},
        setIsOibValid: () => {},
        setIban: () => {},
        setIsIbanValid: () => {},
        setTaxZone: () => {},
      },
    };

    const res = await executeZigoTool(
      'postavi_kupca',
      { partnerNaziv: 'ACME Corp', oib: '12345678903' },
      mockContext as any
    );

    expect(res.uspjeh).toBe(true);
    expect(partnerSet).toBe('ACME Corp');

    const history = appLogger.getHistory();

    // INFO log: započinjanje i dovršetak
    const startLog = history.find(
      (e) => e.context === 'AGENT:TOOL:POSTAVI_KUPCA' && e.level === 'INFO' && e.message.includes('Započinjem')
    );
    expect(startLog).toBeDefined();

    const finishLog = history.find(
      (e) => e.context === 'AGENT:TOOL:POSTAVI_KUPCA' && e.level === 'INFO' && e.message.includes('uspješno dovršen')
    );
    expect(finishLog).toBeDefined();
    expect((finishLog?.data as any)?.trajanjeMs).toBeDefined();

    // DEBUG log: validacija argumenata
    const debugLog = history.find((e) => e.context === 'AGENT:TOOL:POSTAVI_KUPCA' && e.level === 'DEBUG');
    expect(debugLog).toBeDefined();

    // VERBOSE log: cjeloviti podaci rezultata
    const verboseLog = history.find((e) => e.context === 'AGENT:TOOL:POSTAVI_KUPCA' && e.level === 'VERBOSE');
    expect(verboseLog).toBeDefined();
    expect((verboseLog?.data as any)?.podaci?.partnerNaziv).toBe('ACME Corp');
  });

  it('LL-04: Simulacija pada ili nepoznatog alata bilježi WARN/ERROR u dispečeru', async () => {
    const res = await executeZigoTool('nepostojeci_alat_xyz', {}, {} as any);

    expect(res.uspjeh).toBe(false);

    const history = appLogger.getHistory();
    const warnLog = history.find(
      (e) => e.context === 'AGENT:TOOL:NEPOSTOJECI_ALAT_XYZ' && e.level === 'WARN'
    );
    expect(warnLog).toBeDefined();
    expect(warnLog?.message).toContain('Pozvan nepoznat alat');
  });
});
