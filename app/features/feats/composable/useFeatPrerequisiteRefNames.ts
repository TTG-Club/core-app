import type { ComputedRef } from 'vue';

import type { FeatEntityRef, FeatPrerequisiteSource } from '../model';

import { z } from 'zod';

/**
 * Названия записей, на которые ссылается предварительное условие черты.
 *
 * Ссылка в требовании — это url и снимок названия, но снимок пишется только с
 * тех пор, как записи стали выбираться в редакторе: у черт, сохранённых
 * раньше, его нет, и условие показывало бы ссылку («черта
 * «lightly-armored-phb»»). Недостающие названия догружаются с карточек самих
 * записей — по одной на ссылку: список черт отдаётся целиком, вместе со всей
 * механикой, и тянуть его ради одного названия дороже самих карточек.
 */

/** Разделы справочника, на которые ссылается условие. */
const REF_SECTIONS = ['feats', 'classes', 'species', 'backgrounds'] as const;

type FeatRefSection = (typeof REF_SECTIONS)[number];

/** Ручки карточек по разделам: из них берётся название записи. */
const REF_SECTION_PATHS: Record<FeatRefSection, string> = {
  feats: '/api/v2/feats',
  classes: '/api/v2/classes',
  species: '/api/v2/species',
  backgrounds: '/api/v2/backgrounds',
};

/** Ключ загрузки: к нему дописываются ссылки, которые надо перевести. */
const REF_NAMES_KEY_PREFIX = 'feat-prerequisite-ref-names';

/** Ссылка требования, название которой надо догрузить. */
interface FeatRefTarget {
  section: FeatRefSection;
  url: string;
}

/** Название записи справочника под её ссылкой. */
interface FeatRefName {
  url: string;
  name: string;
}

/** Из карточки записи нужно только название: остальное схема пропускает. */
const refDetailSchema = z.object({
  name: z.object({
    rus: z.string().catch(''),
    eng: z.string().catch(''),
  }),
});

/**
 * Ссылки требований без снимка названия — только их и надо переводить.
 *
 * @param prerequisite разобранные требования; не заданы — условия нет.
 * @returns ссылки по разделам справочника.
 */
function getRefsWithoutName(
  prerequisite: FeatPrerequisiteSource | undefined,
): Array<FeatRefTarget> {
  if (!prerequisite) {
    return [];
  }

  return REF_SECTIONS.flatMap((section) =>
    (prerequisite[section] ?? [])
      .filter(
        (reference: FeatEntityRef) =>
          !reference.name?.trim() && !!reference.url,
      )
      .map((reference: FeatEntityRef) => ({ section, url: reference.url })),
  );
}

/**
 * Название одной записи с её карточки.
 *
 * @param target ссылка требования.
 * @returns название; `undefined` — записи с таким url в справочнике нет.
 */
async function loadRefName(
  target: FeatRefTarget,
): Promise<FeatRefName | undefined> {
  const { section, url } = target;

  try {
    const response = await $fetch<unknown>(
      `${REF_SECTION_PATHS[section]}/${url}`,
      { method: 'get' },
    );

    const parsed = refDetailSchema.safeParse(response);

    if (!parsed.success) {
      return undefined;
    }

    const name = parsed.data.name.rus || parsed.data.name.eng;

    return name ? { url, name } : undefined;
  } catch {
    // Запись могли удалить или переименовать: тогда в условии останется
    // ссылка — это некрасиво, но честнее пропавшего требования
    return undefined;
  }
}

/**
 * Названия всех записей, на которые ссылается условие.
 *
 * @param targets ссылки требований без снимка названия.
 * @returns названия найденных записей.
 */
async function loadRefNames(
  targets: Array<FeatRefTarget>,
): Promise<Array<FeatRefName>> {
  const loaded = await Promise.all(targets.map(loadRefName));

  return loaded.filter((entry): entry is FeatRefName => !!entry);
}

/**
 * Подписи ссылок требования: по url отдаёт название записи.
 *
 * @param prerequisite разобранные требования черты.
 * @returns названия записей по url; пусто — снимки есть у всех ссылок.
 */
export async function useFeatPrerequisiteRefNames(
  prerequisite: MaybeRefOrGetter<FeatPrerequisiteSource | undefined>,
): Promise<{ refNames: ComputedRef<Map<string, string>> }> {
  const targets = computed<Array<FeatRefTarget>>(() =>
    getRefsWithoutName(toValue(prerequisite)),
  );

  // Ключ собирается из самих ссылок: у соседних черт требования разные, а
  // общий ключ отдал бы им первый загруженный набор названий
  const { data: names } = await useAsyncData(
    computed(
      () =>
        `${REF_NAMES_KEY_PREFIX}:${targets.value.map(({ url }) => url).join(',')}`,
    ),
    () => loadRefNames(targets.value),
    { default: (): Array<FeatRefName> => [] },
  );

  const refNames = computed<Map<string, string>>(
    () => new Map((names.value ?? []).map(({ url, name }) => [url, name])),
  );

  return { refNames };
}
