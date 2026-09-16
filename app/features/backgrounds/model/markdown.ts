import type { BackgroundDetailResponse } from './detail';

import {
  buildMarkdownEntity,
  joinStat,
  toInlineValue,
  toMarkdown,
} from '~ui/markup';

import { getBackgroundFeatNode, getBackgroundToolNodes } from './detail';

/**
 * Собирает предысторию в Markdown формата Homebrewery.
 *
 * Поля шапки приходят не готовым текстом, а разметкой (`{@feat ...}`,
 * `{@item ...}`), поэтому каждое прогоняется через конвертер. Снаряжение
 * вдобавок содержит блочный список вариантов — в строку свойства он не
 * умещается и выносится блоком после описания.
 *
 * @param background - Предыстория с бэкенда
 * @returns Markdown-текст предыстории
 */
export function getBackgroundMarkdown(
  background: BackgroundDetailResponse,
): string {
  return buildMarkdownEntity({
    name: background.name.rus,
    nameEng: background.name.eng,
    stats: [
      ['Характеристики', toMarkdown(background.abilityScores)],
      ['Черта', toMarkdown(getBackgroundFeatNode(background))],
      ['Владение навыками', toMarkdown(background.skillProficiencies)],
      [
        'Владение инструментами',
        joinStat(getBackgroundToolNodes(background).map(toInlineValue)),
      ],
    ],
    source: background.source,
    description: background.description,
    extra: [getEquipment(background.equipment)],
  });
}

/**
 * Снаряжение: заголовок и блоки как есть — среди них список вариантов
 * «А или Б».
 */
function getEquipment(equipment: string[] | undefined): string | undefined {
  const content = toMarkdown(equipment);

  return content ? `##### Снаряжение\n\n${content}` : undefined;
}
