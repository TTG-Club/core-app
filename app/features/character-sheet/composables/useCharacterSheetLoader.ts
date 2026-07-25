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
   */
  shared?: boolean;
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
  const { setShareToken } = useCharacterSheetShare();

  const isShared = options.shared ?? false;

  const status = ref<SheetLoadStatus>('idle');

  // Режим просмотра включается до первого рендера тела листа, иначе шапка
  // успеет показать чужому зрителю замок и меню владельца.
  setReadonly(isShared);

  /** Загружает лист; пустой идентификатор переводит в `idle` без запроса. */
  async function load(): Promise<void> {
    const currentSheetId = toValue(sheetId);

    if (!currentSheetId) {
      status.value = 'idle';

      return;
    }

    status.value = 'pending';

    try {
      const detail = isShared
        ? await fetchSharedCharacterSheet(currentSheetId)
        : await fetchCharacterSheet(currentSheetId);

      // Пока грузили, могли выбрать другой лист — устаревший ответ не применяем.
      if (toValue(sheetId) !== currentSheetId) {
        return;
      }

      loadCharacter(detail.data);
      // У листа по ссылке токена в ответе нет: управление доступом — только у владельца.
      setShareToken(detail.shareToken);
      status.value = 'ready';
    } catch (error) {
      if (toValue(sheetId) !== currentSheetId) {
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

  // Панель широкого режима: смена выбранного листа перезагружает документ.
  watch(
    () => toValue(sheetId),
    () => {
      void load();
    },
  );

  onScopeDispose(() => {
    resetCharacter();
    setShareToken(null);
    // Режим просмотра снимается вместе со страницей: состояние общее, и
    // следующий свой лист иначе открылся бы нередактируемым.
    setReadonly(false);
  });

  return {
    status,
    load,
  };
}
