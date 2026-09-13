import type { CookieConsentChoice, UseCookieConsentReturn } from '../model';

import { createSharedComposable } from '@vueuse/core';

import {
  COOKIE_CONSENT_CHOICE_ALL,
  COOKIE_CONSENT_CHOICE_NECESSARY,
  COOKIE_CONSENT_DISMISS_DURATION,
  COOKIE_CONSENT_DISMISS_KEY,
  COOKIE_CONSENT_DISMISS_MAX_AGE,
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_MAX_AGE,
  COOKIE_CONSENT_VERSION,
  createCookieConsentValue,
  parseCookieConsentChoice,
  parseCookieDismissedUntil,
} from '../model';

/**
 * Выбор посетителя в уведомлении о cookie.
 *
 * Согласие хранится год; закрытие без аналитики — 24 часа с момента клика.
 * Пока согласия нет, счётчики не подключаются. Абсолютное время повторного
 * показа не позволяет перезагрузкам и переходам продлевать скрытие баннера.
 *
 * Общий на всё приложение: уведомление, подключение счётчиков и учёт
 * посетителей онлайн читают одно состояние, поэтому клик по кнопке сразу
 * виден всем.
 */
function createCookieConsent(): UseCookieConsentReturn {
  const storedConsent = useCookie<unknown>(COOKIE_CONSENT_KEY, {
    maxAge: COOKIE_CONSENT_MAX_AGE,
    sameSite: 'lax',
    path: '/',
    default: () => null,
  });

  const storedDismissal = useCookie<unknown>(COOKIE_CONSENT_DISMISS_KEY, {
    maxAge: COOKIE_CONSENT_DISMISS_MAX_AGE,
    sameSite: 'lax',
    path: '/',
    default: () => null,
  });

  const dismissedUntil = computed(() =>
    parseCookieDismissedUntil(storedDismissal.value),
  );

  const isAnalyticsAllowed = computed(
    () =>
      parseCookieConsentChoice(storedConsent.value)
      === COOKIE_CONSENT_CHOICE_ALL,
  );

  const choice = computed<CookieConsentChoice | null>(() => {
    if (isAnalyticsAllowed.value) {
      return COOKIE_CONSENT_CHOICE_ALL;
    }

    return dismissedUntil.value === null
      ? null
      : COOKIE_CONSENT_CHOICE_NECESSARY;
  });

  const isVisible = computed(() => choice.value === null);

  const { start: startDismissalTimer, stop: stopDismissalTimer } = useTimeoutFn(
    () => {
      storedDismissal.value = null;
    },
    () => Math.max(0, (dismissedUntil.value ?? 0) - Date.now()),
    { immediate: false },
  );

  watch(
    dismissedUntil,
    (until) => {
      stopDismissalTimer();

      if (until === null) {
        return;
      }

      if (
        until <= Date.now()
        || until > Date.now() + COOKIE_CONSENT_DISMISS_DURATION
      ) {
        // Сброс даёт null: следующий вызов watcher завершится выше, без цикла.
        storedDismissal.value = null;

        return;
      }

      startDismissalTimer();
    },
    { immediate: true },
  );

  /** Разрешает аналитику и отменяет отложенный повторный показ. */
  function acceptAll(): void {
    storedConsent.value = createCookieConsentValue(COOKIE_CONSENT_CHOICE_ALL);
    storedDismissal.value = null;
  }

  /** Запоминает закрытие без аналитики ровно на сутки с момента клика. */
  function acceptNecessary(): void {
    storedConsent.value = null;

    storedDismissal.value = {
      version: COOKIE_CONSENT_VERSION,
      until: Date.now() + COOKIE_CONSENT_DISMISS_DURATION,
    };
  }

  return {
    choice,
    isVisible,
    isAnalyticsAllowed,
    acceptAll,
    acceptNecessary,
  };
}

export const useCookieConsent = createSharedComposable(createCookieConsent);
