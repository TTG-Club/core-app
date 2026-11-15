import type { JSONContent, MarkdownToken } from '@tiptap/core';
import type { EditorView } from '@tiptap/pm/view';
import type { Editor } from '@tiptap/vue-3';

import type { ImageAttributes } from '~ui/markup';

import { mergeAttributes, Node } from '@tiptap/core';
import { NodeSelection, Selection } from '@tiptap/pm/state';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

import {
  buildImageMarker,
  IMAGE_BLOCK_TYPE,
  isMarkerNode,
  parse,
  readImageAttributes,
} from '~ui/markup';

import {
  createBlockMarkerTokenizer,
  markerNameMatches,
} from './block-tokenizer';
import { IMAGE_NODE, IMAGE_NODE_ATTR } from './constants';
import ImageBlockChip from './ImageBlockChip.vue';
import { dataAttr } from './node-utils';

const IMAGE_TOKEN = 'ttgImage';

/** Имена маркера картинки (тип и алиас из markup/config.ts). */
const IMAGE_NAMES = new Set([IMAGE_BLOCK_TYPE, 'img']);

/** Поля токена картинки: настройки, разобранные из маркера. */
interface ImageTokenData {
  image: ImageAttributes;
}

/** Настройки картинки, которые меняет автор; `null` снимает значение. */
export type ImageAttributesPatch = Partial<
  Record<'float' | 'width' | 'alt' | 'caption', string | number | null>
>;

/**
 * Начинается ли строка ИМЕННО с маркера картинки (`{@image`/`{@img`).
 * Экспортируется для marks.ts, чтобы блочный чип-токенайзер пропускал картинку
 * к её собственному узлу (как списки, таблицы и заголовки).
 *
 * @param source - Строка, потенциально начинающаяся с маркера
 * @returns true, если строка начинается с маркера картинки
 */
export function isImageMarkerStart(source: string): boolean {
  return markerNameMatches(source, IMAGE_NAMES);
}

/**
 * Разбирает сырой `{@image …}` в настройки картинки. Маркер без адреса узлом
 * картинки не становится — его подберёт общий блочный чип.
 *
 * @param raw - Сырая строка маркера
 * @returns Поля токена либо undefined, если адреса нет
 */
function buildImageData(raw: string): ImageTokenData | undefined {
  const marker = parse(raw).find(
    (candidate) =>
      isMarkerNode(candidate) && candidate.type === IMAGE_BLOCK_TYPE,
  );

  const image = isMarkerNode(marker)
    ? readImageAttributes(marker.attrs)
    : undefined;

  return image ? { image } : undefined;
}

/**
 * Узел картинки в тексте: атомарный блок между абзацами. Настройки (обтекание,
 * ширина, подписи) лежат в атрибутах и меняются с тулбара; в исходник узел
 * уходит маркером `{@image | url:… | …}`.
 */
export const TtgImage = Node.create({
  name: IMAGE_NODE,
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  markdownTokenName: IMAGE_TOKEN,
  markdownTokenizer: createBlockMarkerTokenizer(
    IMAGE_TOKEN,
    isImageMarkerStart,
    buildImageData,
  ),
  // Поле `image` кладёт в токен buildImageData; токен типизирован свободно,
  // поэтому значение заново проходит проверку, а не приводится к типу.
  parseMarkdown: (token: MarkdownToken) => ({
    type: IMAGE_NODE,
    attrs: { ...readImageAttributes(token.image) },
  }),
  renderMarkdown: (node: JSONContent) => {
    const image = readImageAttributes(node.attrs);

    return image ? buildImageMarker(image) : '';
  },

  addAttributes() {
    return {
      url: dataAttr('data-url', 'url'),
      float: dataAttr('data-float', 'float'),
      width: dataAttr('data-width', 'width'),
      alt: dataAttr('data-alt', 'alt'),
      caption: dataAttr('data-caption', 'caption'),
    };
  },

  parseHTML() {
    return [{ tag: `div[${IMAGE_NODE_ATTR}]` }];
  },

  // В буфер обмена узел уходит пустым `div` с data-атрибутами, без `<img>`:
  // чужие картинки вставка вырезает (см. paste-html.ts), а свою так можно
  // скопировать и вставить внутри редактора.
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ [IMAGE_NODE_ATTR]: '' }, HTMLAttributes)];
  },

  addNodeView() {
    return VueNodeViewRenderer(ImageBlockChip);
  },
});

/**
 * Вставляет картинку отдельным блоком после текущего выделения. Абзац, в
 * котором стоит курсор, ProseMirror при этом делит сам. Выделение уходит за
 * вставленный узел — следующая картинка встанет после этой, а не перед ней.
 *
 * @param view - Представление редактора
 * @param url - Адрес загруженной картинки
 */
export function insertImageNode(view: EditorView, url: string): void {
  const nodeType = view.state.schema.nodes[IMAGE_NODE];

  if (!nodeType) {
    return;
  }

  const position = view.state.selection.to;

  const transaction = view.state.tr.replaceRangeWith(
    position,
    position,
    nodeType.create({ url }),
  );

  const positionAfterImage = transaction.mapping.map(position, 1);

  view.dispatch(
    transaction
      .setSelection(Selection.near(transaction.doc.resolve(positionAfterImage)))
      .scrollIntoView(),
  );
}

/**
 * Позиция выделенной картинки.
 *
 * @param editor - Экземпляр редактора
 * @returns Позиция узла; undefined — выделена не картинка
 */
export function getSelectedImagePosition(editor: Editor): number | undefined {
  const { selection } = editor.state;

  return selection instanceof NodeSelection
    && selection.node.type.name === IMAGE_NODE
    ? selection.from
    : undefined;
}

/**
 * Настройки картинки по её позиции в документе.
 *
 * @param editor - Экземпляр редактора
 * @param position - Позиция узла картинки
 * @returns Настройки картинки; undefined — по позиции стоит не картинка
 */
export function getImageAt(
  editor: Editor,
  position: number,
): ImageAttributes | undefined {
  const node = editor.state.doc.nodeAt(position);

  return node?.type.name === IMAGE_NODE
    ? readImageAttributes(node.attrs)
    : undefined;
}

/**
 * Меняет настройки картинки и оставляет её выделенной: тулбар продолжает
 * показывать её меню, и следующую настройку можно менять без нового клика.
 *
 * @param editor - Экземпляр редактора
 * @param position - Позиция узла картинки
 * @param patch - Изменяемые настройки; `null` снимает значение
 */
export function updateImageAt(
  editor: Editor,
  position: number,
  patch: ImageAttributesPatch,
): void {
  editor
    .chain()
    .focus()
    .command(({ tr }) => {
      const node = tr.doc.nodeAt(position);

      if (node?.type.name !== IMAGE_NODE) {
        return false;
      }

      tr.setNodeMarkup(position, undefined, { ...node.attrs, ...patch });
      tr.setSelection(NodeSelection.create(tr.doc, position));

      return true;
    })
    .run();
}
