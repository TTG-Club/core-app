import type { CookieConsentChoice } from './types';

import { z } from 'zod';

import { COOKIE_CONSENT_CHOICES, COOKIE_CONSENT_VERSION } from './constants';

/** Схема значения cookie с выбором посетителя */
const cookieConsentSchema = z.object({
  version: z.literal(COOKIE_CONSENT_VERSION),
  choice: z.enum(COOKIE_CONSENT_CHOICES),
});

/** Версия уведомления и срок скрытия после закрытия крестиком */
const cookieDismissalSchema = z.object({
  version: z.literal(COOKIE_CONSENT_VERSION),
  until: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

/** Читает время повторного показа; повреждённая или старая запись его не откладывает. */
export function parseCookieDismissedUntil(cookieValue: unknown): number | null {
  const parsed = cookieDismissalSchema.safeParse(cookieValue);

  return parsed.success ? parsed.data.until : null;
}

/**
 * Достаёт выбор посетителя из значения cookie согласия.
 *
 * Значение другой версии уведомления, старый формат или испорченная запись
 * выбором не считаются — вернётся `null`, и уведомление покажется снова.
 * @param cookieValue Значение cookie в том виде, в котором его прочитал `useCookie`.
 */
export function parseCookieConsentChoice(
  cookieValue: unknown,
): CookieConsentChoice | null {
  const parsed = cookieConsentSchema.safeParse(cookieValue);

  return parsed.success ? parsed.data.choice : null;
}

/**
 * Собирает значение cookie для выбора посетителя в текущей версии уведомления.
 * @param choice Выбор посетителя.
 */
export function createCookieConsentValue(
  choice: CookieConsentChoice,
): z.infer<typeof cookieConsentSchema> {
  return { version: COOKIE_CONSENT_VERSION, choice };
}
