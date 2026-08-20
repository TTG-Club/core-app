import { z } from 'zod';

/**
 * Справочник записей, на которые ссылается черта.
 *
 * Ссылка в механике — это один url: названия и источника в ней нет, а строка
 * редактора обязана показать и то, и другое, да ещё и предупредить, если записи
 * с таким url в справочнике не осталось. Отсюда и справочник: он переводит url
 * в название, источник и адрес карточки.
 */

/** Раздел справочника, из которого берётся запись. */
export type FeatRefKind =
  | 'FEAT'
  | 'CLASS'
  | 'SPECIES'
  | 'BACKGROUND'
  | 'SPELL'
  | 'ITEM';

/** Запись справочника в том виде, в каком её показывает строка. */
export interface FeatRefEntry {
  url: string;
  name: string;
  source: string;

  /**
   * Круг заклинания; `undefined` — у записи круга нет (черта, класс, вид).
   *
   * Показывается строкой только для справки: круг — свойство самой записи, в
   * механику черты он не пишется, а таблица «Заклинания метки» на странице
   * группируется по нему сама.
   */
  level?: number;

  /** Адрес карточки записи на сайте. */
  route: string;
}

interface FeatRefSource {
  /**
   * Ручка со списком раздела; пусто — списка нет, и запись догружается по
   * одной. Так у заклинаний и предметов: их выдача постраничная, и целиком
   * такой список не забрать.
   */
  list: string | undefined;
  detail: string;
  route: string;
}

const REF_SOURCES: Record<FeatRefKind, FeatRefSource> = {
  FEAT: {
    list: '/api/v2/feats/select',
    detail: '/api/v2/feats',
    route: '/feats',
  },
  CLASS: {
    list: '/api/v2/classes/search',
    detail: '/api/v2/classes',
    route: '/classes',
  },
  SPECIES: {
    list: '/api/v2/species/search',
    detail: '/api/v2/species',
    route: '/species',
  },
  BACKGROUND: {
    list: '/api/v2/backgrounds/select',
    detail: '/api/v2/backgrounds',
    route: '/backgrounds',
  },
  SPELL: {
    list: undefined,
    detail: '/api/v2/spells',
    route: '/spells',
  },
  ITEM: {
    list: undefined,
    detail: '/api/v2/item',
    route: '/items',
  },
};

/**
 * Общая часть ответа всех разделов: url, название и источник. Разделы отдают
 * разные наборы полей, поэтому всё лишнее схема пропускает, а недостающее
 * заменяет пустой строкой — из-за отсутствия источника строка показываться не
 * перестанет.
 */
const refResponseSchema = z.object({
  url: z.string(),
  name: z
    .object({ rus: z.string().catch(''), eng: z.string().catch('') })
    .catch({ rus: '', eng: '' }),
  source: z
    .object({
      name: z.object({ label: z.string().catch('') }).catch({ label: '' }),
    })
    .nullish()
    .catch(null),
  // Круг есть только у заклинаний; у остальных разделов поля нет
  level: z.coerce.number().nullish().catch(null),
});

const refListSchema = z.array(refResponseSchema).catch([]);

/**
 * Загруженные списки разделов и отдельные записи. Кэш общий на приложение:
 * строк со ссылками в форме много, и каждая иначе тянула бы список заново.
 * Данные тут публичные и от пользователя не зависят.
 */
const listCache = new Map<FeatRefKind, Promise<Array<FeatRefEntry>>>();
const detailCache = new Map<string, Promise<FeatRefEntry | undefined>>();

/** Приводит ответ раздела к записи справочника. */
function toRefEntry(
  kind: FeatRefKind,
  response: z.infer<typeof refResponseSchema>,
): FeatRefEntry {
  return {
    url: response.url,
    name: response.name.rus || response.name.eng || response.url,
    source: response.source?.name.label ?? '',
    level: response.level ?? undefined,
    route: `${REF_SOURCES[kind].route}/${response.url}`,
  };
}

/** Загружает список раздела целиком. */
function loadList(kind: FeatRefKind): Promise<Array<FeatRefEntry>> {
  const cached = listCache.get(kind);

  if (cached) {
    return cached;
  }

  const listUrl = REF_SOURCES[kind].list;

  const request = listUrl
    ? $fetch<unknown>(listUrl, { method: 'get' })
        .then((response) =>
          refListSchema.parse(response).map((entry) => toRefEntry(kind, entry)),
        )
        .catch(() => [])
    : Promise.resolve<Array<FeatRefEntry>>([]);

  listCache.set(kind, request);

  return request;
}

/** Загружает одну запись раздела по её url. */
function loadDetail(
  kind: FeatRefKind,
  url: string,
): Promise<FeatRefEntry | undefined> {
  const cacheKey = `${kind}:${url}`;
  const cached = detailCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const request = $fetch<unknown>(`${REF_SOURCES[kind].detail}/${url}`, {
    method: 'get',
  })
    .then((response) => {
      const parsed = refResponseSchema.safeParse(response);

      return parsed.success ? toRefEntry(kind, parsed.data) : undefined;
    })
    .catch(() => undefined);

  detailCache.set(cacheKey, request);

  return request;
}

/**
 * Справочник записей раздела: по url отдаёт название, источник и адрес
 * карточки.
 *
 * Разделы со списком загружаются целиком — так сразу видно и то, что записи с
 * таким url нет. Заклинания и предметы отдаются постранично, поэтому у них
 * догружается ровно то, на что ссылается черта.
 *
 * @param kind раздел справочника.
 * @param urls url, которые нужно показать.
 * @returns поиск записи по url и признак загрузки.
 */
export function useFeatRefDirectory(
  kind: MaybeRefOrGetter<FeatRefKind>,
  urls: MaybeRefOrGetter<Array<string>>,
) {
  const entries = ref(new Map<string, FeatRefEntry>());
  const isLoading = ref(false);

  /** Дозагружает всё, что нужно показать текущим строкам. */
  async function load(): Promise<void> {
    const section = toValue(kind);
    const wanted = toValue(urls).filter((url) => !!url);

    isLoading.value = true;

    try {
      const known = new Map<string, FeatRefEntry>();

      if (REF_SOURCES[section].list) {
        for (const entry of await loadList(section)) {
          known.set(entry.url, entry);
        }
      } else {
        const loaded = await Promise.all(
          wanted.map((url) => loadDetail(section, url)),
        );

        for (const entry of loaded) {
          if (entry) {
            known.set(entry.url, entry);
          }
        }
      }

      entries.value = known;
    } finally {
      isLoading.value = false;
    }
  }

  // Один watch на оба источника: раздел и набор ссылок меняют одно и то же —
  // что именно нужно догрузить. Ссылки сравниваются склеенной строкой, иначе
  // новый массив с тем же содержимым перезапускал бы загрузку на каждый ввод.
  // Цикла нет: загрузка пишет в `entries`, за которым watch не следит
  watch(
    [() => toValue(kind), () => toValue(urls).join(',')],
    () => void load(),
    { immediate: true },
  );

  /**
   * Запись справочника под ссылкой.
   *
   * @param url ссылка строки.
   * @returns запись; `undefined` — такой записи в справочнике нет.
   */
  function getEntry(url: string): FeatRefEntry | undefined {
    return entries.value.get(url);
  }

  return { getEntry, isLoading };
}
