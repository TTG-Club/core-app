import {
  CHARACTER_SHEET_SHARED_ROUTE,
  getSheetErrorMessage,
  revokeCharacterSheetShare,
  shareCharacterSheet,
  SHEET_SHARE_ERROR_TITLE,
} from '../model';

/**
 * Доступ к листу по ссылке: выпуск и отзыв токена. Токены лежат в общем
 * состоянии по идентификаторам листов — их кладёт туда загрузчик открытого
 * листа либо карточка списка, а меню и модалка читают, чтобы не ходить на
 * бэк ради «расшарен ли лист».
 *
 * По листам, а не один на всё состояние: модалку открывают и из шапки
 * открытого листа, и из карточки соседнего в списке, а открытых листов может
 * быть несколько — токен одного нельзя выдать за доступ другого.
 *
 * @returns состояние доступа по ссылке и операции его включения/отзыва.
 */
export function useCharacterSheetShare() {
  const toast = useToast();

  const shareTokens = useState<Record<string, string | null>>(
    'character-sheet:share-tokens',
    () => ({}),
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
    return Boolean(shareTokens.value[sheetId]);
  }

  /**
   * Готовый адрес ссылки на лист — для копирования и Web Share API. Origin
   * берётся тем же `getOrigin`, что и ссылки «поделиться» у разделов
   * справочника.
   *
   * @param sheetId идентификатор листа.
   * @returns адрес ссылки; null — доступ выключен либо о листе ничего не известно.
   */
  function getShareUrl(sheetId: string): string | null {
    return getShareUrlByToken(shareTokens.value[sheetId]);
  }

  /**
   * Адрес ссылки по готовому токену — когда токен известен не из общего
   * состояния: из списка листов, сохранённой записи или адреса чужого листа.
   *
   * @param token токен доступа; null — доступ выключен.
   * @returns адрес ссылки либо null.
   */
  function getShareUrlByToken(token: string | null | undefined): string | null {
    return token
      ? `${getOrigin()}${CHARACTER_SHEET_SHARED_ROUTE}/${token}`
      : null;
  }

  /**
   * Запоминает токен листа (загрузка листа, открытие модалки из карточки).
   *
   * @param sheetId идентификатор листа.
   * @param token токен из ответа API; null — доступ по ссылке выключен.
   */
  function setShareToken(sheetId: string, token: string | null): void {
    shareTokens.value = { ...shareTokens.value, [sheetId]: token };
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
    isPending,
    isSheetShared,
    getShareUrl,
    getShareUrlByToken,
    setShareToken,
    enableShare,
    disableShare,
  };
}
