import type { OnlineHeartbeatBody } from '../model';

import { v7 as uuidv7 } from 'uuid';

import {
  ONLINE_COUNTER_DATA_KEY,
  parseOnlineUsersTotal,
} from '~home/counters/model';
import { useCookieConsent } from '~infrastructure/cookie-consent/composables';

import {
  HEARTBEAT_COOLDOWN_MS,
  HEARTBEAT_INTERVAL_MS,
  HEARTBEAT_LOCK_NAME,
  HEARTBEAT_URL,
  ONLINE_VISITOR_ID_COOKIE,
  ONLINE_VISITOR_ID_COOKIE_MAX_AGE_SECONDS,
  parseOnlineVisitorId,
  REGISTERED_ONLINE_TYPE,
  VISITOR_ONLINE_TYPE,
} from '../model';

/** Учитывает посетителей из одной вкладки; отзыв согласия отменяет ожидания и запросы. */
export function useOnlineHeartbeat(): void {
  const nuxtApp = useNuxtApp();

  const visitorsCounter = useState<number | null>(
    ONLINE_COUNTER_DATA_KEY,
    () => null,
  );

  const storedVisitorId = useCookie<unknown>(ONLINE_VISITOR_ID_COOKIE, {
    maxAge: ONLINE_VISITOR_ID_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
  });

  const visitorId = computed(() => parseOnlineVisitorId(storedVisitorId.value));
  const { fetch: fetchUser, isLoggedIn, user } = useUser();
  const { isAnalyticsAllowed } = useCookieConsent();
  const visibility = useDocumentVisibility();
  const isMounted = ref(false);

  let session: AbortController | undefined;
  let request: AbortController | undefined;
  let releaseLock: (() => void) | undefined;
  let isLeader = false;
  let lastHeartbeatTime = Number.NEGATIVE_INFINITY;

  /** Собирает тело запроса после проверки актуального согласия. */
  function getHeartbeatBody(): OnlineHeartbeatBody {
    if (isLoggedIn.value && user.value?.username) {
      return {
        key: user.value.username,
        ...(visitorId.value ? { previousGuestKey: visitorId.value } : {}),
        type: REGISTERED_ONLINE_TYPE,
      };
    }

    const guestId = visitorId.value ?? uuidv7();

    storedVisitorId.value = guestId;

    return { key: guestId, type: VISITOR_ONLINE_TYPE };
  }

  /** Отправляет один запрос и отбрасывает результат отменённой операции. */
  async function sendHeartbeat(): Promise<void> {
    if (
      !session
      || !isAnalyticsAllowed.value
      || request
      || (navigator.locks ? !isLeader : visibility.value === 'hidden')
      || Date.now() - lastHeartbeatTime < HEARTBEAT_COOLDOWN_MS
    ) {
      return;
    }

    const currentRequest = new AbortController();

    request = currentRequest;
    lastHeartbeatTime = Date.now();

    try {
      if (!user.value) {
        await fetchUser();
      }

      // За время ожидания профиля могли отозвать согласие или сменить пользователя.
      if (currentRequest.signal.aborted || !isAnalyticsAllowed.value) {
        return;
      }

      const heartbeatResponse = await $fetch<unknown>(HEARTBEAT_URL, {
        body: getHeartbeatBody(),
        method: 'POST',
        retry: 0,
        signal: currentRequest.signal,
      });

      if (!currentRequest.signal.aborted && isAnalyticsAllowed.value) {
        visitorsCounter.value = parseOnlineUsersTotal(heartbeatResponse);
      }
    } catch (error) {
      if (!currentRequest.signal.aborted) {
        consola.warn('Не удалось обновить число посетителей онлайн', error);
      }
    } finally {
      if (request === currentRequest) {
        request = undefined;
      }
    }
  }

  const { pause, resume } = useIntervalFn(
    sendHeartbeat,
    HEARTBEAT_INTERVAL_MS,
    {
      immediate: false,
      immediateCallback: true,
    },
  );

  /** Освобождает лидерство, отменяет запрос и останавливает таймер. */
  function stopHeartbeat(): void {
    session?.abort();
    session = undefined;
    request?.abort();
    request = undefined;
    releaseLock?.();
    releaseLock = undefined;
    isLeader = false;
    pause();
  }

  /** Согласует запуск и остановку с текущим выбором посетителя. */
  function synchronizeHeartbeat(): void {
    if (!isMounted.value || !isAnalyticsAllowed.value) {
      stopHeartbeat();

      return;
    }

    if (session) {
      return;
    }

    const currentSession = new AbortController();

    session = currentSession;
    lastHeartbeatTime = Number.NEGATIVE_INFINITY;

    if (!navigator.locks) {
      resume();

      return;
    }

    void navigator.locks
      .request(
        HEARTBEAT_LOCK_NAME,
        { mode: 'exclusive', signal: currentSession.signal },
        async () => {
          if (currentSession.signal.aborted) {
            return;
          }

          // Освобождение регистрируется до первого запроса, чтобы остановка не потерялась.
          const released = new Promise<void>((resolve) => {
            releaseLock = resolve;
          });

          isLeader = true;
          resume();
          await released;
        },
      )
      .catch((error: unknown) => {
        if (!currentSession.signal.aborted) {
          stopHeartbeat();

          consola.warn(
            'Не удалось получить блокировку учёта посетителей',
            error,
          );
        }
      });
  }

  const removeMountHook = nuxtApp.hooks.hook('app:beforeMount', () => {
    isMounted.value = true;
  });

  watch([isMounted, isAnalyticsAllowed], synchronizeHeartbeat, {
    flush: 'sync',
  });

  watch(visibility, (current, previous) => {
    if (current === 'visible' && previous === 'hidden') {
      void sendHeartbeat();
    }
  });

  watch(
    () => user.value?.username,
    () => {
      request?.abort();
      request = undefined;
      lastHeartbeatTime = Number.NEGATIVE_INFINITY;
    },
    { flush: 'sync' },
  );

  onScopeDispose(() => {
    removeMountHook();
    stopHeartbeat();
  });
}
