// apps/web/src/services/onboarding-dialogues.ts
// ObrtnIQ — Dijalozi, replike i glasovni scenarij Žiga Gospara za Onboarding Wizard

export interface OnboardingDialogueStep {
  step: number;
  title: string;
  shortTitle: string;
  speechText: string;
  subtitle: string;
  emphasisPhrase: string;
  mentorTip: string;
}

export const ONBOARDING_STEPS_META = [
  { step: 1, label: 'Pozdrav & Odabir', icon: 'app-seal' },
  { step: 2, label: 'Kapetan Obrta', icon: 'b2b-partners' },
  { step: 3, label: 'Banka & Djelatnost', icon: 'kpr-tower' },
  { step: 4, label: 'Boje & Pečat', icon: 'obrt-tools' },
  { step: 5, label: 'Prvi Rez', icon: 'invoice-document' },
];

export const ONBOARDING_DIALOGUES: Record<number, OnboardingDialogueStep> = {
  1: {
    step: 1,
    title: 'Sjedni i odahni, gosparu',
    shortTitle: 'Uvod',
    speechText:
      'Pozdravljam te, gosparu! Ja sam Žigo, digitalni Orlando ove naše Kripto-Republike. ' +
      'Ako ti srce malo brže lupa od same pomisli na poreznu, obrasce i zakone, na pravom si mjestu. ' +
      'Ovdje si svoj na svome. Nema pretplate, nema servera koji ti njuškaju po računima. ' +
      'Dok popiješ gutljaj kave, mi ćemo tvoj obrt usidriti i izdati tvoj prvi račun.',
    subtitle:
      'Pozdravljam te, gosparu! Ja sam Žigo, digitalni Orlando. Sjedni i odahni — tvoj obrt je tvoja sloboda. ' +
      'Ovdje nema vanjskih servera, podaci su samo u tvom pregledniku.',
    emphasisPhrase: 'tvoj obrt je tvoja sloboda',
    mentorTip: 'ObrtnIQ je 100% lokalna aplikacija (Local-First). Sve što uneseš ostaje zaključano na tvom uređaju.',
  },
  2: {
    step: 2,
    title: 'Tko drži kormilo ovog obrta?',
    shortTitle: 'Kapetan',
    speechText:
      'Prvo ono najvažnije: tko je kapetan ove lađe? Daj mi tvoj OIB, naziv obrta i tvoje ime. ' +
      'I ne brini ako se zabuniš u brojkama — ja provjeravam kontrolnu znamenku po ISO MOD 11 algoritmu u letu. ' +
      'Prije Porezne uprave ćemo sve provjeriti i ispraviti.',
    subtitle:
      'Tko drži kormilo ove lađe? Unesi OIB, naziv obrta i sjedište. ' +
      'Kontrolnu znamenku provjeravam u milisekundi prije nego podatak ikad dođe do Porezne.',
    emphasisPhrase: 'provjeravam kontrolnu znamenku u letu',
    mentorTip: 'OIB mora imati točno 11 znamenki. Zeleni bedž označava matematički valjan OIB prema ISO 7064 MOD 11.',
  },
  3: {
    step: 3,
    title: 'Kuda teku dukati i što radimo?',
    shortTitle: 'Financije',
    speechText:
      'Odlično, kapetane. Sad mi reci kamo kupci uplaćuju tvoj pošteni trud. Upiši svoj IBAN — ' +
      'čim uneseš vodeći broj, sam ću prepoznati banku. I nemoj razbijati glavu s poreznim razredima: ' +
      'paušalni obrt ima jednostavan zakon, a prag od 40.000 eura pratit ćemo zajedno — ja ti javljam kad dođeš blizu.',
    subtitle:
      'Kamo kupci uplaćuju tvoj trud? Unesi IBAN uz automatsku detekciju banke. ' +
      'Paušalni prag od 40.000 € pratimo zajedno u stvarnom vremenu.',
    emphasisPhrase: 'prag od 40.000 eura pratimo zajedno',
    mentorTip: 'Paušalni obrtnici u 2026. ne obračunavaju PDV (čl. 90. Zakona o PDV-u) sve do praga od 40.000 €.',
  },
  4: {
    step: 4,
    title: 'Boje i stijeg tvoje galije',
    shortTitle: 'Memorandum',
    speechText:
      'Svaki dubrovački trgovački brod imao je svoj stijeg i pečat. Tvoj račun je tvoja posjetnica u svijetu. ' +
      'Izaberi boje pod kojima ploviš, a ako imaš logo, samo ga povuci ovamo. ' +
      'Ako nemaš, nema brige — složit ćemo oštar digitalni pečat s tvojim OIB-om.',
    subtitle:
      'Tvoj račun je tvoja posjetnica. Izaberi jednu od 5 dubrovačkih tema i postavi ' +
      'memorandum svog obrta za kristalno čist A4 ispis.',
    emphasisPhrase: 'Tvoj račun je tvoja posjetnica',
    mentorTip: 'Sve teme su usklađene s dubrovačkom tradicijom (Knežev Purpur, Zelenci s Luže, Jadranska Bonaca, Dubrovački Dukat, Klesani Kamen).',
  },
  5: {
    step: 5,
    title: 'Prvi Rez — Krštenje prvog računa',
    shortTitle: 'Prvi Rez',
    speechText:
      'Evo ga, gosparu! Sve smo postavili. Da razbijemo i zadnji atom treme, složio sam ti tvoj prvi račun — ' +
      'Račun broj 1-1-1. Pogledaj ga: tu je tvoj memorandum, tvoj IBAN i gotova HUB-3 uplatnica s barkodom. ' +
      'Klikni na "Izdaj moj prvi račun" i u igri si!',
    subtitle:
      'Sve je spremno za tvoj prvi račun (Br. 1-1-1). Pregledaj ga u živom A4 prikazu ' +
      'i jednim potezom probij led.',
    emphasisPhrase: 'probij led jednim potezom',
    mentorTip: 'Izdavanjem računa otvara se Knjiga prometa (KPR), a gotov PDF s barkodom spreman je za slanje kupcu.',
  },
};

export interface EducationalTip {
  title: string;
  summary: string;
  details: string[];
  example: {
    naziv: string;
    vlasnik: string;
    oib: string;
    adresa: string;
    iban?: string;
    djelatnost?: string;
  };
}

export const ONBOARDING_EDUCATIONAL_TIPS: Record<number, EducationalTip> = {
  2: {
    title: 'Kako ispravno imenovati obrt i zašto je OIB ključan?',
    summary: 'Pravila imenovanja prema Zakonu o obrtu i provjera OIB-a u stvarnom vremenu.',
    details: [
      'Naziv obrta prema Zakonu o obrtu sadrži: ime obrta, vrstu djelatnosti i tvoje ime (npr. "Orlando Libertas, obrt za savjetovanje, vl. Vlaho Sorkočević").',
      'OIB se sastoji od 11 znamenki. Zadnja znamenka je kontrolna (ISO 7064 MOD 11, 10). ObrtnIQ je provjerava u letu prije slanja na Poreznu.',
      'Adresa sjedišta je lokacija na kojoj je obrt registriran u obrtnom registru.'
    ],
    example: {
      naziv: 'Orlando Libertas, obrt za programiranje i savjetovanje',
      vlasnik: 'Vlaho Sorkočević',
      oib: '69435151530',
      adresa: 'Placa Stradun 1, 20000 Dubrovnik'
    }
  },
  3: {
    title: 'Poslovni račun (IBAN) i KPD 2025 šifarnik',
    summary: 'Kamo sjedaju uplate kupaca i koja je službena šifra tvoje djelatnosti.',
    details: [
      'Paušalni obrt prima uplate na poslovni ili multivalutni žiro-račun. Format počinje s HR i ima 21 znak.',
      'KPD 2025 je službena Klasifikacija proizvoda po djelatnostima obvezna na svim računima u RH.',
      'Godišnji prag za paušaliste je 40.000 € (čl. 90. Zakona o PDV-u). Dok si ispod, ne obračunavaš PDV.'
    ],
    example: {
      naziv: 'Orlando Libertas',
      vlasnik: 'Vlaho Sorkočević',
      oib: '69435151530',
      adresa: 'Placa Stradun 1, 20000 Dubrovnik',
      iban: 'HR6023600001101234567',
      djelatnost: '62.01.11 — Usluge razvoja aplikacijskog softvera'
    }
  }
};

export const ONBOARDING_DYNAMIC_REACTIONS = {
  oibValid: 'Tako je, OIB štima po ISO kontrolnoj formuli (MOD 11)! Čist OIB.',
  oibInvalid: 'Polako gosparu, kontrolna znamenka se ne slaže. Provjeri još jednom.',
  ibanDetected: (bankName: string) => `Odlično, prepoznata je ${bankName}. Tu će stizati pošteni dukati i HUB-3 uplatnice.`,
  firstInvoiceIssued:
    'Svaka čast, gosparu! Led je probijen, račun 1-1-1 je u arhivi, a strah je ostao iza zidina. ' +
    'Sad si gazda u svojoj kući. Kad god zatrebaš savjet, samo me pozovi.',
};

export function getOibReactionDialogue(isValid: boolean): string {
  return isValid ? ONBOARDING_DYNAMIC_REACTIONS.oibValid : ONBOARDING_DYNAMIC_REACTIONS.oibInvalid;
}

export function getBankReactionDialogue(bankName?: string | null): string {
  if (bankName) {
    return ONBOARDING_DYNAMIC_REACTIONS.ibanDetected(bankName);
  }
  return 'Upiši svoj HR IBAN (21 znak). Čim uneseš vodeće brojeve, prepoznajemo banku.';
}

export function getCompletionCongratulation(naziv?: string): string {
  return (
    `Svaka čast gosparu! ${naziv ? `Obrt "${naziv}"` : 'Tvoj obrt'} je usidren u Dubrovačkoj Kripto-Republici. ` +
    'Prvi račun je izdan, strah je nestao, a sloboda (Libertas) počinje. Sretno i pošteno!'
  );
}
