import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Hero } from '@/constants/heroes';

const CUSTOM_HEROES_KEY = '@infinity_heroes_custom_heroes';

// Define a simple nanoid function locally to avoid adding packages
export function nanoid(size = 21): string {
  const urlAlphabet = 'useandom-26T198340PX75pxJACKYFRGQb3hof_dZgimwNGBVCSWObitoPLHtejKVUxD';
  let id = '';
  for (let i = 0; i < size; i++) {
    id += urlAlphabet[(Math.random() * urlAlphabet.length) | 0];
  }
  return id;
}

export function sanitizeString(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.slice(0, maxLen).trim();
}

export async function getCustomHeroes(): Promise<Hero[]> {
  try {
    const data = await AsyncStorage.getItem(CUSTOM_HEROES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveCustomHero(hero: Omit<Hero, 'id'> & { id?: string }): Promise<void> {
  const heroes = await getCustomHeroes();
  
  // Validation
  const name = sanitizeString(hero.name, 30);
  const title = sanitizeString(hero.title, 40);
  const power = sanitizeString(hero.power, 80);
  
  if (!name) {
    throw new Error('Hero name is required');
  }

  const id = hero.id && hero.id.startsWith('custom_') ? hero.id : 'custom_' + nanoid();
  const savedHero: Hero = {
    ...hero,
    id,
    name,
    title,
    power,
    description: hero.description ? sanitizeString(hero.description, 500) : `A custom hero named ${name} with the power of ${power}.`,
    iconName: hero.iconName || 'star',
    color: hero.color || '#B388FF',
    gradient: hero.gradient || ['#311b92', '#4527a0'],
    constellation: hero.constellation || 'The Custom',
  };

  const index = heroes.findIndex(h => h.id === id);
  if (index > -1) {
    heroes[index] = savedHero;
  } else {
    heroes.push(savedHero);
  }

  await AsyncStorage.setItem(CUSTOM_HEROES_KEY, JSON.stringify(heroes));
}

export async function deleteCustomHero(id: string): Promise<void> {
  const heroes = await getCustomHeroes();
  const filtered = heroes.filter(h => h.id !== id);
  await AsyncStorage.setItem(CUSTOM_HEROES_KEY, JSON.stringify(filtered));
}
