import type { ScreenState, ScreenWindow } from './schemas';

import { FetchError } from 'ofetch';

import { DM_SCREEN_API_PATH, DM_SCREEN_TEXT } from './constants';
import { screenStateSchema } from './schemas';

/**
 * Сообщение об ошибке запроса: сервер присылает русский текст в `message`.
 * @param error - пойманная ошибка
 */
export function getScreenErrorMessage(error: unknown): string {
  if (error instanceof FetchError) {
    return error.data?.message || error.message || DM_SCREEN_TEXT.unknownError;
  }

  return DM_SCREEN_TEXT.unknownError;
}

/**
 * Ширма пользователя с сервера. У того, кто ширму ещё не собирал, окон
 * нет. Токен в запрос подставляет серверный прокси из cookie.
 */
export async function fetchScreen(): Promise<ScreenState> {
  return screenStateSchema.parse(
    await $fetch(DM_SCREEN_API_PATH, { retry: 0 }),
  );
}

/**
 * Сохраняет окна ширмы пользователя целиком.
 * @param windows - окна ширмы
 * @param options - настройки запроса
 * @param options.keepalive - запрос должен пережить закрытие страницы
 */
export async function saveScreen(
  windows: ReadonlyArray<ScreenWindow>,
  options: { keepalive?: boolean } = {},
): Promise<void> {
  await $fetch(DM_SCREEN_API_PATH, {
    method: 'PUT',
    body: { windows },
    retry: 0,
    keepalive: options.keepalive,
  });
}
