export interface ChildAvatar {
  id: string;
  name: string;
  emoji: string;
  iconBg: string;
  borderColor: string;
  description: string;
}

export const CHILD_AVATARS: ChildAvatar[] = [
  {
    id: 'fox',
    name: 'Moon Fox',
    emoji: '🦊',
    iconBg: 'bg-amber-500/20',
    borderColor: 'border-amber-500/50',
    description: 'Cozy & curious starry wanderer',
  },
  {
    id: 'astronaut',
    name: 'Star Voyager',
    emoji: '🚀',
    iconBg: 'bg-indigo-500/20',
    borderColor: 'border-indigo-500/50',
    description: 'Exploring distant galaxies',
  },
  {
    id: 'owl',
    name: 'Night Owl',
    emoji: '🦉',
    iconBg: 'bg-purple-500/20',
    borderColor: 'border-purple-500/50',
    description: 'Wise bedtime story keeper',
  },
  {
    id: 'bear',
    name: 'Sleepy Bear',
    emoji: '🐻',
    iconBg: 'bg-yellow-600/20',
    borderColor: 'border-yellow-600/50',
    description: 'Warm and peaceful sleeper',
  },
  {
    id: 'unicorn',
    name: 'Dream Unicorn',
    emoji: '🦄',
    iconBg: 'bg-pink-500/20',
    borderColor: 'border-pink-500/50',
    description: 'Weaving rainbow dreams',
  },
  {
    id: 'whale',
    name: 'Cosmic Whale',
    emoji: '🐋',
    iconBg: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/50',
    description: 'Singing gentle ocean lullabies',
  },
  {
    id: 'bunny',
    name: 'Moon Bunny',
    emoji: '🐰',
    iconBg: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/50',
    description: 'Soft hops across stardust',
  },
  {
    id: 'dragon',
    name: 'Spark Dragon',
    emoji: '🐉',
    iconBg: 'bg-rose-500/20',
    borderColor: 'border-rose-500/50',
    description: 'Guarding nighttime magic',
  },
];

export const getAvatarById = (id?: string): ChildAvatar => {
  return CHILD_AVATARS.find((a) => a.id === id) || CHILD_AVATARS[0];
};
