/** Раздел хранилища с аватарками — первый сегмент ключа файла. */
export const USER_AVATAR_UPLOAD_SECTION = 'avatars';

/** Имя файла аватарки: хранилище добавляет к нему время загрузки. */
export const USER_AVATAR_FILENAME = 'avatar.webp';

/** Тип файла аватарки: сервер всегда перекодирует картинку в webp. */
export const USER_AVATAR_CONTENT_TYPE = 'image/webp';

/**
 * Сторона квадратной аватарки, px. Крупнее всего она в профиле — 128 px на
 * экране, здесь запас вдвое под экраны высокой плотности.
 */
export const USER_AVATAR_SIDE = 256;

/** Качество кодирования webp. */
export const USER_AVATAR_WEBP_QUALITY = 85;

/** Предел веса присланного файла, МБ. */
export const USER_AVATAR_MAX_MEGABYTES = 5;

/** Предел веса присланного файла в байтах — для сравнения с размером файла. */
export const USER_AVATAR_MAX_BYTES = USER_AVATAR_MAX_MEGABYTES * 1024 * 1024;

/** Ручка аватарки текущего пользователя в core-api. */
export const USER_AVATAR_CORE_API_PATH = '/api/user/profile/avatar';

/** Ответ на файл неподходящего формата. */
export const USER_AVATAR_UNSUPPORTED_TYPE_MESSAGE =
  'Для аватарки подойдёт картинка .webp, .jpg или .png';

/** Ответ на слишком тяжёлый файл. */
export const USER_AVATAR_TOO_LARGE_MESSAGE = `Аватарка не должна весить больше ${USER_AVATAR_MAX_MEGABYTES} МБ`;

/** Ответ на файл, который не читается как картинка. */
export const USER_AVATAR_BROKEN_IMAGE_MESSAGE =
  'Не удалось открыть картинку — файл повреждён или это не изображение';

/** Ответ на токен без идентификатора пользователя (выдан до его появления). */
export const USER_AVATAR_NO_USER_ID_MESSAGE =
  'Не удалось определить пользователя — войди на сайт заново';

/** Ответ, когда core-api не поставил или не убрал ссылку на аватарку. */
export const USER_AVATAR_CORE_API_FAILED_MESSAGE =
  'Профиль сейчас не отвечает — попробуй позже';

/** Метка непредвиденных ошибок роутов аватарки в логе. */
export const USER_AVATAR_ERROR_LOG = '[User Avatar Error]:';

/** Присланный файл не прочитался как картинка. */
export const USER_AVATAR_BROKEN_IMAGE_LOG =
  '[User Avatar] Uploaded file is not a readable image:';

/** core-api не выполнил запрос к ручке аватарки. */
export const USER_AVATAR_CORE_API_FAILED_LOG =
  '[User Avatar] core-api avatar request failed:';

/** Файл аватарки не удалился из хранилища. */
export const USER_AVATAR_FILE_REMOVE_FAILED_LOG =
  '[User Avatar] Failed to remove avatar file:';
