import type { SourceLinkResponse } from '~sources/types';

import { SOURCES_SEARCH_PATH } from '../model';

/**
 * Справочник источников сайта для выбора допустимых книг игры.
 *
 * Список один на весь раздел и меняется редко, поэтому
 * `createSharedComposable`: открытая форма создания и форма редактирования не
 * должны тянуть его по разу каждая.
 *
 * Ходим в тот же поиск, что и раздел «Источники», — своего справочника у
 * find-game-api нет и заводить его незачем: книги принадлежат core-api.
 */
export const useSourceDictionary = createSharedComposable(() => {
  const {
    data: sources,
    error,
    status,
  } = useAsyncData(
    'find-game-source-dictionary',
    () =>
      $fetch<Array<SourceLinkResponse>>(SOURCES_SEARCH_PATH, {
        method: 'POST',
        body: {},
        retry: 0,
      }),
    { server: false, deep: false, default: () => [] },
  );

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  /**
   * Названия книг для выбора. В игре хранится именно название: сервис поиска
   * игр держит источники простыми строками, и так список остаётся читаемым
   * даже без обращения к справочнику.
   */
  const sourceNames = computed(() =>
    [...new Set((sources.value ?? []).map((source) => source.name.rus))]
      .filter(Boolean)
      .sort((first, second) => first.localeCompare(second, 'ru')),
  );

  /**
   * Источники, разложенные по группам справочника — «Базовые», «Сеттинги»,
   * «Приключения», «3rd party». Тот же порядок и та же разбивка, что в
   * фильтрах остальных разделов сайта.
   */
  const sourceGroups = computed(() => {
    const groups = new Map<string, { name: string; sources: Array<string> }>();

    for (const source of sources.value ?? []) {
      const name = source.name.rus;
      const group = source.source.group;

      if (!name || !group?.label) {
        continue;
      }

      const bucket = groups.get(group.label) ?? {
        name: group.rus,
        sources: [],
      };

      if (!bucket.sources.includes(name)) {
        bucket.sources.push(name);
      }

      groups.set(group.label, bucket);
    }

    return [...groups.entries()].map(([key, bucket]) => ({
      key,
      name: bucket.name,
      sources: bucket.sources.sort((first, second) =>
        first.localeCompare(second, 'ru'),
      ),
    }));
  });

  return {
    error,
    isLoading,
    sourceGroups,
    sourceNames,
  };
});
