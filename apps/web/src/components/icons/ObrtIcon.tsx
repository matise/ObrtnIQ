import React from 'react';
import { ObrtIconProps } from './types';
import { ICON_REGISTRY } from './registry';
import './icons.css';

/**
 * Glavna ObrtIcon komponenta za vektorske ikone s dinamičkim temiranjem i animacijama.
 */
export const ObrtIcon: React.FC<ObrtIconProps> = ({
  name,
  size = 24,
  variant = 'glyph',
  colorMode = 'themed',
  accentColor,
  glow = false,
  isAnimated = false,
  className = '',
  title,
  style,
  ...rest
}) => {
  const definition = ICON_REGISTRY[name];
  if (!definition) {
    console.warn(`[ObrtIcon] Nepoznata ikona "${name}".`);
    return null;
  }

  const customStyle: React.CSSProperties = {
    ...style,
    ...(accentColor
      ? ({
          '--icon-layer-accent': accentColor,
          '--icon-layer-glow': accentColor,
        } as any)
      : {}),
  };

  const animClass = isAnimated ? 'obrt-icon-animated' : '';
  const glowClass = glow ? 'obrt-anim-pulse drop-shadow-[0_0_6px_var(--icon-layer-glow)]' : '';
  const modeClass = colorMode !== 'themed' ? `obrt-mode-${colorMode}` : '';

  const explicitLabel = rest['aria-label'] || (rest as any).label || title;
  const isDecorative = !explicitLabel;

  return (
    <svg
      width={size}
      height={size}
      viewBox={definition.viewBox || '0 0 48 48'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`obrt-icon obrt-icon-${name} ${animClass} ${glowClass} ${modeClass} ${className}`.trim()}
      style={customStyle}
      role={isDecorative ? 'presentation' : 'img'}
      aria-label={explicitLabel || undefined}
      aria-hidden={isDecorative ? true : undefined}
      {...rest}
    >
      {title && <title>{title}</title>}
      {definition.render(variant, colorMode)}
    </svg>
  );
};
