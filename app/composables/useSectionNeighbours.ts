import type { MaybeRefOrGetter, Ref } from 'vue';

/**
 * Адреса записей списка раздела в том порядке, в каком их видно на экране.
 * Список сохраняет их, чтобы на телефоне со страницы записи листать соседние.
 *
 * @param sectionPath Путь раздела (например, '/spells').
 * @returns Общее состояние адресов записей раздела.
 */
export function useSectionPaths(sectionPath: string): Ref<Array<string>> {
  return useState<Array<string>>(`section-paths:${sectionPath}`, () => []);
}

/**
 * Запоминает порядок записей списка раздела для свайпа на странице записи.
 * Запись из нескольких групп считается по первой. Серверу порядок не нужен,
 * и в ответ страницы он не попадает.
 *
 * @param sectionPath Путь раздела (например, '/spells').
 * @param urls Адреса записей в порядке экрана; `undefined` — список сейчас
 * показывает не этот источник, и порядок не трогается.
 */
export function useSectionNeighbours(
  sectionPath: string,
  urls: MaybeRefOrGetter<Array<string> | null | undefined>,
): void {
  if (import.meta.server) {
    return;
  }

  const paths = useSectionPaths(sectionPath);

  watchImmediate(
    () => toValue(urls),
    (visibleUrls) => {
      if (!visibleUrls) {
        return;
      }

      paths.value = [
        ...new Set(visibleUrls.map((url) => `${sectionPath}/${url}`)),
      ];
    },
  );
}
