import type { ChatFeedEvent } from './types';

/** Три и больше переноса подряд: в ленте это зияющая дыра. */
const EXTRA_BLANK_LINES = /\n{3,}/g;

/** Фигурная скобка в названии: она порвала бы маркер разметки. */
const MARKUP_BRACE = /[{}]/;

/**
 * Собирает сообщение из куска листа персонажа.
 *
 * Уходит оно разметкой сайта, а не голым текстом: лента её рисует, и ссылки на
 * глоссарий со списками доезжают живыми. Название выделяется той же разметкой,
 * а лишние пустые строки — те, что в описании стоят между абзацами, —
 * схлопываются: в пузыре чата такой разрыв читается как обрыв сообщения.
 *
 * @param title Название особенности, заклинания, предмета.
 * @param text Описание разметкой.
 */
export function toSheetChatMessage(title: string, text: string): string {
  const heading = MARKUP_BRACE.test(title) ? title : `{@b ${title}}`;
  const body = text.trim().replace(EXTRA_BLANK_LINES, '\n\n');

  return body ? `${heading}\n${body}` : heading;
}

/**
 * Порядок событий в ленте: по времени, а при совпадении — по идентификатору.
 *
 * Совпадение времени не редкость: бросок и системная отметка рождаются в одну
 * миллисекунду, и без второго ключа порядок между ними плавал бы от рендера к
 * рендеру.
 *
 * @param first Первое событие.
 * @param second Второе событие.
 */
export function compareChatEvents(
  first: ChatFeedEvent,
  second: ChatFeedEvent,
): number {
  const byTime =
    new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();

  if (byTime) {
    return byTime;
  }

  return first.id.localeCompare(second.id);
}
