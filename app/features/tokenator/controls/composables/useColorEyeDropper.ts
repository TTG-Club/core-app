/**
 * Composable для выбора цвета с экрана через системную пипетку (EyeDropper API).
 *
 * @returns Объект с признаком поддержки пипетки браузером (`isSupported`)
 *   и функцией `pickColor`, открывающей пипетку.
 */
export function useColorEyeDropper() {
  const { isSupported, open } = useEyeDropper();

  /**
   * Открывает системную пипетку и передаёт выбранный hex-цвет в колбэк.
   * Отмена выбора пользователем игнорируется.
   *
   * @param apply - Колбэк, получающий выбранный цвет в формате hex.
   */
  async function pickColor(apply: (color: string) => void): Promise<void> {
    try {
      const response = await open();

      if (response?.sRGBHex) {
        apply(response.sRGBHex);
      }
    } catch {
      // Игнорируем ошибку отмены выбора пользователем
    }
  }

  return { isSupported, pickColor };
}
