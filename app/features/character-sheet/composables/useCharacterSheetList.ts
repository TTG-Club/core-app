import type { CharacterSheetDetail, CharacterSheetListItem } from '../model';

import {
  createCharacterSheet,
  DEFAULT_CHARACTER,
  deleteCharacterSheet,
  fetchCharacterSheetList,
  getSheetErrorMessage,
  restoreCharacterSheet,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';

/**
 * Список листов персонажей пользователя: активные, история удалённых и
 * серверный лимит активных листов (в будущем зависит от подписки, поэтому на
 * клиенте не хардкодится).
 *
 * За один запрос (`includeDeleted=true`) получаем весь набор и делим его на
 * активные и удалённые по флагу `deleted`. Все операции клиентские (страница
 * обёрнута в `<ClientOnly>`), Bearer-токен подставляет серверный прокси из
 * куки.
 */
export function useCharacterSheetList() {
  const toast = useToast();

  const { character } = useCharacterSheet();

  const sheets = ref<CharacterSheetListItem[]>([]);
  const limit = ref(0);
  const isLoading = ref(false);
  const isMutating = ref(false);
  const loadError = ref<unknown>(null);

  // Правки открытого рядом листа (drawer или широкая панель) сразу отражаются
  // в карточке: общий useState листа — источник истины, совпадающий по id
  // элемент списка патчится локально (на бэк изменения шлёт автосейв). Цикла
  // нет: патч списка в `character` не пишет; после закрытия листа состояние
  // сбрасывается к моку с id `new-character` — он не совпадает ни с одним
  // листом, и патч не срабатывает.
  watch(character, (next) => {
    if (!sheets.value.some((sheet) => sheet.id === next.id)) {
      return;
    }

    sheets.value = sheets.value.map((sheet) =>
      sheet.id === next.id ? { ...sheet, name: next.name, data: next } : sheet,
    );
  });

  const activeSheets = computed(() =>
    sheets.value.filter((sheet) => !sheet.deleted),
  );

  const deletedSheets = computed(() =>
    sheets.value.filter((sheet) => sheet.deleted),
  );

  const canCreate = computed(() => activeSheets.value.length < limit.value);

  /**
   * Показывает тост с ошибкой (текст берётся из ответа бэка).
   *
   * @param error пойманная ошибка.
   * @param title заголовок тоста.
   */
  function notifyError(error: unknown, title: string): void {
    toast.add({
      title,
      description: getSheetErrorMessage(error),
      color: 'error',
      icon: 'tabler:alert-triangle',
    });
  }

  /** Загружает список листов (включая удалённые для истории) и лимит. */
  async function load(): Promise<void> {
    isLoading.value = true;
    loadError.value = null;

    try {
      const page = await fetchCharacterSheetList(true);

      sheets.value = page.sheets;
      limit.value = page.limit;
    } catch (error) {
      loadError.value = error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Создаёт пустой лист и обновляет список.
   *
   * @returns созданный лист (для перехода к редактированию) или null.
   */
  async function create(): Promise<CharacterSheetDetail | null> {
    isMutating.value = true;

    try {
      const created = await createCharacterSheet(
        structuredClone(DEFAULT_CHARACTER),
      );

      await load();

      return created;
    } catch (error) {
      notifyError(error, 'Не удалось создать лист персонажа');

      return null;
    } finally {
      isMutating.value = false;
    }
  }

  /**
   * Удаляет лист (мягко — уходит в историю) и обновляет список.
   *
   * @param sheetId идентификатор листа.
   */
  async function remove(sheetId: string): Promise<boolean> {
    isMutating.value = true;

    try {
      await deleteCharacterSheet(sheetId);
      await load();

      return true;
    } catch (error) {
      notifyError(error, 'Не удалось удалить лист персонажа');

      return false;
    } finally {
      isMutating.value = false;
    }
  }

  /**
   * Восстанавливает лист из истории удалённых и обновляет список.
   * При заполненном лимите бэк вернёт 400 с текстом — покажем его тостом.
   *
   * @param sheetId идентификатор листа.
   */
  async function restore(sheetId: string): Promise<boolean> {
    isMutating.value = true;

    try {
      await restoreCharacterSheet(sheetId);
      await load();

      return true;
    } catch (error) {
      notifyError(error, 'Не удалось восстановить лист персонажа');

      return false;
    } finally {
      isMutating.value = false;
    }
  }

  return {
    sheets,
    activeSheets,
    deletedSheets,
    limit,
    canCreate,
    isLoading,
    isMutating,
    loadError,

    load,
    create,
    remove,
    restore,
  };
}
