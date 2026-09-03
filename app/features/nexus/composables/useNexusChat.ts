import type { MaybeRefOrGetter } from 'vue';

import type { ChatEventDraft, ChatFeedEvent, SpellCastDraft } from '../model';
import type { RolledDice } from './useNexusDice';

import { v4 as createUuid } from 'uuid';

import { getFindGameErrorMessage } from '~find-game/model';

import {
  CHAT_HISTORY_PAGE_SIZE,
  createOptimisticEvent,
  fetchChatHistory,
  getOldestEventCursor,
  markSubmissionFailed,
  markSubmissionPending,
  mergeChatEvent,
  mergeChatEvents,
  sendChatEvent,
  toFeedEvent,
} from '../model';
import { useChatStream } from './useChatStream';
import { useNexusDice } from './useNexusDice';
import { useNexusFight } from './useNexusFight';

export interface NexusChatOptions {
  /** Комната, чью ленту читаем; `null` — читать нечего. */
  nexusId: MaybeRefOrGetter<string | null>;
  /** Есть ли у пользователя доступ к этой ленте. */
  enabled: MaybeRefOrGetter<boolean>;
  /** Идентификатор текущего пользователя — автор оптимистичных событий. */
  authorId: MaybeRefOrGetter<string | null>;
  /**
   * Смотрит ли пользователь на конец ленты. Пока он листает старое, новые
   * события не должны дёргать прокрутку — вместо этого растёт счётчик
   * непрочитанных.
   */
  isAtBottom: MaybeRefOrGetter<boolean>;
}

/**
 * Лента чата комнаты: история, живая подписка, оптимистичная отправка и
 * восстановление после разрыва.
 *
 * @param options Комната, доступ, автор и положение прокрутки.
 */
export function useNexusChat(options: NexusChatOptions) {
  const { rollExpression } = useNexusDice();

  const events = ref<Array<ChatFeedEvent>>([]);
  const isLoadingHistory = ref(false);
  const isLoadingOlder = ref(false);
  const hasMoreHistory = ref(false);
  const historyError = ref<string | null>(null);
  const unreadCount = ref(0);

  /** Добавляет пришедшее событие в ленту и считает непрочитанные. */
  function acceptEvent(incoming: ChatFeedEvent): void {
    const before = events.value.length;

    events.value = mergeChatEvent(events.value, incoming);

    const isNew = events.value.length > before;
    const isOwn = incoming.authorId === toValue(options.authorId);

    // Счётчик растёт только на действительно новых чужих событиях: замена
    // оптимистичной записи серверной непрочитанным не считается.
    if (isNew && !isOwn && !toValue(options.isAtBottom)) {
      unreadCount.value += 1;
    }
  }

  /**
   * Загружает свежую страницу истории и вливает её в ленту.
   * @param nexusId Комната, для которой грузим историю.
   */
  async function loadLatestHistory(nexusId: string): Promise<void> {
    const history = await fetchChatHistory(
      nexusId,
      null,
      CHAT_HISTORY_PAGE_SIZE,
    );

    events.value = mergeChatEvents(events.value, history.map(toFeedEvent));
    hasMoreHistory.value = history.length === CHAT_HISTORY_PAGE_SIZE;
  }

  /** Перечитывает ленту с нуля при смене комнаты. */
  async function resetAndLoad(nexusId: string | null): Promise<void> {
    events.value = [];
    unreadCount.value = 0;
    hasMoreHistory.value = false;
    historyError.value = null;

    if (!nexusId || !toValue(options.enabled)) {
      return;
    }

    isLoadingHistory.value = true;

    try {
      await loadLatestHistory(nexusId);
    } catch (error) {
      historyError.value = getFindGameErrorMessage(error);
    } finally {
      isLoadingHistory.value = false;
    }
  }

  /** Догружает предыдущую страницу истории. */
  async function loadOlder(): Promise<void> {
    const nexusId = toValue(options.nexusId);

    if (!nexusId || isLoadingOlder.value || !hasMoreHistory.value) {
      return;
    }

    const cursor = getOldestEventCursor(events.value);

    if (!cursor) {
      return;
    }

    isLoadingOlder.value = true;

    try {
      const older = await fetchChatHistory(
        nexusId,
        cursor,
        CHAT_HISTORY_PAGE_SIZE,
      );

      events.value = mergeChatEvents(events.value, older.map(toFeedEvent));
      hasMoreHistory.value = older.length === CHAT_HISTORY_PAGE_SIZE;
    } catch (error) {
      historyError.value = getFindGameErrorMessage(error);
    } finally {
      isLoadingOlder.value = false;
    }
  }

  /**
   * Догружает то, что прошло мимо, пока не было связи. Дедупликация ленты
   * гасит уже показанные события, поэтому повторная страница безопасна.
   */
  async function catchUpMissedEvents(): Promise<void> {
    const nexusId = toValue(options.nexusId);

    if (!nexusId) {
      return;
    }

    try {
      await loadLatestHistory(nexusId);
    } catch (error) {
      historyError.value = getFindGameErrorMessage(error);
    }
  }

  // Связь у комнаты одна: по ней едет и лента, и снимок идущего боя. Раздать
  // кадр боя обязан тот, кто держит соединение, — показывать карусель будет уже
  // страница комнаты.
  const { apply: applyFightState } = useNexusFight();

  const stream = useChatStream({
    nexusId: () => toValue(options.nexusId),
    enabled: () => toValue(options.enabled),
    onEvent: (event) => acceptEvent(toFeedEvent(event)),
    onFightState: applyFightState,
    onReconnected: catchUpMissedEvents,
  });

  /**
   * Отправляет черновик, показывая его в ленте до ответа сервера.
   * @param draft Черновик сообщения.
   * @param clientMessageId Идентификатор отправки; при повторе — прежний.
   */
  async function submit(
    draft: ChatEventDraft,
    clientMessageId: string,
  ): Promise<boolean> {
    const nexusId = toValue(options.nexusId);
    const authorId = toValue(options.authorId);

    if (!nexusId || !authorId) {
      return false;
    }

    try {
      const saved = await sendChatEvent(nexusId, { ...draft, clientMessageId });

      acceptEvent(toFeedEvent(saved));

      return true;
    } catch (error) {
      events.value = markSubmissionFailed(events.value, clientMessageId);
      historyError.value = getFindGameErrorMessage(error);

      return false;
    }
  }

  /**
   * Ставит черновик в ленту и отправляет его.
   * @param draft Черновик сообщения.
   */
  async function send(draft: ChatEventDraft): Promise<boolean> {
    const nexusId = toValue(options.nexusId);
    const authorId = toValue(options.authorId);

    if (!nexusId || !authorId) {
      return false;
    }

    const clientMessageId = createUuid();

    acceptEvent(
      createOptimisticEvent(draft, clientMessageId, authorId, nexusId),
    );

    return await submit(draft, clientMessageId);
  }

  /**
   * Отправляет текстовое сообщение.
   * @param text Текст сообщения.
   */
  function sendText(text: string): Promise<boolean> {
    return send({ type: 'TEXT', text });
  }

  /**
   * Отправляет бросок.
   *
   * Считает его роллер сайта: он знает всю нотацию, а сервис принимает
   * готовый результат. Неразобранная формула броском не становится —
   * вызывающий отправит её текстом.
   *
   * @param expression Формула в нотации сайта.
   * @param label Необязательная подпись броска.
   * @returns `false`, если формулу не удалось разобрать.
   */
  function sendDiceRoll(expression: string, label?: string): Promise<boolean> {
    const rolled = rollExpression(expression);

    if (!rolled) {
      return Promise.resolve(false);
    }

    return send({ type: 'DICE_ROLL', diceRoll: { ...rolled, label } });
  }

  /**
   * Отправляет бросок, уже сделанный где-то ещё — например, с листа
   * персонажа. Пересчитывать его нельзя: в ленте должно оказаться ровно то,
   * что игрок увидел у себя.
   *
   * @param roll Готовый бросок.
   * @param label Необязательная подпись.
   */
  function sendRolled(roll: RolledDice, label?: string): Promise<boolean> {
    return send({ type: 'DICE_ROLL', diceRoll: { ...roll, label } });
  }

  /**
   * Отправляет применение заклинания.
   * @param spellCast Заклинание из справочника и необязательная цель.
   */
  function sendSpellCast(spellCast: SpellCastDraft): Promise<boolean> {
    return send({ type: 'SPELL_CAST', spellCast });
  }

  /**
   * Повторяет неудавшуюся отправку. `clientMessageId` тот же, поэтому сервис
   * вернёт уже сохранённое событие, если первая попытка всё же дошла.
   * @param event Событие ленты с ошибкой отправки.
   */
  async function retry(event: ChatFeedEvent): Promise<boolean> {
    // Повторять можно только собственную неудавшуюся отправку: у неё сохранён
    // исходный черновик. Восстанавливать его из показанного события нельзя —
    // выражение броска в ленту не попадает вовсе.
    if (!event.failed || !event.draft) {
      return false;
    }

    events.value = markSubmissionPending(events.value, event.clientMessageId);

    return await submit(event.draft, event.clientMessageId);
  }

  /** Сбрасывает счётчик непрочитанных — пользователь долистал до конца. */
  function markRead(): void {
    unreadCount.value = 0;
  }

  watch(
    [() => toValue(options.nexusId), () => toValue(options.enabled)],
    ([nexusId], [previousNexusId]) => {
      // Смена комнаты обнуляет всё: чужая история здесь не нужна. Появление
      // доступа к той же комнате — только повод дозагрузить историю.
      if (nexusId !== previousNexusId || !events.value.length) {
        resetAndLoad(nexusId);
      }
    },
    { immediate: true },
  );

  return {
    events: readonly(events) as Readonly<Ref<ReadonlyArray<ChatFeedEvent>>>,
    isLoadingHistory: readonly(isLoadingHistory),
    isLoadingOlder: readonly(isLoadingOlder),
    hasMoreHistory: readonly(hasMoreHistory),
    historyError: readonly(historyError),
    unreadCount: readonly(unreadCount),

    connectionStatus: stream.status,
    isConnectionExhausted: stream.isExhausted,
    reconnect: stream.reconnect,

    loadOlder,
    markRead,
    retry,
    sendDiceRoll,
    sendRolled,
    sendSpellCast,
    sendText,
  };
}
