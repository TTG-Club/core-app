import type {
  DropdownMenuItem,
  EditorToolbarItem,
  TooltipProps,
} from '@nuxt/ui';
import type { Editor } from '@tiptap/vue-3';

import type { MarkupTag } from './tags';

import {
  BLOCK_TAGS,
  INLINE_TAGS,
  INTERACTIVE_TAGS,
  SECTION_TAGS,
} from './tags';
import { FORMAT_SPECS } from './tiptap/marks';
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

/**
 * Преобразует хоткей из FORMAT_SPECS (`Mod-Shift-s`) в клавиши для подсказки
 * UTooltip/UKbd: `Mod` → `meta` (Ctrl, на macOS — ⌘), буква — заглавной.
 */
function shortcutKbds(shortcut: string): string[] {
  return shortcut.split('-').map((key) => {
    if (key === 'Mod') {
      return 'meta';
    }

    return key.length === 1 ? key.toUpperCase() : key.toLowerCase();
  });
}

/** Клавиши хоткея по имени марки — для подсказок кнопок форматирования. */
const MARK_KBDS = new Map<string, string[]>(
  FORMAT_SPECS.map((spec) => [spec.mark, shortcutKbds(spec.shortcut)]),
);

/**
 * Подсказка кнопки с хоткеем. Штатная тема UTooltip рисует точку-разделитель
 * перед клавишами (`not-first-of-type:before:content-['·']` на слоте kbds) —
 * убираем её: текст и клавиши и так разделены gap'ом контейнера подсказки.
 */
function kbdTooltip(text: string, kbds?: string[]): TooltipProps {
  return {
    text,
    kbds,
    ui: { kbds: 'not-first-of-type:before:content-none' },
  };
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
 * Хоткеи в подсказке — штатные BulletList/OrderedList (узлы их наследуют).
 */
function listToggleItem(editor: Editor, tag: MarkupTag): EditorToolbarItem {
  const ordered = tag.key === 'ordered-list';
  const nodeName = ordered ? 'orderedList' : 'bulletList';

  return {
    icon: tag.icon,
    tooltip: kbdTooltip(tag.label, ['meta', 'shift', ordered ? '7' : '8']),
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
    // Хоткей в подсказке — штатный Blockquote (узел его наследует).
    tooltip: kbdTooltip(tag.label, ['meta', 'shift', 'B']),
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
    tooltip: kbdTooltip(item.label, MARK_KBDS.get(item.mark)),
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

/** Строковый атрибут `align` активного узла (undefined — нет/не строка/пусто). */
function readAlign(editor: Editor, nodeName: string): string | undefined {
  const align: unknown = editor.getAttributes(nodeName).align;

  return typeof align === 'string' && align ? align : undefined;
}

/** Текущее выравнивание блока под курсором (ячейка таблицы → заголовок → абзац). */
function activeAlign(editor: Editor): string | undefined {
  if (editor.isActive('tableCell')) {
    return readAlign(editor, 'tableCell');
  }

  if (editor.isActive('tableHeader')) {
    return readAlign(editor, 'tableHeader');
  }

  if (editor.isActive('heading')) {
    return readAlign(editor, 'heading');
  }

  if (editor.isActive('paragraph')) {
    return readAlign(editor, 'paragraph');
  }

  return undefined;
}

/**
 * Единое выравнивание для ЛЮБОГО текста. В таблице — ячейке (тело+шапка, как было
 * в меню таблицы; `left` пишем ЯВНО, чтобы перебить дефолт-центр заголовка). Вне
 * таблицы — абзацу/заголовку: там `left` — значение по умолчанию, поэтому храним
 * его как `null` (обычный абзац-строка без `{@p}`). `updateAttributes` для узла не
 * под курсором — no-op, поэтому все вызовы безопасны.
 */
function setAlign(editor: Editor, align: 'left' | 'center' | 'right'): void {
  const chain = editor.chain().focus();

  if (editor.isActive('tableCell') || editor.isActive('tableHeader')) {
    chain
      .updateAttributes('tableCell', { align })
      .updateAttributes('tableHeader', { align })
      .run();

    return;
  }

  const value = align === 'left' ? null : align;

  chain
    .updateAttributes('paragraph', { align: value })
    .updateAttributes('heading', { align: value })
    .run();
}

/** Текущий уровень заголовка под курсором (0 — не заголовок). */
function activeHeadingLevel(editor: Editor): number {
  if (!editor.isActive('heading')) {
    return 0;
  }

  const level: unknown = editor.getAttributes('heading').level;

  return typeof level === 'number' ? level : 0;
}

/**
 * Выпадающее меню заголовков: ОДНА кнопка «H» вместо трёх (H1–H3) + «Обычный
 * текст» для возврата к абзацу. Заголовки — нативные узлы (setHeading/setParagraph),
 * поэтому уровень можно менять и снимать прямо здесь, а сам заголовок — выделять и
 * править (в отличие от прежнего атомарного чипа).
 */
function headingDropdown(editor: Editor): EditorToolbarItem {
  const level = activeHeadingLevel(editor);

  // Хоткеи в подсказках — штатные Heading/Paragraph (узлы их наследуют).
  const levelItem = (value: 1 | 2 | 3): DropdownMenuItem => ({
    label: `Заголовок ${value}`,
    icon: `tabler:h-${value}`,
    kbds: ['meta', 'alt', String(value)],
    active: level === value,
    onClick: () => editor.chain().focus().setHeading({ level: value }).run(),
  });

  return {
    'icon': 'tabler:heading',
    'tooltip': { text: 'Заголовок' },
    'aria-label': 'Заголовок',
    'items': [
      levelItem(1),
      levelItem(2),
      levelItem(3),
      {
        label: 'Обычный текст',
        icon: 'tabler:pilcrow',
        kbds: ['meta', 'alt', '0'],
        onClick: () => editor.chain().focus().setParagraph().run(),
      },
    ],
  };
}

/**
 * Выпадающее меню выравнивания (единое, «как H»): работает и для ячеек таблицы, и
 * для абзацев/заголовков — «любой текст». Раньше выравнивание жило только в меню
 * таблицы; теперь вынесено на общую панель тулбара.
 */
function alignDropdown(editor: Editor): EditorToolbarItem {
  const current = activeAlign(editor);

  const alignItem = (
    value: 'left' | 'center' | 'right',
    label: string,
    icon: string,
  ): DropdownMenuItem => ({
    label,
    icon,
    active: current === value,
    onClick: () => setAlign(editor, value),
  });

  return {
    'icon': 'tabler:align-left',
    'tooltip': { text: 'Выравнивание' },
    'aria-label': 'Выравнивание',
    'items': [
      alignItem('left', 'По левому краю', 'tabler:align-left'),
      alignItem('center', 'По центру', 'tabler:align-center'),
      alignItem('right', 'По правому краю', 'tabler:align-right'),
    ],
  };
}

/**
 * Пункт-разделитель `{@separator}`: вставляет блочный маркер-линию в позицию
 * курсора (выделение НЕ оборачивает — у разделителя нет текста). Остаётся
 * атомарным блок-чипом: его достаточно выделить и удалить целиком.
 */
function separatorItem(editor: Editor, tag: MarkupTag): EditorToolbarItem {
  return {
    icon: tag.icon,
    tooltip: { text: tag.label },
    onClick: () => {
      const { to } = editor.state.selection;

      editor
        .chain()
        .focus()
        .insertContentAt(to, {
          type: 'ttgBlockMarker',
          attrs: { raw: '{@separator}' },
        })
        .run();
    },
  };
}

/**
 * Выпадающее меню таблицы: вставка, подпись, кубик-бросок и операции над строками/
 * столбцами (команды @tiptap/extension-table). Выравнивание ячеек ПЕРЕЕХАЛО на
 * общую панель (см. alignDropdown). Вне таблицы операции — no-op, «Вставить»
 * работает всегда.
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
        label: 'Удалить таблицу',
        icon: 'tabler:trash',
        onClick: () => chain().deleteTable().run(),
      },
    ],
  };
}

/**
 * Строит пункт блочного тега: списки — нативный переключатель, цитата — нативный
 * blockquote, таблица — выпадающее меню операций, разделитель — блочный чип,
 * остальное — {@...}-чип отдельным блоком. Заголовки сюда НЕ попадают — они собраны
 * в отдельный выпадающий список (см. headingDropdown).
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

  if (tag.key === 'separator') {
    return separatorItem(editor, tag);
  }

  return tagItem(editor, tag, true);
}

/**
 * Собирает пункты тулбара визуального редактора группами: форматирование (марки) →
 * тип блока (заголовок «H» + выравнивание) → блочные теги (списки/цитата/
 * разделитель/таблица) → инлайновые/интерактивные теги → ссылки на разделы.
 *
 * @param editor - Экземпляр TipTap из слота UEditor
 * @returns Массив групп пунктов тулбара
 */
export function buildToolbarItems(
  editor: Editor,
  handlers: ToolbarHandlers,
): EditorToolbarItem[][] {
  // Заголовки собраны в headingDropdown, поэтому из блочной группы их убираем.
  const blockTags = BLOCK_TAGS.filter((tag) => !tag.key.startsWith('heading-'));

  return [
    FORMAT_MARK_ITEMS.map((item) => markItem(editor, item)),
    [headingDropdown(editor), alignDropdown(editor)],
    blockTags.map((tag) => blockItem(editor, tag, handlers)),
    [
      ...INLINE_TAGS.map((tag) => inlineItem(editor, tag, handlers)),
      ...INTERACTIVE_TAGS.map((tag) => interactiveItem(editor, tag, handlers)),
    ],
    [sectionDropdown(handlers)],
  ];
}
