import type { H3Event } from 'h3';

import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { fetchOnlineService, getOnlineSiteId } from '#server/domain/online';
import { LAYOUT_WIDTH_STORE_KEY, THEME_STORE_KEY } from '#shared/consts';

const onlineHeartbeatBodySchema = z.object({
  key: z.string().min(1).max(128),
  previousGuestKey: z.string().min(1).max(128).optional(),
  type: z.enum(['GUEST', 'REGISTERED']),
});

/**
 * Значение настройки отображения из cookie. Набор значений проверяет online-service,
 * здесь только отсекаем мусор, чтобы не слать его дальше.
 */
const onlinePreferenceValueSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9_-]{0,31}$/);

/** Настройки отображения для статистики в админке: имя настройки → cookie. */
const ONLINE_PREFERENCE_COOKIES = {
  theme: THEME_STORE_KEY,
  width: LAYOUT_WIDTH_STORE_KEY,
} as const;

/**
 * Собирает настройки отображения посетителя из его cookie. Настройки без cookie
 * или с некорректным значением пропускаются.
 */
function getOnlinePreferences(event: H3Event): Record<string, string> {
  return Object.fromEntries(
    Object.entries(ONLINE_PREFERENCE_COOKIES).flatMap(([name, cookieName]) => {
      const value = onlinePreferenceValueSchema.safeParse(
        getCookie(event, cookieName),
      );

      return value.success ? [[name, value.data]] : [];
    }),
  );
}

/**
 * Принимает heartbeat от фронта и пересылает его в online-app от имени backend.
 * Тему и ширину сайта берём из cookie: так клиенту не нужно их отдельно передавать.
 */
export default defineEventHandler(async (event): Promise<unknown> => {
  const body = onlineHeartbeatBodySchema.safeParse(
    await readBody<unknown>(event),
  );

  if (!body.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  return await fetchOnlineService('/api/v2/online/heartbeat', {
    body: {
      ...body.data,
      preferences: getOnlinePreferences(event),
      siteId: getOnlineSiteId(),
    },
    method: 'POST',
  });
});
