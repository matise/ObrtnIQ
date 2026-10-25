import React from 'react';
import { ObrtColorMode } from './types';
import { ObrtIcon } from './ObrtIcon';
import './icons.css';

export interface ObrtEmblemProps extends React.HTMLAttributes<HTMLDivElement> {
  emblem?: 'app-seal' | 'zigo-emblem';
  size?: number;
  colorMode?: ObrtColorMode;
  accentColor?: string;
  isRotating?: boolean;
  rotatingRing?: boolean;
  ringSpeed?: 'slow' | 'fast';
  glow?: boolean;
  glowing?: boolean;
}

/**
 * Veliki ceremonijalni pečat aplikacije i Žigo agenta (prema Slikama 2 i 3).
 * Koristi se za Hero sekciju, zaglavlja glavnih ladica i plutajući widget.
 */
export const ObrtEmblem: React.FC<ObrtEmblemProps> = ({
  emblem = 'app-seal',
  size = 96,
  colorMode = 'themed',
  accentColor,
  isRotating,
  rotatingRing,
  ringSpeed = 'slow',
  glow,
  glowing,
  className = '',
  style,
  ...rest
}) => {
  const shouldRotate = rotatingRing ?? isRotating ?? false;
  const shouldGlow = glowing ?? glow ?? true;
  const speedClass = ringSpeed === 'fast' ? 'animate-[spin_4s_linear_infinite]' : 'animate-[spin_20s_linear_infinite]';

  return (
    <div
      className={`obrt-emblem-wrapper relative inline-flex items-center justify-center rounded-full p-2 bg-[var(--icon-layer-base)] border-2 border-[var(--icon-layer-base-border)] ${
        shouldGlow ? 'shadow-[0_0_25px_var(--icon-layer-glow)]' : ''
      } transition-transform duration-300 hover:scale-105 ${className}`.trim()}
      style={{ width: size, height: size, ...style }}
      {...rest}
    >
      {/* Rotirajući vanjski labirint / meandar prsten */}
      <div
        className={`absolute inset-0 rounded-full border border-dashed border-[var(--icon-layer-base-border)] opacity-60 pointer-events-none ${
          shouldRotate ? speedClass : ''
        }`}
      />

      <ObrtIcon
        name={emblem}
        size={size}
        variant="raw"
        colorMode={colorMode}
        accentColor={accentColor}
        isAnimated={true}
      />
    </div>
  );
};
