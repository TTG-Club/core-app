import {
  CHARACTER_SHEET_SHARED_ROUTE,
  getSheetErrorMessage,
  revokeCharacterSheetShare,
  shareCharacterSheet,
  SHEET_SHARE_ERROR_TITLE,
} from '../model';

/**
 * Доступ к открытому листу по ссылке: выпуск и отзыв токена. Токен живёт в общем
 * состоянии рядом с самим листом — его кладёт туда загрузчик, а меню и модалка
 * читают, чтобы не ходить на бэк ради «расшарен ли лист».
 *
 * @returns токен ссылки, готовый адрес и операции включения/отзыва доступа.
 */
export function useCharacterSheetShare() {
  const toast = useToast();

  const shareToken = useState<string | null>(
    'character-sheet:share-token',
    () => null,
  );

  const isPending = ref(false);

  const isShared = computed(() => shareToken.value !== null);

  // Абсолютный адрес нужен для копирования и Web Share API. Origin берётся тем же
  // `getOrigin`, что и ссылки «поделиться» у разделов справочника.
  const shareUrl = computed(() =>
    shareToken.value
      ? `${getOrigin()}${CHARACTER_SHEET_SHARED_ROUTE}/${shareToken.value}`
      : null,
  );

  /**
   * Кладёт токен листа в общее состояние (загрузка листа, сброс при закрытии).
   *
   * @param token токен из ответа API; null — доступ по ссылке выключен.
   */
  function setShareToken(token: string | null): void {
    shareToken.value = token;
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
      shareToken.value = await shareCharacterSheet(sheetId);

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

      shareToken.value = null;

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
    isShared,
    shareUrl,
    isPending,
    setShareToken,
    enableShare,
    disableShare,
  };
}
