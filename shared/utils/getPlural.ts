/**
 * Получение правильного окончания слова в зависимости от числа (пример: 1 день, 2 дня, 5 дней).
 *
 * @param {number} number - Число перед словом с окончанием.
 * @param {[string, string, string]} strings - Варианты окончаний слов (для чисел 1, 2, 5).
 * @returns {string}
 */
export function getPlural(
  number: number,
  strings: [string, string, string],
): string {
  const pluralRules = new Intl.PluralRules('ru-RU');
  const rule = pluralRules.select(Math.abs(number));

  const forms: Record<Intl.LDMLPluralRule, string> = {
    zero: strings[2], // 0 дней
    one: strings[0], // 1 день
    two: strings[1], // 2 дня
    few: strings[1], // 2 дня
    many: strings[2], // 5 дней
    other: strings[1], // Для дробных чисел, например, 1.5 дня
  };

  return forms[rule];
}
