import type { AbilityKey } from '~/shared/types';

import type {
  FeatCounter,
  FeatCounterRecovery,
  FeatCounterRestRule,
} from './mechanics';

import { clamp } from 'es-toolkit';

import { isAbilityKey } from '~/shared/types';

import {
  COUNTER_COUNT_MAX,
  COUNTER_COUNT_MIN,
  COUNTER_FIXED_MAX_MIN,
  COUNTER_FORMULA_ABILITIES,
  COUNTER_FORMULA_TOKENS,
  COUNTER_MAX_DEFAULT_ABILITY,
  COUNTER_MAX_MULTIPLIER_MAX,
  COUNTER_MAX_MULTIPLIER_MIN,
  COUNTER_MAX_NO_OFFSET,
  COUNTER_MAX_OFFSET_MAX,
  COUNTER_MAX_OFFSET_MIN,
  COUNTER_REST_AMOUNT_MIN,
  COUNTER_SHORT_REST_ONE_AMOUNT,
} from './constants';

/**
 * Максимум и восстановление ресурса в том виде, в каком их правит форма.
 *
 * Порт `counterResource.ts` системы D&D виртуального стола: максимум хранится
 * ОДНОЙ формулой (число, `@prof`, `@level`, `@classLevel`, `@mod.cha` и
 * прочие характеристики, `@mod.spell`), а форма лишь раскладывает её на понятный выбор — знать про
 * `@mod.cha` автору не нужно. Отдых описан раздельно: короткий и
 * продолжительный возвращают каждый своё — «ничего», «все заряды» или своё
 * число.
 */

/** От чего считается максимум ресурса. */
export type FeatCounterMaxSource =
  | 'fixed'
  | 'proficiency'
  | 'ability'
  | 'spellAbility'
  | 'level'
  | 'classLevel';

/** Вид максимума в форме: источник формулы либо своя формула. */
export type FeatCounterMaxKind = FeatCounterMaxSource | 'formula';

/**
 * Максимум ресурса, разобранный на выбор формы. Итог — «источник × множитель +
 * прибавка», поэтому «бонус мастерства минус один» и «пять за уровень»
 * выражаются одинаково. У «своего числа» всё число лежит в прибавке.
 */
export interface FeatCounterMaxRule {
  source: FeatCounterMaxSource;

  /** Характеристика источника `ability`; у прочих в счёт не идёт. */
  ability: AbilityKey;

  /** Прибавка к значению источника; может быть отрицательной. */
  offset: number;

  /** Множитель значения источника; единица его не меняет. */
  multiplier: number;
}

/** Целое число без знака — им записаны и своё число максимума, и множитель. */
const NUMBER_PATTERN = /^\d+$/;

/** Смещение в хвосте формулы: «@prof - 1», «@level + 2». */
const OFFSET_PATTERN = /([+-])\s*(\d+)\s*$/;

/** Умножение в формуле — ровно два множителя: «@level * 5». */
const MULTIPLICATION_OPERAND_COUNT = 2;

/**
 * Источник максимума и его множитель, отделённые от формулы. Множитель можно
 * записать с любой стороны: «5 * @level» и «@level * 5» читаются одинаково.
 *
 * @param formulaBase часть формулы без смещения.
 * @returns источник без множителя и сам множитель (нет — единица).
 */
function splitCounterMaxMultiplier(formulaBase: string): {
  source: string;
  multiplier: number;
} {
  const operands = formulaBase.split('*');

  const leftOperand = operands[0]?.trim() ?? '';
  const rightOperand = operands[1]?.trim() ?? '';

  const noMultiplier = {
    source: formulaBase,
    multiplier: COUNTER_MAX_MULTIPLIER_MIN,
  };

  if (
    operands.length !== MULTIPLICATION_OPERAND_COUNT
    || !leftOperand
    || !rightOperand
  ) {
    return noMultiplier;
  }

  if (NUMBER_PATTERN.test(rightOperand)) {
    return { source: leftOperand, multiplier: Number(rightOperand) };
  }

  if (NUMBER_PATTERN.test(leftOperand)) {
    return { source: rightOperand, multiplier: Number(leftOperand) };
  }

  return noMultiplier;
}

/**
 * Характеристика по её сокращению в формуле (`cha` → Харизма).
 *
 * @param abbreviation сокращение после `@mod.`.
 * @returns характеристика; `undefined` — сокращение незнакомое.
 */
function findFormulaAbility(abbreviation: string): AbilityKey | undefined {
  const abilityKey = Object.entries(COUNTER_FORMULA_ABILITIES).find(
    ([, formulaAbbreviation]) => formulaAbbreviation === abbreviation,
  )?.[0];

  return isAbilityKey(abilityKey) ? abilityKey : undefined;
}

/**
 * Источник максимума по токену формулы в нижнем регистре.
 *
 * @param token токен без множителя и смещения.
 * @returns источник с характеристикой; `undefined` — токен незнакомый.
 */
function toCounterMaxSource(
  token: string,
): Pick<FeatCounterMaxRule, 'source' | 'ability'> | undefined {
  const ability = COUNTER_MAX_DEFAULT_ABILITY;

  if (token === COUNTER_FORMULA_TOKENS.proficiencyBonus) {
    return { source: 'proficiency', ability };
  }

  if (token === COUNTER_FORMULA_TOKENS.level) {
    return { source: 'level', ability };
  }

  if (token === COUNTER_FORMULA_TOKENS.classLevel.toLowerCase()) {
    return { source: 'classLevel', ability };
  }

  if (token === COUNTER_FORMULA_TOKENS.spellAbilityModifier) {
    return { source: 'spellAbility', ability };
  }

  if (!token.startsWith(COUNTER_FORMULA_TOKENS.abilityModifierPrefix)) {
    return undefined;
  }

  const formulaAbility = findFormulaAbility(
    token.slice(COUNTER_FORMULA_TOKENS.abilityModifierPrefix.length),
  );

  return formulaAbility
    ? { source: 'ability', ability: formulaAbility }
    : undefined;
}

/**
 * Разбирает формулу максимума в правило формы.
 *
 * Смещение всегда в хвосте и ищется отдельно от источника: у общего разбора
 * всей строки источник и смещение перетягивают друг у друга пробелы и знак.
 *
 * @param formula формула максимума.
 * @returns правило; `undefined` — формула пуста либо написана руками и не
 *   разбирается (это «своя формула»).
 */
export function parseCounterMaxFormula(
  formula: string,
): FeatCounterMaxRule | undefined {
  const trimmedFormula = formula.trim().toLowerCase();

  if (!trimmedFormula) {
    return undefined;
  }

  const offsetMatch = OFFSET_PATTERN.exec(trimmedFormula);

  const offset = offsetMatch
    ? Number(offsetMatch[2]) * (offsetMatch[1] === '-' ? -1 : 1)
    : COUNTER_MAX_NO_OFFSET;

  const formulaBase = trimmedFormula
    .slice(0, offsetMatch?.index ?? trimmedFormula.length)
    .trim();

  const { source: sourceToken, multiplier } =
    splitCounterMaxMultiplier(formulaBase);

  // Формула из одного числа: «10» разобралось как смещение без источника
  if (!sourceToken || NUMBER_PATTERN.test(sourceToken)) {
    return {
      source: 'fixed',
      ability: COUNTER_MAX_DEFAULT_ABILITY,
      offset: sourceToken ? Number(sourceToken) * multiplier + offset : offset,
      multiplier: COUNTER_MAX_MULTIPLIER_MIN,
    };
  }

  const counterSource = toCounterMaxSource(sourceToken);

  return counterSource ? { ...counterSource, offset, multiplier } : undefined;
}

/**
 * Токен источника максимума без множителя и смещения.
 *
 * @param rule правило максимума (не «своё число»).
 * @returns `@prof`, `@level`, `@classLevel`, `@mod.spell` либо модификатор характеристики (`@mod.cha`).
 */
function toCounterMaxToken(rule: FeatCounterMaxRule): string {
  if (rule.source === 'proficiency') {
    return COUNTER_FORMULA_TOKENS.proficiencyBonus;
  }

  if (rule.source === 'level') {
    return COUNTER_FORMULA_TOKENS.level;
  }

  if (rule.source === 'classLevel') {
    return COUNTER_FORMULA_TOKENS.classLevel;
  }

  if (rule.source === 'spellAbility') {
    return COUNTER_FORMULA_TOKENS.spellAbilityModifier;
  }

  return `${COUNTER_FORMULA_TOKENS.abilityModifierPrefix}${COUNTER_FORMULA_ABILITIES[rule.ability]}`;
}

/**
 * Собирает формулу максимума из правила формы.
 *
 * @param rule правило максимума.
 * @returns формула для записи в ресурс.
 */
export function buildCounterMaxFormula(rule: FeatCounterMaxRule): string {
  // «Своё число» источника не имеет — весь его максимум лежит в прибавке
  if (rule.source === 'fixed') {
    return String(
      clamp(Math.trunc(rule.offset), COUNTER_COUNT_MIN, COUNTER_COUNT_MAX),
    );
  }

  const offset = clamp(
    Math.trunc(rule.offset),
    COUNTER_MAX_OFFSET_MIN,
    COUNTER_MAX_OFFSET_MAX,
  );

  const multiplier = clamp(
    Math.trunc(rule.multiplier),
    COUNTER_MAX_MULTIPLIER_MIN,
    COUNTER_MAX_MULTIPLIER_MAX,
  );

  const token = toCounterMaxToken(rule);

  const multipliedToken =
    multiplier > COUNTER_MAX_MULTIPLIER_MIN
      ? `${token} * ${multiplier}`
      : token;

  if (offset === COUNTER_MAX_NO_OFFSET) {
    return multipliedToken;
  }

  return `${multipliedToken} ${offset < COUNTER_MAX_NO_OFFSET ? '-' : '+'} ${Math.abs(offset)}`;
}

/**
 * Правило «отдых ничего не возвращает».
 *
 * @returns новое правило отдыха.
 */
export function createNoCounterRestRule(): FeatCounterRestRule {
  return { mode: 'NONE', amount: COUNTER_REST_AMOUNT_MIN };
}

/**
 * Правило «отдых возвращает все заряды».
 *
 * @returns новое правило отдыха.
 */
export function createFullCounterRestRule(): FeatCounterRestRule {
  return { mode: 'ALL', amount: COUNTER_REST_AMOUNT_MIN };
}

/**
 * Правила отдыха по откату одним словом — у записей, сохранённых до
 * раздельных правил. Короткий отдых в правилах короче продолжительного, поэтому
 * ресурс, который вернул короткий, продолжительный возвращает целиком.
 *
 * @param recovery откат одним словом.
 * @returns правила короткого и продолжительного отдыха.
 */
export function toCounterRestRules(recovery: FeatCounterRecovery): {
  shortRest: FeatCounterRestRule;
  longRest: FeatCounterRestRule;
} {
  if (recovery === 'SHORT_REST') {
    return {
      shortRest: createFullCounterRestRule(),
      longRest: createFullCounterRestRule(),
    };
  }

  if (recovery === 'SHORT_REST_ONE') {
    return {
      shortRest: { mode: 'AMOUNT', amount: COUNTER_SHORT_REST_ONE_AMOUNT },
      longRest: createFullCounterRestRule(),
    };
  }

  return {
    shortRest: createNoCounterRestRule(),
    longRest: createFullCounterRestRule(),
  };
}

/** Восстановление ресурса, как оно лежит в записи: раздельных правил может не быть. */
type StoredCounterRecovery = Pick<FeatCounter, 'recovery'>
  & Partial<Pick<FeatCounter, 'shortRest' | 'longRest'>>;

/**
 * Правила отдыха ресурса из записи справочника. Есть хоть одно раздельное
 * правило — недостающее читается как «ничего»: так его разбирают core-api и
 * система. Нет ни одного — правила выводятся из отката одним словом.
 *
 * @param counter откат и раздельные правила из записи.
 * @returns правила короткого и продолжительного отдыха.
 */
export function resolveCounterRestRules(
  counter: StoredCounterRecovery,
): Pick<FeatCounter, 'shortRest' | 'longRest'> {
  if (!counter.shortRest && !counter.longRest) {
    return toCounterRestRules(counter.recovery);
  }

  return {
    shortRest: counter.shortRest ?? createNoCounterRestRule(),
    longRest: counter.longRest ?? createNoCounterRestRule(),
  };
}

/**
 * Ближайший откат одним словом для потребителей, которые раздельных правил ещё
 * не читают: короткий отдых главнее — по нему и различаются три значения.
 *
 * @param shortRest правило короткого отдыха.
 * @returns откат одним словом.
 */
export function toLegacyCounterRecovery(
  shortRest: FeatCounterRestRule,
): FeatCounterRecovery {
  if (shortRest.mode === 'ALL') {
    return 'SHORT_REST';
  }

  return isCounterRestAmount(shortRest) ? 'SHORT_REST_ONE' : 'LONG_REST';
}

/**
 * Отдых возвращает своё число зарядов — тогда форма спрашивает, сколько.
 *
 * @param rule правило отдыха.
 * @returns true — режим «своё число».
 */
export function isCounterRestAmount(rule: FeatCounterRestRule): boolean {
  return rule.mode === 'AMOUNT';
}

/**
 * Правило отдыха к записи: число зарядов — целое в допустимых границах.
 *
 * @param rule правило из формы.
 * @returns правило для отправки.
 */
export function toSavedCounterRestRule(
  rule: FeatCounterRestRule,
): FeatCounterRestRule {
  return {
    mode: rule.mode,
    amount: clamp(
      Math.trunc(rule.amount),
      COUNTER_REST_AMOUNT_MIN,
      COUNTER_COUNT_MAX,
    ),
  };
}

/**
 * Вид максимума формулы для селекта.
 *
 * @param formula формула максимума.
 * @param isCustomFormulaPicked «Свою формулу» выбрали в списке: пустое поле
 *   иначе сразу читалось бы «своим числом», и вид схлопывался бы обратно.
 * @returns вид максимума.
 */
export function getCounterMaxKind(
  formula: string,
  isCustomFormulaPicked: boolean,
): FeatCounterMaxKind {
  const rule = parseCounterMaxFormula(formula);

  if (rule) {
    return rule.source;
  }

  // Пустое поле — ещё не «своя формула»: новый ресурс открывается числом
  return formula.trim() || isCustomFormulaPicked ? 'formula' : 'fixed';
}

/**
 * Формула после смены вида максимума. Характеристика, множитель и прибавка
 * переносятся, чтобы «бонус мастерства − 1» не сбрасывался при переборе
 * источников.
 *
 * @param formula текущая формула.
 * @param kind выбранный вид.
 * @returns новая формула.
 */
export function switchCounterMaxKind(
  formula: string,
  kind: FeatCounterMaxKind,
): string {
  // «Своя формула» начинается с пустого поля: подставленный `@prof`
  // прочитался бы обратно как «бонус мастерства», и вид тут же сменился бы
  if (kind === 'formula') {
    return '';
  }

  const rule = parseCounterMaxFormula(formula);

  if (kind === 'fixed') {
    // Число и прибавка живут в одном поле правила, но значат разное: «своё
    // число» с прибавкой −1 стало бы ресурсом на минус один заряд
    const fixedAmount =
      rule?.source === 'fixed' ? rule.offset : COUNTER_COUNT_MIN;

    return buildCounterMaxFormula({
      source: 'fixed',
      ability: COUNTER_MAX_DEFAULT_ABILITY,
      offset: Math.max(fixedAmount, COUNTER_FIXED_MAX_MIN),
      multiplier: COUNTER_MAX_MULTIPLIER_MIN,
    });
  }

  const isFromFixed = !rule || rule.source === 'fixed';

  return buildCounterMaxFormula({
    source: kind,
    ability: rule?.ability ?? COUNTER_MAX_DEFAULT_ABILITY,
    offset: isFromFixed ? COUNTER_MAX_NO_OFFSET : rule.offset,
    multiplier: isFromFixed ? COUNTER_MAX_MULTIPLIER_MIN : rule.multiplier,
  });
}

/**
 * Формула после правки одного поля разобранного правила.
 *
 * @param formula текущая формула.
 * @param changes изменённые поля правила.
 * @returns новая формула; неразобранная формула остаётся как есть.
 */
export function updateCounterMaxRule(
  formula: string,
  changes: Partial<FeatCounterMaxRule>,
): string {
  const rule = parseCounterMaxFormula(formula);

  return rule ? buildCounterMaxFormula({ ...rule, ...changes }) : formula;
}
