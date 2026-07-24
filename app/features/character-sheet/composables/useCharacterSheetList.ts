import type {
  Character,
  CharacterSheetDetail,
  CharacterSheetListItem,
} from '../model';

import {
  createCharacterSheet,
  DEFAULT_CHARACTER,
  deleteCharacterSheet,
  DRAFT_CHARACTER_ID,
  fetchCharacterSheetList,
  getSheetErrorMessage,
  restoreCharacterSheet,
  SHEET_COPY_LIMIT_HINT,
  SHEET_COPY_NAME_SUFFIX,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';

/**
 * Исходное имя персонажа без следов прошлого копирования: `Гимли (копия) 3`
 * даёт `Гимли`. Имя, которое просто заканчивается числом (`Гимли 3`), остаётся
 * нетронутым — номер снимается только вместе с суффиксом копии.
 *
 * @param name имя копируемого персонажа.
 * @returns имя без суффикса и номера копии.
 */
function getCopyBaseName(name: string): string {
  if (name.endsWith(SHEET_COPY_NAME_SUFFIX)) {
    return name.slice(0, -SHEET_COPY_NAME_SUFFIX.length);
  }

  // Хвост из пробела и цифр — кандидат в номер копии.
  const nameWithoutNumber = name.replace(/ \d+$/, '');

  return nameWithoutNumber.endsWith(SHEET_COPY_NAME_SUFFIX)
    ? nameWithoutNumber.slice(0, -SHEET_COPY_NAME_SUFFIX.length)
    : name;
}

/**
 * Имя копии листа: к имени источника добавляется суффикс. Повторное копирование
 * суффикс не дублирует — к нему добавляется порядковый номер копии.
 *
 * @param name имя исходного персонажа.
 * @param existingNames имена уже существующих активных листов.
 * @returns имя, свободное среди активных листов.
 */
function getCopyName(name: string, existingNames: string[]): string {
  const baseName = getCopyBaseName(name);
  const takenNames = new Set(existingNames);
  const copyName = `${baseName}${SHEET_COPY_NAME_SUFFIX}`;

  if (!takenNames.has(copyName)) {
    return copyName;
  }

  // Номер копии начинается с двойки: первая копия — без номера.
  let copyNumber = 2;

  while (takenNames.has(`${copyName} ${copyNumber}`)) {
    copyNumber += 1;
  }

  return `${copyName} ${copyNumber}`;
}

/**
 * Список листов персонажей пользователя: активные, история удалённых и
 * серверный лимит активных листов (в будущем зависит от подписки, поэтому на
 * клиенте не хардкодится).
 *
 * За один запрос (`includeDeleted=true`) получаем весь набор и делим его на
 * активные и удалённые по флагу `deleted`. Все операции клиентские (страница
 * обёрнута в `<ClientOnly>`), Bearer-токен подставляет серверный прокси из
 * куки.
 *
 * Состояние общее (`useState`): списком пользуется не только страница со
 * списком, но и меню открытого листа (удаление, копия и остаток лимита) — после
 * мутации из шапки список за ней обновляется сам. На сервере композабл не
 * выполняется: оба потребителя внутри `<ClientOnly>`.
 */
export function useCharacterSheetList() {
  const toast = useToast();

  const { character } = useCharacterSheet();

  const sheets = useState<CharacterSheetListItem[]>(
    'character-sheet:list',
    () => [],
  );

  const limit = useState<number>('character-sheet:list-limit', () => 0);

  const isLoaded = useState<boolean>(
    'character-sheet:list-loaded',
    () => false,
  );

  const isLoading = useState<boolean>(
    'character-sheet:list-loading',
    () => false,
  );

  const isMutating = useState<boolean>(
    'character-sheet:list-mutating',
    () => false,
  );

  // В общем состоянии лежит текст ошибки, а не сам объект: `useState`
  // сериализуется в payload, а классы (`FetchError`) в него не переносятся.
  const loadErrorMessage = useState<string | null>(
    'character-sheet:list-error',
    () => null,
  );

  // Правки открытого рядом листа (drawer или широкая панель) сразу отражаются
  // в карточке: общий useState листа — источник истины, совпадающий по id
  // элемент списка патчится локально (на бэк изменения шлёт автосейв). Цикла
  // нет: патч списка в `character` не пишет; после закрытия листа состояние
  // сбрасывается к моку с id `new-character` — он не совпадает ни с одним
  // листом, и патч не срабатывает. Наблюдателей может быть несколько (список и
  // открытый рядом лист) — патч идемпотентен, повтор ничего не меняет.
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
    loadErrorMessage.value = null;

    try {
      const page = await fetchCharacterSheetList(true);

      sheets.value = page.sheets;
      limit.value = page.limit;
      isLoaded.value = true;
    } catch (error) {
      loadErrorMessage.value = getSheetErrorMessage(error);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загружает список один раз — потребителям, которым нужен только остаток
   * лимита (меню открытого листа). Страница списка грузится сама при каждом
   * открытии, поэтому свежесть данных не страдает.
   */
  async function ensureLoaded(): Promise<void> {
    if (isLoaded.value || isLoading.value) {
      return;
    }

    await load();
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
   * Создаёт копию листа и обновляет список. Копируется переданный документ
   * (открытый лист — вместе с несохранёнными правками), идентификатор внутри
   * него сбрасывается к черновику: свой UUID копии выдаст сервер.
   *
   * @param source персонаж исходного листа.
   * @returns созданная копия или null (лимит исчерпан либо ошибка).
   */
  async function duplicate(
    source: Character,
  ): Promise<CharacterSheetDetail | null> {
    if (!canCreate.value) {
      toast.add({
        title: 'Не удалось создать копию листа',
        description: `${SHEET_COPY_LIMIT_HINT} — удалите один, чтобы освободить место.`,
        color: 'warning',
        icon: 'tabler:alert-triangle',
      });

      return null;
    }

    isMutating.value = true;

    try {
      const created = await createCharacterSheet({
        ...source,
        id: DRAFT_CHARACTER_ID,
        name: getCopyName(
          source.name,
          activeSheets.value.map((sheet) => sheet.name),
        ),
      });

      await load();

      return created;
    } catch (error) {
      notifyError(error, 'Не удалось создать копию листа');

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
    loadErrorMessage,

    load,
    ensureLoaded,
    create,
    duplicate,
    remove,
    restore,
  };
}
