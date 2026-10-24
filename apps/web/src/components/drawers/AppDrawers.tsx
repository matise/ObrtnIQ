import React from 'react';
import { SystemLogDrawer } from '../SystemLogDrawer';
import { DocumentDrawer } from '../DocumentDrawer';
import { KprDrawer } from '../KprDrawer';
import { FiscalDrawer } from '../FiscalDrawer';
import { DEFAULT_OBRT_PROFIL } from '../../engine/obrt-profile';
import { buildFiscalDrawerDocument, buildFiscalPartnerSnapshot } from '../../engine/invoice-mapper';
import type { UseAppDrawersReturn } from '../../hooks/useAppDrawers';
import type { UseInvoiceWorkflowReturn } from '../../hooks/useInvoiceWorkflow';
import type { UseInvoiceFormReturn } from '../../hooks/useInvoiceForm';
import type { UseInvoiceItemsReturn } from '../../hooks/useInvoiceItems';
import type { UseAppStatsReturn } from '../../hooks/useAppStats';

export interface AppDrawersProps {
  drawers: UseAppDrawersReturn;
  workflow: UseInvoiceWorkflowReturn;
  form: UseInvoiceFormReturn;
  items: UseInvoiceItemsReturn;
  stats: UseAppStatsReturn;
}

export const AppDrawers: React.FC<AppDrawersProps> = ({
  drawers,
  workflow,
  form,
  items,
  stats,
}) => {
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
        obrtOib={DEFAULT_OBRT_PROFIL.oib}
        obrtNaziv={DEFAULT_OBRT_PROFIL.naziv}
        obrtVlasnik={DEFAULT_OBRT_PROFIL.vlasnikImePrezime}
        obrtAdresa={`${DEFAULT_OBRT_PROFIL.ulicaIBroj}, ${DEFAULT_OBRT_PROFIL.mjesto}`}
        onKprUpdated={stats.refreshKprTotal}
      />

      {/* 4. Fiskalizacija 1.0 (CIS) & Fiskalizacija 2.0 (e-Račun) Drawer */}
      <FiscalDrawer
        isOpen={drawers.isFiscalDrawerOpen}
        onClose={() => drawers.setIsFiscalDrawerOpen(false)}
        activeDocument={activeDocument}
        obrtProfil={DEFAULT_OBRT_PROFIL}
        activePartner={activePartner}
        onDocumentUpdated={workflow.handleFiscalUpdated}
      />
    </>
  );
};
