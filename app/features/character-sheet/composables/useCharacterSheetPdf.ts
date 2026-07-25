import type { Character } from '../model';

import {
  downloadCharacterPdf,
  getSheetErrorMessage,
  SHEET_PDF_ERROR_TITLE,
} from '../model';

/**
 * Экспорт листа персонажа в PDF. Состояние локальное, а не общее: экспорт
 * запускают и из шапки открытого листа, и из любой карточки списка — общий флаг
 * показывал бы загрузку сразу во всех меню.
 *
 * @returns признак идущей сборки и запуск экспорта.
 */
export function useCharacterSheetPdf() {
  const toast = useToast();

  const isExporting = ref(false);

  /**
   * Сборка и скачивание PDF. Сборщик грузится динамически, поэтому упасть может
   * и загрузка чанка со шрифтами — причину показываем тостом, иначе клик по
   * пункту меню выглядел бы проигнорированным.
   *
   * @param character персонаж скачиваемого листа.
   */
  async function exportToPdf(character: Character): Promise<void> {
    if (isExporting.value) {
      return;
    }

    isExporting.value = true;

    try {
      await downloadCharacterPdf(character);
    } catch (error) {
      toast.add({
        title: SHEET_PDF_ERROR_TITLE,
        description: getSheetErrorMessage(error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    } finally {
      isExporting.value = false;
    }
  }

  return { isExporting, exportToPdf };
}
