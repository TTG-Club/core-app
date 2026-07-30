import type { MarkerNode, RenderNode } from '~ui/markup';

import type { FeatureDescriptionNode } from '../types';

import { z } from '~/utils/zod';
import { clampHeadingLevel, serializeInlineNodes } from '~ui/markup';

/**
 * Преобразование текстовых блоков LSS в нашу разметку. Тексты там хранятся
 * документом редактора TipTap со стандартными узлами StarterKit, а у нас —
 * узлами разметки сайта (`{@list}`, `{@bold}`, …), поэтому дерево переносится
 * вручную: общего сериализатора у двух редакторов нет.
 */

/** Блок верхнего уровня: абзац строкой, всё остальное — узлом (как в `toStoredMarkup`). */
type MarkupBlock = string | MarkerNode;

/** Инлайн-узел разметки: текст либо маркер оформления. */
type MarkupInline = string | MarkerNode;

/** Узел документа TipTap (нужные нам поля). */
interface TiptapNode {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  content?: TiptapNode[];
}

const tiptapMarkSchema = z.object({
  type: z.string().catch(''),
  attrs: z.record(z.string(), z.unknown()).optional().catch(undefined),
});

const tiptapNodeSchema: z.ZodType<TiptapNode> = z.lazy(() =>
  z.object({
    type: z.string().catch(''),
    text: z.string().optional().catch(undefined),
    attrs: z.record(z.string(), z.unknown()).optional().catch(undefined),
    marks: z.array(tiptapMarkSchema).optional().catch(undefined),
    content: z.array(tiptapNodeSchema).optional().catch(undefined),
  }),
);

const tiptapDocumentSchema = z
  .object({ content: z.array(tiptapNodeSchema).catch([]) })
  .catch({ content: [] });

/** Типы марок TipTap, у которых есть наш инлайн-маркер. */
const MARK_TYPES: Record<string, string> = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  strike: 'strikethrough',
  highlight: 'highlight',
  superscript: 'superscript',
  subscript: 'subscript',
};

/** Типы списков TipTap. */
const LIST_TYPES = ['bulletList', 'orderedList'];

/** Ссылки на разделы сайта в текстах LSS ведут на его домены. */
const SITE_LINK_PATTERN = /^https?:\/\/(?:new\.)?ttg\.club(\/.*)$/i;

/**
 * Ссылка для маркера: адрес нашего сайта превращается в путь, чтобы ссылка из
 * заметки открывалась на месте, а не во внешней вкладке.
 *
 * @param href адрес ссылки из документа LSS.
 * @returns адрес для маркера; '' — ссылки нет.
 */
function toLinkUrl(href: unknown): string {
  if (typeof href !== 'string' || !href.trim()) {
    return '';
  }

  const sitePath = SITE_LINK_PATTERN.exec(href.trim())?.[1];

  return sitePath ?? href.trim();
}

/**
 * Инлайн-узел с наложенными марками: марки навешиваются от внутренней к внешней,
 * поэтому текст последовательно оборачивается в маркеры.
 *
 * @param node текстовый узел TipTap.
 * @returns узел разметки.
 */
function toMarkedText(node: TiptapNode): MarkupInline {
  let result: MarkupInline = node.text ?? '';

  for (const mark of node.marks ?? []) {
    if (mark.type === 'link') {
      const url = toLinkUrl(mark.attrs?.href);

      result = url
        ? { type: 'link', attrs: { url }, content: [result] }
        : result;

      continue;
    }

    const markerType = MARK_TYPES[mark.type];

    if (markerType) {
      result = { type: markerType, content: [result] };
    }
  }

  return result;
}

/**
 * Инлайн-содержимое блока: текст с марками, переносы строк и незнакомые узлы,
 * разобранные по содержимому.
 *
 * @param nodes инлайн-узлы TipTap.
 * @returns узлы разметки.
 */
function toInlineNodes(nodes: TiptapNode[]): MarkupInline[] {
  const result: MarkupInline[] = [];

  for (const node of nodes) {
    if (node.type === 'text') {
      result.push(toMarkedText(node));

      continue;
    }

    if (node.type === 'hardBreak') {
      result.push({ type: 'break' });

      continue;
    }

    // Незнакомый инлайн-узел (чип LSS, картинка) переносим по содержимому:
    // потерять текст хуже, чем потерять оформление.
    if (node.content?.length) {
      result.push(...toInlineNodes(node.content));
    }
  }

  return result;
}

/**
 * Список разметки из списка TipTap. Вложенный список кладётся отдельным узлом
 * следом за пунктом — так его показывает `MarkupList`.
 *
 * @param node узел списка TipTap.
 * @returns узел списка разметки.
 */
function toListNode(node: TiptapNode): MarkerNode {
  const content: RenderNode[] = [];

  for (const item of node.content ?? []) {
    if (LIST_TYPES.includes(item.type)) {
      content.push(toListNode(item));

      continue;
    }

    const inline: MarkupInline[] = [];
    const nested: MarkerNode[] = [];

    for (const child of item.content ?? []) {
      if (LIST_TYPES.includes(child.type)) {
        nested.push(toListNode(child));

        continue;
      }

      const childInline = toInlineNodes(child.content ?? []);

      if (!childInline.length) {
        continue;
      }

      // Второй и следующие абзацы пункта отбиваем переносом: внутри маркера
      // переносов строк быть не может.
      if (inline.length) {
        inline.push({ type: 'break' });
      }

      inline.push(...childInline);
    }

    if (inline.length) {
      content.push({ type: 'li', content: inline });
    }

    content.push(...nested);
  }

  return node.type === 'orderedList'
    ? { type: 'list', attrs: { type: 'ordered' }, content }
    : { type: 'list', content };
}

/**
 * Блок разметки из блочного узла TipTap.
 *
 * @param node блочный узел TipTap.
 * @returns блоки разметки (незнакомый узел разбирается по содержимому).
 */
function toBlocks(node: TiptapNode): MarkupBlock[] {
  if (LIST_TYPES.includes(node.type)) {
    const list = toListNode(node);

    return list.content?.length ? [list] : [];
  }

  if (node.type === 'horizontalRule') {
    return [{ type: 'separator' }];
  }

  if (node.type === 'heading') {
    const content = toInlineNodes(node.content ?? []);

    return content.length
      ? [
          {
            type: 'heading',
            attrs: { level: clampHeadingLevel(node.attrs?.level) },
            content,
          },
        ]
      : [];
  }

  if (node.type === 'blockquote') {
    // Цитата хранит содержимое массивом абзацев — так её понимают и рендер, и
    // сериализатор разметки.
    const paragraphs = (node.content ?? [])
      .map((child) => toInlineNodes(child.content ?? []))
      .filter((paragraph) => paragraph.length);

    return paragraphs.length ? [{ type: 'quote', content: paragraphs }] : [];
  }

  if (node.type === 'paragraph') {
    const text = serializeInlineNodes(toInlineNodes(node.content ?? [])).trim();

    return text ? [text] : [];
  }

  // Счётчики LSS (`resource`) переносятся отдельными ресурсами листа, поэтому в
  // тексте они не нужны; прочие незнакомые блоки разбираем по содержимому.
  if (node.type === 'resource' || !node.content?.length) {
    return [];
  }

  return node.content.flatMap(toBlocks);
}

/**
 * Разметка листа из документа редактора LSS.
 *
 * @param doc документ TipTap из файла.
 * @param skipLists пропустить списки верхнего уровня (их пункты переносятся
 *   предметами инвентаря).
 * @returns блоки разметки.
 */
export function toMarkupBlocks(doc: unknown, skipLists = false): MarkupBlock[] {
  const document = tiptapDocumentSchema.parse(doc);

  return document.content
    .filter((node) => !skipLists || !LIST_TYPES.includes(node.type))
    .flatMap(toBlocks);
}

/**
 * Содержимое заметки листа из документа LSS — в той же хранимой форме, что даёт
 * редактор разметки (JSON-строка массива блоков).
 *
 * @param blocks блоки разметки.
 * @returns строка хранения; '' — пустой текст.
 */
export function toStoredNote(blocks: MarkupBlock[]): string {
  return blocks.length ? JSON.stringify(blocks) : '';
}

/**
 * Описание особенности листа из документа LSS.
 *
 * @param doc документ TipTap из файла.
 * @returns узлы описания.
 */
export function toFeatureDescription(doc: unknown): FeatureDescriptionNode[] {
  return toMarkupBlocks(doc);
}

/**
 * Простой текст узла TipTap: только текстовые куски, без оформления.
 *
 * @param node узел TipTap.
 * @returns текст узла.
 */
function getPlainText(node: TiptapNode): string {
  if (node.type === 'text') {
    return node.text ?? '';
  }

  return (node.content ?? []).map(getPlainText).join('');
}

/**
 * Пункты списков верхнего уровня простым текстом: из них собираются предметы
 * инвентаря. Вложенные списки не разбираются — там обычно уточнения, а не
 * отдельные предметы.
 *
 * @param doc документ TipTap из файла.
 * @returns строки пунктов без пустых.
 */
export function collectListItemTexts(doc: unknown): string[] {
  const document = tiptapDocumentSchema.parse(doc);

  return document.content
    .filter((node) => LIST_TYPES.includes(node.type))
    .flatMap((list) => list.content ?? [])
    .map((item) => getPlainText(item).trim())
    .filter(Boolean);
}

/**
 * Ссылки на раздел сайта в тексте LSS: подпись и слаг записи. По ним владения
 * инструментами получают ссылку на предмет каталога.
 *
 * @param doc документ TipTap из файла.
 * @param sectionPath путь раздела (`/items`).
 * @returns подписи со слагами в порядке появления.
 */
export function collectSectionLinks(
  doc: unknown,
  sectionPath: string,
): Array<{ name: string; url: string }> {
  const document = tiptapDocumentSchema.parse(doc);
  const links: Array<{ name: string; url: string }> = [];

  function walk(node: TiptapNode): void {
    const href = node.marks?.find((mark) => mark.type === 'link')?.attrs?.href;
    const linkPath = toLinkUrl(href);
    const prefix = `${sectionPath}/`;

    if (linkPath.startsWith(prefix)) {
      const name = getPlainText(node).trim();
      const url = linkPath.slice(prefix.length);

      if (name && url) {
        links.push({ name, url });
      }
    }

    for (const child of node.content ?? []) {
      walk(child);
    }
  }

  for (const node of document.content) {
    walk(node);
  }

  return links;
}
