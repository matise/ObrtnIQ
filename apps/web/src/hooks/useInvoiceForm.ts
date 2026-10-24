import { useState, useMemo, useCallback } from 'react';
import type { PoreznaZona, Dokument } from '@obrtniq/core';
import type { PartnerFormData } from '../engine/types';
import { DEFAULT_PARTNER_DATA } from '../engine/obrt-profile';

export interface UseInvoiceFormReturn {
  partnerNaziv: string;
  setPartnerNaziv: (val: string) => void;
  oib: string;
  setOib: (val: string) => void;
  isOibValid: boolean;
  setIsOibValid: (val: boolean) => void;
  taxZone: PoreznaZona;
  setTaxZone: (val: PoreznaZona) => void;
  iban: string;
  setIban: (val: string) => void;
  isIbanValid: boolean;
  setIsIbanValid: (val: boolean) => void;
  detectedBank?: string;
  setDetectedBank: (val?: string) => void;
  nacinPlacanja: string;
  setNacinPlacanja: (val: string) => void;
  isPartnerFormValid: boolean;
  partnerData: PartnerFormData;
  hydrateFromDocument: (doc: Dokument) => void;
  resetPartnerForm: () => void;
}

export function useInvoiceForm(): UseInvoiceFormReturn {
  const [partnerNaziv, setPartnerNaziv] = useState(DEFAULT_PARTNER_DATA.partnerNaziv);
  const [oib, setOib] = useState(DEFAULT_PARTNER_DATA.oib);
  const [isOibValid, setIsOibValid] = useState(DEFAULT_PARTNER_DATA.isOibValid);
  const [taxZone, setTaxZone] = useState<PoreznaZona>(DEFAULT_PARTNER_DATA.taxZone);
  const [iban, setIban] = useState(DEFAULT_PARTNER_DATA.iban);
  const [isIbanValid, setIsIbanValid] = useState(DEFAULT_PARTNER_DATA.isIbanValid);
  const [detectedBank, setDetectedBank] = useState<string | undefined>(DEFAULT_PARTNER_DATA.detectedBank);
  const [nacinPlacanja, setNacinPlacanja] = useState(DEFAULT_PARTNER_DATA.nacinPlacanja);

  const isPartnerFormValid = useMemo(() => {
    return partnerNaziv.trim().length > 0 && isOibValid && isIbanValid;
  }, [partnerNaziv, isOibValid, isIbanValid]);

  const partnerData: PartnerFormData = useMemo(() => ({
    partnerNaziv,
    oib,
    isOibValid,
    taxZone,
    iban,
    isIbanValid,
    detectedBank,
    nacinPlacanja,
  }), [partnerNaziv, oib, isOibValid, taxZone, iban, isIbanValid, detectedBank, nacinPlacanja]);

  const hydrateFromDocument = useCallback((doc: Dokument) => {
    if (doc.partnerNazivSnapshot) setPartnerNaziv(doc.partnerNazivSnapshot);
    if (doc.partnerOibSnapshot) {
      setOib(doc.partnerOibSnapshot);
      setIsOibValid(true);
    }
    if (doc.iban) {
      setIban(doc.iban);
      setIsIbanValid(true);
    }
    if (doc.nacinPlacanja) {
      setNacinPlacanja(
        doc.nacinPlacanja === 'GOTOVINA'
          ? 'Gotovina'
          : doc.nacinPlacanja === 'KARTICA'
          ? 'Kartica'
          : 'Transakcijski račun'
      );
    }
  }, []);

  const resetPartnerForm = useCallback(() => {
    setPartnerNaziv(DEFAULT_PARTNER_DATA.partnerNaziv);
    setOib(DEFAULT_PARTNER_DATA.oib);
    setIsOibValid(DEFAULT_PARTNER_DATA.isOibValid);
    setTaxZone(DEFAULT_PARTNER_DATA.taxZone);
    setIban(DEFAULT_PARTNER_DATA.iban);
    setIsIbanValid(DEFAULT_PARTNER_DATA.isIbanValid);
    setDetectedBank(DEFAULT_PARTNER_DATA.detectedBank);
    setNacinPlacanja(DEFAULT_PARTNER_DATA.nacinPlacanja);
  }, []);

  return {
    partnerNaziv,
    setPartnerNaziv,
    oib,
    setOib,
    isOibValid,
    setIsOibValid,
    taxZone,
    setTaxZone,
    iban,
    setIban,
    isIbanValid,
    setIsIbanValid,
    detectedBank,
    setDetectedBank,
    nacinPlacanja,
    setNacinPlacanja,
    isPartnerFormValid,
    partnerData,
    hydrateFromDocument,
    resetPartnerForm,
  };
}
