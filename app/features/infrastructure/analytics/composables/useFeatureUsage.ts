import type { FeatureUsageBody } from '../model';

import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';

import { USER_TOKEN_COOKIE } from '#shared/consts';

import {
  FEATURE_USAGE_ACTIVITY_EVENTS,
  FEATURE_USAGE_IDLE_MS,
  FEATURE_USAGE_OPENED_SECONDS,
  FEATURE_USAGE_REPORT_SECONDS,
  FEATURE_USAGE_SAMPLE_MS,
  FEATURE_USAGE_SAMPLE_SECONDS,
  FEATURE_USAGE_URL,
} from '../model';
import { useOnlineVisitor } from './useOnlineVisitor';

/**
 * Сервис отказал так, что повторять бессмысленно: ручки нет или запрос ей не
 * подходит. Превышение лимита и сбои сервера — временные, после них отметки
 * продолжаются.
 */
function isUsageRejected(error: unknown): boolean {
  if (!(error instanceof FetchError) || error.statusCode === undefined) {
    return false;
  }

  return (
    error.statusCode >= StatusCodes.BAD_REQUEST
    && error.statusCode < StatusCodes.INTERNAL_SERVER_ERROR
    && error.statusCode !== StatusCodes.TOO_MANY_REQUESTS
  );
}

/**
 * Учитывает работу посетителя с инструментом сайта, пока жива его страница.
 * Открытие отмечается сразу, а время копится, только когда вкладка на экране и
 * посетитель недавно что-то делал на странице: забытая вкладка и вкладка в фоне
 * не считаются. Сколько времени превращает открытие в «пользовался», решает
 * сервис учёта — сюда порог не зашит.
 *
 * Побочные действия: запросы к сервису учёта раз в минуту работы и при уходе
 * со страницы, слушатели действий посетителя на окне.
 *
 * @param feature - имя инструмента, под которым его знает сервис учёта
 */
export function useFeatureUsage(feature: string): void {
  const { getVisitor } = useOnlineVisitor();
  const userTokenCookie = useCookie<string | null>(USER_TOKEN_COOKIE);
  const { fetch: fetchUser, user } = useUser();
  const visibility = useDocumentVisibility();

  let lastActivityTime: number | undefined;
  let pendingSeconds = 0;
  let isRejected = false;

  /**
   * Отправляет отметку. Сбой учёта посетителю не показывается: статистика не
   * должна мешать работе с инструментом.
   * @param activeSeconds - сколько секунд работы накопилось
   * @param isLeaving - страницу прячут или закрывают: запрос должен её пережить
   */
  async function report(
    activeSeconds: number,
    isLeaving = false,
  ): Promise<void> {
    if (isRejected) {
      return;
    }

    try {
      // Профиль мог ещё не загрузиться: без него вошедший ушёл бы в учёт гостем.
      // При уходе со страницы ждать некогда — запрос оборвётся.
      refreshCookie(USER_TOKEN_COOKIE);

      if (!isLeaving && !user.value && userTokenCookie.value) {
        await fetchUser();
      }

      const { key, type } = getVisitor();
      const body: FeatureUsageBody = { activeSeconds, feature, key, type };

      await $fetch(FEATURE_USAGE_URL, {
        body,
        keepalive: isLeaving,
        method: 'POST',
        retry: 0,
      });
    } catch (error) {
      isRejected = isUsageRejected(error);
    }
  }

  /** Запоминает, что посетитель только что что-то сделал на странице. */
  function markActivity(): void {
    lastActivityTime = Date.now();
  }

  /** Отправляет накопленное время, если оно есть. */
  function flush(isLeaving = false): void {
    if (!pendingSeconds) {
      return;
    }

    const activeSeconds = pendingSeconds;

    pendingSeconds = 0;
    void report(activeSeconds, isLeaving);
  }

  /** Засчитывает прошедший шаг, если посетитель работал, и раз в минуту шлёт итог. */
  function sample(): void {
    const isWorking =
      visibility.value === 'visible'
      && lastActivityTime !== undefined
      && Date.now() - lastActivityTime < FEATURE_USAGE_IDLE_MS;

    if (!isWorking) {
      return;
    }

    pendingSeconds += FEATURE_USAGE_SAMPLE_SECONDS;

    if (pendingSeconds >= FEATURE_USAGE_REPORT_SECONDS) {
      flush();
    }
  }

  const { resume } = useIntervalFn(sample, FEATURE_USAGE_SAMPLE_MS, {
    immediate: false,
  });

  // Фаза перехвата: окна инструмента гасят всплытие своих событий
  useEventListener(FEATURE_USAGE_ACTIVITY_EVENTS, markActivity, {
    capture: true,
    passive: true,
  });

  // Вкладку спрятали или закрыли: остаток минуты иначе пропал бы
  watch(visibility, (visibilityState) => {
    if (visibilityState === 'hidden') {
      flush(true);
    }
  });

  useEventListener('pagehide', () => flush(true));

  onMounted(() => {
    void report(FEATURE_USAGE_OPENED_SECONDS);
    resume();
  });

  // Переход на другую страницу сайта: вкладка остаётся, а работа с инструментом кончилась
  onBeforeUnmount(() => flush());
}
