import type { CropCorner } from '~/composables/useImageCrop';

/** Подписи редактора кадрирования. */
export const IMAGE_CROP_LABELS = {
  title: 'Выбор области изображения',
  description:
    'Перетащи рамку по картинке и измени её размер за уголки — загрузится только выделенный квадрат.',
  imageAlt: 'Выбранное изображение',
  frame: 'Область изображения: перемещается перетаскиванием или стрелками',
  preview: 'Предпросмотр',
  size: 'Размер области',
  shrink: 'Уменьшить область',
  grow: 'Увеличить область',
  cancel: 'Отмена',
  apply: 'Применить',
  loadErrorTitle: 'Не удалось открыть изображение',
  loadErrorDescription: 'Файл повреждён или его формат не поддерживается.',
  cropErrorTitle: 'Не удалось вырезать выбранную область',
} as const;

/** Сторона предпросмотра в пикселях: по ней считается фон круглой картинки. */
export const IMAGE_CROP_PREVIEW_SIZE = 96;

/** Маркер угла рамки: за какой угол тянет и как выглядит курсор. */
interface ImageCropHandle {
  corner: CropCorner;
  class: string;
}

/** Маркеры углов рамки — по одному в каждый угол. */
export const IMAGE_CROP_HANDLES: ImageCropHandle[] = [
  { corner: 'topLeft', class: '-top-2.5 -left-2.5 cursor-nwse-resize' },
  { corner: 'topRight', class: '-top-2.5 -right-2.5 cursor-nesw-resize' },
  { corner: 'bottomLeft', class: '-bottom-2.5 -left-2.5 cursor-nesw-resize' },
  { corner: 'bottomRight', class: '-right-2.5 -bottom-2.5 cursor-nwse-resize' },
];
