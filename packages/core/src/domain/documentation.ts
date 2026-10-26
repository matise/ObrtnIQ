// packages/core/src/domain/documentation.ts
// ObrtnIQ v3.0 — Sustav Dokumentacije, Faza Izgradnje i Implementacijskog Manifesta

export type PhaseStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED';

export interface GateCheckItem {
  name: string;
  passed: boolean;
  verificationDetail: string;
}

export interface ImplementationPhase {
  id: string;               // Jedinstveni identifikator, npr. "faza-05"
  code: string;             // Prikazna oznaka, npr. "FAZA 5"
  title: string;            // Naziv faze, npr. "Workflow, Multi-Stavke & Immutability"
  status: PhaseStatus;
  completedDate?: string;   // Datum dovršetka, npr. "2026-03-15"
  summary: string;          // Sažetak za karticu i brzi pregled
  description: string;      // Detaljni tehnički opis i arhitektonska namjena
  iconName: string;         // Ime ikone iz ObrtIcon sustava
  gateChecks: GateCheckItem[];
  relatedFiles: string[];   // Putanje prema kôdu i dokumentaciji
  tags: string[];           // Ključne riječi za pretragu
}

export interface SystemDocReference {
  slug: string;
  title: string;
  category: 'MANIFEST' | 'ARCHITECTURE' | 'COMPLIANCE' | 'PLAN' | 'USER_GUIDE';
  filePath: string;
  description: string;
}

/**
 * Cjeloviti registar faza izgradnje ObrtnIQ sustava (Faza 0-2 do Faza 20)
 */
export const OBRTNIQ_PHASES: ImplementationPhase[] = [
  {
    id: 'faza-00-02',
    code: 'FAZA 0-2',
    title: 'Domena & Baza',
    status: 'COMPLETED',
    completedDate: '2026-01-10',
    summary: 'OIB MOD 11, IBAN MOD 97, kalkulator i Dexie IndexedDB perzistencija.',
    description: 'Temeljna domenska logika hrvatskog obrtništva. Validatori prema ISO 7064 MOD 11,10 za OIB i MOD 97 za HR IBAN. Potpuno lokalna perzistencija u pregledniku putem Dexie.js (IndexedDB) bez ovisnosti o vanjskim poslužiteljima.',
    iconName: 'crypto-vault',
    gateChecks: [
      { name: 'OIB MOD 11 provjera', passed: true, verificationDetail: 'ISO 7064 MOD 11,10 algoritam s kontrolnim znamenkama verificiran s 50+ testnih OIB-ova.' },
      { name: 'HR IBAN MOD 97 provjera', passed: true, verificationDetail: 'Verificiran format HRxx + 7 znamenki vodeći broj banke + 10 znamenki broj računa.' },
      { name: 'Kalkulator zaokruživanja (EUR)', passed: true, verificationDetail: 'Bankers rounding i preciznost na 2 decimale za eur iznose bez float grešaka.' },
      { name: 'Dexie perzistencija', passed: true, verificationDetail: 'Inicijalizirana lokalna baza ObrtnIQ_DB sa shemama za profile, partnere i dokumente.' }
    ],
    relatedFiles: [
      'packages/core/src/utils/oib.ts',
      'packages/core/src/utils/iban.ts',
      'packages/core/src/utils/calculator.ts',
      'apps/web/src/storage/dexie-db.ts'
    ],
    tags: ['Domena', 'Validacija', 'OIB', 'IBAN', 'Dexie', 'Baza']
  },
  {
    id: 'faza-03',
    code: 'FAZA 3',
    title: 'Sharp UI & Dinamičke Teme',
    status: 'COMPLETED',
    completedDate: '2026-01-20',
    summary: 'Specijalizirane UI komponente, KpdPicker i HSL rotacija tema.',
    description: 'Razvoj specifičnih obrtničkih UI kontrola (OibInput s detekcijom valjanosti, IbanInput s automatskim prepoznavanjem banke, CurrencyInput). Dinamički HSL engine s temama inspiriranim Dubrovnikom: Dubrovačka Noć, Dubrovački Dan, Klesani Kamen i Neonska Noć.',
    iconName: 'app-seal',
    gateChecks: [
      { name: 'OibInput & IbanInput formatiranje', passed: true, verificationDetail: 'Automatsko formatiranje s vizualnim zelenim/crvenim bedžem valjanosti.' },
      { name: 'KpdPicker katalog', passed: true, verificationDetail: 'Integriran službeni Klasifikator Proizvoda po Djelatnostima 2025.' },
      { name: '100% pokrivenost HSL varijablama', passed: true, verificationDetail: 'Sve UI komponente koriste CSS tokene bez fiksnih boja.' }
    ],
    relatedFiles: [
      'apps/web/src/components/controls/OibInput.tsx',
      'apps/web/src/components/controls/IbanInput.tsx',
      'apps/web/src/components/ThemeSelector.tsx',
      'apps/web/src/index.css'
    ],
    tags: ['UI', 'Teme', 'HSL', 'KPD', 'Kontrole']
  },
  {
    id: 'faza-04',
    code: 'FAZA 4',
    title: 'HUB-3 & A4 PDF Generator',
    status: 'COMPLETED',
    completedDate: '2026-02-01',
    summary: 'HUB-3 PDF417 bar-kod, EPC QR kod, ISO 32000-1 i službeni A4 PDF.',
    description: 'Generiranje standardiziranih hrvatskih uplatnica HUB-3 (s dvodimenzionalnim bar-kodom PDF417) i europskih EPC QR kodova (SEPA Credit Transfer). Klijentski A4 PDF generator sukladan ISO 32000-1 s integriranim memorandumom i pečatom obrta.',
    iconName: 'invoice-document',
    gateChecks: [
      { name: 'HUB-3 PDF417 barkod', passed: true, verificationDetail: 'Verificiran prema specifikaciji Hrvatske udruge banaka.' },
      { name: 'EPC SEPA QR kod', passed: true, verificationDetail: 'Usklađen s EPC069-12 europskim standardom za mobilno bankarstvo.' },
      { name: 'A4 PDF ispis', passed: true, verificationDetail: 'Pikselno precizan A4 ispis s memorandumom, QR kodom i specifikacijom stavaka.' }
    ],
    relatedFiles: [
      'packages/core/src/utils/hub3.ts',
      'packages/core/src/utils/epc-qr.ts',
      'apps/web/src/components/InvoiceLivePreview.tsx'
    ],
    tags: ['HUB-3', 'PDF417', 'EPC QR', 'PDF', 'A4']
  },
  {
    id: 'faza-04-5',
    code: 'FAZA 4.5',
    title: 'Logging Engine & Telemetrija',
    status: 'COMPLETED',
    completedDate: '2026-02-10',
    summary: 'Cirkularni spremnik (RingBuffer 500), UI konzola i sanitizirani izvoz.',
    description: 'Potpuno klijentski sustav bilježenja događaja i dijagnostike s kružnim međuspremnikom od 500 poruka. Zaštita privatnosti kroz automatsku sanitizaciju OIB-a i osobnih podataka prije izvoza u JSON dnevnik.',
    iconName: 'telemetry-terminal',
    gateChecks: [
      { name: 'RingBuffer 500 kapacitet', passed: true, verificationDetail: 'FIFO kružni međuspremnik zadržava zadnjih 500 unosa bez curenja memorije.' },
      { name: 'UI Konzola dnevnika', passed: true, verificationDetail: 'Pretraživa in-app konzola s filterima po razinama (INFO, WARN, ERROR).' },
      { name: 'Sanitizirani izvoz', passed: true, verificationDetail: 'OIB i osjetljivi podaci se maskiraju pri preuzimanju JSON datoteke.' }
    ],
    relatedFiles: [
      'packages/core/src/logger/index.ts',
      'apps/web/src/components/SystemLogDrawer.tsx',
      'apps/web/src/services/logger.ts'
    ],
    tags: ['Logging', 'RingBuffer', 'Telemetrija', 'Sigurnost']
  },
  {
    id: 'faza-05',
    code: 'FAZA 5',
    title: 'Workflow, Multi-Stavke & Immutability',
    status: 'COMPLETED',
    completedDate: '2026-02-25',
    summary: 'Multi-stavke uz Alt+N, F2 brzo izdavanje, trajno zakonsko zaključavanje i storno.',
    description: 'Operativni tijek računa sa statusnim automatom: Nacrt -> Izdano -> Plaćeno / Stornirano. Zakonsko zaključavanje izdanog računa (immutability) koje jamči da se izdani račun ne može retroaktivno mijenjati, te kreiranje storno para s referencom na izvorni račun bez rupa u nizu brojeva.',
    iconName: 'b2b-partners',
    gateChecks: [
      { name: 'Alt+N & F2 prečaci', passed: true, verificationDetail: 'Trenutno dodavanje stavaka i izdavanje tipkovnicom bez miša.' },
      { name: 'Zakonsko zaključavanje (Immutability)', passed: true, verificationDetail: 'Sva polja forme postaju read-only nakon izdavanja računa.' },
      { name: 'Storno automatika', passed: true, verificationDetail: 'Generiranje storno računa sa suprotnim predznakom i novim rednim brojem.' }
    ],
    relatedFiles: [
      'packages/core/src/domain/workflow.ts',
      'apps/web/src/components/desk/InvoiceDesk.tsx',
      'apps/web/src/hooks/useInvoiceWorkflow.ts'
    ],
    tags: ['Workflow', 'Immutability', 'Storno', 'F2', 'Stavke']
  },
  {
    id: 'faza-06',
    code: 'FAZA 6',
    title: 'KPR & Obrazac PO-SD',
    status: 'COMPLETED',
    completedDate: '2026-03-05',
    summary: 'Knjiga prometa (KPR), praćenje praga 40.000 €, kvartali i ePorezna PO-SD XML.',
    description: 'Automatsko vođenje Knjige prometa (KPR) s evidencijom naplaćenih iznosa po kvartalima. Praćenje zakonskog paušalnog praga od 40.000 € u realnom vremenu uz vizualne pragove upozorenja (30k, 36k, 40k €). Generiranje službenog XML obrasca PO-SD za izravan uvoz u sustav ePorezna.',
    iconName: 'kpr-tower',
    gateChecks: [
      { name: 'Automatski KPR upis', passed: true, verificationDetail: 'Označavanje računa plaćenim automatski stvara stavku u Knjizi prometa.' },
      { name: 'Prag 40.000 € praćenje', passed: true, verificationDetail: 'Dinamički widget s postotkom iskorištenosti i promjenom boje.' },
      { name: 'PO-SD XML generator', passed: true, verificationDetail: 'Validiran XML format prema službenoj Poreznoj upravi RH shemi.' }
    ],
    relatedFiles: [
      'packages/core/src/domain/kpr.ts',
      'packages/core/src/domain/posd-xml.ts',
      'apps/web/src/components/bookkeeping/KprWorkspaceTab.tsx'
    ],
    tags: ['KPR', 'PO-SD', 'ePorezna', 'XML', 'Kvartali', '40k Prag']
  },
  {
    id: 'faza-07',
    code: 'FAZA 7',
    title: 'Fiskalizacija 1.0 & Fiskalizacija 2.0 (e-Račun)',
    status: 'COMPLETED',
    completedDate: '2026-03-18',
    summary: 'ZKI, JIR, CIS SOAP, FINA certifikati i UBL 2.1 CIUS-HR e-Račun.',
    description: 'Implementacija dvostruke fiskalizacije: Fiskalizacija 1.0 za gotovinske račune (potpisivanje certifikatom, izračun ZKI MD5/RSA, SOAP razmjena s Poreznom upravom za JIR, offline protokol), te Fiskalizacija 2.0 za e-Račune (generiranje standardnog UBL 2.1 XML formata sukladno CIUS-HR normi za B2B/B2G).',
    iconName: 'fiscal-quill',
    gateChecks: [
      { name: 'ZKI izračun (Zaštitni kod izdavača)', passed: true, verificationDetail: 'MD5 hash potpisan privatnim ključem FINA certifikata.' },
      { name: 'SOAP CIS komunikacija', passed: true, verificationDetail: 'Obrada odgovora s JIR kodom uz fallback na 48h offline protokol.' },
      { name: 'UBL 2.1 CIUS-HR e-Račun', passed: true, verificationDetail: 'Generiranje strukturiranog XML-a za FINA / moj-eRačun posrednike.' }
    ],
    relatedFiles: [
      'packages/core/src/domain/fiskalizacija.ts',
      'packages/core/src/domain/ubl-eracun.ts',
      'packages/core/src/domain/certificate-vault.ts',
      'apps/web/src/components/FiscalDrawer.tsx'
    ],
    tags: ['Fiskalizacija', 'ZKI', 'JIR', 'UBL 2.1', 'CIUS-HR', 'e-Račun']
  },
  {
    id: 'faza-08',
    code: 'FAZA 8',
    title: 'Postavke Obrta, Logo & Pečat',
    status: 'COMPLETED',
    completedDate: '2026-03-25',
    summary: 'Profil obrta, adresar partnera s OIB pretragom, memorandum i digitalni pečat.',
    description: 'Upravljanje temeljnim podacima paušalnog obrta: naziv, vlasnik, OIB, IBAN, adresa, djelatnost, podaci o banci. Učitavanje logotipa obrta i digitalnog pečata s potpisom u visokoj rezoluciji. B2B adresar poslovnih partnera s automatskim popunjavanjem na računu.',
    iconName: 'obrt-tools',
    gateChecks: [
      { name: 'Profil obrta perzistencija', passed: true, verificationDetail: 'Spremanje profila u Dexie obrtProfil s trenutnim osvježavanjem PDF prikaza.' },
      { name: 'Učitavanje logotipa i potpisa', passed: true, verificationDetail: 'Lokalna obrada slika u Base64 format s automatskim smještanjem na memorandum.' },
      { name: 'B2B Adresar partnera', passed: true, verificationDetail: 'Evidencija poslovnih partnera s poreznom zonom i IBAN-om.' }
    ],
    relatedFiles: [
      'apps/web/src/components/SettingsDrawer.tsx',
      'apps/web/src/components/PartnerDrawer.tsx',
      'apps/web/src/hooks/useObrtProfile.ts'
    ],
    tags: ['Postavke', 'Profil', 'Logo', 'Pečat', 'Partneri', 'Memorandum']
  },
  {
    id: 'faza-09',
    code: 'FAZA 9',
    title: 'Cjenik Artikala & Kriptirani Backup',
    status: 'COMPLETED',
    completedDate: '2026-04-02',
    summary: 'Katalog usluga i artikala s KPD 2025, KPR CSV izvoz i AES-256 backup.',
    description: 'Centralni šifarnik artikala i usluga s jediničnim cijenama i službenim KPD 2025 šiframa. Mogućnost spremanja stavke izravno s računa u cjenik jednim klikom. Izvoz Knjige prometa u CSV format za knjigovođu, te sigurna AES-256 enkripcija cijele baze u prenosivu datoteku.',
    iconName: 'catalog-pricing',
    gateChecks: [
      { name: 'Cjenik s KPD poveznicom', passed: true, verificationDetail: 'Pretraga i odabir artikala s automatskim unosom opisa i cijene na račun.' },
      { name: 'AES-256 kriptirana arhiva', passed: true, verificationDetail: 'Lokalno kriptiranje i dekriptiranje cijele Dexie baze s korisničkom lozinkom.' },
      { name: 'CSV izvoz prometa', passed: true, verificationDetail: 'Formatiran CSV prema standardu za knjigovodstvene servise.' }
    ],
    relatedFiles: [
      'packages/core/src/domain/kpr-csv.ts',
      'packages/core/src/storage/crypto-backup.ts',
      'apps/web/src/components/ArticleDrawer.tsx'
    ],
    tags: ['Cjenik', 'Artikli', 'KPD 2025', 'AES-256', 'Backup', 'CSV']
  },
  {
    id: 'faza-10',
    code: 'FAZA 10',
    title: 'Google Cloud Sidro & Kripto-Sinkronizacija',
    status: 'COMPLETED',
    completedDate: '2026-04-12',
    summary: 'Google OAuth sidro, Drive AppData sinkronizacija i Gemini KPD asistencija.',
    description: 'Povezivanje s Google računom bez posredničkih servera (Client-side PKCE OAuth). Korištenje jedinstvenog 21-znamenkastog Google Sub ID-a kao kriptografskog sidra. Automatska dvosmjerna sinkronizacija kriptirane baze na privatni korisnički Google Drive AppData folder.',
    iconName: 'shield-security',
    gateChecks: [
      { name: 'Google OAuth PKCE prijava', passed: true, verificationDetail: 'Sigurna prijava u pregledniku s Google Identity Services bez izlaganja tajnih ključeva.' },
      { name: 'Google Drive AppData sinkronizacija', passed: true, verificationDetail: 'Spremanje i povlačenje kriptirane baze u izolirani prostor na Driveu.' },
      { name: 'Kripto-sidro iz Google Sub ID-a', passed: true, verificationDetail: 'Izvođenje ključa PBKDF2/AES-GCM vezanog uz Google račun korisnika.' }
    ],
    relatedFiles: [
      'apps/web/src/hooks/useGoogleAuth.ts',
      'apps/web/src/hooks/useGoogleDriveSync.ts',
      'docs/plan_implementacije_faza_10.md'
    ],
    tags: ['Google Cloud', 'Drive Sync', 'OAuth', 'PKCE', 'Kripto-sidro']
  },
  {
    id: 'faza-10-5',
    code: 'FAZA 10.5',
    title: 'Gemini KPD Inteligencija',
    status: 'COMPLETED',
    completedDate: '2026-04-18',
    summary: 'Autonomna klasifikacija djelatnosti i prijedlog KPD 2025 šifri.',
    description: 'Integracija Gemini AI modela za automatsku analizu opisa usluga i stavaka na računu te trenutačni prijedlog točne četveroznamenkaste KPD 2025 šifre prema službenom Državnom zavodu za statistiku RH.',
    iconName: 'core-gear-q',
    gateChecks: [
      { name: 'Gemini Function Calling', passed: true, verificationDetail: 'Strukturirani JSON izlaz s predloženim KPD šiframa i stupnjem sigurnosti.' },
      { name: 'KPD 2025 usklađenost', passed: true, verificationDetail: 'Verificirano s 100+ primjera iz IT-a, konzaltinga, obrta i proizvodnje.' }
    ],
    relatedFiles: [
      'apps/web/src/hooks/useGeminiAssistant.ts',
      'docs/plan_implementacije_faza_10_5.md'
    ],
    tags: ['Gemini', 'KPD 2025', 'AI Klasifikacija', 'Inteligencija']
  },
  {
    id: 'faza-11',
    code: 'FAZA 11',
    title: 'Žigo Agent — Autonomni Klijentski Orlando',
    status: 'COMPLETED',
    completedDate: '2026-04-28',
    summary: 'Autonomni Gemini agent, function calling, multimodal, Žigin rez.',
    description: 'Digitalni Orlando (Žigo) — autonomni poslovni asistent s dubrovačkim integritetom. Izvršava radnje izravno na formi računa: unosi kupca, dodaje stavke, provjerava OIB i porezne propise, te vodi korisnika kroz poslovanje.',
    iconName: 'zigo-emblem',
    gateChecks: [
      { name: 'Klijentski Function Calling', passed: true, verificationDetail: 'Žigo može samostalno pozvati funkcije za popunjavanje forme i provjeru KPR-a.' },
      { name: 'Dubrovački klesani persona prompt', passed: true, verificationDetail: 'Karakter mudrog viteza Orlanda s fokusom na libertas, poštenje i zakonsku točnost.' }
    ],
    relatedFiles: [
      'apps/web/src/hooks/useZigoAgent.ts',
      'apps/web/src/components/ZigoCopilotPanel.tsx',
      'docs/arhitektura_zigo_ai_agenta.md'
    ],
    tags: ['Žigo AI', 'Agent', 'Function Calling', 'Orlando', 'Copilot']
  },
  {
    id: 'faza-12',
    code: 'FAZA 12',
    title: 'Vektorski Pečati & Favicon Engine',
    status: 'COMPLETED',
    completedDate: '2026-05-08',
    summary: 'Dubrovački SVG set (20 ikona), 5-slojni Orlando reljef i dinamički favicon.',
    description: 'Izrada unificiranog sustava oštrih vektorskih ikona inspiriranih dubrovačkim kamenom, lakom, vagom i Minčetom. Dinamički favicon koji mijenja boju u pregledniku ovisno o stanju (status računa, rad u tijeku, greška).',
    iconName: 'core-gear-q',
    gateChecks: [
      { name: '20 Sharp vektorskih ikona', passed: true, verificationDetail: 'Optimizirane višelojne SVG komponente u ObrtIcon registru.' },
      { name: 'Dinamički Canvas Favicon', passed: true, verificationDetail: 'Promjena bedža i boje favicona u pregledniku u stvarnom vremenu.' }
    ],
    relatedFiles: [
      'apps/web/src/components/icons/registry.tsx',
      'apps/web/src/components/icons/ObrtIcon.tsx',
      'docs/plan_implementacije_faza_12.md'
    ],
    tags: ['SVG', 'Ikone', 'Sharp Icons', 'Favicon', 'Dizajn']
  },
  {
    id: 'faza-13',
    code: 'FAZA 13',
    title: 'Žigo Omni-Copilot & State Bus',
    status: 'COMPLETED',
    completedDate: '2026-05-20',
    summary: 'Omni-Context sabirnica u stvarnom vremenu i usidreni Companion Mode.',
    description: 'Povezivanje svih ekrana aplikacije u jedinstvenu sabirnicu stanja (`LiveScreenContext`). Žigo u svakoj milisekundi zna što se nalazi na korisnikovom ekranu i nudi kontekstualnu pomoć.',
    iconName: 'app-seal',
    gateChecks: [
      { name: 'LiveScreenContext sabirnica', passed: true, verificationDetail: 'Reaktivno agregiranje stanja forme, stavaka, KPR-a i otvorenih ladica.' },
      { name: 'Usidreni trodijelni split ekran', passed: true, verificationDetail: 'Mogućnost sidrenja Žiga s desne strane radne plohe uz A4 preview.' }
    ],
    relatedFiles: [
      'apps/web/src/hooks/useLiveScreenContext.ts',
      'apps/web/src/components/ZigoCopilotPanel.tsx',
      'docs/plan_implementacije_faza_13_zigo_omni_copilot.md'
    ],
    tags: ['Omni-Copilot', 'State Bus', 'Context', 'Usidreni Mode']
  },
  {
    id: 'faza-14-16',
    code: 'FAZA 14-16',
    title: 'Žigo Glasovni Sustav (STT & TTS)',
    status: 'COMPLETED',
    completedDate: '2026-06-15',
    summary: 'Google STT v2, Web Speech API fallback, glasovno diktiranje i naracija.',
    description: 'Kompletan glasovni transport za razgovor sa Žigom: diktiranje računa glasom ("Dodaj stavku izrada web stranice 500 eura"), automatsko prepoznavanje govora (STT v2) i prirodna glasovna naracija odgovora (TTS).',
    iconName: 'telemetry-terminal',
    gateChecks: [
      { name: 'Glasovno prepoznavanje govora (STT)', passed: true, verificationDetail: 'Podrška za hrvatski jezik putem Google Cloud STT v2 i Web Speech API.' },
      { name: 'TTS sinteza govora', passed: true, verificationDetail: 'Govorni odgovor Žiga s audio vizualizacijom valnog oblika.' }
    ],
    relatedFiles: [
      'packages/core/src/domain/voice.ts',
      'packages/core/src/domain/audio-transport.ts',
      'apps/web/src/components/ZigoVoiceBar.tsx'
    ],
    tags: ['Glas', 'STT', 'TTS', 'Audio', 'Diktiranje']
  },
  {
    id: 'faza-17',
    code: 'FAZA 17',
    title: 'Knjigovodstvo, Doprinosi & Cash Flow',
    status: 'COMPLETED',
    completedDate: '2026-07-01',
    summary: 'MIO 1/2 i HZZO s HUB-3 uplatnicama, troškovnik, uvoz bankovnih izvoda i cash-flow.',
    description: 'Cjeloviti knjigovodstveni modul za paušalce: automatski obračun zakonskih doprinosa za mirovinsko (MIO 1 i 2) i zdravstveno osiguranje (HZZO) s generiranjem gotovih HUB-3 uplatnica i barkodova za plaćanje, evidencija poslovnih troškova, uvoz CAMT.053 / PDF bankovnih izvoda i analiza novčanog toka.',
    iconName: 'legal-scales',
    gateChecks: [
      { name: 'Obračun doprinosa za 2026.', passed: true, verificationDetail: 'Točni zakonski iznosi MIO I (15%), MIO II (5%) i HZZO (16.5%) s uplatnicama.' },
      { name: 'Uvoz bankovnih izvoda', passed: true, verificationDetail: 'Parsiranje uplata kupaca i automatsko zatvaranje računa u KPR-u.' },
      { name: 'Cash Flow projekcija', passed: true, verificationDetail: 'Usporedba prihoda, fiksnih doprinosa i operativnih troškova po mjesecima.' }
    ],
    relatedFiles: [
      'packages/core/src/domain/doprinosi.ts',
      'packages/core/src/domain/troskovi.ts',
      'packages/core/src/domain/bank-statement.ts',
      'apps/web/src/components/bookkeeping/BookkeepingWorkspaceView.tsx'
    ],
    tags: ['Knjigovodstvo', 'Doprinosi', 'MIO', 'HZZO', 'Izvodi', 'Cash Flow']
  },
  {
    id: 'faza-18',
    code: 'FAZA 18',
    title: 'Žigo Knjigovodstveni Copilot & PWA',
    status: 'COMPLETED',
    completedDate: '2026-07-20',
    summary: 'PWA offline način rada, lokalni service worker i Žigina financijska analitika.',
    description: 'ObrtnIQ kao punokrvna progresivna web aplikacija (PWA) koja se instalira na računalo ili mobitel. Potpuna funkcionalnost u offline načinu rada bez interneta. Žigo pruža savjete o poreznim rokovima i optimizaciji poslovanja.',
    iconName: 'shield-security',
    gateChecks: [
      { name: 'PWA Service Worker', passed: true, verificationDetail: 'Keširanje statičkih resursa i rad u offline modu uz Dexie bazu.' },
      { name: 'Žigo porezni savjetnik', passed: true, verificationDetail: 'Pravovremena upozorenja o dospijeću doprinosa do 15. u mjesecu.' }
    ],
    relatedFiles: [
      'apps/web/src/hooks/usePwaInstall.ts',
      'docs/plan_implementacije_faza_18_zigo_knjigovodstveni_copilot_pwa_i_analitika.md'
    ],
    tags: ['PWA', 'Offline', 'Service Worker', 'Analitika', 'Porezni Savjetnik']
  },
  {
    id: 'faza-19',
    code: 'FAZA 19',
    title: 'Modularni Workspace & In-Place Navigacija',
    status: 'COMPLETED',
    completedDate: '2026-08-10',
    summary: 'Puni in-place radni prikazi bez zamagljenja, URL hash routing i modularna arhitektura.',
    description: 'Transformacija bočnih ladica (drawers) u punopravne radne prostore pune širine (In-Place Workspace Views) s URL hash usmjeravanjem (#bookkeeping, #documents, #fiscal, #articles, #partners, #settings).',
    iconName: 'app-seal',
    gateChecks: [
      { name: 'In-Place Workspace Router', passed: true, verificationDetail: 'Trenutna navigacija kroz tabove bez gubitka unesenih podataka u formi.' },
      { name: 'Deep linking preko hasha', passed: true, verificationDetail: 'Podrška za označavanje i povratak tipkom Back u pregledniku.' }
    ],
    relatedFiles: [
      'apps/web/src/hooks/useWorkspaceRouter.ts',
      'apps/web/src/components/desk/BookkeepingWorkspaceView.tsx',
      'docs/plan_implementacije_faza_19_modularni_workspace_i_in_place_navigacija.md'
    ],
    tags: ['Workspace', 'Routing', 'In-Place', 'Hash', 'Modularnost']
  },
  {
    id: 'faza-20',
    code: 'FAZA 20',
    title: 'Poslovno Proširenje & Porezni Kalendar',
    status: 'COMPLETED',
    completedDate: '2026-09-01',
    summary: 'Porezni kalendar obveza, ponavljajući računi (recurring) i više poslovnih prostora.',
    description: 'Godišnji porezni kalendar s podsjetnicima za doprinose, PO-SD i porez na dohodak. Automatizacija ponavljajućih računa za paušalce koji imaju mjesečne ugovore o održavanju. Podrška za više poslovnih prostora i naplatnih uređaja.',
    iconName: 'bell-deadline',
    gateChecks: [
      { name: 'Porezni kalendar 2026.', passed: true, verificationDetail: 'Evidencija svih zakonskih datuma dospijeća s HUB-3 generiranjem.' },
      { name: 'Ponavljajući računi (Recurring)', passed: true, verificationDetail: 'Automatika generiranja računa na određeni dan u mjesecu.' },
      { name: 'Više poslovnih prostora', passed: true, verificationDetail: 'Podrška za oznake prostora 1, 2 i naplatnih uređaja 1, 2.' }
    ],
    relatedFiles: [
      'packages/core/src/domain/tax-calendar.ts',
      'packages/core/src/domain/recurring.ts',
      'packages/core/src/domain/premises.ts',
      'docs/plan_implementacije_faza_20_poslovno_prosirenje_i_porezni_kalendar.md'
    ],
    tags: ['Porezni Kalendar', 'Ponavljajući Računi', 'Poslovni Prostori', 'Automatizacija']
  },
  {
    id: 'faza-21',
    code: 'FAZA 21',
    title: 'UI Redizajn, Start Centar & Sustav Dokumentacije',
    status: 'COMPLETED',
    completedDate: '2026-10-26',
    summary: 'Above-the-fold radna ploha unosa, Windows-style Start Hub modal, homogeni 4-otočni toolbar i lokalni repozitorij dokumentacije.',
    description: 'Kompletni redizajn korisničkog iskustva prema načelima Dubrovačke Kripto-Republike: rasterećenje radne plohe premještanjem faza u specijalizirani DocumentationWorkspaceView, implementacija zapovjednog Start Centra (StartHubModal s prečacima Alt+S i Ctrl+K), preuređenje navigacijske trake u 4 kontekstualna otoka s unificiranim ObrtIcon ikonama (app-seal za Home) i tipkovničkim prečacima Alt+1..8 i Alt+Z, te pretvaranje bučnog dnevnika u tihi NotificationStreamButton.',
    iconName: 'app-seal',
    gateChecks: [
      { name: 'Above-The-Fold Ergonomija', passed: true, verificationDetail: 'Radna ploha i živi A4 preview nalaze se odmah na vrhu ekrana bez skrolanja.' },
      { name: 'Sustav Dokumentacije & Docs Store', passed: true, verificationDetail: 'Dvostupčani pregled svih faza i manifesta s pretragom i filtriranjem.' },
      { name: 'Start Centar (ObrtnIQ Start Hub)', passed: true, verificationDetail: 'Brze radnje, pretraga i navigacijska matrica dostupni na Alt+S i Ctrl+K.' },
      { name: 'Stilska Homogenost i 4 Kontekstualna Otoka', passed: true, verificationDetail: 'Unificirane 40x40px kapsule s razdjelnicima i Alt+1..8 tipkovničkim prečacima.' },
      { name: 'Potihi Tok Obavijesti (Notification Stream)', passed: true, verificationDetail: 'Diskretna signalizacija grešaka i upozorenja u traci bez gubitka fokusa s unosa.' }
    ],
    relatedFiles: [
      'apps/web/src/components/layout/StartHubModal.tsx',
      'apps/web/src/components/layout/AppHeader.tsx',
      'apps/web/src/components/layout/NotificationStreamButton.tsx',
      'apps/web/src/components/desk/DocumentationWorkspaceView.tsx',
      'docs/plan_redizajna_ui_centar_toolbar_i_sustav_dokumentacije.md'
    ],
    tags: ['UI Redizajn', 'Start Centar', 'Toolbar', 'Dokumentacija', 'Ergonomija', 'Prečaci']
  }
];

/**
 * Katalog temeljnih dokumenata iz repozitorija
 */
export const SYSTEM_DOCS_CATALOG: SystemDocReference[] = [
  {
    slug: 'manifest-implementacije',
    title: 'Implementacijski Dnevnik i Manifest',
    category: 'MANIFEST',
    filePath: 'docs/manifest_i_dnevnik_implementacije.md',
    description: 'Cjelovita kronologija arhitekturnih odluka, faza izgradnje i Gate-Check verifikacija.'
  },
  {
    slug: 'glavni-dizajn-dokument',
    title: 'Glavni Dizajn Dokument i Plan Implementacije',
    category: 'ARCHITECTURE',
    filePath: 'docs/glavni_dizajn_dokument_i_plan_implementacije_obrtniq.md',
    description: 'Temeljna specifikacija aplikacije, regulatorni zahtjevi RH i tehnička arhitektura.'
  },
  {
    slug: 'zigo-arhitektura',
    title: 'Arhitektura Žigo AI Agenta',
    category: 'ARCHITECTURE',
    filePath: 'docs/arhitektura_zigo_ai_agenta.md',
    description: 'Specifikacija klijentskog Gemini asistenta, function calling alati i multimodalna sabirnica.'
  },
  {
    slug: 'plan-redizajna-ui',
    title: 'Plan Redizajna UI: Start Centar, Homogeni Toolbar & Sustav Dokumentacije',
    category: 'PLAN',
    filePath: 'docs/plan_redizajna_ui_centar_toolbar_i_sustav_dokumentacije.md',
    description: 'Strateški plan približavanja srži poslovanja korisniku i kreiranja zapovjednog Start centra.'
  },
  {
    slug: 'plan-onboarding-wizard',
    title: 'Onboarding Wizard: Upoznaj Žiga, Gospara od Obrta',
    category: 'PLAN',
    filePath: 'docs/plan_implementacije_onboarding_wizard_upoznaj_ziga.md',
    description: 'Vodič za prvo pokretanje uz glasovnu pratnju Digitalnog Orlanda: od treme do prvog izdanog računa u 90 sekundi.'
  },
  {
    slug: 'plan-uvodni-portal',
    title: 'Uvodni Portal & Edukativni Onboarding (Od Praznog Papira)',
    category: 'PLAN',
    filePath: 'docs/plan_uvodnog_portala_i_edukativnog_onboardinga.md',
    description: 'Arhitekturni plan uvodnog portala s praznim kontrolama, korak-po-korak validacijom i Žigovim primjerima na zahtjev.'
  }
];

/**
 * Pomoćne funkcije za rad s fazama i dokumentacijom
 */
export function getPhaseById(id: string): ImplementationPhase | undefined {
  return OBRTNIQ_PHASES.find(p => p.id === id);
}

export function getCompletedPhasesCount(): number {
  return OBRTNIQ_PHASES.filter(p => p.status === 'COMPLETED').length;
}

export function getTotalPhasesCount(): number {
  return OBRTNIQ_PHASES.length;
}

export function getPhasesProgressPercentage(): number {
  const total = getTotalPhasesCount();
  if (total === 0) return 0;
  return Math.round((getCompletedPhasesCount() / total) * 100);
}
