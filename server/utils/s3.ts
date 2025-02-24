import type { MultiPartData } from 'h3';
import type { S3UploadFile } from '~~/server/types/s3';
import { getErrorResponse, getSlug } from '#shared/utils';
import { StatusCodes } from 'http-status-codes';

export function getFileForUpload(
  file: MultiPartData,
  username: string,
  path?: string,
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

  let fullPath = `${Date.now()}-${getSlug(file.filename)}`;

  const pathFormatted = getPathFormatted(path);

  if (pathFormatted?.length) {
    fullPath = `${pathFormatted}/${getSlug(username)}/${fullPath}`;
  }

  return {
    name: file.filename,
    data: file.data,
    path: fullPath,
    type: file.type,
  };
}

export function getKeyFromUrl(keyOrUrl: string) {
  const {
    s3: { endpoint, bucket },
  } = useRuntimeConfig();

  const regex = new RegExp(`^${endpoint}/${bucket}/`);

  return keyOrUrl.replace(regex, '');
}

export function hasUserAccess(key: string, username: string, path?: string) {
  if (!key || !username) {
    return false;
  }

  const pathFormatted = getPathFormatted(path);
  const keyFormatted = pathFormatted ? key.replace(pathFormatted, '') : key;

  return keyFormatted.replace(/^\//g, '').startsWith(getSlug(username));
}

function getPathFormatted(path?: string) {
  return path
    ?.replace(/^\/|\/$/, '')
    .split('/')
    .map((folder) => getSlug(folder).trim())
    .filter((folder) => !!folder)
    .join('/');
}
