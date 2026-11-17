import type { Character, CharacterSheetDetail, SheetSaveStatus } from './types';

import {
  SHEET_SAVE_DEBOUNCE_MS,
  SHEET_SAVE_RETRY_LIMIT,
  SHEET_SAVE_RETRY_MAX_DELAY_MS,
} from './constants';

/** Настройки одной отправки листа на сервер. */
export interface SheetSaveOptions {
  /**
   * Запрос должен пережить закрытие страницы. Ставится только после проверки
   * размера тела: браузер отклоняет `keepalive` больше квоты, и такой отказ
   * приходит уже некому.
   */
  keepalive?: boolean;
}

/** Чем очередь сохранения пользуется снаружи: сервер, версии и сам лист. */
export interface SheetSaveQueueDeps {
  /**
   * Отправляет документ листа на сервер.
   * @returns новая версия листа; `null` — сервер версий не ведёт
   */
  save: (
    data: Character,
    version: number | null,
    options: SheetSaveOptions,
  ) => Promise<number | null>;

  /** Перечитывает лист с сервера. */
  fetch: () => Promise<CharacterSheetDetail>;

  /** Переносит свои правки на документ, который сервер принял от другого. */
  merge: (base: Character, local: Character, server: Character) => Character;

  /** Отказ сервера — конфликт версий: лист успел сохранить кто-то ещё. */
  isConflict: (error: unknown) => boolean;

  /** Версия листа, с которой идёт правка; `null` — неизвестна. */
  getVersion: () => number | null;

  /** Запоминает версию листа из ответа сервера. */
  setVersion: (version: number | null) => void;

  /** Показывает состояние сохранения в шапке листа. */
  onStatus: (status: SheetSaveStatus) => void;

  /** Кладёт в открытый лист документ, слитый с чужими правками. */
  onDocument: (character: Character) => void;
}

/** Очередь сохранения одного листа. */
export interface SheetSaveQueue {
  /**
   * Сообщает очереди новое состояние листа. Первый документ после открытия
   * листа — исходная точка, его не отправляют; дальнейшие отличия от
   * принятого сервером уходят с паузой.
   */
  track: (next: Character) => void;

  /** Отправляет накопленное сейчас, не дожидаясь паузы. */
  flush: (options?: SheetSaveOptions) => Promise<void>;

  /** Повтор отправки после ошибки — вручную. */
  retry: () => void;

  /** Версия листа на сервере обогнала свою: подтягивает чужие правки. */
  syncRemote: (remoteVersion: number) => Promise<void>;

  /**
   * Лист закрыли везде: хвост правок досылается, а следующий документ
   * (лист откроют снова) станет новой исходной точкой.
   */
  detach: () => void;

  /** Есть правки, ещё не принятые сервером. */
  hasPending: () => boolean;

  /** Идёт отправка. */
  isSaving: () => boolean;

  /** Размер накопленного документа в байтах; без правок — ноль. */
  getPendingBytes: () => number;
}

/** Несохранённое состояние листа, ожидающее отправки. */
interface PendingSave {
  data: Character;
  json: string;

  /**
   * Последний принятый сервером документ, от которого сделаны правки. Нужен
   * слиянию: если лист тем временем сохранил другой редактор, свои правки
   * переносятся на его версию как разница с этой базой.
   */
  base: Character;
}

/** Последнее принятое сервером состояние листа. */
interface SheetBaseline {
  data: Character;
  json: string;
}

/**
 * Пауза перед очередным повтором сохранения: удваивается с каждой неудачей,
 * чтобы упавший бэкенд не получал один и тот же PUT каждые полторы секунды.
 * @param attempt - сколько попыток уже сорвалось
 */
export function getSaveRetryDelay(attempt: number): number {
  return Math.min(
    SHEET_SAVE_DEBOUNCE_MS * 2 ** attempt,
    SHEET_SAVE_RETRY_MAX_DELAY_MS,
  );
}

/**
 * Очередь сохранения одного листа: правки уходят на сервер с паузой, сбой
 * повторяется с растущей задержкой, а конфликт версий разрешается слиянием —
 * свои правки переносятся на документ, который сервер принял от другого.
 *
 * У каждого открытого листа своя очередь: сохранение, повторы и конфликт
 * одного листа не задерживают и не затирают правки другого. Чужие документы
 * очередь не принимает — правка одного листа не может уйти в другой.
 *
 * Побочные действия: запросы к серверу через `deps` и таймеры.
 * @param sheetId - идентификатор листа, который сохраняет очередь
 * @param deps - сервер, версии и сам лист
 */
export function createSheetSaveQueue(
  sheetId: string,
  deps: SheetSaveQueueDeps,
): SheetSaveQueue {
  let baseline: SheetBaseline | null = null;
  let pending: PendingSave | null = null;
  let isSaving = false;

  /** Идёт подтягивание чужих правок: второй запрос его не дублирует. */
  let isSyncing = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  /** Сколько раз подряд отправка уже сорвалась. */
  let retryAttempt = 0;

  /**
   * Перезапускает таймер отправки накопленных изменений.
   * @param delay - пауза до отправки; по умолчанию — пауза после правки
   */
  function restartTimer(delay: number = SHEET_SAVE_DEBOUNCE_MS): void {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, delay);
  }

  /**
   * Планирует повтор после сорвавшейся отправки. Без него правка ждала бы
   * следующего действия игрока, а он уже считает лист сохранённым. После
   * предела попыток очередь остаётся с ошибкой и ждёт следующей правки,
   * ухода со страницы либо явного повтора.
   */
  function scheduleRetry(): void {
    if (retryAttempt >= SHEET_SAVE_RETRY_LIMIT) {
      return;
    }

    const delay = getSaveRetryDelay(retryAttempt);

    retryAttempt += 1;

    restartTimer(delay);
  }

  /**
   * Применяет документ, который сервер принял от другого редактора (или из
   * другой вкладки). Свои несохранённые правки не теряются: они сливаются с
   * ним и уходят следующим сохранением уже от его версии.
   *
   * Цикла «документ → track → отправка» нет: база выставляется в серверный
   * документ до записи в лист, и `track` отсеивает срабатывание сравнением с
   * ней; слитый документ отличается от базы ровно своими правками — их и
   * нужно дослать.
   * @param detail - актуальный лист с сервера
   * @param local - свои правки листа; `null` — их нет
   */
  function applyServerDocument(
    detail: CharacterSheetDetail,
    local: PendingSave | null,
  ): void {
    const serverJson = JSON.stringify(detail.data);
    const isOpen = baseline !== null;

    deps.setVersion(detail.version);

    // Базу закрытого листа не трогаем: её задаст следующее открытие
    if (isOpen) {
      baseline = { data: detail.data, json: serverJson };
    }

    const merged = local
      ? deps.merge(local.base, local.data, detail.data)
      : detail.data;

    const mergedJson = JSON.stringify(merged);

    if (mergedJson === serverJson) {
      pending = null;
      deps.onStatus('saved');
    } else {
      pending = { data: merged, json: mergedJson, base: detail.data };
      restartTimer();
    }

    if (isOpen) {
      deps.onDocument(merged);
    }
  }

  /**
   * Конфликт сохранения: лист успел сохранить кто-то ещё (редактор, другая
   * вкладка, хиты от мастера боя). Актуальный документ загружается, свои
   * правки сливаются с ним и отправляются заново — ничего не пропадает.
   * Сорвалась загрузка — правка остаётся в очереди, повтор попробует снова.
   * @param rejected - отвергнутая отправка
   */
  async function resolveConflict(rejected: PendingSave): Promise<void> {
    retryAttempt = 0;

    try {
      const detail = await deps.fetch();

      // Пока шёл запрос, могли накопиться новые правки — сливаем самые свежие
      applyServerDocument(detail, pending ?? rejected);
    } catch {
      deps.onStatus('error');
      scheduleRetry();
    }
  }

  /**
   * Отправляет накопленные изменения. Ошибка не сбрасывает очередь — база не
   * двигается, и правку дошлёт повтор (или следующая правка, или `retry`).
   * Конфликт версий дослать как есть нельзя — правка сначала сливается с
   * актуальным документом.
   * @param options - настройки отправки
   */
  async function flush(options: SheetSaveOptions = {}): Promise<void> {
    if (isSaving || !pending) {
      return;
    }

    const current = pending;

    isSaving = true;

    try {
      const savedVersion = await deps.save(
        current.data,
        deps.getVersion(),
        options,
      );

      deps.setVersion(savedVersion);

      if (baseline) {
        baseline = { data: current.data, json: current.json };
      }

      retryAttempt = 0;

      if (pending === current) {
        pending = null;
        deps.onStatus('saved');
      } else if (pending) {
        // За время запроса накопились новые правки — дошлём следующим циклом.
        // Их база теперь — только что принятый документ
        pending = { ...pending, base: current.data };
        restartTimer();
      }
    } catch (error) {
      if (deps.isConflict(error)) {
        await resolveConflict(current);

        return;
      }

      deps.onStatus('error');
      scheduleRetry();
    } finally {
      isSaving = false;
    }
  }

  /**
   * Сообщает очереди новое состояние листа.
   * @param next - новое состояние персонажа
   */
  function track(next: Character): void {
    // Документ другого листа (или пустой черновик после закрытия) сюда
    // попасть не должен: сохранять его под этим идентификатором нельзя
    if (next.id !== sheetId) {
      return;
    }

    const json = JSON.stringify(next);

    if (!baseline) {
      // Лист только что открыт: это загрузка документа, фиксируем базу без
      // отправки. Хвост правок прошлого открытия, если он есть, уйдёт сам
      baseline = { data: next, json };

      if (!pending) {
        deps.onStatus('saved');
      }

      return;
    }

    if (json === baseline.json) {
      return;
    }

    pending = {
      data: next,
      json,
      // База серии правок — тот документ, от которого начали править; у новой
      // серии это последнее принятое сервером
      base: pending?.base ?? baseline.data,
    };

    // Новая правка — новая серия попыток: прошлая ошибка могла быть разовой
    retryAttempt = 0;
    deps.onStatus('saving');
    restartTimer();
  }

  /** Повтор отправки после ошибки сохранения — вручную, из шапки листа. */
  function retry(): void {
    if (pending) {
      // Счёт автоматических попыток начинается заново: игрок нажал повтор,
      // увидев ошибку, — с прошлой серии могло измениться и окружение
      retryAttempt = 0;
      deps.onStatus('saving');
      void flush();
    }
  }

  /**
   * Подтягивает чужие правки, когда версия листа на сервере обогнала свою.
   * Пока идёт своё сохранение, ждать незачем: устаревшая версия вернёт
   * конфликт, и то же слияние сделает его разбор.
   * @param remoteVersion - версия листа на сервере
   */
  async function syncRemote(remoteVersion: number): Promise<void> {
    const knownVersion = deps.getVersion();

    if (
      isSaving
      || isSyncing
      || knownVersion === null
      || remoteVersion <= knownVersion
    ) {
      return;
    }

    isSyncing = true;

    try {
      const detail = await deps.fetch();
      const currentVersion = deps.getVersion();

      // За время запроса своё сохранение могло уйти и принести версию новее
      if (
        isSaving
        || detail.version === null
        || (currentVersion !== null && detail.version <= currentVersion)
      ) {
        return;
      }

      applyServerDocument(detail, pending);
    } catch {
      // Не страшно: следующая отметка присутствия или своё сохранение повторят
    } finally {
      isSyncing = false;
    }
  }

  /** Лист закрыли везде: хвост правок досылается, база сбрасывается. */
  function detach(): void {
    baseline = null;

    void flush();
  }

  return {
    track,
    flush,
    retry,
    syncRemote,
    detach,
    hasPending: () => pending !== null,
    isSaving: () => isSaving,
    getPendingBytes: () =>
      // По UTF-8, а не по длине строки: лист написан по-русски, и почти
      // каждый символ занимает два байта
      pending ? new TextEncoder().encode(pending.json).byteLength : 0,
  };
}
