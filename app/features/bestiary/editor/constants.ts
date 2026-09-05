export const CREATURE_IMAGE_SECTION_TITLE = 'Изображения';

export const CREATURE_GALLERY_FIELD_LABEL = 'Галерея';

export const CREATURE_UPLOAD_SECTION = 'bestiary';

/** Вкладки формы существа — в порядке показа. */
export const CREATURE_EDITOR_TABS = {
  main: 'Основное',
  statblock: 'Статблок',
  actions: 'Действия',
  effects: 'Эффекты',
  images: CREATURE_IMAGE_SECTION_TITLE,
} as const;
