import { StatusCodes } from 'http-status-codes';

import type { MultiPartData } from 'h3';
import type { S3UploadFile } from '~~/server/domain/s3/model';

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

export function getFileKey(
  section: string | undefined,
  username: string | undefined,
  filename: string | undefined,
): string {
  const _section = section?.trim();
  const _username = username?.trim();
  const _filename = filename?.trim();

  if (!_section) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Отсутствует название раздела',
      }),
    );
  }

  if (!_username) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Отсутствует имя пользователя',
      }),
    );
  }

  const sectionSlug = getSlug(_section);
  const usernameSlug = getSlug(_username);
  const filenameSlug = getFilenameSlug(_filename);

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
