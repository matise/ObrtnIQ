/**
 * HUB-3 / HUB-3A Barkod Payload Generator (PDF417 standard HRVHUB30)
 * Prema standardu Hrvatske udruge banaka (HUB)
 */

export interface Hub3Nalog {
  iznosEur: number;
  platiteljImeAdresa: string;
  platiteljUlica?: string;
  platiteljMjesto?: string;
  primateljImeAdresa: string;
  primateljUlica?: string;
  primateljMjesto?: string;
  primateljIban: string;
  model: string; // Npr. "HR00" ili "HR01"
  pozivNaBroj: string; // Npr. "12-2026"
  sifraNamjene: string; // "GDSV" (Goods/Services) ili "OTHR"
  opisPlacanja: string; // Npr. "Račun 12/POSL1/1"
}

/**
 * Generira tekstualni payload za HUB-3 / HUB-3A 2D barkod (PDF417).
 * String se sastoji od točno definiranih polja razdvojenih znakom novog reda (\n).
 * 
 * @param nalog Podaci naloga za plaćanje
 * @returns Formatirani tekstualni payload prema standardu HRVHUB30
 */
export function generateHub3Payload(nalog: Hub3Nalog): string {
  // Iznos u centima, točno 15 znamenki s vodećim nulama (npr. 125.50 € -> 000000000012550)
  const centi = Math.max(0, Math.round(nalog.iznosEur * 100));
  const iznosFormatiran = centi.toString().padStart(15, '0');

  // Primatelj IBAN bez razmaka
  const cleanIban = nalog.primateljIban.replace(/[\s-]/g, '').toUpperCase();

  // Model mora biti do 4 znaka (npr. HR00)
  const cleanModel = nalog.model.trim().toUpperCase().slice(0, 4);

  // Poziv na broj do 22 znaka
  const cleanPozivNaBroj = nalog.pozivNaBroj.trim().slice(0, 22);

  // Šifra namjene do 4 znaka (default GDSV ako je prazno)
  const cleanSifraNamjene = (nalog.sifraNamjene.trim() || 'GDSV').toUpperCase().slice(0, 4);

  const lines = [
    'HRVHUB30',
    'EUR',
    iznosFormatiran,
    nalog.platiteljImeAdresa.slice(0, 35),
    (nalog.platiteljUlica || '').slice(0, 35),
    (nalog.platiteljMjesto || '').slice(0, 35),
    nalog.primateljImeAdresa.slice(0, 35),
    (nalog.primateljUlica || '').slice(0, 35),
    (nalog.primateljMjesto || '').slice(0, 35),
    cleanIban,
    cleanModel,
    cleanPozivNaBroj,
    cleanSifraNamjene,
    nalog.opisPlacanja.slice(0, 35),
  ];

  return lines.join('\n');
}

/**
 * Pomoćna funkcija za parsiranje i provjeru formata generiranog HUB-3 stringa
 */
export function parseHub3Payload(payload: string): Partial<Hub3Nalog> | null {
  const lines = payload.split('\n');
  if (lines.length < 14 || lines[0] !== 'HRVHUB30') {
    return null;
  }

  const centi = parseInt(lines[2] || '0', 10);

  return {
    iznosEur: centi / 100,
    platiteljImeAdresa: lines[3] || '',
    platiteljUlica: lines[4] || '',
    platiteljMjesto: lines[5] || '',
    primateljImeAdresa: lines[6] || '',
    primateljUlica: lines[7] || '',
    primateljMjesto: lines[8] || '',
    primateljIban: lines[9] || '',
    model: lines[10] || '',
    pozivNaBroj: lines[11] || '',
    sifraNamjene: lines[12] || '',
    opisPlacanja: lines[13] || '',
  };
}
