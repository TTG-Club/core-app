import type { SavedCharacterSheet } from '../model';

import {
  deleteSavedCharacterSheet,
  fetchSavedCharacterSheets,
  getSheetErrorMessage,
  SAVED_SHEETS_TITLE,
  saveSharedCharacterSheet,
  SHEET_SAVE_LINK_ERROR_TITLE,
  SHEET_SAVE_LINK_REMOVE_ERROR_TITLE,
  SHEET_SAVE_LINK_SUCCESS_TITLE,
} from '../model';

/**
 * Чужие листы, сохранённые по ссылке: раздел «Другие листы» в списке персонажей.
 * Хранится сама ссылка, а не копия документа — лист остаётся у владельца и
 * доступен только на чтение, пока он не отозвал доступ.
 *
 * Состояние общее (`useState`): списком пользуется и раздел на странице листов,
 * и панель сохранения на странице листа по ссылке — ей нужны остаток лимита и
 * ответ на вопрос «этот лист уже сохранён?». Все операции клиентские: оба
 * потребителя внутри `<ClientOnly>`.
 *
 * @returns сохранённые листы, лимит и операции над ними.
 */
export function useCharacterSheetSaved() {
  const toast = useToast();

  const savedSheets = useState<SavedCharacterSheet[]>(
    'character-sheet:saved',
    () => [],
  );

  const limit = useState<number>('character-sheet:saved-limit', () => 0);

  // Лимит по подписке приходит всегда: по разнице с выданным видно, предлагать
  // ли подписку (числа на клиенте не хардкодятся) — как у своих листов.
  const subscriberLimit = useState<number>(
    'character-sheet:saved-subscriber-limit',
    () => 0,
  );

  const isLoaded = useState<boolean>(
    'character-sheet:saved-loaded',
    () => false,
  );

  const isLoading = useState<boolean>(
    'character-sheet:saved-loading',
    () => false,
  );

  const isMutating = useState<boolean>(
    'character-sheet:saved-mutating',
    () => false,
  );

  // В общем состоянии текст ошибки, а не сам объект: `useState` сериализуется в
  // payload, а классы (`FetchError`) в него не переносятся.
  const loadErrorMessage = useState<string | null>(
    'character-sheet:saved-error',
    () => null,
  );

  // Недоступные записи слот в лимите занимают: пока пользователь не убрал их
  // сам, сервер считает их наравне с живыми.
  const canSave = computed(() => savedSheets.value.length < limit.value);

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

  /** Загружает сохранённые листы и лимит. */
  async function load(): Promise<void> {
    isLoading.value = true;
    loadErrorMessage.value = null;

    try {
      const page = await fetchSavedCharacterSheets();

      savedSheets.value = page.sheets;
      limit.value = page.limit;
      subscriberLimit.value = page.subscriberLimit;
      isLoaded.value = true;
    } catch (error) {
      loadErrorMessage.value = getSheetErrorMessage(error);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загружает список один раз — потребителям, которым нужен только остаток
   * лимита и признак «уже сохранён» (панель на странице листа по ссылке).
   */
  async function ensureLoaded(): Promise<void> {
    if (isLoaded.value || isLoading.value) {
      return;
    }

    await load();
  }

  /**
   * Сохранён ли лист с этим токеном. Сравнение по токену, а не по листу: на
   * странице по ссылке известен только он.
   *
   * @param shareToken токен ссылки.
   * @returns true, если ссылка уже в списке.
   */
  function isTokenSaved(shareToken: string): boolean {
    return savedSheets.value.some((sheet) => sheet.shareToken === shareToken);
  }

  /**
   * Сохраняет чужой лист по токену ссылки. Отказы (свой лист, лимит, отозванная
   * ссылка) объясняет тостом — их текст присылает сервер.
   *
   * @param shareToken токен ссылки.
   * @returns true, если ссылка сохранена.
   */
  async function save(shareToken: string): Promise<boolean> {
    isMutating.value = true;

    try {
      const saved = await saveSharedCharacterSheet(shareToken);

      await load();

      toast.add({
        title: SHEET_SAVE_LINK_SUCCESS_TITLE,
        description: `«${saved.name}» появился в разделе «${SAVED_SHEETS_TITLE}».`,
        color: 'success',
        icon: 'tabler:bookmark',
      });

      return true;
    } catch (error) {
      notifyError(error, SHEET_SAVE_LINK_ERROR_TITLE);

      return false;
    } finally {
      isMutating.value = false;
    }
  }

  /**
   * Убирает сохранённую ссылку. Сам лист остаётся у владельца.
   *
   * @param savedId идентификатор сохранённой записи.
   * @returns true, если запись убрана.
   */
  async function remove(savedId: string): Promise<boolean> {
    isMutating.value = true;

    try {
      await deleteSavedCharacterSheet(savedId);
      await load();

      return true;
    } catch (error) {
      notifyError(error, SHEET_SAVE_LINK_REMOVE_ERROR_TITLE);

      return false;
    } finally {
      isMutating.value = false;
    }
  }

  return {
    savedSheets,
    limit,
    subscriberLimit,
    canSave,
    canRaiseLimit,
    isLoading,
    isMutating,
    loadErrorMessage,

    load,
    ensureLoaded,
    isTokenSaved,
    save,
    remove,
  };
}
