import { NEWS_COVER_META_SEPARATOR } from './constants';

/**
 * Собирает моно-подпись обложки из частей (тип, автор, дата): пустые части
 * пропускаются.
 *
 * @param parts - части подписи по порядку
 * @returns подпись одной строкой; пустая строка, если частей нет
 */
export function getNewsCoverMeta(
  parts: ReadonlyArray<string | null | undefined>,
): string {
  return parts.filter(Boolean).join(NEWS_COVER_META_SEPARATOR);
}
