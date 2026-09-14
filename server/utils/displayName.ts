import { z } from 'zod';

import { avatarUrlSchema } from '#shared/utils';

const publicProfileResponseSchema = z.object({
  displayName: z.string().min(1),
  avatarUrl: avatarUrlSchema,
});

const publicProfileByLoginSchema = z.object({
  login: z.string(),
  displayName: z.string(),
  avatarUrl: avatarUrlSchema,
});

/** Публичные данные пользователя из core-api: то, что видят другие. */
export interface UserPublicProfile {
  /** Отображаемое имя; null — core-api недоступен, показывается логин. */
  displayName: string | null;
  /** Ссылка на аватарку в хранилище сайта; null — аватарки нет. */
  avatarUrl: string | null;
}

/** Публичные данные, когда core-api ответить не смог. */
const EMPTY_PUBLIC_PROFILE: UserPublicProfile = {
  displayName: null,
  avatarUrl: null,
};

/**
 * Тянет отображаемое имя и аватарку текущего пользователя из core-api
 * (владелец данных). Best-effort: недоступность core-api или ещё не
 * задеплоенная ручка (404) → пустые данные, и вызывающий откатывается к
 * логину и инициалам. Побочно инициирует ленивое создание имени на стороне
 * core-api при первом обращении.
 *
 * @param token токен пользователя.
 */
export async function fetchUserPublicProfile(
  token: string,
): Promise<UserPublicProfile> {
  try {
    const { url } = getApiSecrets();

    const profileResponse = await $fetch<unknown>(
      `${url}/api/user/profile/display-name`,
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );

    const parsedProfile =
      publicProfileResponseSchema.safeParse(profileResponse);

    return parsedProfile.success ? parsedProfile.data : EMPTY_PUBLIC_PROFILE;
  } catch {
    return EMPTY_PUBLIC_PROFILE;
  }
}

/**
 * Отображаемое имя текущего пользователя из core-api. Best-effort, как и
 * `fetchUserPublicProfile`: при сбое null, и вызывающий откатывается к логину.
 *
 * @param token токен пользователя.
 */
export async function fetchUserDisplayName(
  token: string,
): Promise<string | null> {
  const { displayName } = await fetchUserPublicProfile(token);

  return displayName;
}

/**
 * Резолвит логины в публичные данные через публичную ручку core-api.
 * Возвращает Map по логину в нижнем регистре. Best-effort: при ошибке — пустая
 * Map, и вызывающий откатывается к логинам. Логины без заданного имени в ответ
 * не попадают (для них имя = логин на стороне вызывающего).
 *
 * @param logins логины пользователей.
 */
export async function resolvePublicProfilesByLogins(
  logins: string[],
): Promise<Map<string, UserPublicProfile>> {
  const profileByLogin = new Map<string, UserPublicProfile>();
  const uniqueLogins = [...new Set(logins.filter(Boolean))];

  if (!uniqueLogins.length) {
    return profileByLogin;
  }

  try {
    const { url } = getApiSecrets();

    const profilesResponse = await $fetch<unknown>(
      `${url}/api/user/display-names`,
      {
        body: { logins: uniqueLogins },
        method: 'POST',
      },
    );

    const parsedProfiles = z
      .array(publicProfileByLoginSchema)
      .safeParse(profilesResponse);

    if (parsedProfiles.success) {
      for (const loginProfile of parsedProfiles.data) {
        profileByLogin.set(loginProfile.login.toLowerCase(), {
          displayName: loginProfile.displayName,
          avatarUrl: loginProfile.avatarUrl,
        });
      }
    }
  } catch {
    // best-effort — оставляем пустую Map, имена откатятся к логинам
  }

  return profileByLogin;
}
