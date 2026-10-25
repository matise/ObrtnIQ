import React, { useState, useRef, useEffect } from 'react';
import { Palette, ChevronDown, Sliders } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const ThemeSelector: React.FC = () => {
  const { preset, hue, activePreset, presets, selectPreset, updateHue } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 flex items-center space-x-2 bg-[#140F24] hover:bg-[#1E1635] border border-[#261B3D] hover:border-[#433068] px-3 transition-colors font-mono text-xs rounded-none cursor-pointer"
        title="Promijeni temu sučelja"
      >
        <span
          className="w-3 h-3 border border-white/20 shrink-0"
          style={{ backgroundColor: activePreset.previewColor }}
        />
        <span className="text-white hidden sm:inline font-semibold">{activePreset.name}</span>
        <span className="text-[#7C6DA0] text-[10px]">({preset === 'carbon' ? 'Mono' : `${hue}°`})</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#7C6DA0] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-72 bg-[#140F24] border border-[#433068] shadow-2xl p-4 z-50 space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-[#261B3D] pb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Palette className="w-3.5 h-3.5 text-[#A855F7]" />
              Sustav Teme &amp; Hue
            </span>
            <span className="text-[10px] text-[#A855F7] bg-[#261B3D] px-1.5 py-0.5 border border-[#433068]">
              {hue}° HSL
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase text-[#7C6DA0] font-semibold block">
              Kurirani Preseti
            </span>
            <div className="grid grid-cols-1 gap-1">
              {presets.map((p) => {
                const isSelected = preset === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => selectPreset(p.key)}
                    className={`flex items-center justify-between p-2 text-left text-xs transition-colors rounded-none cursor-pointer border
                      ${
                        isSelected
                          ? 'bg-[#2A1F49] border-[#A855F7] text-white'
                          : 'border-transparent text-[#C4B5FD] hover:bg-[#1E1635] hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-3.5 h-3.5 border border-white/20 shrink-0 shadow-sm"
                        style={{ backgroundColor: p.previewColor }}
                      />
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-[10px] text-[#7C6DA0] truncate max-w-[170px]">{p.description}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] text-[#10B981] font-bold">AKTIVNO</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Hue Rotation Slider */}
          <div className="border-t border-[#261B3D] pt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] uppercase text-[#7C6DA0] font-semibold flex items-center gap-1">
                <Sliders className="w-3 h-3 text-[#A855F7]" />
                Rotacija Tona (Hue):
              </span>
              <span className="text-white font-bold tabular-nums">{hue}°</span>
            </div>

            <div className="relative">
              <input
                type="range"
                min="0"
                max="360"
                value={hue}
                onChange={(e) => updateHue(Number(e.target.value))}
                className="w-full h-2.5 appearance-none cursor-pointer rounded-none border border-[#433068]"
                style={{
                  background:
                    'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                }}
              />
            </div>
            <div className="text-[10px] text-[#7C6DA0] leading-tight">
              Povucite klizač za rotaciju tona cijelog sučelja (0° - 360°).
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
