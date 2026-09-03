import type { ChatEvent, ChatFeedEvent } from '~nexus/model';

import { describe, expect, it } from 'vitest';

import {
  CHAT_RECONNECT_BASE_DELAY,
  CHAT_RECONNECT_MAX_DELAY,
  createOptimisticEvent,
  getOldestEventCursor,
  getReconnectDelay,
  markSubmissionFailed,
  markSubmissionPending,
  mergeChatEvent,
  mergeChatEvents,
  toFeedEvent,
} from '~nexus/model';

const NEXUS_ID = 'nexus-1';
const AUTHOR_ID = 'author-1';

/** Событие, подтверждённое сервером. */
function serverEvent(overrides: Partial<ChatEvent> = {}): ChatEvent {
  return {
    id: 'event-1',
    nexusId: NEXUS_ID,
    authorId: AUTHOR_ID,
    clientMessageId: 'client-1',
    type: 'TEXT',
    text: 'Открываю дверь',
    diceRoll: null,
    spellCast: null,
    createdAt: '2026-08-26T12:00:00Z',
    ...overrides,
  };
}

describe('дедупликация ленты', () => {
  it('одно и то же событие по id не удваивается', () => {
    // Событие приходит дважды по определению: ответом на отправку и следом по
    // подписке, а после переподключения — ещё и страницей истории.
    const first = mergeChatEvent([], toFeedEvent(serverEvent()));
    const second = mergeChatEvent(first, toFeedEvent(serverEvent()));

    expect(second).toHaveLength(1);
  });

  it('повторное событие заменяет прежнее, а не добавляется рядом', () => {
    const feed = mergeChatEvent(
      [],
      toFeedEvent(serverEvent({ text: 'Старый' })),
    );

    const updated = mergeChatEvent(
      feed,
      toFeedEvent(serverEvent({ text: 'Новый' })),
    );

    expect(updated).toHaveLength(1);
    expect(updated[0]?.text).toBe('Новый');
  });

  it('разные события живут в ленте рядом', () => {
    const feed = mergeChatEvents(
      [],
      [
        toFeedEvent(serverEvent({ id: 'a', clientMessageId: 'ca' })),
        toFeedEvent(serverEvent({ id: 'b', clientMessageId: 'cb' })),
      ],
    );

    expect(feed).toHaveLength(2);
  });

  it('целая страница истории вливается без дублей', () => {
    const page = [
      toFeedEvent(serverEvent({ id: 'a', clientMessageId: 'ca' })),
      toFeedEvent(serverEvent({ id: 'b', clientMessageId: 'cb' })),
    ];

    const feed = mergeChatEvents(page, page);

    expect(feed).toHaveLength(2);
  });

  it('лента упорядочена по времени', () => {
    const feed = mergeChatEvents(
      [],
      [
        toFeedEvent(
          serverEvent({
            id: 'c',
            clientMessageId: 'cc',
            createdAt: '2026-08-26T12:02:00Z',
          }),
        ),
        toFeedEvent(
          serverEvent({
            id: 'a',
            clientMessageId: 'ca',
            createdAt: '2026-08-26T12:00:00Z',
          }),
        ),
        toFeedEvent(
          serverEvent({
            id: 'b',
            clientMessageId: 'cb',
            createdAt: '2026-08-26T12:01:00Z',
          }),
        ),
      ],
    );

    expect(feed.map((event) => event.id)).toEqual(['a', 'b', 'c']);
  });

  it('события одной миллисекунды упорядочены стабильно', () => {
    // Иначе догрузка истории и приход тех же событий по подписке меняли бы
    // их местами прямо на глазах у читающего.
    const sameTime = '2026-08-26T12:00:00Z';

    const first = mergeChatEvents(
      [],
      [
        toFeedEvent(
          serverEvent({ id: 'b', clientMessageId: 'cb', createdAt: sameTime }),
        ),
        toFeedEvent(
          serverEvent({ id: 'a', clientMessageId: 'ca', createdAt: sameTime }),
        ),
      ],
    );

    const second = mergeChatEvents(
      [],
      [
        toFeedEvent(
          serverEvent({ id: 'a', clientMessageId: 'ca', createdAt: sameTime }),
        ),
        toFeedEvent(
          serverEvent({ id: 'b', clientMessageId: 'cb', createdAt: sameTime }),
        ),
      ],
    );

    expect(first.map((event) => event.id)).toEqual(
      second.map((event) => event.id),
    );
  });

  it('совпадение clientMessageId у разных авторов не считается дублем', () => {
    const mine = toFeedEvent(
      serverEvent({ id: 'a', authorId: 'me', clientMessageId: 'same' }),
    );

    const theirs = toFeedEvent(
      serverEvent({ id: 'b', authorId: 'you', clientMessageId: 'same' }),
    );

    expect(mergeChatEvent([mine], theirs)).toHaveLength(2);
  });
});

describe('оптимистичная отправка', () => {
  it('черновик появляется в ленте до ответа сервера', () => {
    const optimistic = createOptimisticEvent(
      { type: 'TEXT', text: 'Привет' },
      'client-42',
      AUTHOR_ID,
      NEXUS_ID,
    );

    expect(optimistic.pending).toBe(true);
    expect(optimistic.failed).toBe(false);
    expect(optimistic.text).toBe('Привет');
    expect(optimistic.draft).toEqual({ type: 'TEXT', text: 'Привет' });
  });

  it('серверное событие заменяет оптимистичное по clientMessageId', () => {
    const optimistic = createOptimisticEvent(
      { type: 'TEXT', text: 'Привет' },
      'client-42',
      AUTHOR_ID,
      NEXUS_ID,
    );

    const feed = mergeChatEvent([], optimistic);

    const confirmed = toFeedEvent(
      serverEvent({
        id: 'server-id',
        clientMessageId: 'client-42',
        text: 'Привет',
      }),
    );

    const reconciled = mergeChatEvent(feed, confirmed);

    // Ровно одно сообщение, уже подтверждённое: пузырь не должен раздваиваться.
    expect(reconciled).toHaveLength(1);
    expect(reconciled[0]?.id).toBe('server-id');
    expect(reconciled[0]?.pending).toBe(false);
    expect(reconciled[0]?.draft).toBeNull();
  });

  it('у брошенного кубика до ответа сервера нет результата — только выражение', () => {
    const optimistic = createOptimisticEvent(
      { type: 'DICE_ROLL', diceRoll: { expression: '2d20+5' } },
      'client-43',
      AUTHOR_ID,
      NEXUS_ID,
    );

    // Бросок считает сервер: показывать «свой» результат нельзя.
    expect(optimistic.diceRoll).toBeNull();
    expect(optimistic.draft?.diceRoll?.expression).toBe('2d20+5');
  });

  it('заклинание видно сразу — его содержимое известно клиенту', () => {
    const optimistic = createOptimisticEvent(
      {
        type: 'SPELL_CAST',
        spellCast: {
          spellId: 'magic-missile',
          name: 'Волшебная стрела',
          level: 1,
        },
      },
      'client-44',
      AUTHOR_ID,
      NEXUS_ID,
    );

    expect(optimistic.spellCast?.spellId).toBe('magic-missile');
    expect(optimistic.spellCast?.level).toBe(1);
  });

  it('неудачная отправка помечается и сохраняет черновик для повтора', () => {
    const optimistic = createOptimisticEvent(
      { type: 'DICE_ROLL', diceRoll: { expression: '1d20' } },
      'client-45',
      AUTHOR_ID,
      NEXUS_ID,
    );

    const failed = markSubmissionFailed([optimistic], 'client-45');

    expect(failed[0]?.failed).toBe(true);
    expect(failed[0]?.pending).toBe(false);
    // Без черновика повтор было бы нечем собрать: выражение броска в само
    // событие не попадает.
    expect(failed[0]?.draft?.diceRoll?.expression).toBe('1d20');
  });

  it('повтор возвращает сообщение в состояние отправки', () => {
    const optimistic = createOptimisticEvent(
      { type: 'TEXT', text: 'Ещё раз' },
      'client-46',
      AUTHOR_ID,
      NEXUS_ID,
    );

    const failed = markSubmissionFailed([optimistic], 'client-46');
    const retried = markSubmissionPending(failed, 'client-46');

    expect(retried[0]?.pending).toBe(true);
    expect(retried[0]?.failed).toBe(false);
  });

  it('чужие сообщения при пометке не трогаются', () => {
    const mine = createOptimisticEvent(
      { type: 'TEXT', text: 'Моё' },
      'client-47',
      AUTHOR_ID,
      NEXUS_ID,
    );

    const theirs = toFeedEvent(
      serverEvent({ id: 'other', clientMessageId: 'client-99' }),
    );

    const feed: Array<ChatFeedEvent> = [theirs, mine];
    const failed = markSubmissionFailed(feed, 'client-47');

    expect(failed.find((event) => event.id === 'other')?.failed).toBe(false);
  });
});

describe('курсор догрузки истории', () => {
  it('берётся время самого раннего подтверждённого события', () => {
    const feed = mergeChatEvents(
      [],
      [
        toFeedEvent(
          serverEvent({
            id: 'a',
            clientMessageId: 'ca',
            createdAt: '2026-08-26T12:00:00Z',
          }),
        ),
        toFeedEvent(
          serverEvent({
            id: 'b',
            clientMessageId: 'cb',
            createdAt: '2026-08-26T12:05:00Z',
          }),
        ),
      ],
    );

    expect(getOldestEventCursor(feed)).toBe('2026-08-26T12:00:00Z');
  });

  it('пустая лента курсора не даёт', () => {
    expect(getOldestEventCursor([])).toBeNull();
  });

  it('неотправленное сообщение курсором не становится', () => {
    // Его время поставил клиент — на сервере такого курсора нет.
    const optimistic = createOptimisticEvent(
      { type: 'TEXT', text: 'Летит' },
      'client-48',
      AUTHOR_ID,
      NEXUS_ID,
    );

    const feed = [optimistic];

    expect(getOldestEventCursor(feed)).toBeNull();
  });
});

describe('переподключение', () => {
  it('пауза растёт экспоненциально', () => {
    expect(getReconnectDelay(1)).toBe(CHAT_RECONNECT_BASE_DELAY);
    expect(getReconnectDelay(2)).toBe(CHAT_RECONNECT_BASE_DELAY * 2);
    expect(getReconnectDelay(3)).toBe(CHAT_RECONNECT_BASE_DELAY * 4);
    expect(getReconnectDelay(4)).toBe(CHAT_RECONNECT_BASE_DELAY * 8);
  });

  it('пауза упирается в потолок', () => {
    // Без потолка вкладка после долгого разрыва ушла бы в многочасовое
    // ожидание и лента не ожила бы никогда.
    expect(getReconnectDelay(20)).toBe(CHAT_RECONNECT_MAX_DELAY);
    expect(getReconnectDelay(100)).toBe(CHAT_RECONNECT_MAX_DELAY);
  });

  it('пауза никогда не отрицательная', () => {
    expect(getReconnectDelay(0)).toBeGreaterThan(0);
    expect(getReconnectDelay(-5)).toBeGreaterThan(0);
  });
});

describe('восстановление пропущенного после разрыва', () => {
  it('страница истории добирает пропущенное, не удваивая показанное', () => {
    // Пока связи не было, события шли мимо. После переподключения лента
    // перечитывает свежую страницу истории — и уже показанное в ней есть.
    const beforeOutage = mergeChatEvents(
      [],
      [
        toFeedEvent(
          serverEvent({
            id: 'a',
            clientMessageId: 'ca',
            createdAt: '2026-08-26T12:00:00Z',
          }),
        ),
        toFeedEvent(
          serverEvent({
            id: 'b',
            clientMessageId: 'cb',
            createdAt: '2026-08-26T12:01:00Z',
          }),
        ),
      ],
    );

    const historyAfterReconnect = [
      toFeedEvent(
        serverEvent({
          id: 'b',
          clientMessageId: 'cb',
          createdAt: '2026-08-26T12:01:00Z',
        }),
      ),
      toFeedEvent(
        serverEvent({
          id: 'c',
          clientMessageId: 'cc',
          createdAt: '2026-08-26T12:02:00Z',
        }),
      ),
      toFeedEvent(
        serverEvent({
          id: 'd',
          clientMessageId: 'cd',
          createdAt: '2026-08-26T12:03:00Z',
        }),
      ),
    ];

    const restored = mergeChatEvents(beforeOutage, historyAfterReconnect);

    expect(restored.map((event) => event.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('своё неотправленное сообщение переживает восстановление', () => {
    const optimistic = createOptimisticEvent(
      { type: 'TEXT', text: 'Не ушло' },
      'client-49',
      AUTHOR_ID,
      NEXUS_ID,
    );

    const feed = markSubmissionFailed([optimistic], 'client-49');

    const restored = mergeChatEvents(feed, [
      toFeedEvent(serverEvent({ id: 'a', clientMessageId: 'ca' })),
    ]);

    const stillThere = restored.find(
      (event) => event.clientMessageId === 'client-49',
    );

    expect(stillThere?.failed).toBe(true);
  });

  it('дошедшее до сервера сообщение после переподключения перестаёт быть неотправленным', () => {
    // Первая попытка могла долететь, а ответ — потеряться. Сервис ведёт
    // идемпотентность по clientMessageId, поэтому событие вернётся в истории
    // и должно заменить пометку об ошибке.
    const optimistic = createOptimisticEvent(
      { type: 'TEXT', text: 'Дошло' },
      'client-50',
      AUTHOR_ID,
      NEXUS_ID,
    );

    const feed = markSubmissionFailed([optimistic], 'client-50');

    const restored = mergeChatEvents(feed, [
      toFeedEvent(
        serverEvent({
          id: 'server-50',
          clientMessageId: 'client-50',
          text: 'Дошло',
        }),
      ),
    ]);

    expect(restored).toHaveLength(1);
    expect(restored[0]?.id).toBe('server-50');
    expect(restored[0]?.failed).toBe(false);
    expect(restored[0]?.pending).toBe(false);
  });
});
