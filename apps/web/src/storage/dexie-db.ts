import Dexie, { type Table } from 'dexie';
import { appLogger } from '../services/logger';
import type { 
  ObrtProfil, 
  Partner, 
  Artikl, 
  Dokument, 
  NaplataPromet, 
  VrstaDokumenta,
  IObrtnIQStorage,
  IObrtRepository,
  IPartnerRepository,
  IArtiklRepository,
  IDokumentRepository,
  IKprRepository
} from '@obrtniq/core';

export class ObrtnIQDexieDatabase extends Dexie {
  obrtProfil!: Table<ObrtProfil, string>;
  partneri!: Table<Partner, string>;
  artikli!: Table<Artikl, string>;
  dokumenti!: Table<Dokument, string>;
  naplatePromet!: Table<NaplataPromet, string>;

  constructor() {
    super('ObrtnIQ_DB');
    this.version(1).stores({
      obrtProfil: 'id',
      partneri: 'id, oib, naziv, poreznaZona, aktivan',
      artikli: 'id, sifra, kpdSifra, naziv, aktivan',
      dokumenti: 'id, brojDokumenta, godina, brojSekvenca, [godina+poslovniProstorOznaka+naplatniUredjajOznaka], partnerId, status, vrstaDokumenta, datumIzdavanja',
      naplatePromet: 'id, dokumentId, godina, kvartal, datumNaplate, brojKprStavke',
    });

    this.on('ready', () => {
      appLogger.scope('STORAGE:DEXIE').info('Dexie.js IndexedDB baza uspješno otvorena (ObrtnIQ_DB).');
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

export class DexieObrtnIQStorage implements IObrtnIQStorage {
  public obrt = new DexieObrtRepository();
  public partneri = new DexiePartnerRepository();
  public artikli = new DexieArtiklRepository();
  public dokumenti = new DexieDokumentRepository();
  public kpr = new DexieKprRepository();

  async clearAll(): Promise<void> {
    await db.transaction('rw', [db.obrtProfil, db.partneri, db.artikli, db.dokumenti, db.naplatePromet], async () => {
      await db.obrtProfil.clear();
      await db.partneri.clear();
      await db.artikli.clear();
      await db.dokumenti.clear();
      await db.naplatePromet.clear();
    });
  }

  async clearAllData(): Promise<void> {
    return this.clearAll();
  }
}

export const dexieStorage = new DexieObrtnIQStorage();
