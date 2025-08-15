/**
 * Получение обрезанной строки
 *
 * @param text строка для обрезки
 * @param length количество символов
 */
export function getSlicedString(text: string, length: number) {
  const str = text.trim();

  if (!str) {
    return '';
  }

  if (str.length > length) {
    return str
      .slice(0, length - 3)
      .trim()
      .concat('...');
  }

  return str;
}
