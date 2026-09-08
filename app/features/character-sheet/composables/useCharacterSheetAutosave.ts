import type { Character, SheetSaveStatus } from '../model';

import {
  DRAFT_CHARACTER_ID,
  SHEET_KEEPALIVE_MAX_BYTES,
  SHEET_SAVE_DEBOUNCE_MS,
  SHEET_SAVE_RETRY_LIMIT,
  SHEET_SAVE_RETRY_MAX_DELAY_MS,
  updateCharacterSheet,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';

/** Несохранённое состояние листа, ожидающее отправки. */
interface PendingSave {
  /**
   * Идентификатор листа на момент правки. Фиксируется здесь, а не читается при
   * отправке: пока тикал дебаунс, пользователь мог открыть другой лист или
   * закрыть текущий — хвост правок должен уехать в свой лист.
   */
  sheetId: string;

  data: Character;
  json: string;
}

/**
 * Размер документа листа в байтах. Считается по UTF-8, а не по длине строки:
 * лист написан по-русски, и почти каждый символ занимает два байта — по
 * `length` документ выглядел бы вдвое легче квоты, в которую на самом деле не
 * влезает. Серверный `getStringByteSize` тут не годится: он считает через
 * `Buffer`, которого в браузере нет.
 *
 * @param save очередь на отправку.
 * @returns размер документа в байтах.
 */
function getPendingSaveBytes(save: PendingSave): number {
  return new TextEncoder().encode(save.json).byteLength;
}

/**
 * Пауза перед очередным повтором сохранения: удваивается с каждой неудачей,
 * чтобы упавший бэкенд не получал один и тот же PUT каждые полторы секунды.
 *
 * @param attempt сколько попыток уже сорвалось.
 * @returns пауза в миллисекундах.
 */
function getSaveRetryDelay(attempt: number): number {
  return Math.min(
    SHEET_SAVE_DEBOUNCE_MS * 2 ** attempt,
    SHEET_SAVE_RETRY_MAX_DELAY_MS,
  );
}

/**
 * Общий статус автосохранения листа: автосейв пишет, индикатор шапки читает.
 *
 * @returns реактивный статус сохранения.
 */
export function useCharacterSheetSaveStatus() {
  return useState<SheetSaveStatus>(
    'character-sheet:save-status',
    () => 'saved',
  );
}

/**
 * Состояние автосохранения — на уровне модуля, а не экземпляра композабла.
 * Контейнеры листа (страница, панель списка, drawer из глобального
 * overlay-хоста) живут по разным жизненным циклам, и их экземпляры автосейва
 * дублируются: общая база/очередь/таймер гарантируют, что правка уходит одним
 * PUT, кто бы из живых наблюдателей её ни заметил. На сервере код не
 * выполняется (см. гард в композабле), поэтому состояние строго клиентское.
 */
let baselineJson: string | null = null;
let baselineSheetId: string | null = null;
let pending: PendingSave | null = null;
let isSaving = false;
let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Сколько раз подряд отправка уже сорвалась. Считается здесь же, рядом с
 * очередью: повтор планирует тот экземпляр, который поймал ошибку, а ждёт его
 * общая правка.
 */
let retryAttempt = 0;

/**
 * Автосохранение листа персонажа: правки уходят на бэк с дебаунсом, статус
 * («Сохранение…»/«Сохранено»/ошибка) — в общем состоянии для индикатора шапки.
 *
 * Идентификатор листа берётся из самих данных (`character.id`): у загруженного
 * листа это серверный UUID, у пустого черновика — {@link DRAFT_CHARACTER_ID},
 * который сохранению не подлежит. Контейнер ничего не передаёт — любой живой
 * экземпляр композабла сохраняет правки из любого контекста редактирования.
 *
 * Наблюдение за листом не глубокое: все экшены `useCharacterSheet` заменяют
 * `character.value` новым объектом целиком. Цикл «watch → PUT» не возникает:
 * сохранение не пишет в `character`, а повторное срабатывание с тем же JSON
 * отсеивается сравнением с базой последнего сохранённого состояния.
 *
 * @returns статус сохранения и повтор после ошибки.
 */
export function useCharacterSheetAutosave() {
  const { character, isReadonly } = useCharacterSheet();

  const saveStatus = useCharacterSheetSaveStatus();

  /** Повтор отправки после ошибки сохранения — вручную, из шапки листа. */
  function retry(): void {
    if (pending) {
      // Счёт автоматических попыток начинается заново: игрок нажал повтор,
      // увидев ошибку, — значит с прошлой серии могло измениться и окружение.
      retryAttempt = 0;
      saveStatus.value = 'saving';
      void flush();
    }
  }

  // Во время SSR правок не бывает (загрузка листа и редактирование — только
  // на клиенте), а модульное состояние не должно делиться между запросами.
  if (import.meta.server) {
    return { saveStatus, retry };
  }

  /**
   * Перезапускает таймер отправки накопленных изменений.
   *
   * @param delay пауза до отправки; по умолчанию — дебаунс правок.
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
   * следующего действия игрока: `pending` остаётся в очереди, но отправить его
   * некому — а игрок уже считает лист сохранённым и уходит со страницы.
   *
   * После {@link SHEET_SAVE_RETRY_LIMIT} попыток очередь остаётся с ошибкой и
   * ждёт следующей правки, ухода со страницы либо явного {@link retry} (кнопки
   * повтора в шапке пока нет — индикатор сохранения только показывает
   * состояние).
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
   * Отправляет накопленные изменения. Ошибка не сбрасывает `pending` — база не
   * двигается, и правку дошлёт повтор (или следующая правка, или `retry`).
   *
   * @param options настройки отправки.
   * @param options.keepalive запрос должен пережить закрытие страницы. Ставится
   *   только после проверки размера тела: браузер отклоняет `keepalive` больше
   *   квоты, и такой отказ приходит уже некому.
   */
  async function flush(options: { keepalive?: boolean } = {}): Promise<void> {
    if (isSaving || !pending) {
      return;
    }

    const current = pending;

    isSaving = true;

    try {
      await updateCharacterSheet(current.sheetId, current.data, options);

      baselineJson = current.json;
      retryAttempt = 0;

      if (pending === current) {
        pending = null;
        saveStatus.value = 'saved';
      } else {
        // За время запроса накопились новые правки — дошлём следующим циклом.
        restartTimer();
      }
    } catch {
      saveStatus.value = 'error';
      scheduleRetry();
    } finally {
      isSaving = false;
    }
  }

  /**
   * Планирует сохранение изменившегося листа с дебаунсом.
   *
   * @param next новое состояние персонажа.
   */
  function scheduleSave(next: Character): void {
    // Лист открыт по ссылке: правок в нём быть не должно, а ручек записи по
    // токену на бэке нет. Страховка на случай, если контейнер (дровер чужого
    // листа) подключил автосейв тем же кодом, что и для своего листа.
    if (isReadonly.value) {
      return;
    }

    const currentSheetId = next.id === DRAFT_CHARACTER_ID ? '' : next.id;

    if (!currentSheetId) {
      // Лист закрыт (состояние сброшено к черновику): хвост правок дошлём,
      // база очищается — следующая загрузка листа зафиксирует новую.
      if (pending) {
        void flush();
      }

      baselineSheetId = null;
      baselineJson = null;

      return;
    }

    const json = JSON.stringify(next);

    if (currentSheetId !== baselineSheetId) {
      // Хвост правок предыдущего листа дошлём немедленно, не дожидаясь
      // дебаунса — иначе он потерялся бы при смене базы ниже.
      if (pending && pending.sheetId !== currentSheetId) {
        void flush();
      }

      // Смена листа: это срабатывание — загрузка документа в состояние,
      // фиксируем базу без отправки.
      baselineSheetId = currentSheetId;
      baselineJson = json;
      saveStatus.value = 'saved';

      return;
    }

    if (json === baselineJson) {
      return;
    }

    pending = { sheetId: currentSheetId, data: next, json };
    // Новая правка — новая серия попыток: прошлая ошибка могла быть разовой.
    retryAttempt = 0;
    saveStatus.value = 'saving';
    restartTimer();
  }

  watch(character, scheduleSave);

  onBeforeUnmount(() => {
    // Уход контейнера не должен терять хвост дебаунса. Таймер не трогаем —
    // другие живые экземпляры продолжают им пользоваться.
    void flush();
  });

  // Вкладку свернули, ушли в другое приложение или перешли на другую страницу:
  // страница ещё жива, и хвост правок уходит обычным запросом, не дожидаясь
  // дебаунса. На мобильных это единственный надёжный сигнал ухода —
  // `beforeunload` там может не сработать вовсе.
  const visibility = useDocumentVisibility();

  watch(visibility, (state) => {
    if (state === 'hidden') {
      void flush();
    }
  });

  // Закрытие вкладки: на обычный запрос времени нет, keepalive даёт браузеру
  // дослать PUT уже после закрытия страницы.
  useEventListener('beforeunload', (event) => {
    if (!pending || isSaving) {
      return;
    }

    if (getPendingSaveBytes(pending) <= SHEET_KEEPALIVE_MAX_BYTES) {
      void flush({ keepalive: true });

      return;
    }

    // Тело больше квоты keepalive: браузер отклонит такой запрос целиком, а
    // отказ придёт уже некому — правка пропала бы молча, и лист откатился бы к
    // прошлому сохранению. Поэтому шлём обычным запросом (успеет — хорошо) и
    // спрашиваем подтверждение ухода: секунды диалога хватает, чтобы запрос
    // дошёл, а если игрок останется — сохранит дебаунс.
    void flush();

    event.preventDefault();
  });

  return {
    saveStatus,
    retry,
  };
}
