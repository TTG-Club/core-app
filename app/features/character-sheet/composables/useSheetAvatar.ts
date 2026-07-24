import { SHEET_AVATAR_MAX_SIZE, SHEET_AVATAR_S3_SECTION } from '../model';
import { useCharacterSheet } from './useCharacterSheet';

/**
 * Изображение персонажа: загрузка, замена и удаление файла в хранилище.
 * Ссылка живёт в документе листа, поэтому сохраняет её автосохранение листа.
 *
 * @returns ссылка на изображение, флаг загрузки и операции с картинкой.
 */
export function useSheetAvatar() {
  const { character, ensureEditable, setAvatar } = useCharacterSheet();

  const { isUploading, uploadImage, removeImage } = useImageUpload({
    section: SHEET_AVATAR_S3_SECTION,
    maxSize: SHEET_AVATAR_MAX_SIZE,
  });

  const avatarUrl = computed(() => character.value.avatarUrl);

  /**
   * Загрузка изображения персонажа. Прежний файл стирается из хранилища только
   * после успешной загрузки нового — при сбое картинка на листе остаётся.
   *
   * @param file выбранный файл.
   */
  async function replaceAvatar(file: File): Promise<void> {
    if (!ensureEditable()) {
      return;
    }

    const previousUrl = avatarUrl.value;
    const uploadedUrl = await uploadImage(file);

    if (!uploadedUrl) {
      return;
    }

    setAvatar(uploadedUrl);

    if (previousUrl && previousUrl !== uploadedUrl) {
      await removeImage(previousUrl);
    }
  }

  /** Удаление изображения: ссылка уходит из листа, файл — из хранилища. */
  async function clearAvatar(): Promise<void> {
    if (!ensureEditable()) {
      return;
    }

    const previousUrl = avatarUrl.value;

    if (!previousUrl) {
      return;
    }

    setAvatar(null);

    await removeImage(previousUrl);
  }

  return {
    avatarUrl,
    isUploading,
    replaceAvatar,
    clearAvatar,
  };
}
