import React, { useMemo } from 'react';
import { validateIban, sanitizeIban, formatIban, getBankNameFromIban } from '@obrtniq/core';
import { Check, AlertCircle, Building2 } from 'lucide-react';

export interface IbanInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string, isValid: boolean, bankName?: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const IbanInput: React.FC<IbanInputProps> = ({
  id = 'iban-input',
  name = 'iban',
  value,
  onChange,
  label = 'IBAN Račun',
  placeholder = 'HR12 3456 7890 1234 5678 9',
  disabled = false,
  required = false,
  className = '',
}) => {
  const clean = useMemo(() => sanitizeIban(value), [value]);
  const formatted = useMemo(() => formatIban(clean), [clean]);
  const isValid = useMemo(() => clean.length >= 15 && validateIban(clean), [clean]);
  const bankName = useMemo(() => getBankNameFromIban(clean), [clean]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = sanitizeIban(raw);
    const valid = sanitized.length >= 15 && validateIban(sanitized);
    const bank = getBankNameFromIban(sanitized);
    onChange(sanitized, valid, bank);
  };

  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs font-mono">
          <label htmlFor={id} className="text-[#C4B5FD] font-semibold flex items-center gap-1">
            {label} {required && <span className="text-[#EF4444]">*</span>}
          </label>
          <span className="text-[11px] text-[#7C6DA0]">
            {clean.length > 0 ? `${clean.length} znakova` : 'ISO 13616'}
          </span>
        </div>
      )}

      <div className="relative flex items-center">
        <input
          id={id}
          name={name}
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={formatted}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full bg-[#0B0813] text-white px-3.5 py-2.5 font-mono text-sm tracking-wider outline-none border transition-colors rounded-none tabular-nums
            ${disabled ? 'opacity-50 cursor-not-allowed bg-[#140F24]' : ''}
            ${
              clean.length === 0
                ? 'border-[#433068] focus:border-[#A855F7]'
                : isValid
                ? 'border-[#10B981] focus:border-[#10B981] bg-[#064E3B]/10'
                : 'border-[#EF4444] focus:border-[#EF4444] bg-[#450A0A]/10'
            }`}
        />

        {/* Validation indicator */}
        <div className="absolute right-3 flex items-center pointer-events-none">
          {isValid && (
            <span className="flex items-center text-[#10B981] gap-1 text-xs font-mono">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </span>
          )}
          {clean.length > 0 && !isValid && (
            <span className="flex items-center text-[#EF4444] gap-1 text-xs font-mono">
              <AlertCircle className="w-4 h-4 stroke-[2]" />
            </span>
          )}
        </div>
      </div>

      {/* Bank name notification & validity note */}
      <div className="flex items-center justify-between text-[11px] font-mono min-h-[18px]">
        {bankName ? (
          <span className="text-[#10B981] flex items-center gap-1 font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            {bankName}
          </span>
        ) : clean.length >= 21 && !isValid ? (
          <span className="text-[#EF4444]">Neispravan IBAN (MOD 97 provjera nije prošla)</span>
        ) : clean.length > 0 && clean.length < 21 ? (
          <span className="text-[#7C6DA0]">Upišite preostale znakove računa...</span>
        ) : (
          <span className="text-[#7C6DA0]">Unesite domaći ili inozemni IBAN</span>
        )}

        {isValid && (
          <span className="text-[#C4B5FD] text-[10px] uppercase bg-[#261B3D] px-1.5 py-0.5 border border-[#433068]">
            MOD 97 OK
          </span>
        )}
      </div>
    </div>
  );
};
