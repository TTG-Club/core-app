import type { MaybeRefOrGetter } from 'vue';

import type { ChatConnectionStatus, ChatEvent, FightState } from '../model';

import {
  CHAT_RECONNECT_MAX_ATTEMPTS,
  getChatStreamUrl,
  getReconnectDelay,
  parseChatEventSafe,
  parseFightStateSafe,
} from '../model';

/** Имя SSE-события, которым сервис присылает новую запись ленты. */
const CHAT_EVENT_NAME = 'chat-event';

/** Имя SSE-события со снимком идущего боя. */
const FIGHT_STATE_EVENT_NAME = 'fight-state';

export interface ChatStreamOptions {
  /** Комната, на чью ленту подписываемся; `null` — подписки нет. */
  nexusId: MaybeRefOrGetter<string | null>;
  /** Подписываться ли вообще: у чата может не быть доступа. */
  enabled: MaybeRefOrGetter<boolean>;
  /** Пришло новое событие ленты. */
  onEvent: (event: ChatEvent) => void;
  /**
   * Мастер обновил снимок боя. Едет по той же связи, что и лента: живое
   * соединение у комнаты одно, и заводить второе ради карусели незачем.
   */
  onFightState?: (state: FightState) => void;
  /**
   * Соединение восстановилось после разрыва. Пока связи не было, события шли
   * мимо, поэтому подписчик обязан догрузить пропущенное из истории.
   */
  onReconnected: () => void;
}

export interface ChatStreamState {
  status: Readonly<Ref<ChatConnectionStatus>>;
  /** Номер текущей попытки переподключения; 0 — соединение живо. */
  attempt: Readonly<Ref<number>>;
  /** Попытки исчерпаны: дальше только по кнопке. */
  isExhausted: Readonly<Ref<boolean>>;
  /** Подключиться немедленно, сбросив счётчик попыток. */
  reconnect: () => void;
}

/**
 * Подписка на SSE-ленту чата.
 *
 * Используется нативный `EventSource`, а не `useEventSource` из VueUse: тому
 * можно задать только фиксированную паузу между попытками, а здесь нужна
 * экспоненциальная с потолком и, главное, сигнал «связь восстановилась» —
 * без него нечем запустить догрузку пропущенных событий.
 *
 * Токен в адрес не попадает: маршрут same-origin, браузер сам шлёт cookie
 * сессии, а Nitro превращает её в `Authorization` для сервиса.
 *
 * @param options Комната, условие подписки и обработчики.
 */
export function useChatStream(options: ChatStreamOptions): ChatStreamState {
  const status = ref<ChatConnectionStatus>('disconnected');
  const attempt = ref(0);
  const isExhausted = ref(false);

  let source: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  // Первое подключение к ленте не считается восстановлением: догружать после
  // него нечего, историю страница и так грузит сама.
  let hasBeenConnected = false;

  /** Снимает отложенную попытку переподключения. */
  function clearReconnectTimer(): void {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  /** Закрывает соединение и снимает все обработчики. */
  function closeSource(): void {
    clearReconnectTimer();

    if (source) {
      source.close();
      source = null;
    }
  }

  /**
   * Разбирает кадр подписки. Битый кадр не рвёт соединение — лента просто не
   * показывает эту запись.
   * @param frame Кадр SSE.
   */
  function handleFrame(frame: MessageEvent<string>): void {
    const payload = readFrame(frame);

    if (payload === undefined) {
      return;
    }

    const event = parseChatEventSafe(payload);

    if (event) {
      options.onEvent(event);
    }
  }

  /**
   * Разбирает кадр со снимком боя.
   * @param frame Кадр SSE.
   */
  function handleFightFrame(frame: MessageEvent<string>): void {
    const payload = readFrame(frame);

    if (payload === undefined) {
      return;
    }

    const state = parseFightStateSafe(payload);

    if (state) {
      options.onFightState?.(state);
    }
  }

  /**
   * Содержимое кадра; `undefined` — кадр битый и его пропускают.
   * @param frame Кадр SSE.
   */
  function readFrame(frame: MessageEvent<string>): unknown {
    try {
      return JSON.parse(frame.data);
    } catch {
      consola.warn('[nexus] Кадр чата не разобран как JSON');

      return undefined;
    }
  }

  /** Планирует следующую попытку с экспоненциальной задержкой. */
  function scheduleReconnect(): void {
    if (attempt.value >= CHAT_RECONNECT_MAX_ATTEMPTS) {
      status.value = 'disconnected';
      isExhausted.value = true;

      return;
    }

    attempt.value += 1;
    status.value = 'reconnecting';

    reconnectTimer = setTimeout(connect, getReconnectDelay(attempt.value));
  }

  /** Открывает подписку на текущую ленту. */
  function connect(): void {
    closeSource();

    const nexusId = toValue(options.nexusId);

    if (!import.meta.client || !nexusId || !toValue(options.enabled)) {
      status.value = 'disconnected';

      return;
    }

    status.value = attempt.value ? 'reconnecting' : 'connecting';

    const opened = new EventSource(getChatStreamUrl(nexusId));

    source = opened;

    opened.onopen = () => {
      status.value = 'connected';
      attempt.value = 0;
      isExhausted.value = false;

      if (hasBeenConnected) {
        // Пока связи не было, события шли мимо: подписчик добирает их из
        // истории, а дедупликация ленты гасит уже показанные.
        options.onReconnected();
      }

      hasBeenConnected = true;
    };

    opened.addEventListener(CHAT_EVENT_NAME, handleFrame);
    opened.addEventListener(FIGHT_STATE_EVENT_NAME, handleFightFrame);

    opened.onerror = () => {
      // EventSource переподключается сам с неуправляемой паузой, поэтому
      // соединение закрывается и попытка планируется вручную.
      closeSource();
      scheduleReconnect();
    };
  }

  /** Подключается немедленно, начиная отсчёт попыток заново. */
  function reconnect(): void {
    attempt.value = 0;
    isExhausted.value = false;
    connect();
  }

  watch(
    [() => toValue(options.nexusId), () => toValue(options.enabled)],
    ([nexusId], [previousNexusId]) => {
      // Смена комнаты — это новая подписка: счётчик попыток и признак «уже
      // были на связи» относятся к прежней и должны обнулиться.
      if (nexusId !== previousNexusId) {
        hasBeenConnected = false;
        attempt.value = 0;
        isExhausted.value = false;
      }

      connect();
    },
    { immediate: true },
  );

  // Соединение должно умереть вместе с компонентом: иначе на сервисе копятся
  // живые эмиттеры после каждого ухода со страницы.
  onScopeDispose(closeSource);

  return {
    status: readonly(status),
    attempt: readonly(attempt),
    isExhausted: readonly(isExhausted),
    reconnect,
  };
}
