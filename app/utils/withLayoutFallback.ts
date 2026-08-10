/**
 * Ищет по запросу, а при пустой выдаче повторяет поиск в противоположной
 * раскладке («ащкешашсфешщт» → «fortification»). Конверсия пробуется только
 * после неудачи, чтобы не добавлять ложных совпадений к успешному запросу.
 *
 * Запрос нормализуется внутри: сравнение с конверсией всегда идёт в одном
 * регистре, и вызывающему коду не нужно помнить о предусловии.
 *
 * Подходит только для синхронного поиска по уже загруженному списку. Если
 * повторный поиск — это второй сетевой запрос и конвертированный запрос нужно
 * запомнить для пагинации, хелпер не применяется: см.
 * `useSpellCatalogSearch.ts`.
 *
 * @param query исходный запрос.
 * @param search функция поиска по нормализованному запросу.
 * @returns результат прямого поиска либо поиска в другой раскладке.
 */
export function withLayoutFallback<TItem>(
  query: string,
  search: (query: string) => TItem[],
): TItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  const matchedItems = search(normalizedQuery);

  if (matchedItems.length) {
    return matchedItems;
  }

  const layoutQuery = convertKeyboardLayout(normalizedQuery).toLowerCase();

  return layoutQuery === normalizedQuery ? matchedItems : search(layoutQuery);
}
