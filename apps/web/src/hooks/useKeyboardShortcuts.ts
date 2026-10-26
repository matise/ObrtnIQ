import { useEffect, useRef } from 'react';

export interface UseKeyboardShortcutsOptions {
  onIssue: () => void;
  onAddItem: () => void;
  isSubmittable: boolean;
  isLocked: boolean;
  onNavigateHome?: () => void;
  isHome?: boolean;
  onOpenStartHub?: () => void;
  onOpenDocs?: () => void;
  onOpenKpr?: () => void;
  onOpenPartners?: () => void;
  onOpenArticles?: () => void;
  onOpenFiscal?: () => void;
  onOpenSettings?: () => void;
  onOpenDocumentation?: () => void;
  onOpenLogs?: () => void;
  onToggleLogDrawer?: () => void;
  onOpenZigo?: () => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const opts = optionsRef.current;

      // Alt+S ili Ctrl+K: Otvaranje / Zatvaranje Start Huba
      if ((e.altKey && (e.key === 's' || e.key === 'S')) || (e.ctrlKey && (e.key === 'k' || e.key === 'K'))) {
        e.preventDefault();
        opts.onOpenStartHub?.();
        return;
      }

      // Alt+Z: Žigo AI Copilot
      if (e.altKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        opts.onOpenZigo?.();
        return;
      }

      // Alt+1 ili Alt+H: Povratak na Radnu plohu (Home)
      if (e.altKey && (e.key === '1' || e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        opts.onNavigateHome?.();
        return;
      }

      // Alt+2: Dokumenti & Arhiva
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        opts.onOpenDocs?.();
        return;
      }

      // Alt+3: Knjigovodstvo (KPR, PO-SD, Doprinosi)
      if (e.altKey && e.key === '3') {
        e.preventDefault();
        opts.onOpenKpr?.();
        return;
      }

      // Alt+4: Adresar Partnera
      if (e.altKey && e.key === '4') {
        e.preventDefault();
        opts.onOpenPartners?.();
        return;
      }

      // Alt+5: Cjenik Artikala & Usluga
      if (e.altKey && e.key === '5') {
        e.preventDefault();
        opts.onOpenArticles?.();
        return;
      }

      // Alt+6: Fiskalizacija 1.0 & 2.0 e-Račun
      if (e.altKey && e.key === '6') {
        e.preventDefault();
        opts.onOpenFiscal?.();
        return;
      }

      // Alt+7: Postavke Obrta & Trezor
      if (e.altKey && e.key === '7') {
        e.preventDefault();
        opts.onOpenSettings?.();
        return;
      }

      // Alt+8 ili Alt+D: Sustav Dokumentacije (21 faza)
      if (e.altKey && (e.key === '8' || e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        opts.onOpenDocumentation?.();
        return;
      }

      // Alt+9 ili Alt+L: Sustavni Dnevnik (Konzola na dnu / Puni prikaz)
      if (e.altKey && (e.key === '9' || e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        if (opts.onToggleLogDrawer) {
          opts.onToggleLogDrawer();
        } else {
          opts.onOpenLogs?.();
        }
        return;
      }

      // Escape: Ako nismo na Home, vrati se na Home
      if (e.key === 'Escape' && !opts.isHome) {
        e.preventDefault();
        opts.onNavigateHome?.();
        return;
      }

      // F2: Fiskaliziraj / Izdaj
      if (e.key === 'F2') {
        e.preventDefault();
        if (opts.isSubmittable && !opts.isLocked) {
          opts.onIssue();
        }
      }

      // Alt+N: Nova stavka
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        if (!opts.isLocked) {
          opts.onAddItem();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
