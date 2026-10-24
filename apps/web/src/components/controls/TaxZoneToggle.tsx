import React from 'react';
import type { PoreznaZona } from '@obrtniq/core';

export interface TaxZoneToggleProps {
  value: PoreznaZona;
  onChange: (zone: PoreznaZona) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

interface ZoneOption {
  key: PoreznaZona;
  label: string;
  shortLabel: string;
  badge?: string;
  legalNote: string;
}

const TAX_ZONES: ZoneOption[] = [
  {
    key: 'DOMACI_B2B',
    label: 'Domaći B2B',
    shortLabel: 'HR B2B',
    badge: 'OIB Obavezan',
    legalNote: 'Domaće pravne osobe i obrti u RH. Obavezna KPD 2025 šifra.',
  },
  {
    key: 'DOMACI_B2C',
    label: 'Domaći B2C',
    shortLabel: 'HR B2C',
    badge: 'Fiskalizacija 1.0',
    legalNote: 'Fizičke osobe / građani u RH. Izdavanje gotovinskog/kartičnog računa.',
  },
  {
    key: 'DOMACI_B2G',
    label: 'Domaći B2G',
    shortLabel: 'HR B2G',
    badge: 'Javna nabava',
    legalNote: 'Javna tijela i institucije RH (obavezna dostava putem FINA e-Računa).',
  },
  {
    key: 'EU_B2B',
    label: 'EU B2B',
    shortLabel: 'EU B2B',
    badge: 'Reverse Charge',
    legalNote: 'Prijenos porezne obveze (čl. 17. st. 1. Zakona o PDV-u / Reverse Charge).',
  },
  {
    key: 'EU_B2C',
    label: 'EU B2C',
    shortLabel: 'EU B2C',
    legalNote: 'Isporuka fizičkim osobama unutar Europske unije.',
  },
  {
    key: 'TRECE_ZEMLJE',
    label: 'Treće zemlje',
    shortLabel: 'Izvoz',
    badge: 'Izvoz',
    legalNote: 'Izvoz usluga ili roba izvan EU (SAD, UK, Švicarska, BiH...).',
  },
];

export const TaxZoneToggle: React.FC<TaxZoneToggleProps> = ({
  value,
  onChange,
  label = 'Porezna Zona Dokumenta',
  disabled = false,
  className = '',
}) => {
  const currentOption = TAX_ZONES.find(z => z.key === value) || TAX_ZONES[0]!;

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[var(--text-secondary)] font-semibold">{label}</span>
          <span className="text-[11px] text-[var(--accent-primary)] font-semibold">
            {currentOption.label}
          </span>
        </div>
      )}

      {/* Segmented Grid / Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-1 gap-1">
        {TAX_ZONES.map((zone) => {
          const isActive = zone.key === value;
          return (
            <button
              key={zone.key}
              type="button"
              disabled={disabled}
              onClick={() => onChange(zone.key)}
              className={`py-2 px-1 text-center font-mono text-xs transition-all rounded-none flex flex-col items-center justify-center gap-0.5
                ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-black font-bold shadow-md border border-[var(--border-focus)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span>{zone.shortLabel}</span>
              {zone.badge && (
                <span
                  className={`text-[9px] px-1 py-0.2 tracking-tighter ${
                    isActive ? 'bg-black/20 text-black font-semibold' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {zone.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Legal Note */}
      <div className="bg-[var(--bg-surface)] px-3 py-1.5 border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)] flex items-center justify-between">
        <span>{currentOption.legalNote}</span>
        <span className="text-[var(--text-muted)] text-[10px] uppercase ml-2 shrink-0">
          {currentOption.key}
        </span>
      </div>
    </div>
  );
};
