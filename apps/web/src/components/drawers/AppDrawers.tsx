import React from 'react';
import type { Partner, Artikl } from '@obrtniq/core';
import { SystemLogDrawer } from '../SystemLogDrawer';
import { DocumentDrawer } from '../DocumentDrawer';
import { KprDrawer } from '../KprDrawer';
import { FiscalDrawer } from '../FiscalDrawer';
import { SettingsDrawer } from '../SettingsDrawer';
import { PartnerDrawer } from '../PartnerDrawer';
import { ArticleDrawer } from '../ArticleDrawer';
import { buildFiscalDrawerDocument, buildFiscalPartnerSnapshot } from '../../engine/invoice-mapper';
import type { UseAppDrawersReturn } from '../../hooks/useAppDrawers';
import type { UseInvoiceWorkflowReturn } from '../../hooks/useInvoiceWorkflow';
import type { UseInvoiceFormReturn } from '../../hooks/useInvoiceForm';
import type { UseInvoiceItemsReturn } from '../../hooks/useInvoiceItems';
import type { UseAppStatsReturn } from '../../hooks/useAppStats';
import type { UseObrtProfileReturn } from '../../hooks/useObrtProfile';
import type { UsePartnersReturn } from '../../hooks/usePartners';
import type { UseArticlesReturn } from '../../hooks/useArticles';

import type { UseGoogleAuthReturn } from '../../hooks/useGoogleAuth';
import type { UseGoogleDriveSyncReturn } from '../../hooks/useGoogleDriveSync';
import type { UseGeminiAssistantReturn } from '../../hooks/useGeminiAssistant';

export interface AppDrawersProps {
  drawers: UseAppDrawersReturn;
  workflow: UseInvoiceWorkflowReturn;
  form: UseInvoiceFormReturn;
  items: UseInvoiceItemsReturn;
  stats: UseAppStatsReturn;
  obrtProfileHook: UseObrtProfileReturn;
  partnersHook: UsePartnersReturn;
  articlesHook: UseArticlesReturn;
  googleAuthHook?: UseGoogleAuthReturn;
  driveSyncHook?: UseGoogleDriveSyncReturn;
  geminiHook?: UseGeminiAssistantReturn;
  onSelectPartner: (partner: Partner) => void;
  onSelectArticle?: (artikl: Artikl) => void;
}

export const AppDrawers: React.FC<AppDrawersProps> = ({
  drawers,
  workflow,
  form,
  items,
  stats,
  obrtProfileHook,
  partnersHook,
  articlesHook,
  googleAuthHook,
  driveSyncHook,
  geminiHook,
  onSelectPartner,
  onSelectArticle,
}) => {
  const currentObrt = obrtProfileHook.profil;

  const activeDocument = buildFiscalDrawerDocument({
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
  });

  const activePartner = buildFiscalPartnerSnapshot(form.partnerData);

  return (
    <>
      {/* 1. Sustavni Dnevnik (Log Console) */}
      <SystemLogDrawer
        isOpen={drawers.isLogDrawerOpen}
        onClose={() => drawers.setIsLogDrawerOpen(false)}
      />

      {/* 2. Preglednik Povijesti Dokumenata (Dexie.js IndexedDB) */}
      <DocumentDrawer
        isOpen={drawers.isDocDrawerOpen}
        onClose={() => drawers.setIsDocDrawerOpen(false)}
        activeDocumentId={workflow.docId}
        onSelectDocument={workflow.handleSelectDocument}
        onNewDocument={workflow.handleNewDocument}
      />

      {/* 3. Knjiga Prometa (KPR) & Obrazac PO-SD Drawer */}
      <KprDrawer
        isOpen={drawers.isKprDrawerOpen}
        onClose={() => drawers.setIsKprDrawerOpen(false)}
        obrtOib={currentObrt.oib}
        obrtNaziv={currentObrt.naziv}
        obrtVlasnik={currentObrt.vlasnikImePrezime}
        obrtAdresa={`${currentObrt.ulicaIBroj}, ${currentObrt.mjesto}`}
        onKprUpdated={stats.refreshKprTotal}
      />

      {/* 4. Fiskalizacija 1.0 (CIS) & Fiskalizacija 2.0 (e-Račun) Drawer */}
      <FiscalDrawer
        isOpen={drawers.isFiscalDrawerOpen}
        onClose={() => drawers.setIsFiscalDrawerOpen(false)}
        activeDocument={activeDocument}
        obrtProfil={currentObrt}
        activePartner={activePartner}
        onDocumentUpdated={workflow.handleFiscalUpdated}
      />

      {/* 5. Postavke Obrta & Memorandum (Logo & Pečat) */}
      <SettingsDrawer
        isOpen={drawers.isSettingsDrawerOpen}
        onClose={() => drawers.setIsSettingsDrawerOpen(false)}
        onToggleLogDrawer={drawers.toggleLogDrawer}
        isLogDrawerOpen={drawers.isLogDrawerOpen}
        obrtProfileHook={obrtProfileHook}
        googleAuthHook={googleAuthHook}
        driveSyncHook={driveSyncHook}
        geminiHook={geminiHook}
      />

      {/* 6. Adresar Partnera & Kupaca */}
      <PartnerDrawer
        isOpen={drawers.isPartnerDrawerOpen}
        onClose={() => drawers.setIsPartnerDrawerOpen(false)}
        onSelectPartner={onSelectPartner}
        partnersHook={partnersHook}
      />

      {/* 7. Katalog Artikala i Usluga (Cjenik s KPD 2025) */}
      <ArticleDrawer
        isOpen={drawers.isArticleDrawerOpen}
        onClose={() => drawers.setIsArticleDrawerOpen(false)}
        onSelectArticle={onSelectArticle}
        articlesHook={articlesHook}
      />
    </>
  );
};
