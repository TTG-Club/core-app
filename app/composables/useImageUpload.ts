import type { MaybeRefOrGetter } from 'vue';

import bytes from 'bytes';
import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';

import { getStatusMessage } from '#shared/utils';
import { z } from '~/utils/zod';

/** Ответ S3-слоя на загрузку или копирование файла. */
const uploadResponseSchema = z.object({
  filename: z.string(),
  url: z.string().min(1),
});

/** Допустимые типы загружаемых изображений. */
export const IMAGE_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Строка для атрибута `accept` диалога выбора файла. */
export const IMAGE_UPLOAD_ACCEPT = IMAGE_UPLOAD_TYPES.join(', ');

/** Максимальный вес исходного файла. */
const MAX_IMAGE_WEIGHT = bytes('5MB')!;

/** Максимальная длина стороны исходного изображения в пикселях. */
const MAX_IMAGE_SIDE = 2048;

const UPLOAD_ERROR_TITLE = 'Ошибка при загрузке файла';
const UNKNOWN_ERROR_MESSAGE = 'Неизвестная ошибка';

/** Параметры загрузки: раздел и ограничение размера. */
interface ImageUploadOptions {
  /** Раздел S3 — первый сегмент ключа объекта. */
  section: MaybeRefOrGetter<string>;

  /** Максимальная длина короткой стороны, до которой сервер сожмёт картинку. */
  maxSize?: MaybeRefOrGetter<string | number | undefined>;
}

/**
 * Перевод бинарных данных файла в base64 для подстановки в `img.src`.
 *
 * @param buffer содержимое файла.
 * @returns строка base64.
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const chunks = [];
  const bytesView = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytesView.length; i += chunkSize) {
    const chunk = bytesView.subarray(
      i,
      Math.min(i + chunkSize, bytesView.length),
    );

    chunks.push(String.fromCharCode(...chunk));
  }

  return btoa(chunks.join(''));
}

/**
 * Размеры изображения в пикселях — читаются в браузере до отправки на сервер.
 *
 * @param file выбранный файл.
 * @returns ширина и высота изображения.
 */
function getImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error(UNKNOWN_ERROR_MESSAGE));

    reader.onload = () => {
      const image = new Image();

      if (!reader.result) {
        reject(new Error(UNKNOWN_ERROR_MESSAGE));

        return;
      }

      image.onerror = () => reject(new Error(UNKNOWN_ERROR_MESSAGE));

      image.onload = () => {
        if (!image.width || !image.height) {
          reject(new Error(UNKNOWN_ERROR_MESSAGE));

          return;
        }

        resolve({ width: image.width, height: image.height });
      };

      image.src =
        reader.result instanceof ArrayBuffer
          ? bufferToBase64(reader.result)
          : reader.result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Человекочитаемое сообщение об ошибке запроса к S3-слою. Сервер присылает
 * русский текст в `message` — показываем его, иначе сообщение по коду ответа.
 *
 * @param error пойманная ошибка.
 * @returns текст для тоста.
 */
function getUploadErrorMessage(error: unknown): string {
  if (!(error instanceof FetchError)) {
    return (
      getStatusMessage(StatusCodes.INTERNAL_SERVER_ERROR)
      ?? UNKNOWN_ERROR_MESSAGE
    );
  }

  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  return (
    error.data?.message || getStatusMessage(statusCode) || UNKNOWN_ERROR_MESSAGE
  );
}

/**
 * Ключ объекта в S3 из ссылки вида `/s3/<section>/<username>/<file>`.
 *
 * @param url ссылка на загруженный файл.
 * @returns ключ объекта; пустая строка — ссылка не из нашего хранилища.
 */
function getObjectKey(url: string): string {
  const prefix = '/s3/';

  return url.startsWith(prefix) ? url.slice(prefix.length) : '';
}

/**
 * Загрузка картинок в S3: проверка файла в браузере, отправка на сжатие,
 * удаление и копирование объекта. Ошибки показываются тостом.
 *
 * @param options раздел хранилища и ограничение размера.
 * @returns флаг загрузки и операции с картинкой.
 */
export function useImageUpload(options: ImageUploadOptions) {
  const $toast = useToast();

  const isUploading = ref(false);

  const actionUrl = computed(() => {
    const params = new URLSearchParams();
    const section = toValue(options.section);
    const maxSize = toValue(options.maxSize);

    if (section) {
      params.set('section', getSlug(section));
    }

    if (maxSize) {
      params.set('maxSize', maxSize.toString());
    }

    return `/s3/upload?${params.toString()}`;
  });

  /**
   * Сообщает об ошибке операции с картинкой.
   *
   * @param error пойманная ошибка.
   */
  function notifyError(error: unknown): void {
    consola.error(error);

    $toast.add({
      color: 'error',
      title: UPLOAD_ERROR_TITLE,
      description: getUploadErrorMessage(error),
    });
  }

  /**
   * Проверка файла до отправки: тип, вес и размер сторон.
   *
   * @param file выбранный файл.
   * @returns true, если файл можно загружать.
   */
  async function validateImage(file: File): Promise<boolean> {
    if (!IMAGE_UPLOAD_TYPES.includes(file.type)) {
      $toast.add({
        color: 'error',
        title: UPLOAD_ERROR_TITLE,
        description: 'Недопустимый формат изображения',
      });

      return false;
    }

    if (file.size > MAX_IMAGE_WEIGHT) {
      $toast.add({
        color: 'error',
        title: UPLOAD_ERROR_TITLE,
        description: `Размер изображения не должен превышать ${bytes(MAX_IMAGE_WEIGHT)}`,
      });

      return false;
    }

    try {
      const imageSize = await getImageSize(file);

      if (
        imageSize.width > MAX_IMAGE_SIDE
        || imageSize.height > MAX_IMAGE_SIDE
      ) {
        $toast.add({
          color: 'error',
          title: UPLOAD_ERROR_TITLE,
          description: `Изображение должно быть меньше ${MAX_IMAGE_SIDE}px по длинной стороне`,
        });

        return false;
      }

      return true;
    } catch (error) {
      notifyError(error);

      return false;
    }
  }

  /**
   * Загрузка картинки в S3.
   *
   * @param file выбранный файл.
   * @returns ссылка на загруженный файл; null — файл не прошёл проверку или
   * загрузка не удалась (пользователь уже увидел тост).
   */
  async function uploadImage(file: File): Promise<string | null> {
    // Параллельная загрузка сбила бы порядок «загрузить новую → удалить
    // прежнюю»: файл первой загрузки повис бы в хранилище ничейным.
    if (isUploading.value) {
      return null;
    }

    if (!(await validateImage(file))) {
      return null;
    }

    isUploading.value = true;

    try {
      const formData = new FormData();

      formData.append('file', file);

      const response = await $fetch(actionUrl.value, {
        method: 'POST',
        body: formData,
      });

      return uploadResponseSchema.parse(response).url;
    } catch (error) {
      notifyError(error);

      return null;
    } finally {
      isUploading.value = false;
    }
  }

  /**
   * Удаление файла из S3. Ошибка только логируется: несуществующий или чужой
   * объект не должен ломать сценарий, ради которого удаление затевалось.
   *
   * @param url ссылка на загруженный файл.
   */
  async function removeImage(url: string): Promise<void> {
    if (!getObjectKey(url)) {
      return;
    }

    try {
      await $fetch(url, { method: 'DELETE' });
    } catch (error) {
      consola.error(error);
    }
  }

  /**
   * Копия файла в S3 с новым ключом — нужна, когда на одну картинку начинают
   * ссылаться две сущности и удаление у одной не должно ломать другую.
   *
   * @param url ссылка на исходный файл.
   * @returns ссылка на копию; null — скопировать не удалось.
   */
  async function copyImage(url: string): Promise<string | null> {
    if (!getObjectKey(url)) {
      return null;
    }

    try {
      const response = await $fetch('/s3/copy', {
        method: 'POST',
        body: { url },
      });

      return uploadResponseSchema.parse(response).url;
    } catch (error) {
      consola.error(error);

      return null;
    }
  }

  return {
    isUploading,
    uploadImage,
    removeImage,
    copyImage,
  };
}
