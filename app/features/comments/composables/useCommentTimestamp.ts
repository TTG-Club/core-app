import type { ComputedRef } from 'vue';

import { COMMENT_DATETIME_FORMAT } from '../model';

/**
 * Источник дат для подписей времени. Не `PublicComment` целиком: те же подписи
 * нужны и своим комментариям в профиле, и ответам на них — общего у них ровно
 * две даты.
 */
export interface CommentTimestampSource {
  createdAt: string;
  editedAt?: string | null;
}

/** Возвращаемое значение композабла useCommentTimestamp. */
export interface UseCommentTimestampReturn {
  /** Подпись времени создания: относительная либо абсолютная. */
  createdLabel: ComputedRef<string>;

  /** Абсолютные дата и время создания (подсказка и старые комментарии). */
  createdFullLabel: ComputedRef<string>;

  /** Подсказка пометки «(изменено)» с полной датой правки. */
  editedTooltip: ComputedRef<string>;
}

/**
 * Подписи времени комментария: свежие (до суток) подписываются относительно
 * («7 минут назад»), старше — абсолютной датой и временем; полная дата
 * используется в подсказках.
 * @param getComment Геттер источника дат (сохраняет реактивность пропсов).
 */
export function useCommentTimestamp(
  getComment: () => CommentTimestampSource,
): UseCommentTimestampReturn {
  const { $dayjs, format } = useDayjs();

  /** Абсолютные дата и время создания — подсказка и старые комментарии. */
  const createdFullLabel = computed(() => {
    const { createdAt } = getComment();

    return createdAt ? format(createdAt, COMMENT_DATETIME_FORMAT) : '';
  });

  /** Подпись времени создания: относительная либо абсолютная. */
  const createdLabel = computed(() => {
    const { createdAt } = getComment();

    if (!createdAt) {
      return '';
    }

    const created = $dayjs(createdAt);

    if (!created.isValid()) {
      return '';
    }

    if ($dayjs().diff(created, 'hour') >= 24) {
      return createdFullLabel.value;
    }

    return created.fromNow();
  });

  /** Подсказка пометки «(изменено)» с полной датой правки. */
  const editedTooltip = computed(() => {
    const { editedAt } = getComment();

    return editedAt
      ? `Изменено ${format(editedAt, COMMENT_DATETIME_FORMAT)}`
      : '';
  });

  return {
    createdLabel,
    createdFullLabel,
    editedTooltip,
  };
}
