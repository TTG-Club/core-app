import type {
  FilterGroup,
  FilterGroups,
  FilterItem,
  SourceCatalog,
  SourceCatalogRecord,
  SourceEntry,
  SourceNames,
} from '../types';

import { getGroupItems } from './getGroupItems';
import { normalizeForSearch } from './normalizeForSearch';

/**
 * Собирает справочник названий источников для панели выбора.
 *
 * Ключей два: акроним — им источник назван в фильтрах разделов, и русское
 * название — им он назван там, где выбор хранится названиями («Поиск игр»).
 *
 * @param records Источники из общего списка сайта.
 * @returns Справочник с поиском по акрониму и по русскому названию.
 */
export function buildSourceCatalog(
  records: ReadonlyArray<SourceCatalogRecord>,
): SourceCatalog {
  const byAcronym = new Map<string, SourceNames>();
  const byName = new Map<string, SourceNames>();

  for (const record of records) {
    const names: SourceNames = {
      acronym: record.acronym,
      english: record.english,
      image: record.image,
    };

    if (record.acronym) {
      byAcronym.set(record.acronym, names);
    }

    if (record.name) {
      byName.set(record.name, names);
    }
  }

  return { byAcronym, byName };
}

/**
 * Находит английское название и акроним источника.
 *
 * Сначала точное совпадение по акрониму, затем — по русскому названию. Без
 * совпадения источник показывается как есть, одним русским названием.
 *
 * @param filterItem Значение группы источников.
 * @param catalog Справочник названий.
 */
function findSourceNames(
  filterItem: FilterItem,
  catalog: SourceCatalog,
): SourceNames | undefined {
  return (
    catalog.byAcronym.get(String(filterItem.id))
    ?? catalog.byName.get(filterItem.name)
  );
}

/**
 * Раскладывает значения группы на строки панели: к каждому источнику —
 * английское название и акроним из справочника.
 *
 * Пока справочник не пришёл, акроним берётся из идентификатора значения: в
 * фильтрах разделов это он и есть. Там, где идентификатором служит само
 * название, подставлять его в акроним незачем.
 *
 * @param group Группа источников.
 * @param catalog Справочник названий.
 * @returns Строки панели в порядке значений группы.
 */
export function getSourceEntries(
  group: FilterGroup,
  catalog: SourceCatalog,
): Array<SourceEntry> {
  return getGroupItems(group).map((filterItem) => {
    const names = findSourceNames(filterItem, catalog);
    const identifier = String(filterItem.id);

    return {
      item: filterItem,
      selected: filterItem.selected === true,
      english: names?.english || undefined,
      image: names?.image || undefined,
      acronym:
        names?.acronym
        || (identifier === filterItem.name ? undefined : identifier),
    };
  });
}

/**
 * Проверяет, подходит ли источник под запрос: по русскому или английскому
 * названию либо по акрониму.
 */
function isEntryMatched(entry: SourceEntry, query: string): boolean {
  return [entry.item.name, entry.english, entry.acronym].some(
    (text) => !!text && normalizeForSearch(text).includes(query),
  );
}

/**
 * Оставляет в группе источники, подходящие под запрос, с учётом неверной
 * раскладки. Совпадение по названию группы показывает её целиком.
 *
 * Отмеченные источники под поиском не удерживаются: у источников по умолчанию
 * отмечено всё, и удержание превратило бы поиск в пустое действие. Сколько
 * отмечено, видно по счётчикам группы и панели.
 *
 * @param group Группа источников.
 * @param entries Строки группы.
 * @param search Строка из поля поиска (может быть пустой).
 * @returns Строки, которые следует показать.
 */
export function searchSourceEntries(
  group: FilterGroup,
  entries: Array<SourceEntry>,
  search: string,
): Array<SourceEntry> {
  if (!normalizeForSearch(search)) {
    return entries;
  }

  return withLayoutFallback(search, (query) =>
    normalizeForSearch(group.name).includes(query)
      ? entries
      : entries.filter((entry) => isEntryMatched(entry, query)),
  );
}

/**
 * Отмечает или снимает источники группы с перечисленными идентификаторами.
 *
 * @param group Группа источников.
 * @param ids Идентификаторы источников, которые меняются.
 * @param selected Отметить (`true`) или снять отметку (`false`).
 * @returns Новая группа; исходная не меняется.
 */
export function setSourcesSelected(
  group: FilterGroup,
  ids: ReadonlySet<FilterItem['id']>,
  selected: boolean,
): FilterGroup {
  return {
    ...group,
    values: getGroupItems(group).map((filterItem) =>
      ids.has(filterItem.id)
        ? { ...filterItem, selected: selected ? true : null }
        : filterItem,
    ),
  };
}

/**
 * Считает источники во всех группах панели.
 *
 * @param groups Группы источников.
 * @returns Сколько источников отмечено и сколько их всего.
 */
export function countSources(groups: FilterGroups): {
  selected: number;
  total: number;
} {
  const items = groups.flatMap((group) => getGroupItems(group));

  return {
    selected: items.filter((filterItem) => filterItem.selected).length,
    total: items.length,
  };
}

/**
 * Проверяет, что в панели есть все группы быстрого набора. Если какой-то нет,
 * набор не показывается: «Базовые и сеттинги» без сеттингов выбрал бы не то,
 * что написано на кнопке.
 *
 * @param groups Группы источников панели.
 * @param keys Ключи групп набора.
 */
export function isSourcePresetAvailable(
  groups: FilterGroups,
  keys: ReadonlyArray<string>,
): boolean {
  return keys.every((key) => groups.some((group) => group.key === key));
}

/**
 * Применяет быстрый набор: отмечает все источники его групп и снимает отметки
 * со всех остальных.
 *
 * @param groups Группы источников панели.
 * @param keys Ключи групп набора.
 * @returns Новые группы; исходные не меняются.
 */
export function applySourcePreset(
  groups: FilterGroups,
  keys: ReadonlyArray<string>,
): FilterGroups {
  return groups.map((group) =>
    setSourcesSelected(
      group,
      new Set(getGroupItems(group).map((filterItem) => filterItem.id)),
      keys.includes(group.key),
    ),
  );
}

/**
 * Проверяет, совпадает ли текущий выбор с быстрым набором: в его группах
 * отмечено всё, в остальных — ничего.
 *
 * @param groups Группы источников панели.
 * @param keys Ключи групп набора.
 */
export function isSourcePresetActive(
  groups: FilterGroups,
  keys: ReadonlyArray<string>,
): boolean {
  return groups.every((group) => {
    const isPresetGroup = keys.includes(group.key);

    return getGroupItems(group).every(
      (filterItem) => !!filterItem.selected === isPresetGroup,
    );
  });
}
