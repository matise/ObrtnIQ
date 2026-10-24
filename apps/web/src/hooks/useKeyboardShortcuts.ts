import { useEffect } from 'react';

export interface UseKeyboardShortcutsOptions {
  onIssue: () => void;
  onAddItem: () => void;
  isSubmittable: boolean;
  isLocked: boolean;
}

export function useKeyboardShortcuts({
  onIssue,
  onAddItem,
  isSubmittable,
  isLocked,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [onIssue, onAddItem, isSubmittable, isLocked]);
}
