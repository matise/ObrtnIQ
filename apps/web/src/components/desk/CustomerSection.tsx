import React from 'react';
import type { PoreznaZona } from '@obrtniq/core';
import { OibInput, IbanInput, TaxZoneToggle } from '../controls';

export interface CustomerSectionProps {
  partnerNaziv: string;
  onPartnerNazivChange: (val: string) => void;
  oib: string;
  onOibChange: (val: string, valid: boolean) => void;
  taxZone: PoreznaZona;
  onTaxZoneChange: (val: PoreznaZona) => void;
  iban: string;
  onIbanChange: (val: string, valid: boolean, bank?: string) => void;
  detectedBank?: string;
  isLocked: boolean;
}

export const CustomerSection: React.FC<CustomerSectionProps> = ({
  partnerNaziv,
  onPartnerNazivChange,
  oib,
  onOibChange,
  taxZone,
  onTaxZoneChange,
  iban,
  onIbanChange,
  detectedBank,
  isLocked,
}) => {
  return (
    <div className="space-y-4">
      {/* 1. Porezna Zona Toggle */}
      <fieldset disabled={isLocked} className={isLocked ? 'opacity-70 pointer-events-none' : ''}>
        <TaxZoneToggle value={taxZone} onChange={onTaxZoneChange} />
      </fieldset>

      {/* 2. Partner podaci (OIB & Naziv) */}
      <fieldset
        disabled={isLocked}
        className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isLocked ? 'opacity-70 pointer-events-none' : ''}`}
      >
        <div>
          <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1.5">
            Naziv Partnera / Kupca *
          </label>
          <input
            type="text"
            value={partnerNaziv}
            disabled={isLocked}
            onChange={(e) => onPartnerNazivChange(e.target.value)}
            placeholder="npr. Alpha Inženjering d.o.o."
            className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none disabled:bg-[var(--bg-elevated)]"
          />
        </div>

        <OibInput
          value={oib}
          onChange={onOibChange}
          required
        />
      </fieldset>

      {/* 3. Poslovni IBAN */}
      <fieldset disabled={isLocked} className={isLocked ? 'opacity-70 pointer-events-none' : ''}>
        <IbanInput
          value={iban}
          onChange={onIbanChange}
          required
        />
        {detectedBank && (
          <div className="mt-1 text-[11px] font-mono text-[#10B981]">
            Povezana domaća banka: <span className="font-semibold">{detectedBank}</span>
          </div>
        )}
      </fieldset>
    </div>
  );
};
