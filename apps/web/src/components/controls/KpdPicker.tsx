import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Tag } from 'lucide-react';

export interface KpdItem {
  sifra: string; // npr. "62.01.11"
  naziv: string; // npr. "Usluge programiranja računalnog koda"
  kategorija: string; // npr. "Informacijske tehnologije"
}

export const KPD_2025_BAZA: KpdItem[] = [
  // IT & Razvoj softvera
  { sifra: '62.01.11', naziv: 'Usluge dizajna i razvoja aplikacijskog softvera', kategorija: 'Informacijske tehnologije' },
  { sifra: '62.01.12', naziv: 'Usluge programiranja mrežnih stranica (web development)', kategorija: 'Informacijske tehnologije' },
  { sifra: '62.02.10', naziv: 'Usluge savjetovanja o računalnom hardveru i mrežama', kategorija: 'Informacijske tehnologije' },
  { sifra: '62.03.11', naziv: 'Usluge upravljanja računalnim sustavima na lokaciji klijenta', kategorija: 'Informacijske tehnologije' },
  { sifra: '62.09.10', naziv: 'Ostale usluge u vezi s informacijskom tehnologijom i računalima', kategorija: 'Informacijske tehnologije' },
  { sifra: '63.11.11', naziv: 'Usluge obrade podataka, hostinga i povezane djelatnosti', kategorija: 'Informacijske tehnologije' },

  // Dizajn & Kreativne usluge
  { sifra: '74.10.11', naziv: 'Usluge industrijskog dizajna i vizualnih komunikacija', kategorija: 'Dizajn i multimedija' },
  { sifra: '74.10.12', naziv: 'Usluge grafičkog dizajna i pripreme za tisak', kategorija: 'Dizajn i multimedija' },
  { sifra: '74.20.21', naziv: 'Usluge fotografiranja i video produkcije za poslovne potrebe', kategorija: 'Dizajn i multimedija' },

  // Poslovno savjetovanje & Marketing
  { sifra: '70.22.11', naziv: 'Usluge strateškog savjetovanja u poslovanju i upravljanju', kategorija: 'Savjetovanje i marketing' },
  { sifra: '70.22.13', naziv: 'Usluge savjetovanja o upravljanju ljudskim potencijalima (HR)', kategorija: 'Savjetovanje i marketing' },
  { sifra: '73.11.11', naziv: 'Cjelovite usluge oglašavanja i vođenja marketinških kampanja', kategorija: 'Savjetovanje i marketing' },
  { sifra: '73.11.12', naziv: 'Usluge digitalnog marketinga i oglašavanja na društvenim mrežama', kategorija: 'Savjetovanje i marketing' },

  // Arhitektura & Tehničko savjetovanje
  { sifra: '71.11.10', naziv: 'Arhitektonske usluge za zgrade i građevine', kategorija: 'Arhitektura i inženjerstvo' },
  { sifra: '71.12.11', naziv: 'Usluge inženjeringa i tehničkog savjetovanja', kategorija: 'Arhitektura i inženjerstvo' },

  // Zanati, instalacije & popravci
  { sifra: '43.21.10', naziv: 'Elektroinstalacijski radovi i montaža rasvjete', kategorija: 'Građevina i zanati' },
  { sifra: '43.22.11', naziv: 'Usluge instaliranja vodovoda, kanalizacije i grijanja', kategorija: 'Građevina i zanati' },
  { sifra: '43.32.10', naziv: 'Stolarski radovi i montaža namještaja po mjeri', kategorija: 'Građevina i zanati' },
  { sifra: '43.34.10', naziv: 'Soboslikarski i staklarski radovi', kategorija: 'Građevina i zanati' },
  { sifra: '95.11.10', naziv: 'Popravak i održavanje računala i periferne opreme', kategorija: 'Održavanje i servisi' },

  // Edukacija & Poduka
  { sifra: '85.59.19', naziv: 'Ostale usluge poduke i stručnog osposobljavanja (tečajevi)', kategorija: 'Edukacija' },
];

export interface KpdPickerProps {
  id?: string;
  value: string; // KPD šifra, npr. "62.01.11"
  onChange: (sifra: string, naziv: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const KpdPicker: React.FC<KpdPickerProps> = ({
  id = 'kpd-picker',
  value,
  onChange,
  label = 'KPD 2025 Klasifikacija (Fiskalizacija 2.0)',
  placeholder = 'Odaberite ili pretražite KPD šifru...',
  disabled = false,
  required = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedItem = useMemo(() => {
    return KPD_2025_BAZA.find(item => item.sifra === value);
  }, [value]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return KPD_2025_BAZA;
    const term = search.toLowerCase();
    return KPD_2025_BAZA.filter(
      item => item.sifra.includes(term) || item.naziv.toLowerCase().includes(term) || item.kategorija.toLowerCase().includes(term)
    );
  }, [search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: KpdItem) => {
    onChange(item.sifra, item.naziv);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={wrapperRef} className={`relative flex flex-col space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs font-mono">
          <label htmlFor={id} className="text-[var(--text-secondary)] font-semibold flex items-center gap-1">
            {label} {required && <span className="text-[#EF4444]">*</span>}
          </label>
          <span className="text-[11px] text-[var(--accent-primary)] font-semibold">
            EN 16931 Standard
          </span>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-[var(--bg-canvas)] text-left px-3.5 py-2.5 font-mono text-sm border outline-none transition-colors rounded-none flex items-center justify-between
          ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--bg-surface)]' : 'cursor-pointer hover:border-[var(--border-focus)]'}
          ${isOpen ? 'border-[var(--border-focus)] ring-1 ring-[var(--border-focus)]' : 'border-[var(--border-strong)]'}
        `}
      >
        <div className="flex items-center gap-2 truncate">
          <Tag className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
          {selectedItem ? (
            <div className="flex items-center gap-2 truncate">
              <span className="bg-[var(--bg-subtle)] text-[var(--accent-primary)] px-1.5 py-0.5 text-xs font-bold border border-[var(--border-strong)]">
                {selectedItem.sifra}
              </span>
              <span className="text-white text-xs truncate">{selectedItem.naziv}</span>
            </div>
          ) : (
            <span className="text-[var(--text-muted)] text-xs">{placeholder}</span>
          )}
        </div>

        <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Command Palette */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--bg-surface)] border border-[var(--border-strong)] shadow-2xl p-2 space-y-2">
          {/* Search Field */}
          <div className="relative flex items-center border border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-2.5" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraži KPD šifru ili djelatnost..."
              className="w-full bg-transparent text-white pl-8 pr-3 py-1.5 font-mono text-xs outline-none"
            />
          </div>

          {/* List of items */}
          <div className="max-h-56 overflow-y-auto space-y-1">
            {filteredItems.length === 0 ? (
              <div className="p-3 text-center text-xs font-mono text-[var(--text-muted)]">
                Nema pronađenih KPD šifri za "{search}".
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.sifra === value;
                return (
                  <button
                    key={item.sifra}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left p-2 font-mono text-xs transition-colors flex items-center justify-between rounded-none cursor-pointer
                      ${
                        isSelected
                          ? 'bg-[var(--bg-subtle)] text-white border-l-2 border-[var(--border-focus)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white'
                      }
                    `}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--accent-primary)]">{item.sifra}</span>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase">({item.kategorija})</span>
                      </div>
                      <div className="text-white text-[11px] truncate max-w-sm">{item.naziv}</div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-[#10B981] shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
