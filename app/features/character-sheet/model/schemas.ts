import type { RenderNode } from '~ui/markup';

import type {
  ClassFeatureSummary,
  ClassOption,
  ClassSummary,
  ClassTableColumn,
  FeatCatalogItem,
  FeatSummary,
  ItemCatalogItem,
  ItemSummary,
  MagicItemCatalogItem,
  SpeciesFeatureSummary,
  SpeciesOption,
  SpeciesSummary,
  SpellCatalogItem,
} from './types';

import { z } from '~/utils/zod';

import {
  parseItemWeight,
  parseSavingThrows,
  toDescriptionNodes,
} from './utils';

/**
 * Схема ссылки на вид из поиска. Валидируем только используемые поля;
 * пропущенные подписи не роняют разбор.
 */
const speciesLinkSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  source: z
    .object({
      name: z.object({ label: z.string().catch('') }).catch({ label: '' }),
    })
    .catch({ name: { label: '' } }),
  hasLineages: z.boolean().catch(false),
});

/** Ответ поиска видов: плоский массив или конверт `{ value }`. */
const speciesSearchResponseSchema = z
  .union([
    z.array(speciesLinkSchema),
    z.object({ value: z.array(speciesLinkSchema) }),
  ])
  .catch([]);

/** Схема особенности вида в детальном ответе. */
const speciesFeatureSchema = z.object({
  url: z.string().catch(''),
  name: z.object({ rus: z.string().catch('') }),
  description: z.array(z.string()).catch([]),
});

/** Схема детального ответа вида или подвида (нужные листу поля). */
const speciesDetailSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  hasLineages: z.boolean().catch(false),
  properties: z
    .object({
      size: z.string().catch(''),
      speed: z.string().catch(''),
    })
    .catch({ size: '', speed: '' }),
  features: z.array(speciesFeatureSchema).catch([]),
});

/** Ответ списка подвидов: массив детальных ответов. */
const speciesLineagesResponseSchema = z.array(speciesDetailSchema).catch([]);

/**
 * Приведение детального ответа вида к полям, нужным листу персонажа.
 *
 * @param detail разобранный детальный ответ.
 * @returns деталь вида для листа.
 */
function toSpeciesSummary(
  detail: z.infer<typeof speciesDetailSchema>,
): SpeciesSummary {
  const features: SpeciesFeatureSummary[] = detail.features.map((feature) => ({
    url: feature.url,
    name: feature.name.rus,
    description: feature.description,
  }));

  return {
    url: detail.url,
    name: detail.name.rus,
    hasLineages: detail.hasLineages,
    sizeText: detail.properties.size,
    speedText: detail.properties.speed,
    features,
  };
}

/**
 * Схема ссылки на заклинание из поиска. Валидируем только используемые поля.
 */
const spellLinkSchema = z.object({
  url: z.string(),
  name: z.object({
    rus: z.string().catch(''),
  }),
  level: z.coerce.number().catch(0),
  school: z.string().catch(''),
  concentration: z.boolean().catch(false),
  ritual: z.boolean().catch(false),
});

/** Ответ поиска заклинаний: плоский массив или страница `{ value, Count }`. */
const spellSearchResponseSchema = z
  .union([
    z.array(spellLinkSchema),
    z.object({ value: z.array(spellLinkSchema) }),
  ])
  .catch([]);

/**
 * Валидация страницы ответа `GET /api/v2/spells/search` и приведение к списку
 * каталога. Битый ответ даёт пустой список, а не исключение.
 *
 * @param input сырой ответ поиска заклинаний.
 * @returns заклинания каталога для модалки добавления.
 */
export function parseSpellCatalog(input: unknown): SpellCatalogItem[] {
  const parsed = spellSearchResponseSchema.parse(input);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return list.map((spell) => ({
    url: spell.url,
    name: spell.name.rus,
    level: spell.level,
    school: spell.school,
    concentration: spell.concentration,
    ritual: spell.ritual,
  }));
}

/**
 * Схема ссылки на черту из поиска. Валидируем только используемые поля.
 */
const featLinkSchema = z.object({
  url: z.string(),
  name: z.object({
    rus: z.string().catch(''),
    eng: z.string().catch(''),
  }),
  category: z.string().catch(''),
  source: z
    .object({
      name: z.object({ label: z.string().catch('') }).catch({ label: '' }),
    })
    .catch({ name: { label: '' } }),
});

/** Ответ поиска черт: плоский массив или конверт `{ value }`. */
const featSearchResponseSchema = z
  .union([
    z.array(featLinkSchema),
    z.object({ value: z.array(featLinkSchema) }),
  ])
  .catch([]);

/**
 * Валидация ответа `GET /api/v2/feats/search` и приведение к списку каталога.
 * Битый ответ даёт пустой список, а не исключение.
 *
 * @param input сырой ответ поиска черт.
 * @returns черты каталога для модалки добавления.
 */
export function parseFeatCatalog(input: unknown): FeatCatalogItem[] {
  const parsed = featSearchResponseSchema.parse(input);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return list.map((feat) => ({
    url: feat.url,
    name: feat.name.rus,
    nameEng: feat.name.eng,
    category: feat.category,
    sourceLabel: feat.source.name.label,
  }));
}

/** Схема детального ответа черты (нужные листу поля). */
const featDetailSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  category: z.string().catch(''),
  description: z.array(z.string()).catch([]),
});

/**
 * Валидация детального ответа `GET /api/v2/feats/{url}`.
 *
 * @param input сырой детальный ответ черты.
 * @returns деталь черты или null при неожиданном ответе.
 */
export function parseFeatDetail(input: unknown): FeatSummary | null {
  const result = featDetailSchema.safeParse(input);

  if (!result.success) {
    return null;
  }

  return {
    url: result.data.url,
    name: result.data.name.rus,
    category: result.data.category,
    description: result.data.description,
  };
}

/**
 * Схема ссылки на предмет из поиска. Валидируем только используемые поля.
 */
const itemLinkSchema = z.object({
  url: z.string(),
  name: z.object({
    rus: z.string().catch(''),
    eng: z.string().catch(''),
  }),
  cost: z.string().catch(''),
  source: z
    .object({
      name: z.object({ label: z.string().catch('') }).catch({ label: '' }),
    })
    .catch({ name: { label: '' } }),
});

/** Ответ поиска предметов: плоский массив или конверт `{ value }`. */
const itemSearchResponseSchema = z
  .union([
    z.array(itemLinkSchema),
    z.object({ value: z.array(itemLinkSchema) }),
  ])
  .catch([]);

/**
 * Валидация ответа `GET /api/v2/item/search` и приведение к списку каталога.
 * Битый ответ даёт пустой список, а не исключение.
 *
 * @param input сырой ответ поиска предметов.
 * @returns предметы каталога для модалки добавления.
 */
export function parseItemCatalog(input: unknown): ItemCatalogItem[] {
  const parsed = itemSearchResponseSchema.parse(input);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return list.map((catalogItem) => ({
    url: catalogItem.url,
    name: catalogItem.name.rus,
    nameEng: catalogItem.name.eng,
    cost: catalogItem.cost,
    sourceLabel: catalogItem.source.name.label,
  }));
}

/**
 * Схема ссылки на магический предмет из поиска. Валидируем только используемые
 * поля.
 */
const magicItemLinkSchema = z.object({
  url: z.string(),
  name: z.object({
    rus: z.string().catch(''),
    eng: z.string().catch(''),
  }),
  category: z.string().catch(''),
  rarity: z.string().catch(''),
  source: z
    .object({
      name: z.object({ label: z.string().catch('') }).catch({ label: '' }),
    })
    .catch({ name: { label: '' } }),
});

/** Ответ поиска магических предметов: плоский массив или конверт `{ value }`. */
const magicItemSearchResponseSchema = z
  .union([
    z.array(magicItemLinkSchema),
    z.object({ value: z.array(magicItemLinkSchema) }),
  ])
  .catch([]);

/**
 * Валидация ответа `GET /api/v2/magic-items/search` и приведение к списку
 * каталога. Битый ответ даёт пустой список, а не исключение.
 *
 * @param input сырой ответ поиска магических предметов.
 * @returns магические предметы каталога для модалки добавления.
 */
export function parseMagicItemCatalog(input: unknown): MagicItemCatalogItem[] {
  const parsed = magicItemSearchResponseSchema.parse(input);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return list.map((catalogItem) => ({
    url: catalogItem.url,
    name: catalogItem.name.rus,
    nameEng: catalogItem.name.eng,
    category: catalogItem.category,
    rarity: catalogItem.rarity,
    sourceLabel: catalogItem.source.name.label,
  }));
}

/** Схема детального ответа предмета (нужные листу поля). */
const itemDetailSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  category: z.enum(['WEAPON', 'ARMOR', 'ITEM']).catch('ITEM'),
  types: z.string().catch(''),
  cost: z.string().catch(''),
  weight: z.string().catch(''),
});

/**
 * Валидация детального ответа `GET /api/v2/item/{url}`.
 *
 * @param input сырой детальный ответ предмета.
 * @returns деталь предмета или null при неожиданном ответе.
 */
export function parseItemDetail(input: unknown): ItemSummary | null {
  const result = itemDetailSchema.safeParse(input);

  if (!result.success) {
    return null;
  }

  return {
    url: result.data.url,
    name: result.data.name.rus,
    category: result.data.category,
    typesLabel: result.data.types,
    cost: result.data.cost,
    weight: parseItemWeight(result.data.weight),
  };
}

/**
 * Валидация ответа `GET /api/v2/species/search` и приведение к опциям
 * автокомплита. Битый ответ даёт пустой список, а не исключение.
 *
 * @param input сырой ответ поиска видов.
 * @returns опции автокомплита выбора вида.
 */
export function parseSpeciesOptions(input: unknown): SpeciesOption[] {
  const parsed = speciesSearchResponseSchema.parse(input);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return list.map((species) => ({
    url: species.url,
    name: species.name.rus,
    sourceLabel: species.source.name.label,
    hasLineages: species.hasLineages,
  }));
}

/**
 * Валидация детального ответа `GET /api/v2/species/{url}`.
 *
 * @param input сырой детальный ответ вида.
 * @returns деталь вида или null при неожиданном ответе.
 */
export function parseSpeciesDetail(input: unknown): SpeciesSummary | null {
  const result = speciesDetailSchema.safeParse(input);

  return result.success ? toSpeciesSummary(result.data) : null;
}

/**
 * Валидация ответа `GET /api/v2/species/{url}/lineages`.
 *
 * @param input сырой ответ списка подвидов.
 * @returns детали подвидов; битый ответ даёт пустой список.
 */
export function parseSpeciesLineages(input: unknown): SpeciesSummary[] {
  return speciesLineagesResponseSchema.parse(input).map(toSpeciesSummary);
}

/** Схема ссылки на класс/подкласс из поиска. Валидируем нужные листу поля. */
const classLinkSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  source: z
    .object({
      name: z.object({ label: z.string().catch('') }).catch({ label: '' }),
    })
    .catch({ name: { label: '' } }),
  hasSubclasses: z.boolean().catch(false),
});

/** Ответ поиска классов/подклассов: плоский массив или конверт `{ value }`. */
const classSearchResponseSchema = z
  .union([
    z.array(classLinkSchema),
    z.object({ value: z.array(classLinkSchema) }),
  ])
  .catch([]);

/**
 * Валидация ответа `GET /api/v2/classes/search` (и `/{url}/subclasses`) и
 * приведение к опциям списка. Битый ответ даёт пустой список, а не исключение.
 *
 * @param input сырой ответ поиска классов или подклассов.
 * @param forceNoSubclasses принудительно снять флаг подклассов (для подклассов).
 * @returns опции классов для визарда.
 */
export function parseClassOptions(
  input: unknown,
  forceNoSubclasses = false,
): ClassOption[] {
  const parsed = classSearchResponseSchema.parse(input);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return list.map((classLink) => ({
    url: classLink.url,
    name: classLink.name.rus,
    sourceLabel: classLink.source.name.label,
    hasSubclasses: forceNoSubclasses ? false : classLink.hasSubclasses,
  }));
}

/** Схема колонки таблицы прогрессии класса. */
const classTableColumnSchema = z.object({
  name: z.string().catch(''),
  scaling: z
    .array(
      z.object({
        level: z.coerce.number().catch(1),
        value: z.string().catch(''),
      }),
    )
    .catch([]),
});

/** Узел разметки описания класса; отсутствие приводится к пустой строке. */
const renderNodeSchema = z
  .custom<RenderNode>((value) => value !== undefined)
  .catch('');

/** Схема особенности класса в детальном ответе. */
const classFeatureSchema = z.object({
  key: z.string().catch(''),
  level: z.coerce.number().catch(1),
  name: z.string().catch(''),
  description: renderNodeSchema,
  isSubclass: z.boolean().catch(false),
});

/** Схема детального ответа класса или подкласса (нужные листу поля). */
const classDetailSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  hasSubclasses: z.boolean().catch(false),
  hitDice: z
    .object({
      label: z.string().catch(''),
      maxValue: z.coerce.number().catch(0),
    })
    .catch({ label: '', maxValue: 0 }),
  savingThrows: z.string().catch(''),
  proficiency: z
    .object({
      armor: z.string().catch(''),
      weapon: z.string().catch(''),
      tool: z.string().catch(''),
      skill: z.string().catch(''),
    })
    .catch({ armor: '', weapon: '', tool: '', skill: '' }),
  table: z.array(classTableColumnSchema).catch([]),
  features: z.array(classFeatureSchema).catch([]),
});

/**
 * Приведение детального ответа класса к полям, нужным листу персонажа.
 *
 * @param detail разобранный детальный ответ.
 * @returns деталь класса для листа.
 */
function toClassSummary(
  detail: z.infer<typeof classDetailSchema>,
): ClassSummary {
  const features: ClassFeatureSummary[] = detail.features.map((feature) => ({
    key: feature.key,
    level: feature.level,
    name: feature.name,
    description: toDescriptionNodes(feature.description),
    isSubclass: feature.isSubclass,
  }));

  const table: ClassTableColumn[] = detail.table.map((column) => ({
    name: column.name,
    scaling: column.scaling,
  }));

  return {
    url: detail.url,
    name: detail.name.rus,
    hasSubclasses: detail.hasSubclasses,
    hitDie: detail.hitDice.maxValue,
    hitDieLabel: detail.hitDice.label,
    savingThrowsText: detail.savingThrows,
    savingThrows: parseSavingThrows(detail.savingThrows),
    proficiencyText: detail.proficiency,
    table,
    features,
  };
}

/**
 * Валидация детального ответа `GET /api/v2/classes/{url}`.
 *
 * @param input сырой детальный ответ класса или подкласса.
 * @returns деталь класса или null при неожиданном ответе.
 */
export function parseClassDetail(input: unknown): ClassSummary | null {
  const result = classDetailSchema.safeParse(input);

  return result.success ? toClassSummary(result.data) : null;
}
