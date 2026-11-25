import type { ImageFrame } from '~/shared/types';

/** Наименьшее приближение: картинка ровно заполняет рамку. */
export const IMAGE_FRAME_MIN_ZOOM = 1;

/** Наибольшее приближение. */
export const IMAGE_FRAME_MAX_ZOOM = 4;

/** Шаг приближения ползунком и клавишами `+` / `-`. */
export const IMAGE_FRAME_ZOOM_STEP = 0.05;

/** Шаг приближения кнопками с лупой: крупнее, чтобы не щёлкать подолгу. */
export const IMAGE_FRAME_BUTTON_ZOOM_STEP = 0.1;

/**
 * Скорость приближения колёсиком на пиксель прокрутки. Щелчок мыши (~100 px)
 * даёт около 16 %, а тачпад с его мелкими событиями приближает плавно.
 */
export const IMAGE_FRAME_WHEEL_ZOOM_SPEED = 0.0015;

/**
 * Режим прокрутки строками (`WheelEvent.DOM_DELTA_LINE`). Числом, а не через
 * `WheelEvent`: расчёт работает и вне браузера.
 */
export const IMAGE_FRAME_WHEEL_DELTA_LINE = 1;

/** Сколько пикселей в строке прокрутки: Firefox шлёт колёсико строками. */
export const IMAGE_FRAME_WHEEL_LINE_HEIGHT = 33;

/** Доля диапазона сдвига за одно нажатие стрелки. */
export const IMAGE_FRAME_KEYBOARD_MOVE_STEP = 0.02;

/** Сдвиг кадра по стрелкам, в долях картинки: картинка едет вслед стрелке. */
export const IMAGE_FRAME_KEYBOARD_MOVES: Readonly<
  Record<string, { x: number; y: number }>
> = {
  ArrowLeft: { x: IMAGE_FRAME_KEYBOARD_MOVE_STEP, y: 0 },
  ArrowRight: { x: -IMAGE_FRAME_KEYBOARD_MOVE_STEP, y: 0 },
  ArrowUp: { x: 0, y: IMAGE_FRAME_KEYBOARD_MOVE_STEP },
  ArrowDown: { x: 0, y: -IMAGE_FRAME_KEYBOARD_MOVE_STEP },
};

/** Клавиши приближения: `=` — та же клавиша, что `+`, без Shift. */
export const IMAGE_FRAME_ZOOM_IN_KEYS: readonly string[] = ['+', '='];

/** Клавиши отдаления. */
export const IMAGE_FRAME_ZOOM_OUT_KEYS: readonly string[] = ['-'];

/** Во сколько раз округляются значения кадра: точнее глаз не различит. */
export const IMAGE_FRAME_PRECISION = 10_000;

/** Кадр по умолчанию: центр картинки без приближения — как без настройки. */
export const IMAGE_FRAME_DEFAULT: ImageFrame = { x: 0.5, y: 0.5, zoom: 1 };

/** Подписи редактора кадра. */
export const IMAGE_FRAME_LABELS = {
  viewport:
    'Кадр обложки: перетащи картинку, колёсиком или ползунком приблизь; стрелки двигают, плюс и минус приближают',
  zoom: 'Приближение',
  zoomOut: 'Отдалить',
  zoomIn: 'Приблизить',
  reset: 'Сбросить кадр',
  hint: 'Так обложка выглядит на странице и в карточке. При просмотре целиком видна вся картинка.',
} as const;
