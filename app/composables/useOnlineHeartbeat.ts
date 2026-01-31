import {
  useBroadcastChannel,
  useEventListener,
  useIntervalFn,
} from '@vueuse/core';
import { debounce } from 'es-toolkit';

interface UseOnlineHeartbeatOptions {
  url?: string;
  heartbeatMs?: number;
  leaderTtlMs?: number;
  debug?: boolean;
}

const DEFAULT_URL = '/api/v2/online/heartbeat';
const DEFAULT_HEARTBEAT_MS = 5 * 60 * 1000;
const DEFAULT_LEADER_TTL_MS = 12_000; // лидер “жив”, если пинг был < 12s назад

export function useOnlineHeartbeat(options: UseOnlineHeartbeatOptions = {}) {
  const url = options.url ?? DEFAULT_URL;
  const heartbeatMs = options.heartbeatMs ?? DEFAULT_HEARTBEAT_MS;
  const leaderTtlMs = options.leaderTtlMs ?? DEFAULT_LEADER_TTL_MS;
  const debug = options.debug ?? false;

  // tabId нужен, чтобы различать вкладки
  const tabId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // лидерство/координация вкладок: BroadcastChannel
  const { data, post, isSupported } = useBroadcastChannel<string, string>({
    name: 'online-heartbeat',
  });

  const leaderId = ref<string | null>(null);
  const leaderLastPing = ref<number>(0);
  const isLeader = computed(() => leaderId.value === tabId);

  const log = (...args: unknown[]) => {
    if (debug) {
      // eslint-disable-next-line no-console
      console.log('[online]', ...args);
    }
  };

  const nowMs = () => Date.now();

  const sendHeartbeat = async () => {
    try {
      await fetch(url, { method: 'POST', credentials: 'include' });
      log('heartbeat sent', { tabId, isLeader: isLeader.value });
    } catch (e) {
      log('heartbeat failed', e);
    }
  };

  // Дёргать heartbeat сразу после “входа” во вкладку/возврата
  const debouncedHeartbeat = debounce(
    () => {
      void sendHeartbeat();
    },
    500,
    { edges: ['leading'] },
  );

  // Лидер периодически публикует “я жив”
  const leaderPing = () => {
    leaderLastPing.value = nowMs();
    post(`leader:ping:${tabId}:${leaderLastPing.value}`);
  };

  // Проверка “лидер жив?”
  const isLeaderAlive = () => {
    if (!leaderId.value) {
      return false;
    }

    return nowMs() - leaderLastPing.value <= leaderTtlMs;
  };

  // Попытка стать лидером
  const tryBecomeLeader = () => {
    if (isLeaderAlive() && leaderId.value !== tabId) {
      return;
    }

    leaderId.value = tabId;
    leaderLastPing.value = nowMs();
    post(`leader:claim:${tabId}:${leaderLastPing.value}`);
    log('became leader', { tabId });
  };

  // Реакция на сообщения канала
  watch(data, (msg) => {
    if (!msg) {
      return;
    }

    const parts = msg.split(':');
    const type = parts[0];

    if (type !== 'leader') {
      return;
    }

    const action = parts[1];
    const incomingId = parts[2];
    const incomingTs = Number(parts[3] ?? 0);

    if ((action === 'ping' || action === 'claim') && incomingId) {
      // Если пришёл пинг/заявка лидера — считаем его лидером,
      // но приоритет отдаём “свежему” ts
      if (!leaderId.value || incomingTs >= leaderLastPing.value) {
        leaderId.value = incomingId;
        leaderLastPing.value = incomingTs;
      }

      // Если другой лидер “перебил” — перестаём быть лидером
      if (incomingId !== tabId && isLeader.value) {
        log('lost leadership to', incomingId);
      }
    }
  });

  // Таймер heartbeat: шлёт только лидер
  const { pause: pauseHeartbeat, resume: resumeHeartbeat } = useIntervalFn(
    () => {
      if (isLeader.value) {
        leaderPing();
        void sendHeartbeat();
      } else if (!isLeaderAlive()) {
        tryBecomeLeader();
      }
    },
    heartbeatMs,
    { immediate: false },
  );

  // Более частый контроль лидера (дешёвый): раз в 3 секунды
  const { pause: pauseElection, resume: resumeElection } = useIntervalFn(
    () => {
      if (!isLeaderAlive()) {
        tryBecomeLeader();
      } else if (isLeader.value) {
        leaderPing();
      }
    },
    3000,
    { immediate: true },
  );

  // Когда вкладка снова становится видимой — дать быстрый heartbeat,
  // и попробовать переизбраться, если лидера нет
  useEventListener(document, 'visibilitychange', () => {
    if (document.hidden) {
      return;
    }

    if (!isLeaderAlive()) {
      tryBecomeLeader();
    }

    if (isLeader.value) {
      debouncedHeartbeat();
    }
  });

  // При фокусе окна аналогично
  useEventListener(window, 'focus', () => {
    if (!isLeaderAlive()) {
      tryBecomeLeader();
    }

    if (isLeader.value) {
      debouncedHeartbeat();
    }
  });

  const start = () => {
    // Если BroadcastChannel не поддерживается — деградируем:
    // каждый таб шлёт heartbeat (простое поведение).
    if (!isSupported.value) {
      log('BroadcastChannel not supported; fallback to per-tab heartbeat');
      resumeHeartbeat();
      pauseElection();
      void sendHeartbeat();

      return;
    }

    tryBecomeLeader();
    resumeElection();
    resumeHeartbeat();

    // Первый heartbeat — сразу, но только если мы лидер
    if (isLeader.value) {
      debouncedHeartbeat();
    }
  };

  const stop = () => {
    pauseHeartbeat();
    pauseElection();
  };

  return {
    start,
    stop,
    isLeader,
    tabId,
  };
}
