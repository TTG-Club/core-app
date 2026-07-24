import type { MaybeRefOrGetter } from 'vue';

import { toValue } from 'vue';

import { getFetchStatus } from '~initiative/model';

import { fetchCharacterSheet } from '../model';
import { useCharacterSheet } from './useCharacterSheet';

/** Статус загрузки листа: idle — лист не выбран (пустой идентификатор). */
export type SheetLoadStatus =
  | 'idle'
  | 'pending'
  | 'ready'
  | 'notFound'
  | 'error';

/**
 * Загрузка сохранённого листа в общее состояние `useCharacterSheet` по
 * идентификатору. Используется страницей листа, панелью широкого режима и
 * дровером. При размонтировании хозяина состояние сбрасывается, чтобы
 * следующий открытый лист не мигал данными предыдущего.
 *
 * @param sheetId идентификатор листа (реактивный для панели `?detail=`).
 * @returns статус загрузки и ручной перезапуск.
 */
export function useCharacterSheetLoader(sheetId: MaybeRefOrGetter<string>) {
  const { loadCharacter, resetCharacter } = useCharacterSheet();

  const status = ref<SheetLoadStatus>('idle');

  /** Загружает лист; пустой идентификатор переводит в `idle` без запроса. */
  async function load(): Promise<void> {
    const currentSheetId = toValue(sheetId);

    if (!currentSheetId) {
      status.value = 'idle';

      return;
    }

    status.value = 'pending';

    try {
      const detail = await fetchCharacterSheet(currentSheetId);

      // Пока грузили, могли выбрать другой лист — устаревший ответ не применяем.
      if (toValue(sheetId) !== currentSheetId) {
        return;
      }

      loadCharacter(detail.data);
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
  });

  return {
    status,
    load,
  };
}
