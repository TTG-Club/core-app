import type { FindGameNotification } from '../model';

import {
  fetchNotifications,
  fetchUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_PAGE_SIZE,
} from '../model';

/**
 * Лента уведомлений поиска игр и счётчик непрочитанных.
 *
 * `createSharedComposable`: колокольчик стоит на нескольких страницах раздела,
 * и каждая не должна тянуть ленту заново.
 */
export const useFindGameNotifications = createSharedComposable(() => {
  const { isLoggedIn } = useUser();

  const {
    data: page,
    error,
    status,
    refresh,
  } = useAsyncData(
    'find-game-notifications',
    async () => {
      if (!isLoggedIn.value) {
        return null;
      }

      // Сборка сервиса без уведомлений отвечает 404: колокольчик тогда
      // просто пуст, а не показывает ошибку на весь раздел.
      return await fetchNotifications(0, NOTIFICATIONS_PAGE_SIZE).catch(
        () => null,
      );
    },
    { watch: [isLoggedIn], server: false, deep: false, default: () => null },
  );

  const { data: unread, refresh: refreshUnread } = useAsyncData(
    'find-game-notifications-unread',
    async () =>
      isLoggedIn.value ? await fetchUnreadNotifications().catch(() => 0) : 0,
    { watch: [isLoggedIn], server: false, default: () => 0 },
  );

  const notifications = computed<Array<FindGameNotification>>(
    () => page.value?.content ?? [],
  );

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  /**
   * Уведомления, сгруппированные по играм: колокольчик показывает, в каких
   * играх есть новости, а не сваливает всё в один список.
   */
  const games = computed(() => {
    const byGame = new Map<
      string,
      {
        gameId: string;
        gameTitle: string;
        unread: number;
        items: Array<FindGameNotification>;
      }
    >();

    for (const notification of notifications.value) {
      const bucket = byGame.get(notification.gameId) ?? {
        gameId: notification.gameId,
        gameTitle: notification.gameTitle,
        unread: 0,
        items: [],
      };

      bucket.items.push(notification);

      if (!notification.readAt) {
        bucket.unread += 1;
      }

      byGame.set(notification.gameId, bucket);
    }

    // Сначала игры с непрочитанным: ради них колокольчик и открывают.
    return [...byGame.values()].sort(
      (first, second) => second.unread - first.unread,
    );
  });

  /**
   * Отмечает уведомление прочитанным. Счётчик и лента перечитываются вместе:
   * иначе значок остаётся с прежним числом.
   * @param notificationId Идентификатор уведомления.
   */
  async function read(notificationId: string): Promise<void> {
    await markNotificationRead(notificationId);

    await Promise.all([refresh(), refreshUnread()]);
  }

  /** Отмечает прочитанной всю ленту. */
  async function readAll(): Promise<void> {
    await markAllNotificationsRead();

    await Promise.all([refresh(), refreshUnread()]);
  }

  return {
    error,
    games,
    isLoading,
    notifications,
    status,
    unread: computed(() => unread.value ?? 0),

    read,
    readAll,
    refresh,
  };
});
