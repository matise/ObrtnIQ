import type { 
  ObrtProfil, 
  Partner, 
  Artikl, 
  Dokument, 
  NaplataPromet,
  VrstaDokumenta
} from '../domain/types';

export interface IObrtRepository {
  getProfil(): Promise<ObrtProfil | null>;
  saveProfil(profil: ObrtProfil): Promise<void>;
  updateProfil(partial: Partial<ObrtProfil>): Promise<void>;
}

export interface IPartnerRepository {
  getAll(filterAktivan?: boolean): Promise<Partner[]>;
  getById(id: string): Promise<Partner | null>;
  getByOib(oib: string): Promise<Partner | null>;
  save(partner: Partner): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IArtiklRepository {
  getAll(filterAktivan?: boolean): Promise<Artikl[]>;
  getById(id: string): Promise<Artikl | null>;
  save(artikl: Artikl): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IDokumentRepository {
  getAll(filterGodina?: number, filterVrsta?: VrstaDokumenta): Promise<Dokument[]>;
  getById(id: string): Promise<Dokument | null>;
  save(dokument: Dokument): Promise<void>;
  update(id: string, partial: Partial<Dokument>): Promise<void>;
  deleteDraft(id: string): Promise<void>; // Dopušteno samo ako je status === 'NACRT'
  
  // Dohvat zadnjeg sekvencijalnog broja za određenu godinu, prostor i uređaj
  getZadnjiBrojSekvence(godina: number, prostorOznaka: string, uredjajOznaka: string, vrsta: VrstaDokumenta): Promise<number>;
}

export interface IKprRepository {
  getAll(godina?: number): Promise<NaplataPromet[]>;
  getById(id: string): Promise<NaplataPromet | null>;
  getByDokumentId(dokumentId: string): Promise<NaplataPromet | null>;
  save(naplata: NaplataPromet): Promise<void>;
  delete(id: string): Promise<void>;
  getZadnjiBrojKprStavke(godina: number): Promise<number>;
}

export interface IObrtnIQStorage {
  obrt: IObrtRepository;
  partneri: IPartnerRepository;
  artikli: IArtiklRepository;
  dokumenti: IDokumentRepository;
  kpr: IKprRepository;
  clearAll(): Promise<void>;
}
