import {
  tryOnScopeDispose,
  useDocumentVisibility,
  useIntervalFn,
} from '@vueuse/core';
import { v7 as uuidv7 } from 'uuid';

import {
  ONLINE_COUNTER_DATA_KEY,
  parseOnlineUsersTotal,
} from '~home/counters/model';

const HEARTBEAT_URL = '/api/v2/online/heartbeat';
const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const HEARTBEAT_COOLDOWN_MS = 10 * 1000;
const ONLINE_VISITOR_ID_COOKIE = 'ttg-online-visitor-id';
const ONLINE_VISITOR_ID_COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;
const VISITOR_ONLINE_TYPE = 'GUEST';
const REGISTERED_ONLINE_TYPE = 'REGISTERED';
const DEBUG = import.meta.dev;

interface OnlineHeartbeatBody {
  key: string;
  previousGuestKey?: string;
  type: typeof REGISTERED_ONLINE_TYPE | typeof VISITOR_ONLINE_TYPE;
}

/**
 * Плагин для отправки heartbeat-запросов на сервер для отслеживания статуса "онлайн".
 *
 * Особенности:
 * - Использует Web Locks API для выбора "лидера" среди вкладок, чтобы слать запросы только с одной вкладки.
 * - При отсутствии поддержки Web Locks (редко) шлет запросы только если вкладка активна (visible).
 * - Отслеживает активность вкладки (visibility) для немедленного обновления статуса при возвращении пользователя.
 * - Имеет защиту от спама (cooldown) для предотвращения частых запросов при переключении вкладок.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const tabId = uuidv7();

  const visitorsCounter = useState<number | null>(
    ONLINE_COUNTER_DATA_KEY,
    () => null,
  );

  const visitorIdCookie = useCookie<string | null>(ONLINE_VISITOR_ID_COOKIE, {
    maxAge: ONLINE_VISITOR_ID_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
  });

  const { fetch: fetchUser, isLoggedIn, user } = useUser();

  let stopLock: (() => void) | null = null;
  let lastHeartbeatTime = 0;

  const isLeader = ref(false);
  const visibility = useDocumentVisibility();

  function log(...args: unknown[]): void {
    if (DEBUG) {
      consola.log('[online-heartbeat]', ...args);
    }
  }

  /**
   * Возвращает стабильный идентификатор гостя для online-app.
   */
  function getVisitorId(): string {
    if (!visitorIdCookie.value) {
      visitorIdCookie.value = uuidv7();
    }

    return visitorIdCookie.value;
  }

  /**
   * Возвращает данные текущего пользователя для heartbeat.
   */
  async function getHeartbeatBody(): Promise<OnlineHeartbeatBody> {
    if (!user.value) {
      try {
        await fetchUser();
      } catch (error) {
        log('user fetch failed', error);
      }
    }

    if (isLoggedIn.value && user.value?.username) {
      if (visitorIdCookie.value) {
        return {
          key: user.value.username,
          previousGuestKey: visitorIdCookie.value,
          type: REGISTERED_ONLINE_TYPE,
        };
      }

      return {
        key: user.value.username,
        type: REGISTERED_ONLINE_TYPE,
      };
    }

    return {
      key: getVisitorId(),
      type: VISITOR_ONLINE_TYPE,
    };
  }

  /**
   * Отправляет heartbeat-запрос на backend, который проксирует его в online-app.
   */
  async function sendHeartbeat(): Promise<void> {
    const now = Date.now();

    if (now - lastHeartbeatTime < HEARTBEAT_COOLDOWN_MS) {
      log('heartbeat skipped (cooldown)', { tabId });

      return;
    }

    lastHeartbeatTime = now;

    try {
      const body = await getHeartbeatBody();

      const heartbeatResponse = await $fetch<unknown>(HEARTBEAT_URL, {
        body,
        method: 'POST',
        retry: 0,
      });

      visitorsCounter.value = parseOnlineUsersTotal(heartbeatResponse);

      log('heartbeat sent', { tabId, isLeader: isLeader.value });
    } catch (error) {
      log('heartbeat failed', error);
    }
  }

  const { pause: pauseHeartbeat, resume: resumeHeartbeat } = useIntervalFn(
    () => {
      // Если Web Locks нет, шлем только если вкладка видна
      if (!navigator.locks && visibility.value === 'hidden') {
        return;
      }

      void sendHeartbeat();
    },
    HEARTBEAT_INTERVAL_MS,
    { immediate: false, immediateCallback: true },
  );

  watch(visibility, (current, previous) => {
    if (current === 'visible' && previous === 'hidden') {
      log('tab became visible');

      if (isLeader.value) {
        pauseHeartbeat();
        resumeHeartbeat();

        return;
      }

      void sendHeartbeat();
    }
  });

  function start(): void {
    if (!navigator.locks) {
      log('Web Locks API not supported; fallback to per-tab heartbeat');
      resumeHeartbeat();

      return;
    }

    navigator.locks.request(
      'ttg-online-heartbeat-leader',
      { mode: 'exclusive' },
      async (lock) => {
        if (!lock) {
          return;
        }

        log('became leader', { tabId });
        isLeader.value = true;

        resumeHeartbeat();

        await new Promise<void>((resolve) => {
          stopLock = resolve;
        });

        isLeader.value = false;
        pauseHeartbeat();
        log('lost leadership', { tabId });
      },
    );
  }

  nuxtApp.hooks.hook('app:beforeMount', () => {
    start();
  });

  tryOnScopeDispose(() => {
    if (stopLock) {
      stopLock();
      stopLock = null;
    } else {
      pauseHeartbeat();
    }
  });
});
