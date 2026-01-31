/**
 * Вычисляет масштабный коэффициент для преобразования координат canvas
 * относительно текущего размера контейнера.
 *
 * @param containerRef - Ссылка на HTML-элемент контейнера
 * @param referenceSize - Базовый размер для расчета (пиксели), по умолчанию 1000
 * @returns Масштабный коэффициент (1.0 если контейнер недоступен)
 */
export function getScaleFactor(
  containerRef: HTMLElement | null,
  referenceSize = 1000,
): number {
  if (!containerRef) {
    return 1;
  }

  const rect = containerRef.getBoundingClientRect();

  if (rect.width === 0) {
    return 1;
  }

  return referenceSize / rect.width;
}
