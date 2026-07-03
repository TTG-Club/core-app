// Наивысшая допустимая глубина вложенности.
export const MAX_DEPTH = 7;

// Максимальный размер строки.
export const MAX_STRING_LENGTH = 65536;

// Первый символ маркера
export const LEADING_CHARACTER = '@';

// Заглушка ПУСТОЙ ячейки таблицы: zero-width space (U+200B). НЕ вырезается
// String.trim() (категория Cf, не WhiteSpace), поэтому `{@td …}` с пустой
// ячейкой не падает в convertMarker («must have text») и остаётся невидимой.
// Общая для сериализатора разметки и редактора (ttg-table.ts).
export const CELL_PLACEHOLDER = '\u200B';
