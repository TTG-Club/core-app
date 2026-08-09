import type { ItemDetailResponse } from './detail';

import { buildMarkdownEntity, escapeMarkdown } from '~ui/markup';

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
    // Значения приходят сырой строкой из API и разметкой не являются:
    // звёздочка или бэктик в них уехали бы в Homebrewery как разметка.
    stats: [
      ['Тип', escapeMarkdown(item.types)],
      ['Стоимость', escapeMarkdown(item.cost)],
      ['Вес', escapeMarkdown(item.weight)],
    ],
    source: item.source,
    description: item.description,
  });
}
