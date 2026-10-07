import type { H3Event } from 'h3';

import type { UserAvatarResponse } from '../model';

import { StatusCodes } from 'http-status-codes';
import sharp from 'sharp';

import { getFileKey, S3Service } from '#server/domain/s3';
import { parseAuthJwtPayload } from '#server/utils/authService';
import { fetchUserNameAndAvatar } from '#server/utils/displayName';
import { getUserFromToken } from '#server/utils/getUser';

import {
  USER_AVATAR_BROKEN_IMAGE_LOG,
  USER_AVATAR_BROKEN_IMAGE_MESSAGE,
  USER_AVATAR_CONTENT_TYPE,
  USER_AVATAR_CORE_API_FAILED_LOG,
  USER_AVATAR_CORE_API_FAILED_MESSAGE,
  USER_AVATAR_CORE_API_PATH,
  USER_AVATAR_FILE_REMOVE_FAILED_LOG,
  USER_AVATAR_FILENAME,
  USER_AVATAR_NO_USER_ID_MESSAGE,
  USER_AVATAR_SIDE,
  USER_AVATAR_UPLOAD_SECTION,
  USER_AVATAR_WEBP_QUALITY,
} from '../model';
import { getOwnAvatarFileKey } from '../utils';

/** Владелец аватарки: токен для core-api и идентификатор для папки файлов. */
interface AvatarOwner {
  token: string;
  userId: string;
}

/** Запрос к ручке аватарки core-api: поставить ссылку или убрать её. */
type CoreApiAvatarRequest =
  | { method: 'PUT'; body: { avatarUrl: string } }
  | { method: 'DELETE' };

/**
 * Приводит картинку к аватарке: квадрат со стороной `USER_AVATAR_SIDE` в webp.
 * Поворот по EXIF применяется до обрезки. Метаданные, в том числе координаты
 * съёмки, sharp в результат не переносит. У анимированной картинки читается
 * только первый кадр — аватарки на сайте статичные.
 *
 * @param uploadedImage содержимое присланного файла.
 */
async function renderAvatarImage(uploadedImage: Uint8Array): Promise<Buffer> {
  try {
    return await sharp(uploadedImage)
      .rotate()
      .resize(USER_AVATAR_SIDE, USER_AVATAR_SIDE, { fit: 'cover' })
      .webp({ quality: USER_AVATAR_WEBP_QUALITY })
      .toBuffer();
  } catch (error) {
    consola.warn(USER_AVATAR_BROKEN_IMAGE_LOG, error);

    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: USER_AVATAR_BROKEN_IMAGE_MESSAGE,
      }),
    );
  }
}

/**
 * Запрос к ручке аватарки core-api от имени пользователя. Отказ core-api — в
 * том числе ещё не задеплоенная ручка — становится ошибкой с понятным текстом,
 * а подробности уходят в лог.
 *
 * @param token токен пользователя.
 * @param avatarRequest метод и тело запроса.
 */
async function requestCoreApiAvatar(
  token: string,
  avatarRequest: CoreApiAvatarRequest,
): Promise<void> {
  try {
    const { url } = getApiSecrets();

    await $fetch(`${url}${USER_AVATAR_CORE_API_PATH}`, {
      ...avatarRequest,
      headers: {
        authorization: `Bearer ${token}`,
      },
      retry: 0,
    });
  } catch (error) {
    consola.error(USER_AVATAR_CORE_API_FAILED_LOG, error);

    throw createError(
      getErrorResponse(StatusCodes.BAD_GATEWAY, {
        message: USER_AVATAR_CORE_API_FAILED_MESSAGE,
      }),
    );
  }
}

/**
 * Удаляет файл аватарки из хранилища, если он лежит в папке пользователя.
 * Сбой только логируется: ссылка к этому моменту уже сохранена, а лишний файл
 * в хранилище ничего не ломает.
 *
 * @param avatarUrl ссылка на файл; null — удалять нечего.
 * @param userId идентификатор владельца.
 */
async function removeAvatarFile(
  avatarUrl: string | null,
  userId: string,
): Promise<void> {
  const fileKey = getOwnAvatarFileKey(avatarUrl, userId);

  if (!fileKey) {
    return;
  }

  try {
    await S3Service.delete(fileKey);
  } catch (error) {
    consola.error(USER_AVATAR_FILE_REMOVE_FAILED_LOG, error);
  }
}

/**
 * Владелец аватарки из токена запроса. Папка файлов ключуется идентификатором
 * пользователя, а не логином: по нему аватарку ищут комментарии и «Поиск игр».
 *
 * @param event событие запроса.
 */
export async function getAvatarOwner(event: H3Event): Promise<AvatarOwner> {
  const token = getTokenFromRequest(event);
  const { sub: userId } = parseAuthJwtPayload(await getUserFromToken(event));

  if (!userId) {
    throw createError(
      getErrorResponse(StatusCodes.UNAUTHORIZED, {
        message: USER_AVATAR_NO_USER_ID_MESSAGE,
      }),
    );
  }

  return { token, userId };
}

/**
 * Ставит пользователю новую аватарку: готовит картинку, заливает файл,
 * сохраняет ссылку в core-api и только потом удаляет прежний файл. Ссылка на
 * файл каждый раз новая (в имени время загрузки), поэтому кеш браузеров не
 * держит старую картинку.
 *
 * @param owner владелец аватарки.
 * @param uploadedImage содержимое присланного файла.
 * @returns ссылка на новую аватарку.
 */
export async function replaceUserAvatar(
  owner: AvatarOwner,
  uploadedImage: Uint8Array,
): Promise<UserAvatarResponse> {
  const { token, userId } = owner;
  const avatarImage = await renderAvatarImage(uploadedImage);
  const { avatarUrl: previousAvatarUrl } = await fetchUserNameAndAvatar(token);

  const uploadedFile = await S3Service.upload({
    name: USER_AVATAR_FILENAME,
    path: getFileKey(USER_AVATAR_UPLOAD_SECTION, userId, USER_AVATAR_FILENAME),
    type: USER_AVATAR_CONTENT_TYPE,
    data: avatarImage,
  });

  try {
    await requestCoreApiAvatar(token, {
      method: 'PUT',
      body: { avatarUrl: uploadedFile.url },
    });
  } catch (error) {
    // Ссылка не сохранилась — залитый файл никому не нужен.
    await removeAvatarFile(uploadedFile.url, userId);

    throw error;
  }

  await removeAvatarFile(previousAvatarUrl, userId);

  return { avatarUrl: uploadedFile.url };
}

/**
 * Убирает аватарку пользователя: сначала ссылку в core-api, затем файл.
 *
 * @param owner владелец аватарки.
 * @returns пустая ссылка.
 */
export async function removeUserAvatar(
  owner: AvatarOwner,
): Promise<UserAvatarResponse> {
  const { token, userId } = owner;
  const { avatarUrl: previousAvatarUrl } = await fetchUserNameAndAvatar(token);

  await requestCoreApiAvatar(token, { method: 'DELETE' });
  await removeAvatarFile(previousAvatarUrl, userId);

  return { avatarUrl: null };
}
