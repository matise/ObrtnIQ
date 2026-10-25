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

export interface IChatRepository {
  getAllSesije(filterArhivirano?: boolean): Promise<ZigoChatSesija[]>;
  getSesijaById(id: string): Promise<ZigoChatSesija | null>;
  saveSesija(sesija: ZigoChatSesija): Promise<void>;
  updateSesija(id: string, partial: Partial<ZigoChatSesija>): Promise<void>;
  deleteSesija(id: string): Promise<void>;

  getPorukeBySesijaId(sesijaId: string): Promise<ZigoChatPoruka[]>;
  savePoruka(poruka: ZigoChatPoruka): Promise<void>;
  deletePorukeBySesijaId(sesijaId: string): Promise<void>;
}

export interface ITroskoviRepository {
  getAll(filterGodina?: number): Promise<UlazniTrosak[]>;
  getById(id: string): Promise<UlazniTrosak | null>;
  save(trosak: UlazniTrosak): Promise<void>;
  update(id: string, partial: Partial<UlazniTrosak>): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IDoprinosiRepository {
  getAllUplate(godina?: number): Promise<MjesecniObracunDoprinosa[]>;
  saveUplata(obracun: MjesecniObracunDoprinosa): Promise<void>;
  deleteUplata(id: string): Promise<void>;
}

export interface IRecurringRepository {
  getAll(filterAktivan?: boolean): Promise<RecurringProfile[]>;
  getById(id: string): Promise<RecurringProfile | null>;
  save(profil: RecurringProfile): Promise<void>;
  update(id: string, partial: Partial<RecurringProfile>): Promise<void>;
  delete(id: string): Promise<void>;
  getDospjeli(danasDatum?: string): Promise<RecurringProfile[]>;
}

export interface IObrtnIQStorage {
  obrt: IObrtRepository;
  partneri: IPartnerRepository;
  artikli: IArtiklRepository;
  dokumenti: IDokumentRepository;
  kpr: IKprRepository;
  chat?: IChatRepository;
  troskovi?: ITroskoviRepository;
  doprinosi?: IDoprinosiRepository;
  recurring?: IRecurringRepository;
  clearAll(): Promise<void>;
}


