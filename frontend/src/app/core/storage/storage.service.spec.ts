import { TestBed } from '@angular/core/testing';
import { STORAGE_KEYS, StorageService } from './storage.service';

describe('StorageService', () => {
  let storage: StorageService;

  beforeEach(() => {
    localStorage.clear(); sessionStorage.clear();
    storage = TestBed.inject(StorageService);
  });
  afterEach(() => vi.restoreAllMocks());

  it('usa as chaves vila-*', () => {
    storage.set(STORAGE_KEYS.hero, 'cangaceiro');
    expect(localStorage.getItem('vila-heroi')).toBe('cangaceiro');
    storage.set(STORAGE_KEYS.arrived, '1', 'session');
    expect(sessionStorage.getItem('vila-chegou')).toBe('1');
  });

  it('lê e grava JSON, com valor padrão quando falta ou está corrompido', () => {
    storage.setJson(STORAGE_KEYS.duelWins, { normal: 2 });
    expect(storage.getJson(STORAGE_KEYS.duelWins, {})).toEqual({ normal: 2 });
    localStorage.setItem('vila-progresso', '{quebrado');
    expect(storage.getJson(STORAGE_KEYS.progress, null)).toBeNull();
    expect(storage.getJson(STORAGE_KEYS.sound, 'on')).toBe('on');
  });

  it('sem armazenamento, segue sem erro', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado'); });
    expect(() => storage.set(STORAGE_KEYS.sound, 'off')).not.toThrow();
    expect(storage.get(STORAGE_KEYS.sound)).toBeNull();
    expect(storage.getJson(STORAGE_KEYS.duelWins, {})).toEqual({});
  });
});
