import type { HomeHeroMedia } from '#shared/types';

import { getHomeHeroMediaKind } from '#shared/utils';
import { useHomeHeroSettings } from '~home/hero';

import {
  getHomeHeroFileError,
  HOME_HERO_ADMIN_API_URL,
  HOME_HERO_INVALID_FILE_TITLE,
  HOME_HERO_PUBLISH_ERROR_TITLE,
  HOME_HERO_PUBLISH_SUCCESS_MESSAGE,
  HOME_HERO_RESET_ERROR_TITLE,
  HOME_HERO_RESET_SUCCESS_MESSAGE,
} from '../model';

/**
 * Редактор фона шапки главной: черновик из выбранного файла, публикация и
 * возврат карты по умолчанию.
 *
 * Черновик живёт только в браузере — локальной `blob:`-ссылкой, по ней его
 * показывает превью. На сервер файл уходит лишь при публикации, поэтому
 * передуманные черновики не оседают в хранилище.
 *
 * Побочный эффект: после публикации и сброса перезапрашивает общую настройку
 * фона (`useHomeHeroSettings`).
 *
 * @returns сохранённый фон, черновик и действия с ними
 */
export function useHomeHeroEditor() {
  const $toast = useToast();
  const { media: savedMedia, refresh } = useHomeHeroSettings();

  const draftFile = shallowRef<File | null>(null);
  const draftUrl = useObjectUrl(draftFile);

  const draftMedia = computed<HomeHeroMedia | null>(() => {
    const kind = draftFile.value
      ? getHomeHeroMediaKind(draftFile.value.type)
      : null;

    return kind && draftUrl.value ? { url: draftUrl.value, kind } : null;
  });

  const isPublishing = ref(false);
  const isResetting = ref(false);

  /**
   * Номер версии сохранённого фона. Растёт после публикации и сброса: адрес
   * превью без черновика не меняется, и фреймам нужен повод перезагрузиться.
   */
  const savedRevision = ref(0);

  /**
   * Выбор файла черновика. Негодный файл не становится черновиком, причина
   * показывается тостом.
   *
   * @param file выбранный файл; пусто — черновик убран
   */
  function selectDraft(file: File | null | undefined): void {
    if (!file) {
      draftFile.value = null;

      return;
    }

    const fileError = getHomeHeroFileError(file);

    if (fileError) {
      draftFile.value = null;

      $toast.add({
        color: 'error',
        title: HOME_HERO_INVALID_FILE_TITLE,
        description: fileError,
      });

      return;
    }

    draftFile.value = file;
  }

  /** Отказ от черновика: превью возвращается к сохранённому фону. */
  function discardDraft(): void {
    draftFile.value = null;
  }

  /** Публикует черновик фоном шапки. */
  async function publish(): Promise<void> {
    const file = draftFile.value;

    if (!file || isPublishing.value) {
      return;
    }

    isPublishing.value = true;

    try {
      const formData = new FormData();

      formData.append('file', file);

      await $fetch(HOME_HERO_ADMIN_API_URL, {
        method: 'PUT',
        body: formData,
      });

      await refresh();

      draftFile.value = null;
      savedRevision.value += 1;

      $toast.add({
        color: 'success',
        title: HOME_HERO_PUBLISH_SUCCESS_MESSAGE,
      });
    } catch (error) {
      consola.error(error);

      $toast.add({
        color: 'error',
        title: HOME_HERO_PUBLISH_ERROR_TITLE,
        description: getUploadErrorMessage(error),
      });
    } finally {
      isPublishing.value = false;
    }
  }

  /**
   * Возвращает шапке карту по умолчанию.
   *
   * @returns `true`, если карта вернулась
   */
  async function reset(): Promise<boolean> {
    if (isResetting.value) {
      return false;
    }

    isResetting.value = true;

    try {
      await $fetch(HOME_HERO_ADMIN_API_URL, { method: 'DELETE' });
      await refresh();

      savedRevision.value += 1;

      $toast.add({ color: 'success', title: HOME_HERO_RESET_SUCCESS_MESSAGE });

      return true;
    } catch (error) {
      consola.error(error);

      $toast.add({
        color: 'error',
        title: HOME_HERO_RESET_ERROR_TITLE,
        description: getUploadErrorMessage(error),
      });

      return false;
    } finally {
      isResetting.value = false;
    }
  }

  // Состояние меняется только методами ниже — наружу оно только для чтения
  return {
    savedMedia,
    savedRevision: readonly(savedRevision),
    draftFile: readonly(draftFile),
    draftMedia,
    isPublishing: readonly(isPublishing),
    isResetting: readonly(isResetting),
    selectDraft,
    discardDraft,
    publish,
    reset,
  };
}
