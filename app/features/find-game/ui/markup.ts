import type { RenderNode } from '~ui/markup';

import { getNodeText, parse, toMarkupSource } from '~ui/markup';

/**
 * Разметка описания игры.
 *
 * Живёт в слое представления, а не в модели: реестр маркеров `~ui/markup`
 * сопоставляет типы с Vue-компонентами, поэтому разбор неотделим от UI.
 * В модели такой импорт утянул бы за собой Vue и рантайм Nuxt.
 */

/**
 * Приводит описание игры к узлам разметки.
 *
 * Описание пишется редактором и хранится строкой. Игры, созданные до
 * появления редактора, лежат обычным текстом — `toMarkupSource` его не
 * трогает, поэтому старые описания разбираются как простой абзац и
 * продолжают показываться.
 *
 * @param description Описание игры из ответа сервиса.
 */
export function toGameMarkup(description: string): RenderNode | RenderNode[] {
  return parse(toMarkupSource(description));
}

/**
 * Описание игры простым текстом — для карточки каталога и SEO: там разметка
 * показалась бы сырыми маркерами `{@...}`, а обрезка по строкам разорвала бы
 * её посередине.
 *
 * @param description Описание игры из ответа сервиса.
 */
export function getGameDescriptionText(description: string): string {
  return getNodeText(toGameMarkup(description) as RenderNode);
}
