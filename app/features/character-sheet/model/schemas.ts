import type {
  SpeciesFeatureSummary,
  SpeciesOption,
  SpeciesSummary,
  SpellCatalogItem,
} from './types';

import { z } from '~/utils/zod';

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
    eng: z.string().catch(''),
  }),
  level: z.coerce.number().catch(0),
  school: z.string().catch(''),
  concentration: z.boolean().catch(false),
  ritual: z.boolean().catch(false),
  classes: z.array(z.object({ name: z.string().catch('') })).catch([]),
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
    nameEng: spell.name.eng,
    level: spell.level,
    school: spell.school,
    concentration: spell.concentration,
    ritual: spell.ritual,
    classes: spell.classes.map((spellClass) => spellClass.name).filter(Boolean),
  }));
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
