import type { ComputedRef } from 'vue';

import {
  COMMENT_SECTION_LABELS,
  COMMENT_UNKNOWN_SECTION_LABEL,
  getCommentAnchorId,
} from '../model';

/**
 * Что нужно, чтобы указать место комментария: сам он и страница, где оставлен.
 * Не комментарий целиком — подписи одинаковы и в ленте сайта, и в профиле,
 * а типы выдач там разные.
 */
export interface CommentLocationSource {
  id: string;
  section: string | null;
  url: string | null;
}

/** Возвращаемое значение композабла useCommentLocation. */
export interface UseCommentLocationReturn {
  /** Русское название раздела; незнакомый показывается как есть. */
  sectionLabel: ComputedRef<string>;

  /** Ссылка на сам комментарий; `undefined` — адрес страницы неизвестен. */
  commentLink: ComputedRef<string | undefined>;

  /**
   * Ссылка на любой комментарий той же страницы — например, на ответ в ветке.
   * @param commentId Идентификатор комментария на этой же странице.
   */
  linkToComment: (commentId: string) => string | undefined;
}

/**
 * Место комментария: в каком разделе он оставлен и как на него перейти.
 *
 * Общий для всех выдач, где комментарий показывают вне его страницы: ленты
 * сайта, блока на главной и раздела профиля. Адреса страницы может не быть —
 * старые сборки сервиса его не присылали, — тогда ссылки нет, и вызывающий
 * код прячет переход.
 *
 * @param getComment Геттер комментария (сохраняет реактивность пропсов).
 */
export function useCommentLocation(
  getComment: () => CommentLocationSource,
): UseCommentLocationReturn {
  const sectionLabel = computed(() => {
    const { section } = getComment();

    if (!section) {
      return COMMENT_UNKNOWN_SECTION_LABEL;
    }

    return COMMENT_SECTION_LABELS[section] ?? section;
  });

  function linkToComment(commentId: string): string | undefined {
    const { url } = getComment();

    return url ? `${url}#${getCommentAnchorId(commentId)}` : undefined;
  }

  const commentLink = computed(() => linkToComment(getComment().id));

  return {
    sectionLabel,
    commentLink,
    linkToComment,
  };
}
