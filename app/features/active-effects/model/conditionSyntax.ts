/**
 * Общий синтаксис условий: список значений в кавычках и токен выбора
 * владельца — `@choice.` с ключом выбора.
 *
 * Условия эффектов пишутся строками (`target.creatureType === "undead,
 * fiend"`), и одно и то же — кавычки вокруг списка, запятая между значениями,
 * вид ключа выбора — читают словарь модификаторов, словарь срабатываний и
 * форма эффекта. Правило записи живёт здесь, в модуле без зависимостей:
 * разойдись оно по файлам, разбор и запись перестали бы понимать друг друга.
 *
 * Зеркало: dnd5-test-migrate/src/engine/conditionSyntax.ts
 */

/** Разделитель значений списка в условии. */
export const CONDITION_LIST_SEPARATOR = ',';

/** Кавычки вокруг списка. */
const LIST_QUOTES_PATTERN = /^["']|["']$/g;

/** Начало токена выбора владельца: дальше — ключ выбора. */
const CHOICE_TOKEN_PREFIX = '@choice.';

/** Из чего состоит ключ выбора: буквы, цифры, `-`, `_`, `#`, `:`. */
const CHOICE_KEY_SOURCE = String.raw`[\w#:-]+`;

/** Ключ выбора владельца целиком — проверка поля в форме эффекта. */
const CHOICE_KEY_PATTERN = new RegExp(`^${CHOICE_KEY_SOURCE}$`);

/** Значение целиком — токен выбора владельца; группа 1 — ключ. */
const CHOICE_VALUE_PATTERN = new RegExp(
  String.raw`^@choice\.(${CHOICE_KEY_SOURCE})$`,
);

/**
 * Список из условия без кавычек вокруг него.
 *
 * @param listText список после оператора условия, возможно в кавычках.
 * @returns список без крайних пробелов и кавычек.
 */
export function stripListQuotes(listText: string): string {
  return listText.trim().replace(LIST_QUOTES_PATTERN, '');
}

/**
 * Значения списка через запятую: без крайних пробелов и пустых.
 *
 * @param listText список без кавычек.
 * @returns значения по порядку записи.
 */
export function splitConditionList(listText: string): string[] {
  return listText
    .split(CONDITION_LIST_SEPARATOR)
    .map((listValue) => listValue.trim())
    .filter((listValue) => listValue.length > 0);
}

/**
 * Значения списка из условия в нижнем регистре: кавычки сняты. Так сверяются
 * свободные названия (вид существа) и ключи (школа, тип урона), записанные
 * автором.
 *
 * @param listText список после приставки условия, возможно в кавычках.
 * @returns значения в нижнем регистре, без пустых.
 */
export function splitQuotedList(listText: string): string[] {
  return splitConditionList(stripListQuotes(listText)).map((listValue) =>
    listValue.toLowerCase(),
  );
}

/**
 * Годится ли строка ключом выбора владельца: условие с негодным ключом не
 * разобралось бы обратно.
 *
 * @param choiceKey строка из поля.
 * @returns `true` для букв латиницы, цифр, `-`, `_`, `#` и `:`.
 */
export function isChoiceKey(choiceKey: string): boolean {
  return CHOICE_KEY_PATTERN.test(choiceKey);
}

/**
 * Ключ выбора владельца, если значение целиком — токен выбора.
 *
 * @param conditionValue значение условия без кавычек.
 * @returns ключ выбора либо `undefined`.
 */
export function readChoiceKey(conditionValue: string): string | undefined {
  return CHOICE_VALUE_PATTERN.exec(conditionValue.trim())?.[1];
}

/**
 * Токен выбора владельца по ключу выбора.
 *
 * @param choiceKey ключ выбора.
 * @returns токен с приставкой `@choice.`.
 */
export function writeChoiceToken(choiceKey: string): string {
  return `${CHOICE_TOKEN_PREFIX}${choiceKey}`;
}
