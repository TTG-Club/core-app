type ValueOf<T> = T[keyof T];

export const SearchItems = {
  CLASS: 'class',
  BACKGROUND: 'background',
  FEAT: 'feat',
  SPECIES: 'species',
  SPELL: 'spell',
  BESTIARY: 'bestiary',
  MAGIC_ITEM: 'magic-item',
  ITEM: 'item',
  GLOSSARY: 'glossary',
} as const;

export type SearchItemsType = ValueOf<typeof SearchItems>;

export const mapSearchItemsToPaths = new Map<SearchItemsType, string>([
  [SearchItems.CLASS, 'classes'],
  [SearchItems.BACKGROUND, 'backgrounds'],
  [SearchItems.FEAT, 'feats'],
  [SearchItems.SPECIES, 'species'],
  [SearchItems.SPELL, 'spells'],
  [SearchItems.BESTIARY, 'bestiary'],
  [SearchItems.MAGIC_ITEM, 'magic-items'],
  [SearchItems.ITEM, 'item'],
  [SearchItems.GLOSSARY, 'glossary'],
]);

export const mapSearchItemsToTypeNames = new Map<SearchItemsType, string>([
  [SearchItems.CLASS, 'Классы'],
  [SearchItems.BACKGROUND, 'Предыстории'],
  [SearchItems.FEAT, 'Черты'],
  [SearchItems.SPECIES, 'Виды'],
  [SearchItems.SPELL, 'Заклинания'],
  [SearchItems.BESTIARY, 'Бестиарий'],
  [SearchItems.MAGIC_ITEM, 'Магические предметы'],
  [SearchItems.ITEM, 'Предметы'],
  [SearchItems.GLOSSARY, 'Глоссарий'],
]);
