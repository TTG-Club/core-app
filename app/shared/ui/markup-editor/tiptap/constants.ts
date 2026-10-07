/** Имя атомарного БЛОЧНОГО узла маркера `{@...}` (разделитель и т.п.). */
export const BLOCK_MARKER_NODE = 'ttgBlockMarker';

/** DOM-атрибут блочного чипа маркера. */
export const BLOCK_MARKER_ATTR = 'data-ttg-block-marker';

/** DOM-атрибут узла ссылки. */
export const SECTION_LINK_ATTR = 'data-ttg-section-link';

/** DOM-атрибут вида ссылки: `link` либо имя раздела (`spell`, `creature`, …). */
export const SECTION_LINK_KIND_ATTR = 'data-kind';

/** DOM-атрибут адреса ссылки. */
export const SECTION_LINK_URL_ATTR = 'data-url';

/** DOM-атрибут форматирующей марки; значение — тип маркера (`bold`, `italic`, …). */
export const FORMAT_MARK_ATTR = 'data-ttg-mark';

/** DOM-атрибут таблицы с подписью: по нему редактор рисует её над таблицей. */
export const TABLE_CAPTION_ATTR = 'data-caption';

/** Тег горизонтальной линии: в чужом HTML это наш разделитель. */
export const HORIZONTAL_RULE_TAG = 'hr';

/** Готовая разметка разделителя — вставка с тулбара, разбор `<hr>` и токена `hr`. */
export const SEPARATOR_MARKER = '{@separator}';

/** Мягкий перенос строки внутри абзаца — Shift+Enter и кнопка тулбара. */
export const LINE_BREAK_MARKER = '{@br}';

/**
 * Граница абзацев внутри `{@quote}`: два переноса подряд (один — мягкий перенос
 * внутри абзаца, см. ttg-quote.ts).
 */
export const QUOTE_PARAGRAPH_SEPARATOR = `${LINE_BREAK_MARKER}${LINE_BREAK_MARKER}`;
