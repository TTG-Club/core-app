import type { H3Event } from 'h3';

import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { parseAuthJwtPayload } from '#server/utils/authService';
import { Role } from '~/shared/types';

/** Статус подписки в ответе admin API subscriber-service. */
const subscriberStatusSchema = z.enum([
  'CREATED',
  'REGISTERED',
  'ACTIVE',
  'EXPIRED',
]);

/** Тип подписки в ответе admin API subscriber-service. */
const subscriberTypeSchema = z.enum(['GIFT', 'BUY']);

/**
 * Сводный статус подписки пользователя (GET /api/admin/subscriptions/{username}).
 * Зеркалит USER-статус (`{active,registered,expiresAt,startsAt,type}`) с допущением,
 * что admin-эндпоинт может вернуть дополнительные поля — они отбрасываются.
 * Все поля, кроме `active`, опциональны/nullable: у пользователя может не быть подписки.
 */
const adminSubscriptionSchema = z.object({
  active: z.boolean(),
  registered: z.boolean().nullish(),
  status: subscriberStatusSchema.nullish(),
  type: subscriberTypeSchema.nullish(),
  startsAt: z.string().nullish(),
  expiresAt: z.string().nullish(),
});

export type AdminSubscriptionResponse = z.infer<typeof adminSubscriptionSchema>;

/**
 * Возвращает полный URL admin-эндпоинта subscriber-service.
 */
function getSubscriberAdminPath(path: string): string {
  const { url } = getSubscriberSecrets();

  return `${url}${path}`;
}

/**
 * Проверяет, что текущий пользователь — администратор, и собирает заголовки
 * авторизации с его SSO-JWT для проброса в subscriber-service.
 */
async function getSubscriberAdminHeaders(event: H3Event): Promise<Headers> {
  const token = getTokenFromRequest(event);
  const tokenPayload = parseAuthJwtPayload(await verifyJwt(token));

  if (!tokenPayload.roles.includes(Role.ADMIN)) {
    throw createError(getErrorResponse(StatusCodes.FORBIDDEN));
  }

  const headers = new Headers();

  headers.set('authorization', `Bearer ${token}`);

  return headers;
}

/**
 * Выполняет админский запрос к subscriber-service от имени текущего администратора.
 * Нормализует ошибки внешнего сервиса в безопасный для клиента статус.
 */
export async function fetchSubscriberAdminService<T>(
  event: H3Event,
  path: string,
  options: Parameters<typeof $fetch<T>>[1] = {},
): Promise<T> {
  const authorizationHeaders = await getSubscriberAdminHeaders(event);
  const requestHeaders = new Headers(options.headers);

  authorizationHeaders.forEach((value, key) => {
    requestHeaders.set(key, value);
  });

  try {
    return (await $fetch<T>(getSubscriberAdminPath(path), {
      ...options,
      headers: requestHeaders,
    })) as T;
  } catch (error) {
    return handleFetchError(
      '[subscriber-admin]',
      `Ошибка запроса к subscriber-service: ${path}`,
      error,
    );
  }
}

/**
 * Проверяет ответ admin API о статусе подписки пользователя.
 */
export function parseAdminSubscriptionResponse(
  payload: unknown,
): AdminSubscriptionResponse {
  return adminSubscriptionSchema.parse(payload);
}
