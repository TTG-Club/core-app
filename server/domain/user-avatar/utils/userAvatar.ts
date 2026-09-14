import { S3_URL_PREFIX } from '#server/domain/s3/model';
import { getSlug } from '#shared/utils';

import { USER_AVATAR_UPLOAD_SECTION } from '../model';

/**
 * Папка аватарок пользователя в хранилище. Ключ собирается так же, как у общих
 * загрузок (`getFileKey`): раздел, затем владелец слагом — поэтому файл,
 * залитый через `getFileKey`, лежит именно здесь.
 *
 * @param userId идентификатор пользователя (клейм `sub` токена).
 */
export function getUserAvatarFolderKey(userId: string): string {
  return `${USER_AVATAR_UPLOAD_SECTION}/${getSlug(userId)}/`;
}

/**
 * Ключ файла аватарки, если ссылка ведёт прямо в папку аватарок этого
 * пользователя. Удаляются только такие файлы: ссылка приходит из core-api, и
 * сторонний или чужой адрес там не должен стоить кому-то файла.
 *
 * @param avatarUrl ссылка на аватарку; null — аватарки нет.
 * @param userId идентификатор пользователя (клейм `sub` токена).
 * @returns ключ файла в хранилище; null — ссылка не из папки пользователя.
 */
export function getOwnAvatarFileKey(
  avatarUrl: string | null,
  userId: string,
): string | null {
  if (!avatarUrl?.startsWith(S3_URL_PREFIX)) {
    return null;
  }

  const fileKey = avatarUrl.slice(S3_URL_PREFIX.length);
  const folderKey = getUserAvatarFolderKey(userId);

  if (!fileKey.startsWith(folderKey)) {
    return null;
  }

  const fileName = fileKey.slice(folderKey.length);

  // Файл лежит прямо в папке: вложенный путь — уже не аватарка пользователя.
  return fileName && !fileName.includes('/') ? fileKey : null;
}
