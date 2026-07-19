import type { ComputedRef } from 'vue';

import {
  COOKIE_CONSENT_DISMISS_KEY,
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_MAX_AGE,
  COOKIE_CONSENT_VERSION,
} from '../model';

/** Возвращаемое значение композабла useCookieConsent. */
export interface UseCookieConsentReturn {
  /** Нужно ли показывать баннер прямо сейчас. */
  isVisible: ComputedRef<boolean>;

  /** Фиксирует согласие в cookie на срок COOKIE_CONSENT_MAX_AGE. */
  accept: () => void;

  /** Скрывает баннер до конца текущей сессии вкладки, без согласия. */
  dismiss: () => void;
}

/**
 * Управляет баннером уведомления об использовании cookie.
 *
 * Согласие хранится в cookie со значением принятой версии текста, поэтому при
 * изменении формулировки достаточно поднять `COOKIE_CONSENT_VERSION`.
 * Кнопка «Закрыть» согласием не является: она прячет баннер только на текущую
 * сессию вкладки (sessionStorage), при следующем визите он покажется снова.
 */
export function useCookieConsent(): UseCookieConsentReturn {
  const acceptedVersion = useCookie<string | null>(COOKIE_CONSENT_KEY, {
    maxAge: COOKIE_CONSENT_MAX_AGE,
    sameSite: 'lax',
    path: '/',
    default: () => null,
  });

  const isDismissed = useSessionStorage(COOKIE_CONSENT_DISMISS_KEY, false);

  const isVisible = computed(
    () =>
      acceptedVersion.value !== COOKIE_CONSENT_VERSION && !isDismissed.value,
  );

  function accept(): void {
    acceptedVersion.value = COOKIE_CONSENT_VERSION;
  }

  function dismiss(): void {
    isDismissed.value = true;
  }

  return {
    isVisible,
    accept,
    dismiss,
  };
}
