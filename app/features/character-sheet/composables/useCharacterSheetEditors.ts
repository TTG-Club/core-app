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
 * Номер последнего запроса списка редакторов по каждому листу: по нему
 * отбрасывается ответ, который пришёл позже более свежего. Листы открываются
 * только на клиенте, поэтому между запросами сервера счётчик не делится.
 */
const latestLoadRequests = new Map<string, number>();

/**
 * Запросы на редактирование и выданные права одного листа — для его владельца:
 * баннер с запросами в листе и список редакторов в модалке «Поделиться».
 *
 * Состояние общее (`useState`) и, как токены ссылок, разложено по листам:
 * модалку открывают и из шапки открытого листа, и из карточки соседнего в
 * списке, а открытых листов может быть несколько. После каждого решения перечитывается сводка у шлема —
 * иначе точка горела бы до следующего опроса.
 *
 * @returns запросы и редакторы листа и операции над ними.
 */
export function useCharacterSheetEditors() {
  const toast = useToast();

  const { refresh: refreshIncoming } = useCharacterSheetEditRequests();

  // По листам: открытых листов может быть несколько, и запросы одного нельзя
  // показать у другого
  const editorLists = useState<Record<string, SheetEditorList | null>>(
    'character-sheet:editor-lists',
    () => ({}),
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
    return editorLists.value[sheetId]?.editors ?? [];
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
    const list = editorLists.value[sheetId];

    return list ? getApprovedEditors(sheetId).length < list.limit : false;
  }

  /**
   * Кладёт ответ сервера в общее состояние.
   *
   * @param sheetId идентификатор листа.
   * @param list запросы и редакторы листа; null — о листе ничего не известно.
   */
  function setEditors(sheetId: string, list: SheetEditorList | null): void {
    editorLists.value = { ...editorLists.value, [sheetId]: list };
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
    const requestId = (latestLoadRequests.get(sheetId) ?? 0) + 1;

    latestLoadRequests.set(sheetId, requestId);

    try {
      const list = await fetchSheetEditors(sheetId);

      // Список перечитывают и баннер, и модалка доступа: запоздавший ответ
      // раннего запроса не должен затереть более свежий
      if (latestLoadRequests.get(sheetId) === requestId) {
        setEditors(sheetId, list);
      }
    } catch {
      if (latestLoadRequests.get(sheetId) === requestId) {
        setEditors(sheetId, null);
      }
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
