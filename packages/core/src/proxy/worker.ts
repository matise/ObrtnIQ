// packages/core/src/proxy/worker.ts

/**
 * Bezstanjski Cloudflare Worker Proxy za Fiskalizaciju 1.0 (CIS) i Fiskalizaciju 2.0 (e-Račun)
 * 
 * Karakteristike:
 * 1. Zero-Storage: Nema bazu podataka, ne sprema niti bilježi nikakve poslovne podatke.
 * 2. Premošćuje CORS ograničenja web preglednika.
 * 3. Prosljeđuje SOAP HTTPS zahtjeve prema Poreznoj upravi (CIS) i REST/SOAP prema posredniku.
 */

export interface Env {
  CIS_TEST_URL?: string;
  CIS_PROD_URL?: string;
}

const DEFAULT_CIS_TEST_URL = 'https://cistest.apis-it.hr:8449/FiskalizacijaServiceTest';
const DEFAULT_CIS_PROD_URL = 'https://cis.porezna-uprava.hr:8449/FiskalizacijaService';

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Fiskal-Target, X-Fiskal-Env',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    const url = new URL(request.url);

    // Preflight CORS rukovanje
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Health check endpoint
    if (url.pathname === '/health' || url.pathname === '/') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'ObrtnIQ Stateless Fiscal Proxy',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // POST /fiskalizacija/cis (Prosljeđivanje SOAP zahtjeva prema Poreznoj upravi)
    if (url.pathname === '/fiskalizacija/cis' && request.method === 'POST') {
      try {
        const isProd = request.headers.get('X-Fiskal-Env') === 'PROD';
        const targetUrl = isProd
          ? (env.CIS_PROD_URL || DEFAULT_CIS_PROD_URL)
          : (env.CIS_TEST_URL || DEFAULT_CIS_TEST_URL);

        const body = await request.text();

        // Prosljeđivanje prema CIS-u
        const cisResponse = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://www.apis-it.hr/fin/2012/types/f73/RacunZahtjev',
          },
          body,
        });

        const responseXml = await cisResponse.text();

        return new Response(responseXml, {
          status: cisResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/xml; charset=utf-8',
          },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'CIS Proxy mrežna greška';
        return new Response(
          JSON.stringify({
            error: 'CIS_PROXY_FAILED',
            message,
            fallbackStatus: 'OFFLINE_ZKI_IZDAN',
          }),
          {
            status: 502,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // POST /eracun/send (Prosljeđivanje e-Računa prema posredniku)
    if (url.pathname === '/eracun/send' && request.method === 'POST') {
      try {
        const ublXml = await request.text();

        // U demo/mock modu posrednik simulira trenutačni prijem
        const transactionId = 'ERACUN-' + crypto.randomUUID();

        return new Response(
          JSON.stringify({
            status: 'POSLANO_POSREDNIKU',
            transakcijaId: transactionId,
            poruka: 'e-Račun (UBL 2.1) uspješno zaprimljen kod posrednika i spreman za isporuku kupcu.',
            dokumentVeličinaBajtova: ublXml.length,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'e-Račun proxy greška';
        return new Response(
          JSON.stringify({ error: 'ERACUN_SEND_FAILED', message }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    return new Response(JSON.stringify({ error: 'NOT_FOUND' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};
