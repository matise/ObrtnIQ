import { useState, useCallback } from 'react';

export interface UseAppDrawersReturn {
  isLogDrawerOpen: boolean;
  isDocDrawerOpen: boolean;
  isKprDrawerOpen: boolean;
  isFiscalDrawerOpen: boolean;
  isSettingsDrawerOpen: boolean;
  isPartnerDrawerOpen: boolean;
  isArticleDrawerOpen: boolean;
  setIsLogDrawerOpen: (val: boolean) => void;
  setIsDocDrawerOpen: (val: boolean) => void;
  setIsKprDrawerOpen: (val: boolean) => void;
  setIsFiscalDrawerOpen: (val: boolean) => void;
  setIsSettingsDrawerOpen: (val: boolean) => void;
  setIsPartnerDrawerOpen: (val: boolean) => void;
  setIsArticleDrawerOpen: (val: boolean) => void;
  toggleLogDrawer: () => void;
}

export function useAppDrawers(): UseAppDrawersReturn {
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [isDocDrawerOpen, setIsDocDrawerOpen] = useState(false);
  const [isKprDrawerOpen, setIsKprDrawerOpen] = useState(false);
  const [isFiscalDrawerOpen, setIsFiscalDrawerOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isPartnerDrawerOpen, setIsPartnerDrawerOpen] = useState(false);
  const [isArticleDrawerOpen, setIsArticleDrawerOpen] = useState(false);

  const toggleLogDrawer = useCallback(() => {
    setIsLogDrawerOpen((prev) => !prev);
  }, []);

  return {
    isLogDrawerOpen,
    isDocDrawerOpen,
    isKprDrawerOpen,
    isFiscalDrawerOpen,
    isSettingsDrawerOpen,
    isPartnerDrawerOpen,
    isArticleDrawerOpen,
    setIsLogDrawerOpen,
    setIsDocDrawerOpen,
    setIsKprDrawerOpen,
    setIsFiscalDrawerOpen,
    setIsSettingsDrawerOpen,
    setIsPartnerDrawerOpen,
    setIsArticleDrawerOpen,
    toggleLogDrawer,
  };
}
