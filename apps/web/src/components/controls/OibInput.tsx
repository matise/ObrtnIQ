import React from 'react';
import { validateOib, sanitizeOib } from '@obrtniq/core';
import { Check, AlertCircle } from 'lucide-react';

export interface OibInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const OibInput: React.FC<OibInputProps> = ({
  id = 'oib-input',
  name = 'oib',
  value,
  onChange,
  label = 'OIB',
  placeholder = 'Unesite 11 znamenki OIB-a',
  disabled = false,
  required = false,
  className = '',
}) => {
  const sanitized = sanitizeOib(value);
  const isValid = sanitized.length === 11 && validateOib(sanitized);
  const hasError = sanitized.length > 0 && (sanitized.length === 11 ? !isValid : true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = sanitizeOib(raw);
    const valid = clean.length === 11 && validateOib(clean);
    onChange(clean, valid);
  };

  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs font-mono">
          <label htmlFor={id} className="text-[var(--text-secondary)] font-semibold flex items-center gap-1">
            {label} {required && <span className="text-[#EF4444]">*</span>}
          </label>
          <span className="text-[11px] text-[var(--text-muted)]">
            {sanitized.length}/11 znamenki
          </span>
        </div>
      )}

      <div className="relative flex items-center">
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          value={sanitized}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={11}
          className={`w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm tracking-wider outline-none border transition-colors rounded-none tabular-nums
            ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--bg-surface)]' : ''}
            ${
              sanitized.length === 0
                ? 'border-[var(--border-strong)] focus:border-[var(--border-focus)]'
                : isValid
                ? 'border-[#10B981] focus:border-[#10B981] bg-[#064E3B]/10'
                : 'border-[#EF4444] focus:border-[#EF4444] bg-[#450A0A]/10'
            }`}
        />

        {/* Validation indicator icon */}
        <div className="absolute right-3 flex items-center pointer-events-none">
          {sanitized.length === 11 && isValid && (
            <span className="flex items-center text-[#10B981] gap-1 text-xs font-mono">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </span>
          )}
          {sanitized.length > 0 && !isValid && (
            <span className="flex items-center text-[#EF4444] gap-1 text-xs font-mono">
              <AlertCircle className="w-4 h-4 stroke-[2]" />
            </span>
          )}
        </div>
      </div>

      {/* Helper / validation message */}
      {hasError && sanitized.length === 11 && (
        <span className="text-[11px] font-mono text-[#EF4444] flex items-center gap-1">
          Neispravna ISO 7064 kontrolna znamenka.
        </span>
      )}
      {sanitized.length > 0 && sanitized.length < 11 && (
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          Nedostaje još {11 - sanitized.length} znamenki do punog OIB-a.
        </span>
      )}
      {isValid && (
        <span className="text-[11px] font-mono text-[#10B981] flex items-center gap-1">
          OIB je matematički ispravan (MOD 11, 10 verificiran).
        </span>
      )}
    </div>
  );
};
