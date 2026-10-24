import React, { useState, useEffect } from 'react';
import { round2 } from '@obrtniq/core';

export interface CurrencyInputProps {
  id?: string;
  name?: string;
  value: number; // Decimal iznos u eurima
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id = 'currency-input',
  name = 'iznos',
  value,
  onChange,
  label = 'Iznos',
  placeholder = '0,00',
  disabled = false,
  required = false,
  min = 0,
  max,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<string>(
    value ? value.toFixed(2).replace('.', ',') : ''
  );

  useEffect(() => {
    const currentNum = parseInputToNumber(displayValue);
    if (currentNum !== value) {
      setDisplayValue(value === 0 ? '' : value.toFixed(2).replace('.', ','));
    }
  }, [value]);

  function parseInputToNumber(val: string): number {
    const normalized = val.replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : round2(parsed);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    input = input.replace(/[^0-9.,]/g, '');

    const parts = input.split(/[,.]/);
    if (parts.length > 2) {
      input = parts[0] + ',' + parts.slice(1).join('');
    }

    setDisplayValue(input);
    const num = parseInputToNumber(input);
    if (min !== undefined && num < min) return;
    if (max !== undefined && num > max) return;
    onChange(num);
  };

  const handleBlur = () => {
    const num = parseInputToNumber(displayValue);
    if (num > 0) {
      setDisplayValue(num.toFixed(2).replace('.', ','));
    } else {
      setDisplayValue('');
    }
    onChange(num);
  };

  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs font-mono">
          <label htmlFor={id} className="text-[var(--text-secondary)] font-semibold flex items-center gap-1">
            {label} {required && <span className="text-[#EF4444]">*</span>}
          </label>
          <span className="text-[11px] text-[var(--text-muted)]">EUR (€)</span>
        </div>
      )}

      <div className="relative flex items-center">
        <input
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          disabled={disabled}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full bg-[var(--bg-canvas)] text-white pl-3.5 pr-9 py-2.5 font-mono text-sm tracking-wider outline-none border transition-colors rounded-none tabular-nums text-right
            ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--bg-surface)]' : ''}
            border-[var(--border-strong)] focus:border-[var(--border-focus)]`}
        />

        <div className="absolute right-3.5 flex items-center pointer-events-none text-[var(--text-secondary)] font-mono text-sm font-semibold">
          €
        </div>
      </div>
    </div>
  );
};
