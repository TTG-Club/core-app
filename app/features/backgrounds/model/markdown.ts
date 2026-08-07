import type { BackgroundDetailResponse } from './detail';

import { buildMarkdownEntity, joinStat, toMarkdown } from '~ui/markup';

/**
 * Собирает предысторию в Markdown формата Homebrewery.
 *
 * Поля шапки приходят не готовым текстом, а разметкой (`{@feat ...}`, `{@item ...}`), поэтому каждое прогоняется через конвертер. Снаряжение вдобавок содержит блочный список вариантов — в строку свойства он не умещается и выносится блоком после описания.
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
      ['Черта', toMarkdown(background.feat)],
      ['Владение навыками', toMarkdown(background.skillProficiencies)],
      [
        'Владение инструментами',
        joinStat((background.toolProficiency ?? []).map(toInlineMarkdown)),
      ],
    ],
    source: background.source,
    description: background.description,
    extra: [getEquipment(background.equipment)],
  });
}

/** Значение свойства всегда однострочное: перенос разорвал бы строку `**Ключ** :: Значение`. */
function toInlineMarkdown(value: unknown): string {
  return toMarkdown(value)
    .replace(/\s*\n\s*/g, ' ')
    .trim();
}

/** Снаряжение: заголовок и блоки как есть — среди них список вариантов «А или Б». */
function getEquipment(equipment: string[] | undefined): string | undefined {
  const content = toMarkdown(equipment);

  return content ? `##### Снаряжение\n\n${content}` : undefined;
}
