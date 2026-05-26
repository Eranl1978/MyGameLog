export const RAWG_KEY = '6aee255c0aac468ea0077086cc4cea31'

export const TAG_LABELS = {
  action: 'אקשן',
  rpg: 'RPG',
  sport: 'ספורט',
  puzzle: 'פאזל',
  sim: 'סימולציה',
  strategy: 'אסטרטגיה',
  adventure: 'הרפתקה',
}

export const TAGS = ['action', 'rpg', 'sport', 'puzzle', 'sim', 'adventure', 'strategy']
export const PLATFORMS = ['PS5', 'Xbox', 'Nintendo', 'PC']

export const STATUS_LABELS = {
  own: 'יש לי',
  want: 'רוצה',
  done: 'שחקתי',
}

export const STATUS_OPTIONS = [
  { value: 'own', label: 'יש לי' },
  { value: 'want', label: 'רוצה' },
  { value: 'done', label: 'שחקתי' },
]

export const FALLBACK_ICONS = [
  { bg: 'bg-purple', icon: '🎮' },
  { bg: 'bg-blue', icon: '⚔️' },
  { bg: 'bg-teal', icon: '🌌' },
  { bg: 'bg-orange', icon: '🔥' },
  { bg: 'bg-rose', icon: '🎯' },
]

export const GAME_DB = {
  spiderman: { dev: 'Insomniac Games', tags: ['action'], icon: '🕷️', bg: 'bg-red' },
  'spider-man': { dev: 'Insomniac Games', tags: ['action'], icon: '🕷️', bg: 'bg-red' },
  fifa: { dev: 'EA Sports', tags: ['sport'], icon: '⚽', bg: 'bg-green' },
  'fc ': { dev: 'EA Sports', tags: ['sport'], icon: '⚽', bg: 'bg-green' },
  gta: { dev: 'Rockstar Games', tags: ['action'], icon: '🚗', bg: 'bg-purple' },
  'god of war': { dev: 'Sony Santa Monica', tags: ['action', 'adventure'], icon: '🪓', bg: 'bg-orange' },
  'call of duty': { dev: 'Activision', tags: ['action'], icon: '🔫', bg: 'bg-indigo' },
  'elden ring': { dev: 'FromSoftware', tags: ['rpg', 'action'], icon: '🗡️', bg: 'bg-teal' },
  zelda: { dev: 'Nintendo', tags: ['rpg', 'adventure'], icon: '🌿', bg: 'bg-teal' },
  mario: { dev: 'Nintendo', tags: ['sport', 'sim'], icon: '🏁', bg: 'bg-orange' },
  pokemon: { dev: 'Game Freak', tags: ['rpg', 'adventure'], icon: '🎮', bg: 'bg-pink' },
  minecraft: { dev: 'Mojang', tags: ['sim', 'puzzle'], icon: '🧱', bg: 'bg-green' },
  cyberpunk: { dev: 'CD Projekt Red', tags: ['rpg', 'action'], icon: '🌆', bg: 'bg-purple' },
  baldur: { dev: 'Larian Studios', tags: ['rpg', 'strategy'], icon: '🎲', bg: 'bg-purple' },
  hogwarts: { dev: 'Avalanche', tags: ['rpg', 'adventure'], icon: '🧙', bg: 'bg-purple' },
  horizon: { dev: 'Guerrilla Games', tags: ['action', 'rpg'], icon: '🏹', bg: 'bg-teal' },
  halo: { dev: '343 Industries', tags: ['action'], icon: '🪖', bg: 'bg-blue' },
  forza: { dev: 'Xbox Game Studios', tags: ['sport', 'sim'], icon: '🏎️', bg: 'bg-orange' },
  diablo: { dev: 'Blizzard', tags: ['rpg', 'action'], icon: '🔥', bg: 'bg-red' },
  'street fighter': { dev: 'Capcom', tags: ['action', 'sport'], icon: '👊', bg: 'bg-red' },
  'red dead': { dev: 'Rockstar', tags: ['action', 'adventure'], icon: '🤠', bg: 'bg-orange' },
  witcher: { dev: 'CD Projekt Red', tags: ['rpg', 'adventure'], icon: '⚔️', bg: 'bg-teal' },
  assassin: { dev: 'Ubisoft', tags: ['action', 'adventure'], icon: '🗡️', bg: 'bg-indigo' },
  starfield: { dev: 'Bethesda', tags: ['rpg', 'adventure'], icon: '🌌', bg: 'bg-indigo' },
  'alan wake': { dev: 'Remedy', tags: ['adventure', 'puzzle'], icon: '🔦', bg: 'bg-indigo' },
  fortnite: { dev: 'Epic Games', tags: ['action'], icon: '🎯', bg: 'bg-blue' },
  'mortal kombat': { dev: 'NetherRealm', tags: ['action'], icon: '💀', bg: 'bg-red' },
  apex: { dev: 'Respawn', tags: ['action'], icon: '🎯', bg: 'bg-orange' },
}

export function getFallbackIcon() {
  return FALLBACK_ICONS[Math.floor(Math.random() * FALLBACK_ICONS.length)]
}

export function findKnownGame(name) {
  const query = name.toLowerCase().trim()
  const key = Object.keys(GAME_DB).find((item) => query.includes(item))
  return key ? GAME_DB[key] : null
}

export function mapRawgGenres(genres = []) {
  const genreMap = {
    action: 'action',
    'role-playing-games-rpg': 'rpg',
    sports: 'sport',
    puzzle: 'puzzle',
    simulation: 'sim',
    strategy: 'strategy',
    adventure: 'adventure',
  }

  return genres.map((genre) => genreMap[genre.slug]).filter(Boolean).slice(0, 3)
}

export function mapRawgPlatform(platforms = []) {
  const names = platforms.map((item) => item.platform?.name || '').join(', ')
  const platformMap = {
    'PlayStation 5': 'PS5',
    'PlayStation 4': 'PS5',
    'Xbox Series S/X': 'Xbox',
    'Xbox One': 'Xbox',
    'Nintendo Switch': 'Nintendo',
    PC: 'PC',
  }
  const match = Object.keys(platformMap).find((platform) => names.includes(platform))
  return match ? platformMap[match] : ''
}

export function starText(count = 0) {
  if (!count) return ''
  return '★'.repeat(count) + '☆'.repeat(5 - count)
}
