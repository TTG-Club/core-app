import type {
  Character,
  CharacterSheetDetail,
  SheetSaveQueueDeps,
  SheetSaveStatus,
} from '~character-sheet/model';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createSheetSaveQueue,
  DEFAULT_CHARACTER,
  getSaveRetryDelay,
  mergeCharacterSheets,
  SHEET_SAVE_DEBOUNCE_MS,
  SHEET_SAVE_RETRY_LIMIT,
} from '~character-sheet/model';

/** Что видно вокруг очереди: сервер, шапка листа и сам открытый лист. */
interface HarnessState {
  /** Версия листа, с которой идёт правка. */
  version: number | null;
  /** Состояния сохранения, как их видела шапка листа. */
  statuses: Array<SheetSaveStatus>;
  /** Документы, которые очередь положила в открытый лист. */
  documents: Array<Character>;
  /** Что ушло на сервер. */
  saved: Array<{ data: Character; version: number | null }>;
  /** Лист на сервере; без него сервер недоступен. */
  server: CharacterSheetDetail | undefined;
}

/** Отказ сервера «лист изменён в другом месте». */
const CONFLICT = new Error('conflict');

/**
 * Персонаж листа для тестов.
 * @param id - идентификатор листа
 * @param name - имя персонажа
 * @param current - текущие хиты
 */
function createCharacter(id: string, name: string, current = 10): Character {
  return {
    ...structuredClone(DEFAULT_CHARACTER),
    id,
    name,
    health: { ...DEFAULT_CHARACTER.health, current },
  };
}

/**
 * Сервер и лист вокруг одной очереди: что сохранено, что показано в шапке
 * и какой документ лежит в открытом листе.
 * @param sheetId - идентификатор листа
 */
function createHarness(sheetId: string) {
  const state: HarnessState = {
    version: 1,
    statuses: [],
    documents: [],
    saved: [],
    server: undefined,
  };

  const save = vi.fn<SheetSaveQueueDeps['save']>((data, version) => {
    state.saved.push({ data, version });

    return Promise.resolve((version ?? 0) + 1);
  });

  const deps: SheetSaveQueueDeps = {
    save,
    fetch: () => {
      if (!state.server) {
        return Promise.reject(new Error('Сервер недоступен'));
      }

      return Promise.resolve(state.server);
    },
    merge: mergeCharacterSheets,
    isConflict: (error) => error === CONFLICT,
    getVersion: () => state.version,
    setVersion: (version) => {
      if (version !== null) {
        state.version = version;
      }
    },
    onStatus: (status) => {
      state.statuses.push(status);
    },
    onDocument: (character) => {
      state.documents.push(character);
    },
  };

  return { state, save, queue: createSheetSaveQueue(sheetId, deps) };
}

/** Ждёт паузу после правки и даёт отправке завершиться. */
async function passDebounce(): Promise<void> {
  await vi.advanceTimersByTimeAsync(SHEET_SAVE_DEBOUNCE_MS);
}

describe('очередь сохранения листа', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('первый документ — исходная точка, его не отправляют', async () => {
    const { state, save, queue } = createHarness('a');

    queue.track(createCharacter('a', 'Торин'));
    await passDebounce();

    expect(save).not.toHaveBeenCalled();
    expect(queue.hasPending()).toBe(false);
    expect(state.statuses).toEqual(['saved']);
  });

  it('правка уходит одним запросом после паузы, с версией листа', async () => {
    const { state, save, queue } = createHarness('a');

    queue.track(createCharacter('a', 'Торин', 10));
    queue.track(createCharacter('a', 'Торин', 8));
    queue.track(createCharacter('a', 'Торин', 5));

    expect(save).not.toHaveBeenCalled();

    await passDebounce();

    expect(save).toHaveBeenCalledTimes(1);
    expect(state.saved[0]?.data.health.current).toBe(5);
    expect(state.saved[0]?.version).toBe(1);
    expect(state.version).toBe(2);
    expect(state.statuses.at(-1)).toBe('saved');
    expect(queue.hasPending()).toBe(false);
  });

  it('документ, равный сохранённому, повторно не отправляется', async () => {
    const { save, queue } = createHarness('a');
    const loaded = createCharacter('a', 'Торин');

    queue.track(loaded);
    queue.track(structuredClone(loaded));
    await passDebounce();

    expect(save).not.toHaveBeenCalled();
  });

  it('документ другого листа и пустой черновик очередь не берёт', async () => {
    const { save, queue } = createHarness('a');

    queue.track(createCharacter('a', 'Торин'));
    queue.track(createCharacter('b', 'Мира', 1));
    queue.track(structuredClone(DEFAULT_CHARACTER));
    await passDebounce();

    expect(save).not.toHaveBeenCalled();
  });

  it('две очереди не мешают друг другу', async () => {
    const first = createHarness('a');
    const second = createHarness('b');

    first.queue.track(createCharacter('a', 'Торин', 10));
    second.queue.track(createCharacter('b', 'Мира', 10));

    // Сервер листа «a» лежит: его повторы не должны задержать лист «b»
    first.save.mockRejectedValue(new Error('Сервер недоступен'));

    first.queue.track(createCharacter('a', 'Торин', 3));
    second.queue.track(createCharacter('b', 'Мира', 7));
    await passDebounce();

    expect(first.state.statuses.at(-1)).toBe('error');
    expect(first.queue.hasPending()).toBe(true);

    expect(second.state.saved).toHaveLength(1);
    expect(second.state.saved[0]?.data.id).toBe('b');
    expect(second.state.saved[0]?.data.health.current).toBe(7);
    expect(second.state.statuses.at(-1)).toBe('saved');
  });

  it('сбой повторяется с растущей паузой и не дольше предела попыток', async () => {
    const { state, save, queue } = createHarness('a');

    save.mockRejectedValue(new Error('Сервер недоступен'));

    queue.track(createCharacter('a', 'Торин', 10));
    queue.track(createCharacter('a', 'Торин', 5));
    await passDebounce();

    expect(save).toHaveBeenCalledTimes(1);

    for (let i = 0; i < SHEET_SAVE_RETRY_LIMIT; i++) {
      await vi.advanceTimersByTimeAsync(getSaveRetryDelay(i));
    }

    expect(save).toHaveBeenCalledTimes(1 + SHEET_SAVE_RETRY_LIMIT);

    // Предел исчерпан: очередь ждёт правки или ручного повтора
    await vi.advanceTimersByTimeAsync(
      getSaveRetryDelay(SHEET_SAVE_RETRY_LIMIT),
    );

    expect(save).toHaveBeenCalledTimes(1 + SHEET_SAVE_RETRY_LIMIT);
    expect(state.statuses.at(-1)).toBe('error');
    expect(queue.hasPending()).toBe(true);
  });

  it('ручной повтор досылает правку после сбоя', async () => {
    const { state, save, queue } = createHarness('a');

    save.mockRejectedValueOnce(new Error('Сервер недоступен'));

    queue.track(createCharacter('a', 'Торин', 10));
    queue.track(createCharacter('a', 'Торин', 5));
    await passDebounce();

    queue.retry();
    await vi.advanceTimersByTimeAsync(0);

    expect(state.saved.at(-1)?.data.health.current).toBe(5);
    expect(queue.hasPending()).toBe(false);
    expect(state.statuses.at(-1)).toBe('saved');
  });

  it('конфликт: свои правки сливаются с документом сервера и уходят заново', async () => {
    const { state, save, queue } = createHarness('a');

    queue.track(createCharacter('a', 'Торин', 10));

    // Сервер тем временем принял чужую правку: другое имя, версия 5
    state.server = {
      id: 'a',
      name: 'Торин Дубощит',
      data: createCharacter('a', 'Торин Дубощит', 10),
      shareToken: null,
      version: 5,
      editor: false,
    };

    save.mockRejectedValueOnce(CONFLICT);

    queue.track(createCharacter('a', 'Торин', 4));
    await passDebounce();

    // Лист показывает слитый документ: чужое имя и свои хиты
    expect(state.documents.at(-1)?.name).toBe('Торин Дубощит');
    expect(state.documents.at(-1)?.health.current).toBe(4);
    expect(state.version).toBe(5);

    await passDebounce();

    expect(state.saved.at(-1)?.data.name).toBe('Торин Дубощит');
    expect(state.saved.at(-1)?.data.health.current).toBe(4);
    expect(state.saved.at(-1)?.version).toBe(5);
    expect(queue.hasPending()).toBe(false);
  });

  it('чужая версия на сервере подтягивается без своих правок', async () => {
    const { state, save, queue } = createHarness('a');

    queue.track(createCharacter('a', 'Торин', 10));

    state.server = {
      id: 'a',
      name: 'Торин',
      data: createCharacter('a', 'Торин', 2),
      shareToken: null,
      version: 3,
      editor: false,
    };

    await queue.syncRemote(3);

    expect(state.documents.at(-1)?.health.current).toBe(2);
    expect(state.version).toBe(3);
    expect(save).not.toHaveBeenCalled();

    // Та же или более старая версия — запросов нет
    await queue.syncRemote(3);

    expect(state.documents).toHaveLength(1);
  });

  it('закрытие листа досылает хвост правок сразу', async () => {
    const { state, queue } = createHarness('a');

    queue.track(createCharacter('a', 'Торин', 10));
    queue.track(createCharacter('a', 'Торин', 6));

    queue.detach();
    await vi.advanceTimersByTimeAsync(0);

    expect(state.saved).toHaveLength(1);
    expect(state.saved[0]?.data.health.current).toBe(6);
    expect(queue.hasPending()).toBe(false);
  });

  it('после закрытия следующий документ — новая исходная точка', async () => {
    const { save, queue } = createHarness('a');

    queue.track(createCharacter('a', 'Торин', 10));
    queue.detach();

    // Лист открыли снова: сервер отдал уже другой документ
    queue.track(createCharacter('a', 'Торин', 3));
    await passDebounce();

    expect(save).not.toHaveBeenCalled();
  });

  it('правка во время отправки уходит следующим запросом', async () => {
    const { state, save, queue } = createHarness('a');

    queue.track(createCharacter('a', 'Торин', 10));
    queue.track(createCharacter('a', 'Торин', 8));

    let finishFirst: (version: number) => void = () => undefined;

    save.mockImplementationOnce((data, version) => {
      state.saved.push({ data, version });

      return new Promise<number>((resolve) => {
        finishFirst = resolve;
      });
    });

    await passDebounce();

    queue.track(createCharacter('a', 'Торин', 2));
    finishFirst(2);
    await passDebounce();

    expect(state.saved).toHaveLength(2);
    expect(state.saved[1]?.data.health.current).toBe(2);
    expect(state.saved[1]?.version).toBe(2);
    expect(queue.hasPending()).toBe(false);
  });
});
