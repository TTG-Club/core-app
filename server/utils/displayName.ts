import { z } from 'zod';

import { avatarUrlSchema } from '#shared/utils';

const nameAndAvatarResponseSchema = z.object({
  displayName: z.string().min(1),
  avatarUrl: avatarUrlSchema,
});

const nameAndAvatarByLoginSchema = z.object({
  login: z.string(),
  displayName: z.string(),
  avatarUrl: avatarUrlSchema,
});

/** Отображаемое имя и аватарка пользователя из core-api — то, что видят другие. */
export interface UserNameAndAvatar {
  /** Отображаемое имя; null — core-api недоступен, показывается логин. */
  displayName: string | null;
  /** Ссылка на аватарку в хранилище сайта; null — аватарки нет. */
  avatarUrl: string | null;
}

/** Имя и аватарка, когда core-api ответить не смог. */
const EMPTY_NAME_AND_AVATAR: UserNameAndAvatar = {
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
export async function fetchUserNameAndAvatar(
  token: string,
): Promise<UserNameAndAvatar> {
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
      nameAndAvatarResponseSchema.safeParse(profileResponse);

    return parsedProfile.success ? parsedProfile.data : EMPTY_NAME_AND_AVATAR;
  } catch {
    return EMPTY_NAME_AND_AVATAR;
  }
}

/**
 * Отображаемое имя текущего пользователя из core-api. Best-effort, как и
 * `fetchUserNameAndAvatar`: при сбое null, и вызывающий откатывается к логину.
 *
 * @param token токен пользователя.
 */
export async function fetchUserDisplayName(
  token: string,
): Promise<string | null> {
  const { displayName } = await fetchUserNameAndAvatar(token);

  return displayName;
}

/**
 * Резолвит логины в отображаемые имена и аватарки через публичную ручку core-api.
 * Возвращает Map по логину в нижнем регистре. Best-effort: при ошибке — пустая
 * Map, и вызывающий откатывается к логинам. Логины без заданного имени в ответ
 * не попадают (для них имя = логин на стороне вызывающего).
 *
 * @param logins логины пользователей.
 */
export async function resolveNamesAndAvatarsByLogins(
  logins: string[],
): Promise<Map<string, UserNameAndAvatar>> {
  const profileByLogin = new Map<string, UserNameAndAvatar>();
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
      .array(nameAndAvatarByLoginSchema)
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
