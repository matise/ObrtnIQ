import React from 'react';
import { IbanInput } from '../../controls';
import type { PoslovanjeTabProps } from '../types';

export const PoslovanjeTab: React.FC<PoslovanjeTabProps> = ({
  formData,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <IbanInput
        value={formData.iban}
        onChange={(val, _valid, bank) => {
          onChange('iban', val);
          if (bank) onChange('bankaNaziv', bank);
        }}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
            Oznaka Poslovnog Prostora *
          </label>
          <input
            type="text"
            required
            value={formData.poslovniProstorOznaka}
            onChange={(e) => onChange('poslovniProstorOznaka', e.target.value)}
            placeholder="npr. POSL1"
            className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
            Oznaka Naplatnog Uređaja *
          </label>
          <input
            type="text"
            required
            value={formData.naplatniUredjajOznaka}
            onChange={(e) => onChange('naplatniUredjajOznaka', e.target.value)}
            placeholder="npr. 1"
            className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
          />
        </div>
      </div>

      <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3">
        <span className="text-xs font-mono text-[var(--accent-primary)] font-semibold block">
          Porezni Status
        </span>
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="jePausalist"
            checked={formData.jePausalist}
            onChange={(e) => onChange('jePausalist', e.target.checked)}
            className="w-4 h-4 rounded border-[var(--border-strong)] accent-[var(--accent-primary)] cursor-pointer"
          />
          <label htmlFor="jePausalist" className="text-xs font-mono text-slate-200 cursor-pointer">
            Paušalno oporezivanje samostalne djelatnosti (Dohodak)
          </label>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="uSustavuPdv"
            checked={formData.uSustavuPdv}
            onChange={(e) => onChange('uSustavuPdv', e.target.checked)}
            className="w-4 h-4 rounded border-[var(--border-strong)] accent-[var(--accent-primary)] cursor-pointer"
          />
          <label htmlFor="uSustavuPdv" className="text-xs font-mono text-slate-200 cursor-pointer">
            U sustavu PDV-a (redovni obveznik PDV-a)
          </label>
        </div>
      </div>
    </div>
  );
};
