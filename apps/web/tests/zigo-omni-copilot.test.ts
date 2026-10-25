import { describe, it, expect, vi } from 'vitest';
import {
  buildLiveScreenContextSnapshot,
  generateContextualChips,
  formatContextForSystemPrompt,
  PAUSALNI_PRAG_EUR,
  getZigoThinkingPhrase,
} from '../src/services/zigo-context-builder';
import { geminiService } from '../src/services/gemini-service';
import { executeZigoTool, type ZigoToolsContext } from '../src/services/zigo-tools-dispatcher';
import type { ZigoChatPoruka } from '@obrtniq/core';
import type { FormItem } from '../src/engine/types';

describe('Faza 13: Žigo Omni-Copilot & Sustav Svjesnosti Konteksta', () => {
  describe('13.1 Sustav za praćenje stanja ekrana u stvarnom vremenu (Omni-Context)', () => {
    it('ispravno gradi snimak ekrana s partnerom, stavkama i financijskim radarom', () => {
      const snapshot = buildLiveScreenContextSnapshot({
        activeScreen: 'InvoiceDesk',
        form: {
          partnerNaziv: 'ACME d.o.o.',
          oib: '01234567890', // Neispravan MOD 11
          isOibValid: false,
          iban: 'HR1234567890123456789',
          isIbanValid: true,
          taxZone: 'DOMACI_B2B',
          nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
        },
        items: {
          items: [
            {
              id: '1',
              kpdNaziv: 'Razvoj softvera',
              kpdSifra: '62.01.11',
              kolicina: 10,
              cijena: 100,
              jedinicaMjere: 'sat',
            },
            {
              id: '2',
              kpdNaziv: 'Grafički dizajn logotipa',
              kpdSifra: '',
              kolicina: 1,
              cijena: 500,
              jedinicaMjere: 'kom',
            },
          ],
          ukupniIznos: 1500,
        },
        stats: {
          kprTotalEur: 35000,
        },
        telemetry: {
          isOnline: true,
          isGoogleDriveConnected: true,
          geminiModel: 'gemini-3.8-flash',
        },
      });

      expect(snapshot.aktivniEkran).toBe('InvoiceDesk');
      expect(snapshot.racun.partnerNaziv).toBe('ACME d.o.o.');
      expect(snapshot.racun.isOibValid).toBe(false);
      expect(snapshot.racun.ukupniIznos).toBe(1500);
      expect(snapshot.racun.brojStavki).toBe(2);
      expect(snapshot.racun.imaNeklasificiranihStavki).toBe(true);

      // Financijski radar
      expect(snapshot.financije.kprPrometYtd).toBe(35000);
      expect(snapshot.financije.porezniPragPausal).toBe(PAUSALNI_PRAG_EUR);
      expect(snapshot.financije.preostaloDoPraga).toBe(5000);
      expect(snapshot.financije.hoceLiProbitePrag).toBe(false); // 35000 + 1500 = 36500 <= 40000
    });

    it('detektira kritično probijanje paušalnog praga od 40.000 €', () => {
      const snapshot = buildLiveScreenContextSnapshot({
        items: {
          items: [],
          ukupniIznos: 3000,
        },
        stats: {
          kprTotalEur: 38500, // 38500 + 3000 = 41500 > 40000
        },
      });

      expect(snapshot.financije.hoceLiProbitePrag).toBe(true);
      expect(snapshot.financije.statusUgroze).toBe('KRITICNO_PREKORACENJE');

      const chips = generateContextualChips(snapshot);
      const prekoracenjeChip = chips.find((c) => c.id === 'chip-prag-prekoracenje');
      expect(prekoracenjeChip).toBeDefined();
      expect(prekoracenjeChip?.prioritet).toBe('visok');
    });

    it('generira dinamičke kontekstualne čipove za nevaljan OIB i nedostajući KPD', () => {
      const snapshot = buildLiveScreenContextSnapshot({
        form: {
          partnerNaziv: 'Test Partner',
          oib: '11111111111',
          isOibValid: false,
        },
        items: {
          items: [
            {
              id: '1',
              kpdNaziv: 'Usluga bez šifre',
              kpdSifra: '',
              kolicina: 1,
              cijena: 100,
              jedinicaMjere: 'kom',
            },
          ],
        },
      });

      const chips = generateContextualChips(snapshot);
      expect(chips.some((c) => c.id === 'chip-oib-invalid')).toBe(true);
      expect(chips.some((c) => c.id === 'chip-kpd-missing')).toBe(true);
      expect(chips.some((c) => c.id === 'chip-zigo-presijeci')).toBe(true);
    });

    it('ispravno formatira Markdown blok za sistemski prompt', () => {
      const snapshot = buildLiveScreenContextSnapshot({
        form: {
          partnerNaziv: 'Dubrovnik d.o.o.',
          oib: '12345678903',
          isOibValid: true,
        },
        items: {
          items: [
            {
              id: '1',
              kpdNaziv: 'Razvoj sustava',
              kpdSifra: '62.01.11',
              kolicina: 1,
              cijena: 1200,
              jedinicaMjere: 'sat',
            },
          ],
          ukupniIznos: 1200,
        },
        stats: {
          kprTotalEur: 15000,
        },
      });

      const formatted = formatContextForSystemPrompt(snapshot);
      expect(formatted).toContain('TRENUTNO STANJE EKRANA I SUSTAVA');
      expect(formatted).toContain('Dubrovnik d.o.o.');
      expect(formatted).toContain('VALJAN MOD 11');
      expect(formatted).toContain('1200.00 EUR');
      expect(formatted).toContain('15000.00 EUR');
      expect(formatted).toContain('ORLANDOV FINANCIJSKI RADAR');
    });
  });

  describe('13.2 & 13.3 Dubrovačka fonologija, stil i lokalna offline heuristika', () => {
    it('poštuje neutralizaciju nazala na -n i očuvanje glasa h u trijaži "Žigo, presijeci"', () => {
      const messages: ZigoChatPoruka[] = [
        {
          id: '1',
          sesijaId: 's1',
          uloga: 'user',
          tekst: 'Žigo, presijeci.',
          kreirano: new Date().toISOString(),
        },
      ];

      const res = geminiService.chatWithAgentLocalHeuristic(messages);
      expect(res.odgovorTekst).toContain('naslonio san se');
      expect(res.odgovorTekst).toContain('držin lakat');
      expect(res.odgovorTekst).toContain('Režen birokratsku dramu u tri točke:');
      expect(res.odgovorTekst).toContain('1. ŠTO GORI');
      expect(res.odgovorTekst).toContain('2. ŠTO ČEKA');
      expect(res.odgovorTekst).toContain('3. AKCIJA SAD');
      expect(res.toolPoziv?.imeFunkcije).toBe('aktiviraj_zigin_rez');
    });

    it('provodi "Ćevapi test" s autentičnim dubrovačkim cinizmom i trodijelnom strukturom', () => {
      const messages: ZigoChatPoruka[] = [
        {
          id: '1',
          sesijaId: 's1',
          uloga: 'user',
          tekst: 'Mogu li pravdati 5 kila ćevapa i roštilj za ured?',
          kreirano: new Date().toISOString(),
        },
      ];

      const res = geminiService.chatWithAgentLocalHeuristic(messages);
      expect(res.odgovorTekst).toContain('Vidin ja');
      expect(res.odgovorTekst).toContain('Dijagnoza:');
      expect(res.odgovorTekst).toContain('Knez je vladao mjesec dana');
      expect(res.odgovorTekst).toContain('Žigin Rez:');
      expect(res.odgovorTekst).toContain('Brišen roštilj, papir ostavljan');
      expect(res.odgovorTekst).toContain('Ne dan da ti porezni inspektor sjedne za vrat');
      expect(res.odgovorTekst).toContain('đe je preša');
    });

    it('proaktivno detektira probijanje paušalnog praga iz liveContexta', () => {
      const snapshot = buildLiveScreenContextSnapshot({
        items: {
          items: [],
          ukupniIznos: 2500,
        },
        stats: {
          kprTotalEur: 38800, // 38800 + 2500 = 41300 > 40000
        },
      });

      const messages: ZigoChatPoruka[] = [
        {
          id: '1',
          sesijaId: 's1',
          uloga: 'user',
          tekst: 'Što misliš o ovom računu, može li proći?',
          kreirano: new Date().toISOString(),
        },
      ];

      const res = geminiService.chatWithAgentLocalHeuristic(messages, snapshot);
      expect(res.odgovorTekst).toContain('E, moj gosparu... Još samo ovaj potpis i ulaziš u PDV');
      expect(res.odgovorTekst).toContain('Lokrum po orkanskom jugu');
      expect(res.odgovorTekst).toContain('probijaš paušalni limit za točno 1300.00 €');
      expect(res.odgovorTekst).toContain('Ovaj račun prebaci na 2. siječnja');
      expect(res.toolPoziv?.imeFunkcije).toBe('prebaci_datum_u_iducu_godinu');
    });

    it('proaktivno detektira neispravan OIB kupca iz liveContexta', () => {
      const snapshot = buildLiveScreenContextSnapshot({
        form: {
          partnerNaziv: 'ACME',
          oib: '99999999999',
          isOibValid: false,
        },
      });

      const messages: ZigoChatPoruka[] = [
        {
          id: '1',
          sesijaId: 's1',
          uloga: 'user',
          tekst: 'Pregledaj partnera i oib',
          kreirano: new Date().toISOString(),
        },
      ];

      const res = geminiService.chatWithAgentLocalHeuristic(messages, snapshot);
      expect(res.odgovorTekst).toContain('OIB kupca');
      expect(res.odgovorTekst).toContain('ISO 7064 MOD 11,10');
      expect(res.toolPoziv?.imeFunkcije).toBe('provjeri_i_ispravi_oib');
      expect(res.toolPoziv?.argumenti.oib).toBe('99999999999');
    });

    it('proaktivno nudi auto_ispuni_kpd_sifre kad na računu nedostaje KPD šifra', () => {
      const snapshot = buildLiveScreenContextSnapshot({
        items: {
          items: [
            {
              id: '1',
              kpdNaziv: 'Programiranje aplikacije',
              kpdSifra: '',
              kolicina: 1,
              cijena: 1000,
              jedinicaMjere: 'kom',
            },
          ],
        },
      });

      const messages: ZigoChatPoruka[] = [
        {
          id: '1',
          sesijaId: 's1',
          uloga: 'user',
          tekst: 'Popuni i sredi mi račun',
          kreirano: new Date().toISOString(),
        },
      ];

      const res = geminiService.chatWithAgentLocalHeuristic(messages, snapshot);
      expect(res.odgovorTekst).toContain('Gledan ti stavke');
      expect(res.odgovorTekst).toContain('KPD 2025');
      expect(res.odgovorTekst).toContain('Fiskalizacija 2.0 i UBL 2.1 e-Račun');
      expect(res.toolPoziv?.imeFunkcije).toBe('auto_ispuni_kpd_sifre');
    });
  });

  describe('13.5 Izvršavanje novih alata u ZigoToolsDispatcher', () => {
    it('uspješno izvršava auto_ispuni_kpd_sifre i dodjeljuje šifre stavkama', async () => {
      let currentItems: FormItem[] = [
        {
          id: '1',
          kpdNaziv: 'Izrada web stranice i programiranje',
          kpdSifra: '',
          kolicina: 1,
          cijena: 1500,
          jedinicaMjere: 'kom',
        },
        {
          id: '2',
          kpdNaziv: 'Grafički dizajn vizuala',
          kpdSifra: '',
          kolicina: 2,
          cijena: 200,
          jedinicaMjere: 'kom',
        },
      ];

      const context: ZigoToolsContext = {
        items: {
          items: currentItems,
          setItems: (itemsOrFn) => {
            currentItems = typeof itemsOrFn === 'function' ? itemsOrFn(currentItems) : itemsOrFn;
          },
          addItem: vi.fn(),
          resetItems: vi.fn(),
          ukupniIznos: 1900,
        },
      };

      const rez = await executeZigoTool('auto_ispuni_kpd_sifre', {}, context);
      expect(rez.uspjeh).toBe(true);
      expect(rez.podaci?.azuriranoStavki).toBe(2);
      expect(currentItems[0]?.kpdSifra).toBe('62.01.11'); // programiranje
      expect(currentItems[1]?.kpdSifra).toBe('74.10.11'); // dizajn
    });

    it('uspješno izvršava prebaci_datum_u_iducu_godinu', async () => {
      let postavljeniDatumIzdavanja = '';
      let postavljeniDatumDospijeca = '';

      const context: ZigoToolsContext = {
        workflow: {
          docType: 'RACUN',
          docStatus: 'NACRT',
          isLocked: false,
          isFormSubmittable: true,
          handleIssueDocument: vi.fn(),
          handleStorno: vi.fn(),
          setDatumIzdavanja: (val: string) => {
            postavljeniDatumIzdavanja = val;
          },
          setDatumDospijeca: (val: string) => {
            postavljeniDatumDospijeca = val;
          },
        },
      };

      const rez = await executeZigoTool('prebaci_datum_u_iducu_godinu', {}, context);
      expect(rez.uspjeh).toBe(true);

      const nextYear = new Date().getFullYear() + 1;
      expect(postavljeniDatumIzdavanja).toBe(`${nextYear}-01-02`);
      expect(postavljeniDatumDospijeca).toBe(`${nextYear}-01-17`);
    });

    it('uspješno izvršava aktiviraj_fjaku', async () => {
      const rez = await executeZigoTool('aktiviraj_fjaku', {}, {});
      expect(rez.uspjeh).toBe(true);
      expect(rez.poruka).toContain('Fjaka je aktivirana');
      expect(rez.poruka).toContain('Republika treba odmorne ljude');
    });
  });

  describe('13.6 Dinamičke fraze razmišljanja ("Žigo duma...")', () => {
    it('vraća kontekstnu frazu kad prijeti probijanje paušalnog praga', () => {
      const snapshot = buildLiveScreenContextSnapshot({
        items: { ukupniIznos: 5000 },
        stats: { kprTotalEur: 38000 }, // 38k + 5k = 43k > 40k
      });
      const phrase = getZigoThinkingPhrase(snapshot);
      expect(phrase).toBe('Žigo duma kako spasit paušal od PDV-a...');
    });

    it('vraća frazu za KPD šifre kad račun ima neklasificirane stavke', () => {
      const snapshot = buildLiveScreenContextSnapshot({
        items: {
          items: [{ opis: 'Savjetovanje', kolicina: 1, cijena: 100, ukupno: 100, imaKpd: false }],
        },
      });
      const phrase = getZigoThinkingPhrase(snapshot);
      expect(phrase).toBe('Žigo duma nad KPD šiframa stavki...');
    });

    it('vraća frazu za OIB kad je OIB unesen ali nevaljan', () => {
      const snapshot = buildLiveScreenContextSnapshot({
        form: { oib: '11111111111', isOibValid: false },
      });
      const phrase = getZigoThinkingPhrase(snapshot);
      expect(phrase).toBe('Žigo duma nad OIB-on kupca...');
    });

    it('vraća frazu povezanu s otvorenom ladicom Knjige prometa (KprDrawer)', () => {
      const snapshot = buildLiveScreenContextSnapshot({
        openDrawers: { KprDrawer: true },
      });
      const phrase = getZigoThinkingPhrase(snapshot);
      expect(phrase).toBe('Žigo duma nad Knjigom prometa...');
    });

    it('vraća frazu povezanu s otvorenim postavkama (SettingsDrawer)', () => {
      const snapshot = buildLiveScreenContextSnapshot({
        openDrawers: { SettingsDrawer: true },
      });
      const phrase = getZigoThinkingPhrase(snapshot);
      expect(phrase).toBe('Žigo duma nad postavkama obrta...');
    });

    it('vraća frazu za noćne sate kad nema aktivnih uzbuna', () => {
      const noc = new Date('2026-10-25T02:30:00Z');
      const snapshot = buildLiveScreenContextSnapshot({
        currentDate: noc,
      });
      const phrase = getZigoThinkingPhrase(snapshot);
      expect(phrase).toBe('Žigo duma u sitne noćne ure...');
    });

    it('vraća zadani kameni mir kad nema snapshot konteksta', () => {
      expect(getZigoThinkingPhrase(undefined)).toBe('Žigo duma...');
    });
  });
});
