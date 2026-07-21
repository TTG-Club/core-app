import { z } from 'zod';

const displayNameResponseSchema = z.object({
  displayName: z.string().min(1),
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
