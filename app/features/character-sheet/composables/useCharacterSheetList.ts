import type {
  Character,
  CharacterSettings,
  CharacterSheetDetail,
  CharacterSheetListItem,
} from '../model';

import {
  CHARACTER_SHEET_ROUTE,
  createCharacterSheet,
  DEFAULT_CHARACTER,
  deleteCharacterSheet,
  DRAFT_CHARACTER_ID,
  fetchCharacterSheetList,
  getSheetErrorMessage,
  parseImportedCharacter,
  restoreCharacterSheet,
  SHEET_AVATAR_MAX_SIZE,
  SHEET_AVATAR_S3_SECTION,
  SHEET_COPY_ERROR_TITLE,
  SHEET_COPY_LIMIT_HINT,
  SHEET_COPY_NAME_SUFFIX,
  SHEET_COPY_SUCCESS_TITLE,
  SHEET_IMPORT_ERROR_TITLE,
  SHEET_IMPORT_MAX_WEIGHT,
  SHEET_IMPORT_PARSE_ERROR,
  SHEET_IMPORT_SIZE_ERROR,
  SHEET_IMPORT_SUCCESS_TITLE,
  SHEET_SHARED_COPY_ERROR_TITLE,
  SHEET_SHARED_COPY_SUCCESS_TITLE,
  updateCharacterSheet,
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
 * Разбор персонажа из выбранного JSON-файла. Ни битый JSON, ни посторонний
 * файл наружу ошибкой не выходят — вызывающий код объясняет отказ тостом.
 *
 * @param file файл, выбранный пользователем.
 * @returns персонаж из файла; null — в файле не лист персонажа.
 */
async function readCharacterFromFile(file: File): Promise<Character | null> {
  try {
    const content: unknown = JSON.parse(await file.text());

    return parseImportedCharacter(content);
  } catch {
    return null;
  }
}

/**
 * Список листов персонажей пользователя: активные, история удалённых и
 * серверный лимит активных листов (зависит от действующей подписки, поэтому на
 * клиенте не хардкодится).
 *
 * За один запрос (`includeDeleted=true`) получаем весь набор и делим его на
 * активные и удалённые по флагу `deleted`. Все операции клиентские (страница
 * обёрнута в `<ClientOnly>`), Bearer-токен подставляет серверный прокси из
 * куки.
 *
 * Состояние общее (`useState`): списком пользуется не только страница со
 * списком, но и меню открытого листа (удаление, копия и остаток лимита), и
 * кнопка импорта в шапке раздела — после мутации из любого места список
 * обновляется сам. На сервере композабл не выполняется: все его потребители
 * внутри `<ClientOnly>`.
 */
export function useCharacterSheetList() {
  const toast = useToast();

  const { character, ensureEditable, setSettings } = useCharacterSheet();

  const { copyImage } = useImageUpload({
    section: SHEET_AVATAR_S3_SECTION,
    maxSize: SHEET_AVATAR_MAX_SIZE,
  });

  const sheets = useState<CharacterSheetListItem[]>(
    'character-sheet:list',
    () => [],
  );

  const limit = useState<number>('character-sheet:list-limit', () => 0);

  const historyLimit = useState<number>(
    'character-sheet:list-history-limit',
    () => 0,
  );

  // Лимиты по подписке приходят с сервера всегда, независимо от того, есть ли
  // она у пользователя: по разнице с выданным лимитом и видно, предлагать ли
  // подписку (числа на клиенте не хардкодятся).
  const subscriberLimit = useState<number>(
    'character-sheet:list-subscriber-limit',
    () => 0,
  );

  const subscriberHistoryLimit = useState<number>(
    'character-sheet:list-subscriber-history-limit',
    () => 0,
  );

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

  // Подписку предлагаем, только если она реально поднимет лимит: у подписчика
  // выданный лимит уже равен лимиту подписки, и подсказка ему не нужна.
  const canRaiseLimit = computed(() => subscriberLimit.value > limit.value);

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

  /**
   * Показывает тост об отказе импорта: до запроса на бэк дело не дошло, ошибка
   * в самом файле.
   *
   * @param description причина отказа.
   */
  function notifyImportRejection(description: string): void {
    toast.add({
      title: SHEET_IMPORT_ERROR_TITLE,
      description,
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
      historyLimit.value = page.historyLimit;
      subscriberLimit.value = page.subscriberLimit;
      subscriberHistoryLimit.value = page.subscriberHistoryLimit;
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
   * Проверяет, осталось ли в лимите место под новый лист: в него одинаково
   * упираются и копия, и импорт. Занятый лимит объясняется тостом.
   *
   * @param title заголовок тоста при отказе.
   * @returns true, если лист можно создавать.
   */
  function ensureFreeSlot(title: string): boolean {
    if (canCreate.value) {
      return true;
    }

    toast.add({
      title,
      description: `${SHEET_COPY_LIMIT_HINT} — удалите один, чтобы освободить место.`,
      color: 'warning',
      icon: 'tabler:alert-triangle',
    });

    return false;
  }

  /**
   * Создаёт лист из готового документа — общее тело копии и импорта.
   *
   * Изображение копируется в отдельный файл: иначе два листа ссылались бы на
   * один объект в хранилище и замена картинки в одном стёрла бы её у другого.
   * Не скопировалось (чужой файл при импорте или ссылка мимо хранилища) — лист
   * просто остаётся без изображения. Идентификатор внутри документа
   * сбрасывается к черновику: свой UUID новому листу выдаст сервер.
   *
   * @param source документ-источник.
   * @param options параметры создания.
   * @param options.name имя нового листа.
   * @param options.errorTitle заголовок тоста при ошибке.
   * @returns созданный лист или null.
   */
  async function createSheetFromDocument(
    source: Character,
    options: { name: string; errorTitle: string },
  ): Promise<CharacterSheetDetail | null> {
    isMutating.value = true;

    try {
      const avatarUrl = source.avatarUrl
        ? await copyImage(source.avatarUrl)
        : null;

      const created = await createCharacterSheet({
        ...source,
        id: DRAFT_CHARACTER_ID,
        avatarUrl,
        name: options.name,
      });

      await load();

      return created;
    } catch (error) {
      notifyError(error, options.errorTitle);

      return null;
    } finally {
      isMutating.value = false;
    }
  }

  /**
   * Тост о созданном листе с переходом к нему. Открывать лист сразу не станем —
   * создать его можно из разных мест (карточка списка, шапка открытого листа,
   * импорт из раздела), поэтому переход отдаётся кнопкой в тосте.
   *
   * @param created созданный лист.
   * @param options оформление тоста.
   * @param options.title заголовок тоста.
   * @param options.icon иконка тоста.
   */
  function notifySheetCreated(
    created: CharacterSheetDetail,
    options: { title: string; icon: string },
  ): void {
    toast.add({
      title: options.title,
      description: `«${created.name}» появился в списке ваших персонажей.`,
      color: 'success',
      icon: options.icon,
      actions: [
        {
          label: 'Открыть',
          icon: 'tabler:arrow-up-right',
          variant: 'ghost',
          to: `${CHARACTER_SHEET_ROUTE}/${created.id}`,
        },
      ],
    });
  }

  /**
   * Создаёт копию листа и обновляет список. Копируется переданный документ
   * (открытый лист — вместе с несохранёнными правками).
   *
   * @param source персонаж исходного листа.
   * @returns созданная копия или null (лимит исчерпан либо ошибка).
   */
  async function duplicate(
    source: Character,
  ): Promise<CharacterSheetDetail | null> {
    if (!ensureFreeSlot(SHEET_COPY_ERROR_TITLE)) {
      return null;
    }

    const created = await createSheetFromDocument(source, {
      name: getCopyName(
        source.name,
        activeSheets.value.map((sheet) => sheet.name),
      ),
      errorTitle: SHEET_COPY_ERROR_TITLE,
    });

    if (created) {
      notifySheetCreated(created, {
        title: SHEET_COPY_SUCCESS_TITLE,
        icon: 'tabler:copy-check',
      });
    }

    return created;
  }

  /**
   * Создаёт свой лист из чужого, открытого по ссылке. Имя остаётся как есть, без
   * суффикса «(копия)»: это отдельный персонаж, а не копия своего листа, и
   * называть его копией было бы неверно.
   *
   * @param source персонаж чужого листа.
   * @returns созданный лист или null (лимит исчерпан либо ошибка).
   */
  async function copyShared(
    source: Character,
  ): Promise<CharacterSheetDetail | null> {
    if (!ensureFreeSlot(SHEET_SHARED_COPY_ERROR_TITLE)) {
      return null;
    }

    const created = await createSheetFromDocument(source, {
      name: source.name,
      errorTitle: SHEET_SHARED_COPY_ERROR_TITLE,
    });

    if (created) {
      notifySheetCreated(created, {
        title: SHEET_SHARED_COPY_SUCCESS_TITLE,
        icon: 'tabler:user-plus',
      });
    }

    return created;
  }

  /**
   * Создаёт лист из JSON-файла, скачанного экспортом. Имя из файла остаётся
   * как есть: совпадение с уже существующим листом ничему не мешает, а
   * переименование при импорте выглядело бы потерей данных.
   *
   * @param file выбранный пользователем файл.
   * @returns созданный лист или null (лимит, негодный файл либо ошибка).
   */
  async function importFromFile(
    file: File,
  ): Promise<CharacterSheetDetail | null> {
    if (!ensureFreeSlot(SHEET_IMPORT_ERROR_TITLE)) {
      return null;
    }

    if (file.size > SHEET_IMPORT_MAX_WEIGHT) {
      notifyImportRejection(SHEET_IMPORT_SIZE_ERROR);

      return null;
    }

    const source = await readCharacterFromFile(file);

    if (!source) {
      notifyImportRejection(SHEET_IMPORT_PARSE_ERROR);

      return null;
    }

    const created = await createSheetFromDocument(source, {
      name: source.name,
      errorTitle: SHEET_IMPORT_ERROR_TITLE,
    });

    if (created) {
      notifySheetCreated(created, {
        title: SHEET_IMPORT_SUCCESS_TITLE,
        icon: 'tabler:file-import',
      });
    }

    return created;
  }

  /**
   * Сохраняет настройки листа из списка. Открытый рядом лист (drawer или
   * панель) правится через общее состояние — его допишет автосейв; прямой PUT
   * здесь устроил бы гонку: автосейв перезаписал бы настройки своей копией
   * документа. Остальные листы уходят на бэк сразу.
   *
   * @param target персонаж листа, чьи настройки меняются.
   * @param settings новые настройки листа.
   * @returns удалось ли сохранить.
   */
  async function saveSettings(
    target: Character,
    settings: CharacterSettings,
  ): Promise<boolean> {
    if (character.value.id === target.id) {
      if (!ensureEditable()) {
        return false;
      }

      setSettings(settings);

      return true;
    }

    isMutating.value = true;

    const next: Character = { ...target, settings };

    try {
      await updateCharacterSheet(next.id, next);

      sheets.value = sheets.value.map((sheet) =>
        sheet.id === next.id ? { ...sheet, data: next } : sheet,
      );

      return true;
    } catch (error) {
      notifyError(error, 'Не удалось сохранить настройки листа');

      return false;
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
    historyLimit,
    subscriberLimit,
    subscriberHistoryLimit,
    canCreate,
    canRaiseLimit,
    isLoading,
    isMutating,
    loadErrorMessage,

    load,
    ensureLoaded,
    create,
    duplicate,
    copyShared,
    importFromFile,
    remove,
    restore,
    saveSettings,
  };
}
