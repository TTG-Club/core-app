import type { SheetEditor, SheetEditorList } from '../model';

import {
  approveSheetEditor,
  fetchSheetEditors,
  getSheetErrorMessage,
  removeSheetEditor,
  SHEET_EDITORS_ERROR_TITLE,
} from '../model';
import { useCharacterSheetEditRequests } from './useCharacterSheetEditRequests';

/**
 * Запросы на редактирование и выданные права одного листа — для его владельца:
 * баннер с запросами в листе и список редакторов в модалке «Поделиться».
 *
 * Состояние общее (`useState`) и, как токен ссылки, помнит, КАКОМУ листу
 * принадлежит: модалку открывают и из шапки открытого листа, и из карточки
 * соседнего в списке. После каждого решения перечитывается сводка у шлема —
 * иначе точка горела бы до следующего опроса.
 *
 * @returns запросы и редакторы листа и операции над ними.
 */
export function useCharacterSheetEditors() {
  const toast = useToast();

  const { refresh: refreshIncoming } = useCharacterSheetEditRequests();

  const editorsSheetId = useState<string | null>(
    'character-sheet:editors-sheet-id',
    () => null,
  );

  const editorList = useState<SheetEditorList | null>(
    'character-sheet:editors',
    () => null,
  );

  const isPending = ref(false);

  /**
   * Запросы и права листа. Про листы, о которых состояние ничего не знает,
   * список пуст: чужие записи нельзя показать как свои.
   *
   * @param sheetId идентификатор листа.
   * @returns записи листа, старые первее.
   */
  function getEditors(sheetId: string): SheetEditor[] {
    return editorsSheetId.value === sheetId && editorList.value
      ? editorList.value.editors
      : [];
  }

  /**
   * Неотвеченные запросы листа.
   *
   * @param sheetId идентификатор листа.
   * @returns запросы, ждущие решения владельца.
   */
  function getPendingRequests(sheetId: string): SheetEditor[] {
    return getEditors(sheetId).filter((editor) => editor.status === 'PENDING');
  }

  /**
   * Пользователи, которым правки уже разрешены.
   *
   * @param sheetId идентификатор листа.
   * @returns выданные права.
   */
  function getApprovedEditors(sheetId: string): SheetEditor[] {
    return getEditors(sheetId).filter((editor) => editor.status === 'APPROVED');
  }

  /**
   * Остались ли места для новых редакторов листа.
   *
   * @param sheetId идентификатор листа.
   * @returns true, если лимит редакторов не исчерпан.
   */
  function canApproveMore(sheetId: string): boolean {
    return (
      editorsSheetId.value === sheetId
      && editorList.value !== null
      && getApprovedEditors(sheetId).length < editorList.value.limit
    );
  }

  /**
   * Кладёт ответ сервера в общее состояние.
   *
   * @param sheetId идентификатор листа.
   * @param list запросы и редакторы листа; null — состояние сбрасывается.
   */
  function setEditors(sheetId: string | null, list: SheetEditorList | null) {
    editorsSheetId.value = sheetId;
    editorList.value = sheetId ? list : null;
  }

  /**
   * Показывает тост с ошибкой (текст берётся из ответа бэка).
   *
   * @param error пойманная ошибка.
   */
  function notifyError(error: unknown): void {
    toast.add({
      title: SHEET_EDITORS_ERROR_TITLE,
      description: getSheetErrorMessage(error),
      color: 'error',
      icon: 'tabler:alert-triangle',
    });
  }

  /**
   * Загружает запросы и редакторы листа. Ошибку не показывает: баннер и список
   * необязательны, а лист без них работает как прежде.
   *
   * @param sheetId идентификатор листа.
   */
  async function load(sheetId: string): Promise<void> {
    try {
      const list = await fetchSheetEditors(sheetId);

      setEditors(sheetId, list);
    } catch {
      setEditors(sheetId, null);
    }
  }

  /**
   * Применяет решение владельца и перечитывает сводку у шлема.
   *
   * @param sheetId идентификатор листа.
   * @param decide запрос решения к серверу.
   * @returns true, если решение принято.
   */
  async function applyDecision(
    sheetId: string,
    decide: () => Promise<SheetEditorList>,
  ): Promise<boolean> {
    isPending.value = true;

    try {
      setEditors(sheetId, await decide());
      void refreshIncoming();

      return true;
    } catch (error) {
      notifyError(error);

      return false;
    } finally {
      isPending.value = false;
    }
  }

  /**
   * Разрешает редактирование по запросу.
   *
   * @param sheetId идентификатор листа.
   * @param editorId идентификатор запроса.
   * @returns true, если право выдано.
   */
  function approve(sheetId: string, editorId: string): Promise<boolean> {
    return applyDecision(sheetId, () => approveSheetEditor(sheetId, editorId));
  }

  /**
   * Отклоняет запрос или отзывает выданное право.
   *
   * @param sheetId идентификатор листа.
   * @param editorId идентификатор запроса или права.
   * @returns true, если запись снята.
   */
  function remove(sheetId: string, editorId: string): Promise<boolean> {
    return applyDecision(sheetId, () => removeSheetEditor(sheetId, editorId));
  }

  return {
    isPending,
    getPendingRequests,
    getApprovedEditors,
    canApproveMore,
    setEditors,
    load,
    approve,
    remove,
  };
}
