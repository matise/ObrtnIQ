import { useState } from 'react';
import { AppHeader } from './components/layout/AppHeader';
import { HeroBanner } from './components/layout/HeroBanner';
import { PhaseOverviewGrid } from './components/layout/PhaseOverviewGrid';
import { MobileTabSwitcher } from './components/layout/MobileTabSwitcher';
import { ManifestReferenceCard } from './components/layout/ManifestReferenceCard';
import { AppFooter } from './components/layout/AppFooter';
import { InvoiceDesk } from './components/desk/InvoiceDesk';
import { InvoiceLivePreview } from './components/InvoiceLivePreview';
import { AppDrawers } from './components/drawers/AppDrawers';
import { DEFAULT_OBRT_PROFIL } from './engine/obrt-profile';
import { useAppStats } from './hooks/useAppStats';
import { useAppDrawers } from './hooks/useAppDrawers';
import { useInvoiceForm } from './hooks/useInvoiceForm';
import { useInvoiceItems } from './hooks/useInvoiceItems';
import { useInvoiceWorkflow } from './hooks/useInvoiceWorkflow';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
  // 1. Aplikacijski engine i hooks
  const stats = useAppStats();
  const drawers = useAppDrawers();
  const form = useInvoiceForm();
  const items = useInvoiceItems();
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

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-white flex flex-col font-sans transition-colors duration-200">
      {/* Top Precision Header & Dynamic Prag Widget */}
      <AppHeader
        totalSavedDocs={stats.totalSavedDocs}
        totalKprNaplaceno={stats.totalKprNaplaceno}
        onOpenDocs={() => drawers.setIsDocDrawerOpen(true)}
        onOpenKpr={() => drawers.setIsKprDrawerOpen(true)}
        onOpenFiscal={() => drawers.setIsFiscalDrawerOpen(true)}
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
          />

          {/* Živi A4 Real-Time Preview (42%) */}
          <div
            className={`xl:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-strong)] p-5 space-y-4 sticky top-20 shadow-xl transition-colors ${
              mobileTab === 'desk' ? 'hidden xl:block' : 'block'
            }`}
          >
            <InvoiceLivePreview
              obrtNaziv={DEFAULT_OBRT_PROFIL.naziv}
              obrtVlasnik={DEFAULT_OBRT_PROFIL.vlasnikImePrezime}
              obrtOib={DEFAULT_OBRT_PROFIL.oib}
              obrtIban={form.iban}
              obrtBanka={form.detectedBank}
              obrtAdresa={`${DEFAULT_OBRT_PROFIL.ulicaIBroj}, ${DEFAULT_OBRT_PROFIL.mjesto}`}
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

      {/* All Drawers (Log, Documents, KPR & PO-SD, Fiscalization) */}
      <AppDrawers
        drawers={drawers}
        workflow={workflow}
        form={form}
        items={items}
        stats={stats}
      />
    </div>
  );
}
