import type { CommentEntry } from '../model';

import { COMMENT_DATETIME_FORMAT } from '../model';

/**
 * Подписи времени комментария: свежие (до суток) подписываются относительно
 * («7 минут назад»), старше — абсолютной датой и временем; полная дата
 * используется в подсказках.
 * @param getComment Геттер комментария (сохраняет реактивность пропсов).
 */
export function useCommentTimestamp(getComment: () => CommentEntry) {
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
