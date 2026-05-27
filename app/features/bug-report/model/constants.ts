import type { BrushColor } from './types';

/** Предустановленные цвета кисти для рисования на скриншоте */
export const BRUSH_COLORS: ReadonlyArray<BrushColor> = [
  { name: 'yellow', value: '#FACC15' },
  { name: 'red', value: '#EF4444' },
  { name: 'green', value: '#22C55E' },
  { name: 'blue', value: '#3B82F6' },
  { name: 'orange', value: '#F97316' },
  { name: 'white', value: '#FFFFFF' },
];

/** Цвет кисти по умолчанию (жёлтый) */
export const DEFAULT_BRUSH_COLOR: BrushColor = {
  name: 'yellow',
  value: '#FACC15',
};

/** Размер кисти по умолчанию (в пикселях) */
export const DEFAULT_BRUSH_SIZE = 4;

/** Максимальное количество шагов отмены (undo) */
export const MAX_UNDO_STEPS = 50;

/** Количество символов контекста до/после выделенного текста */
export const SELECTION_CONTEXT_LENGTH = 50;

/** Ширина «хрома» модалки (форма + toolbar + отступы), вычитается из viewport для canvas */
export const MODAL_CHROME_WIDTH = 560;
