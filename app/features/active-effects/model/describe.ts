/**
 * Авто-описание активного эффекта и его частей.
 *
 * Части (модификатор, флаг, урон, длительность, Сл, состояние) собирают и
 * живую сводку формы (`scenario.ts`), и описание эффекта в карточках листа
 * (`describeActiveEffect`). Фразы те же, что у системы, — сводка на сайте и в
 * VTTG читается одинаково.
 *
 * Зеркало: dnd5-test-migrate/src/engine/activeEffectDescribe.ts
 */

import type {
  CreatureTypeCondition,
  CreatureTypeConditionSubject,
} from './creatureTypeCondition';
import type { EffectFormLayout, InertEffectField } from './layout';
import type { SaveAbilityChoice } from './saveAbilities';
import type { SaveDcSource } from './saveDc';
import type {
  ActiveEffect,
  EffectChange,
  EffectDamagePart,
  EffectDuration,
  EffectHealKind,
  EffectLight,
  EffectSave,
  EffectSaveOverride,
} from './types';

import { upperFirst } from 'es-toolkit';

import { labelDamageFormulaStatusTerms } from '~ui/damage-formula';

import { isDiceFormulaValue } from './changeDice';
import { splitQuotedList } from './conditionSyntax';
import {
  ACTIVE_EFFECT_LABELS,
  DEFAULT_EFFECT_TURN_ANCHOR,
  DEFAULT_EFFECT_TURN_TIMING,
  EFFECT_ABILITY_OPTIONS,
  EFFECT_APPLIER_DC_SHORT_LABELS,
  EFFECT_APPLY_SAVE_SUCCESS_LABELS,
  EFFECT_AREA_TRIGGER_LABELS,
  EFFECT_ATTACK_TRIGGER_LABELS,
  EFFECT_AURA_TARGET_SCENARIO_LABELS,
  EFFECT_CARRIER_SPECIES_CONDITION_PREFIX,
  EFFECT_CARRIER_SPECIES_NOT_CONDITION_PREFIX,
  EFFECT_CHANGE_MODE_LABELS,
  EFFECT_CHOICE_LIST_PHRASES,
  EFFECT_CONDITION_EXPR_SUGGESTIONS,
  EFFECT_CONDITION_NAMES,
  EFFECT_CREATURE_CATEGORY_OPTIONS,
  EFFECT_CREATURE_TYPE_SUBJECT_LABELS,
  EFFECT_CREATURE_TYPE_SUBJECT_SEPARATOR,
  EFFECT_DAMAGE_TYPE_SHORT_LABELS,
  EFFECT_DELIVERY_HINTS,
  EFFECT_FLAG_LABELS,
  EFFECT_HEAL_KIND_LABELS,
  EFFECT_INERT_FIELD_NAMES,
  EFFECT_INERT_FIELDS_LABELS,
  EFFECT_INERT_FIELDS_SEPARATOR,
  EFFECT_INERT_FIELDS_TERMINATOR,
  EFFECT_LIGHT_PHRASES,
  EFFECT_MODIFIERS_STEP_LABELS,
  EFFECT_PHRASE_PARTS,
  EFFECT_RECURRING_DAMAGE_SAVE_SUCCESS_LABELS,
  EFFECT_SAVE_ABILITY_CHOICE_JOINER,
  EFFECT_SAVE_DAMAGE_TYPE_CONDITION_PREFIX,
  EFFECT_SAVE_OVERRIDE_PERIOD_PHRASES,
  EFFECT_SAVE_OVERRIDE_PHRASES,
  EFFECT_SAVE_OVERRIDE_TIMES_FORMS,
  EFFECT_SAVE_SOURCE_CONDITION_PHRASES,
  EFFECT_SAVE_SPELL_SCHOOL_CONDITION_PREFIX,
  EFFECT_SAVE_TIMING_LABELS,
  EFFECT_SPECIES_CONDITION_PHRASES,
  EFFECT_SPELL_SCHOOL_OPTIONS,
  EFFECT_SPELL_ZONE_DELIVERY_HINT,
  EFFECT_TARGET_KEY_SUGGESTIONS,
  EFFECT_TARGET_SPECIES_CONDITION_PREFIX,
  EFFECT_TARGET_SPECIES_NOT_CONDITION_PREFIX,
  EFFECT_USE_DELIVERY_HINTS,
  isEffectConditionKey,
  isEffectDamageType,
  splitConditionParts,
} from './constants';
import {
  parseCreatureTypeCondition,
  splitCreatureTypeList,
} from './creatureTypeCondition';
import { renderReadableFormula } from './formula';
import { APPLIER_SAVE_DC } from './layout';
import { listSaveAbilities } from './saveAbilities';
import { MIN_EFFECT_LIGHT_FEET } from './types';
import { describeChangeOptionValue } from './weaponOverrides';

/**
 * Собирает карту «значение → подпись» из списка опций.
 *
 * @param options список опций справочника.
 * @returns карта подписей.
 */
function toLabelMap(
  options: ReadonlyArray<{ value: string; label: string }>,
): Map<string, string> {
  return new Map(options.map((option) => [option.value, option.label]));
}

/** Подпись ключа модификатора (`armorClass` → «Класс доспеха (AC)»). */
const TARGET_LABELS = toLabelMap(EFFECT_TARGET_KEY_SUGGESTIONS);

/** Подпись кода-условия (`roll.hasAdvantage === true` → «Бросок: …»). */
const CONDITION_LABELS = toLabelMap(EFFECT_CONDITION_EXPR_SUGGESTIONS);

/** Подпись характеристики спасброска. */
const ABILITY_LABELS = toLabelMap(EFFECT_ABILITY_OPTIONS);

/** Подпись типа существа (`humanoid` → «Гуманоид»). */
const CREATURE_TYPE_LABELS = toLabelMap(EFFECT_CREATURE_CATEGORY_OPTIONS);

/** Подпись школы магии (`divination` → «Прорицание»). */
const SPELL_SCHOOL_LABELS = toLabelMap(EFFECT_SPELL_SCHOOL_OPTIONS);

/** Короткие подписи @-токенов в формулах значений модификаторов. */
const VALUE_TOKEN_LABELS: Record<string, string> = {
  '@mod.spell': 'мод. закл. характеристики',
  '@mod.str': 'мод. Силы',
  '@mod.dex': 'мод. Ловкости',
  '@mod.con': 'мод. Телосложения',
  '@mod.int': 'мод. Интеллекта',
  '@mod.wis': 'мод. Мудрости',
  '@mod.cha': 'мод. Харизмы',
  '@str': 'значение Силы',
  '@dex': 'значение Ловкости',
  '@con': 'значение Телосложения',
  '@int': 'значение Интеллекта',
  '@wis': 'значение Мудрости',
  '@cha': 'значение Харизмы',
  '@prof': 'бонус мастерства',
  '@level': 'уровень',
  '@classLevel': 'уровень в классе',
  '@speed.walk': 'скорость ходьбы',
  '@speed.fly': 'скорость полёта',
  '@speed.swim': 'скорость плавания',
  '@speed.climb': 'скорость лазания',
  '@speed.burrow': 'скорость копания',
  '@damage': 'урон события',
  '@spellDc': 'Сл заклинаний',
  '@castLevel': 'круг ячейки',
  '@roll': 'сохранённый бросок',
  '@hitDice.left': 'непотраченные кости хитов',
  '@hp.temp': 'текущие временные хиты',
  // Потраченное ценой ресурсом
  '@paid.slotLevel': 'круг потраченной ячейки',
  '@paid.hitDice': 'число потраченных костей хитов',
  '@paid.hitDie': 'грань потраченных костей хитов',
  '@paid.hitDiceRoll': 'бросок потраченных костей хитов',
  '@paid.counter': 'потрачено единиц счётчика',
  '@paid.itemUses': 'потрачено зарядов',
};

/** Токен формулы: `@prof`, `@mod.wis`, `@paid.slotLevel`. */
const FORMULA_VARIABLE_TOKEN_PATTERN = /@[a-z][\w.]*/gi;

/** Токен типа урона в формуле: `@dmg.fire`. */
const DAMAGE_TYPE_TOKEN_PREFIX_PATTERN = /@dmg\./i;

/**
 * Токен условия в формуле: по цели (`@target.full`) или по состоянию стороны
 * (`@self.status.bloodied`).
 */
const CONDITION_TOKEN_PREFIX_PATTERN = /@(?:target\.|self\.status\.)/i;

/**
 * Подписи условия по цели в формуле урона: токен `@target.full` или
 * `@target.notFull`.
 */
const DAMAGE_TARGET_LABELS: Record<string, string> = {
  full: 'по цели с полным HP',
  notFull: 'по раненой цели',
};

/**
 * Токен лечения: `@heal` (хиты) или `@heal.temp` (временные хиты). Хвост
 * запрещён: `@heal.spell` лечением не считается. Правило то же, что у системы
 * (`HEAL_TOKEN_REGEX`), — и для описания, и для переноса легаси-типа урона.
 */
const HEAL_TOKEN_PATTERN = /@heal(\.temp)?(?![\w.])/i;

/** Формы единиц длительности для плюрализации. */
const DURATION_FORMS: Record<string, [string, string, string]> = {
  rounds: ['раунд', 'раунда', 'раундов'],
  minutes: ['минуту', 'минуты', 'минут'],
  hours: ['час', 'часа', 'часов'],
  days: ['день', 'дня', 'дней'],
};

/**
 * Проверяет, что строка — «голое» число с необязательным знаком.
 *
 * @param value строка значения.
 * @returns `true`, если это число.
 */
function isNumeric(value: string): boolean {
  return /^[+-]?\d+(?:\.\d+)?$/.test(value.trim());
}

/**
 * Русское название состояния по ключу.
 *
 * @param conditionKey ключ состояния.
 * @returns название; незнакомый ключ отдаётся как есть.
 */
export function describeConditionName(conditionKey: string): string {
  const conditionName = isEffectConditionKey(conditionKey)
    ? EFFECT_CONDITION_NAMES[conditionKey]
    : undefined;

  return conditionName ?? conditionKey;
}

/**
 * Подпись типа существа (`humanoid` → «Гуманоид»).
 *
 * @param creatureType ключ типа существа.
 * @returns подпись; незнакомый ключ отдаётся как есть.
 */
export function describeCreatureType(creatureType: string): string {
  return CREATURE_TYPE_LABELS.get(creatureType) ?? creatureType;
}

/**
 * Типы существ словами: «Нежить или Исчадие», а «не из списка» — «не Нежить и
 * не Исчадие».
 *
 * @param types ключи типов.
 * @param negate «не из списка».
 * @returns подпись; незнакомый ключ отдаётся как есть.
 */
function describeCreatureTypes(
  types: readonly string[],
  negate: boolean,
): string {
  if (!negate) {
    return types.map(describeCreatureType).join(EFFECT_PHRASE_PARTS.orJoiner);
  }

  return types
    .map(
      (creatureType) =>
        `${EFFECT_PHRASE_PARTS.notPrefix}${describeCreatureType(creatureType)}`,
    )
    .join(EFFECT_PHRASE_PARTS.andJoiner);
}

/**
 * Список типов существ из условия словами: «undead, fiend» → «Нежить или
 * Исчадие».
 *
 * @param listText ключи типов через запятую.
 * @param negate «не из списка».
 * @returns подпись; незнакомый ключ отдаётся как есть.
 */
export function describeCreatureTypeList(
  listText: string,
  negate: boolean,
): string {
  return describeCreatureTypes(splitCreatureTypeList(listText), negate);
}

/**
 * Условие по типу существа словами: «Цель — Нежить или Исчадие», «Носитель —
 * не Конструкт и не Нежить».
 *
 * @param subject о ком условие.
 * @param condition типы и отрицание.
 * @returns подпись.
 */
export function describeCreatureTypeCondition(
  subject: CreatureTypeConditionSubject,
  condition: CreatureTypeCondition,
): string {
  // Список из выбора владельца: «Цель — тип из выбора владельца (ключ)»
  if (condition.choiceKey) {
    const choiceLabel = condition.negate
      ? EFFECT_CHOICE_LIST_PHRASES.excluded
      : EFFECT_CHOICE_LIST_PHRASES.included;

    return `${EFFECT_CREATURE_TYPE_SUBJECT_LABELS[subject]}${EFFECT_CREATURE_TYPE_SUBJECT_SEPARATOR}${choiceLabel} (${condition.choiceKey})`;
  }

  const typesText = describeCreatureTypes(condition.types, condition.negate);

  return `${EFFECT_CREATURE_TYPE_SUBJECT_LABELS[subject]}${EFFECT_CREATURE_TYPE_SUBJECT_SEPARATOR}${typesText}`;
}

/**
 * Подпись характеристики (`strength` → «Сила»).
 *
 * @param ability ключ характеристики.
 * @returns подпись; незнакомый ключ отдаётся как есть.
 */
export function describeAbilityName(ability: string): string {
  return ABILITY_LABELS.get(ability) ?? ability;
}

/**
 * Характеристики спасброска словами: «Сила или Ловкость».
 *
 * @param save спасбросок с характеристиками на выбор.
 * @returns подпись.
 */
export function describeSaveAbilities(save: SaveAbilityChoice): string {
  return listSaveAbilities(save)
    .map(describeAbilityName)
    .join(EFFECT_SAVE_ABILITY_CHOICE_JOINER);
}

/**
 * Краткая подпись типа урона для фраз: `poison` → «ядом».
 *
 * @param damageType ключ типа урона.
 * @returns подпись; незнакомый ключ отдаётся как есть.
 */
export function describeDamageTypeShort(damageType: string): string {
  return isEffectDamageType(damageType)
    ? EFFECT_DAMAGE_TYPE_SHORT_LABELS[damageType]
    : damageType;
}

/**
 * Подпись ключа модификатора (`armorClass` → «Класс доспеха (AC)»).
 *
 * @param key ключ строки модификатора.
 * @returns подпись; незнакомый ключ отдаётся как есть.
 */
export function describeEffectChangeKey(key: string): string {
  return TARGET_LABELS.get(key) ?? key;
}

/**
 * Подпись флага эффекта (`attack.disadvantage` → «Помеха на все атаки»).
 *
 * @param flag ключ флага.
 * @returns подпись; незнакомый флаг отдаётся как есть.
 */
export function describeEffectFlag(flag: string): string {
  return EFFECT_FLAG_LABELS[flag] ?? flag;
}

/**
 * Подпись Сл спасброска: формула словами («Сл 8 + бонус мастерства + мод.
 * Силы»), `0` у эффектов заклинаний и действий — «Сл заклинателя».
 *
 * @param save Сл из эффекта.
 * @returns подпись сложности.
 */
export function formatEffectSaveDc(save: SaveDcSource): string {
  if (save.dcFormula) {
    return `${EFFECT_PHRASE_PARTS.saveDcPrefix}${prettifyFormula(save.dcFormula)}`;
  }

  return save.dc === APPLIER_SAVE_DC
    ? EFFECT_APPLIER_DC_SHORT_LABELS.spell
    : `${EFFECT_PHRASE_PARTS.saveDcPrefix}${save.dc}`;
}

/**
 * Подпись спасброска против урона каждый ход: «спасбросок (Телосложение,
 * Сл 13), при успехе без урона».
 *
 * @param save спасбросок против урона.
 * @returns подпись.
 */
function describeRecurringDamageSave(save: EffectSave): string {
  return `${EFFECT_PHRASE_PARTS.savePrefix}(${describeSaveAbilities(save)}, ${formatEffectSaveDc(save)}), ${EFFECT_RECURRING_DAMAGE_SAVE_SUCCESS_LABELS[save.onSuccess]}`;
}

/**
 * Подпись переменной формулы (`@prof` → «бонус мастерства»).
 *
 * @param token переменная с `@`.
 * @returns подпись; незнакомая переменная отдаётся как есть.
 */
function labelFormulaVariable(token: string): string {
  return VALUE_TOKEN_LABELS[token] ?? token;
}

/**
 * Формула с подписями вместо токенов: «круг потраченной ячейки», а не сырой
 * `@paid.slotLevel`. Числа, кости и незнакомые токены остаются как есть.
 *
 * @param formula формула.
 * @returns формула словами.
 */
export function labelFormulaVariables(formula: string): string {
  return formula.replaceAll(
    FORMULA_VARIABLE_TOKEN_PATTERN,
    labelFormulaVariable,
  );
}

/**
 * Арифметика словами: разбираемая формула читается целиком — `floor`/`min`
 * словами, а не кодом; кости с переменными — заменой токенов.
 *
 * @param formula формула без токенов урона.
 * @returns читаемая запись.
 */
function prettifyArithmetic(formula: string): string {
  return (
    renderReadableFormula(formula, labelFormulaVariable)
    ?? labelFormulaVariables(formula)
  );
}

/**
 * Формула словами. Формула с токенами урона, лечения или цели описывается как
 * часть урона, прочая — как арифметика.
 *
 * @param value формула или значение модификатора.
 * @returns читаемая запись без сырых токенов.
 */
function prettifyFormula(value: string): string {
  const hasDamageTokens =
    DAMAGE_TYPE_TOKEN_PREFIX_PATTERN.test(value)
    || HEAL_TOKEN_PATTERN.test(value)
    || CONDITION_TOKEN_PREFIX_PATTERN.test(value);

  return hasDamageTokens
    ? describeEffectDamageParts([{ formula: value }])
    : prettifyArithmetic(value);
}

/**
 * Форматирует значение одного модификатора в духе «+5 фт» или «×2».
 *
 * Режим подписывается своим словом, а не сводится к прибавке: «заменить 60» и
 * «+60» дают разный итог.
 *
 * @param change изменение эффекта.
 * @returns подпись значения.
 */
function describeChangeValue(change: EffectChange): string {
  const unit = change.key.startsWith('movement.')
    ? EFFECT_PHRASE_PARTS.feetSuffix
    : '';

  // Характеристика и тип урона оружия, тип урона заклинаний — слова из
  // списка, а не формула
  const optionLabel = describeChangeOptionValue(change.key, change.value);

  if (optionLabel) {
    return `${EFFECT_CHANGE_MODE_LABELS[change.mode].toLowerCase()}: ${optionLabel}`;
  }

  if (change.mode === 'add') {
    if (isNumeric(change.value)) {
      const numeric = Number(change.value);
      const sign = numeric < 0 ? '−' : '+';

      return `${sign}${Math.abs(numeric)}${unit}`;
    }

    // Вычитаемая кость («−1к4» к броску) читается минусом, а не «+-1к4»
    const formula = change.value.trim();

    return formula.startsWith('-')
      ? `−${prettifyFormula(formula.slice(1).trim())}${unit}`
      : `+${prettifyFormula(formula)}${unit}`;
  }

  if (change.mode === 'multiply') {
    return `×${change.value}`;
  }

  const modeLabel = EFFECT_CHANGE_MODE_LABELS[change.mode].toLowerCase();

  return `${modeLabel} ${prettifyFormula(change.value)}${unit}`;
}

/**
 * Расшифровка значения строки для подписи под полем: «+2 + (уровень в классе /
 * 4, с округлением вниз)». Число или кость и так понятны — для них пустая
 * строка, чтобы подпись не повторяла поле.
 *
 * @param change строка модификатора.
 * @returns расшифровка либо пустая строка.
 */
export function describeEffectChangeValueHint(change: EffectChange): string {
  const trimmedValue = change.value.trim();

  const isSelfExplanatory =
    trimmedValue === ''
    || isNumeric(trimmedValue)
    || (isDiceFormulaValue(trimmedValue) && !trimmedValue.includes('@'));

  return isSelfExplanatory ? '' : describeChangeValue(change);
}

/**
 * Подпись под полем значения строки: «Значение: …» с формулой словами.
 *
 * @param change строка модификатора.
 * @returns подпись либо `undefined`, если значение понятно и так.
 */
export function describeEffectChangeValueLabel(
  change: EffectChange,
): string | undefined {
  const readableValue = describeEffectChangeValueHint(change);

  return readableValue
    ? `${ACTIVE_EFFECT_LABELS.changeValueReadablePrefix}${readableValue}`
    : undefined;
}

/**
 * Название школы магии по ключу; незнакомый ключ отдаётся как есть.
 *
 * @param schoolKey ключ школы (`divination`).
 * @returns название в нижнем регистре.
 */
function describeSpellSchoolKey(schoolKey: string): string {
  return SPELL_SCHOOL_LABELS.get(schoolKey)?.toLowerCase() ?? schoolKey;
}

/** Условия со списком в кавычках: приставка строки и фраза перед списком. */
const LIST_CONDITION_PHRASES: ReadonlyArray<{
  prefix: string;
  phrase: string;
  describeListValue?: (listValue: string) => string;
}> = [
  {
    prefix: EFFECT_SAVE_SPELL_SCHOOL_CONDITION_PREFIX,
    phrase: EFFECT_SAVE_SOURCE_CONDITION_PHRASES.spellSchool,
    describeListValue: describeSpellSchoolKey,
  },
  {
    prefix: EFFECT_SAVE_DAMAGE_TYPE_CONDITION_PREFIX,
    phrase: EFFECT_SAVE_SOURCE_CONDITION_PHRASES.damageType,
    describeListValue: describeDamageTypeShort,
  },
  {
    prefix: EFFECT_CARRIER_SPECIES_CONDITION_PREFIX,
    phrase: EFFECT_SPECIES_CONDITION_PHRASES.carrier,
  },
  {
    prefix: EFFECT_CARRIER_SPECIES_NOT_CONDITION_PREFIX,
    phrase: EFFECT_SPECIES_CONDITION_PHRASES.carrierNot,
  },
  {
    prefix: EFFECT_TARGET_SPECIES_CONDITION_PREFIX,
    phrase: EFFECT_SPECIES_CONDITION_PHRASES.target,
  },
  {
    prefix: EFFECT_TARGET_SPECIES_NOT_CONDITION_PREFIX,
    phrase: EFFECT_SPECIES_CONDITION_PHRASES.targetNot,
  },
];

/**
 * Подпись части условия со списком в кавычках: источник спасброска (школа
 * заклинания, типы урона) и вид существа. Школу, типы и вид автор вписывает
 * свои — поимённо в словаре подсказок их нет.
 *
 * @param part часть условия.
 * @returns подпись либо `undefined`, если часть другого вида.
 */
function describeListCondition(part: string): string | undefined {
  const listCondition = LIST_CONDITION_PHRASES.find((candidate) =>
    part.startsWith(candidate.prefix),
  );

  if (!listCondition) {
    return undefined;
  }

  const listValues = splitQuotedList(part.slice(listCondition.prefix.length));
  const { describeListValue } = listCondition;

  const listText = (
    describeListValue ? listValues.map(describeListValue) : listValues
  ).join(EFFECT_PHRASE_PARTS.listJoiner);

  return `${listCondition.phrase}${listText}`;
}

/**
 * Подпись условия, в том числе составного: части, соединённые `&&`, читаются
 * как «… и …». Незнакомая часть отдаётся кодом — лучше показать автору
 * непонятную строку, чем скрыть от него условие целиком.
 *
 * @param condition условие изменения.
 * @returns человекочитаемая подпись.
 */
export function describeEffectChangeCondition(condition: string): string {
  return splitConditionParts(condition)
    .map((part) => {
      // Свои значения автора — раньше словаря: иначе образец из подсказок
      // отдал бы свою подпись
      const listLabel = describeListCondition(part);

      if (listLabel) {
        return listLabel;
      }

      const knownLabel = CONDITION_LABELS.get(part);

      if (knownLabel) {
        return knownLabel;
      }

      // Список типов и «не из списка» в словаре подсказок поимённо не лежат
      const typeCondition = parseCreatureTypeCondition(part);

      return typeCondition
        ? describeCreatureTypeCondition(
            typeCondition.subject,
            typeCondition.condition,
          )
        : part;
    })
    .join(EFFECT_PHRASE_PARTS.andJoiner);
}

/**
 * Описывает один модификатор: «Класс доспеха (AC) +2 (только: …)».
 *
 * @param change изменение эффекта.
 * @returns строка описания.
 */
export function describeEffectChange(change: EffectChange): string {
  const base = `${describeEffectChangeKey(change.key)} ${describeChangeValue(change)}`;
  const condition = change.condition?.trim();

  if (!condition) {
    return base;
  }

  return `${base} (только: ${describeEffectChangeCondition(condition)})`;
}

/**
 * Вид лечения по первому токену `@heal` или `@heal.temp`.
 *
 * @param formula формула части.
 * @returns вид лечения либо `null`, если токена нет.
 */
function detectFormulaHealKind(formula: string): EffectHealKind | null {
  const match = HEAL_TOKEN_PATTERN.exec(formula);

  if (!match) {
    return null;
  }

  return match[1] ? 'temp' : 'hp';
}

/**
 * Лечит ли часть: в формуле есть токен `@heal` или `@heal.temp`. Зеркало
 * `damagePartIsHealing` системы.
 *
 * @param part часть урона или лечения.
 * @returns `true`, если часть лечит хиты или даёт временные хиты.
 */
export function isHealingDamagePart(
  part: Pick<EffectDamagePart, 'formula'>,
): boolean {
  return HEAL_TOKEN_PATTERN.test(part.formula);
}

/**
 * Вырезает токены лечения из формулы.
 *
 * @param formula формула части.
 * @returns формула без `@heal` и `@heal.temp`.
 */
function stripHealTokens(formula: string): string {
  if (!HEAL_TOKEN_PATTERN.test(formula)) {
    return formula;
  }

  return formula
    .replace(new RegExp(HEAL_TOKEN_PATTERN, 'gi'), '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Описывает части урона: «2к8 ядом + 1к6 огненный», «10 лечения». Разбирает
 * токены типа урона (`@dmg.poison`), лечения (`@heal`), условия по цели
 * (`@target.full`) и по состоянию (`@target.status.prone`) и чистит их из
 * показываемой формулы, чтобы в описании не торчали сырые токены.
 *
 * @param parts части урона эффекта.
 * @returns строка описания частей; пустая, если формул нет.
 */
export function describeEffectDamageParts(
  parts: ReadonlyArray<EffectDamagePart>,
): string {
  return parts
    .filter((part) => part.formula.trim())
    .map((part) => {
      const formula = part.formula.trim();
      const damageToken = /@dmg\.([a-z]+)/i.exec(formula);
      const typeKey = part.type ?? damageToken?.[1];

      const typeLabel = typeKey ? ` ${describeDamageTypeShort(typeKey)}` : '';
      const healKind = detectFormulaHealKind(formula);

      const healLabel = healKind ? ` ${EFFECT_HEAL_KIND_LABELS[healKind]}` : '';

      // Слагаемые по состоянию подписываются на месте: «2к6 (цель: Лежащий
      // ничком)» — токен относится к своему слагаемому, а не ко всей части
      const labelledFormula = labelDamageFormulaStatusTerms(formula);
      const targetToken = /@target\.(\w+)/.exec(labelledFormula);

      const targetLabel = targetToken?.[1]
        ? ` (${DAMAGE_TARGET_LABELS[targetToken[1]] ?? targetToken[1]})`
        : '';

      const cleanFormula = prettifyArithmetic(
        stripHealTokens(labelledFormula)
          .replace(/@dmg\.[a-z]+/gi, '')
          .replace(/@target\.\w+/gi, '')
          .trim(),
      );

      return `${cleanFormula}${typeLabel}${healLabel}${targetLabel}`;
    })
    .join(' + ');
}

/**
 * Описывает длительность: «на 1 раунд», «постоянно», «до конца следующего хода».
 *
 * @param duration длительность эффекта.
 * @param turnCurrent срок по ходу кончается с концом ТЕКУЩЕГО хода якоря.
 * @returns подпись либо `null`, если сказать нечего («особое», пустое число).
 */
export function describeEffectDuration(
  duration: EffectDuration,
  turnCurrent = false,
): string | null {
  if (duration.type === 'permanent') {
    return 'постоянно';
  }

  if (duration.type === 'turn') {
    const when =
      (duration.turnTiming ?? DEFAULT_EFFECT_TURN_TIMING) === 'end'
        ? 'конца'
        : 'начала';

    const whose =
      (duration.turnAnchor ?? DEFAULT_EFFECT_TURN_ANCHOR) === 'source'
        ? 'источника'
        : 'носителя';

    // «До конца текущего хода»: наложенный в ход якоря кончается с ним
    const which = turnCurrent && when === 'конца' ? 'текущего' : 'следующего';

    return `до ${when} ${which} хода ${whose}`;
  }

  const forms = DURATION_FORMS[duration.type];
  const value = duration.value ?? 0;

  if (!forms || value <= 0) {
    return null;
  }

  return `на ${value} ${getPlural(value, forms)}`;
}

/**
 * Собирает человекочитаемое описание эффекта из его настроек.
 *
 * @param effect активный эффект.
 * @returns описание; пустая строка — описывать нечего.
 */
export function describeActiveEffect(effect: ActiveEffect): string {
  const clauses: string[] = [];

  for (const change of effect.changes) {
    if (change.value.trim()) {
      clauses.push(describeEffectChange(change));
    }
  }

  for (const flag of effect.flags) {
    clauses.push(describeEffectFlag(flag));
  }

  if (effect.conditionKey) {
    clauses.push(
      `${EFFECT_MODIFIERS_STEP_LABELS.conditionPrefix}${describeConditionName(effect.conditionKey)}`,
    );
  }

  if (effect.applySave) {
    const ability = describeSaveAbilities(effect.applySave);

    const onSuccess =
      EFFECT_APPLY_SAVE_SUCCESS_LABELS[effect.applySave.onSuccess];

    clauses.push(
      `${EFFECT_PHRASE_PARTS.savePrefix}(${ability}, ${formatEffectSaveDc(effect.applySave)}), ${onSuccess}`,
    );
  }

  if (effect.damageParts?.length) {
    const damage = describeEffectDamageParts(effect.damageParts);

    if (damage) {
      clauses.push(`урон при наложении: ${damage}`);
    }
  }

  if (effect.recurringDamage?.damageParts.length) {
    const damage = describeEffectDamageParts(
      effect.recurringDamage.damageParts,
    );

    const timing = EFFECT_SAVE_TIMING_LABELS[effect.recurringDamage.timing];

    if (damage) {
      const save = effect.recurringDamage.save
        ? `${EFFECT_PHRASE_PARTS.clauseJoiner}${describeRecurringDamageSave(effect.recurringDamage.save)}`
        : '';

      clauses.push(`урон каждый ход (${timing}): ${damage}${save}`);
    }
  }

  if (effect.recurringSave) {
    const ability = ABILITY_LABELS.get(effect.recurringSave.ability) ?? '';

    const timing = EFFECT_SAVE_TIMING_LABELS[effect.recurringSave.timing];

    clauses.push(
      `повторный спасбросок (${ability}, ${formatEffectSaveDc(effect.recurringSave)}) ${timing} снимает эффект`,
    );
  }

  if (effect.aura) {
    clauses.push(
      `аура ${effect.aura.radius}${EFFECT_PHRASE_PARTS.feetSuffix} (${EFFECT_AURA_TARGET_SCENARIO_LABELS[effect.aura.target]})`,
    );
  }

  if (effect.areaTrigger && effect.areaTrigger !== 'stay') {
    clauses.push(EFFECT_AREA_TRIGGER_LABELS[effect.areaTrigger].toLowerCase());
  }

  if (effect.conditionImmunities?.length) {
    const names = effect.conditionImmunities
      .map(describeConditionName)
      .join(EFFECT_PHRASE_PARTS.listJoiner);

    clauses.push(`${EFFECT_PHRASE_PARTS.immunitiesPrefix}${names}`);
  }

  if (effect.saveOverride) {
    clauses.push(describeSaveOverride(effect.saveOverride));
  }

  if (effect.light) {
    clauses.push(describeEffectLight(effect.light));
  }

  if (effect.applyOnSuccessOnly) {
    clauses.push('только при успешном спасброске');
  }

  if (effect.consumeOn) {
    clauses.push(EFFECT_ATTACK_TRIGGER_LABELS[effect.consumeOn].toLowerCase());
  }

  // Длительность идёт последней и только если есть что описывать: сама по себе
  // она ничего не рассказывает про эффект.
  const duration = describeEffectDuration(
    effect.duration,
    effect.turnCurrent === true,
  );

  if (duration && clauses.length > 0) {
    clauses.push(duration);
  }

  if (clauses.length === 0) {
    return '';
  }

  const text = upperFirst(clauses.join(EFFECT_PHRASE_PARTS.clauseJoiner));

  return text.endsWith('.') ? text : `${text}.`;
}

/**
 * Свет эффекта словами: «излучает яркий свет 20 фт и тусклый ещё 20 фт».
 *
 * @param light свет эффекта.
 * @returns фраза со строчной буквы.
 */
export function describeEffectLight(light: EffectLight): string {
  const hasBright = light.bright > MIN_EFFECT_LIGHT_FEET;

  const brightParts = hasBright
    ? [EFFECT_LIGHT_PHRASES.bright(light.bright)]
    : [];

  const dimParts =
    light.dim > MIN_EFFECT_LIGHT_FEET
      ? [
          hasBright
            ? EFFECT_LIGHT_PHRASES.dimBeyond(light.dim)
            : EFFECT_LIGHT_PHRASES.dim(light.dim),
        ]
      : [];

  return `${EFFECT_LIGHT_PHRASES.prefix}${[...brightParts, ...dimParts].join(EFFECT_PHRASE_PARTS.andJoiner)}`;
}

/**
 * «Провал в успех» словами: «провал спасброска — вместо этого успех, 3 раза
 * до долгого отдыха» или «… за ресурс «luck»».
 *
 * @param saveOverride блок эффекта.
 * @returns фраза со строчной буквы.
 */
export function describeSaveOverride(saveOverride: EffectSaveOverride): string {
  if (saveOverride.counter) {
    return `${EFFECT_SAVE_OVERRIDE_PHRASES.head}${EFFECT_SAVE_OVERRIDE_PHRASES.counter(saveOverride.counter)}`;
  }

  if (!saveOverride.limit) {
    return EFFECT_SAVE_OVERRIDE_PHRASES.head;
  }

  const { max, per } = saveOverride.limit;
  const timesText = `${max} ${getPlural(max, EFFECT_SAVE_OVERRIDE_TIMES_FORMS)}`;

  return `${EFFECT_SAVE_OVERRIDE_PHRASES.head}${EFFECT_SAVE_OVERRIDE_PHRASES.limit(timesText, EFFECT_SAVE_OVERRIDE_PERIOD_PHRASES[per])}`;
}

/**
 * Текст плашки неработающих настроек: пояснение и перечень названий через
 * запятую с точкой в конце.
 *
 * @param fields неработающие поля эффекта.
 * @returns текст плашки.
 */
export function describeInertEffectFields(
  fields: readonly InertEffectField[],
): string {
  const names = fields
    .map((field) => EFFECT_INERT_FIELD_NAMES[field])
    .join(EFFECT_INERT_FIELDS_SEPARATOR);

  return `${EFFECT_INERT_FIELDS_LABELS.description}${names}${EFFECT_INERT_FIELDS_TERMINATOR}`;
}

/**
 * Пояснение под выбором доставки. У зоны заклинания своё: она остаётся на
 * месте шаблона после применения, а не действует на существ в зоне мастера.
 *
 * @param layout доставка и место формы.
 * @returns пояснение.
 */
export function resolveEffectDeliveryHint(
  layout: Pick<EffectFormLayout, 'delivery' | 'context' | 'useActivated'>,
): string {
  if (
    layout.useActivated
    && (layout.delivery === 'carrier' || layout.delivery === 'target')
  ) {
    return EFFECT_USE_DELIVERY_HINTS[layout.delivery];
  }

  return layout.delivery === 'zone' && layout.context === 'spell'
    ? EFFECT_SPELL_ZONE_DELIVERY_HINT
    : EFFECT_DELIVERY_HINTS[layout.delivery];
}
