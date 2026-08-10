/**
 * Ищет по запросу, а при пустой выдаче повторяет поиск в противоположной
 * раскладке («ащкешашсфешщт» → «fortification»). Конверсия пробуется только
 * после неудачи, чтобы не добавлять ложных совпадений к успешному запросу.
 *
 * Только для синхронного поиска: асинхронному нужен ещё и конвертированный
 * запрос — для повторных обращений к серверу.
 *
 * @param query исходный запрос, нормализуется внутри.
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
