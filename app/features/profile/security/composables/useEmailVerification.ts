import type { ComputedRef, Ref } from 'vue';

import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';

import {
  EMAIL_VERIFICATION_RESEND_API_PATH,
  EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
  EMAIL_VERIFICATION_RESEND_ERROR_TOAST_COLOR,
  EMAIL_VERIFICATION_RESEND_ERROR_TOAST_DESCRIPTION,
  EMAIL_VERIFICATION_RESEND_ERROR_TOAST_TITLE,
  EMAIL_VERIFICATION_RESEND_STORAGE_KEY_PREFIX,
  EMAIL_VERIFICATION_RESEND_SUCCESS_TOAST_COLOR,
  EMAIL_VERIFICATION_RESEND_SUCCESS_TOAST_DESCRIPTION,
  EMAIL_VERIFICATION_RESEND_SUCCESS_TOAST_TITLE,
} from '../model';

const SECONDS_IN_MINUTE = 60;
const MILLISECONDS_IN_SECOND = 1000;

/** Ключ хранилища для гостя: профиль ещё не загружен или токен без `sub`. */
const ANONYMOUS_STORAGE_SCOPE = 'anonymous';

/** Возвращаемое значение композабла useEmailVerification. */
export interface UseEmailVerificationReturn {
  /** Подтверждена ли почта текущего пользователя. */
  isEmailVerified: ComputedRef<boolean>;

  /** Идёт ли запрос повторной отправки письма. */
  isLoading: Ref<boolean>;

  /** Идёт ли пауза между отправками. */
  isCoolingDown: ComputedRef<boolean>;

  /** Секунд до следующей разрешённой отправки (0 — можно отправлять). */
  remainingSeconds: ComputedRef<number>;

  /** Остаток паузы в формате `м:сс`. */
  remainingLabel: ComputedRef<string>;

  /** Отправляет письмо подтверждения повторно. Возвращает true при успехе. */
  resend: () => Promise<boolean>;
}

/**
 * Форматирует остаток паузы как `м:сс`.
 * @param totalSeconds Секунд до конца паузы.
 */
function formatRemainingTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / SECONDS_IN_MINUTE);
  const seconds = totalSeconds % SECONDS_IN_MINUTE;

  return `${minutes}:${`${seconds}`.padStart(2, '0')}`;
}

/**
 * Повторная отправка письма для подтверждения почты.
 *
 * Пауза между отправками хранится в `localStorage` привязанной к пользователю:
 * перезагрузка страницы и переход между разделами профиля не сбрасывают таймер,
 * а чужая сессия в том же браузере получает свой отсчёт. Окончательный лимит
 * всё равно за auth-service — на его 429 пауза включается принудительно.
 */
export function useEmailVerification(): UseEmailVerificationReturn {
  const toast = useToast();
  const { user } = useUser();

  const isLoading = ref(false);

  const isEmailVerified = computed(() => user.value?.emailVerified !== false);

  const storageScope = computed(
    () => user.value?.id ?? user.value?.username ?? ANONYMOUS_STORAGE_SCOPE,
  );

  const cooldownUntil = useLocalStorage<number>(
    () =>
      `${EMAIL_VERIFICATION_RESEND_STORAGE_KEY_PREFIX}:${storageScope.value}`,
    0,
  );

  const currentTimestamp = useTimestamp({ interval: MILLISECONDS_IN_SECOND });

  const remainingSeconds = computed(() =>
    Math.max(
      0,
      Math.ceil(
        (cooldownUntil.value - currentTimestamp.value) / MILLISECONDS_IN_SECOND,
      ),
    ),
  );

  const isCoolingDown = computed(() => remainingSeconds.value > 0);

  const remainingLabel = computed(() =>
    formatRemainingTime(remainingSeconds.value),
  );

  /**
   * Запускает паузу указанной длительности.
   * @param seconds Длительность паузы в секундах.
   */
  function startCooldown(seconds: number): void {
    cooldownUntil.value = Date.now() + seconds * MILLISECONDS_IN_SECOND;
  }

  async function resend(): Promise<boolean> {
    if (isLoading.value || isCoolingDown.value) {
      return false;
    }

    isLoading.value = true;

    try {
      const { retryAfterSeconds } = await $fetch(
        EMAIL_VERIFICATION_RESEND_API_PATH,
        { method: 'POST' },
      );

      startCooldown(retryAfterSeconds);

      toast.add({
        title: EMAIL_VERIFICATION_RESEND_SUCCESS_TOAST_TITLE,
        description: EMAIL_VERIFICATION_RESEND_SUCCESS_TOAST_DESCRIPTION,
        color: EMAIL_VERIFICATION_RESEND_SUCCESS_TOAST_COLOR,
      });

      return true;
    } catch (resendError) {
      let description = EMAIL_VERIFICATION_RESEND_ERROR_TOAST_DESCRIPTION;

      if (resendError instanceof FetchError) {
        description = resendError.data?.message || resendError.message;

        // Сервис уже отправлял письмо: блокируем кнопку, даже если локальный
        // таймер потерялся (другой браузер, очищенное хранилище).
        if (resendError.statusCode === StatusCodes.TOO_MANY_REQUESTS) {
          startCooldown(EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS);
        }
      }

      toast.add({
        title: EMAIL_VERIFICATION_RESEND_ERROR_TOAST_TITLE,
        description,
        color: EMAIL_VERIFICATION_RESEND_ERROR_TOAST_COLOR,
      });

      return false;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    isEmailVerified,
    isLoading,
    isCoolingDown,
    remainingSeconds,
    remainingLabel,
    resend,
  };
}
