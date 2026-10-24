import React from 'react';
import type { UseInvoiceFormReturn } from '../../hooks/useInvoiceForm';
import type { UseInvoiceItemsReturn } from '../../hooks/useInvoiceItems';
import type { UseInvoiceWorkflowReturn } from '../../hooks/useInvoiceWorkflow';
import { DocumentStatusBar } from './DocumentStatusBar';
import { CustomerSection } from './CustomerSection';
import { InvoiceItemsEditor } from './InvoiceItemsEditor';
import { InvoiceDeskActions } from './InvoiceDeskActions';

export interface InvoiceDeskProps {
  className?: string;
  form: UseInvoiceFormReturn;
  items: UseInvoiceItemsReturn;
  workflow: UseInvoiceWorkflowReturn;
}

export const InvoiceDesk: React.FC<InvoiceDeskProps> = ({
  className = '',
  form,
  items,
  workflow,
}) => {
  return (
    <div
      className={`xl:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 space-y-6 transition-colors no-print ${className}`}
    >
      {/* 1. Status dokumenta i immutability kontrole */}
      <DocumentStatusBar
        docType={workflow.docType}
        docStatus={workflow.docStatus}
        brojDokumenta={workflow.brojDokumenta}
        isLocked={workflow.isLocked}
        onNewDocument={workflow.handleNewDocument}
        onRecordPayment={workflow.handleRecordPayment}
        onStorno={workflow.handleStorno}
        onConvertOffer={workflow.handleConvertOffer}
      />

      {/* 2. Podaci o kupcu, poreznoj zoni i IBAN-u */}
      <CustomerSection
        partnerNaziv={form.partnerNaziv}
        onPartnerNazivChange={form.setPartnerNaziv}
        oib={form.oib}
        onOibChange={(val, valid) => {
          form.setOib(val);
          form.setIsOibValid(valid);
        }}
        taxZone={form.taxZone}
        onTaxZoneChange={form.setTaxZone}
        iban={form.iban}
        onIbanChange={(val, valid, bank) => {
          form.setIban(val);
          form.setIsIbanValid(valid);
          form.setDetectedBank(bank);
        }}
        detectedBank={form.detectedBank}
        isLocked={workflow.isLocked}
      />

      {/* 3. Uređivač stavaka dokumenta */}
      <InvoiceItemsEditor
        items={items.items}
        isLocked={workflow.isLocked}
        onAddItem={items.addItem}
        onRemoveItem={items.removeItem}
        onUpdateItem={items.updateItem}
      />

      {/* 4. Donja akcijska traka i gumb za izdavanje */}
      <InvoiceDeskActions
        ukupniIznos={items.ukupniIznos}
        isLocked={workflow.isLocked}
        isFormSubmittable={workflow.isFormSubmittable}
        onIssueDocument={workflow.handleIssueDocument}
        onNewDocument={() => workflow.handleNewDocument('RACUN')}
      />
    </div>
  );
};
