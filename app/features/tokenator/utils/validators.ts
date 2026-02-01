/**
 * Ограничивает значение в заданном диапазоне.
 *
 * @param value - Значение для ограничения
 * @param min - Минимальное допустимое значение
 * @param max - Максимальное допустимое значение
 * @returns Значение, ограниченное диапазоном [min, max]
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Валидирует масштаб токена в допустимых пределах.
 *
 * @param scale - Значение масштаба
 * @returns Корректное значение масштаба в диапазоне [0.1, 3]
 */
export function validateScale(scale: number): number {
  return clamp(scale, 0.1, 3);
}

/**
 * Валидирует угол поворота в допустимых пределах.
 *
 * @param rotation - Угол поворота в градусах
 * @returns Корректный угол в диапазоне [-180, 180]
 */
export function validateRotation(rotation: number): number {
  return clamp(rotation, -180, 180);
}

/**
 * Валидирует размер кисти для маски.
 *
 * @param size - Размер кисти в пикселях
 * @returns Корректный размер в диапазоне [1, 100]
 */
export function validateBrushSize(size: number): number {
  return clamp(size, 1, 100);
}

/**
 * Валидирует размер шрифта для текста.
 *
 * @param fontSize - Размер шрифта в пикселях
 * @returns Корректный размер в диапазоне [10, 200]
 */
export function validateFontSize(fontSize: number): number {
  return clamp(fontSize, 10, 200);
}

/**
 * Валидирует opacity (прозрачность) в процентах.
 *
 * @param opacity - Прозрачность в процентах
 * @returns Корректное значение в диапазоне [0, 100]
 */
export function validateOpacity(opacity: number): number {
  return clamp(opacity, 0, 100);
}
