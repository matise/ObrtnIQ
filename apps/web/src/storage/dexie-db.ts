import Dexie, { type Table } from 'dexie';
import { appLogger } from '../services/logger';
import type { 
  ObrtProfil, 
  Partner, 
  Artikl, 
  Dokument, 
  NaplataPromet, 
  VrstaDokumenta,
  ZigoChatSesija,
  ZigoChatPoruka,
  ZigoUserMemory,
  IObrtnIQStorage,
  IObrtRepository,
  IPartnerRepository,
  IArtiklRepository,
  IDokumentRepository,
  IKprRepository,
  IChatRepository
} from '@obrtniq/core';

export class ObrtnIQDexieDatabase extends Dexie {
  obrtProfil!: Table<ObrtProfil, string>;
  partneri!: Table<Partner, string>;
  artikli!: Table<Artikl, string>;
  dokumenti!: Table<Dokument, string>;
  naplatePromet!: Table<NaplataPromet, string>;
  chatSesije!: Table<ZigoChatSesija, string>;
  chatPoruke!: Table<ZigoChatPoruka, string>;
  userMemories!: Table<ZigoUserMemory, string>;

  constructor() {
    super('ObrtnIQ_DB');
    this.version(1).stores({
      obrtProfil: 'id',
      partneri: 'id, oib, naziv, poreznaZona, aktivan',
      artikli: 'id, sifra, kpdSifra, naziv, aktivan',
      dokumenti: 'id, brojDokumenta, godina, brojSekvenca, [godina+poslovniProstorOznaka+naplatniUredjajOznaka], partnerId, status, vrstaDokumenta, datumIzdavanja',
      naplatePromet: 'id, dokumentId, godina, kvartal, datumNaplate, brojKprStavke',
    });

    this.version(2).stores({
      chatSesije: 'id, kreirano, azurirano, arhivirano',
      chatPoruke: 'id, sesijaId, uloga, kreirano',
    });

    this.version(3).stores({
      userMemories: 'id, kategorija, kljuc, azurirano',
    });

    this.on('ready', () => {
      appLogger.scope('STORAGE:DEXIE').info('Dexie.js IndexedDB baza uspješno otvorena (ObrtnIQ_DB v3).');
    });
  }
}

export const db = new ObrtnIQDexieDatabase();

class DexieObrtRepository implements IObrtRepository {
  async getProfil(): Promise<ObrtProfil | null> {
    const list = await db.obrtProfil.toArray();
    return list[0] || null;
  }

  async saveProfil(profil: ObrtProfil): Promise<void> {
    await db.obrtProfil.put(profil);
  }

  async updateProfil(partial: Partial<ObrtProfil>): Promise<void> {
    const current = await this.getProfil();
    if (!current) throw new Error('Profil obrta ne postoji.');
    await db.obrtProfil.update(current.id, partial);
  }
}

class DexiePartnerRepository implements IPartnerRepository {
  async getAll(filterAktivan?: boolean): Promise<Partner[]> {
    if (filterAktivan !== undefined) {
      return db.partneri.filter(p => p.aktivan === filterAktivan).toArray();
    }
    return db.partneri.toArray();
  }

  async getById(id: string): Promise<Partner | null> {
    const p = await db.partneri.get(id);
    return p || null;
  }

  async getByOib(oib: string): Promise<Partner | null> {
    const p = await db.partneri.where('oib').equals(oib).first();
    return p || null;
  }

  async save(partner: Partner): Promise<void> {
    await db.partneri.put(partner);
  }

  async delete(id: string): Promise<void> {
    await db.partneri.delete(id);
  }
}

class DexieArtiklRepository implements IArtiklRepository {
  async getAll(filterAktivan?: boolean): Promise<Artikl[]> {
    if (filterAktivan !== undefined) {
      return db.artikli.filter(a => a.aktivan === filterAktivan).toArray();
    }
    return db.artikli.toArray();
  }

  async getById(id: string): Promise<Artikl | null> {
    const a = await db.artikli.get(id);
    return a || null;
  }

  async save(artikl: Artikl): Promise<void> {
    await db.artikli.put(artikl);
  }

  async delete(id: string): Promise<void> {
    await db.artikli.delete(id);
  }
}

class DexieDokumentRepository implements IDokumentRepository {
  async getAll(filterGodina?: number, filterVrsta?: VrstaDokumenta): Promise<Dokument[]> {
    let collection = db.dokumenti.toCollection();
    if (filterGodina !== undefined) {
      collection = db.dokumenti.where('godina').equals(filterGodina);
    }
    let list = await collection.toArray();
    if (filterVrsta !== undefined) {
      list = list.filter(d => d.vrstaDokumenta === filterVrsta);
    }
    return list.sort((a, b) => a.brojSekvenca - b.brojSekvenca);
  }

  async getById(id: string): Promise<Dokument | null> {
    const d = await db.dokumenti.get(id);
    return d || null;
  }

  async save(dokument: Dokument): Promise<void> {
    await db.dokumenti.put(dokument);
  }

  async update(id: string, partial: Partial<Dokument>): Promise<void> {
    await db.dokumenti.update(id, partial);
  }

  async deleteDraft(id: string): Promise<void> {
    const d = await this.getById(id);
    if (!d) return;
    if (d.status !== 'NACRT') {
      throw new Error(`Nije dopušteno brisanje izdanog dokumenta ${d.brojDokumenta}.`);
    }
    await db.dokumenti.delete(id);
  }

  async getZadnjiBrojSekvence(
    godina: number, 
    prostorOznaka: string, 
    uredjajOznaka: string, 
    _vrsta: VrstaDokumenta
  ): Promise<number> {
    const docs = await db.dokumenti
      .where('[godina+poslovniProstorOznaka+naplatniUredjajOznaka]')
      .equals([godina, prostorOznaka, uredjajOznaka])
      .toArray();

    let max = 0;
    for (const d of docs) {
      if ((d.vrstaDokumenta === 'RACUN' || d.vrstaDokumenta === 'STORNO_RACUN') && d.brojSekvenca > max) {
        max = d.brojSekvenca;
      }
    }
    return max;
  }
}

class DexieKprRepository implements IKprRepository {
  async getAll(godina?: number): Promise<NaplataPromet[]> {
    if (godina !== undefined) {
      return db.naplatePromet.where('godina').equals(godina).sortBy('brojKprStavke');
    }
    return db.naplatePromet.orderBy('brojKprStavke').toArray();
  }

  async getById(id: string): Promise<NaplataPromet | null> {
    const k = await db.naplatePromet.get(id);
    return k || null;
  }

  async getByDokumentId(dokumentId: string): Promise<NaplataPromet | null> {
    const k = await db.naplatePromet.where('dokumentId').equals(dokumentId).first();
    return k || null;
  }

  async save(naplata: NaplataPromet): Promise<void> {
    await db.naplatePromet.put(naplata);
  }

  async delete(id: string): Promise<void> {
    await db.naplatePromet.delete(id);
  }

  async getZadnjiBrojKprStavke(godina: number): Promise<number> {
    const stavke = await db.naplatePromet.where('godina').equals(godina).toArray();
    let max = 0;
    for (const s of stavke) {
      if (s.brojKprStavke > max) max = s.brojKprStavke;
    }
    return max;
  }
}

class DexieChatRepository implements IChatRepository {
  async getAllSesije(filterArhivirano?: boolean): Promise<ZigoChatSesija[]> {
    if (filterArhivirano !== undefined) {
      const filtered = await db.chatSesije.filter(s => s.arhivirano === filterArhivirano).toArray();
      return filtered.sort((a, b) => new Date(b.azurirano).getTime() - new Date(a.azurirano).getTime());
    }
    const all = await db.chatSesije.toArray();
    return all.sort((a, b) => new Date(b.azurirano).getTime() - new Date(a.azurirano).getTime());
  }

  async getSesijaById(id: string): Promise<ZigoChatSesija | null> {
    const s = await db.chatSesije.get(id);
    return s || null;
  }

  async saveSesija(sesija: ZigoChatSesija): Promise<void> {
    await db.chatSesije.put(sesija);
  }

  async updateSesija(id: string, partial: Partial<ZigoChatSesija>): Promise<void> {
    await db.chatSesije.update(id, { ...partial, azurirano: new Date().toISOString() });
  }

  async deleteSesija(id: string): Promise<void> {
    await db.transaction('rw', [db.chatSesije, db.chatPoruke], async () => {
      await db.chatSesije.delete(id);
      await db.chatPoruke.where('sesijaId').equals(id).delete();
    });
  }

  async getPorukeBySesijaId(sesijaId: string): Promise<ZigoChatPoruka[]> {
    const msgs = await db.chatPoruke.where('sesijaId').equals(sesijaId).toArray();
    return msgs.sort((a, b) => new Date(a.kreirano).getTime() - new Date(b.kreirano).getTime());
  }

  async savePoruka(poruka: ZigoChatPoruka): Promise<void> {
    await db.transaction('rw', [db.chatSesije, db.chatPoruke], async () => {
      await db.chatPoruke.put(poruka);
      const sesija = await db.chatSesije.get(poruka.sesijaId);
      if (sesija) {
        await db.chatSesije.update(sesija.id, { azurirano: poruka.kreirano || new Date().toISOString() });
      }
    });
  }

  async deletePorukeBySesijaId(sesijaId: string): Promise<void> {
    await db.chatPoruke.where('sesijaId').equals(sesijaId).delete();
  }
}

export class DexieMemoryRepository {
  async getAll(): Promise<ZigoUserMemory[]> {
    const list = await db.userMemories.toArray();
    return list.sort((a, b) => new Date(b.azurirano).getTime() - new Date(a.azurirano).getTime());
  }

  async getById(id: string): Promise<ZigoUserMemory | null> {
    const item = await db.userMemories.get(id);
    return item || null;
  }

  async getByKey(kljuc: string): Promise<ZigoUserMemory | null> {
    const item = await db.userMemories.where('kljuc').equals(kljuc).first();
    return item || null;
  }

  async save(memory: ZigoUserMemory): Promise<void> {
    await db.userMemories.put({
      ...memory,
      azurirano: memory.azurirano || new Date().toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    await db.userMemories.delete(id);
  }

  async clear(): Promise<void> {
    await db.userMemories.clear();
  }
}

export class DexieObrtnIQStorage implements IObrtnIQStorage {
  public obrt = new DexieObrtRepository();
  public partneri = new DexiePartnerRepository();
  public artikli = new DexieArtiklRepository();
  public dokumenti = new DexieDokumentRepository();
  public kpr = new DexieKprRepository();
  public chat = new DexieChatRepository();
  public memorija = new DexieMemoryRepository();

  async clearAll(): Promise<void> {
    await db.transaction('rw', [db.obrtProfil, db.partneri, db.artikli, db.dokumenti, db.naplatePromet, db.chatSesije, db.chatPoruke, db.userMemories], async () => {
      await db.obrtProfil.clear();
      await db.partneri.clear();
      await db.artikli.clear();
      await db.dokumenti.clear();
      await db.naplatePromet.clear();
      await db.chatSesije.clear();
      await db.chatPoruke.clear();
      await db.userMemories.clear();
    });
  }

  async clearAllData(): Promise<void> {
    return this.clearAll();
  }
}

export const dexieStorage = new DexieObrtnIQStorage();
