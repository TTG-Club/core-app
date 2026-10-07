/**
 * Разметка описания игры.
 *
 * Живёт в слое представления, а не в модели: реестр маркеров `~ui/markup`
 * сопоставляет типы с Vue-компонентами, поэтому разбор неотделим от UI.
 * В модели такой импорт утянул бы за собой Vue и рантайм Nuxt.
 */

import { getNodeText, parse, toMarkupSource } from '~ui/markup';

/**
 * Приводит описание игры к абзацам для `MarkupRender`.
 *
 * Описание пишется редактором и хранится строкой. Игры, созданные до
 * появления редактора, лежат обычным текстом — `toMarkupSource` его не
 * трогает, поэтому старые описания разбираются как простой абзац и
 * продолжают показываться.
 *
 * Отдаются именно абзацы-строки, а не разобранные узлы: `MarkupRender`
 * рисует каждый элемент массива отдельным блоком, и плоский список узлов
 * разрывал абзац на куски — жирное «Свободных мест» уезжало на свою строку,
 * а `{@br}` превращался в пустой абзац с двойным отступом.
 *
 * @param description Описание игры из ответа сервиса.
 */
export function toGameMarkup(description: string): string[] {
  return toMarkupSource(description)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

/**
 * Описание игры простым текстом — для карточки каталога и SEO: там разметка
 * показалась бы сырыми маркерами `{@...}`, а обрезка по строкам разорвала бы
 * её посередине.
 *
 * @param description Описание игры из ответа сервиса.
 */
export function getGameDescriptionText(description: string): string {
  return getNodeText(parse(toMarkupSource(description)));
}
