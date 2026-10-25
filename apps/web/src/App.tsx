import { useState, useEffect } from 'react';
import type { Partner, Artikl } from '@obrtniq/core';
import type { FormItem } from './engine/types';
import { AppHeader } from './components/layout/AppHeader';
import { HeroBanner } from './components/layout/HeroBanner';
import { PhaseOverviewGrid } from './components/layout/PhaseOverviewGrid';
import { MobileTabSwitcher } from './components/layout/MobileTabSwitcher';
import { ManifestReferenceCard } from './components/layout/ManifestReferenceCard';
import { AppFooter } from './components/layout/AppFooter';
import { InvoiceDesk } from './components/desk/InvoiceDesk';
import { InvoiceLivePreview } from './components/InvoiceLivePreview';
import { AppDrawers } from './components/drawers/AppDrawers';
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
import { onAutoOpenTriggered } from './services/global-error-trap';
import { appLogger } from './services/logger';
import { useDynamicFavicon } from './hooks/useDynamicFavicon';

export default function App() {
  // 0. Dinamički SVG Favicon u tabu preglednika sinkroniziran s temom (Faza 12)
  useDynamicFavicon();

  // 1. Aplikacijski engine, profili i hooks
  const stats = useAppStats();
  const drawers = useAppDrawers();
  const form = useInvoiceForm();
  const items = useInvoiceItems();
  const obrtProfileHook = useObrtProfile();
  const partnersHook = usePartners();
  const articlesHook = useArticles();
  const googleAuthHook = useGoogleAuth();
  const driveSyncHook = useGoogleDriveSync(googleAuthHook.identity, googleAuthHook.getAccessToken);
  const geminiHook = useGeminiAssistant();

  const workflow = useInvoiceWorkflow({
    form,
    items,
    onStatsUpdate: stats.refreshAll,
  });

  // 1.5. Sustav svjesnosti stanja ekrana u stvarnom vremenu (Omni-Context Bus za Žiga)
  const liveScreenContext = useLiveScreenContext({
    openDrawers: {
      isKprDrawerOpen: drawers.isKprDrawerOpen,
      isSettingsDrawerOpen: drawers.isSettingsDrawerOpen,
      isLogDrawerOpen: drawers.isLogDrawerOpen,
      isFiscalDrawerOpen: drawers.isFiscalDrawerOpen,
      isPartnerDrawerOpen: drawers.isPartnerDrawerOpen,
      isArticleDrawerOpen: drawers.isArticleDrawerOpen,
      isDocDrawerOpen: drawers.isDocDrawerOpen,
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

  // Automatsko otvaranje dnevnika grešaka na pojavu ERROR razine (Faza 10.5)
  useEffect(() => {
    return onAutoOpenTriggered(() => {
      drawers.setIsLogDrawerOpen(true);
    });
  }, [drawers.setIsLogDrawerOpen]);

  // Inicijalna telemetrija montiranja radne površine
  useEffect(() => {
    appLogger.scope('APP:READY').info('Glavno sučelje ObrtnIQ spremno za rad', {
      modul: 'InvoiceDesk',
      fiskalizacijaUBL: '2.1',
    });
  }, []);

  const [mobileTab, setMobileTab] = useState<'desk' | 'preview'>('desk');

  // 2. Tipkovnički prečaci (F2 = Izdaj, Alt+N = Nova stavka)
  useKeyboardShortcuts({
    onIssue: workflow.handleIssueDocument,
    onAddItem: items.addItem,
    isSubmittable: workflow.isFormSubmittable,
    isLocked: workflow.isLocked,
  });

  // 3. Odabir partnera iz adresara
  const handleSelectPartner = (partner: Partner) => {
    form.setPartnerNaziv(partner.naziv);
    if (partner.oib) {
      form.setOib(partner.oib);
      form.setIsOibValid(true);
    }
    form.setTaxZone(partner.poreznaZona);
  };

  // 4. Odabir artikla/usluge iz cjenika
  const handleSelectArticle = (artikl: Artikl) => {
    items.addArticleItem(artikl);
    drawers.setIsArticleDrawerOpen(false);
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
        totalSavedDocs={stats.totalSavedDocs}
        totalKprNaplaceno={stats.totalKprNaplaceno}
        onOpenDocs={() => drawers.setIsDocDrawerOpen(true)}
        onOpenKpr={() => drawers.setIsKprDrawerOpen(true)}
        onOpenFiscal={() => drawers.setIsFiscalDrawerOpen(true)}
        onOpenSettings={() => drawers.setIsSettingsDrawerOpen(true)}
        onOpenPartners={() => drawers.setIsPartnerDrawerOpen(true)}
        onOpenArticles={() => drawers.setIsArticleDrawerOpen(true)}
        onOpenZigo={zigoAgent.toggleDrawer}
        googleIdentity={googleAuthHook.identity}
        cloudSyncStatus={driveSyncHook.syncStatus}
        lastSyncTime={driveSyncHook.lastSyncTime}
        onSyncClick={() => {
          if (!googleAuthHook.isAuthenticated) {
            drawers.setIsSettingsDrawerOpen(true);
          } else {
            driveSyncHook.syncToDrive();
          }
        }}
      />

      {/* Main Content Area - Full Width Split-Screen Desk */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Alert Banner s immutability statusom */}
        <HeroBanner
          docType={workflow.docType}
          brojDokumenta={workflow.brojDokumenta}
          docStatus={workflow.docStatus}
          isLocked={workflow.isLocked}
        />

        {/* Phase Grid Overview (Faza 0-2 do Faza 7) */}
        <PhaseOverviewGrid />

        {/* Mobile View Tab Switcher (< xl screens) */}
        <MobileTabSwitcher
          activeTab={mobileTab}
          onChange={setMobileTab}
        />

        {/* Workspace: Full-Width Split-Screen Layout with optional Docked Copilot (Edge Copilot / Gemini in Workspace style) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start">
          {/* Radna Ploha Unosa (Input Desk) */}
          <div className={zigoAgent.isDocked ? 'xl:col-span-5' : 'xl:col-span-7'}>
            <InvoiceDesk
              className={mobileTab === 'preview' ? 'hidden xl:block' : 'block'}
              form={form}
              items={items}
              workflow={workflow}
              onOpenAddressBook={() => drawers.setIsPartnerDrawerOpen(true)}
              onOpenArticleCatalog={() => drawers.setIsArticleDrawerOpen(true)}
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

        {/* Documentation & Manifest Reference */}
        <ManifestReferenceCard />
      </main>

      {/* Precision Footer with Live System Log Trigger */}
      <AppFooter onToggleLogDrawer={drawers.toggleLogDrawer} />

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
      />

      {/* Plutajući amblem: Digitalni Orlando (Žigo) i ladica za razgovor */}
      <FloatingZigoWidget
        isThinking={zigoAgent.isThinking}
        isOpen={zigoAgent.isDrawerOpen}
        isDocked={zigoAgent.isDocked}
        onClick={zigoAgent.toggleDrawer}
        onQuickRez={zigoAgent.aktivirajRez}
      />

      <ZigoChatDrawer agent={zigoAgent} liveContext={liveScreenContext} />
    </div>
  );
}
