import type { MaybeRefOrGetter } from 'vue';

import { toValue } from 'vue';

import { getFetchStatus } from '~initiative/model';

import { fetchCharacterSheet, fetchSharedCharacterSheet } from '../model';
import { useCharacterSheet } from './useCharacterSheet';
import { useCharacterSheetShare } from './useCharacterSheetShare';

/** Статус загрузки листа: idle — лист не выбран (пустой идентификатор). */
export type SheetLoadStatus =
  | 'idle'
  | 'pending'
  | 'ready'
  | 'notFound'
  | 'error';

/** Настройки загрузчика листа. */
export interface SheetLoaderOptions {
  /**
   * Лист открыт по ссылке «поделиться»: грузится публичной ручкой по токену,
   * а состояние переводится в режим просмотра. Идентификатор в этом случае —
   * токен ссылки, а не id листа.
   *
   * Реактивный: правая панель списка показывает то свой лист, то чужой по
   * ссылке, не перемонтируясь, — режим должен переключаться вместе с выбором.
   */
  shared?: MaybeRefOrGetter<boolean>;
}

/**
 * Загрузка сохранённого листа в общее состояние `useCharacterSheet` по
 * идентификатору. Используется страницей листа, панелью широкого режима и
 * дровером. При размонтировании хозяина состояние сбрасывается, чтобы
 * следующий открытый лист не мигал данными предыдущего.
 *
 * @param sheetId идентификатор листа (реактивный для панели `?detail=`) либо
 *   токен ссылки при `options.shared`.
 * @param options режим загрузки; по умолчанию — свой лист.
 * @returns статус загрузки и ручной перезапуск.
 */
export function useCharacterSheetLoader(
  sheetId: MaybeRefOrGetter<string>,
  options: SheetLoaderOptions = {},
) {
  const { loadCharacter, resetCharacter, setReadonly } = useCharacterSheet();
  const { setShareToken, setViewedShareToken } = useCharacterSheetShare();

  const isShared = computed(() => toValue(options.shared ?? false));

  const status = ref<SheetLoadStatus>('idle');

  // Режим просмотра включается до первого рендера тела листа, иначе шапка
  // успеет показать чужому зрителю замок и меню владельца.
  setReadonly(isShared.value);

  /**
   * Ответ пришёл к уже неактуальному выбору: пока грузили, панель переключилась
   * на другой лист или сменила режим (свой ↔ по ссылке).
   *
   * @param requestedSheetId идентификатор (или токен) на момент запроса.
   * @param requestedShared режим на момент запроса.
   * @returns true, если ответ применять не нужно.
   */
  function isStaleResponse(
    requestedSheetId: string,
    requestedShared: boolean,
  ): boolean {
    return (
      toValue(sheetId) !== requestedSheetId
      || isShared.value !== requestedShared
    );
  }

  /** Загружает лист; пустой идентификатор переводит в `idle` без запроса. */
  async function load(): Promise<void> {
    const currentSheetId = toValue(sheetId);
    const currentShared = isShared.value;

    // Режим фиксируется до запроса: панель могла переключиться со своего листа
    // на чужой, и тело листа не должно успеть показать владельческие действия.
    setReadonly(currentShared);

    if (!currentSheetId) {
      status.value = 'idle';

      return;
    }

    status.value = 'pending';

    try {
      const detail = currentShared
        ? await fetchSharedCharacterSheet(currentSheetId)
        : await fetchCharacterSheet(currentSheetId);

      // Пока грузили, могли выбрать другой лист — устаревший ответ не применяем.
      if (isStaleResponse(currentSheetId, currentShared)) {
        return;
      }

      loadCharacter(detail.data);
      // У листа по ссылке токена в ответе нет: управление доступом — только у владельца.
      setShareToken(detail.id, detail.shareToken);
      // Зато известен токен, по которому лист открыт, — им меню сохраняет его к себе.
      setViewedShareToken(currentShared ? currentSheetId : null);
      status.value = 'ready';
    } catch (error) {
      if (isStaleResponse(currentSheetId, currentShared)) {
        return;
      }

      const fetchStatus = getFetchStatus(error);

      // Чужой лист бэк отдаёт как 403 — для пользователя это «не найден».
      status.value =
        fetchStatus === 404 || fetchStatus === 403 ? 'notFound' : 'error';
    }
  }

  onMounted(() => {
    void load();
  });

  // Панель широкого режима: смена выбранного листа (или режима — со своего на
  // чужой по ссылке) перезагружает документ.
  watch([() => toValue(sheetId), isShared], () => {
    void load();
  });

  onScopeDispose(() => {
    resetCharacter();
    setShareToken(null, null);
    setViewedShareToken(null);
    // Режим просмотра снимается вместе со страницей: состояние общее, и
    // следующий свой лист иначе открылся бы нередактируемым.
    setReadonly(false);
  });

  return {
    status,
    load,
  };
}
