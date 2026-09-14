import type { MaybeRefOrGetter } from 'vue';

import type { PublicUserProfile } from '~/shared/types';

import { chunk } from 'es-toolkit';

import { avatarUrlSchema } from '#shared/utils';
import { z } from '~/utils/zod';

/** Резолв публичных данных по идентификаторам — ручка core-api за прокси сайта. */
const PUBLIC_USER_PROFILES_API_PATH = '/api/user/display-names/by-ids';

/** Сколько идентификаторов core-api принимает за один запрос. */
const PUBLIC_USER_PROFILES_LOOKUP_MAX = 200;

/** Резолв не удался: имена и аватарки подождут следующего запроса. */
const PUBLIC_USER_PROFILES_FAILED_LOG =
  '[user-profiles] Не удалось получить имена и аватарки пользователей:';

/** Имя и аватарка пользователя в ответе core-api. */
const publicUserProfileSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(1),
  avatarUrl: avatarUrlSchema,
});

/**
 * Разбирает ответ core-api с публичными данными пользователей.
 *
 * @param profilesResponse ответ ручки.
 * @returns данные пользователей; неверный формат — пустой список.
 */
function parsePublicUserProfiles(
  profilesResponse: unknown,
): Array<PublicUserProfile> {
  const parsedProfiles = z
    .array(publicUserProfileSchema)
    .safeParse(profilesResponse);

  return parsedProfiles.success ? parsedProfiles.data : [];
}

/**
 * Запрашивает у core-api имена и аватарки одной пачки пользователей.
 *
 * @param userIds идентификаторы, не больше `PUBLIC_USER_PROFILES_LOOKUP_MAX`.
 * @returns данные пользователей; null — запрос не удался.
 */
async function fetchPublicUserProfiles(
  userIds: Array<string>,
): Promise<Array<PublicUserProfile> | null> {
  try {
    const profilesResponse = await $fetch(PUBLIC_USER_PROFILES_API_PATH, {
      method: 'POST',
      body: { userIds },
      retry: 0,
    });

    return parsePublicUserProfiles(profilesResponse);
  } catch (error) {
    consola.warn(PUBLIC_USER_PROFILES_FAILED_LOG, error);

    return null;
  }
}

/**
 * Имена и аватарки других пользователей по идентификатору (клейм `sub`).
 *
 * Сервисы комментариев и поиска игр знают только идентификатор, а имя и
 * аватарку хранит core-api. Запросы из всех мест страницы, пришедшие за один
 * тик, уходят одной пачкой: карточки ленты резолвят каждая своего автора, а
 * сервер видит один запрос. Резолв идёт только в браузере: на сервере
 * страница рисуется с инициалами, резолв начинается после гидратации.
 *
 * `createSharedComposable`: общий кеш живёт, пока на странице есть хоть один
 * потребитель, и умирает вместе с последним.
 */
export const useUserPublicProfiles = createSharedComposable(() => {
  const profileByUserId = shallowRef<Record<string, PublicUserProfile>>({});

  // Уже запрошенные идентификаторы: перерисовка списка не должна слать тот же
  // резолв повторно, в том числе для пользователей, которых core-api не знает.
  const requestedUserIds = new Set<string>();

  // Идентификаторы, собранные за текущий тик и ещё не отправленные.
  const pendingUserIds = new Set<string>();

  let isFlushScheduled = false;

  /**
   * Отправляет собранные идентификаторы пачками. Пачка, запрос которой не
   * удался, снимается с учёта — следующий резолв попробует снова.
   */
  async function flushPendingUserIds(): Promise<void> {
    isFlushScheduled = false;

    const userIdBatches = chunk(
      [...pendingUserIds],
      PUBLIC_USER_PROFILES_LOOKUP_MAX,
    );

    pendingUserIds.clear();

    const batchResults = await Promise.all(
      userIdBatches.map(async (userIdBatch) => ({
        userIdBatch,
        profiles: await fetchPublicUserProfiles(userIdBatch),
      })),
    );

    const resolvedProfiles: Array<PublicUserProfile> = [];

    for (const { userIdBatch, profiles } of batchResults) {
      if (profiles) {
        resolvedProfiles.push(...profiles);

        continue;
      }

      for (const userId of userIdBatch) {
        requestedUserIds.delete(userId);
      }
    }

    if (!resolvedProfiles.length) {
      return;
    }

    profileByUserId.value = {
      ...profileByUserId.value,
      ...Object.fromEntries(
        resolvedProfiles.map((profile) => [profile.userId, profile]),
      ),
    };
  }

  /**
   * Ставит в очередь недостающих пользователей. Уже известные и уже
   * запрошенные пропускаются; сам запрос уходит на следующем тике.
   *
   * @param userIds идентификаторы пользователей; пустые пропускаются.
   */
  function resolveProfiles(
    userIds: ReadonlyArray<string | null | undefined>,
  ): void {
    if (import.meta.server) {
      return;
    }

    for (const userId of userIds) {
      if (userId && !requestedUserIds.has(userId)) {
        requestedUserIds.add(userId);
        pendingUserIds.add(userId);
      }
    }

    if (!pendingUserIds.size || isFlushScheduled) {
      return;
    }

    isFlushScheduled = true;

    void nextTick(flushPendingUserIds);
  }

  /**
   * Держит данные в актуальном состоянии: следит за списком идентификаторов и
   * дорезолвивает новых пользователей.
   *
   * @param userIdsSource источник идентификаторов: ref, геттер или массив.
   */
  function watchProfiles(
    userIdsSource: MaybeRefOrGetter<ReadonlyArray<string | null | undefined>>,
  ): void {
    watch(() => toValue(userIdsSource), resolveProfiles, { immediate: true });
  }

  /**
   * Имя и аватарка пользователя.
   *
   * @param userId идентификатор пользователя.
   * @returns данные; undefined — ещё не приехали или пользователь неизвестен.
   */
  function getProfile(userId: string): PublicUserProfile | undefined {
    return profileByUserId.value[userId];
  }

  return {
    resolveProfiles,
    watchProfiles,
    getProfile,
  };
});
