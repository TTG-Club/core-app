import MarkdownIt from 'markdown-it';

import { markerPlugin } from './marker-plugin';

/**
 * Единый экземпляр markdown-it для рендера описаний материалов.
 *
 * Настройки:
 * - `html: false` — сырой HTML запрещён (защита от инъекций, весь вывод идёт
 *   через VNode-рендер, а не через v-html).
 * - `linkify: true` — «голые» ссылки автоматически становятся кликабельными.
 * - `breaks: true` — перенос строки внутри абзаца превращается в `<br>`
 *   (привычнее авторам, чем строгий CommonMark).
 *
 * Плагин `markerPlugin` добавляет распознавание кастомных маркеров {@...}.
 */
export const markdownIt: MarkdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: false,
}).use(markerPlugin);
