import { z } from 'zod';

import { COOKIE_NOTICE_VERSION } from './constants';

/** Значение cookie с версией закрытого уведомления. */
const cookieNoticeSchema = z.object({
  version: z.literal(COOKIE_NOTICE_VERSION),
});

/** Проверяет отметку закрытия; старые и повреждённые значения не скрывают уведомление. */
export function isCookieNoticeDismissed(cookieValue: unknown): boolean {
  return cookieNoticeSchema.safeParse(cookieValue).success;
}
