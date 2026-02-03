/**
 * Composable для работы с цветом и его прозрачностью.
 * Преобразует hex-цвет с альфа-каналом в отдельные hex и opacity значения.
 *
 * @param colorRef - Реактивная ссылка на цвет с альфа-каналом (например, '#ff0000ff')
 * @param defaultColor - Цвет по умолчанию без альфа-канала (например, '#ff0000')
 * @param onEnable - Опциональный callback, вызываемый при изменении цвета
 * @returns Объект с computed свойствами hex и opacity
 */
export function useColorWithOpacity(
  colorRef: Ref<string>,
  defaultColor: string,
  onEnable?: () => void,
) {
  /**
   * Hex-код цвета без альфа-канала
   */
  const hex = computed({
    get: () => colorRef.value.slice(0, 7) || defaultColor,
    set: (val) => {
      const alpha = colorRef.value.slice(7) || 'ff';

      colorRef.value = val + alpha;
      onEnable?.();
    },
  });

  /**
   * Прозрачность в процентах (0-100)
   */
  const opacity = computed({
    get: () => {
      const hexAlpha = colorRef.value.slice(7);

      if (!hexAlpha) {
        return 100;
      }

      return Math.round((Number.parseInt(hexAlpha, 16) / 255) * 100);
    },
    set: (val) => {
      const hexAlpha = Math.round((val / 100) * 255)
        .toString(16)
        .padStart(2, '0');

      const base = colorRef.value.slice(0, 7) || defaultColor;

      colorRef.value = base + (val < 100 ? hexAlpha : '');
      onEnable?.();
    },
  });

  return { hex, opacity };
}
