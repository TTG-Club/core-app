import {
  useDocumentVisibility,
  useEventListener,
  useIntervalFn,
} from '@vueuse/core';

/** Настройки фонового обновления данных. */
export interface BackgroundRefreshOptions {
  /** Что обновлять. Ошибку глотаем — состояние читается через shouldBackoff. */
  refresh: () => Promise<void>;

  /**
   * Стоит ли увеличить паузу после последней попытки. Обычно читает `error`
   * соответствующего `useAsyncData`: `refresh()` кладёт ошибку в ref, а не
   * бросает её.
   */
  shouldBackoff: () => boolean;

  /** Базовый интервал опроса */
  intervalMs: number;

  /** Минимальная пауза между любыми двумя обновлениями */
  cooldownMs: number;

  /** Потолок экспоненциального backoff */
  maxBackoffMs: number;
}

/**
 * Фоновое обновление данных без F5: по таймеру, при возврате на вкладку и при
 * возврате фокуса в окно.
 *
 * Защита от того, чтобы фронт сам себя не завалил запросами:
 * - таймер ПАУЗИТСЯ на скрытой вкладке (Page Visibility) — оставленная в фоне
 *   вкладка не шлёт запросы; при возврате обновляемся разово;
 * - cooldown между любыми обновлениями — серия focus/visibility не выдаёт пачку;
 * - single-flight — новый опрос не стартует, пока не завершился предыдущий;
 * - экспоненциальный backoff (до потолка), пока `shouldBackoff` возвращает
 *   `true`: упавший или лимитирующий сервис получает запросы всё реже, успех
 *   сбрасывает задержку.
 *
 * Вызывать один раз на набор данных — иначе таймеров будет столько, сколько
 * потребителей.
 *
 * @param options Настройки обновления.
 */
export function useBackgroundRefresh(options: BackgroundRefreshOptions): void {
  if (!import.meta.client) {
    return;
  }

  const visibility = useDocumentVisibility();

  // Опрос идёт через «затвор» nextAllowedAt — он держит и cooldown, и backoff.
  let inFlight = false;
  let nextAllowedAt = 0;
  let backoffMs = 0;

  async function runRefresh(): Promise<void> {
    // Скрытую вкладку не опрашиваем ни по одному триггеру: focus может прийти,
    // пока вкладка ещё hidden (гонка с visibilitychange).
    if (
      visibility.value === 'hidden'
      || inFlight
      || Date.now() < nextAllowedAt
    ) {
      return;
    }

    inFlight = true;

    try {
      await options.refresh();
    } catch {
      // Ошибку обновления читаем через shouldBackoff: refresh() обычно кладёт
      // её в ref, а не бросает.
    } finally {
      inFlight = false;

      if (options.shouldBackoff()) {
        backoffMs = Math.min(
          backoffMs ? backoffMs * 2 : options.intervalMs,
          options.maxBackoffMs,
        );

        nextAllowedAt = Date.now() + backoffMs;
      } else {
        backoffMs = 0;
        nextAllowedAt = Date.now() + options.cooldownMs;
      }
    }
  }

  const { pause, resume } = useIntervalFn(
    () => {
      void runRefresh();
    },
    options.intervalMs,
    { immediate: false },
  );

  // Пауза на скрытой вкладке; при возврате — рестарт таймера и разовое обновление.
  watch(visibility, (state) => {
    if (state === 'visible') {
      resume();
      void runRefresh();
    } else {
      pause();
    }
  });

  // Возврат фокуса в окно (когда вкладка уже была видимой) — тоже повод обновиться.
  useEventListener(window, 'focus', () => {
    void runRefresh();
  });

  onMounted(() => {
    if (visibility.value !== 'hidden') {
      resume();
    }
  });
}
