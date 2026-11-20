import type { ComputedRef } from 'vue';

import type { ClassLinkResponse } from '../model';

import { uniq } from 'es-toolkit';

import { useSubclassSourceFilter } from './useSubclassSourceFilter';

/**
 * Адреса подклассов в порядке выбора подкласса: группами по типу книги, в
 * порядке первого появления группы.
 *
 * @param subclasses Подклассы класса.
 * @returns Адреса страниц подклассов.
 */
function getSubclassPaths(subclasses: Array<ClassLinkResponse>): Array<string> {
  const groupLabels = uniq(
    subclasses.map((subclass) => subclass.source.group.label),
  );

  return groupLabels.flatMap((label) =>
    subclasses
      .filter((subclass) => subclass.source.group.label === label)
      .map((subclass) => `/classes/${subclass.url}`),
  );
}

/**
 * Что листать свайпом со страницы подкласса: соседние подклассы того же
 * класса. У самого класса своего порядка нет — он листает список классов.
 * Подклассы листаются, даже если страница открыта не из списка; источники,
 * выбранные в фильтре раздела классов, действуют и здесь.
 *
 * @param parentUrl Адрес класса, если открыт подкласс.
 * @returns Адреса подклассов или `undefined`, если открыт сам класс.
 */
export async function useSubclassPaths(
  parentUrl: string | undefined,
): Promise<ComputedRef<Array<string> | undefined>> {
  if (!parentUrl) {
    return computed(() => undefined);
  }

  const subclassesRequest = useAsyncData(
    `class-${parentUrl}-subclass-paths`,
    () =>
      $fetch<Array<ClassLinkResponse>>(
        `/api/v2/classes/${parentUrl}/subclasses`,
      ),
  );

  // До `await`: после него контекст Nuxt для `useRoute`/`useCookie` теряется
  const { visibleSubclasses } = useSubclassSourceFilter(subclassesRequest.data);

  await subclassesRequest;

  return computed(() =>
    visibleSubclasses.value
      ? getSubclassPaths(visibleSubclasses.value)
      : undefined,
  );
}
