import type { ComputedRef } from 'vue';

import type { MyCommentsUpdates } from '../../model';

import { createSharedComposable } from '@vueuse/core';

import {
  fetchMyCommentsUpdates,
  MY_COMMENTS_POLL_COOLDOWN_MS,
  MY_COMMENTS_POLL_INTERVAL_MS,
  MY_COMMENTS_POLL_MAX_BACKOFF_MS,
  MY_COMMENTS_SEEN_AT_STORAGE_KEY,
  MY_COMMENTS_SEEN_SETTLE_MS,
  MY_COMMENTS_UPDATES_DATA_KEY,
} from '../../model';

/** Описание возвращаемого значения композабла useMyCommentUpdates. */
export interface UseMyCommentUpdatesReturn {
  /** Есть ли непросмотренные ответы на комментарии пользователя */
  hasUpdates: ComputedRef<boolean>;

  /** Сколько ответов появилось после отметки просмотра */
  newReplyCount: ComputedRef<number>;

  /** Отметка просмотра: дата последнего просмотренного ответа */
  seenAt: ComputedRef<string | null>;

  /** Пометить просмотренными все ответы не новее переданной даты */
  markSeenUpTo: (replyAt: string | null) => void;
}

/**
 * Индикатор «вам ответили»: точка у вкладки профиля, у шлема и в его меню.
 *
 * Обёрнут в `createSharedComposable` по той же причине, что и опрос
 * баг-репортов: потребителей несколько (шлем, обе копии навигации профиля, сам
 * раздел), а таймер опроса и наблюдатель за отметкой должны существовать в
 * единственном экземпляре.
 *
 * Отметка просмотра хранит дату `lastReplyAt`, полученную от сервиса, а не
 * время браузера: серверные даты сравниваются между собой без оглядки на часы
 * и часовой пояс клиента.
 */
function createMyCommentUpdates(): UseMyCommentUpdatesReturn {
  const seenAt = useLocalStorage(MY_COMMENTS_SEEN_AT_STORAGE_KEY, '');

  // server: false — приватные данные пользователя грузим на клиенте, где
  // авторизация (cookie → Bearer → микросервис) гарантированно работает.
  const { data, error, refresh } = useAsyncData<MyCommentsUpdates>(
    MY_COMMENTS_UPDATES_DATA_KEY,
    () => fetchMyCommentsUpdates(seenAt.value || null),
    { server: false },
  );

  const newReplyCount = computed(() => data.value?.count ?? 0);

  // Наружу отдаём факт: интерфейс показывает точку, а не число.
  const hasUpdates = computed(() => newReplyCount.value > 0);

  /**
   * Двигает отметку просмотра вперёд и пересчитывает сводку.
   *
   * Отметка только растёт: карточки читаются по одной, и откат назад заново
   * зажёг бы точку на уже просмотренном.
   *
   * @param replyAt Дата ответа на просмотренный комментарий.
   */
  function markSeenUpTo(replyAt: string | null): void {
    if (!replyAt) {
      return;
    }

    if (
      seenAt.value
      && new Date(seenAt.value).getTime() >= new Date(replyAt).getTime()
    ) {
      return;
    }

    seenAt.value = replyAt;
  }

  // Сводку пересчитываем, когда отметка устоится: карточки читаются пачкой, и
  // запрос на каждую превращался бы в залп, где побеждает случайный ответ —
  // точка гасла бы не полностью.
  watchDebounced(
    seenAt,
    () => {
      void refresh();
    },
    { debounce: MY_COMMENTS_SEEN_SETTLE_MS },
  );

  // Опрос сводки: точка зажигается без перезагрузки страницы.
  useBackgroundRefresh({
    refresh: () => refresh(),
    shouldBackoff: () => !!error.value,
    intervalMs: MY_COMMENTS_POLL_INTERVAL_MS,
    cooldownMs: MY_COMMENTS_POLL_COOLDOWN_MS,
    maxBackoffMs: MY_COMMENTS_POLL_MAX_BACKOFF_MS,
  });

  return {
    hasUpdates,
    newReplyCount,
    seenAt: computed(() => seenAt.value || null),
    markSeenUpTo,
  };
}

export const useMyCommentUpdates = createSharedComposable(
  createMyCommentUpdates,
);
