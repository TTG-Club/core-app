import {
  CHARACTER_SHEET_SHARED_ROUTE,
  getSheetErrorMessage,
  revokeCharacterSheetShare,
  shareCharacterSheet,
  SHEET_SHARE_ERROR_TITLE,
} from '../model';

/**
 * Доступ к листу по ссылке: выпуск и отзыв токена. Токен живёт в общем
 * состоянии — его кладёт туда загрузчик открытого листа либо карточка списка,
 * а меню и модалка читают, чтобы не ходить на бэк ради «расшарен ли лист».
 *
 * Состояние помнит, КАКОМУ листу принадлежит токен: модалку открывают и из
 * шапки открытого листа, и из карточки соседнего в списке, и без привязки к
 * листу одна из них выдавала бы чужой доступ за свой.
 *
 * @returns состояние доступа по ссылке и операции его включения/отзыва.
 */
export function useCharacterSheetShare() {
  const toast = useToast();

  const shareSheetId = useState<string | null>(
    'character-sheet:share-sheet-id',
    () => null,
  );

  const shareToken = useState<string | null>(
    'character-sheet:share-token',
    () => null,
  );

  // Токен, ПО КОТОРОМУ открыт чужой лист, — не то же самое, что `shareToken`
  // владельца: публичная ручка токена в ответе не отдаёт, а меню действий по
  // нему сохраняет лист к себе. Кладёт его загрузчик, читает тело листа.
  const viewedShareToken = useState<string | null>(
    'character-sheet:viewed-share-token',
    () => null,
  );

  const isPending = ref(false);

  /**
   * Открыт ли доступ по ссылке у этого листа. Про листы, о которых состояние
   * ничего не знает, ответ отрицательный: соврать «ссылка активна» хуже, чем
   * промолчать.
   *
   * @param sheetId идентификатор листа.
   * @returns true, если у листа есть живая ссылка.
   */
  function isSheetShared(sheetId: string): boolean {
    return shareSheetId.value === sheetId && shareToken.value !== null;
  }

  /**
   * Готовый адрес ссылки на лист — для копирования и Web Share API. Origin
   * берётся тем же `getOrigin`, что и ссылки «поделиться» у разделов
   * справочника.
   *
   * @param sheetId идентификатор листа.
   * @returns адрес ссылки; null — доступ выключен либо токен от другого листа.
   */
  function getShareUrl(sheetId: string): string | null {
    return isSheetShared(sheetId)
      ? `${getOrigin()}${CHARACTER_SHEET_SHARED_ROUTE}/${shareToken.value}`
      : null;
  }

  /**
   * Кладёт токен листа в общее состояние (загрузка листа, открытие модалки из
   * карточки, сброс при закрытии).
   *
   * @param sheetId идентификатор листа; null — состояние сбрасывается.
   * @param token токен из ответа API; null — доступ по ссылке выключен.
   */
  function setShareToken(sheetId: string | null, token: string | null): void {
    shareSheetId.value = sheetId;
    shareToken.value = sheetId ? token : null;
  }

  /**
   * Кладёт в общее состояние токен, по которому открыт чужой лист.
   *
   * @param token токен из адреса или сохранённой записи; null — лист свой.
   */
  function setViewedShareToken(token: string | null): void {
    viewedShareToken.value = token;
  }

  /**
   * Включает доступ по ссылке. Повторный вызов безопасен: бэк идемпотентен и
   * возвращает прежний токен, поэтому уже разосланные ссылки не ломаются.
   *
   * @param sheetId идентификатор листа.
   * @returns true, если доступ включён.
   */
  async function enableShare(sheetId: string): Promise<boolean> {
    isPending.value = true;

    try {
      setShareToken(sheetId, await shareCharacterSheet(sheetId));

      return true;
    } catch (error) {
      toast.add({
        title: SHEET_SHARE_ERROR_TITLE,
        description: getSheetErrorMessage(error),
        color: 'error',
        icon: 'tabler:link-off',
      });

      return false;
    } finally {
      isPending.value = false;
    }
  }

  /**
   * Отзывает доступ по ссылке: выданная ранее ссылка перестаёт открываться.
   *
   * @param sheetId идентификатор листа.
   * @returns true, если доступ отозван.
   */
  async function disableShare(sheetId: string): Promise<boolean> {
    isPending.value = true;

    try {
      await revokeCharacterSheetShare(sheetId);

      setShareToken(sheetId, null);

      return true;
    } catch (error) {
      toast.add({
        title: SHEET_SHARE_ERROR_TITLE,
        description: getSheetErrorMessage(error),
        color: 'error',
        icon: 'tabler:link-off',
      });

      return false;
    } finally {
      isPending.value = false;
    }
  }

  return {
    shareToken,
    viewedShareToken,
    isPending,
    isSheetShared,
    getShareUrl,
    setShareToken,
    setViewedShareToken,
    enableShare,
    disableShare,
  };
}
