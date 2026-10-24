import type { ObrtProfilData, PartnerFormData, FormItem } from './types';

export const DEFAULT_OBRT_PROFIL: ObrtProfilData = {
  id: 'obrt-1',
  naziv: 'Robot Hand Made, obrt za računalno programiranje',
  vlasnikImePrezime: 'Matija Obrtović',
  oib: '69435151530',
  ulicaIBroj: 'Ulica grada Vukovara 284',
  postanskiBroj: '40000',
  mjesto: 'Čakovec',
  drzavaIso: 'HR',
  email: 'info@robothandmade.hr',
  iban: 'HR3123600001101234567',
  jePausalist: true,
  uSustavuPdv: false,
  poslovniProstorOznaka: 'POSL1',
  naplatniUredjajOznaka: '1',
  eracunPosrednik: 'FINA',
};

export const DEFAULT_PARTNER_DATA: PartnerFormData = {
  partnerNaziv: 'Domaći Kupac Čistoća i Održavanje d.o.o.',
  oib: '69435151530',
  isOibValid: true,
  taxZone: 'DOMACI_B2B',
  iban: 'HR3123600001101234567',
  isIbanValid: true,
  detectedBank: 'Zagrebačka banka d.d.',
  nacinPlacanja: 'Transakcijski račun',
};

export const DEFAULT_INITIAL_ITEMS: FormItem[] = [
  {
    id: 'item-1',
    kpdSifra: '62.01.11',
    kpdNaziv: 'Usluge dizajna i razvoja aplikacijskog softvera',
    kolicina: 1,
    jedinicaMjere: 'sat',
    cijena: 1250.00,
  },
];
