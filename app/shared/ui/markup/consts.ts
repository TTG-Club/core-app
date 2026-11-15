// Предупреждение MarkupSectionLink: ссылка без адреса раздела или с незнакомым
// типом рисуется обычным текстом.
export const SECTION_LINK_PLAIN_TEXT_WARNING =
  '[Markup] Section link is rendered as plain text:';

// Наивысшая допустимая глубина вложенности.
export const MAX_DEPTH = 7;

// Максимальный размер строки.
export const MAX_STRING_LENGTH = 65536;

// Первый символ маркера
export const LEADING_CHARACTER = '@';

// Заглушка ПУСТОЙ ячейки таблицы: zero-width space (U+200B). НЕ вырезается
// String.trim() (категория Cf, не WhiteSpace), поэтому `{@td …}` с пустой
// ячейкой не падает в convertMarker («must have text») и остаётся невидимой.
// Общая для сериализатора разметки и редактора (ttg-table.ts).
export const CELL_PLACEHOLDER = '\u200B';

// Тематический разрыв Markdown (`---`, `***`, `___`) отдельной строкой. Нашей
// разметке он неизвестен, поэтому на границе хранения приводится к
// `{@separator}` — иначе линия из редактора выходит на страницу текстом «---».
export const THEMATIC_BREAK_REGEXP = /^(?:-{3,}|\*{3,}|_{3,})$/;

// Пустой абзац: этим маркером @tiptap/markdown сохраняет пустую строку между
// абзацами при round-trip. Своего содержимого такой абзац не несёт, и на странице
// маркер печатался бы буквально — на границе хранения сегмент отбрасывается.
// Общий для редактора (ttg-paragraph.ts) и сериализатора.
export const EMPTY_PARAGRAPH_MARKDOWN = '&nbsp;';

// Тип блочного маркера-разделителя. Вертикальную отбивку вокруг него задаёт сам
// MarkupSeparator (паддингом), поэтому MarkupRender гасит margin'ы и у него, и у
// соседних блоков — см. GROUP_SPACING_*.
export const SEPARATOR_BLOCK_TYPE = 'separator';

// Обычная отбивка блока описания от следующего.
export const GROUP_SPACING = 'mb-2';

// Отбивка вокруг разделителя: свои margin'ы группа не добавляет.
export const GROUP_SPACING_SEPARATOR = 'mb-0';

// Блок ПЕРЕД разделителем: нижний margin не нужен, зазор даёт сам разделитель.
export const GROUP_SPACING_BEFORE_SEPARATOR = 'mb-0';

// Блок ПОСЛЕ разделителя: верхний margin гасим принудительно — заголовок задаёт
// свой `mt-*` изнутри (MarkupHeading), и без этого зазор снизу линии оказывался
// шире, чем сверху.
export const GROUP_SPACING_AFTER_SEPARATOR = 'mt-0! mb-2';

// CSS-переменная с шириной картинки в процентах: значение задаёт автор, поэтому
// готового класса Tailwind под него нет.
export const IMAGE_WIDTH_VARIABLE = '--markup-image-width';

// Классы картинки по стороне обтекания. Всё, что зависит от ширины колонки,
// стоит под контейнерным запросом `@md:` к обёртке MarkupRender: в узкой колонке
// (телефон, дровер) картинка занимает всю ширину и текст её не обтекает. Свою
// сторону картинка «очищает», чтобы две подряд вставали друг под другом, а не
// лесенкой.
export const IMAGE_FLOAT_CLASSES = {
  left: 'w-full @md:float-left @md:clear-left @md:mr-4 @md:w-(--markup-image-width)',
  right:
    'w-full @md:float-right @md:clear-right @md:ml-4 @md:w-(--markup-image-width)',
} as const;

// Классы отдельно стоящей картинки (без обтекания) по выравниванию: к левому
// краю, по центру или к правому. Текст идёт под ней. В узкой колонке картинка
// занимает всю ширину, и выравнивать нечего.
export const IMAGE_ALIGN_CLASSES = {
  left: 'clear-both mr-auto w-full @md:w-(--markup-image-width)',
  center: 'clear-both mx-auto w-full @md:w-(--markup-image-width)',
  right: 'clear-both ml-auto w-full @md:w-(--markup-image-width)',
} as const;

// Обёртка описания с картинками. Блочный поток вместо флекс-колонки родителя:
// во флексе `float` не работает. Она же — контейнер для запросов `@md:` выше и
// граница, за которую обтекаемая картинка не вылезает (`flow-root`).
export const IMAGE_FLOW_WRAPPER_CLASS = '@container flow-root w-full';

// Как блок ведёт себя рядом с обтекаемой картинкой. Абзац обтекает её сам.
// Заголовок и список сужаются и встают рядом (`flow-root`): иначе линия под
// заголовком и маркеры списка уезжают под картинку. Таблица, цитата и
// разделитель рядом с картинкой не помещаются — уходят под неё.
export const IMAGE_FLOW_BLOCK_CLASSES: Record<string, string> = {
  heading: 'flow-root',
  list: 'flow-root',
  table: 'clear-both',
  quote: 'clear-both',
  separator: 'clear-both',
};

// Тип блочного маркера-заголовка (`{@h}`). По нему withHeadingAnchors находит
// заголовки, которым нужен якорь для содержания.
export const HEADING_BLOCK_TYPE = 'heading';

// Атрибут, в который withHeadingAnchors кладёт id якоря заголовка. Живёт только
// в дереве для рендера — в хранимую разметку не попадает.
export const HEADING_ANCHOR_ATTRIBUTE = 'anchor';

// Префикс id якоря заголовка: не даёт слагу совпасть с другими id страницы
// (например, `comments`).
export const HEADING_ANCHOR_PREFIX = 'heading-';

// Слаг для заголовка, из текста которого транслитерация ничего не оставила.
export const HEADING_ANCHOR_FALLBACK_SLUG = 'section';
