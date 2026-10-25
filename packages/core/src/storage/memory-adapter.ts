import type { 
  IObrtnIQStorage, 
  IObrtRepository, 
  IPartnerRepository, 
  IArtiklRepository, 
  IDokumentRepository, 
  IKprRepository,
  IChatRepository,
  ITroskoviRepository,
  IDoprinosiRepository,
  IRecurringRepository
} from './interfaces';
import type { 
  ObrtProfil, 
  Partner, 
  Artikl, 
  Dokument, 
  NaplataPromet, 
  VrstaDokumenta,
  ZigoChatSesija,
  ZigoChatPoruka
} from '../domain/types';
import type { UlazniTrosak } from '../domain/troskovi';
import type { MjesecniObracunDoprinosa } from '../domain/doprinosi';
import type { RecurringProfile } from '../domain/recurring';
import { jeDospjeloZaIzdavanje } from '../domain/recurring';

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

export class MemoryChatRepository implements IChatRepository {
  private sesije: Map<string, ZigoChatSesija> = new Map();
  private poruke: Map<string, ZigoChatPoruka> = new Map();

  async getAllSesije(filterArhivirano?: boolean): Promise<ZigoChatSesija[]> {
    const list = Array.from(this.sesije.values());
    if (filterArhivirano !== undefined) {
      return list.filter(s => s.arhivirano === filterArhivirano);
    }
    return list.sort((a, b) => new Date(b.azurirano).getTime() - new Date(a.azurirano).getTime());
  }

  async getSesijaById(id: string): Promise<ZigoChatSesija | null> {
    const s = this.sesije.get(id);
    return s ? { ...s } : null;
  }

  async saveSesija(sesija: ZigoChatSesija): Promise<void> {
    this.sesije.set(sesija.id, { ...sesija });
  }

  async updateSesija(id: string, partial: Partial<ZigoChatSesija>): Promise<void> {
    const s = this.sesije.get(id);
    if (!s) return;
    this.sesije.set(id, { ...s, ...partial, azurirano: new Date().toISOString() });
  }

  async deleteSesija(id: string): Promise<void> {
    this.sesije.delete(id);
    await this.deletePorukeBySesijaId(id);
  }

  async getPorukeBySesijaId(sesijaId: string): Promise<ZigoChatPoruka[]> {
    const list = Array.from(this.poruke.values()).filter(p => p.sesijaId === sesijaId);
    return list.sort((a, b) => new Date(a.kreirano).getTime() - new Date(b.kreirano).getTime());
  }

  async savePoruka(poruka: ZigoChatPoruka): Promise<void> {
    this.poruke.set(poruka.id, { ...poruka });
    const s = this.sesije.get(poruka.sesijaId);
    if (s) {
      this.sesije.set(s.id, { ...s, azurirano: poruka.kreirano || new Date().toISOString() });
    }
  }

  async deletePorukeBySesijaId(sesijaId: string): Promise<void> {
    for (const [id, p] of this.poruke.entries()) {
      if (p.sesijaId === sesijaId) {
        this.poruke.delete(id);
      }
    }
  }

  clear(): void {
    this.sesije.clear();
    this.poruke.clear();
  }
}

export class MemoryTroskoviRepository implements ITroskoviRepository {
  private troskovi: Map<string, UlazniTrosak> = new Map();

  async getAll(filterGodina?: number): Promise<UlazniTrosak[]> {
    const list = Array.from(this.troskovi.values());
    if (filterGodina !== undefined) {
      return list.filter(t => parseInt(t.datumRacuna.slice(0, 4), 10) === filterGodina);
    }
    return list;
  }

  async getById(id: string): Promise<UlazniTrosak | null> {
    const t = this.troskovi.get(id);
    return t ? { ...t } : null;
  }

  async save(trosak: UlazniTrosak): Promise<void> {
    this.troskovi.set(trosak.id, { ...trosak });
  }

  async update(id: string, partial: Partial<UlazniTrosak>): Promise<void> {
    const current = this.troskovi.get(id);
    if (!current) throw new Error(`Trošak sa ID ${id} ne postoji.`);
    this.troskovi.set(id, { ...current, ...partial });
  }

  async delete(id: string): Promise<void> {
    this.troskovi.delete(id);
  }

  clear(): void {
    this.troskovi.clear();
  }
}

export class MemoryDoprinosiRepository implements IDoprinosiRepository {
  private uplate: Map<string, MjesecniObracunDoprinosa> = new Map();

  async getAllUplate(godina?: number): Promise<MjesecniObracunDoprinosa[]> {
    const list = Array.from(this.uplate.values());
    if (godina !== undefined) {
      return list.filter(u => u.godina === godina);
    }
    return list;
  }

  async saveUplata(obracun: MjesecniObracunDoprinosa): Promise<void> {
    this.uplate.set(obracun.id, { ...obracun });
  }

  async deleteUplata(id: string): Promise<void> {
    this.uplate.delete(id);
  }

  clear(): void {
    this.uplate.clear();
  }
}

export class MemoryRecurringRepository implements IRecurringRepository {
  private profili: Map<string, RecurringProfile> = new Map();

  async getAll(filterAktivan?: boolean): Promise<RecurringProfile[]> {
    const list = Array.from(this.profili.values());
    if (filterAktivan !== undefined) {
      return list.filter(p => p.aktivan === filterAktivan);
    }
    return list;
  }

  async getById(id: string): Promise<RecurringProfile | null> {
    const p = this.profili.get(id);
    return p ? { ...p } : null;
  }

  async save(profil: RecurringProfile): Promise<void> {
    this.profili.set(profil.id, { ...profil });
  }

  async update(id: string, partial: Partial<RecurringProfile>): Promise<void> {
    const current = this.profili.get(id);
    if (!current) throw new Error(`Profil pretplate ${id} ne postoji.`);
    this.profili.set(id, { ...current, ...partial });
  }

  async delete(id: string): Promise<void> {
    this.profili.delete(id);
  }

  async getDospjeli(danasDatum?: string): Promise<RecurringProfile[]> {
    const list = Array.from(this.profili.values()).filter(p => p.aktivan);
    return list.filter(p => jeDospjeloZaIzdavanje(p.sljedeceDospijeceDatum, danasDatum));
  }

  clear(): void {
    this.profili.clear();
  }
}

export class InMemoryObrtnIQStorage implements IObrtnIQStorage {
  public obrt = new MemoryObrtRepository();
  public partneri = new MemoryPartnerRepository();
  public artikli = new MemoryArtiklRepository();
  public dokumenti = new MemoryDokumentRepository();
  public kpr = new MemoryKprRepository();
  public chat = new MemoryChatRepository();
  public troskovi = new MemoryTroskoviRepository();
  public doprinosi = new MemoryDoprinosiRepository();
  public recurring = new MemoryRecurringRepository();

  async clearAll(): Promise<void> {
    this.obrt = new MemoryObrtRepository();
    this.partneri.clear();
    this.artikli.clear();
    this.dokumenti.clear();
    this.kpr.clear();
    this.chat.clear();
    this.troskovi.clear();
    this.doprinosi.clear();
    this.recurring.clear();
  }
}

export function createInMemoryStorage(): IObrtnIQStorage {
  return new InMemoryObrtnIQStorage();
}
