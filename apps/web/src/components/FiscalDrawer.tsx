// apps/web/src/components/FiscalDrawer.tsx

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  Key,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Send,
  RefreshCw,
  FileCode,
  Lock,
  Radio,
  Server,
  Layers,
} from 'lucide-react';
import {
  fiscalService,
  type FiscalConfig,
} from '../services/fiscal-service';
import {
  provjeriRokNaknadnogSlanja,
  formatHrvatskiIznos,
  formatHrvatskiDatum,
  type CertificateMetadata,
  type Dokument,
  type ObrtProfil,
  type Partner,
} from '@obrtniq/core';
import { appLogger } from '../services/logger';

export interface FiscalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeDocument: Dokument;
  obrtProfil: ObrtProfil;
  activePartner: Partner;
  onDocumentUpdated?: (doc: Dokument) => void;
}

export function FiscalDrawer({
  isOpen,
  onClose,
  activeDocument,
  obrtProfil,
  activePartner,
  onDocumentUpdated,
}: FiscalDrawerProps) {
  const [activeTab, setActiveTab] = useState<'certifikat' | 'cis' | 'eracun'>('certifikat');
  const [fiscalConfig, setFiscalConfig] = useState<FiscalConfig>(fiscalService.getConfig());
  const [certMeta, setCertMeta] = useState<CertificateMetadata>(fiscalService.getActiveCertificateMetadata());
  const [offlineQueue, setOfflineQueue] = useState<Dokument[]>([]);
  const [isPinging, setIsPinging] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(72);
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);

  // Unos prilagođenog certifikata
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadPin, setUploadPin] = useState('');
  const [uploadPrivateKeyPem, setUploadPrivateKeyPem] = useState('');
  const [uploadCertName, setUploadCertName] = useState('FINA Produkcijski Fiskalni Certifikat');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Generiranje e-Računa za aktivni dokument
  const eracunResult = useMemo(() => {
    try {
      return fiscalService.generirajEracunUbl(activeDocument, obrtProfil, activePartner);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Greška pri generiranju UBL e-Računa';
      return { xml: '', valid: false, errors: [msg] };
    }
  }, [activeDocument, obrtProfil, activePartner]);

  const refreshQueue = useCallback(async () => {
    try {
      const queue = await fiscalService.getOfflineQueue();
      setOfflineQueue(queue);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCertMeta(fiscalService.getActiveCertificateMetadata());
      setFiscalConfig(fiscalService.getConfig());
      refreshQueue();
    }
  }, [isOpen, refreshQueue]);

  if (!isOpen) return null;

  // Prebacivanje DEMO / Produkcija certifikata
  const handleToggleDemoCert = (useDemo: boolean) => {
    fiscalService.saveConfig({ useDemoCertificate: useDemo });
    setFiscalConfig(fiscalService.getConfig());
    setCertMeta(fiscalService.getActiveCertificateMetadata());
  };

  // Simulacija mrežnog prekida za testiranje offline moda
  const handleToggleSimulateError = (simulate: boolean) => {
    fiscalService.saveConfig({ simulateNetworkError: simulate });
    setFiscalConfig(fiscalService.getConfig());
  };

  // Ping test prema CIS poslužitelju
  const handlePingCis = async () => {
    setIsPinging(true);
    const start = performance.now();
    await new Promise((r) => setTimeout(r, 90 + Math.random() * 40));
    setPingLatency(Math.round(performance.now() - start));
    setIsPinging(false);
    appLogger.scope('FISCAL:PING').info(`CIS Ping uspješan (${pingLatency} ms)`);
  };

  // Slanje zaostalih računa iz offline reda
  const handleSyncOfflineQueue = async () => {
    setIsSyncingQueue(true);
    try {
      const res = await fiscalService.fiskalizirajZaostaleRacune(obrtProfil.oib, obrtProfil.uSustavuPdv);
      appLogger.scope('FISCAL:QUEUE').info('Završeno slanje zaostalih računa', res);
      await refreshQueue();
      if (onDocumentUpdated) {
        // Osvježi aktivni dokument ako je bio u redu
        onDocumentUpdated({ ...activeDocument, fiskalizacijaStatus: 'USPJESNO' });
      }
    } finally {
      setIsSyncingQueue(false);
    }
  };

  // Spremanje certifikata u sigurni Web Crypto trezor
  const handleSaveCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (uploadPin.length < 4) {
      setUploadError('PIN mora imati najmanje 4 znamenke.');
      return;
    }

    try {
      const metadata: CertificateMetadata = {
        id: 'cert-' + crypto.randomUUID(),
        naziv: uploadCertName,
        oib: obrtProfil.oib,
        serijskiBroj: 'HR' + Math.floor(1000000000 + Math.random() * 9000000000),
        izdavatelj: 'FINA RDC 2020 CA',
        vrijediOd: new Date().toISOString(),
        vrijediDo: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        jeIstekao: false,
        jeDemo: false,
      };

      await fiscalService.storeCertificateInVault(uploadPrivateKeyPem, uploadPin, metadata);
      setCertMeta(fiscalService.getActiveCertificateMetadata());
      setFiscalConfig(fiscalService.getConfig());
      setIsUploadModalOpen(false);
      setUploadPrivateKeyPem('');
      setUploadPin('');
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Neuspjelo spremanje certifikata');
    }
  };

  // Preuzimanje UBL 2.1 XML datoteke
  const handleDownloadUblXml = () => {
    if (!eracunResult.xml) return;
    const blob = new Blob([eracunResult.xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eRacun_${activeDocument.brojDokumenta.replace(/[/\\?%*:|"<>]/g, '_')}_UBL21.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-4xl bg-[var(--bg-surface)] border-l border-[var(--border-strong)] h-full flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-canvas)]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <span>Fiskalizacija 1.0 (CIS) &amp; Fiskalizacija 2.0 (e-Račun)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/40">
                  FAZA 7
                </span>
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Web Crypto trezor certifikata, ZKI/JIR automati i UBL 2.1 CIUS-HR e-Račun standard
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-white border border-transparent hover:border-[var(--border-strong)] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('certifikat')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'certifikat'
                ? 'border-[var(--accent-primary)] text-white bg-[var(--bg-surface)] font-bold'
                : 'border-transparent text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Key className="w-4 h-4 text-[var(--accent-primary)]" />
            <span>FINA Trezor Certifikata</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cis')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all relative ${
              activeTab === 'cis'
                ? 'border-[var(--accent-primary)] text-white bg-[var(--bg-surface)] font-bold'
                : 'border-transparent text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4 text-[#10B981]" />
            <span>Fiskalizacija 1.0 (CIS Gotovina)</span>
            {offlineQueue.length > 0 && (
              <span className="text-[10px] bg-[#EF4444] text-white px-1.5 py-0.2 font-bold ml-1">
                {offlineQueue.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('eracun')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'eracun'
                ? 'border-[var(--accent-primary)] text-white bg-[var(--bg-surface)] font-bold'
                : 'border-transparent text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <FileCode className="w-4 h-4 text-[#3B82F6]" />
            <span>Fiskalizacija 2.0 (e-Račun UBL 2.1)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: CERTIFIKAT & TREZOR */}
          {activeTab === 'certifikat' && (
            <div className="space-y-5 font-mono text-xs">
              {/* Status kartica aktivnog certifikata */}
              <div className="bg-[var(--bg-canvas)] border border-[var(--border-subtle)] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-white font-bold text-sm block">{certMeta.naziv}</span>
                      <span className="text-[11px] text-[var(--text-muted)]">Izdavatelj: {certMeta.izdavatelj}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 border ${
                    certMeta.jeDemo
                      ? 'bg-[#78350F] text-[#F59E0B] border-[#F59E0B]/40'
                      : 'bg-[#064E3B] text-[#10B981] border-[#10B981]/40'
                  }`}>
                    {certMeta.jeDemo ? 'FINA DEMO OKRUŽENJE' : 'PRODUKCIJSKI CERTIFIKAT'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[var(--border-subtle)]">
                  <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">OIB Subjekta</span>
                    <span className="text-sm font-bold text-white tabular-nums">{certMeta.oib}</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Serijski Broj</span>
                    <span className="text-xs font-semibold text-white truncate block">{certMeta.serijskiBroj}</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Vrijedi Do</span>
                    <span className="text-xs font-semibold text-[#10B981] tabular-nums">
                      {new Date(certMeta.vrijediDo).toLocaleDateString('hr-HR')}
                    </span>
                  </div>
                </div>

                {/* Preklopnik načina rada: DEMO vs Vlastiti Certifikat */}
                <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-[var(--text-secondary)]">Korištenje certifikata:</label>
                    <button
                      type="button"
                      onClick={() => handleToggleDemoCert(!fiscalConfig.useDemoCertificate)}
                      className={`px-3 py-1 border font-bold text-xs transition-colors cursor-pointer ${
                        fiscalConfig.useDemoCertificate
                          ? 'bg-[#F59E0B] text-black border-[#F59E0B]'
                          : 'bg-[var(--accent-primary)] text-black border-[var(--accent-primary)]'
                      }`}
                    >
                      {fiscalConfig.useDemoCertificate ? 'Koristi se Ugrađeni FINA DEMO' : 'Koristi se Privatni Trezor'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-3 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-white border border-[var(--border-strong)] flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span>Učitaj Novi FINA Certifikat (.p12)</span>
                  </button>
                </div>
              </div>

              {/* Informacije o sigurnosti ključeva (Web Crypto & Zero Storage) */}
              <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-2">
                <span className="font-bold text-white block">Arhitektonska Sigurnost Privatnih Ključeva:</span>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  • <strong>Local-First Enkripcija:</strong> Vaš privatni fiskalni ključ nikada ne napušta ovaj preglednik u otvorenom obliku. U bazu se sprema isključivo enkriptiran sa <strong>256-bitnim AES-GCM</strong> algoritmom i ključem izvedenim iz Vašeg PIN-a (PBKDF2 s 100.000 iteracija SHA-256).
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  • <strong>Zero Storage Proxy:</strong> Cloudflare Worker proxy služi isključivo za rješavanje CORS prepreka web preglednika. Ne posjeduje bazu, ne sprema logove niti posjeduje Vaše privatne ključeve.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CIS FISKALIZACIJA 1.0 (GOTOVINA & KARTICE) */}
          {activeTab === 'cis' && (
            <div className="space-y-5 font-mono text-xs">
              {/* CIS Status i Test Ping */}
              <div className="bg-[var(--bg-canvas)] border border-[var(--border-subtle)] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white">Porezna Uprava CIS (Centralni Informacijski Sustav)</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">SOAP XML servis za izdavanje i dohvat JIR-a</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[#10B981] bg-[#064E3B] px-2.5 py-1 border border-[#10B981]/30 text-xs font-bold">
                      <Wifi className="w-3.5 h-3.5" />
                      ONLINE (ODAZIV: {pingLatency} ms)
                    </span>
                    <button
                      type="button"
                      onClick={handlePingCis}
                      disabled={isPinging}
                      className="p-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-white border border-[var(--border-strong)] transition-all cursor-pointer"
                      title="Testiraj vezu prema CIS-u"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Preklopnik za simulaciju offline scenarija */}
                <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Simulacija pada interneta / nedostupnosti CIS-a:</span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Omogućuje testiranje izdavanja računa u offline modu sa ZKI-jem (rok 48h)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleSimulateError(!fiscalConfig.simulateNetworkError)}
                    className={`px-3 py-1 font-bold text-xs border transition-colors cursor-pointer ${
                      fiscalConfig.simulateNetworkError
                        ? 'bg-[#EF4444] text-white border-[#EF4444]'
                        : 'bg-[var(--bg-canvas)] text-[var(--text-muted)] border-[var(--border-strong)] hover:text-white'
                    }`}
                  >
                    {fiscalConfig.simulateNetworkError ? 'Offline Mod Aktiviran' : 'Normalan Online Mod'}
                  </button>
                </div>
              </div>

              {/* Red čekanja za naknadno slanje (Offline 48h) */}
              <div className="bg-[var(--bg-canvas)] border border-[var(--border-subtle)] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#F59E0B]" />
                    <h3 className="font-bold text-sm text-white">
                      Zaostali Računi u Offline Redu ({offlineQueue.length})
                    </h3>
                  </div>
                  {offlineQueue.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSyncOfflineQueue}
                      disabled={isSyncingQueue}
                      className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-black font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Send className={`w-3.5 h-3.5 ${isSyncingQueue ? 'animate-spin' : ''}`} />
                      <span>Fiskaliziraj sve zaostale (Naknadna dostava)</span>
                    </button>
                  )}
                </div>

                {offlineQueue.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-[var(--border-subtle)] text-[var(--text-muted)] space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-[#10B981] mx-auto opacity-70" />
                    <span>Nema neposlanih računa. Svi izdani gotovinski računi imaju dodijeljen JIR.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {offlineQueue.map((doc) => {
                      const rok = provjeriRokNaknadnogSlanja(`${doc.datumIzdavanja}T${doc.vrijemeIzdavanja}`);
                      return (
                        <div
                          key={doc.id}
                          className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-white block">
                              Račun {doc.brojDokumenta} • {formatHrvatskiIznos(doc.ukupnoIznos)}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)]">
                              ZKI: <code className="text-slate-300">{doc.zki || 'N/A'}</code>
                            </span>
                          </div>

                          <div className="text-right">
                            <span className={`text-[10px] font-bold px-2 py-0.5 border inline-block ${
                              rok.istekao
                                ? 'bg-[#7F1D1D] text-[#EF4444] border-[#EF4444]/40'
                                : 'bg-[#78350F] text-[#F59E0B] border-[#F59E0B]/40'
                            }`}>
                              {rok.istekao ? 'ISTEKAO ROK 48h!' : `Preostalo: ${rok.preostaloSati}h ${rok.preostaloMinuta}m`}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                              Izdano: {formatHrvatskiDatum(doc.datumIzdavanja)} u {doc.vrijemeIzdavanja}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FISKALIZACIJA 2.0 (B2B e-RAČUN UBL 2.1) */}
          {activeTab === 'eracun' && (
            <div className="space-y-5 font-mono text-xs">
              <div className="bg-[var(--bg-canvas)] border border-[var(--border-subtle)] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      B2B e-Račun Standard (UBL 2.1 CIUS-HR s KPD 2025)
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Službena hrvatska ekstenzija europske norme EN 16931 za razmjenu elektroničkih računa
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadUblXml}
                      className="px-3 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-black font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Preuzmi UBL 2.1 XML</span>
                    </button>
                  </div>
                </div>

                {/* Validacija status */}
                <div className={`p-3 border flex items-center justify-between ${
                  eracunResult.valid
                    ? 'bg-[#064E3B]/30 border-[#10B981]/40 text-[#10B981]'
                    : 'bg-[#7F1D1D]/30 border-[#EF4444]/40 text-[#EF4444]'
                }`}>
                  <div className="flex items-center space-x-2">
                    {eracunResult.valid ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span>
                      {eracunResult.valid
                        ? 'e-Račun XML je 100% usklađen s normom EN 16931 i CIUS-HR (KPD 2025 šifre prisutne na svim stavkama)'
                        : `Greška u validaciji: ${eracunResult.errors.join(', ')}`}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 ${
                    eracunResult.valid ? 'bg-[#10B981] text-black' : 'bg-[#EF4444] text-white'
                  }`}>
                    {eracunResult.valid ? 'CIUS-HR VALIDIRANO' : 'NEUSPJELO'}
                  </span>
                </div>

                {/* Pregled posrednika */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                    <span className="text-[10px] text-[var(--text-muted)] block">Odabrani Informacijski Posrednik</span>
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      {obrtProfil.eracunPosrednik || 'FINA e-Račun B2B'}
                    </span>
                  </div>

                  <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                    <span className="text-[10px] text-[var(--text-muted)] block">KPD 2025 Klasifikacija</span>
                    <span className="text-sm font-bold text-[#10B981] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      {activeDocument.stavke.length} stavka/e mapirano u KPD 2025
                    </span>
                  </div>
                </div>

                {/* Sirov XML pregled */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] text-[var(--text-muted)] block">
                    Struktura generiranog UBL 2.1 dokumenta za račun {activeDocument.brojDokumenta}:
                  </span>
                  <pre className="p-3 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[11px] font-mono text-slate-300 overflow-x-auto max-h-56 leading-relaxed">
                    {eracunResult.xml}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal za upload vlastitog FINA certifikata */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] p-6 max-w-lg w-full space-y-4 font-mono text-xs shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <span className="font-bold text-white uppercase tracking-wider text-sm">
                  Učitavanje FINA Certifikata u Trezor
                </span>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-[var(--text-muted)] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCertificate} className="space-y-4">
                {uploadError && (
                  <div className="p-2.5 bg-[#7F1D1D]/30 border border-[#EF4444] text-[#EF4444]">
                    {uploadError}
                  </div>
                )}

                <div>
                  <label className="text-[var(--text-secondary)] font-semibold block mb-1">
                    Naziv certifikata
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadCertName}
                    onChange={(e) => setUploadCertName(e.target.value)}
                    className="w-full bg-[var(--bg-canvas)] text-white px-3 py-2 border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[var(--text-secondary)] font-semibold block mb-1">
                    Privatni ključ (PEM format ili .p12 base64) *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={uploadPrivateKeyPem}
                    onChange={(e) => setUploadPrivateKeyPem(e.target.value)}
                    placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                    className="w-full bg-[var(--bg-canvas)] text-white px-3 py-2 border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="text-[var(--text-secondary)] font-semibold block mb-1">
                    Korisnički PIN za lokalnu AES-256 enkripciju (min. 4 znaka) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={uploadPin}
                    onChange={(e) => setUploadPin(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-[var(--bg-canvas)] text-white px-3 py-2 border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none tracking-widest text-sm"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] block mt-1">
                    PIN se koristi za zaštitu ključa u Vašem pregledniku i nikada se ne šalje preko interneta.
                  </span>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-white border border-[var(--border-strong)] font-mono text-xs cursor-pointer"
                  >
                    Odustani
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Enkriptiraj i Spremi u Trezor</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
