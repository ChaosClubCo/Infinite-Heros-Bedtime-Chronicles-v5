import { describe, it, expect } from 'vitest';
import { HEROES, type Hero } from './heroes';

describe('Built-in Stock Heroes Constants', () => {
  it('contains the 8 canonical stock superhero characters', () => {
    expect(HEROES).toHaveLength(8);
  });

  it('ensures every hero has unique id, name, and constellation', () => {
    const ids = new Set(HEROES.map((h) => h.id));
    const names = new Set(HEROES.map((h) => h.name));
    const constellations = new Set(HEROES.map((h) => h.constellation));

    expect(ids.size).toBe(8);
    expect(names.size).toBe(8);
    expect(constellations.size).toBe(8);
  });

  it('validates hero metadata properties and color configurations', () => {
    HEROES.forEach((hero: Hero) => {
      expect(hero.id).toMatch(/^hero-\d+$/);
      expect(hero.name).toBeTruthy();
      expect(hero.title).toBeTruthy();
      expect(hero.power).toBeTruthy();
      expect(hero.description).toBeTruthy();
      expect(hero.iconName).toBeTruthy();
      expect(hero.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(hero.gradient).toHaveLength(2);
      expect(hero.portraitAsset).toBeDefined();
    });
  });
});
