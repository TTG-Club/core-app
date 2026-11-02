/**
 * Классы карточки с обложкой. Карточкой она перестраивается в строку только на
 * узком контейнере; строкой (вид списков «строками») — всегда, с обложкой
 * поменьше.
 */
export const CARD_LINK_LAYOUT_CLASSES = {
  card: {
    link: '@max-md:flex',
    image: 'aspect-square w-full @max-md:size-25',
    gradient: '@max-md:bg-linear-to-l @md:group-hover:top-full',
    content: 'gap-2 px-4 py-3 @max-md:gap-1 @max-md:px-3 @max-md:py-2',
    name: '@md:flex-1',
  },
  row: {
    link: 'flex',
    image: 'size-14',
    gradient: 'bg-linear-to-l',
    content: 'min-w-0 gap-1 px-3 py-2',
    name: 'flex-1',
  },
} as const;

/**
 * Ширина текста карточки на узком контейнере: рядом с обложкой или во всю
 * карточку, если обложка спрятана. Строке ограничение не нужно — её обложка
 * меньше, и текст сам сжимается.
 */
export const CARD_LINK_CONTENT_WIDTH_CLASSES = {
  besideImage: '@max-md:max-w-[calc(100cqw-calc(var(--spacing)*25))]',
  full: '@max-md:max-w-full',
} as const;
