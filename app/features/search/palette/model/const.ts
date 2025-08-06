type ValueOf<T> = T[keyof T];

const SearchItems = {
  BACKGROUND: 'background',
  FEAT: 'feat',
  SPECIES: 'species',
  SPELL: 'spell',
  BESTIARY: 'bestiary',
} as const;

export type SearchItemsType = ValueOf<typeof SearchItems>;

export const mapSearchItemsToPaths = new Map<SearchItemsType, string>([
  [SearchItems.BACKGROUND, 'backgrounds'],
  [SearchItems.FEAT, 'feats'],
  [SearchItems.SPECIES, 'species'],
  [SearchItems.SPELL, 'spells'],
  [SearchItems.BESTIARY, 'bestiary'],
]);

export const mapSearchItemsToTypeNames = new Map<SearchItemsType, string>([
  [SearchItems.BACKGROUND, 'Предыстории'],
  [SearchItems.FEAT, 'Черты'],
  [SearchItems.SPECIES, 'Виды'],
  [SearchItems.SPELL, 'Заклинания'],
  [SearchItems.BESTIARY, 'Бестиарий'],
]);
