import type { ScreenSearchResponse } from './schemas';
import type { ScreenEntryLocation, ScreenSearchEntry } from './types';

import { toMarkupSource } from '~ui/markup';

import {
  DM_SCREEN_CONTROL_SELECTOR,
  DM_SCREEN_ICONS,
  DM_SCREEN_NOTE_PREFIX,
  DM_SCREEN_SEARCH_LIMIT,
  DM_SCREEN_SECTIONS,
} from './constants';
import { screenEntryNameSchema } from './schemas';

/** Адрес записи: раздел и её `url` в нём. */
const ENTRY_PATH_PATTERN = /^\/([^/?#]+)\/([^?#]+?)\/?(?:[?#].*)?$/;

/** Начало абсолютного адреса: протокол и домен. */
const ORIGIN_PATTERN = /^[a-z][a-z\d+.-]*:\/\/[^/]+/i;

/**
 * Путь на сайте из адреса: абсолютный адрес теряет протокол и домен,
 * относительный остаётся как есть.
 * @param url - адрес записи, абсолютный или относительный
 */
export function toScreenPath(url: string): string {
  return url.replace(ORIGIN_PATTERN, '');
}

/**
 * Раздел и `url` записи по её адресу на сайте. Адрес самого раздела и
 * адреса незнакомых разделов — не записи ширмы.
 * @param path - адрес записи на сайте
 */
export function resolveScreenEntry(
  path: string,
): ScreenEntryLocation | undefined {
  const [, sectionPath, url] = ENTRY_PATH_PATTERN.exec(path) ?? [];

  const section = DM_SCREEN_SECTIONS.find(
    (candidate) => candidate.path === sectionPath,
  );

  return section && url ? { section, url } : undefined;
}

/**
 * Можно ли положить запись с этим адресом на ширму.
 * @param path - адрес записи на сайте
 */
export function isScreenEntryPath(path: string): boolean {
  return resolveScreenEntry(path) !== undefined;
}

/**
 * Адрес записи без строки запроса и якоря: под ним запись лежит на ширме.
 * @param path - адрес записи на сайте
 */
export function normalizeScreenEntryPath(path: string): string | undefined {
  const entry = resolveScreenEntry(path);

  return entry ? `/${entry.section.path}/${entry.url}` : undefined;
}

/**
 * Окно — заметка мастера, а не запись сайта.
 * @param path - путь окна
 */
export function isScreenNotePath(path: string): boolean {
  return path.startsWith(DM_SCREEN_NOTE_PREFIX);
}

/**
 * Путь новой заметки.
 * @param id - идентификатор заметки
 */
export function createScreenNotePath(id: string): string {
  return `${DM_SCREEN_NOTE_PREFIX}${id}`;
}

/**
 * Иконка окна: у заметки — своя, у записи — как у её раздела в меню.
 * @param path - путь окна
 */
export function getScreenWindowIcon(path: string): string {
  if (isScreenNotePath(path)) {
    return DM_SCREEN_ICONS.note;
  }

  return resolveScreenEntry(path)?.section.icon ?? DM_SCREEN_ICONS.unknown;
}

/**
 * Русское название загруженной записи; у ответа незнакомой формы его нет.
 * @param detail - запись, как её отдал сервер
 */
export function getScreenEntryTitle(detail: unknown): string | undefined {
  const parsed = screenEntryNameSchema.safeParse(detail);

  if (!parsed.success) {
    return undefined;
  }

  const { name } = parsed.data;

  return typeof name === 'string' ? name : name.rus;
}

/** Граница абзацев в исходнике разметки: пустая строка. */
const PARAGRAPH_BREAK_PATTERN = /\n{2,}/;

/**
 * Абзацы заметки для показа. Заметка хранится так же, как описания в
 * мастерской, — строкой с массивом узлов, — поэтому её разворачивают в
 * исходник и делят на абзацы: блочные маркеры в них рендер разбирает сам.
 * @param content - сохранённый текст заметки
 */
export function toScreenNoteBlocks(content: string): Array<string> {
  return toMarkupSource(content)
    .split(PARAGRAPH_BREAK_PATTERN)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

/**
 * Нажали не на кнопку шапки окна: с кнопок окно не тянется и не
 * сворачивается.
 * @param target - на что пришлось нажатие или клик
 */
export function isOutsideScreenControl(target: EventTarget | null): boolean {
  return !(
    target instanceof Element && target.closest(DM_SCREEN_CONTROL_SELECTOR)
  );
}

/**
 * Записи из ответа поиска по сайту, которые ширма умеет показать. Тип
 * записи в ответе совпадает с адресом её раздела; записи остальных разделов
 * отбрасываются.
 * @param searchResponse - проверенный ответ поиска
 */
export function toScreenSearchEntries(
  searchResponse: ScreenSearchResponse,
): Array<ScreenSearchEntry> {
  return searchResponse.items
    .flatMap((found) => {
      const path = `/${found.type}/${found.url}`;
      const entry = resolveScreenEntry(path);

      return entry
        ? [
            {
              path,
              name: found.name.rus,
              englishName: found.name.eng ?? undefined,
              sectionLabel: entry.section.label,
              icon: entry.section.icon,
            },
          ]
        : [];
    })
    .slice(0, DM_SCREEN_SEARCH_LIMIT);
}
