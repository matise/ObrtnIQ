// apps/web/tests/invoice-dispatcher.test.ts
// Faza 20: Testovi za klijentsko slanje i dijeljenje računa (Gate-Check V20-5)

import { describe, it, expect } from 'vitest';
import {
  buildMailtoUrl,
  buildChatSummary,
  buildWhatsAppUrl,
  type DispatchInvoiceParams,
} from '../src/services/invoice-dispatcher';

describe('Faza 20: Klijentski dispečer i dijeljenje računa (Gate-Check V20-5)', () => {
  const sampleParams: DispatchInvoiceParams = {
    kupacEmail: 'kupac@adria.hr',
    kupacNaziv: 'Adria Consulting d.o.o.',
    kupacTelefon: '+385912345678',
    brojDokumenta: '1/POSL1/1',
    datumIzdavanja: '25.10.2026.',
    datumDospijeca: '10.11.2026.',
    ukupniIznosEur: 1250.5,
    iban: 'HR1224070001123456789',
    bankaNaziv: 'Zagrebačka banka d.d.',
    obrtNaziv: 'ROBOT HAND MADE',
    vlasnikNaziv: 'Matija Obrtnik',
    pozivNaBroj: 'HR00 1-2026',
  };

  it('V20-5: buildMailtoUrl generira valjan mailto URI s točnim podacima', () => {
    const url = buildMailtoUrl(sampleParams);

    expect(url.startsWith('mailto:kupac%40adria.hr?')).toBe(true);
    expect(url).toContain('subject=');
    expect(url).toContain('body=');

    // Dekodirani sadržaj mora sadržavati sve ključne poslovne elemente
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('Račun br. 1/POSL1/1');
    expect(decoded).toContain('ROBOT HAND MADE');
    expect(decoded).toContain('Adria Consulting d.o.o.');
    expect(decoded).toContain('1.250,50');
    expect(decoded).toContain('HR1224070001123456789');
    expect(decoded).toContain('Zagrebačka banka d.d.');
    expect(decoded).toContain('HR00 1-2026');
    expect(decoded).toContain('Matija Obrtnik');
  });

  it('V20-5: buildChatSummary stvara sažeti tekst za WhatsApp i SMS', () => {
    const summary = buildChatSummary(sampleParams);

    expect(summary).toContain('Račun 1/POSL1/1 • ROBOT HAND MADE');
    expect(summary).toContain('1.250,50');
    expect(summary).toContain('HR1224070001123456789');
    expect(summary).toContain('HR00 1-2026');
    expect(summary).toContain('10.11.2026.');
  });

  it('V20-5: buildWhatsAppUrl generira ispravan link s telefonom i porukom', () => {
    const summary = buildChatSummary(sampleParams);
    const waUrl = buildWhatsAppUrl(summary, sampleParams.kupacTelefon);

    expect(waUrl.startsWith('https://api.whatsapp.com/send?')).toBe(true);
    expect(waUrl).toContain('phone=385912345678');
    expect(waUrl).toContain('text=');
  });
});
