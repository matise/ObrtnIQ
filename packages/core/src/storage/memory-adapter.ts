import type { 
  IObrtnIQStorage, 
  IObrtRepository, 
  IPartnerRepository, 
  IArtiklRepository, 
  IDokumentRepository, 
  IKprRepository 
} from './interfaces';
import type { 
  ObrtProfil, 
  Partner, 
  Artikl, 
  Dokument, 
  NaplataPromet, 
  VrstaDokumenta 
} from '../domain/types';

export class MemoryObrtRepository implements IObrtRepository {
  private profil: ObrtProfil | null = null;

  async getProfil(): Promise<ObrtProfil | null> {
    return this.profil ? { ...this.profil } : null;
  }

  async saveProfil(profil: ObrtProfil): Promise<void> {
    this.profil = { ...profil };
  }

  async updateProfil(partial: Partial<ObrtProfil>): Promise<void> {
    if (!this.profil) {
      throw new Error('Profil obrta još nije kreiran.');
    }
    this.profil = { ...this.profil, ...partial };
  }
}

export class MemoryPartnerRepository implements IPartnerRepository {
  private partneri: Map<string, Partner> = new Map();

  async getAll(filterAktivan?: boolean): Promise<Partner[]> {
    const list = Array.from(this.partneri.values());
    if (filterAktivan !== undefined) {
      return list.filter(p => p.aktivan === filterAktivan);
    }
    return list;
  }

  async getById(id: string): Promise<Partner | null> {
    const p = this.partneri.get(id);
    return p ? { ...p } : null;
  }

  async getByOib(oib: string): Promise<Partner | null> {
    for (const p of this.partneri.values()) {
      if (p.oib === oib) return { ...p };
    }
    return null;
  }

  async save(partner: Partner): Promise<void> {
    this.partneri.set(partner.id, { ...partner });
  }

  async delete(id: string): Promise<void> {
    this.partneri.delete(id);
  }

  clear(): void {
    this.partneri.clear();
  }
}

export class MemoryArtiklRepository implements IArtiklRepository {
  private artikli: Map<string, Artikl> = new Map();

  async getAll(filterAktivan?: boolean): Promise<Artikl[]> {
    const list = Array.from(this.artikli.values());
    if (filterAktivan !== undefined) {
      return list.filter(a => a.aktivan === filterAktivan);
    }
    return list;
  }

  async getById(id: string): Promise<Artikl | null> {
    const a = this.artikli.get(id);
    return a ? { ...a } : null;
  }

  async save(artikl: Artikl): Promise<void> {
    this.artikli.set(artikl.id, { ...artikl });
  }

  async delete(id: string): Promise<void> {
    this.artikli.delete(id);
  }

  clear(): void {
    this.artikli.clear();
  }
}

export class MemoryDokumentRepository implements IDokumentRepository {
  private dokumenti: Map<string, Dokument> = new Map();

  async getAll(filterGodina?: number, filterVrsta?: VrstaDokumenta): Promise<Dokument[]> {
    let list = Array.from(this.dokumenti.values());
    if (filterGodina !== undefined) {
      list = list.filter(d => d.godina === filterGodina);
    }
    if (filterVrsta !== undefined) {
      list = list.filter(d => d.vrstaDokumenta === filterVrsta);
    }
    return list.sort((a, b) => a.brojSekvenca - b.brojSekvenca);
  }

  async getById(id: string): Promise<Dokument | null> {
    const d = this.dokumenti.get(id);
    return d ? { ...d } : null;
  }

  async save(dokument: Dokument): Promise<void> {
    this.dokumenti.set(dokument.id, { ...dokument });
  }

  async update(id: string, partial: Partial<Dokument>): Promise<void> {
    const d = this.dokumenti.get(id);
    if (!d) throw new Error(`Dokument s ID-em ${id} ne postoji.`);
    this.dokumenti.set(id, { ...d, ...partial });
  }

  async deleteDraft(id: string): Promise<void> {
    const d = this.dokumenti.get(id);
    if (!d) return;
    if (d.status !== 'NACRT') {
      throw new Error(`Nije dopušteno brisanje izdanog dokumenta ${d.brojDokumenta}. Koristite storniranje.`);
    }
    this.dokumenti.delete(id);
  }

  async getZadnjiBrojSekvence(
    godina: number, 
    prostorOznaka: string, 
    uredjajOznaka: string, 
    _vrsta: VrstaDokumenta
  ): Promise<number> {
    // U RH računi i storno računi dijele istu sekvencu po godini, prostoru i uređaju
    let max = 0;
    for (const d of this.dokumenti.values()) {
      if (
        d.godina === godina &&
        d.poslovniProstorOznaka === prostorOznaka &&
        d.naplatniUredjajOznaka === uredjajOznaka &&
        (d.vrstaDokumenta === 'RACUN' || d.vrstaDokumenta === 'STORNO_RACUN')
      ) {
        if (d.brojSekvenca > max) {
          max = d.brojSekvenca;
        }
      }
    }
    return max;
  }

  clear(): void {
    this.dokumenti.clear();
  }
}

export class MemoryKprRepository implements IKprRepository {
  private kprStavke: Map<string, NaplataPromet> = new Map();

  async getAll(godina?: number): Promise<NaplataPromet[]> {
    let list = Array.from(this.kprStavke.values());
    if (godina !== undefined) {
      list = list.filter(k => k.godina === godina);
    }
    return list.sort((a, b) => a.brojKprStavke - b.brojKprStavke);
  }

  async getById(id: string): Promise<NaplataPromet | null> {
    const k = this.kprStavke.get(id);
    return k ? { ...k } : null;
  }

  async getByDokumentId(dokumentId: string): Promise<NaplataPromet | null> {
    for (const k of this.kprStavke.values()) {
      if (k.dokumentId === dokumentId) return { ...k };
    }
    return null;
  }

  async save(naplata: NaplataPromet): Promise<void> {
    this.kprStavke.set(naplata.id, { ...naplata });
  }

  async delete(id: string): Promise<void> {
    this.kprStavke.delete(id);
  }

  async getZadnjiBrojKprStavke(godina: number): Promise<number> {
    let max = 0;
    for (const k of this.kprStavke.values()) {
      if (k.godina === godina && k.brojKprStavke > max) {
        max = k.brojKprStavke;
      }
    }
    return max;
  }

  clear(): void {
    this.kprStavke.clear();
  }
}

export class InMemoryObrtnIQStorage implements IObrtnIQStorage {
  public obrt = new MemoryObrtRepository();
  public partneri = new MemoryPartnerRepository();
  public artikli = new MemoryArtiklRepository();
  public dokumenti = new MemoryDokumentRepository();
  public kpr = new MemoryKprRepository();

  async clearAll(): Promise<void> {
    this.obrt = new MemoryObrtRepository();
    this.partneri.clear();
    this.artikli.clear();
    this.dokumenti.clear();
    this.kpr.clear();
  }
}

export function createInMemoryStorage(): IObrtnIQStorage {
  return new InMemoryObrtnIQStorage();
}
