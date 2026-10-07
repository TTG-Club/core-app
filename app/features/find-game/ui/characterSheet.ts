import { CHARACTER_SHEET_SHARED_ROUTE } from '~character-sheet/model';

/**
 * Ссылка на лист персонажа сайта по токену «поделиться». Путь от корня, без
 * домена: окружения у игрока и у мастера могут быть разными.
 *
 * @param shareToken Токен ссылки.
 * @returns Путь, который кладётся в заявку.
 */
export function getSharedCharacterSheetLink(shareToken: string): string {
  return `${CHARACTER_SHEET_SHARED_ROUTE}/${shareToken}`;
}

/**
 * Токен ссылки на лист персонажа сайта — по нему лист открывается в drawer,
 * не уводя мастера со страницы игры.
 *
 * Адрес сверяется только путём, без домена: ссылку игрок берёт из кнопки
 * «Поделиться» на сайте, но окружения у него и у мастера могут быть разными
 * (`ttg.club`, `dev.ttg.club`, локальный запуск). Сам токен проверяет сервис —
 * чужой или устаревший покажет «Лист не найден».
 *
 * @param url Ссылка из заявки; `null` — игрок её не приложил.
 * @returns Токен ссылки; `null` — ссылка ведёт не на лист сайта.
 */
export function getSharedCharacterSheetToken(
  url: string | null,
): string | null {
  if (!url) {
    return null;
  }

  // Ссылка приходит от игрока и может быть чем угодно, включая мусор.
  let path: string;

  try {
    path = new URL(url, 'https://localhost').pathname;
  } catch {
    return null;
  }

  const prefix = `${CHARACTER_SHEET_SHARED_ROUTE}/`;

  if (!path.startsWith(prefix)) {
    return null;
  }

  const token = path.slice(prefix.length).replace(/\/+$/, '');

  return token && !token.includes('/') ? token : null;
}
