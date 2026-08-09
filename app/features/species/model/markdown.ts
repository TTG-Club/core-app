import type { SpeciesDetailResponse } from './types';

import { buildMarkdownEntity, escapeMarkdown, toMarkdown } from '~ui/markup';

/**
 * Собирает вид в Markdown формата Homebrewery.
 *
 * Умения вида приходят отдельным списком, а не частью описания, поэтому
 * каждое выводится своим подзаголовком после основного текста.
 *
 * @param species - Вид с бэкенда
 * @returns Markdown-текст вида
 */
export function getSpeciesMarkdown(species: SpeciesDetailResponse): string {
  const { size, type, speed } = species.properties;

  return buildMarkdownEntity({
    name: species.name.rus,
    nameEng: species.name.eng,
    subtitle: species.parent?.name.rus,
    stats: [
      ['Тип существа', escapeMarkdown(type)],
      ['Размер', escapeMarkdown(size)],
      ['Скорость', escapeMarkdown(speed)],
    ],
    source: species.source,
    description: species.description,
    extra: (species.features ?? []).map((feature) =>
      [
        feature.name.rus ? `##### ${escapeMarkdown(feature.name.rus)}` : '',
        toMarkdown(feature.description),
      ]
        .filter(Boolean)
        .join('\n\n'),
    ),
  });
}
