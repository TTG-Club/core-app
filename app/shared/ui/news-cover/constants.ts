/** Вид кнопок-действий поверх обложки: стеклянный тёмный фон. */
export const NEWS_COVER_ACTION_CLASS =
  'bg-black/40 text-white ring-1 ring-white/20 backdrop-blur-sm hover:bg-black/60 hover:text-white';

/** Разделитель частей моно-подписи над заголовком. */
export const NEWS_COVER_META_SEPARATOR = ' · ';

/**
 * Классы обложки по размеру: обычная — для широкой панели, малая — для узкой
 * (кегль заголовка меньше, анонса нет). Пропорции задают только наименьшую
 * высоту картинки: в панели-столбце, которую растянул ряд, обложка добирает
 * высоту вместе с ней.
 */
export const NEWS_COVER_SIZE_CLASS = {
  regular: {
    image: 'aspect-16/10 sm:aspect-2/1 xl:aspect-21/9',
    caption: 'p-4 sm:p-6',
    title: 'text-xl sm:text-2xl xl:text-3xl',
    playButton: 'size-16 sm:size-20',
    playIcon: 'size-7 sm:size-9',
  },
  compact: {
    image: 'aspect-16/10 sm:aspect-2/1 xl:aspect-16/10',
    caption: 'p-4',
    title: 'text-lg sm:text-xl',
    playButton: 'size-14',
    playIcon: 'size-6',
  },
} as const;
