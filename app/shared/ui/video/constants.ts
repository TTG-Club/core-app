import type { VideoProvider } from './types';

/** Хосты YouTube, с которых принимаем ссылки (без `www.` и `m.`). */
export const VIDEO_YOUTUBE_HOSTS: ReadonlyArray<string> = [
  'youtube.com',
  'youtube-nocookie.com',
  'youtu.be',
];

/** Хосты ВК Видео, с которых принимаем ссылки (без `www.` и `m.`). */
export const VIDEO_VK_HOSTS: ReadonlyArray<string> = [
  'vk.com',
  'vk.ru',
  'vkvideo.ru',
];

/**
 * Плеер YouTube без отслеживающих cookie до запуска ролика: гость, который
 * видео не включал, YouTube о себе не сообщает.
 */
export const VIDEO_YOUTUBE_EMBED_BASE =
  'https://www.youtube-nocookie.com/embed';

/** Обычная ссылка на ролик YouTube — под неё нормализуем всё, что вставили. */
export const VIDEO_YOUTUBE_WATCH_BASE = 'https://www.youtube.com/watch';

/** Превью ролика YouTube (480×360, есть у любого ролика). */
export const VIDEO_YOUTUBE_THUMBNAIL_BASE = 'https://i.ytimg.com/vi';

/** Встраиваемый плеер ВК Видео. */
export const VIDEO_VK_EMBED_BASE = 'https://vk.com/video_ext.php';

/** Обычная ссылка на ролик ВК — под неё нормализуем всё, что вставили. */
export const VIDEO_VK_WATCH_BASE = 'https://vk.com/video';

/**
 * Разрешения для iframe плеера: автозапуск после нажатия «Смотреть»,
 * полноэкранный режим и «картинка в картинке».
 */
export const VIDEO_IFRAME_ALLOW =
  'autoplay; encrypted-media; fullscreen; picture-in-picture';

/** Подписи площадок на заглушке плеера. */
export const VIDEO_PROVIDER_LABELS = {
  youtube: 'YouTube',
  vk: 'ВК Видео',
} as const satisfies Record<VideoProvider, string>;

/** Иконка кнопки запуска ролика. */
export const VIDEO_PLAY_ICON = 'tabler:player-play-filled';

/** Подпись кнопки запуска ролика (для экранных читалок). */
export const VIDEO_PLAY_LABEL = 'Смотреть видео';

/** Подпись ссылки «открыть ролик на сайте площадки». */
export const VIDEO_OPEN_SOURCE_LABEL = 'Открыть на сайте площадки';

/** Текст, когда ссылку на ролик разобрать не удалось. */
export const VIDEO_UNSUPPORTED_TEXT =
  'Ссылка на видео не распознана: поддерживаются YouTube и ВК Видео.';

/** Начало подсказки о распознанной площадке («Распознано: YouTube»). */
export const VIDEO_RECOGNIZED_PREFIX = 'Распознано:';

/** Подпись кнопки очистки поля ссылки на видео. */
export const VIDEO_REMOVE_LABEL = 'Убрать видео';

/** Подпись поля ссылки на видео в редакторах. */
export const VIDEO_URL_FIELD_LABEL = 'Видео вместо обложки';

/** Подсказка поля ссылки на видео в редакторах. */
export const VIDEO_URL_FIELD_HINT =
  'Ссылка на ролик YouTube или ВК Видео. Если в ВК ролик не запускается, вставь код со страницы ролика: «Поделиться» → «Экспортировать». Обложка остаётся заставкой перед запуском; у ВК её лучше загрузить — своего превью ВК не отдаёт.';

/** Плейсхолдер поля ссылки на видео. */
export const VIDEO_URL_FIELD_PLACEHOLDER =
  'https://youtu.be/… или https://vk.com/video…';
