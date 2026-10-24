import { useState } from 'react';
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

export default function App() {
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

        {/* Workspace: Full-Width Split-Screen Layout (58% Input Desk / 42% Live Invoice Preview) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start">
          {/* Radna Ploha Unosa (Input Desk - 58%) */}
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

          {/* Živi A4 Real-Time Preview (42%) */}
          <div
            className={`printable-invoice-wrapper xl:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-strong)] p-5 space-y-4 sticky top-20 shadow-xl transition-colors ${
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
    </div>
  );
}
