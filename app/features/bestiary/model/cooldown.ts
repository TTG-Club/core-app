import { parseFormNumber } from '~active-effects/model';

/**
 * Наименьшее «раз в N ходов». Раз в ход ограничением не считается: столько
 * существо действует и без него.
 */
export const MIN_CREATURE_COOLDOWN_TURNS = 2;

/** Наибольшее «раз в N ходов» — предел, о котором договорились с VTTG и API. */
export const MAX_CREATURE_COOLDOWN_TURNS = 20;

/**
 * Название ограничения «раз в N ходов» — одно на поле записи, режим порции
 * заклинаний и подпись порции без числа.
 */
export const CREATURE_COOLDOWN_TURNS_LABEL = 'Раз в N ходов';

/**
 * «Раз в N ходов» к записи: целое от 2 до 20, всё прочее — `null`.
 *
 * Чужое число не подгоняется к пределу, а сбрасывается: «раз в 21 ход» и «раз в
 * 2,5 хода» — опечатки, и молча превращать их в другое ограничение нельзя.
 *
 * @param cooldownTurns число из формы или из ответа сервера.
 * @returns число ходов либо `null`.
 */
export function toStoredCooldownTurns(cooldownTurns: unknown): number | null {
  const turns = parseFormNumber(cooldownTurns);

  return turns !== undefined
    && Number.isInteger(turns)
    && turns >= MIN_CREATURE_COOLDOWN_TURNS
    && turns <= MAX_CREATURE_COOLDOWN_TURNS
    ? turns
    : null;
}
