/**
 * Получение модификатора
 *
 * @param value значение
 */
export function getModifier(value?: number): string {
  return formatModifier(modifier(value));
}

/**
 * Получение модификатора
 *
 * @param value значение
 */
export function modifier(value?: number): number {
  return value != null ? Math.floor((value - 10) / 2) : 0;
}

/**
 * Добавление знака к модификатору
 *
 * @param mod значение
 */
export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}
