import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Partner, Artikl } from '@obrtniq/core';
import type { FormItem } from './engine/types';
import { AppHeader } from './components/layout/AppHeader';
import { StartHubModal } from './components/layout/StartHubModal';
import { MobileTabSwitcher } from './components/layout/MobileTabSwitcher';
import { AppFooter } from './components/layout/AppFooter';
import { InvoiceDesk } from './components/desk/InvoiceDesk';
import { InvoiceLivePreview } from './components/InvoiceLivePreview';
import { AppDrawers } from './components/drawers/AppDrawers';
import { BookkeepingWorkspaceView } from './components/bookkeeping/BookkeepingWorkspaceView';
import { SettingsWorkspaceView } from './components/settings/SettingsWorkspaceView';
import { DocumentWorkspaceView } from './components/desk/DocumentWorkspaceView';
import { FiscalWorkspaceView } from './components/desk/FiscalWorkspaceView';
import { ArticleWorkspaceView } from './components/desk/ArticleWorkspaceView';
import { PartnerWorkspaceView } from './components/desk/PartnerWorkspaceView';
import { SystemLogWorkspaceView } from './components/desk/SystemLogWorkspaceView';
import { DocumentationWorkspaceView } from './components/desk/DocumentationWorkspaceView';
import { buildFiscalDrawerDocument, buildFiscalPartnerSnapshot } from './engine/invoice-mapper';
import { useWorkspaceRouter } from './hooks/useWorkspaceRouter';
import { useAppStats } from './hooks/useAppStats';
import { useAppDrawers } from './hooks/useAppDrawers';
import { useInvoiceForm } from './hooks/useInvoiceForm';
import { useInvoiceItems } from './hooks/useInvoiceItems';
import { useInvoiceWorkflow } from './hooks/useInvoiceWorkflow';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useObrtProfile } from './hooks/useObrtProfile';
import { usePartners } from './hooks/usePartners';
import { useArticles } from './hooks/useArticles';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import { useGoogleDriveSync } from './hooks/useGoogleDriveSync';
import { useGeminiAssistant } from './hooks/useGeminiAssistant';
import { useZigoAgent } from './hooks/useZigoAgent';
import { useLiveScreenContext } from './hooks/useLiveScreenContext';
import { FloatingZigoWidget } from './components/FloatingZigoWidget';
import { ZigoChatDrawer } from './components/ZigoChatDrawer';
import { ZigoCopilotPanel } from './components/ZigoCopilotPanel';
import { getZigoThinkingPhrase } from './services/zigo-context-builder';
import { appLogger } from './services/logger';
import { onAutoOpenTriggered } from './services/global-error-trap';
import { useDynamicFavicon } from './hooks/useDynamicFavicon';
import { useTheme } from './hooks/useTheme';
import { OnboardingWizardModal } from './components/onboarding/OnboardingWizardModal';
import { useOnboardingWizard } from './hooks/useOnboardingWizard';
import type { ActiveScreenView } from './types/zigo-context';

export default function App() {
  // 0. Dinamički SVG Favicon u tabu preglednika sinkroniziran s temom (Faza 12)
  useDynamicFavicon();

  // 0.5. Modularni Workspace Router (Faza 19)
  const router = useWorkspaceRouter();

  // 1. Aplikacijski engine, profili i hooks
  const { selectPreset } = useTheme();
  const stats = useAppStats();
  const drawers = useAppDrawers();
  const form = useInvoiceForm();
  const items = useInvoiceItems();
  const obrtProfileHook = useObrtProfile();
  const onboardingWizard = useOnboardingWizard(
    obrtProfileHook.profil,
    obrtProfileHook.saveProfil
  );
  const partnersHook = usePartners();
  const articlesHook = useArticles();
  const googleAuthHook = useGoogleAuth();
  const driveSyncHook = useGoogleDriveSync(
    googleAuthHook.identity,
    googleAuthHook.getAccessToken,
    googleAuthHook.refreshAccessToken
  );
  const geminiHook = useGeminiAssistant();

  const workflow = useInvoiceWorkflow({
    form,
    items,
    onStatsUpdate: stats.refreshAll,
  });

  // Mapiranje trenutnog ekrana za Žigo Copilot
  const activeScreenView: ActiveScreenView = useMemo(() => {
    switch (router.activeView) {
      case 'bookkeeping': return 'KprDrawer';
      case 'settings': return 'SettingsDrawer';
      case 'documents': return 'DocumentDrawer';
      case 'fiscal': return 'FiscalDrawer';
      case 'articles': return 'ArticleDrawer';
      case 'partners': return 'PartnerDrawer';
      case 'logs': return 'SystemLogDrawer';
      case 'docs': return 'DocumentationDrawer';
      default: return 'InvoiceDesk';
    }
  }, [router.activeView]);

  // 1.5. Sustav svjesnosti stanja ekrana u stvarnom vremenu (Omni-Context Bus za Žiga)
  const liveScreenContext = useLiveScreenContext({
    activeScreen: activeScreenView,
    openDrawers: {
      isKprDrawerOpen: drawers.isKprDrawerOpen || router.activeView === 'bookkeeping',
      isSettingsDrawerOpen: drawers.isSettingsDrawerOpen || router.activeView === 'settings',
      isLogDrawerOpen: drawers.isLogDrawerOpen || router.activeView === 'logs',
      isFiscalDrawerOpen: drawers.isFiscalDrawerOpen || router.activeView === 'fiscal',
      isPartnerDrawerOpen: drawers.isPartnerDrawerOpen || router.activeView === 'partners',
      isArticleDrawerOpen: drawers.isArticleDrawerOpen || router.activeView === 'articles',
      isDocDrawerOpen: drawers.isDocDrawerOpen || router.activeView === 'documents',
    },
    form: {
      partnerNaziv: form.partnerNaziv,
      oib: form.oib,
      isOibValid: form.isOibValid,
      iban: form.iban,
      isIbanValid: form.isIbanValid,
      taxZone: form.taxZone,
      nacinPlacanja: form.nacinPlacanja,
      datumIzdavanja: workflow.datumIzdavanja,
      datumDospijeca: workflow.datumDospijeca,
      datumIsporuke: workflow.datumIsporuke,
    },
    items: {
      items: items.items,
      ukupniIznos: items.ukupniIznos,
    },
    workflow: {
      docType: workflow.docType,
      docStatus: workflow.docStatus,
      brojDokumenta: workflow.brojDokumenta,
    },
    stats: {
      kprTotalEur: stats.totalKprNaplaceno,
    },
    googleAuth: {
      isAuthenticated: googleAuthHook.isAuthenticated,
      identity: googleAuthHook.identity,
    },
    geminiAssistant: {
      model: geminiHook.model,
      hasKey: !!geminiHook.apiKey,
    },
  });

  // Autonomni klijentski agent: Žigo (Digitalni Orlando)
  const zigoAgent = useZigoAgent({
    liveContext: liveScreenContext.snapshot,
    toolsContext: {
      form: {
        partnerNaziv: form.partnerNaziv,
        setPartnerNaziv: form.setPartnerNaziv,
        oib: form.oib,
        setOib: form.setOib,
        setIsOibValid: form.setIsOibValid,
        taxZone: form.taxZone,
        setTaxZone: form.setTaxZone,
        iban: form.iban,
        setIban: form.setIban,
        setIsIbanValid: form.setIsIbanValid,
      },
      items: {
        items: items.items,
        setItems: items.setItems,
        addItem: items.addItem,
        resetItems: items.resetItems,
        ukupniIznos: items.ukupniIznos,
      },
      workflow: {
        docType: workflow.docType,
        docStatus: workflow.docStatus,
        isLocked: workflow.isLocked,
        isFormSubmittable: workflow.isFormSubmittable,
        handleIssueDocument: workflow.handleIssueDocument,
        handleStorno: workflow.handleStorno,
        datumIzdavanja: workflow.datumIzdavanja,
        setDatumIzdavanja: workflow.setDatumIzdavanja,
        datumDospijeca: workflow.datumDospijeca,
        setDatumDospijeca: workflow.setDatumDospijeca,
        datumIsporuke: workflow.datumIsporuke,
        setDatumIsporuke: workflow.setDatumIsporuke,
      },
      drawers: {
        setIsKprDrawerOpen: drawers.setIsKprDrawerOpen,
        setIsDocDrawerOpen: drawers.setIsDocDrawerOpen,
        setIsArticleDrawerOpen: drawers.setIsArticleDrawerOpen,
      },
      refreshStats: stats.refreshAll,
    },
  });


  // Inicijalna telemetrija montiranja radne površine
  useEffect(() => {
    appLogger.scope('APP:READY').info('Glavno sučelje ObrtnIQ spremno za rad', {
      modul: 'InvoiceDesk',
      fiskalizacijaUBL: '2.1',
    });
  }, []);

  // Automatsko iskakanje donje konzole u slučaju neobrađene greške (kada je uključeno u postavkama dnevnika)
  useEffect(() => {
    return onAutoOpenTriggered(() => {
      drawers.setIsLogDrawerOpen(true);
    });
  }, [drawers.setIsLogDrawerOpen]);

  const [mobileTab, setMobileTab] = useState<'desk' | 'preview'>('desk');
  const [isStartHubOpen, setIsStartHubOpen] = useState(false);

  // Preklapanje stanja dnevnika: ako je otvoren puni prikaz, vraća na radnu plohu, inače podiže donju konzolu
  const handleToggleLogDrawer = useCallback(() => {
    if (router.activeView === 'logs') {
      router.navigateHome();
    } else {
      drawers.toggleLogDrawer();
    }
  }, [router, drawers]);

  // 2. Tipkovnički prečaci (F2 = Izdaj, Alt+N = Nova stavka, Alt+1..8 = Otoci navigacije, Alt+9/L = Dnevnik, Alt+Z = Žigo, Alt+S / Ctrl+K = Start Hub)
  useKeyboardShortcuts({
    onIssue: workflow.handleIssueDocument,
    onAddItem: items.addItem,
    isSubmittable: workflow.isFormSubmittable,
    isLocked: workflow.isLocked,
    onNavigateHome: router.navigateHome,
    isHome: router.isHome,
    onOpenStartHub: () => setIsStartHubOpen(prev => !prev),
    onOpenDocs: () => router.navigateTo('documents'),
    onOpenKpr: () => router.navigateTo('bookkeeping'),
    onOpenPartners: () => router.navigateTo('partners'),
    onOpenArticles: () => router.navigateTo('articles'),
    onOpenFiscal: () => router.navigateTo('fiscal'),
    onOpenSettings: () => router.navigateTo('settings'),
    onOpenDocumentation: () => router.navigateTo('docs'),
    onOpenLogs: () => router.navigateTo('logs'),
    onToggleLogDrawer: handleToggleLogDrawer,
    onOpenZigo: zigoAgent.toggleDrawer,
  });

  // 3. Odabir partnera iz adresara
  const handleSelectPartner = (partner: Partner) => {
    form.setPartnerNaziv(partner.naziv);
    if (partner.oib) {
      form.setOib(partner.oib);
      form.setIsOibValid(true);
    }
    form.setTaxZone(partner.poreznaZona);
    if (!router.isHome) {
      router.navigateHome();
    }
  };

  // 4. Odabir artikla/usluge iz cjenika
  const handleSelectArticle = (artikl: Artikl) => {
    items.addArticleItem(artikl);
    drawers.setIsArticleDrawerOpen(false);
    if (!router.isHome) {
      router.navigateHome();
    }
  };

  // 5. Spremanje stavke s računa u cjenik
  const handleSaveItemToCatalog = async (item: FormItem) => {
    await articlesHook.addArtikl({
      naziv: item.kpdNaziv || 'Nova usluga/artikl',
      kpdSifra: item.kpdSifra || '62.01.11',
      jedinicaMjere: item.jedinicaMjere || 'kom',
      cijenaOsnovica: item.cijena,
      stopaPdv: 0,
      pdvKategorijaPoreza: 'E',
      jeUsluga: true,
      aktivan: true,
    });
    alert(`Stavka "${item.kpdNaziv}" uspješno je spremljena u cjenik!`);
  };

  const currentObrt = obrtProfileHook.profil;

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-white flex flex-col font-sans transition-colors duration-200">
      {/* Top Precision Header & Dynamic Prag Widget */}
      <AppHeader
        activeView={router.activeView}
        onNavigateHome={router.navigateHome}
        onOpenStartHub={() => setIsStartHubOpen(true)}
        totalSavedDocs={stats.totalSavedDocs}
        totalKprNaplaceno={stats.totalKprNaplaceno}
        onOpenDocs={() => router.navigateTo('documents')}
        onOpenKpr={() => router.navigateTo('bookkeeping')}
        onOpenFiscal={() => router.navigateTo('fiscal')}
        onOpenSettings={() => router.navigateTo('settings')}
        onOpenPartners={() => router.navigateTo('partners')}
        onOpenArticles={() => router.navigateTo('articles')}
        onOpenLogs={() => router.navigateTo('logs')}
        onToggleLogDrawer={handleToggleLogDrawer}
        onOpenZigo={zigoAgent.toggleDrawer}
        googleIdentity={googleAuthHook.identity}
        cloudSyncStatus={driveSyncHook.syncStatus}
        lastSyncTime={driveSyncHook.lastSyncTime}
        onSyncClick={() => {
          if (!googleAuthHook.isAuthenticated) {
            router.navigateTo('settings');
          } else {
            driveSyncHook.syncToDrive();
          }
        }}
      />

      {/* Main Content Area - Full Width Split-Screen Desk or In-Place Workspace Views */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {router.activeView === 'home' && (
          <>
            {/* Mobile View Tab Switcher (< xl screens) */}
            <MobileTabSwitcher
              activeTab={mobileTab}
              onChange={setMobileTab}
            />

            {/* Workspace: Full-Width Split-Screen Layout with optional Docked Copilot */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start">
              {/* Radna Ploha Unosa (Input Desk) */}
              <div className={zigoAgent.isDocked ? 'xl:col-span-5' : 'xl:col-span-7'}>
                <InvoiceDesk
                  className={mobileTab === 'preview' ? 'hidden xl:block' : 'block'}
                  form={form}
                  items={items}
                  workflow={workflow}
                  onOpenAddressBook={() => router.navigateTo('partners')}
                  onOpenArticleCatalog={() => router.navigateTo('articles')}
                  onSaveItemToCatalog={handleSaveItemToCatalog}
                  geminiAssistant={geminiHook}
                />
              </div>

              {/* Živi A4 Real-Time Preview */}
              <div
                className={`printable-invoice-wrapper ${
                  zigoAgent.isDocked ? 'xl:col-span-4' : 'xl:col-span-5'
                } bg-[var(--bg-surface)] border border-[var(--border-strong)] p-5 space-y-4 sticky top-20 shadow-xl transition-colors ${
                  mobileTab === 'desk' ? 'hidden xl:block' : 'block'
                }`}
              >
                <InvoiceLivePreview
                  obrtNaziv={currentObrt.naziv}
                  obrtVlasnik={currentObrt.vlasnikImePrezime}
                  obrtOib={currentObrt.oib}
                  obrtIban={form.iban || currentObrt.iban}
                  obrtBanka={form.detectedBank || currentObrt.bankaNaziv}
                  obrtAdresa={`${currentObrt.ulicaIBroj}, ${currentObrt.mjesto}`}
                  logoImageData={currentObrt.logoImageData}
                  pecatPotpisImageData={currentObrt.pecatPotpisImageData}
                  partnerNaziv={form.partnerNaziv}
                  partnerOib={form.oib}
                  isPartnerOibValid={form.isOibValid}
                  vrstaDokumenta={workflow.docType}
                  statusDokumenta={workflow.docStatus}
                  brojDokumenta={workflow.brojDokumenta}
                  datumIzdavanja={workflow.datumIzdavanja}
                  datumIsporuke={workflow.datumIsporuke}
                  datumDospijeca={workflow.datumDospijeca}
                  nacinPlacanja={form.nacinPlacanja}
                  taxZone={form.taxZone}
                  items={items.previewItems}
                  zki={workflow.zki}
                  jir={workflow.jir}
                  fiskalniQrUrl={workflow.fiskalniQrUrl}
                  fiskalizacijaStatus={workflow.fiskalizacijaStatus}
                />
              </div>

              {/* 3. Usidreni Sidecar Copilot (Docked Companion Mode) */}
              {zigoAgent.isDocked && (
                <div className="hidden xl:block xl:col-span-3 sticky top-20 h-[calc(100vh-140px)] shadow-2xl border border-[#b89758]/50 overflow-hidden">
                  <ZigoCopilotPanel
                    agent={zigoAgent}
                    liveContext={liveScreenContext}
                    isDocked={true}
                    onToggleDock={zigoAgent.toggleDock}
                    onClose={() => zigoAgent.setIsDocked(false)}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Modular Workspace In-Place Views (Bez zamagljenja, puna širina) */}
        {router.activeView === 'bookkeeping' && (
          <BookkeepingWorkspaceView
            obrtOib={currentObrt.oib}
            obrtNaziv={currentObrt.naziv}
            obrtVlasnik={currentObrt.vlasnikImePrezime}
            obrtAdresa={`${currentObrt.ulicaIBroj}, ${currentObrt.mjesto}`}
            onKprUpdated={stats.refreshKprTotal}
            onNavigateHome={router.navigateHome}
          />
        )}

        {router.activeView === 'settings' && (
          <SettingsWorkspaceView
            obrtProfileHook={obrtProfileHook}
            googleAuthHook={googleAuthHook}
            driveSyncHook={driveSyncHook}
            geminiHook={geminiHook}
            onNavigateHome={router.navigateHome}
            onToggleLogDrawer={drawers.toggleLogDrawer}
            isLogDrawerOpen={drawers.isLogDrawerOpen}
          />
        )}

        {router.activeView === 'documents' && (
          <DocumentWorkspaceView
            activeDocumentId={workflow.docId}
            onSelectDocument={workflow.handleSelectDocument}
            onNewDocument={workflow.handleNewDocument}
            onNavigateHome={router.navigateHome}
          />
        )}

        {router.activeView === 'fiscal' && (
          <FiscalWorkspaceView
            activeDocument={buildFiscalDrawerDocument({
              docId: workflow.docId,
              docType: workflow.docType,
              docStatus: workflow.docStatus,
              brojDokumenta: workflow.brojDokumenta,
              partnerNaziv: form.partnerNaziv,
              oib: form.oib,
              iban: form.iban,
              datumIzdavanja: workflow.datumIzdavanja,
              datumDospijeca: workflow.datumDospijeca,
              datumIsporuke: workflow.datumIsporuke,
              nacinPlacanja: form.nacinPlacanja,
              items: items.items,
              ukupniIznos: items.ukupniIznos,
              zki: workflow.zki,
              jir: workflow.jir,
              fiskalniQrUrl: workflow.fiskalniQrUrl,
              fiskalizacijaStatus: workflow.fiskalizacijaStatus,
            })}
            obrtProfil={currentObrt}
            activePartner={buildFiscalPartnerSnapshot(form.partnerData)}
            onDocumentUpdated={workflow.handleFiscalUpdated}
            onNavigateHome={router.navigateHome}
          />
        )}

        {router.activeView === 'articles' && (
          <ArticleWorkspaceView
            articlesHook={articlesHook}
            onSelectArticle={handleSelectArticle}
            onNavigateHome={router.navigateHome}
          />
        )}

        {router.activeView === 'partners' && (
          <PartnerWorkspaceView
            partnersHook={partnersHook}
            onSelectPartner={handleSelectPartner}
            onNavigateHome={router.navigateHome}
          />
        )}

        {router.activeView === 'logs' && (
          <SystemLogWorkspaceView
            onNavigateHome={router.navigateHome}
          />
        )}

        {router.activeView === 'docs' && (
          <DocumentationWorkspaceView
            onNavigateHome={router.navigateHome}
          />
        )}
      </main>

      {/* Precision Footer with Live System Log Trigger & Docs Trigger */}
      <AppFooter
        onToggleLogDrawer={handleToggleLogDrawer}
        isLogDrawerOpen={drawers.isLogDrawerOpen || router.activeView === 'logs'}
        onOpenDocs={() => router.navigateTo('docs')}
      />

      {/* All Drawers (Log, Documents, KPR & PO-SD, Fiscalization, Settings, Partners, Articles) */}
      <AppDrawers
        drawers={drawers}
        workflow={workflow}
        form={form}
        items={items}
        stats={stats}
        obrtProfileHook={obrtProfileHook}
        partnersHook={partnersHook}
        articlesHook={articlesHook}
        googleAuthHook={googleAuthHook}
        driveSyncHook={driveSyncHook}
        geminiHook={geminiHook}
        onSelectPartner={handleSelectPartner}
        onSelectArticle={handleSelectArticle}
        onOpenFullLogs={() => router.navigateTo('logs')}
      />

      {/* Plutajući amblem: Digitalni Orlando (Žigo) i ladica za razgovor */}
      <FloatingZigoWidget
        isThinking={zigoAgent.isThinking}
        thinkingText={getZigoThinkingPhrase(liveScreenContext.snapshot)}
        isOpen={zigoAgent.isDrawerOpen}
        isDocked={zigoAgent.isDocked}
        onClick={zigoAgent.toggleDrawer}
        onQuickRez={zigoAgent.aktivirajRez}
      />

      <ZigoChatDrawer agent={zigoAgent} liveContext={liveScreenContext} />

      {/* Središnji Start Hub Modal (Zapovjedno Središte ObrtnIQ) */}
      <StartHubModal
        isOpen={isStartHubOpen}
        onClose={() => setIsStartHubOpen(false)}
        onNavigate={router.navigateTo}
        onNewInvoice={() => {
          workflow.handleNewDocument('RACUN');
          router.navigateHome();
        }}
        onOpenZigo={zigoAgent.toggleDrawer}
        onOpenOnboarding={onboardingWizard.openWizard}
        totalKprNaplaceno={stats.totalKprNaplaceno}
        totalSavedDocs={stats.totalSavedDocs}
        obrtNaziv={currentObrt.naziv}
        obrtOib={currentObrt.oib}
      />

      {/* Onboarding Čarobnjak: Upoznaj Žiga Gospara (Od treme do prvog reza) */}
      <OnboardingWizardModal
        wizard={onboardingWizard}
        onThemeSelect={(themeKey) => selectPreset(themeKey as any)}
        onIssueFirstInvoice={() => {
          workflow.handleNewDocument('RACUN');
          router.navigateHome();
        }}
      />
    </div>
  );
}
