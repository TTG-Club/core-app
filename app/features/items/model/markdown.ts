import type { ItemDetailResponse } from './detail';

import { buildMarkdownEntity } from '~ui/markup';

/**
 * Собирает предмет снаряжения в Markdown формата Homebrewery.
 *
 * @param item - Предмет с бэкенда
 * @returns Markdown-текст предмета
 */
export function getItemMarkdown(item: ItemDetailResponse): string {
  return buildMarkdownEntity({
    name: item.name.rus,
    nameEng: item.name.eng,
    subtitle: item.subtitle,
    stats: [
      ['Тип', item.types],
      ['Стоимость', item.cost],
      ['Вес', item.weight],
    ],
    source: item.source,
    description: item.description,
  });
}
