import type { MaybeRefOrGetter } from 'vue';

/** Код постоянного перенаправления: поисковики переносят вес на новый адрес. */
const MOVED_PERMANENTLY = 301;

/**
 * Перенаправляет страницу записи с прежнего адреса на текущий.
 *
 * Адрес записи каталога может смениться — например, вместе с акронимом её
 * источника (`fireball-phb` → `fireball-ph`). Сервис по прежнему адресу
 * отдаёт ту же запись, но уже с новым `url` в теле. Расхождение запрошенного
 * и полученного адреса и есть признак переезда: страница заменяет адрес в
 * строке на текущий, сохраняя параметры и якорь (ссылка на комментарий должна
 * пережить переезд).
 *
 * На сервере это ответ 301, в браузере — замена записи в истории, чтобы
 * «Назад» не возвращал на прежний адрес.
 *
 * @param entityUrl Адрес записи из ответа сервиса; пока запись не загружена — пусто.
 */
export function useEntityUrlRedirect(
  entityUrl: MaybeRefOrGetter<string | null | undefined>,
): void {
  const route = useRoute();

  watch(
    () => toValue(entityUrl),
    (currentUrl) => {
      const requestedUrl = route.params.url;

      if (
        !currentUrl
        || typeof requestedUrl !== 'string'
        || !requestedUrl
        || currentUrl === requestedUrl
      ) {
        return;
      }

      navigateTo(
        {
          params: { ...route.params, url: currentUrl },
          query: route.query,
          hash: route.hash,
        },
        { replace: true, redirectCode: MOVED_PERMANENTLY },
      );
    },
    { immediate: true },
  );
}
