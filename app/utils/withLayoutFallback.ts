/**
 * Ищет по запросу, а при пустой выдаче повторяет поиск в противоположной
 * раскладке («ащкешашсфешщт» → «fortification»). Конверсия пробуется только
 * после неудачи, чтобы не добавлять ложных совпадений к успешному запросу.
 *
 * Подходит только для синхронного поиска по уже загруженному списку. Если
 * повторный поиск — это второй сетевой запрос и конвертированный запрос нужно
 * запомнить для пагинации, хелпер не применяется: см.
 * `useSpellCatalogSearch.ts`.
 *
 * @param query исходный запрос, нормализованный вызывающим кодом
 *   (обрезанный и в нижнем регистре) — конверсия сравнивается с ним напрямую.
 * @param search функция поиска по нормализованному запросу.
 * @returns результат прямого поиска либо поиска в другой раскладке.
 */
export function withLayoutFallback<TItem>(
  query: string,
  search: (query: string) => TItem[],
): TItem[] {
  const matchedItems = search(query);

  if (matchedItems.length) {
    return matchedItems;
  }

  const layoutQuery = convertKeyboardLayout(query).toLowerCase();

  return layoutQuery === query ? matchedItems : search(layoutQuery);
}
