import { describe, expect, it } from 'vitest';

import { parseChatEvent, toSheetChatMessage } from '~nexus/model';

const NEXUS_ID = 'nexus-1';
const AUTHOR_ID = 'author-1';

/** Ответ сервиса с содержимым броска. */
function diceEvent(payload: Record<string, unknown>) {
  return {
    id: 'event-1',
    nexusId: NEXUS_ID,
    authorId: AUTHOR_ID,
    clientMessageId: 'client-1',
    type: 'DICE_ROLL',
    payload,
    createdAt: '2026-09-02T12:00:00Z',
  };
}

describe('разбор броска в ленте', () => {
  it('читает выпавшие кубы по группам', () => {
    const event = parseChatEvent(
      diceEvent({
        expression: '2к20вл1',
        total: 18,
        groups: [
          {
            label: '2к20',
            rolls: [
              { value: 18, valid: true, critical: null },
              { value: 7, valid: false, critical: null },
            ],
          },
        ],
      }),
    );

    expect(event.diceRoll?.expression).toBe('2к20вл1');
    expect(event.diceRoll?.total).toBe(18);
    expect(event.diceRoll?.groups[0]?.label).toBe('2к20');

    // Отброшенный роллером куб остаётся в ленте: по нему читается итог.
    expect(event.diceRoll?.groups[0]?.rolls).toEqual([
      { value: 18, valid: true, critical: null },
      { value: 7, valid: false, critical: null },
    ]);
  });

  it('читает прежние броски, которые считал сервис', () => {
    // У них вместо разбора список выпавших кубов — лента показывает его.
    const event = parseChatEvent(
      diceEvent({
        expression: '2d6+3',
        results: [4, 5],
        modifier: 3,
        total: 12,
      }),
    );

    expect(event.diceRoll?.results).toEqual([4, 5]);
    expect(event.diceRoll?.total).toBe(12);
    expect(event.diceRoll?.groups).toEqual([]);
  });
});

describe('сообщение из куска листа персонажа', () => {
  it('выделяет название и оставляет разметку живой', () => {
    const message = toSheetChatMessage(
      'Тёмное зрение',
      'У вас есть {@glossary тёмное зрение|url:darkvision-phb} в пределах 120 фт.',
    );

    // Лента рисует разметку сайта: ссылка на глоссарий доезжает живой.
    expect(message).toBe(
      '{@b Тёмное зрение}\nУ вас есть {@glossary тёмное зрение|url:darkvision-phb} в пределах 120 фт.',
    );
  });

  it('схлопывает пустоту между абзацами', () => {
    const message = toSheetChatMessage('Транс', 'Первый.\n\n\n\nВторой.\n\n');

    // В пузыре чата такой разрыв читался бы как обрыв сообщения.
    expect(message).toBe('{@b Транс}\nПервый.\n\nВторой.');
  });

  it('не ломает маркер названием со скобкой', () => {
    const message = toSheetChatMessage('Хитрость {особая}', 'Текст.');

    expect(message).toBe('Хитрость {особая}\nТекст.');
  });

  it('обходится без описания', () => {
    expect(toSheetChatMessage('Транс', '   ')).toBe('{@b Транс}');
  });
});
