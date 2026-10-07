import type { DamageFormulaTypeChoiceMode } from './constants';

import {
  DAMAGE_FORMULA_TAG_PREFIX,
  DAMAGE_FORMULA_TYPE_CHOICE_MIN_OPTIONS,
  DAMAGE_TYPE_TAG_PREFIX,
} from './constants';

/**
 * Тип урона на выбор в формуле: токены `@dmg.choice(acid,cold,fire)` и
 * `@dmg.random(acid,cold,fire)`. Бросающий выбирает один тип из списка перед
 * броском (или он выпадает случайно), и урон идёт выбранным типом.
 *
 * Зеркало токена `@dmg.choice(...)` из `formulaTokens.ts` системы VTTG.
 */

/**
 * Исходник шаблона токена целиком — для шаблонов, которые вырезают теги из
 * формулы: без него общий шаблон тега оставил бы в костях хвост `(acid,cold)`.
 */
export const DAMAGE_FORMULA_TYPE_CHOICE_TOKEN_SOURCE = String.raw`@dmg\.(?:choice|random)\([a-z,\s]*\)`;

/** Токен типа на выбор с группами: способ выбора и список типов. */
const DAMAGE_FORMULA_TYPE_CHOICE_PATTERN =
  /@dmg\.(choice|random)\(([a-z,\s]*)\)/gi;

/** Разделитель типов в списке токена. */
const DAMAGE_FORMULA_TYPE_CHOICE_LIST_SEPARATOR = ',';

/** Способ выбора типа, при котором тип выпадает случайно. */
const DAMAGE_FORMULA_TYPE_CHOICE_RANDOM_MODE = 'random';

/** Тип урона на выбор, найденный в формуле. */
export interface DamageFormulaTypeChoice {
  /** Тип выпадает случайно, а не выбирается бросающим. */
  random: boolean;
  /** Типы урона списка в порядке записи: хвосты токенов (`acid`, `cold`). */
  damageTypes: Array<string>;
}

/**
 * Все токены типа урона на выбор в формуле, в порядке появления.
 *
 * @param formula формула части урона или её слагаемое.
 * @returns найденные выборы; пустой список — выбора типа в формуле нет.
 */
export function readDamageFormulaTypeChoices(
  formula: string,
): Array<DamageFormulaTypeChoice> {
  return [...formula.matchAll(DAMAGE_FORMULA_TYPE_CHOICE_PATTERN)].map(
    (tokenMatch) => ({
      random:
        (tokenMatch[1] ?? '').toLowerCase()
        === DAMAGE_FORMULA_TYPE_CHOICE_RANDOM_MODE,
      damageTypes: (tokenMatch[2] ?? '')
        .split(DAMAGE_FORMULA_TYPE_CHOICE_LIST_SEPARATOR)
        .map((damageType) => damageType.trim().toLowerCase())
        .filter((damageType) => damageType.length > 0),
    }),
  );
}

/**
 * Токен типа урона на выбор (`@dmg.choice(…)`) или случайного
 * (`@dmg.random(…)`) из отмеченных типов. Типы идут в порядке справочника, а
 * не отметки: один и тот же набор — один и тот же токен.
 *
 * @param mode способ выбора типа.
 * @param pickedTags отмеченные теги типов урона (`dmg.fire`).
 * @param orderedTags теги типов урона в порядке справочника.
 * @returns токен либо `undefined`, если отмечено меньше двух известных типов.
 */
export function buildDamageFormulaTypeChoiceToken(
  mode: DamageFormulaTypeChoiceMode,
  pickedTags: ReadonlyArray<string>,
  orderedTags: ReadonlyArray<string>,
): string | undefined {
  const damageTypes = orderedTags
    .filter((tag) => pickedTags.includes(tag))
    .map((tag) => tag.slice(DAMAGE_TYPE_TAG_PREFIX.length));

  return damageTypes.length >= DAMAGE_FORMULA_TYPE_CHOICE_MIN_OPTIONS
    ? `${DAMAGE_FORMULA_TAG_PREFIX}${DAMAGE_TYPE_TAG_PREFIX}${mode}(${damageTypes.join(DAMAGE_FORMULA_TYPE_CHOICE_LIST_SEPARATOR)})`
    : undefined;
}
