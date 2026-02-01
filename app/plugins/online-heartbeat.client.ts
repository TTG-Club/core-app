import {
  tryOnScopeDispose,
  useDocumentVisibility,
  useIntervalFn,
} from '@vueuse/core';
import { v7 as uuidv7 } from 'uuid';

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
  const HEARTBEAT_URL = '/api/v2/online/heartbeat';
  const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;
  const HEARTBEAT_COOLDOWN_MS = 30 * 1000;
  const DEBUG = import.meta.dev;

  const tabId = uuidv7();

  let stopLock: (() => void) | null = null;
  let lastHeartbeatTime = 0;

  const isLeader = ref(false);
  const visibility = useDocumentVisibility();

  const log = (...args: unknown[]) => {
    if (DEBUG) {
      consola.log('[online-heartbeat]', ...args);
    }
  };

  /**
   * Отправляет heartbeat-запрос на сервер.
   *
   * @param force - Если true, игнорирует проверку cooldown (например, при инициализации).
   */
  const sendHeartbeat = async (force = false) => {
    const now = Date.now();

    if (!force && now - lastHeartbeatTime < HEARTBEAT_COOLDOWN_MS) {
      log('heartbeat skipped (cooldown)', { tabId });

      return;
    }

    lastHeartbeatTime = now;

    try {
      await $fetch(HEARTBEAT_URL, {
        method: 'POST',
        retry: 0,
      });

      log('heartbeat sent', { tabId, isLeader: isLeader.value });
    } catch (e) {
      log('heartbeat failed', e);
    }

    try {
      await refreshNuxtData('material-counter');
    } catch (e) {
      log('refresh material-counter failed', e);
    }
  };

  const { pause: pauseHeartbeat, resume: resumeHeartbeat } = useIntervalFn(
    () => {
      // Если Web Locks нет, шлем только если вкладка видна
      if (!navigator.locks && visibility.value === 'hidden') {
        return;
      }

      void sendHeartbeat();
    },
    HEARTBEAT_INTERVAL_MS,
    { immediate: false },
  );

  watch(visibility, (current, previous) => {
    if (current === 'visible' && previous === 'hidden') {
      log('tab became visible');
      void sendHeartbeat();

      if (isLeader.value) {
        pauseHeartbeat();
        resumeHeartbeat();
      }
    }
  });

  const start = () => {
    if (!navigator.locks) {
      log('Web Locks API not supported; fallback to per-tab heartbeat');
      resumeHeartbeat();

      if (visibility.value === 'visible') {
        void sendHeartbeat(true);
      }

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

        void sendHeartbeat(true);
        resumeHeartbeat();

        await new Promise<void>((resolve) => {
          stopLock = resolve;
        });

        isLeader.value = false;
        pauseHeartbeat();
        log('lost leadership', { tabId });
      },
    );
  };

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
