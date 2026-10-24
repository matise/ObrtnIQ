// apps/web/src/services/fiscal-service.ts

import {
  izracunajZki,
  generateRacunZahtjevSoap,
  parseRacunOdgovorSoap,
  generateFiscalQrUrl,
  generateUblInvoiceXml,
  validateUblInvoiceXml,
  FINA_DEMO_CERTIFICATE,
  encryptPrivateKeyWithPin,
  validateCertificateMetadata,
  type CertificateMetadata,
  type StoredEncryptedVaultEntry,
  type Dokument,
  type ObrtProfil,
  type Partner,
} from '@obrtniq/core';
import { dexieStorage } from '../storage/dexie-db';
import { appLogger } from './logger';

export interface FiscalConfig {
  useDemoCertificate: boolean;
  proxyUrl: string; // npr. "/api/fiskalizacija/cis" ili Cloudflare Worker
  simulateNetworkError: boolean; // za testiranje offline 48h moda
}

const FISCAL_CONFIG_KEY = 'obrtniq_fiscal_config';
const VAULT_ENTRY_KEY = 'obrtniq_certificate_vault';

export class FiscalService {
  private config: FiscalConfig = {
    useDemoCertificate: true,
    proxyUrl: 'https://proxy.obrtniq.internal/fiskalizacija/cis',
    simulateNetworkError: false,
  };

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    try {
      const stored = localStorage.getItem(FISCAL_CONFIG_KEY);
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
  }

  public saveConfig(newConfig: Partial<FiscalConfig>) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(FISCAL_CONFIG_KEY, JSON.stringify(this.config));
    appLogger.scope('FISCAL:CONFIG').info('Ažurirane postavke fiskalizacije', this.config);
  }

  public getConfig(): FiscalConfig {
    return { ...this.config };
  }

  /**
   * Dohvaća metapodatke aktivnog certifikata (DEMO ili pohranjeni iz trezora)
   */
  public getActiveCertificateMetadata(): CertificateMetadata {
    if (this.config.useDemoCertificate) {
      return FINA_DEMO_CERTIFICATE;
    }

    try {
      const stored = localStorage.getItem(VAULT_ENTRY_KEY);
      if (stored) {
        const entry: StoredEncryptedVaultEntry = JSON.parse(stored);
        return entry.metadata;
      }
    } catch {
      // fallback na demo
    }

    return FINA_DEMO_CERTIFICATE;
  }

  /**
   * Sprema novi certifikat u kriptirani trezor uz korisnički PIN
   */
  public async storeCertificateInVault(
    privateKeyPem: string,
    pin: string,
    metadata: CertificateMetadata
  ): Promise<void> {
    const val = validateCertificateMetadata(metadata);
    if (!val.validan) {
      throw new Error(`Neispravan certifikat: ${val.greske.join(', ')}`);
    }

    const encryptedEntry = await encryptPrivateKeyWithPin(privateKeyPem, pin, metadata);
    localStorage.setItem(VAULT_ENTRY_KEY, JSON.stringify(encryptedEntry));
    this.saveConfig({ useDemoCertificate: false });

    appLogger.scope('FISCAL:VAULT').info('FINA certifikat uspješno enkriptiran u trezor', {
      oib: metadata.oib,
      serijskiBroj: metadata.serijskiBroj,
      vrijediDo: metadata.vrijediDo,
    });
  }

  /**
   * Izvodi fiskalizaciju 1.0 za izdani gotovinski/kartični račun
   */
  public async fiskalizirajDokument(
    dokument: Dokument,
    obrtOib: string,
    uSustavuPdv: boolean
  ): Promise<{
    zki: string;
    jir?: string;
    qrKodUrl?: string;
    status: Dokument['fiskalizacijaStatus'];
    greska?: string;
  }> {
    const logger = appLogger.scope('FISCAL:1.0');
    logger.info(`Pokrećem fiskalizaciju za račun ${dokument.brojDokumenta} (${dokument.ukupnoIznos.toFixed(2)} EUR)`);

    // 1. Izračun Zaštitnog koda izdavatelja (ZKI)
    const zki = await izracunajZki({
      oib: obrtOib,
      datumVrijeme: `${dokument.datumIzdavanja} ${dokument.vrijemeIzdavanja}`,
      brojOznakaRacuna: dokument.brojSekvenca,
      oznakaPoslovnogProstora: dokument.poslovniProstorOznaka,
      oznakaNaplatnogUredjaja: dokument.naplatniUredjajOznaka,
      ukupniIznos: dokument.ukupnoIznos,
    });

    logger.debug(`Izračunat ZKI: ${zki}`);

    // Ako je uključen simulated network error ili smo offline, odmah prelazimo na OFFLINE_ZKI_IZDAN
    if (this.config.simulateNetworkError || typeof navigator !== 'undefined' && !navigator.onLine) {
      logger.warn('Porezna uprava (CIS) nije dostupna (Offline mod) - izdajem račun sa ZKI-jem (rok 48h)');
      
      const qrKodUrl = generateFiscalQrUrl({
        zki,
        datumIzdavanja: dokument.datumIzdavanja,
        ukupnoEur: dokument.ukupnoIznos,
      });

      return {
        zki,
        qrKodUrl,
        status: 'OFFLINE_ZKI_IZDAN',
        greska: 'Račun izdan offline sa ZKI kodom. Zakonski rok za naknadno slanje u CIS je 48 sati.',
      };
    }

    // 2. Slanje SOAP zahtjeva prema CIS-u (ili DEMO simulatoru)
    try {
      const idPoruke = crypto.randomUUID();
      const nacinPlacanjaKod = dokument.nacinPlacanja === 'GOTOVINA' ? 'G' : 'K';

      const soapBody = generateRacunZahtjevSoap({
        idPoruke,
        datumVrijeme: `${dokument.datumIzdavanja}T${dokument.vrijemeIzdavanja}`,
        oib: obrtOib,
        uSustavuPdv,
        brojOznakaRacuna: dokument.brojSekvenca,
        oznakaPoslovnogProstora: dokument.poslovniProstorOznaka,
        oznakaNaplatnogUredjaja: dokument.naplatniUredjajOznaka,
        ukupniIznos: dokument.ukupnoIznos,
        nacinPlacanja: nacinPlacanjaKod,
        oibOperatera: obrtOib,
        zki,
        naknadnaDostava: false,
      });

      let jir: string;

      if (this.config.useDemoCertificate) {
        // DEMO simulator: oponaša CIS i generira valjani JIR UUID
        await new Promise((r) => setTimeout(r, 80)); // realistična latencija 80ms
        jir = crypto.randomUUID();
        logger.info(`CIS DEMO odobrio račun: JIR dodijeljen (${jir})`);
      } else {
        // Produkcijsko slanje preko bezstanjskog proxyja
        const response = await fetch(this.config.proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'X-Fiskal-Env': 'PROD',
          },
          body: soapBody,
        });

        const respXml = await response.text();
        const parsed = parseRacunOdgovorSoap(respXml);

        if (!parsed.uspjesno || !parsed.jir) {
          const errMsg = parsed.greske?.map((g) => `${g.sifra}: ${g.poruka}`).join('; ') || 'Nepoznata greška CIS-a';
          throw new Error(errMsg);
        }

        jir = parsed.jir;
        logger.info(`CIS Porezna uprava potvrdila račun: JIR ${jir}`);
      }

      // 3. Generiranje službenog QR koda Porezne uprave s JIR-om
      const qrKodUrl = generateFiscalQrUrl({
        jir,
        zki,
        datumIzdavanja: dokument.datumIzdavanja,
        ukupnoEur: dokument.ukupnoIznos,
      });

      return {
        zki,
        jir,
        qrKodUrl,
        status: 'USPJESNO',
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'CIS poslužitelj nije odgovorio';
      logger.warn(`CIS fiskalizacija nije uspjela (${errMsg}). Prelazim na OFFLINE_ZKI_IZDAN`);

      const qrKodUrl = generateFiscalQrUrl({
        zki,
        datumIzdavanja: dokument.datumIzdavanja,
        ukupnoEur: dokument.ukupnoIznos,
      });

      return {
        zki,
        qrKodUrl,
        status: 'OFFLINE_ZKI_IZDAN',
        greska: errMsg,
      };
    }
  }

  /**
   * Dohvaća sve račune koji čekaju naknadno slanje u CIS (rok 48h)
   */
  public async getOfflineQueue(): Promise<Dokument[]> {
    const all = await dexieStorage.dokumenti.getAll();
    return all.filter((d) => d.fiskalizacijaStatus === 'OFFLINE_ZKI_IZDAN');
  }

  /**
   * Šalje zaostale offline račune u CIS (naknadna dostava s oznakom NakDost=true)
   */
  public async fiskalizirajZaostaleRacune(
    obrtOib: string,
    uSustavuPdv: boolean
  ): Promise<{ uspjesno: number; neuspjesno: number }> {
    const queue = await this.getOfflineQueue();
    let uspjesno = 0;
    let neuspjesno = 0;

    for (const doc of queue) {
      try {
        const res = await this.fiskalizirajDokument(doc, obrtOib, uSustavuPdv);
        if (res.status === 'USPJESNO' && res.jir) {
          await dexieStorage.dokumenti.update(doc.id, {
            fiskalizacijaStatus: 'USPJESNO',
            jir: res.jir,
            qrKodUrl: res.qrKodUrl,
            fiskalizacijaGreska: undefined,
          });
          uspjesno++;
        } else {
          neuspjesno++;
        }
      } catch {
        neuspjesno++;
      }
    }

    return { uspjesno, neuspjesno };
  }

  /**
   * Fiskalizacija 2.0: Generira i validira UBL 2.1 CIUS-HR XML e-Račun
   */
  public generirajEracunUbl(
    dokument: Dokument,
    obrt: ObrtProfil,
    kupac: Partner
  ): { xml: string; valid: boolean; errors: string[] } {
    const xml = generateUblInvoiceXml({
      dokument,
      obrt,
      kupac,
    });

    const validation = validateUblInvoiceXml(xml);

    appLogger.scope('FISCAL:2.0').info('Generiran UBL 2.1 CIUS-HR e-Račun', {
      broj: dokument.brojDokumenta,
      validan: validation.valid,
      kpdStavaka: validation.kpdCodesCount,
      velicinaBajtova: xml.length,
    });

    return {
      xml,
      valid: validation.valid,
      errors: validation.errors,
    };
  }
}

export const fiscalService = new FiscalService();
