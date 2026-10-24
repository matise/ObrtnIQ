import React from 'react';
import { OibInput } from '../../controls';
import type { OsnovniPodaciTabProps } from '../types';

export const OsnovniPodaciTab: React.FC<OsnovniPodaciTabProps> = ({
  formData,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
          Puni Naziv Obrta *
        </label>
        <input
          type="text"
          required
          value={formData.naziv}
          onChange={(e) => onChange('naziv', e.target.value)}
          placeholder="npr. Robot Hand Made, obrt za računalno programiranje"
          className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
            Vlasnik (Ime i Prezime) *
          </label>
          <input
            type="text"
            required
            value={formData.vlasnikImePrezime}
            onChange={(e) => onChange('vlasnikImePrezime', e.target.value)}
            placeholder="npr. Matija Obrtović"
            className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
          />
        </div>

        <OibInput
          value={formData.oib}
          onChange={(val) => onChange('oib', val)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
            Ulica i Kućni Broj *
          </label>
          <input
            type="text"
            required
            value={formData.ulicaIBroj}
            onChange={(e) => onChange('ulicaIBroj', e.target.value)}
            placeholder="Ulica grada Vukovara 284"
            className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
            Poštanski Broj *
          </label>
          <input
            type="text"
            required
            value={formData.postanskiBroj}
            onChange={(e) => onChange('postanskiBroj', e.target.value)}
            placeholder="40000"
            className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
            Mjesto / Grad *
          </label>
          <input
            type="text"
            required
            value={formData.mjesto}
            onChange={(e) => onChange('mjesto', e.target.value)}
            placeholder="Čakovec"
            className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
            Država (ISO 3166-1)
          </label>
          <input
            type="text"
            value={formData.drzavaIso}
            onChange={(e) => onChange('drzavaIso', e.target.value)}
            className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
            Službeni Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="info@robothandmade.hr"
            className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
            Kontakt Telefon
          </label>
          <input
            type="text"
            value={formData.telefon || ''}
            onChange={(e) => onChange('telefon', e.target.value)}
            placeholder="+385 91 123 4567"
            className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
          />
        </div>
      </div>
    </div>
  );
};
