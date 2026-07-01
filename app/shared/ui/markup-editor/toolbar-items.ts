import type { EditorToolbarItem } from '@nuxt/ui';
import type { Editor } from '@tiptap/vue-3';

import type { MarkupTag } from './tags';

import { INLINE_TAGS, INTERACTIVE_TAGS, SECTION_TAGS } from './tags';

/** Колбэки для тегов, которые открывают панель ввода вместо прямой вставки. */
export interface ToolbarHandlers {
  /** Ссылка на раздел — открыть панель поиска сущности. */
  onSection: (tag: MarkupTag) => void;
  /** Бросок кубика — открыть панель ввода нотации. */
  onDice: (tag: MarkupTag) => void;
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
 * Вставляет кастомный тег {@...} в визуальный редактор СРАЗУ как атомарный
 * узел-чип (а не сырой текст — иначе он остаётся кодом, пока не переспарсится).
 * Оборачивает текущее выделение либо подставляет значение-заглушку.
 */
function insertTag(editor: Editor, tag: MarkupTag): void {
  const { from, to, empty } = editor.state.selection;
  const selected = empty ? '' : editor.state.doc.textBetween(from, to, ' ');
  const raw = `${tag.before}${selected || tag.placeholder}${tag.after}`;

  editor
    .chain()
    .focus()
    .insertContentAt({ from, to }, { type: 'ttgMarker', attrs: { raw } })
    .run();
}

/**
 * Строит пункт тулбара для кастомного тега разметки (иконка + подсказка).
 */
function tagItem(editor: Editor, tag: MarkupTag): EditorToolbarItem {
  return {
    icon: tag.icon,
    tooltip: { text: tag.label },
    onClick: () => insertTag(editor, tag),
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
 * Блочный/структурный Markdown через встроенные обработчики UEditor (заголовки,
 * списки, цитата, ссылка). Инлайновое форматирование идёт марками (markItem).
 */
const BLOCK_ITEMS: EditorToolbarItem[] = [
  {
    kind: 'heading',
    level: 1,
    icon: 'tabler:h-1',
    tooltip: { text: 'Заголовок 1' },
  },
  {
    kind: 'heading',
    level: 2,
    icon: 'tabler:h-2',
    tooltip: { text: 'Заголовок 2' },
  },
  {
    kind: 'heading',
    level: 3,
    icon: 'tabler:h-3',
    tooltip: { text: 'Заголовок 3' },
  },
  {
    kind: 'bulletList',
    icon: 'tabler:list',
    tooltip: { text: 'Маркированный список' },
  },
  {
    kind: 'orderedList',
    icon: 'tabler:list-numbers',
    tooltip: { text: 'Нумерованный список' },
  },
  {
    kind: 'blockquote',
    icon: 'tabler:quote',
    tooltip: { text: 'Цитата' },
  },
  { kind: 'link', icon: 'tabler:link', tooltip: { text: 'Ссылка' } },
];

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
 * Собирает пункты тулбара визуального редактора группами: форматирование
 * (марки) → блочный Markdown → инлайновые/интерактивные теги → ссылки на разделы.
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
    BLOCK_ITEMS,
    [
      ...INLINE_TAGS.map((tag) => tagItem(editor, tag)),
      ...INTERACTIVE_TAGS.map((tag) => interactiveItem(editor, tag, handlers)),
    ],
    [sectionDropdown(handlers)],
  ];
}
