// apps/web/src/hooks/useOnboardingWizard.ts
// ObrtnIQ v3.0 — State hook za Onboarding Wizard s glasovnom pratnjom Žiga Gospara

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { validateOib, validateIban, getBankNameFromIban, type ObrtProfil } from '@obrtniq/core';
import { dexieStorage } from '../storage/dexie-db';
import { ONBOARDING_DIALOGUES } from '../services/onboarding-dialogues';
import { appLogger } from '../services/logger';
import { useAudioTransport } from '../context/AudioTransportContext';

export const ONBOARDING_STORAGE_KEY = 'obrtniq_onboarding_completed';

export interface PredefinedDjelatnost {
  id: string;
  naziv: string;
  kpdSifra: string;
  kpdNaziv: string;
  opis: string;
}

export const PREDEFINED_DJELATNOSTI: PredefinedDjelatnost[] = [
  {
    id: 'it-dev',
    naziv: 'IT & Računalno Programiranje',
    kpdSifra: '62.01.11',
    kpdNaziv: 'Usluge dizajna i razvoja aplikacijskog softvera',
    opis: 'Razvoj web, mobilnog i enterprise softvera, backend i frontend inženjering',
  },
  {
    id: 'consulting',
    naziv: 'Poslovno Savjetovanje & Menadžment',
    kpdSifra: '70.22.10',
    kpdNaziv: 'Usluge poslovnog savjetovanja i upravljanja',
    opis: 'Strateško savjetovanje, optimizacija procesa, projektni menadžment',
  },
  {
    id: 'design',
    naziv: 'Grafički Dizajn & Digitalni Mediji',
    kpdSifra: '74.10.19',
    kpdNaziv: 'Usluge specijaliziranog dizajna d.n.',
    opis: 'UI/UX dizajn, vizualni identitet, brending, priprema za tisak',
  },
  {
    id: 'craft',
    naziv: 'Završni Građevinski & Instalacijski Radovi',
    kpdSifra: '43.39.10',
    kpdNaziv: 'Ostali završni građevinski radovi',
    opis: 'Monterski radovi, suha gradnja, popravci i opremanje prostora',
  },
  {
    id: 'education',
    naziv: 'Poduka, Tečajevi & Edukacije',
    kpdSifra: '85.59.19',
    kpdNaziv: 'Ostale usluge obrazovanja i poučavanja d.n.',
    opis: 'Stručne radionice, individualne instrukcije, mentorstvo',
  },
  {
    id: 'photo',
    naziv: 'Fotografske & Video Usluge',
    kpdSifra: '74.20.21',
    kpdNaziv: 'Usluge fotografiranja događanja',
    opis: 'Komercijalna i portretna fotografija, snimanje i video montaža',
  },
];

export interface UseOnboardingWizardReturn {
  // Stanje
  isOpen: boolean;
  step: number;
  totalSteps: number;
  isFirstRun: boolean;
  canGoNext: boolean;
  isStepValid: (stepNumber: number) => boolean;
  
  // Polja forme obrta
  naziv: string;
  vlasnikImePrezime: string;
  oib: string;
  isOibValid: boolean;
  ulicaIBroj: string;
  postanskiBroj: string;
  mjesto: string;
  iban: string;
  isIbanValid: boolean;
  detectedBank: string;
  selectedDjelatnostId: string;
  kpdSifra: string;
  kpdNaziv: string;
  selectedTheme: string;
  logoImageData: string | undefined;
  pecatPotpisImageData: string | undefined;

  // Akcije forme
  setNaziv: (val: string) => void;
  setVlasnikImePrezime: (val: string) => void;
  setOib: (val: string) => void;
  setUlicaIBroj: (val: string) => void;
  setPostanskiBroj: (val: string) => void;
  setMjesto: (val: string) => void;
  setIban: (val: string) => void;
  selectDjelatnost: (id: string) => void;
  setSelectedTheme: (theme: string) => void;
  setLogoImageData: (data?: string) => void;
  setPecatPotpisImageData: (data?: string) => void;
  loadExampleData: () => void;

  // Navigacija kroz korake
  setStep: (step: number) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  openWizard: () => void;
  closeWizard: () => void;
  
  // Zvučna pratnja
  isMuted: boolean;
  toggleMute: () => void;
  replaySpeech: () => void;

  // Završne akcije
  applyDemoData: () => Promise<void>;
  skipOnboarding: () => void;
  completeOnboarding: (onSuccessCreatedInvoice?: () => void) => Promise<void>;
}

export function useOnboardingWizard(
  currentProfil?: ObrtProfil,
  onProfilUpdated?: (profil: ObrtProfil) => void
): UseOnboardingWizardReturn {
  const logger = appLogger.scope('ONBOARDING:WIZARD');
  const audioTransport = useAudioTransport();

  // Provjera je li onboarding već odrađen
  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
  });

  const [isOpen, setIsOpen] = useState<boolean>(() => !isCompleted);
  const [step, setStep] = useState<number>(1);
  const totalSteps = 5;

  // Je li profil već ranije konfiguriran i spremljen od strane korisnika (nije defaultni ogledni profil)
  const isProfileCustomized = Boolean(
    isCompleted &&
    currentProfil &&
    currentProfil.id !== 'default' &&
    currentProfil.naziv !== 'Orlando Libertas, obrt za programiranje i savjetovanje'
  );

  // Polja profila — čisti unos bez prisilnih predefiniranih podataka na prvom pokretanju
  const [naziv, setNaziv] = useState<string>(isProfileCustomized ? currentProfil?.naziv || '' : '');
  const [vlasnikImePrezime, setVlasnikImePrezime] = useState<string>(isProfileCustomized ? currentProfil?.vlasnikImePrezime || '' : '');
  const [oib, setOibState] = useState<string>(isProfileCustomized ? currentProfil?.oib || '' : '');
  const [ulicaIBroj, setUlicaIBroj] = useState<string>(isProfileCustomized ? currentProfil?.ulicaIBroj || '' : '');
  const [postanskiBroj, setPostanskiBroj] = useState<string>(isProfileCustomized ? currentProfil?.postanskiBroj || '' : '');
  const [mjesto, setMjesto] = useState<string>(isProfileCustomized ? currentProfil?.mjesto || '' : '');
  const [iban, setIbanState] = useState<string>(isProfileCustomized ? currentProfil?.iban || '' : '');
  const [selectedDjelatnostId, setSelectedDjelatnostId] = useState<string>('it-dev');
  const [kpdSifra, setKpdSifra] = useState<string>('62.01.11');
  const [kpdNaziv, setKpdNaziv] = useState<string>('Usluge dizajna i razvoja aplikacijskog softvera');
  const [selectedTheme, setSelectedTheme] = useState<string>('amethyst');
  const [logoImageData, setLogoImageData] = useState<string | undefined>(isProfileCustomized ? currentProfil?.logoImageData : undefined);
  const [pecatPotpisImageData, setPecatPotpisImageData] = useState<string | undefined>(isProfileCustomized ? currentProfil?.pecatPotpisImageData : undefined);

  // Validacije
  const isOibValid = useMemo(() => validateOib(oib), [oib]);
  const isIbanValid = useMemo(() => validateIban(iban), [iban]);
  const detectedBank = useMemo(() => (iban ? getBankNameFromIban(iban) || '' : ''), [iban]);

  // Validacija po pojedinom koraku (Gate Check)
  const isStepValid = useCallback((stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return true; // Uvodni izbor
      case 2:
        return (
          naziv.trim().length >= 3 &&
          vlasnikImePrezime.trim().split(/\s+/).filter(Boolean).length >= 2 &&
          isOibValid
        );
      case 3:
        return isIbanValid && Boolean(selectedDjelatnostId);
      case 4:
        return Boolean(selectedTheme);
      case 5:
        return true; // Završni korak / izdavanje
      default:
        return true;
    }
  }, [naziv, vlasnikImePrezime, isOibValid, isIbanValid, selectedDjelatnostId, selectedTheme]);

  const canGoNext = useMemo(() => isStepValid(step), [isStepValid, step]);

  // Sinkroniziraj podatke isključivo ako profil stigne asinkrono i ako je već ranije prilagođen
  useEffect(() => {
    if (currentProfil && isCompleted && currentProfil.id !== 'default' && currentProfil.naziv !== 'Orlando Libertas, obrt za programiranje i savjetovanje') {
      if (currentProfil.naziv && !naziv) setNaziv(currentProfil.naziv);
      if (currentProfil.vlasnikImePrezime && !vlasnikImePrezime) setVlasnikImePrezime(currentProfil.vlasnikImePrezime);
      if (currentProfil.oib && !oib) setOibState(currentProfil.oib);
      if (currentProfil.ulicaIBroj && !ulicaIBroj) setUlicaIBroj(currentProfil.ulicaIBroj);
      if (currentProfil.postanskiBroj && !postanskiBroj) setPostanskiBroj(currentProfil.postanskiBroj);
      if (currentProfil.mjesto && !mjesto) setMjesto(currentProfil.mjesto);
      if (currentProfil.iban && !iban) setIbanState(currentProfil.iban);
      if (currentProfil.logoImageData && !logoImageData) setLogoImageData(currentProfil.logoImageData);
      if (currentProfil.pecatPotpisImageData && !pecatPotpisImageData) setPecatPotpisImageData(currentProfil.pecatPotpisImageData);
    }
  }, [currentProfil, isCompleted]);

  const setOib = useCallback((val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 11);
    setOibState(clean);
  }, []);

  const setIban = useCallback((val: string) => {
    const clean = val.replace(/\s+/g, '').toUpperCase().slice(0, 21);
    setIbanState(clean);
  }, []);

  const selectDjelatnost = useCallback((id: string) => {
    const d = PREDEFINED_DJELATNOSTI.find(item => item.id === id);
    if (d) {
      setSelectedDjelatnostId(d.id);
      setKpdSifra(d.kpdSifra);
      setKpdNaziv(d.kpdNaziv);
    }
  }, []);

  // Učitaj ogledne edukativne podatke (Orlando Libertas) ako korisnik želi primjer
  const loadExampleData = useCallback(() => {
    setNaziv('Orlando Libertas, obrt za programiranje i savjetovanje');
    setVlasnikImePrezime('Vlaho Sorkočević');
    setOib('69435151530');
    setUlicaIBroj('Placa Stradun 1');
    setPostanskiBroj('20000');
    setMjesto('Dubrovnik');
    setIban('HR6023600001101234567');
    selectDjelatnost('it-dev');
    logger.info('Učitani ogledni edukativni podaci (Orlando Libertas) u formu na zahtjev korisnika.');
  }, [setOib, setIban, selectDjelatnost, logger]);

  // Glasovna reprodukcija za trenutni korak
  const playCurrentStepDialogue = useCallback((stepNumber: number) => {
    if (audioTransport.isMuted) return;
    const dialogue = ONBOARDING_DIALOGUES[stepNumber];
    if (dialogue && dialogue.speechText) {
      audioTransport.playMessage(`onboarding-step-${stepNumber}`, dialogue.speechText);
    }
  }, [audioTransport]);

  const lastSpokenRef = useRef<{ step: number; isOpen: boolean }>({ step: 0, isOpen: false });

  // Pokreni govor pri otvaranju ili promjeni koraka (uz zaštitu od rekurzivnih loopova)
  useEffect(() => {
    if (isOpen) {
      if (lastSpokenRef.current.step !== step || !lastSpokenRef.current.isOpen) {
        lastSpokenRef.current = { step, isOpen: true };
        playCurrentStepDialogue(step);
      }
    } else {
      lastSpokenRef.current.isOpen = false;
    }
  }, [isOpen, step, playCurrentStepDialogue]);

  const goToNextStep = useCallback(() => {
    if (!isStepValid(step)) {
      logger.warn('Navigacija na sljedeći korak odbijena: korak nije validan', { step });
      return;
    }
    setStep(prev => Math.min(totalSteps, prev + 1));
  }, [step, isStepValid, totalSteps, logger]);

  const goToPrevStep = useCallback(() => {
    setStep(prev => Math.max(1, prev - 1));
  }, []);

  const replaySpeech = useCallback(() => {
    playCurrentStepDialogue(step);
  }, [playCurrentStepDialogue, step]);

  const openWizard = useCallback(() => {
    setStep(1);
    setIsOpen(true);
  }, []);

  const closeWizard = useCallback(() => {
    setIsOpen(false);
    audioTransport.stop();
  }, [audioTransport]);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsCompleted(true);
    closeWizard();
    logger.info('Korisnik je preskočio onboarding.');
  }, [closeWizard, logger]);

  // Učitavanje gotovih demo podataka za brzi pregled
  const applyDemoData = useCallback(async () => {
    const demoProfil: ObrtProfil = {
      id: 'obrt-demo',
      naziv: 'Orlando Libertas, obrt za programiranje i savjetovanje',
      vlasnikImePrezime: 'Vlaho Sorkočević',
      oib: '69435151530',
      ulicaIBroj: 'Placa Stradun 1',
      postanskiBroj: '20000',
      mjesto: 'Dubrovnik',
      drzavaIso: 'HR',
      email: 'libertas@obrtniq.hr',
      iban: 'HR6023600001101234567',
      jePausalist: true,
      uSustavuPdv: false,
      poslovniProstorOznaka: 'POSL1',
      naplatniUredjajOznaka: '1',
      eracunPosrednik: 'FINA',
    };

    setNaziv(demoProfil.naziv);
    setVlasnikImePrezime(demoProfil.vlasnikImePrezime);
    setOib(demoProfil.oib);
    setUlicaIBroj(demoProfil.ulicaIBroj);
    setPostanskiBroj(demoProfil.postanskiBroj);
    setMjesto(demoProfil.mjesto);
    setIban(demoProfil.iban);
    selectDjelatnost('it-dev');

    await dexieStorage.obrt.saveProfil(demoProfil);
    onProfilUpdated?.(demoProfil);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsCompleted(true);
    setStep(5); // Skoči izravno na zadnji korak za izdavanje prvog računa
    logger.info('Učitani demo podaci u profil obrta.');
  }, [setOib, setIban, selectDjelatnost, onProfilUpdated, logger]);

  // Završetak onboardinga i kreiranje profila
  const completeOnboarding = useCallback(async (onSuccessCreatedInvoice?: () => void) => {
    try {
      const finalProfil: ObrtProfil = {
        id: currentProfil?.id || 'obrt-glavni',
        naziv: naziv.trim() || 'Moj Paušalni Obrt',
        vlasnikImePrezime: vlasnikImePrezime.trim() || 'Vlasnik Obrta',
        oib: oib.trim() || '69435151530',
        ulicaIBroj: ulicaIBroj.trim() || 'Stradun 1',
        postanskiBroj: postanskiBroj.trim() || '20000',
        mjesto: mjesto.trim() || 'Dubrovnik',
        drzavaIso: 'HR',
        email: 'kontakt@obrt.hr',
        iban: iban.trim() || 'HR6023600001101234567',
        jePausalist: true,
        uSustavuPdv: false,
        poslovniProstorOznaka: 'POSL1',
        naplatniUredjajOznaka: '1',
        eracunPosrednik: 'FINA',
        logoImageData,
        pecatPotpisImageData,
      };

      await dexieStorage.obrt.saveProfil(finalProfil);
      onProfilUpdated?.(finalProfil);

      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setIsCompleted(true);

      logger.info('Onboarding uspješno završen!', { oib: finalProfil.oib, naziv: finalProfil.naziv });
      onSuccessCreatedInvoice?.();
      closeWizard();
    } catch (err: any) {
      logger.error('Greška pri završetku onboardinga:', { error: err?.message || String(err) });
    }
  }, [
    currentProfil,
    naziv,
    vlasnikImePrezime,
    oib,
    ulicaIBroj,
    postanskiBroj,
    mjesto,
    iban,
    logoImageData,
    pecatPotpisImageData,
    onProfilUpdated,
    closeWizard,
    logger,
  ]);

  return {
    isOpen,
    step,
    totalSteps,
    isFirstRun: !isCompleted,
    canGoNext,
    isStepValid,
    naziv,
    vlasnikImePrezime,
    oib,
    isOibValid,
    ulicaIBroj,
    postanskiBroj,
    mjesto,
    iban,
    isIbanValid,
    detectedBank,
    selectedDjelatnostId,
    kpdSifra,
    kpdNaziv,
    selectedTheme,
    logoImageData,
    pecatPotpisImageData,
    setNaziv,
    setVlasnikImePrezime,
    setOib,
    setUlicaIBroj,
    setPostanskiBroj,
    setMjesto,
    setIban,
    selectDjelatnost,
    setSelectedTheme,
    setLogoImageData,
    setPecatPotpisImageData,
    loadExampleData,
    setStep,
    goToNextStep,
    goToPrevStep,
    openWizard,
    closeWizard,
    isMuted: audioTransport.isMuted,
    toggleMute: audioTransport.toggleMute,
    replaySpeech,
    applyDemoData,
    skipOnboarding,
    completeOnboarding,
  };
}
