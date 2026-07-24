import type { Character, SheetSaveStatus } from '../model';

import {
  CHARACTER_SHEET_API_PATH,
  DRAFT_CHARACTER_ID,
  SHEET_SAVE_DEBOUNCE_MS,
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
  const { character } = useCharacterSheet();

  const saveStatus = useCharacterSheetSaveStatus();

  /** Повтор отправки после ошибки сохранения. */
  function retry(): void {
    if (pending) {
      saveStatus.value = 'saving';
      void flush();
    }
  }

  // Во время SSR правок не бывает (загрузка листа и редактирование — только
  // на клиенте), а модульное состояние не должно делиться между запросами.
  if (import.meta.server) {
    return { saveStatus, retry };
  }

  /** Перезапускает дебаунс-таймер отправки накопленных изменений. */
  function restartTimer(): void {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, SHEET_SAVE_DEBOUNCE_MS);
  }

  /**
   * Отправляет накопленные изменения. Ошибка не сбрасывает `pending` — база не
   * двигается, и следующая правка (или `retry`) дошлёт изменения.
   */
  async function flush(): Promise<void> {
    if (isSaving || !pending) {
      return;
    }

    const current = pending;

    isSaving = true;

    try {
      await updateCharacterSheet(current.sheetId, current.data);

      baselineJson = current.json;

      if (pending === current) {
        pending = null;
        saveStatus.value = 'saved';
      } else {
        // За время запроса накопились новые правки — дошлём следующим циклом.
        restartTimer();
      }
    } catch {
      saveStatus.value = 'error';
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
    saveStatus.value = 'saving';
    restartTimer();
  }

  watch(character, scheduleSave);

  onBeforeUnmount(() => {
    // Уход контейнера не должен терять хвост дебаунса. Таймер не трогаем —
    // другие живые экземпляры продолжают им пользоваться.
    void flush();
  });

  // Закрытие вкладки: на обычный запрос времени нет, keepalive даёт браузеру
  // дослать PUT уже после закрытия страницы. `pending` сбрасывается сразу,
  // чтобы соседние экземпляры-слушатели не продублировали запрос.
  useEventListener('beforeunload', () => {
    if (!pending || isSaving) {
      return;
    }

    const current = pending;

    pending = null;

    void $fetch(`${CHARACTER_SHEET_API_PATH}/${current.sheetId}`, {
      method: 'PUT',
      body: { name: current.data.name, data: current.data },
      keepalive: true,
      retry: 0,
    });
  });

  return {
    saveStatus,
    retry,
  };
}
