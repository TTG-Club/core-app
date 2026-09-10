import type { S3UploadFile } from '#server/domain/s3';

import { StatusCodes } from 'http-status-codes';

/**
 * Один файл из multipart-формы. h3 v2 больше не экспортирует тип публично,
 * поэтому описываем форму элемента readMultipartFormData локально.
 */
interface MultiPartData {
  data: Uint8Array;
  name?: string;
  filename?: string;
  type?: string;
}

/**
 * Приводит файл из формы к виду, в котором его принимает хранилище.
 *
 * @param section Раздел сайта, куда грузят файл.
 * @param username Владелец файла.
 * @param file Часть multipart-формы.
 */
export function getFileForUpload(
  section: string | undefined,
  username: string | undefined,
  file: MultiPartData,
): S3UploadFile {
  if (!file.type) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Неизвестный тип данных',
      }),
    );
  }

  if (!file.filename) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Отсутствует имя файла',
      }),
    );
  }

  return {
    name: file.filename,
    data: file.data,
    path: getFileKey(section, username, file.filename),
    type: file.type,
  };
}

/**
 * Ключ файла в хранилище: раздел, владелец и имя файла. Пустая часть — ошибка
 * запроса: по такому ключу файл потом не найти.
 *
 * @param section Раздел сайта.
 * @param username Владелец файла.
 * @param filename Имя файла из формы.
 */
export function getFileKey(
  section: string | undefined,
  username: string | undefined,
  filename: string | undefined,
): string {
  const trimmedSection = section?.trim();
  const trimmedUsername = username?.trim();
  const trimmedFilename = filename?.trim();

  if (!trimmedSection) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Отсутствует название раздела',
      }),
    );
  }

  if (!trimmedUsername) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Отсутствует имя пользователя',
      }),
    );
  }

  const sectionSlug = getSlug(trimmedSection);
  const usernameSlug = getSlug(trimmedUsername);
  const filenameSlug = getFilenameSlug(trimmedFilename);

  return `${sectionSlug}/${usernameSlug}/${filenameSlug}`;
}

function getFilenameSlug(raw: string | undefined): string {
  const _raw = raw?.trim();

  if (!_raw) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Отсутствует имя файла',
      }),
    );
  }

  const lastDotIndex = _raw.lastIndexOf('.');

  if (lastDotIndex < 0) {
    return `${Date.now()}-${getSlug(_raw)}`;
  }

  const filenameSlug = getSlug(_raw.substring(0, lastDotIndex));
  const extensionSlug = getSlug(_raw.substring(lastDotIndex + 1, _raw.length));

  return `${Date.now()}-${getSlug(filenameSlug)}.${extensionSlug}`;
}
