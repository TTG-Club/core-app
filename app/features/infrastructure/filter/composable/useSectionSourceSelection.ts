import type { ComputedRef } from 'vue';

import {
  getFilterCookieName,
  parseQueryList,
  parseSavedFilterQuery,
} from '../utils';

/**
 * Источники, которые пользователь сам выбрал в фильтре раздела, — для того,
 * что раздел показывает помимо списка (например, подклассы открытого класса).
 *
 * Выбор по умолчанию в адрес и в куку не попадает, поэтому `undefined`
 * означает «источники не сужены». На странице списка источник правды —
 * адрес: фильтр держит его в синхронизации. На странице записи — адрес, если
 * ссылкой поделились вместе с источниками, иначе запомненный в куке выбор
 * раздела. На страницах других разделов выбор этого раздела не действует.
 *
 * @param key ключ раздела — тот же, что у его `useFilter`.
 * @param sectionPath путь списка раздела, например `/classes`.
 * @returns акронимы выбранных источников или `undefined`.
 */
export function useSectionSourceSelection(
  key: string,
  sectionPath: string,
): ComputedRef<Array<string> | undefined> {
  const route = useRoute();

  // Только чтение: пишет в куку фильтр раздела на странице списка
  const savedCookie = useCookie<unknown>(getFilterCookieName(key), {
    readonly: true,
  });

  return computed(() => {
    const queryAcronyms = parseQueryList(route.query.source);

    if (route.path === sectionPath) {
      return queryAcronyms;
    }

    if (!route.path.startsWith(`${sectionPath}/`)) {
      return undefined;
    }

    return (
      queryAcronyms
      ?? parseQueryList(parseSavedFilterQuery(savedCookie.value).source)
    );
  });
}
