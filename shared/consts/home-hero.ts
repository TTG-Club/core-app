import { IMAGE_UPLOAD_TYPES } from './upload';

/**
 * Общий контракт фона шапки главной: какие файлы принимаются и сколько они
 * могут весить. Нужен и админской форме (проверка до отправки, подсказки), и
 * серверному роуту, который файл сохраняет.
 */

/** Типы видео для фона шапки: webm без звука играет в любом браузере сам. */
export const HOME_HERO_VIDEO_TYPES = ['video/webm'];

/**
 * Предел веса видео, МБ. Картинку ограничивает общий компрессор загрузок
 * (итоговый webp не тяжелее 1 МБ), а видео уходит как есть и грузится каждому
 * посетителю главной — поэтому держим его лёгким.
 */
export const HOME_HERO_VIDEO_MAX_MEGABYTES = 15;

/** Предел веса видео в байтах — для сравнения с размером файла. */
export const HOME_HERO_VIDEO_MAX_BYTES =
  HOME_HERO_VIDEO_MAX_MEGABYTES * 1024 * 1024;

/** Все типы файлов, которые можно поставить фоном шапки. */
export const HOME_HERO_MEDIA_TYPES = [
  ...IMAGE_UPLOAD_TYPES,
  ...HOME_HERO_VIDEO_TYPES,
];

/** Ответ на файл неподходящего формата. */
export const HOME_HERO_UNSUPPORTED_TYPE_MESSAGE =
  'Фоном шапки можно поставить картинку .webp, .jpg, .png или видео .webm';

/** Ответ на слишком тяжёлое видео. */
export const HOME_HERO_VIDEO_TOO_LARGE_MESSAGE = `Видео не должно весить больше ${HOME_HERO_VIDEO_MAX_MEGABYTES} МБ`;
