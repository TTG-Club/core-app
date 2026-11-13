import type { ComputedRef } from 'vue';

import type { SourcePlatform } from '#shared/consts';

import { OLD_SITE_SOURCE_PLATFORM, SOURCE_PLATFORM } from '#shared/consts';

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
  /** С какого сайта комментарий; `null` — старая запись, она с этого сайта. */
  sourcePlatform: SourcePlatform | null;
  section: string | null;
  url: string | null;
}

/** Возвращаемое значение композабла useCommentLocation. */
export interface UseCommentLocationReturn {
  /** Русское название раздела; незнакомый показывается как есть. */
  sectionLabel: ComputedRef<string>;

  /** Ссылка на страницу обсуждения; `undefined` — перейти некуда. */
  pageLink: ComputedRef<string | undefined>;

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
 * `url` в записи — путь внутри того сайта, где оставлен комментарий. Комментарий
 * с сайта 2014 открывается абсолютной ссылкой на него (база из
 * `runtimeConfig.public.oldSiteUrl`): тем же роутером путь ведёт в 404 или в
 * чужую сущность с совпавшим слагом. У других платформ (VTTG) страниц на сайте
 * нет — ссылки тоже нет.
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

  const { oldSiteUrl } = useRuntimeConfig().public;

  const pageLink = computed(() => {
    const { sourcePlatform, url } = getComment();

    if (!url) {
      return undefined;
    }

    if (!sourcePlatform || sourcePlatform === SOURCE_PLATFORM) {
      return url;
    }

    if (sourcePlatform === OLD_SITE_SOURCE_PLATFORM && oldSiteUrl) {
      return `${oldSiteUrl}${url}`;
    }

    return undefined;
  });

  function linkToComment(commentId: string): string | undefined {
    return pageLink.value
      ? `${pageLink.value}#${getCommentAnchorId(commentId)}`
      : undefined;
  }

  const commentLink = computed(() => linkToComment(getComment().id));

  return {
    sectionLabel,
    pageLink,
    commentLink,
    linkToComment,
  };
}
