import type { ComputedRef, WritableComputedRef } from 'vue';

import type { ListViewColumns, ListViewMode } from '../model';

import {
  LIST_VIEW_MODE_DEFAULT,
  LIST_VIEW_MODE_GRID_COLUMNS,
  LIST_VIEW_MODE_LIST_COLUMNS,
  LIST_VIEW_MODE_STORAGE_KEY,
} from '../model';

interface ListViewModeState {
  viewMode: WritableComputedRef<ListViewMode>;
  columns: ComputedRef<ListViewColumns>;
}

/**
 * Проверяет, что значение из хранилища — известный режим отображения.
 */
function isListViewMode(rawValue: unknown): rawValue is ListViewMode {
  return rawValue === 'grid' || rawValue === 'list';
}

/**
 * Управляет режимом отображения списков разделов: сеткой или одной колонкой.
 *
 * Настройка общая для всех разделов, поэтому хранится под одним ключом без
 * привязки к разделу — в отличие от группировки и сортировки, которые
 * изолированы по `sectionKey`. Количество колонок отдаётся готовым числом,
 * чтобы страницы не дублировали сопоставление режима с сеткой.
 *
 * До монтирования режим всегда считается дефолтным: на сервере `localStorage`
 * недоступен, и разметка собирается с сеткой. Если бы клиент читал сохранённый
 * режим сразу, значение совпало бы с серверным при первом чтении и Vue не
 * перерисовал бы список — сохранённый выбор просто игнорировался бы до
 * следующего изменения.
 */
export const useListViewMode = createSharedComposable((): ListViewModeState => {
  const storedViewMode = useLocalStorage<string>(
    LIST_VIEW_MODE_STORAGE_KEY,
    LIST_VIEW_MODE_DEFAULT,
  );

  const isMounted = useMounted();

  const viewMode = computed<ListViewMode>({
    get: () => {
      if (!isMounted.value || !isListViewMode(storedViewMode.value)) {
        return LIST_VIEW_MODE_DEFAULT;
      }

      return storedViewMode.value;
    },
    set: (value) => {
      storedViewMode.value = value;
    },
  });

  const columns = computed<ListViewColumns>(() =>
    viewMode.value === 'list'
      ? LIST_VIEW_MODE_LIST_COLUMNS
      : LIST_VIEW_MODE_GRID_COLUMNS,
  );

  return {
    viewMode,
    columns,
  };
});
