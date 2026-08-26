import type { SpeciesDetailResponse } from './types';

import { buildMarkdownEntity, escapeMarkdown, toMarkdown } from '~ui/markup';

import { SPECIES_STATS_LABELS } from './constants';

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
  const { size, type, speed, darkVision } = species.properties;

  const stats: Array<[string, string]> = [
    ['Тип существа', escapeMarkdown(type)],
    ['Размер', escapeMarkdown(size)],
    ['Скорость', escapeMarkdown(speed)],
  ];

  // Строка появляется, только когда зрение есть: у половины видов его нет, и
  // пустая строка в статблоке читалась бы как «ноль футов»
  if (darkVision) {
    stats.push([
      SPECIES_STATS_LABELS.markdownDarkVision,
      `${darkVision} ${SPECIES_STATS_LABELS.feet}`,
    ]);
  }

  return buildMarkdownEntity({
    name: species.name.rus,
    nameEng: species.name.eng,
    subtitle: species.parent?.name.rus,
    stats,
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
