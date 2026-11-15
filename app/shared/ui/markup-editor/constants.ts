/** Иконка кнопки подтверждения в панели ввода под тулбаром. */
export const INSERT_PANEL_CONFIRM_ICON = 'tabler:check';

/** Подписи кнопки подтверждения панели ввода: подпись таблицы сохраняется, остальное вставляется. */
export const INSERT_PANEL_CONFIRM_LABELS = {
  caption: 'Сохранить подпись',
  insert: 'Вставить',
} as const;

/**
 * Подсказка экранной клавиатуре для клавиши ввода в полях панели: «Готово»
 * вместо «Далее», чтобы клавиша подтверждала ввод, а не уводила фокус.
 */
export const INSERT_PANEL_ENTER_KEY_HINT = 'done';

/**
 * Предельная сторона картинки в тексте, px: сервер ужимает до неё при загрузке.
 * Шире колонки текста картинка всё равно не рисуется, а запас нужен для
 * просмотра в полном размере.
 */
export const MARKUP_IMAGE_MAX_SIZE = 1600;

/** Подпись состояния загрузки картинки над редактором. */
export const MARKUP_IMAGE_UPLOADING_LABEL = 'Загружаю картинку…';

/** Подпись кнопки загрузки картинки. */
export const MARKUP_IMAGE_UPLOAD_LABEL = 'Картинка';

/** Иконка кнопки загрузки картинки. */
export const MARKUP_IMAGE_ICON = 'tabler:photo';

/** Подписи и иконки меню настроек выделенной картинки. */
export const MARKUP_IMAGE_MENU = {
  settings: 'Настройки картинки',
  floatLeft: {
    label: 'Картинка слева, текст обтекает',
    icon: 'tabler:float-left',
  },
  floatNone: {
    label: 'Отдельным блоком по центру',
    icon: 'tabler:float-none',
  },
  floatRight: {
    label: 'Картинка справа, текст обтекает',
    icon: 'tabler:float-right',
  },
  width: { label: 'Ширина', icon: 'tabler:arrows-horizontal' },
  caption: { label: 'Подпись под картинкой…', icon: 'tabler:text-caption' },
  alt: {
    label: 'Описание для тех, кто не видит картинку…',
    icon: 'tabler:accessible',
  },
  upload: { label: 'Загрузить ещё картинку…', icon: 'tabler:photo-plus' },
  remove: { label: 'Удалить картинку', icon: 'tabler:trash' },
} as const;

/**
 * Поля панели ввода для картинки: подпись поля (она же плейсхолдер и
 * aria-label) и иконка — по режиму панели.
 */
export const MARKUP_IMAGE_PANEL_FIELDS = {
  'image-caption': {
    label: 'Подпись под картинкой',
    icon: 'tabler:text-caption',
  },
  'image-alt': {
    label: 'Что изображено на картинке',
    icon: 'tabler:accessible',
  },
} as const;

/** Заглушка в редакторе на месте картинки без адреса. */
export const MARKUP_IMAGE_EMPTY_LABEL = 'Картинка без адреса';

/**
 * Разделы хранилища (первый сегмент ключа в S3) для картинок в тексте — по
 * разделам сайта, у которых своей константы раздела нет. Значения совпадают с
 * разделами, куда эти же формы грузят обложки.
 */
export const MARKUP_IMAGE_SECTIONS = {
  backgrounds: 'backgrounds',
  bastions: 'bastions',
  classes: 'classes',
  feats: 'feats',
  glossary: 'glossary',
  items: 'item',
  magicItems: 'magic-items',
  roadmap: 'roadmap',
  sources: 'sources',
  species: 'species',
  spells: 'spells',
} as const;
