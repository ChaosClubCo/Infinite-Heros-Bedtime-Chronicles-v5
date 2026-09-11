import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  nanoid,
  sanitizeString,
  getCustomHeroes,
  saveCustomHero,
  deleteCustomHero,
} from './customHeroStorage';

let mockStorage: Record<string, string> = {};
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      mockStorage = {};
      return Promise.resolve();
    }),
  },
}));

describe('Custom Hero Storage Engine', () => {
  beforeEach(() => {
    mockStorage = {};
  });

  it('generates random nanoid string of specified length', () => {
    const id = nanoid(10);
    expect(id).toHaveLength(10);
    expect(typeof id).toBe('string');
  });

  it('sanitizes input string and bounds length', () => {
    expect(sanitizeString('   Super Hero   ', 10)).toBe('Super Hero');
    expect(sanitizeString(12345, 10)).toBe('');
    expect(sanitizeString('Super Long Hero Name', 5)).toBe('Super');
  });

  it('saves and retrieves custom heroes in storage', async () => {
    await saveCustomHero({
      name: 'Star Knight',
      title: 'Defender of Sleep',
      power: 'Starlight Blast',
      description: 'A brave knight who shines brightly.',
      iconName: 'shield',
      color: '#FFD700',
      gradient: ['#000', '#FFF'],
      constellation: 'The Shield',
    });

    const heroes = await getCustomHeroes();
    expect(heroes).toHaveLength(1);
    expect(heroes[0].name).toBe('Star Knight');
    expect(heroes[0].id).toContain('custom_');
  });

  it('throws an error if custom hero name is empty', async () => {
    await expect(
      saveCustomHero({
        name: '   ',
        title: 'Hero',
        power: 'Power',
        description: '',
        iconName: 'star',
        color: '#FFF',
        gradient: ['#000', '#FFF'],
        constellation: 'Constellation',
      })
    ).rejects.toThrow('Hero name is required');
  });

  it('deletes an existing custom hero by id', async () => {
    await saveCustomHero({
      id: 'custom_hero_123',
      name: 'Temporary Hero',
      title: 'Short Lived',
      power: 'Fading',
      description: '',
      iconName: 'star',
      color: '#FFF',
      gradient: ['#000', '#FFF'],
      constellation: 'The Cloud',
    });

    let heroes = await getCustomHeroes();
    expect(heroes).toHaveLength(1);

    await deleteCustomHero('custom_hero_123');
    heroes = await getCustomHeroes();
    expect(heroes).toHaveLength(0);
  });
});
