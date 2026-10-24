import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createInMemoryStorage, 
  encryptBackupData, 
  decryptBackupData,
  createBackupSnapshot, 
  restoreBackupSnapshot,
  type ZigoChatSesija, 
  type ZigoChatPoruka, 
  type ZigoAttachment 
} from '@obrtniq/core';
import { geminiService } from '../src/services/gemini-service';
import { executeZigoTool, type ZigoToolsContext } from '../src/services/zigo-tools-dispatcher';
import type { FormItem } from '../src/engine/types';

const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, String(value)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = mockLocalStorage;
}

describe('Faza 11: Žigo Autonomni Klijentski Agent (Protokol Validacije V11-1 do V11-8)', () => {
  let memoryStorage: ReturnType<typeof createInMemoryStorage>;

  beforeEach(() => {
    mockLocalStorage.clear();
    memoryStorage = createInMemoryStorage();
  });

  // V11-1: Baza Podataka (Dexie v2 / IChatRepository)
  describe('V11-1: Baza Podataka (IChatRepository i perzistencija sesija i poruka)', () => {
    it('uspješno stvara sesiju, dodaje poruke s privitcima i dohvaća povijest', async () => {
      const sesija: ZigoChatSesija = {
        id: 'sesija-test-1',
        naslov: 'Priprema ponude za klijenta',
        kreirano: new Date().toISOString(),
        azurirano: new Date().toISOString(),
        arhivirano: false,
      };

      await memoryStorage.chat!.saveSesija(sesija);
      const sesije = await memoryStorage.chat!.getAllSesije();
      expect(sesije.length).toBe(1);
      expect(sesije[0]!.naslov).toBe('Priprema ponude za klijenta');

      const privitak: ZigoAttachment = {
        naziv: 'racun_gorivo.jpg',
        mimeType: 'image/jpeg',
        base64Data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        velicinaBajtova: 1024,
      };

      const poruka: ZigoChatPoruka = {
        id: 'msg-test-1',
        sesijaId: 'sesija-test-1',
        uloga: 'user',
        tekst: 'Žigo, provjeri ovaj slip za gorivo',
        privitci: [privitak],
        kreirano: new Date().toISOString(),
      };

      await memoryStorage.chat!.savePoruka(poruka);
      const poruke = await memoryStorage.chat!.getPorukeBySesijaId('sesija-test-1');
      expect(poruke.length).toBe(1);
      expect(poruke[0]!.tekst).toBe('Žigo, provjeri ovaj slip za gorivo');
      expect(poruke[0]!.privitci?.[0]?.naziv).toBe('racun_gorivo.jpg');
    });

    it('brisanje sesije kaskadno uklanja sve povezane poruke', async () => {
      const sesijaId = 'sesija-delete-test';
      await memoryStorage.chat!.saveSesija({
        id: sesijaId,
        naslov: 'Privremeni razgovor',
        kreirano: new Date().toISOString(),
        azurirano: new Date().toISOString(),
        arhivirano: false,
      });

      await memoryStorage.chat!.savePoruka({
        id: 'msg-del-1',
        sesijaId,
        uloga: 'user',
        tekst: 'Bok',
        kreirano: new Date().toISOString(),
      });

      await memoryStorage.chat!.deleteSesija(sesijaId);
      const preostaleSesije = await memoryStorage.chat!.getAllSesije();
      const preostalePoruke = await memoryStorage.chat!.getPorukeBySesijaId(sesijaId);

      expect(preostaleSesije.find((s) => s.id === sesijaId)).toBeUndefined();
      expect(preostalePoruke.length).toBe(0);
    });
  });

  // V11-2: Function Calling: Račun
  describe('V11-2: Function Calling: Priprema računa i popunjavanje radne plohe', () => {
    it('prepoznaje zahtjev za izradu računa i dispečira postavi_kupca i dodaj_stavku_racuna', async () => {
      const messages: ZigoChatPoruka[] = [
        {
          id: 'msg-1',
          sesijaId: 's1',
          uloga: 'user',
          tekst: 'Pripremi račun za ACME d.o.o., OIB 12345678903, 10 sati programiranja po 60 eura',
          kreirano: new Date().toISOString(),
        },
      ];

      // 1. Model / heuristika predlaže postavi_kupca
      const response = await geminiService.chatWithAgent(messages);
      expect(response.toolPoziv).toBeDefined();
      expect(response.toolPoziv?.imeFunkcije).toBe('postavi_kupca');
      expect(response.toolPoziv?.argumenti.partnerNaziv).toBe('ACME d.o.o.');
      expect(response.toolPoziv?.argumenti.oib).toBe('12345678903');

      // 2. Izvršavanje alata na radnoj plohi
      let partnerNazivState = '';
      let oibState = '';
      let isOibValidState = false;
      let itemsState: FormItem[] = [];

      const context: ZigoToolsContext = {
        form: {
          partnerNaziv: '',
          setPartnerNaziv: (val) => { partnerNazivState = val; },
          oib: '',
          setOib: (val) => { oibState = val; },
          setIsOibValid: (val) => { isOibValidState = val; },
          taxZone: 'DOMACI_B2B',
          setTaxZone: () => {},
          iban: '',
          setIban: () => {},
          setIsIbanValid: () => {},
        },
        items: {
          items: itemsState,
          setItems: (val) => { itemsState = typeof val === 'function' ? val(itemsState) : val; },
          addItem: () => {},
          resetItems: () => { itemsState = []; },
          ukupniIznos: 0,
        },
        storage: memoryStorage,
      };

      const resKupac = await executeZigoTool('postavi_kupca', response.toolPoziv!.argumenti, context);
      expect(resKupac.uspjeh).toBe(true);
      expect(partnerNazivState).toBe('ACME d.o.o.');
      expect(oibState).toBe('12345678903');
      expect(isOibValidState).toBe(true);

      // 3. Dodavanje stavke preko dispečera
      const resStavka = await executeZigoTool(
        'dodaj_stavku_racuna',
        {
          naziv: 'Razvoj softvera',
          kpdSifra: '62.01.11',
          kolicina: 10,
          cijena: 60,
          jedinicaMjere: 'sat',
        },
        context
      );

      expect(resStavka.uspjeh).toBe(true);
      expect(itemsState.length).toBe(1);
      expect(itemsState[0]!.kpdSifra).toBe('62.01.11');
      expect(itemsState[0]!.cijena).toBe(60);
      expect(itemsState[0]!.kolicina).toBe(10);
    });
  });

  // V11-3: Function Calling: Cjenik
  describe('V11-3: Function Calling: Spremanje nove usluge u lokalni cjenik', () => {
    it('automatski klasificira i sprema artikl s KPD 2025 šifrom u bazu', async () => {
      const messages: ZigoChatPoruka[] = [
        {
          id: 'msg-2',
          sesijaId: 's1',
          uloga: 'user',
          tekst: 'Spremi mi novu uslugu dizajn logotipa u cjenik po 250 eura',
          kreirano: new Date().toISOString(),
        },
      ];

      const response = await geminiService.chatWithAgent(messages);
      expect(response.toolPoziv).toBeDefined();
      expect(response.toolPoziv?.imeFunkcije).toBe('dodaj_u_cjenik');
      expect(response.toolPoziv?.argumenti.kpdSifra).toBe('74.10.11');
      expect(response.toolPoziv?.argumenti.cijena).toBe(250);

      const context: ZigoToolsContext = { storage: memoryStorage };
      const resCjenik = await executeZigoTool('dodaj_u_cjenik', response.toolPoziv!.argumenti, context);
      expect(resCjenik.uspjeh).toBe(true);

      const spremljeni = await memoryStorage.artikli.getAll();
      expect(spremljeni.length).toBe(1);
      expect(spremljeni[0]!.naziv).toBe('Dizajn logotipa');
      expect(spremljeni[0]!.kpdSifra).toBe('74.10.11');
      expect(spremljeni[0]!.cijenaOsnovica).toBe(250);
    });
  });

  // V11-4: Status Praga i KPR
  describe('V11-4: Praćenje paušalnog limita od 40.000 € i KPR stanja', () => {
    it('točno izračunava naplaćeni promet i preostali iznos do praga', async () => {
      const tekuceGodina = new Date().getFullYear();
      await memoryStorage.kpr.save({
        id: 'kpr-1',
        brojKprStavke: 1,
        datumNaplate: `${tekuceGodina}-03-15`,
        iznosGotovina: 0,
        iznosBezgotovinski: 12500,
        ukupnoNaplaceno: 12500,
        kvartal: 1,
        godina: tekuceGodina,
        opisPlatitelja: 'Kupac d.o.o.',
      });

      const messages: ZigoChatPoruka[] = [
        {
          id: 'msg-3',
          sesijaId: 's1',
          uloga: 'user',
          tekst: 'Koliko mi je još ostalo do praga od 40 tisuća?',
          kreirano: new Date().toISOString(),
        },
      ];

      const response = await geminiService.chatWithAgent(messages);
      expect(response.toolPoziv?.imeFunkcije).toBe('dohvati_financijski_status');

      const context: ZigoToolsContext = { storage: memoryStorage };
      const res = await executeZigoTool('dohvati_financijski_status', {}, context);
      expect(res.uspjeh).toBe(true);
      expect(res.podaci.ukupnoNaplaceno).toBe(12500);
      expect(res.podaci.ostaloDoPraga).toBe(27500);
      expect(res.podaci.prekoracenPrag).toBe(false);
    });
  });

  // V11-5: Žigin Rez (Instant Trijaža)
  describe('V11-5: Specijalna mehanika: Žigin Rez (Trijaža u tri točke)', () => {
    it('servira točno tri strukturirane točke: Što gori, Što čeka i Jedna akcija sad', async () => {
      const messages: ZigoChatPoruka[] = [
        {
          id: 'msg-4',
          sesijaId: 's1',
          uloga: 'user',
          tekst: 'Žigo, presijeci.',
          kreirano: new Date().toISOString(),
        },
      ];

      const response = await geminiService.chatWithAgent(messages);
      expect(response.toolPoziv?.imeFunkcije).toBe('aktiviraj_zigin_rez');

      const context: ZigoToolsContext = { storage: memoryStorage };
      const resRez = await executeZigoTool('aktiviraj_zigin_rez', {}, context);

      expect(resRez.uspjeh).toBe(true);
      expect(resRez.podaci.stoGori).toBeDefined();
      expect(resRez.podaci.stoCeka).toBeDefined();
      expect(resRez.podaci.akcijaSad).toBeDefined();
      expect(resRez.poruka).toContain('1. ŠTO GORI:');
      expect(resRez.poruka).toContain('2. ŠTO ČEKA:');
      expect(resRez.poruka).toContain('3. AKCIJA SAD:');
    });
  });

  // V11-6: Porezni Filtar (Ćevapi Test)
  describe('V11-6: Porezni filtar za opravdanost troškova (Ćevapi Test)', () => {
    it('nepokolebljivo i duhovito odbija pravdanje privatnog roštilja ili ćevapa', async () => {
      const messages: ZigoChatPoruka[] = [
        {
          id: 'msg-5',
          sesijaId: 's1',
          uloga: 'user',
          tekst: 'Kupio sam profi roštilj i meso za ćevape na firmu, kako da to opravdam kao trošak?',
          kreirano: new Date().toISOString(),
        },
      ];

      const response = await geminiService.chatWithAgent(messages);
      expect(response.toolPoziv).toBeUndefined(); // Nema poziva alata za pravdanje!
      expect(response.odgovorTekst).toContain('ćevape');
      expect(response.odgovorTekst).toContain('Brišem roštilj');
      expect(response.odgovorTekst).toContain('inspektor');
    });
  });

  // V11-7: Multimodalni Sken Poslovnog Računa
  describe('V11-7: Multimodalni unos i prepoznavanje opravdanog poslovnog računa', () => {
    it('analizira priloženi račun za uredski materijal i automatski priprema stavku', async () => {
      const messages: ZigoChatPoruka[] = [
        {
          id: 'msg-6',
          sesijaId: 's1',
          uloga: 'user',
          tekst: 'Evo slika računa za uredski papir',
          privitci: [
            {
              naziv: 'uredski_papir.pdf',
              mimeType: 'application/pdf',
              base64Data: 'JVBERi0xLjMKJcfs...',
              velicinaBajtova: 4096,
            },
          ],
          kreirano: new Date().toISOString(),
        },
      ];

      const response = await geminiService.chatWithAgent(messages);
      expect(response.toolPoziv).toBeDefined();
      expect(response.toolPoziv?.imeFunkcije).toBe('dodaj_stavku_racuna');
      expect(response.odgovorTekst).toContain('poslovno opravdan');
    });
  });

  // V11-8: Zero-Server Kripto Backup s Chat Sesijama
  describe('V11-8: Zero-Server Kripto Backup (.obrtniq) s uključenim chat sesijama', () => {
    it('uspješno kriptira i restaurira cjelokupnu povijest razgovora', async () => {
      // 1. Spremi sesiju i poruku
      await memoryStorage.chat!.saveSesija({
        id: 's-kripto-1',
        naslov: 'Strateški porezni plan',
        kreirano: new Date().toISOString(),
        azurirano: new Date().toISOString(),
        arhivirano: false,
      });

      await memoryStorage.chat!.savePoruka({
        id: 'msg-kripto-1',
        sesijaId: 's-kripto-1',
        uloga: 'assistant',
        tekst: 'Ođe Orlando na trgu. Sve stoji čisto pod laktom.',
        kreirano: new Date().toISOString(),
      });

      // 2. Kreiraj snapshot
      const snapshot = await createBackupSnapshot(memoryStorage);
      expect(snapshot.chatSesije).toBeDefined();
      expect(snapshot.chatSesije!.length).toBe(1);
      expect(snapshot.chatPoruke!.length).toBe(1);

      // 3. Kriptiraj lozinkom
      const pass = 'dubrovnik123';
      const encrypted = await encryptBackupData(snapshot, pass);
      expect(typeof encrypted).toBe('string');
      expect(encrypted).toContain('format');

      // 4. Dekriptiraj i restauriraj u novi prazan repozitorij
      const decrypted = await decryptBackupData(encrypted, pass);
      const noviStorage = createInMemoryStorage();
      await restoreBackupSnapshot(noviStorage, decrypted, true);

      const restauriraneSesije = await noviStorage.chat!.getAllSesije();
      const restauriranePoruke = await noviStorage.chat!.getPorukeBySesijaId('s-kripto-1');

      expect(restauriraneSesije.length).toBe(1);
      expect(restauriraneSesije[0]!.naslov).toBe('Strateški porezni plan');
      expect(restauriranePoruke.length).toBe(1);
      expect(restauriranePoruke[0]!.tekst).toBe('Ođe Orlando na trgu. Sve stoji čisto pod laktom.');
    });
  });
});
