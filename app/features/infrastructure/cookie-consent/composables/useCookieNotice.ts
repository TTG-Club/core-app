import type { UseCookieNoticeReturn } from '../model';

import { createSharedComposable } from '@vueuse/core';

import {
  COOKIE_NOTICE_KEY,
  COOKIE_NOTICE_MAX_AGE,
  COOKIE_NOTICE_VERSION,
  isCookieNoticeDismissed,
} from '../model';

/** Управляет только показом уведомления; счётчики запускаются независимо от него. */
function createCookieNotice(): UseCookieNoticeReturn {
  const storedNotice = useCookie<unknown>(COOKIE_NOTICE_KEY, {
    maxAge: COOKIE_NOTICE_MAX_AGE,
    sameSite: 'lax',
    path: '/',
    default: () => null,
  });

  const isVisible = computed(
    () => !isCookieNoticeDismissed(storedNotice.value),
  );

  /** Запоминает закрытие текущей версии уведомления на год. */
  function dismiss(): void {
    storedNotice.value = { version: COOKIE_NOTICE_VERSION };
  }

  return { isVisible, dismiss };
}

export const useCookieNotice = createSharedComposable(createCookieNotice);
