import React, { useState } from 'react';
import {
  LogIn,
  LogOut,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { UseGoogleAuthReturn } from '../../../hooks/useGoogleAuth';
import { appLogger } from '../../../services/logger';

export interface GoogleIdentityCardProps {
  googleAuth: UseGoogleAuthReturn;
}

export const GoogleIdentityCard: React.FC<GoogleIdentityCardProps> = ({
  googleAuth,
}) => {
  const loggerAuth = appLogger.scope('SETTINGS:GOOGLE');
  const [customClientIdInput, setCustomClientIdInput] = useState(googleAuth.clientId);

  const handleGoogleLogin = async () => {
    loggerAuth.info('Korisnik zatražio Google OAuth prijavu');
    if (!googleAuth.hasCustomClientId) {
      loggerAuth.warn('Google prijava odbijena: nije postavljen prilagođeni Google Client ID');
      alert(
        'Za prijavu stvarnim Google računom potrebno je unijeti vaš besplatni Google Cloud Client ID u "Naprednim postavkama" ispod.\n\nZa trenutno testiranje svih mogućnosti (kripto-sidro, AES-256 enkripcija, Drive sync) bez konfiguracije kliknite "Isprobaj Demo Prijavu"!'
      );
      return;
    }
    try {
      await googleAuth.login();
      loggerAuth.info('Google OAuth prijava dovršena');
    } catch (err: any) {
      loggerAuth.error('Google OAuth prijava nije uspjela:', { error: err?.message });
    }
  };

  const handleGoogleLogout = () => {
    loggerAuth.info('Korisnik kliknuo Odjava s Google računa');
    googleAuth.logout();
  };

  const handleGoogleDemoLogin = async () => {
    loggerAuth.info('Korisnik kliknuo Demo prijavu Google računa');
    await googleAuth.loginDemo();
  };

  const handleGoogleRefreshToken = async () => {
    loggerAuth.info('Korisnik zatražio ručno osvježavanje OAuth pristupnog tokena');
    await googleAuth.refreshAccessToken();
  };

  const handleSaveClientId = () => {
    loggerAuth.info('Spremanje prilagođenog Google Client ID-a', {
      postavljen: !!customClientIdInput,
      duljina: customClientIdInput?.length || 0,
    });
    googleAuth.setClientId(customClientIdInput);
    alert('Google Client ID spremljen.');
  };

  return (
    <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded bg-[#4285F4]/20 border border-[#4285F4]/40 flex items-center justify-center text-[#4285F4] flex-shrink-0">
          <LogIn className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
            <span>Google Identity &amp; Kriptografsko Sidro</span>
            <span className="text-[10px] bg-[#1E3A8A] text-[#60A5FA] px-1.5 py-0.2 border border-[#60A5FA]/30">
              Zero-Server Auth
            </span>
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
            Povezuje vaš jedinstveni Google ID (sub) s lokalnom bazom za izvođenje AES-256-GCM ključa i besplatnu Drive sinkronizaciju.
          </p>
        </div>
      </div>

      {googleAuth.identity ? (
        <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-strong)] space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {googleAuth.identity.pictureUrl ? (
                <img
                  src={googleAuth.identity.pictureUrl}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover border border-[var(--border-subtle)]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#4285F4] text-white flex items-center justify-center font-bold">
                  {googleAuth.identity.name ? googleAuth.identity.name.charAt(0) : 'G'}
                </div>
              )}
              <div>
                <div className="font-bold text-white text-sm">
                  {googleAuth.identity.name}
                </div>
                <div className="text-[var(--text-muted)] text-[11px]">
                  {googleAuth.identity.email}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogout}
              className="px-3 py-1.5 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-[#EF4444] border border-[#EF4444]/40 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Odjavi se
            </button>
          </div>

          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5 text-[11px] text-[var(--text-secondary)]">
            <div>
              Google Kripto Sidro (sub):{' '}
              <code className="text-[var(--accent-primary)] font-bold">
                {googleAuth.identity.googleSub}
              </code>
            </div>
            <div>
              Povezano:{' '}
              <span className="text-white">
                {googleAuth.identity.connectedAt
                  ? new Date(googleAuth.identity.connectedAt).toLocaleString('hr-HR')
                  : 'Aktivno'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
              <div>
                Aktivnost tokena:{' '}
                {googleAuth.tokenRemainingMinutes > 0 ? (
                  <span className="text-[#10B981] font-bold">
                    Vrijedi još {googleAuth.tokenRemainingMinutes} min (auto-refresh aktivan)
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold">
                    Token istekao (obnavlja se tiho pri sinkronizaciji)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleGoogleRefreshToken}
                className="text-[10px] text-[var(--accent-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                title="Prisilno obnovi Google pristupni token"
              >
                <RefreshCw className="w-3 h-3" />
                Obnovi token
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
          {googleAuth.error && (
            <div className="p-2.5 bg-[#7F1D1D]/40 border border-[#EF4444] text-[#EF4444] text-xs font-mono">
              {googleAuth.error}
            </div>
          )}

          {!googleAuth.hasCustomClientId && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-xs font-mono space-y-1.5">
              <div className="text-amber-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Za prijavu vlastitim Google računom potreban je Client ID</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">
                Za trenutno testiranje svih mogućnosti (kripto-sidro, AES-256 enkripcija i Drive sync) bez konfiguracije kliknite <b>"Isprobaj Demo Prijavu"</b>.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleAuth.isLoading}
              className="flex-1 px-4 py-2 bg-[#4285F4] hover:bg-[#3367D6] disabled:opacity-50 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Prijavi se putem Google računa
            </button>

            <button
              type="button"
              onClick={handleGoogleDemoLogin}
              className="px-3 py-2 bg-[#064E3B] hover:bg-[#047857] text-[#10B981] border border-[#10B981]/40 font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm"
              title="Simulira Google prijavu za testiranje bez unosa Google Client ID-a"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Isprobaj Demo Prijavu
            </button>
          </div>

          <details className="text-[11px] font-mono text-[var(--text-muted)] pt-1" open={!googleAuth.hasCustomClientId}>
            <summary className="cursor-pointer hover:text-white font-bold text-[var(--text-secondary)]">
              ▶ Napredne postavke: Vlastiti Google OAuth Client ID
            </summary>
            <div className="mt-2 space-y-3 p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                  Google Cloud Client ID:
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={customClientIdInput}
                    onChange={(e) => setCustomClientIdInput(e.target.value)}
                    placeholder="123456789-xyz.apps.googleusercontent.com"
                    className="flex-1 bg-[var(--bg-canvas)] text-white px-2.5 py-1.5 text-xs font-mono border border-[var(--border-strong)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveClientId}
                    className="px-3 py-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-mono font-bold cursor-pointer transition-all"
                  >
                    Spremi
                  </button>
                </div>
              </div>

              <div className="p-2.5 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1 text-[10px] text-[var(--text-muted)] font-sans">
                <b className="text-white font-mono">Kako dobiti besplatni Google Client ID (2 min):</b>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>Otvorite <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-[var(--accent-primary)] underline">Google Cloud Console</a>.</li>
                  <li>Kliknite <b>Create Credentials &gt; OAuth client ID</b> (Tip: <i>Web application</i>).</li>
                  <li>U <b>Authorized JavaScript origins</b> dodajte: <code className="text-white font-mono">http://localhost:5173</code></li>
                  <li>Kopirajte Client ID, zalijepite ga gore i kliknite <b>Spremi</b>.</li>
                </ol>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};
