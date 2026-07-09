import type { EditorToolbarItem } from '@nuxt/ui';
import type { Editor } from '@tiptap/vue-3';

import type { MarkupTag } from './tags';

import {
  BLOCK_TAGS,
  INLINE_TAGS,
  INTERACTIVE_TAGS,
  SECTION_TAGS,
} from './tags';
import { hasMarkerAtom } from './tiptap/node-utils';

/** Колбэки для тегов, которые открывают панель ввода вместо прямой вставки. */
export interface ToolbarHandlers {
  /** Ссылка на раздел — открыть панель поиска сущности. */
  onSection: (tag: MarkupTag) => void;
  /** Обычная ссылка — открыть панель ввода URL. */
  onLink: (tag: MarkupTag) => void;
  /** Бросок кубика — открыть панель ввода нотации. */
  onDice: (tag: MarkupTag) => void;
  /** Подпись таблицы — открыть панель ввода (пишет атрибут caption). */
  onCaption: () => void;
}

/** Кнопка-переключатель форматирующей марки: имя марки (из marks.ts) + вид. */
interface MarkButton {
  mark: string;
  icon: string;
  label: string;
}

/** Кнопки форматирования в порядке отображения (имена марок — из FORMAT_SPECS). */
const FORMAT_MARK_ITEMS: MarkButton[] = [
  { mark: 'ttgBold', icon: 'tabler:bold', label: 'Жирный' },
  { mark: 'ttgItalic', icon: 'tabler:italic', label: 'Курсив' },
  { mark: 'ttgUnderline', icon: 'tabler:underline', label: 'Подчёркнутый' },
  { mark: 'ttgStrike', icon: 'tabler:strikethrough', label: 'Зачёркнутый' },
  {
    mark: 'ttgSuperscript',
    icon: 'tabler:superscript',
    label: 'Верхний индекс',
  },
  { mark: 'ttgSubscript', icon: 'tabler:subscript', label: 'Нижний индекс' },
  { mark: 'ttgHighlight', icon: 'tabler:highlight', label: 'Выделение' },
];

/**
 * Заменяет структурные символы маркера в тексте-подписи, чтобы вставляемый
 * `{@...}` не сломался при разборе: `|` (разделитель атрибутов) → `/`, а фигурные
 * скобки `{`/`}` убираются (иначе литеральные `{@`/`}` открыли/закрыли бы вложенный
 * маркер и разбалансировали внешний).
 *
 * @param text - Текст подписи (например, выделение пользователя)
 * @returns Безопасная для тела маркера строка
 */
export function sanitizeMarkerText(text: string): string {
  return text.replace(/\|/g, '/').replace(/[{}]/g, '');
}

/**
 * Собирает сырую строку блочного тега для вставки чип-узлом (заголовок/цитата):
 * оборачивает выделение либо подставляет заглушку. Списки/таблицы/цитаты идут не
 * сюда, а вставляются нативными узлами — см. `listToggleItem`/`quoteToggleItem`.
 */
function buildBlockTagRaw(
  editor: Editor,
  tag: MarkupTag,
  from: number,
  to: number,
  empty: boolean,
): string {
  const selected =
    empty || hasMarkerAtom(editor, from, to)
      ? ''
      : sanitizeMarkerText(editor.state.doc.textBetween(from, to, ' '));

  return `${tag.before}${selected || tag.placeholder}${tag.after}`;
}

/**
 * Вставляет кастомный тег {@...} в визуальный редактор СРАЗУ как атомарный
 * узел-чип (а не сырой текст — иначе он остаётся кодом, пока не переспарсится).
 * Оборачивает текущее выделение либо подставляет значение-заглушку.
 *
 * Блочные теги (`isBlock`) вставляются БЛОЧНЫМ узлом ttgBlockMarker: он не может
 * лежать внутри абзаца, поэтому ProseMirror сам разбивает абзац — блок стоит
 * отдельно, а текст до/после уходит в свои абзацы (заголовок не липнет к тексту,
 * список собирается из строк выделения — см. buildBlockTagRaw).
 */
function insertTag(editor: Editor, tag: MarkupTag, isBlock = false): void {
  const { from, to, empty } = editor.state.selection;

  if (isBlock) {
    const raw = buildBlockTagRaw(editor, tag, from, to, empty);

    editor
      .chain()
      .focus()
      .insertContentAt({ from, to }, { type: 'ttgBlockMarker', attrs: { raw } })
      .run();

    return;
  }

  // Если в выделении есть чипы (атомарные узлы), не сплющиваем их в текст —
  // вставляем тег с заглушкой в конец выделения, сохраняя содержимое.
  if (!empty && hasMarkerAtom(editor, from, to)) {
    const raw = `${tag.before}${tag.placeholder}${tag.after}`;

    editor
      .chain()
      .focus()
      .insertContentAt(to, { type: 'ttgMarker', attrs: { raw } })
      .run();

    return;
  }

  const selected = empty
    ? ''
    : sanitizeMarkerText(editor.state.doc.textBetween(from, to, ' '));

  const raw = `${tag.before}${selected || tag.placeholder}${tag.after}`;

  editor
    .chain()
    .focus()
    .insertContentAt({ from, to }, { type: 'ttgMarker', attrs: { raw } })
    .run();
}

/**
 * Строит пункт тулбара для кастомного тега разметки (иконка + подсказка).
 * `isBlock` — блочный тег (заголовок/список/цитата), вставляется отдельным блоком.
 */
function tagItem(
  editor: Editor,
  tag: MarkupTag,
  isBlock = false,
): EditorToolbarItem {
  return {
    icon: tag.icon,
    tooltip: { text: tag.label },
    onClick: () => insertTag(editor, tag, isBlock),
  };
}

/**
 * Пункт тулбара для списка: переключает НАТИВНЫЙ список TipTap
 * (bulletList/orderedList). Выделение из нескольких абзацев оборачивается в
 * пункты, повторный клик — разворачивает обратно. Сериализуется в `{@list}`.
 */
function listToggleItem(editor: Editor, tag: MarkupTag): EditorToolbarItem {
  const ordered = tag.key === 'ordered-list';
  const nodeName = ordered ? 'orderedList' : 'bulletList';

  return {
    icon: tag.icon,
    tooltip: { text: tag.label },
    active: editor.isActive(nodeName),
    onClick: () => {
      const chain = editor.chain().focus();

      if (ordered) {
        chain.toggleOrderedList().run();
      } else {
        chain.toggleBulletList().run();
      }
    },
  };
}

/**
 * Пункт тулбара для цитаты: переключает НАТИВНЫЙ blockquote TipTap. Выделение
 * (в т.ч. из нескольких абзацев и с мягкими переносами {@br}) оборачивается в
 * цитату НА МЕСТЕ — ничего не теряется и не склеивается (в отличие от старого
 * чип-пути buildBlockTagRaw). Сериализуется в `{@quote}` (см. ttg-quote.ts).
 */
function quoteToggleItem(editor: Editor, tag: MarkupTag): EditorToolbarItem {
  return {
    icon: tag.icon,
    tooltip: { text: tag.label },
    active: editor.isActive('blockquote'),
    onClick: () => {
      editor.chain().focus().toggleBlockquote().run();
    },
  };
}

/**
 * Строит пункт тулбара-переключатель форматирующей марки {@...}: выделил →
 * нажал → форматирование применилось (и вкладывается в другое форматирование).
 */
function markItem(editor: Editor, item: MarkButton): EditorToolbarItem {
  return {
    icon: item.icon,
    tooltip: { text: item.label },
    active: editor.isActive(item.mark),
    onClick: () => {
      editor.chain().focus().toggleMark(item.mark).run();
    },
  };
}

/**
 * Пункт для инлайнового тега: ссылка открывает панель ввода URL (иначе вставилась
 * бы с пустым `url:` — заполнить можно было только в режиме кода), остальные
 * (клавиша) вставляются напрямую.
 */
function inlineItem(
  editor: Editor,
  tag: MarkupTag,
  handlers: ToolbarHandlers,
): EditorToolbarItem {
  if (tag.key === 'link') {
    return {
      icon: tag.icon,
      tooltip: { text: tag.label },
      onClick: () => handlers.onLink(tag),
    };
  }

  return tagItem(editor, tag);
}

/**
 * Пункт для интерактивного тега: кубик открывает панель ввода нотации, бейдж и
 * прочее — вставляются напрямую.
 */
function interactiveItem(
  editor: Editor,
  tag: MarkupTag,
  handlers: ToolbarHandlers,
): EditorToolbarItem {
  if (tag.key === 'dice') {
    return {
      icon: tag.icon,
      tooltip: { text: tag.label },
      onClick: () => handlers.onDice(tag),
    };
  }

  return tagItem(editor, tag);
}

/**
 * Выпадающий список ссылок на разделы сайта (заклинание, существо, класс и др.).
 * Выбор пункта открывает панель поиска сущности (вставляет ссылку с готовым url).
 */
function sectionDropdown(handlers: ToolbarHandlers): EditorToolbarItem {
  return {
    icon: 'tabler:external-link',
    tooltip: { text: 'Ссылка на раздел' },
    items: SECTION_TAGS.map((tag) => ({
      label: tag.label,
      icon: tag.icon,
      onClick: () => handlers.onSection(tag),
    })),
  };
}

/**
 * Ставит выравнивание ячейкам таблицы по текущему выделению (одна ячейка или
 * колонка через CellSelection) — и телу (`tableCell`), и заголовку
 * (`tableHeader`). Значение пишем ЯВНО, включая `left`: заголовок на странице по
 * умолчанию центрируется, поэтому `left` должен перебить дефолт, а не свестись к
 * нему. `updateAttributes` для «чужого» типа ячейки — no-op, поэтому оба вызова
 * безопасны независимо от того, в шапке курсор или в теле.
 */
function setCellAlign(
  editor: Editor,
  align: 'left' | 'center' | 'right',
): void {
  editor
    .chain()
    .focus()
    .updateAttributes('tableCell', { align })
    .updateAttributes('tableHeader', { align })
    .run();
}

/**
 * Выпадающее меню таблицы: вставка, подпись, кубик-бросок, операции над строками/
 * столбцами (команды @tiptap/extension-table) и выравнивание ячеек. Вне таблицы
 * операции — no-op, «Вставить» работает всегда.
 */
function tableDropdown(
  editor: Editor,
  handlers: ToolbarHandlers,
): EditorToolbarItem {
  const chain = () => editor.chain().focus();

  // Кубик для броска по строкам — та же панель нотации, что и обычная кнопка
  // кубика; вставляется в позицию курсора (автор ставит его в шапку 1-го столбца).
  const diceTag = INTERACTIVE_TAGS.find((tag) => tag.key === 'dice');

  return {
    icon: 'tabler:table',
    tooltip: { text: 'Таблица' },
    active: editor.isActive('table'),
    items: [
      {
        label: 'Вставить таблицу',
        icon: 'tabler:table-plus',
        onClick: () =>
          chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      },
      {
        label: 'Подпись таблицы…',
        icon: 'tabler:text-caption',
        onClick: () => handlers.onCaption(),
      },
      ...(diceTag
        ? [
            {
              label: 'Кубик для броска по строкам',
              icon: 'tabler:dice',
              onClick: () => handlers.onDice(diceTag),
            },
          ]
        : []),
      {
        label: 'Строку выше',
        icon: 'tabler:row-insert-top',
        onClick: () => chain().addRowBefore().run(),
      },
      {
        label: 'Строку ниже',
        icon: 'tabler:row-insert-bottom',
        onClick: () => chain().addRowAfter().run(),
      },
      {
        label: 'Удалить строку',
        icon: 'tabler:row-remove',
        onClick: () => chain().deleteRow().run(),
      },
      {
        label: 'Столбец слева',
        icon: 'tabler:column-insert-left',
        onClick: () => chain().addColumnBefore().run(),
      },
      {
        label: 'Столбец справа',
        icon: 'tabler:column-insert-right',
        onClick: () => chain().addColumnAfter().run(),
      },
      {
        label: 'Удалить столбец',
        icon: 'tabler:column-remove',
        onClick: () => chain().deleteColumn().run(),
      },
      {
        label: 'Строка-заголовок',
        icon: 'tabler:heading',
        onClick: () => chain().toggleHeaderRow().run(),
      },
      {
        label: 'Выровнять влево',
        icon: 'tabler:align-left',
        onClick: () => setCellAlign(editor, 'left'),
      },
      {
        label: 'Выровнять по центру',
        icon: 'tabler:align-center',
        onClick: () => setCellAlign(editor, 'center'),
      },
      {
        label: 'Выровнять вправо',
        icon: 'tabler:align-right',
        onClick: () => setCellAlign(editor, 'right'),
      },
      {
        label: 'Удалить таблицу',
        icon: 'tabler:trash',
        onClick: () => chain().deleteTable().run(),
      },
    ],
  };
}

/**
 * Строит пункт блочного тега: списки — нативный переключатель, таблица —
 * выпадающее меню операций, остальное — {@...}-чип отдельным блоком.
 */
function blockItem(
  editor: Editor,
  tag: MarkupTag,
  handlers: ToolbarHandlers,
): EditorToolbarItem {
  if (tag.key === 'bullet-list' || tag.key === 'ordered-list') {
    return listToggleItem(editor, tag);
  }

  if (tag.key === 'table') {
    return tableDropdown(editor, handlers);
  }

  if (tag.key === 'quote') {
    return quoteToggleItem(editor, tag);
  }

  return tagItem(editor, tag, true);
}

/**
 * Собирает пункты тулбара визуального редактора группами: форматирование
 * (марки) → блочные теги (заголовки/список/таблица/цитата/ссылка) →
 * инлайновые/интерактивные теги → ссылки на разделы.
 *
 * @param editor - Экземпляр TipTap из слота UEditor
 * @returns Массив групп пунктов тулбара
 */
export function buildToolbarItems(
  editor: Editor,
  handlers: ToolbarHandlers,
): EditorToolbarItem[][] {
  return [
    FORMAT_MARK_ITEMS.map((item) => markItem(editor, item)),
    BLOCK_TAGS.map((tag) => blockItem(editor, tag, handlers)),
    [
      ...INLINE_TAGS.map((tag) => inlineItem(editor, tag, handlers)),
      ...INTERACTIVE_TAGS.map((tag) => interactiveItem(editor, tag, handlers)),
    ],
    [sectionDropdown(handlers)],
  ];
}
