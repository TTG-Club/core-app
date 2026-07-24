/** Соответствие клавиш латинской раскладки QWERTY русской ЙЦУКЕН. */
const QWERTY_TO_RUSSIAN: Record<string, string> = {
  'q': 'й',
  'w': 'ц',
  'e': 'у',
  'r': 'к',
  't': 'е',
  'y': 'н',
  'u': 'г',
  'i': 'ш',
  'o': 'щ',
  'p': 'з',
  '[': 'х',
  ']': 'ъ',
  'a': 'ф',
  's': 'ы',
  'd': 'в',
  'f': 'а',
  'g': 'п',
  'h': 'р',
  'j': 'о',
  'k': 'л',
  'l': 'д',
  ';': 'ж',
  "'": 'э',
  'z': 'я',
  'x': 'ч',
  'c': 'с',
  'v': 'м',
  'b': 'и',
  'n': 'т',
  'm': 'ь',
  ',': 'б',
  '.': 'ю',
  '`': 'ё',
};

/** Обратное соответствие: русская раскладка ЙЦУКЕН к латинской QWERTY. */
const RUSSIAN_TO_QWERTY: Record<string, string> = Object.fromEntries(
  Object.entries(QWERTY_TO_RUSSIAN).map(([latin, cyrillic]) => [
    cyrillic,
    latin,
  ]),
);

/**
 * Перевод текста, набранного не в той раскладке клавиатуры, в противоположную:
 * латиница превращается в кириллицу по позициям клавиш и наоборот. Символы без
 * пары остаются как есть; сопоставимые клавиши возвращаются в нижнем регистре,
 * поэтому функция подходит для регистронезависимого поиска.
 *
 * @param text исходная строка в любой раскладке.
 * @returns строка, «перенабранная» в противоположной раскладке.
 */
export function convertKeyboardLayout(text: string): string {
  let result = '';

  for (const char of text) {
    const lowerChar = char.toLowerCase();

    result +=
      QWERTY_TO_RUSSIAN[lowerChar] ?? RUSSIAN_TO_QWERTY[lowerChar] ?? char;
  }

  return result;
}
