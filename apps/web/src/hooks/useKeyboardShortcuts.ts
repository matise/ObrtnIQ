import { useEffect } from 'react';

export interface UseKeyboardShortcutsOptions {
  onIssue: () => void;
  onAddItem: () => void;
  isSubmittable: boolean;
  isLocked: boolean;
  onNavigateHome?: () => void;
  isHome?: boolean;
}

export function useKeyboardShortcuts({
  onIssue,
  onAddItem,
  isSubmittable,
  isLocked,
  onNavigateHome,
  isHome = true,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+H: Povratak na Radnu plohu (Home)
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        onNavigateHome?.();
        return;
      }

      // Escape: Ako nismo na Home, vrati se na Home
      if (e.key === 'Escape' && !isHome) {
        e.preventDefault();
        onNavigateHome?.();
        return;
      }

      // F2: Fiskaliziraj / Izdaj
      if (e.key === 'F2') {
        e.preventDefault();
        if (isSubmittable && !isLocked) {
          onIssue();
        }
      }
      // Alt+N: Nova stavka
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        if (!isLocked) {
          onAddItem();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onIssue, onAddItem, isSubmittable, isLocked, onNavigateHome, isHome]);
}
