import type { Character } from '../model';

import {
  downloadCharacterPdf,
  getSheetErrorMessage,
  SHEET_PDF_ERROR_TITLE,
  SHEET_PDF_SHARE_ENABLED_DESCRIPTION,
  SHEET_PDF_SHARE_ENABLED_TITLE,
} from '../model';
import { useCharacterSheetShare } from './useCharacterSheetShare';

/** Ссылка для QR-кода в PDF. */
export interface SheetPdfExportOptions {
  /** Готовая ссылка на просмотр листа; null — у листа её пока нет. */
  shareUrl?: string | null;

  /**
   * Лист свой: без ссылки экспорт сам включает доступ по ней, чтобы QR-код
   * в документе было куда вести. Чужому листу доступ не выдаём — это право
   * владельца.
   */
  ensureShare?: boolean;
}

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

  const { enableShare, getShareUrl } = useCharacterSheetShare();

  /**
   * Ссылка для QR-кода: готовая либо, у своего листа без ссылки, только что
   * выпущенная. Не вышло включить доступ — PDF всё равно собирается, просто
   * без кода; причину уже показал тостом `enableShare`.
   *
   * @param character персонаж листа.
   * @param options известная ссылка и право включить доступ.
   * @returns ссылка и признак того, что доступ включён именно сейчас.
   */
  async function resolveShareUrl(
    character: Character,
    options: SheetPdfExportOptions,
  ): Promise<{ url: string | null; isEnabledNow: boolean }> {
    if (options.shareUrl || !options.ensureShare) {
      return { url: options.shareUrl ?? null, isEnabledNow: false };
    }

    if (!(await enableShare(character.id))) {
      return { url: null, isEnabledNow: false };
    }

    toast.add({
      title: SHEET_PDF_SHARE_ENABLED_TITLE,
      description: SHEET_PDF_SHARE_ENABLED_DESCRIPTION,
      color: 'success',
      icon: 'tabler:link',
    });

    return { url: getShareUrl(character.id), isEnabledNow: true };
  }

  /**
   * Сборка и скачивание PDF. Сборщик грузится динамически, поэтому упасть может
   * и загрузка чанка со шрифтами — причину показываем тостом, иначе клик по
   * пункту меню выглядел бы проигнорированным.
   *
   * @param character персонаж скачиваемого листа.
   * @param options ссылка для QR-кода на первой странице.
   * @returns true, если экспорт включил доступ по ссылке — список листов
   * перечитывает токены.
   */
  async function exportToPdf(
    character: Character,
    options: SheetPdfExportOptions = {},
  ): Promise<boolean> {
    if (isExporting.value) {
      return false;
    }

    isExporting.value = true;

    let isShareEnabled = false;

    try {
      const { url, isEnabledNow } = await resolveShareUrl(character, options);

      isShareEnabled = isEnabledNow;

      await downloadCharacterPdf(character, url);
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

    return isShareEnabled;
  }

  return { isExporting, exportToPdf };
}
