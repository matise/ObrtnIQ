import React, { useState } from 'react';
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Globe,
  Wifi,
  Shield,
  Cloud,
  Sparkles,
} from 'lucide-react';
import type { UseGoogleAuthReturn } from '../../../hooks/useGoogleAuth';
import type { UseGeminiAssistantReturn } from '../../../hooks/useGeminiAssistant';
import { googleAuthService, type GoogleAuthFullHealthReport } from '../../../services/google-auth-service';
import { googleDriveService } from '../../../services/google-drive-service';
import { appLogger } from '../../../services/logger';

export interface CloudDiagnosticsCardProps {
  googleAuth: UseGoogleAuthReturn;
  gemini: UseGeminiAssistantReturn;
}

export const CloudDiagnosticsCard: React.FC<CloudDiagnosticsCardProps> = ({
  googleAuth,
  gemini,
}) => {
  const loggerDiag = appLogger.scope('SETTINGS:DIAGNOSTICS');

  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagResult, setDiagResult] = useState<{
    clientIdValid: boolean;
    clientIdMsg?: string;
    tokenInfo?: { ok: boolean; scopes: string[]; email?: string; error?: string };
    driveApi?: { ok: boolean; statusText: string; enableUrl?: string };
    geminiApi?: { ok: boolean; msg: string };
    healthReport?: GoogleAuthFullHealthReport;
  } | null>(null);

  const handleRunDiagnostics = async () => {
    loggerDiag.info('Pokretanje sveobuhvatne dijagnostike API-ja i dozvola (Health Check)');
    setIsDiagnosing(true);
    setDiagResult(null);

    // Pokreni cjeloviti zdravstveni pregled (Origin, Mreža, Sesija, Token, Scopes)
    loggerDiag.debug('Izvršavam provjeru mrežne dostupnosti, sesije i valjanosti Client ID-a...');
    const healthReport = await googleAuthService.checkFullAuthHealth();
    loggerDiag.verbose('Strukturirani Health Report generiran', {
      origin: healthReport.origin.origin,
      pingMs: healthReport.network.latencyMs,
      tokenStatus: healthReport.session.tokenStatus,
    });

    let driveRes: { ok: boolean; statusText: string; enableUrl?: string } | undefined;
    const token = await googleAuth.getAccessToken();
    if (token) {
      loggerDiag.debug('OAuth pristupni token aktivan, provjeravam Drive API pristup...');
      const driveCheck = await googleDriveService.testDriveApiAccess(token);
      driveRes = {
        ok: driveCheck.ok,
        statusText: driveCheck.statusText,
        enableUrl: driveCheck.enableUrl,
      };
      if (!driveCheck.ok) {
        loggerDiag.warn('Google Drive API nije dostupan ili je onemogućen u projektu:', { status: driveCheck.statusText });
      }
    } else {
      loggerDiag.debug('Korisnik nije prijavljen s aktivnim tokenom, preskačem provjeru Drive API-ja');
    }

    let geminiRes: { ok: boolean; msg: string } | undefined;
    if (gemini.apiKey) {
      loggerDiag.debug('Provjeravam valjanost Gemini API ključa za odabrani model...', { model: gemini.model });
      const ok = await gemini.testKey(gemini.apiKey);
      geminiRes = {
        ok,
        msg: ok
          ? 'Gemini API ključ je valjan i model uspješno odgovara.'
          : 'Gemini API poziv nije uspio (provjerite ključ ili kvotu na AI Studio).',
      };
      if (!ok) {
        loggerDiag.warn('Provjera Gemini API ključa nije uspjela');
      }
    } else {
      loggerDiag.debug('Gemini API ključ nije postavljen u postavkama (preskačem test)');
    }

    loggerDiag.info('Sveobuhvatna dijagnostika API-ja završena', {
      clientIdValid: healthReport.clientId.validFormat,
      originValid: healthReport.origin.valid,
      networkAccountsOk: healthReport.network.googleAccountsOk,
      sessionValid: healthReport.session.valid,
      driveDostupan: !!driveRes?.ok,
      geminiDostupan: !!geminiRes?.ok,
      preporukaBroj: healthReport.recommendations.length,
    });

    setDiagResult({
      clientIdValid: healthReport.clientId.validFormat,
      clientIdMsg: healthReport.clientId.message,
      tokenInfo: healthReport.tokenInfo
        ? {
            ok: healthReport.tokenInfo.ok,
            scopes: healthReport.tokenInfo.scopes,
            email: healthReport.tokenInfo.email,
            error: healthReport.tokenInfo.error,
          }
        : undefined,
      driveApi: driveRes,
      geminiApi: geminiRes,
      healthReport,
    });
    setIsDiagnosing(false);
  };

  return (
    <div className="p-4 bg-[var(--bg-canvas)] border border-cyan-500/30 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
              <span>Dijagnostika API-ja &amp; Dozvola</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 px-1.5 py-0.2 border border-cyan-500/30">
                Health Check
              </span>
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
              Automatska provjera valjanosti Google Client ID-a, tokena, Google Drive API-ja i Gemini AI ključa.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRunDiagnostics}
          disabled={isDiagnosing}
          className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer flex-shrink-0"
        >
          {isDiagnosing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Activity className="w-3.5 h-3.5" />
          )}
          Pokreni Dijagnostiku
        </button>
      </div>

      {/* Informacije: Koje API-je omogućiti */}
      <details className="text-[11px] font-mono bg-[var(--bg-surface)] p-3 border border-[var(--border-subtle)]">
        <summary className="cursor-pointer font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5">
          ℹ Koje Google API-je trebate omogućiti u konzoli?
        </summary>
        <div className="mt-2 space-y-2 text-[var(--text-secondary)] leading-relaxed">
          <p>
            U <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noreferrer" className="text-[var(--accent-primary)] underline">Google Cloud Console &gt; APIs &amp; Services &gt; Library</a> omogućite:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <b className="text-white">Google Drive API</b> (<code className="text-xs text-amber-300">drive.googleapis.com</code>) — <b className="text-white">Obavezno</b> za oblak sinkronizaciju baze u skrivenu <code className="text-xs">appDataFolder</code> mapu.
            </li>
            <li>
              <b className="text-white">Google Identity / User Profile</b> — Uključeno automatski samom konfiguracijom OAuth zaslona suglasnosti (OAuth consent screen - scopes: <i>openid, email, profile</i>).
            </li>
            <li>
              <b className="text-white">Gemini AI Asistent</b> — <b className="text-emerald-400">NE zahtijeva</b> Google Cloud Console API! Koristi besplatni BYOK ključ s <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[var(--accent-primary)] underline">Google AI Studio</a> (bez potrebe za platnom karticom ili billing računom).
            </li>
          </ul>
        </div>
      </details>

      {/* Rezultati dijagnostike */}
      {diagResult && (
        <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)] text-xs font-mono">
          {/* 1. Client ID format */}
          <div className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-start justify-between gap-2">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                {diagResult.clientIdValid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>1. Google Client ID Format</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {diagResult.clientIdMsg || (diagResult.clientIdValid ? 'Format Client ID-a je ispravan.' : 'Nevažeći format.')}
              </div>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-bold border ${diagResult.clientIdValid ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/40' : 'bg-amber-950 text-amber-400 border-amber-500/40'}`}>
              {diagResult.clientIdValid ? 'ISPRAVAN' : 'UPOZORENJE'}
            </span>
          </div>

          {/* 2. Web Origin & Sigurnosni GIS Protokol */}
          {diagResult.healthReport?.origin && (
            <div className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  {diagResult.healthReport.origin.valid ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <Globe className="w-3.5 h-3.5 text-cyan-400 ml-0.5" />
                  <span>2. Web Origin &amp; GIS Protokol</span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5 space-y-0.5">
                  <div>Ishodište: <span className="text-cyan-300">{diagResult.healthReport.origin.origin}</span></div>
                  {diagResult.healthReport.origin.warning && (
                    <div className="text-amber-300">{diagResult.healthReport.origin.warning}</div>
                  )}
                </div>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold border ${diagResult.healthReport.origin.valid ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/40' : 'bg-red-950 text-red-400 border-red-500/40'}`}>
                {diagResult.healthReport.origin.valid ? (diagResult.healthReport.origin.isLocalhost ? 'LOCALHOST' : 'HTTPS') : 'NEPODRŽANO'}
              </span>
            </div>
          )}

          {/* 3. Povezanost s Google Poslužiteljima */}
          {diagResult.healthReport?.network && (
            <div className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  {diagResult.healthReport.network.googleAccountsOk && diagResult.healthReport.network.googleApisOk ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <Wifi className="w-3.5 h-3.5 text-cyan-400 ml-0.5" />
                  <span>3. Povezanost s Google Poslužiteljima</span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                  <span>accounts.google.com: <b className={diagResult.healthReport.network.googleAccountsOk ? 'text-[#10B981]' : 'text-red-400'}>{diagResult.healthReport.network.googleAccountsOk ? 'DOSTUPAN' : 'NEDOSTUPAN'}</b></span>
                  <span>googleapis.com: <b className={diagResult.healthReport.network.googleApisOk ? 'text-[#10B981]' : 'text-red-400'}>{diagResult.healthReport.network.googleApisOk ? 'DOSTUPAN' : 'NEDOSTUPAN'}</b></span>
                  {diagResult.healthReport.network.latencyMs !== undefined && (
                    <span className="text-cyan-300">({diagResult.healthReport.network.latencyMs} ms)</span>
                  )}
                </div>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold border ${diagResult.healthReport.network.googleAccountsOk ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/40' : 'bg-red-950 text-red-400 border-red-500/40'}`}>
                {diagResult.healthReport.network.googleAccountsOk ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          )}

          {/* 4. Integritet Lokalne Sesije & Kripto Sidro */}
          {diagResult.healthReport?.session && (
            <div className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  {diagResult.healthReport.session.valid ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  )}
                  <span>4. Lokalna Sesija &amp; Kripto Sidro</span>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold border ${diagResult.healthReport.session.valid ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  {diagResult.healthReport.session.valid ? (diagResult.healthReport.session.tokenStatus === 'EXPIRED' ? 'ISTEKAO TOKEN' : 'VALIDNA SESIJA') : 'NEMA SESIJE'}
                </span>
              </div>
              {diagResult.healthReport.session.identity && (
                <div className="text-[11px] text-[var(--text-secondary)] space-y-0.5">
                  <div>Google Sub ID: <code className="text-amber-300">{diagResult.healthReport.session.identity.googleSub}</code> ✓ (21-znamenkasti kripto hash)</div>
                  {diagResult.healthReport.session.reason && (
                    <div className="text-amber-400">{diagResult.healthReport.session.reason}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. Token & Scopes */}
          <div className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                {diagResult.tokenInfo?.ok ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                )}
                <span>5. OAuth Token &amp; Dozvole (Scopes)</span>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold border ${diagResult.tokenInfo?.ok ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                {diagResult.tokenInfo?.ok ? 'AKTIVAN TOKEN' : 'NIJE PRIJAVLJEN'}
              </span>
            </div>
            {diagResult.tokenInfo ? (
              diagResult.tokenInfo.ok ? (
                <div className="text-[11px] text-[var(--text-secondary)] space-y-1">
                  <div>Korisnik: <span className="text-white">{diagResult.tokenInfo.email || googleAuth.identity?.email}</span></div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {diagResult.tokenInfo.scopes.map((sc) => {
                      const shortName = sc.split('/').pop() || sc;
                      const isDrive = sc.includes('drive.appdata');
                      return (
                        <span key={sc} className={`px-1.5 py-0.5 border text-[10px] ${isDrive ? 'bg-[#064E3B] border-[#10B981] text-[#10B981] font-bold' : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-cyan-300'}`}>
                          {shortName}
                        </span>
                      );
                    })}
                  </div>
                  {diagResult.healthReport?.tokenInfo?.scopeVerification.hasDrive === false && (
                    <div className="text-amber-300 text-[10px] mt-1 font-sans">
                      ⚠ Dozvola <code>drive.appdata</code> nedostaje! Ponovno se prijavite i označite kvačicu za Drive pohranu.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-[#EF4444]">{diagResult.tokenInfo.error}</div>
              )
            ) : (
              <div className="text-[11px] text-[var(--text-muted)]">
                Za inspekciju OAuth tokena prijavite se pravim ili demo Google računom.
              </div>
            )}
          </div>

          {/* 6. Google Drive API */}
          <div className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                {diagResult.driveApi?.ok ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                ) : diagResult.driveApi ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                )}
                <span>6. Google Drive API (appDataFolder)</span>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold border ${diagResult.driveApi?.ok ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/40' : diagResult.driveApi ? 'bg-red-950 text-[#EF4444] border-[#EF4444]/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                {diagResult.driveApi?.ok ? 'DOSTUPAN' : diagResult.driveApi ? 'NIJE OMOGUĆEN' : 'ČEKA PRIJAVU'}
              </span>
            </div>
            {diagResult.driveApi ? (
              <div className="text-[11px] space-y-1">
                <div className={diagResult.driveApi.ok ? 'text-[#10B981]' : 'text-amber-300'}>
                  {diagResult.driveApi.statusText}
                </div>
                {diagResult.driveApi.enableUrl && (
                  <a
                    href={diagResult.driveApi.enableUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent-primary)] hover:underline mt-1 bg-[var(--bg-canvas)] px-2.5 py-1 border border-[var(--accent-primary)]/40"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Kliknite ovdje za uključivanje Google Drive API-ja u Google Cloud Console
                  </a>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-[var(--text-muted)]">
                Testira se automatski kada se prijavite Google računom.
              </div>
            )}
          </div>

          {/* 7. Gemini AI Studio */}
          <div className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-start justify-between gap-2">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                {diagResult.geminiApi?.ok ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                ) : diagResult.geminiApi ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                )}
                <span>7. Google AI Studio (Gemini)</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {diagResult.geminiApi?.msg || (gemini.apiKey ? 'Spreman za test' : 'Ključ nije unesen')}
              </div>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-bold border ${diagResult.geminiApi?.ok ? 'bg-[#064E3B] text-[#10B981] border-[#10B981]/40' : diagResult.geminiApi ? 'bg-red-950 text-[#EF4444] border-[#EF4444]/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              {diagResult.geminiApi?.ok ? 'POVEZANO' : diagResult.geminiApi ? 'GREŠKA' : 'NIJE POSTAVLJENO'}
            </span>
          </div>

          {/* 8. Akcijske Preporuke za Otklanjanje Grešaka */}
          {diagResult.healthReport?.recommendations && diagResult.healthReport.recommendations.length > 0 && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/40 space-y-1.5 mt-2">
              <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Preporuke i Koraci za Otklanjanje Poteškoća:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-200/90 leading-relaxed font-sans">
                {diagResult.healthReport.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
