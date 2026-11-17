import type { SheetSaveQueue, SheetSaveStatus } from '../model';

import { StatusCodes } from 'http-status-codes';

import { getFetchStatus } from '~initiative/model';

import {
  createSheetSaveQueue,
  fetchCharacterSheet,
  getSheetStateKey,
  mergeCharacterSheets,
  parseSheetKey,
  SHEET_KEEPALIVE_MAX_BYTES,
  updateCharacterSheet,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';

/**
 * Статус автосохранения листа: очередь сохранения пишет, индикатор шапки
 * читает. У каждого открытого листа свой.
 *
 * @param sheetKey ключ открытого листа.
 * @returns реактивный статус сохранения.
 */
export function useCharacterSheetSaveStatus(sheetKey: string) {
  return useState<SheetSaveStatus>(
    getSheetStateKey('save-status', sheetKey),
    () => 'saved',
  );
}

/**
 * Версии открытых листов: `sheetId → версия`, с которой идёт правка. Пишет
 * загрузчик (версия из ответа) и автосохранение (новая версия после записи);
 * читает автосохранение — сервер сверяет её и на устаревшую отвечает 409.
 *
 * По листам, а не одна на всё состояние: хвост правок предыдущего листа может
 * уйти уже после того, как открыт следующий, и должен нести свою версию.
 *
 * @returns чтение и запись версии листа.
 */
export function useCharacterSheetVersion() {
  const versions = useState<Record<string, number>>(
    'character-sheet:versions',
    () => ({}),
  );

  /**
   * Версия листа, с которой идёт правка.
   *
   * @param sheetId идентификатор листа.
   * @returns версия; null — неизвестна, сохранение уйдёт без проверки.
   */
  function getSheetVersion(sheetId: string): number | null {
    return versions.value[sheetId] ?? null;
  }

  /**
   * Запоминает версию листа. null (бэк без версий) ничего не меняет.
   *
   * @param sheetId идентификатор листа.
   * @param version версия из ответа сервера.
   */
  function setSheetVersion(sheetId: string, version: number | null): void {
    if (version === null) {
      return;
    }

    versions.value = { ...versions.value, [sheetId]: version };
  }

  return { getSheetVersion, setSheetVersion };
}

/**
 * Версии листов на сервере, известные по отметкам присутствия: `sheetId →
 * версия`. Пишет отметка, читает автосохранение: если версия новее своей,
 * лист сохранил кто-то ещё, и его правки подтягиваются слиянием, не
 * дожидаясь своего сохранения.
 *
 * По листам: открытых листов может быть несколько, и отметка одного не
 * должна затирать версию другого.
 *
 * @returns чтение и запись версии листа на сервере.
 */
export function useCharacterSheetRemoteVersion() {
  const remoteVersions = useState<Record<string, number>>(
    'character-sheet:remote-versions',
    () => ({}),
  );

  /**
   * Версия листа на сервере.
   *
   * @param sheetId идентификатор листа.
   * @returns версия; undefined — отметок ещё не было.
   */
  function getRemoteVersion(sheetId: string): number | undefined {
    return remoteVersions.value[sheetId];
  }

  /**
   * Запоминает версию листа на сервере.
   *
   * @param sheetId идентификатор листа.
   * @param version версия из ответа отметки присутствия.
   */
  function setRemoteVersion(sheetId: string, version: number): void {
    if (remoteVersions.value[sheetId] !== version) {
      remoteVersions.value = { ...remoteVersions.value, [sheetId]: version };
    }
  }

  return { getRemoteVersion, setRemoteVersion };
}

/** Очередь сохранения листа и сколько мест её сейчас держат. */
interface SaveQueueEntry {
  queue: SheetSaveQueue;
  holders: number;
}

/**
 * Очереди сохранения открытых листов. Один лист может стоять сразу в панели
 * списка и в дровере: очередь у него одна, поэтому правка уходит одним
 * запросом, кто бы из наблюдателей её ни заметил. У разных листов очереди
 * разные — сохранение одного не задерживает и не затирает другой.
 *
 * На сервере код не выполняется (см. гард в композабле), поэтому состояние
 * строго клиентское.
 */
const saveQueues = new Map<string, SaveQueueEntry>();

/**
 * Автосохранение листа персонажа: правки уходят на бэк с паузой, статус
 * («Сохранение…»/«Сохранено»/ошибка) — в состоянии листа для индикатора
 * шапки. Чужой лист на просмотр не сохраняется: ручек записи в него нет.
 *
 * Наблюдение за листом не глубокое: все экшены `useCharacterSheet` заменяют
 * `character.value` новым объектом целиком. Цикл «watch → PUT» не возникает:
 * сохранение не пишет в `character`, а повторное срабатывание с тем же JSON
 * отсеивается сравнением с базой последнего сохранённого состояния.
 *
 * Побочные действия: запросы к серверу, слушатель `beforeunload`; при уходе
 * со страницы и при закрытии листа хвост правок досылается.
 *
 * @param sheetKey ключ открытого листа.
 * @returns статус сохранения и повтор после ошибки.
 */
export function useCharacterSheetAutosave(sheetKey: string) {
  const { character, isReadonly, loadCharacter } = useCharacterSheet(sheetKey);

  const saveStatus = useCharacterSheetSaveStatus(sheetKey);

  const { getSheetVersion, setSheetVersion } = useCharacterSheetVersion();

  const { getRemoteVersion } = useCharacterSheetRemoteVersion();

  const { source, id: sheetId } = parseSheetKey(sheetKey);

  // Во время SSR правок не бывает (загрузка листа и редактирование — только
  // на клиенте), а очереди не должны делиться между запросами. Лист по
  // ссылке не правится вовсе
  if (import.meta.server || source === 'shared') {
    return { saveStatus, retry: () => undefined };
  }

  /** Очередь листа: общая для всех мест, где он открыт. */
  function acquireQueue(): SheetSaveQueue {
    const existing = saveQueues.get(sheetKey);

    if (existing) {
      existing.holders += 1;

      return existing.queue;
    }

    const created = createSheetSaveQueue(sheetId, {
      save: (data, version, options) =>
        updateCharacterSheet(sheetId, data, version, options),
      fetch: () => fetchCharacterSheet(sheetId),
      merge: mergeCharacterSheets,
      isConflict: (error) => getFetchStatus(error) === StatusCodes.CONFLICT,
      getVersion: () => getSheetVersion(sheetId),
      setVersion: (version) => setSheetVersion(sheetId, version),
      onStatus: (status) => {
        saveStatus.value = status;
      },
      onDocument: loadCharacter,
    });

    saveQueues.set(sheetKey, { queue: created, holders: 1 });

    return created;
  }

  const queue = acquireQueue();

  /** Повтор отправки после ошибки сохранения — вручную, из шапки листа. */
  function retry(): void {
    queue.retry();
  }

  watch(character, (next) => {
    // Лист открыт администратором на просмотр: правок в нём быть не должно,
    // а писать в чужой лист нельзя
    if (!isReadonly.value) {
      queue.track(next);
    }
  });

  // Лист сохранил кто-то ещё — подтягиваем его правки сразу, а не при своём
  // сохранении. Цикла нет: слияние пишет версию и документ, но не отметку.
  watch(
    () => getRemoteVersion(sheetId),
    (remoteVersion) => {
      if (remoteVersion !== undefined) {
        void queue.syncRemote(remoteVersion);
      }
    },
  );

  onScopeDispose(() => {
    const entry = saveQueues.get(sheetKey);

    if (!entry) {
      return;
    }

    entry.holders -= 1;

    // Уход одного из мест не должен терять хвост паузы
    if (entry.holders > 0) {
      void queue.flush();

      return;
    }

    // Лист закрыли везде: хвост досылается, а следующее открытие начнёт с
    // нового документа. Очередь с недосланным остаётся до следующего раза
    queue.detach();

    if (!queue.hasPending() && !queue.isSaving()) {
      saveQueues.delete(sheetKey);
    }
  });

  // Вкладку свернули, ушли в другое приложение или перешли на другую страницу:
  // страница ещё жива, и хвост правок уходит обычным запросом, не дожидаясь
  // паузы. На мобильных это единственный надёжный сигнал ухода —
  // `beforeunload` там может не сработать вовсе.
  const visibility = useDocumentVisibility();

  watch(visibility, (state) => {
    if (state === 'hidden') {
      void queue.flush();
    }
  });

  // Закрытие вкладки: на обычный запрос времени нет, keepalive даёт браузеру
  // дослать PUT уже после закрытия страницы.
  useEventListener('beforeunload', (event) => {
    if (!queue.hasPending() || queue.isSaving()) {
      return;
    }

    if (queue.getPendingBytes() <= SHEET_KEEPALIVE_MAX_BYTES) {
      void queue.flush({ keepalive: true });

      return;
    }

    // Тело больше квоты keepalive: браузер отклонит такой запрос целиком, а
    // отказ придёт уже некому — правка пропала бы молча, и лист откатился бы к
    // прошлому сохранению. Поэтому шлём обычным запросом (успеет — хорошо) и
    // спрашиваем подтверждение ухода: секунды диалога хватает, чтобы запрос
    // дошёл, а если игрок останется — сохранит пауза.
    void queue.flush();

    event.preventDefault();
  });

  return {
    saveStatus,
    retry,
  };
}
