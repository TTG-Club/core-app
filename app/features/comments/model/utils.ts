import type { CommentEntry, CommentNode, CommentsTarget } from './types';

import {
  COMMENT_ANCHOR_PREFIX,
  COMMENT_SECTION_MAX_LENGTH,
  COMMENT_URL_MAX_LENGTH,
  COMMENTS_ENABLED_SECTIONS,
} from './constants';

/**
 * DOM-идентификатор якоря комментария — для ссылок вида `#comment-<id>`.
 * @param commentId Идентификатор комментария.
 */
export function getCommentAnchorId(commentId: string): string {
  return `${COMMENT_ANCHOR_PREFIX}${commentId}`;
}

/**
 * Извлекает pathname из абсолютного адреса; относительный путь очищается
 * от query и hash. Невалидный абсолютный адрес превращается в пустой путь.
 * @param pathOrUrl Канонический путь либо абсолютный URL деталки.
 */
function extractPathname(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) {
    try {
      return new URL(pathOrUrl).pathname;
    } catch {
      return '';
    }
  }

  const separatorIndex = pathOrUrl.search(/[?#]/);

  return separatorIndex === -1 ? pathOrUrl : pathOrUrl.slice(0, separatorIndex);
}

/**
 * Выводит цель обсуждения из канонического пути деталки. Комментарии
 * включаются только на страницах вида `/<раздел>/<слаг>` для разделов из
 * `COMMENTS_ENABLED_SECTIONS`; для прочих путей (списки, мастерская,
 * служебные дроверы без канонического адреса) возвращается `null`.
 * @param pathOrUrl Канонический путь (`/spells/fireball`) либо абсолютный
 * URL деталки (их передают дроверы и широкая панель).
 */
export function getCommentsTarget(pathOrUrl: string): CommentsTarget | null {
  const pathname = extractPathname(pathOrUrl);

  const segments = pathname.split('/').filter(Boolean);

  if (segments.length !== 2) {
    return null;
  }

  const [section, slug] = segments;

  if (!section || !slug || !COMMENTS_ENABLED_SECTIONS.includes(section)) {
    return null;
  }

  const url = `/${section}/${slug}`;

  // Предохранитель от ограничений сервиса: слишком длинный ключ не создаст
  // тред, к которому нельзя будет обратиться повторно.
  if (
    section.length > COMMENT_SECTION_MAX_LENGTH
    || url.length > COMMENT_URL_MAX_LENGTH
  ) {
    return null;
  }

  return { section, url };
}

/**
 * Подпись «загружено столько-то из стольких-то» для списков с догрузкой:
 * счётчики, посчитанные по загруженному, не выдаются за полные.
 * @param loaded Число уже загруженных записей.
 * @param total Общее число записей по данным сервиса.
 */
export function getLoadedCountLabel(loaded: number, total: number): string {
  return `Загружено ${loaded} из ${total}`;
}

/**
 * Создаёт узел локального дерева комментариев. Листья (без ответов) сразу
 * считаются загруженными и развёрнутыми, чтобы не показывать для них кнопку
 * догрузки и сразу отображать ответы, добавленные текущим пользователем.
 * Если имя родителя не передано, используется серверное `parentAuthorName`.
 * @param comment Комментарий сервиса.
 * @param replyToName Имя автора родителя (null для корней).
 */
export function createCommentNode(
  comment: CommentEntry,
  replyToName: string | null,
): CommentNode {
  return {
    comment,
    replyToName: replyToName ?? comment.parentAuthorName,
    replies: [],
    repliesLoaded: comment.replyCount === 0,
    repliesLoading: false,
    repliesExpanded: comment.replyCount === 0,
  };
}

/**
 * Ищет узел по идентификатору комментария во всём дереве (в глубину).
 * @param nodes Корни дерева или поддерева.
 * @param commentId Идентификатор искомого комментария.
 */
export function findCommentNode(
  nodes: Array<CommentNode>,
  commentId: string,
): CommentNode | undefined {
  for (const node of nodes) {
    if (node.comment.id === commentId) {
      return node;
    }

    const found = findCommentNode(node.replies, commentId);

    if (found) {
      return found;
    }
  }

  return undefined;
}

/**
 * Принадлежит ли комментарий треду `section`/`url`. Старые сборки сервиса
 * этих полей не присылают — тогда принадлежность не проверяется (доверяем).
 * @param comment Комментарий сервиса.
 * @param section Раздел треда.
 * @param url URL страницы треда.
 */
export function isCommentFromThread(
  comment: CommentEntry,
  section: string,
  url: string,
): boolean {
  return (
    (comment.section == null || comment.section === section)
    && (comment.url == null || comment.url === url)
  );
}

/**
 * Присылает ли сервис точный размер поддерева (`totalReplyCount`).
 * Если да — фоновую догрузку счётчиков можно не запускать.
 * @param comment Комментарий сервиса.
 */
export function hasServerReplyTotal(comment: CommentEntry): boolean {
  return comment.totalReplyCount != null;
}

/**
 * Считает всех потомков узла (ответы, ответы на ответы и глубже).
 * Для загруженной ветки — фактический размер поддерева. Для ещё не
 * загруженной берётся серверное `totalReplyCount` (новые сборки), а если
 * его нет — известны только прямые ответы (`replyCount`), число уточнится
 * после догрузки ветки.
 * @param node Узел дерева комментариев.
 */
export function countCommentDescendants(node: CommentNode): number {
  if (!node.repliesLoaded) {
    return node.comment.totalReplyCount ?? node.comment.replyCount;
  }

  return node.replies.reduce(
    (total, child) => total + 1 + countCommentDescendants(child),
    0,
  );
}

/**
 * Удаляет узел вместе с поддеревом из дерева (мутирует переданные массивы —
 * они являются reactive-состоянием ленты).
 * @param nodes Корни дерева или поддерева.
 * @param commentId Идентификатор удаляемого комментария.
 * @returns true, если узел нашёлся и был удалён.
 */
export function removeCommentNode(
  nodes: Array<CommentNode>,
  commentId: string,
): boolean {
  const nodeIndex = nodes.findIndex((node) => node.comment.id === commentId);

  if (nodeIndex !== -1) {
    nodes.splice(nodeIndex, 1);

    return true;
  }

  return nodes.some((node) => removeCommentNode(node.replies, commentId));
}
