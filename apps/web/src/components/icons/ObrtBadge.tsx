import React from 'react';
import { ObrtIconName, ObrtColorMode } from './types';
import { ObrtIcon } from './ObrtIcon';
import './icons.css';

export interface ObrtBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  name: ObrtIconName;
  size?: number;
  colorMode?: ObrtColorMode;
  accentColor?: string;
  isActive?: boolean;
  glow?: boolean;
  isAnimated?: boolean;
  label?: string;
}

/**
 * Kružni klesani medaljon sa slike 1 (ObrtIQ_Icons01.png).
 * Uključuje dvostruki prsten, kameni reljef i micro-animacije na hover.
 */
export const ObrtBadge: React.FC<ObrtBadgeProps> = ({
  name,
  size = 48,
  colorMode = 'themed',
  accentColor,
  isActive = false,
  glow = false,
  isAnimated = true,
  label,
  className = '',
  style,
  onClick,
  ...rest
}) => {
  const isGlowing = isActive || glow;
  const activeGlowClass = isGlowing
    ? 'obrt-badge-glow shadow-[0_0_15px_var(--icon-layer-glow)] border-[var(--accent-primary)]'
    : 'border-[var(--icon-layer-base-border)] hover:border-[var(--icon-layer-stroke)] hover:shadow-lg';

  const cursorClass = onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : '';

  return (
    <div
      className={`obrt-badge-container relative inline-flex items-center justify-center rounded-full transition-all duration-300 p-0.5 bg-[var(--icon-layer-base)] border ${activeGlowClass} ${cursorClass} ${className}`.trim()}
      style={{ width: size, height: size, ...style }}
      onClick={onClick}
      title={label}
      {...rest}
    >
      <ObrtIcon
        name={name}
        size={size}
        variant="badge"
        colorMode={colorMode}
        accentColor={accentColor}
        isAnimated={isAnimated}
      />
    </div>
  );
};
