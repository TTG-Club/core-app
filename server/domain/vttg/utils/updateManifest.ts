// Отступы вокруг значения не выделяем отдельным квантификатором (ESLint резонно
// ругается на неоднозначность с `.*`) — значение всё равно тримит `unquote`.

/** Строка корневого поля манифеста: `version: 0.9.273`. */
const ROOT_FIELD_LINE = /^([a-z][\w-]*):(.*)$/i;

/** Первая строка элемента списка: `  - url: VTTG-Setup-0.9.273.exe`. */
const LIST_ITEM_LINE = /^[ \t]+-[ \t]+([a-z][\w-]*):(.*)$/i;

/** Продолжение элемента списка: `    size: 1234567`. */
const NESTED_FIELD_LINE = /^[ \t]+([a-z][\w-]*):(.*)$/i;

/** Снимает окружающие кавычки со скалярного значения YAML. */
function unquote(value: string): string {
  const trimmed = value.trim();

  const isQuoted =
    trimmed.length > 1
    && ((trimmed.startsWith("'") && trimmed.endsWith("'"))
      || (trimmed.startsWith('"') && trimmed.endsWith('"')));

  return isQuoted ? trimmed.slice(1, -1) : trimmed;
}

/**
 * Разбирает манифест обновлений electron-builder (`latest.yml`) в обычный объект.
 *
 * Полноценный YAML-парсер (и новая зависимость ради него) не нужны: форма
 * манифеста фиксирована — скалярные поля в корне плюс список `files` с отступом.
 * Поэтому читаем построчно и отдаём «сырой» объект: за корректность полей
 * отвечает схема потребителя, а не парсер, поэтому всё непонятное молча
 * пропускается.
 *
 * @param source содержимое `latest.yml`.
 */
export function parseUpdateManifest(source: string): Record<string, unknown> {
  const fields: Record<string, string> = {};
  const lists: Record<string, Array<Record<string, string>>> = {};

  let currentList: Array<Record<string, string>> | null = null;
  let currentItem: Record<string, string> | null = null;

  for (const rawLine of source.split(/\r?\n/)) {
    // Хвостовые пробелы и `\r` (манифест собирается на Windows) ломают якорь `$`
    // в регулярках, поэтому обрезаем их, сохраняя ведущий отступ.
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const [, itemKey, itemValue] = line.match(LIST_ITEM_LINE) ?? [];

    if (itemKey !== undefined) {
      if (currentList) {
        currentItem = { [itemKey]: unquote(itemValue ?? '') };
        currentList.push(currentItem);
      }

      continue;
    }

    const [, nestedKey, nestedValue] = line.match(NESTED_FIELD_LINE) ?? [];

    if (nestedKey !== undefined) {
      if (currentItem) {
        currentItem[nestedKey] = unquote(nestedValue ?? '');
      }

      continue;
    }

    const [, rootKey, rootValue] = line.match(ROOT_FIELD_LINE) ?? [];

    if (rootKey === undefined) {
      continue;
    }

    const value = unquote(rootValue ?? '');

    currentItem = null;

    if (value) {
      currentList = null;
      fields[rootKey] = value;

      continue;
    }

    // Пустое значение у корневого ключа — дальше идёт вложенный блок (`files:`).
    currentList = [];
    lists[rootKey] = currentList;
  }

  return { ...fields, ...lists };
}
