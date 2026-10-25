/**
 * Helper modul za dohvat Web Client API ključa i globalnih vjerodajnica aplikacije.
 * 
 * Omogućuje aplikaciji ObrtnIQ automatsko prepoznavanje i korištenje ugrađenog
 * Web Client API ključa definiranog na razini okruženja (VITE_GOOGLE_CLIENT_API_KEY / VITE_GOOGLE_API_KEY)
 * prije traženja ručnog korisničkog unosa (BYOK).
 */

/**
 * Dohvaća zadani Web Client API ključ aplikacije ako je postavljen u varijablama okruženja.
 */
export function getAppClientApiKey(): string {
  try {
    let candidate = '';
    if (typeof (import.meta as any) !== 'undefined' && (import.meta as any).env) {
      const env = (import.meta as any).env;
      candidate =
        env.VITE_GOOGLE_CLIENT_API_KEY ||
        env.VITE_GOOGLE_API_KEY ||
        env.VITE_GCP_API_KEY ||
        env.VITE_GEMINI_API_KEY ||
        '';
    }

    if (!candidate && typeof process !== 'undefined' && process.env) {
      candidate =
        process.env.VITE_GOOGLE_CLIENT_API_KEY ||
        process.env.VITE_GOOGLE_API_KEY ||
        process.env.VITE_GCP_API_KEY ||
        process.env.VITE_GEMINI_API_KEY ||
        '';
    }

    return typeof candidate === 'string' ? candidate.trim() : '';
  } catch {
    return '';
  }
}

/**
 * Provjerava ima li aplikacija definiran valjani Web Client API ključ (počinje s AIza).
 */
export function hasAppClientApiKey(): boolean {
  const key = getAppClientApiKey();
  return !!key && key.startsWith('AIza') && key.length >= 35;
}

/**
 * Vraća maskirani prikaz ključa za siguran prikaz u korisničkom sučelju (npr. AIzaSy...9xYz).
 */
export function maskApiKey(key: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 10) return '***';
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}
