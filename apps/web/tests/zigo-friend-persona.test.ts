import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geminiService, ZIGO_SYSTEM_INSTRUCTION } from '../src/services/gemini-service';
import type { ZigoChatPoruka } from '@obrtniq/core';

describe('Zigo Friend Persona & Dual Cognitive Mode (Faza 14.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('FP-01: "ništa posebno, samo prija" aktivira Modus Prijatelja i NE poziva aktiviraj_fjaku', async () => {
    const poruke: ZigoChatPoruka[] = [
      {
        id: 'msg-1',
        sesijaId: 'ses-1',
        uloga: 'user',
        tekst: 'ništa posebno, samo prija',
        kreirano: '2026-10-25T02:25:00.000Z',
      },
    ];

    // Live kontekst u sitne noćne sate (02:25)
    const liveContext = {
      jeLiKasnoNoc: true,
      financije: {
        kprPrometYtd: 12500,
        preostaloDoPraga: 27500,
        postotakPraga: 31.25,
        statusUgroze: 'SIGURNO' as const,
        hoceLiProbitePrag: false,
        trenutniRacunIznos: 0,
      },
      racun: {
        imaNeklasificiranihStavki: false,
        brojStavki: 0,
        ukupniIznos: 0,
        isOibValid: true,
      },
      sustav: {
        online: true,
      },
      aktivniEkran: 'RACUN_DRAFT' as const,
    };

    const resp = await geminiService.chatWithAgent(poruke, undefined, liveContext as any);

    // Mora odgovoriti toplo kao prijatelj, a NE pozivati alat aktiviraj_fjaku
    expect(resp.toolPoziv).toBeUndefined();
    expect(resp.odgovorTekst).toContain('gosparu moj');
    expect(resp.odgovorTekst).toContain('Stradun');
    expect(resp.odgovorTekst).toContain('Kamenu ne smeta tišina');
    // Kameni vitez NE postavlja kurtoazna pitanja ("kako si", "kako ti je prošao dan?")
    expect(resp.odgovorTekst).not.toContain('?');
    expect(resp.odgovorTekst).not.toContain('Kako ti je prošao dan');
    // Ne smije biti rigidna trodijelna struktura
    expect(resp.odgovorTekst).not.toContain('**Opservacija:**');
    expect(resp.odgovorTekst).not.toContain('**Žigin Rez:**');
  });

  it('FP-02: Ležerni pozdravi i kava ("kako si mi, kava") vraćaju prijateljski odgovor bez alata i bez usiljenih pitanja', async () => {
    const poruke: ZigoChatPoruka[] = [
      {
        id: 'msg-1',
        sesijaId: 'ses-1',
        uloga: 'user',
        tekst: 'Bok Orlando, kako si danas? Ajmo popit kavu na miru',
        kreirano: new Date().toISOString(),
      },
    ];

    const resp = await geminiService.chatWithAgent(poruke);

    expect(resp.toolPoziv).toBeUndefined();
    expect(resp.odgovorTekst).toMatch(/(gosparu|Stradun|kav|noge|mir)/i);
    expect(resp.odgovorTekst).not.toContain('?');
  });

  it('FP-03: Sistemska uputa (ZIGO_SYSTEM_INSTRUCTION) sadrži definiciju dvostrukog kognitivnog modusa i Orlandove psihologije', () => {
    expect(ZIGO_SYSTEM_INSTRUCTION).toContain('[DVOSTRUKI KOGNITIVNI MODUS: MODUS PRIJATELJA VS. OPERATIVNI MODUS]');
    expect(ZIGO_SYSTEM_INSTRUCTION).toContain('MODUS PRIJATELJA I SUBORCA');
    expect(ZIGO_SYSTEM_INSTRUCTION).toContain('OPERATIVNI MODUS');
    expect(ZIGO_SYSTEM_INSTRUCTION).toContain('samo prija');
    expect(ZIGO_SYSTEM_INSTRUCTION).toContain('[ORLANDOVA PSIHOLOGIJA: KAMENI VITEZ, A NE ČAVRLJALO]');
    expect(ZIGO_SYSTEM_INSTRUCTION).toContain('STROGA ZABRANA ISPRAZNIH KURTOAZNIH PITANJA');
  });

  it('FP-04: aktiviraj_fjaku se pokreće samo kad korisnik eksplicitno zatraži gašenje svjetla ili fjaku', async () => {
    const poruke: ZigoChatPoruka[] = [
      {
        id: 'msg-1',
        sesijaId: 'ses-1',
        uloga: 'user',
        tekst: 'Žigo, upali fjaku na ekranu i gasi svjetlo',
        kreirano: new Date().toISOString(),
      },
    ];

    const resp = await geminiService.chatWithAgent(poruke);

    expect(resp.toolPoziv).toBeDefined();
    expect(resp.toolPoziv?.imeFunkcije).toBe('aktiviraj_fjaku');
  });

  it('FP-05: Operativni upit ("pripremi račun za ACME") i dalje pokreće Operativni modus s alatom', async () => {
    const poruke: ZigoChatPoruka[] = [
      {
        id: 'msg-1',
        sesijaId: 'ses-1',
        uloga: 'user',
        tekst: 'Pripremi račun za ACME d.o.o., OIB 12345678903',
        kreirano: new Date().toISOString(),
      },
    ];

    const resp = await geminiService.chatWithAgent(poruke);

    expect(resp.toolPoziv).toBeDefined();
    expect(resp.toolPoziv?.imeFunkcije).toBe('postavi_kupca');
    expect(resp.odgovorTekst).toContain('**Opservacija:**');
    expect(resp.odgovorTekst).toContain('**Dijagnoza:**');
    expect(resp.odgovorTekst).toContain('**Žigin Rez:**');
  });

  it('FP-06: Orlandova prosudba ("što misliš") aktivira mudri sud i propitivanje prijatelja', async () => {
    const poruke: ZigoChatPoruka[] = [
      {
        id: 'msg-1',
        sesijaId: 'ses-1',
        uloga: 'user',
        tekst: 'Žigo, što misliš o ovoj ponudi od 500 € za mjesec dana posla?',
        kreirano: new Date().toISOString(),
      },
    ];

    const resp = await geminiService.chatWithAgent(poruke);

    expect(resp.toolPoziv).toBeUndefined();
    expect(resp.odgovorTekst).toContain('Senat');
    expect(resp.odgovorTekst).toContain('Minčetu');
    // Kada prijatelj traži sud, Orlando ga propituje oštrom gosparskom evaluacijom
    expect(resp.odgovorTekst).toContain('Jesi li ti siguran da ti taj posao donosi kruh, il\' samo hraniš tuđu prešu?');
  });
});
