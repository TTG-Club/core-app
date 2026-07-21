import { z } from 'zod';

const displayNameResponseSchema = z.object({
  displayName: z.string().min(1),
});

const displayNameByLoginSchema = z.object({
  login: z.string(),
  displayName: z.string(),
});

/**
 * Тянет отображаемое имя текущего пользователя из core-api (владелец данных).
 * Best-effort: недоступность core-api или ещё не задеплоенная ручка (404) → null,
 * и вызывающий откатывается к логину. Побочно инициирует ленивое создание имени
 * на стороне core-api при первом обращении.
 */
export async function fetchUserDisplayName(
  token: string,
): Promise<string | null> {
  try {
    const { url } = getApiSecrets();

    const payload = await $fetch<unknown>(
      `${url}/api/user/profile/display-name`,
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );

    const parsed = displayNameResponseSchema.safeParse(payload);

    return parsed.success ? parsed.data.displayName : null;
  } catch {
    return null;
  }
}

/**
 * Резолвит логины в отображаемые имена через публичную ручку core-api.
 * Возвращает Map по логину в нижнем регистре. Best-effort: при ошибке — пустая
 * Map, и вызывающий откатывается к логинам. Логины без заданного имени в ответ
 * не попадают (для них имя = логин на стороне вызывающего).
 */
export async function resolveDisplayNamesByLogins(
  logins: string[],
): Promise<Map<string, string>> {
  const nameByLogin = new Map<string, string>();
  const uniqueLogins = [...new Set(logins.filter(Boolean))];

  if (!uniqueLogins.length) {
    return nameByLogin;
  }

  try {
    const { url } = getApiSecrets();

    const payload = await $fetch<unknown>(`${url}/api/user/display-names`, {
      body: { logins: uniqueLogins },
      method: 'POST',
    });

    const parsed = z.array(displayNameByLoginSchema).safeParse(payload);

    if (parsed.success) {
      for (const entry of parsed.data) {
        nameByLogin.set(entry.login.toLowerCase(), entry.displayName);
      }
    }
  } catch {
    // best-effort — оставляем пустую Map, имена откатятся к логинам
  }

  return nameByLogin;
}
