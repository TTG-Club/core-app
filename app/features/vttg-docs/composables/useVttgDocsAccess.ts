import { getVttgDocsIndexPath } from '#shared/utils';

import { fetchVttgDocsAccess, getVttgDocsAccessDataKey } from '../model';

/**
 * Доступ посетителя к разделу документации — для пунктов меню. Раздел может
 * быть закрыт не всем (настройка в админке), поэтому сайт спрашивает сервер.
 * Ключ данных зависит от ролей: после входа или выхода доступ перечитывается.
 *
 * @returns открыт ли раздел и адрес его первого открытого канала
 */
export function useVttgDocsAccess() {
  const requestFetch = useRequestFetch();
  const { roles } = useUser();

  const { data: accessResponse } = useAsyncData(
    () => getVttgDocsAccessDataKey(roles.value ?? []),
    () => fetchVttgDocsAccess(requestFetch),
    { lazy: true },
  );

  /** Адрес оглавления первого открытого канала; нет каналов — раздела нет. */
  const docsPath = computed(() => {
    const [firstChannel] = accessResponse.value?.channels ?? [];

    return firstChannel ? getVttgDocsIndexPath(firstChannel) : undefined;
  });

  const hasAccess = computed(() => Boolean(docsPath.value));

  return { docsPath, hasAccess };
}
