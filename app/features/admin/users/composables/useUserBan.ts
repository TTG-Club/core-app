import type {
  AdminAffectedCommentsResponse,
  AdminUserResponse,
} from '../model';

import { FetchError } from 'ofetch';

import {
  ADMIN_USERS_BAN_ERROR_TOAST,
  ADMIN_USERS_BANNED_TOAST,
  ADMIN_USERS_HIDE_COMMENTS_ERROR_TOAST,
  ADMIN_USERS_RESTORE_COMMENTS_ERROR_TOAST,
  ADMIN_USERS_UNBAN_ERROR_TOAST,
  ADMIN_USERS_UNBANNED_TOAST,
  adminUserCommentsHidePath,
  adminUserCommentsRestorePath,
  adminUserLockPath,
  adminUserUnlockPath,
  getHiddenCommentsToastDescription,
  getRestoredCommentsToastDescription,
} from '../model';

/** Параметры блокировки пользователя. */
export interface BanUserOptions {
  /** Причина блокировки (пустая строка — без причины). */
  reason: string;

  /** Скрыть все опубликованные комментарии пользователя. */
  hideComments: boolean;
}

/** Параметры разблокировки пользователя. */
export interface UnbanUserOptions {
  /** Вернуть комментарии, скрытые баном. */
  restoreComments: boolean;
}

/** Результат блокировки/разблокировки. */
export interface UserBanActionResult {
  /** Обновлённый пользователь из ответа auth-service. */
  user: AdminUserResponse;

  /**
   * Сколько комментариев затронула массовая операция;
   * `null` — комментарии не трогали или операция не удалась.
   */
  affectedComments: number | null;
}

/**
 * Достаёт человекочитаемое сообщение из ошибки server-роута.
 * @param error Пойманная ошибка.
 * @param fallback Текст, когда сервер не прислал сообщения.
 */
function getBanErrorDescription(error: unknown, fallback: string): string {
  if (error instanceof FetchError) {
    return error.data?.message || error.message || fallback;
  }

  return fallback;
}

/**
 * Блокировка пользователя в админ-карточке: бан/разблокировка аккаунта в
 * auth-service и, по флагу, массовое скрытие/восстановление его комментариев
 * в comments-service. Каждый исход завершается ровно одним тостом: успех
 * обеих операций, ошибка бана или «забанен, но комментарии не тронуты».
 *
 * @param userId UUID пользователя (он же authorId в comments-service).
 */
export function useUserBan(userId: MaybeRefOrGetter<string>) {
  const toast = useToast();

  const isBanning = ref(false);
  const isUnbanning = ref(false);

  /**
   * Блокирует пользователя; по флагу скрывает все его комментарии.
   * @param options Причина и флаг скрытия комментариев.
   * @returns Результат либо `null`, если заблокировать не удалось.
   */
  async function ban(
    options: BanUserOptions,
  ): Promise<UserBanActionResult | null> {
    isBanning.value = true;

    try {
      const user = await $fetch<AdminUserResponse>(
        adminUserLockPath(toValue(userId)),
        {
          method: 'PATCH',
          body: { reason: options.reason.trim() || undefined },
          retry: 0,
        },
      );

      if (!options.hideComments) {
        toast.add({ title: ADMIN_USERS_BANNED_TOAST, color: 'success' });

        return { user, affectedComments: null };
      }

      try {
        const { affected } = await $fetch<AdminAffectedCommentsResponse>(
          adminUserCommentsHidePath(toValue(userId)),
          { method: 'POST', retry: 0 },
        );

        toast.add({
          title: ADMIN_USERS_BANNED_TOAST,
          description: getHiddenCommentsToastDescription(affected),
          color: 'success',
        });

        return { user, affectedComments: affected };
      } catch (commentsError) {
        // Бан уже состоялся — сообщаем именно о второй половине операции.
        toast.add({
          title: ADMIN_USERS_HIDE_COMMENTS_ERROR_TOAST,
          description: getBanErrorDescription(
            commentsError,
            ADMIN_USERS_HIDE_COMMENTS_ERROR_TOAST,
          ),
          color: 'error',
        });

        return { user, affectedComments: null };
      }
    } catch (error) {
      toast.add({
        title: ADMIN_USERS_BAN_ERROR_TOAST,
        description: getBanErrorDescription(error, ADMIN_USERS_BAN_ERROR_TOAST),
        color: 'error',
      });

      return null;
    } finally {
      isBanning.value = false;
    }
  }

  /**
   * Разблокирует пользователя; по флагу возвращает комментарии, скрытые баном.
   * @param options Флаг восстановления комментариев.
   * @returns Результат либо `null`, если разблокировать не удалось.
   */
  async function unban(
    options: UnbanUserOptions,
  ): Promise<UserBanActionResult | null> {
    isUnbanning.value = true;

    try {
      const user = await $fetch<AdminUserResponse>(
        adminUserUnlockPath(toValue(userId)),
        { method: 'PATCH', retry: 0 },
      );

      if (!options.restoreComments) {
        toast.add({ title: ADMIN_USERS_UNBANNED_TOAST, color: 'success' });

        return { user, affectedComments: null };
      }

      try {
        const { affected } = await $fetch<AdminAffectedCommentsResponse>(
          adminUserCommentsRestorePath(toValue(userId)),
          { method: 'POST', retry: 0 },
        );

        toast.add({
          title: ADMIN_USERS_UNBANNED_TOAST,
          description: getRestoredCommentsToastDescription(affected),
          color: 'success',
        });

        return { user, affectedComments: affected };
      } catch (commentsError) {
        // Разблокировка уже состоялась — сообщаем о второй половине операции.
        toast.add({
          title: ADMIN_USERS_RESTORE_COMMENTS_ERROR_TOAST,
          description: getBanErrorDescription(
            commentsError,
            ADMIN_USERS_RESTORE_COMMENTS_ERROR_TOAST,
          ),
          color: 'error',
        });

        return { user, affectedComments: null };
      }
    } catch (error) {
      toast.add({
        title: ADMIN_USERS_UNBAN_ERROR_TOAST,
        description: getBanErrorDescription(
          error,
          ADMIN_USERS_UNBAN_ERROR_TOAST,
        ),
        color: 'error',
      });

      return null;
    } finally {
      isUnbanning.value = false;
    }
  }

  return {
    isBanning,
    isUnbanning,
    ban,
    unban,
  };
}
