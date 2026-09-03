import type { ChatEvent, ChatEventDraft, ChatFeedEvent } from './types';

import {
  CHAT_RECONNECT_BASE_DELAY,
  CHAT_RECONNECT_MAX_DELAY,
} from './chatConstants';
import { compareChatEvents } from './chatUtils';

/**
 * Приводит событие сервера к элементу ленты. Всё, что пришло от сервиса,
 * считается подтверждённым.
 * @param event Событие чата от сервиса.
 */
export function toFeedEvent(event: ChatEvent): ChatFeedEvent {
  return { ...event, pending: false, failed: false, draft: null };
}

/**
 * Собирает оптимистичное событие — то, что видно в ленте до ответа сервера.
 *
 * `clientMessageId` генерирует клиент, и он же делает повторную отправку
 * безопасной: сервис по нему узнаёт уже сохранённое событие и возвращает его
 * вместо дубликата. Идентификатором ленты до ответа служит он же — настоящий
 * `id` придёт с сервера и заменит запись.
 *
 * @param draft Черновик сообщения из формы.
 * @param clientMessageId Идентификатор отправки.
 * @param authorId Идентификатор автора (текущий пользователь).
 * @param nexusId Идентификатор комнаты.
 */
export function createOptimisticEvent(
  draft: ChatEventDraft,
  clientMessageId: string,
  authorId: string,
  nexusId: string,
): ChatFeedEvent {
  return {
    id: clientMessageId,
    nexusId,
    authorId,
    clientMessageId,
    type: draft.type,
    text: draft.text ?? null,
    // Бросок считает сервер: до ответа результата нет, и лента показывает
    // только выражение из черновика.
    diceRoll: null,
    spellCast: draft.spellCast
      ? {
          spellId: draft.spellCast.spellId ?? null,
          name: draft.spellCast.name,
          level: draft.spellCast.level ?? null,
          target: draft.spellCast.target ?? null,
        }
      : null,
    createdAt: new Date().toISOString(),
    pending: true,
    failed: false,
    draft,
  };
}

/**
 * Совпадают ли отправка и пришедшее событие. Сервис ведёт идемпотентность по
 * паре «автор + `clientMessageId`», поэтому и здесь сверяются оба поля: у
 * разных авторов одинаковый идентификатор отправки означает разные события.
 * @param candidate Событие ленты.
 * @param incoming Пришедшее событие.
 */
function isSameSubmission(
  candidate: ChatFeedEvent,
  incoming: ChatFeedEvent,
): boolean {
  return (
    !!incoming.clientMessageId
    && candidate.clientMessageId === incoming.clientMessageId
    && candidate.authorId === incoming.authorId
  );
}

/**
 * Добавляет событие в ленту, не допуская дубликатов.
 *
 * Одно и то же событие приходит дважды по определению: сразу после отправки —
 * ответом на `POST`, следом — по подписке, а после переподключения ещё и
 * страницей истории. Поэтому проверок две: по `id` (сервер прислал повторно)
 * и по отправке (оптимистичная запись уступает место серверной).
 *
 * @param events Текущая лента.
 * @param incoming Пришедшее событие.
 */
export function mergeChatEvent(
  events: ReadonlyArray<ChatFeedEvent>,
  incoming: ChatFeedEvent,
): Array<ChatFeedEvent> {
  const existingIndex = events.findIndex(
    (event) => event.id === incoming.id || isSameSubmission(event, incoming),
  );

  if (existingIndex < 0) {
    return [...events, incoming].sort(compareChatEvents);
  }

  const merged = events.map((event, index) =>
    index === existingIndex ? incoming : event,
  );

  return merged.sort(compareChatEvents);
}

/**
 * Вливает в ленту пачку событий — историю или догрузку после переподключения.
 * @param events Текущая лента.
 * @param incoming Пришедшие события.
 */
export function mergeChatEvents(
  events: ReadonlyArray<ChatFeedEvent>,
  incoming: ReadonlyArray<ChatFeedEvent>,
): Array<ChatFeedEvent> {
  return incoming.reduce<Array<ChatFeedEvent>>(
    (accumulated, event) => mergeChatEvent(accumulated, event),
    [...events],
  );
}

/**
 * Помечает отправку неудачной, чтобы у сообщения появилась кнопка повтора.
 * @param events Текущая лента.
 * @param clientMessageId Идентификатор отправки.
 */
export function markSubmissionFailed(
  events: ReadonlyArray<ChatFeedEvent>,
  clientMessageId: string,
): Array<ChatFeedEvent> {
  return events.map((event) =>
    event.clientMessageId === clientMessageId && event.pending
      ? { ...event, pending: false, failed: true }
      : event,
  );
}

/**
 * Возвращает отправку в состояние «летит» — для повторной попытки.
 * @param events Текущая лента.
 * @param clientMessageId Идентификатор отправки.
 */
export function markSubmissionPending(
  events: ReadonlyArray<ChatFeedEvent>,
  clientMessageId: string,
): Array<ChatFeedEvent> {
  return events.map((event) =>
    event.clientMessageId === clientMessageId
      ? { ...event, pending: true, failed: false }
      : event,
  );
}

/**
 * Время самого раннего подтверждённого события — курсор `before` для догрузки
 * предыдущей страницы истории. Оптимистичные записи пропускаются: их время
 * поставил клиент, и на сервере такого курсора нет.
 * @param events Текущая лента.
 */
export function getOldestEventCursor(
  events: ReadonlyArray<ChatFeedEvent>,
): string | null {
  const confirmed = events.find((event) => !event.pending && !event.failed);

  return confirmed?.createdAt ?? null;
}

/**
 * Задержка перед следующей попыткой подключения: экспоненциальная, с потолком.
 *
 * Потолок обязателен — без него после долгого разрыва вкладка ушла бы в
 * многочасовое ожидание и лента не ожила бы никогда.
 *
 * @param attempt Номер попытки, начиная с первой.
 */
export function getReconnectDelay(attempt: number): number {
  const exponent = Math.max(0, attempt - 1);
  const delay = CHAT_RECONNECT_BASE_DELAY * 2 ** exponent;

  return Math.min(delay, CHAT_RECONNECT_MAX_DELAY);
}
