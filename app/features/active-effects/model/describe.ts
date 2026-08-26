/**
 * Авто-описание активного эффекта.
 *
 * Чистая функция `describeActiveEffect` собирает человекочитаемое описание из
 * настроек эффекта, переиспользуя те же подписи, что показывает форма. Нужна
 * кнопке «Сгенерировать» в редакторе: описание эффекта пишут руками реже, чем
 * настраивают поля, и оно расходится с ними.
 *
 * Зеркало `activeEffectDescribe.ts` из системы D&D. Поле `name` намеренно не
 * трогает и от рантайма не зависит — описывает только «как настроен эффект».
 */

import type { ActiveEffect, EffectChange, EffectDuration } from './types';

import { upperFirst } from 'es-toolkit';

import {
  EFFECT_ABILITY_OPTIONS,
  EFFECT_AREA_TRIGGER_OPTIONS,
  EFFECT_CHANGE_MODE_OPTIONS,
  EFFECT_CONDITION_EXPR_SUGGESTIONS,
  EFFECT_CONDITION_OPTIONS,
  EFFECT_DAMAGE_TYPE_OPTIONS,
  EFFECT_FLAG_LABELS,
  EFFECT_TARGET_KEY_SUGGESTIONS,
  splitConditionParts,
} from './constants';

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

/** Подпись режима изменения (`add` → «Добавить (+)»). */
const CHANGE_MODE_LABELS = toLabelMap(EFFECT_CHANGE_MODE_OPTIONS);

/** Подпись характеристики спасброска. */
const ABILITY_LABELS = toLabelMap(EFFECT_ABILITY_OPTIONS);

/** Подпись состояния по ключу. */
const CONDITION_NAMES = toLabelMap(EFFECT_CONDITION_OPTIONS);

/** Подпись типа урона по ключу словаря VTTG. */
const DAMAGE_TYPE_LABELS = toLabelMap(EFFECT_DAMAGE_TYPE_OPTIONS);

/** Подпись триггера области. */
const AREA_TRIGGER_LABELS = toLabelMap(EFFECT_AREA_TRIGGER_OPTIONS);

/** Подписи цели ауры (кого она задевает). */
const AURA_TARGET_LABELS: Record<string, string> = {
  allies: 'союзники',
  enemies: 'враги',
  all: 'все существа',
};

/** Подписи одноразовости на броске атаки. */
const ATTACK_TRIGGER_LABELS: Record<string, string> = {
  carrierAttack: 'снять после своей атаки',
  attackOnCarrier: 'снять после атаки по цели',
};

/** Короткие подписи @-токенов в формулах значений модификаторов. */
const VALUE_TOKEN_LABELS: Record<string, string> = {
  '@mod.spell': 'мод. закл. характеристики',
  '@mod.str': 'мод. Силы',
  '@mod.dex': 'мод. Ловкости',
  '@mod.con': 'мод. Телосложения',
  '@mod.int': 'мод. Интеллекта',
  '@mod.wis': 'мод. Мудрости',
  '@mod.cha': 'мод. Харизмы',
  '@prof': 'бонус мастерства',
  '@level': 'уровень',
  '@speed.walk': 'скорость ходьбы',
  '@speed.fly': 'скорость полёта',
  '@speed.swim': 'скорость плавания',
  '@speed.climb': 'скорость лазания',
  '@speed.burrow': 'скорость копания',
};

/** Подписи условия по цели в формуле урона (токен `@target.<условие>`). */
const DAMAGE_TARGET_LABELS: Record<string, string> = {
  full: 'по цели с полным HP',
  notFull: 'по раненой цели',
};

/** Момент периодического урона или спасброска. */
const TIMING_LABELS: Record<string, string> = {
  startOfTurn: 'в начале хода',
  endOfTurn: 'в конце хода',
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
 * Подпись Сл спасброска: `0` у эффекта заклинания означает Сл заклинателя.
 *
 * @param dc сложность спасброска.
 * @returns подпись сложности.
 */
function formatSaveDc(dc: number): string {
  return dc === 0 ? 'Сл заклинателя' : `Сл ${dc}`;
}

/**
 * Заменяет @-токены формулы на короткие русские подписи.
 *
 * @param value формула или значение модификатора.
 * @returns строка без сырых токенов.
 */
function prettifyFormula(value: string): string {
  return value.replace(
    /@[a-z.]+/gi,
    (token) => VALUE_TOKEN_LABELS[token] ?? token,
  );
}

/**
 * Форматирует значение одного модификатора в духе «+5 фт» или «×2».
 *
 * @param change изменение эффекта.
 * @returns подпись значения.
 */
function describeChangeValue(change: EffectChange): string {
  const unit = change.key.startsWith('movement.') ? ' фт' : '';

  if (change.mode === 'add') {
    if (isNumeric(change.value)) {
      const numeric = Number(change.value);
      const sign = numeric < 0 ? '−' : '+';

      return `${sign}${Math.abs(numeric)}${unit}`;
    }

    return `+${prettifyFormula(change.value)}${unit}`;
  }

  if (change.mode === 'multiply') {
    return `×${change.value}`;
  }

  const modeLabel = (
    CHANGE_MODE_LABELS.get(change.mode) ?? change.mode
  ).toLowerCase();

  return `${modeLabel} ${prettifyFormula(change.value)}${unit}`;
}

/**
 * Описывает один модификатор: «Класс доспеха (AC) +2 (только: …)».
 *
 * @param change изменение эффекта.
 * @returns строка описания.
 */
function describeChange(change: EffectChange): string {
  const keyLabel = TARGET_LABELS.get(change.key) ?? change.key;
  const base = `${keyLabel} ${describeChangeValue(change)}`;
  const condition = change.condition?.trim();

  if (!condition) {
    return base;
  }

  return `${base} (только: ${describeCondition(condition)})`;
}

/**
 * Подпись условия, в том числе составного: части, соединённые `&&`, читаются
 * как «… и …». Незнакомая часть отдаётся кодом — лучше показать автору
 * непонятную строку, чем скрыть от него условие целиком.
 *
 * @param condition условие изменения.
 * @returns человекочитаемая подпись.
 */
function describeCondition(condition: string): string {
  return splitConditionParts(condition)
    .map((part) => CONDITION_LABELS.get(part) ?? part)
    .join(' и ');
}

/**
 * Описывает части урона: «2к8 Яд + 1к6 Огонь». Разбирает токены `@dmg.<тип>` и
 * `@target.<условие>` и чистит их из показываемой формулы, чтобы в описании не
 * торчали сырые токены.
 *
 * @param parts части урона эффекта.
 * @returns строка описания частей.
 */
function describeDamageParts(
  parts: ReadonlyArray<{ formula: string; type?: string }>,
): string {
  return parts
    .filter((part) => part.formula.trim())
    .map((part) => {
      const formula = part.formula.trim();
      const damageToken = /@dmg\.([a-z]+)/i.exec(formula);
      const typeKey = part.type ?? damageToken?.[1];

      const typeLabel = typeKey
        ? ` ${DAMAGE_TYPE_LABELS.get(typeKey) ?? typeKey}`
        : '';

      const targetToken = /@target\.(\w+)/.exec(formula);

      const targetLabel = targetToken?.[1]
        ? ` (${DAMAGE_TARGET_LABELS[targetToken[1]] ?? targetToken[1]})`
        : '';

      const cleanFormula = prettifyFormula(
        formula
          .replace(/@dmg\.[a-z]+/gi, '')
          .replace(/@target\.[\w.]+/gi, '')
          .trim(),
      );

      return `${cleanFormula}${typeLabel}${targetLabel}`;
    })
    .join(' + ');
}

/** Формы единиц длительности для плюрализации. */
const DURATION_FORMS: Record<string, [string, string, string]> = {
  rounds: ['раунд', 'раунда', 'раундов'],
  minutes: ['минуту', 'минуты', 'минут'],
  hours: ['час', 'часа', 'часов'],
  days: ['день', 'дня', 'дней'],
};

/**
 * Описывает длительность: «на 1 раунд», «постоянно», «до конца следующего хода».
 *
 * @param duration длительность эффекта.
 * @returns строка описания либо `undefined`, если описывать нечего.
 */
function describeDuration(duration: EffectDuration): string | undefined {
  if (duration.type === 'permanent') {
    return 'постоянно';
  }

  if (duration.type === 'turn') {
    const when = (duration.turnTiming ?? 'end') === 'end' ? 'конца' : 'начала';

    const whose =
      (duration.turnAnchor ?? 'carrier') === 'source'
        ? 'источника'
        : 'носителя';

    return `до ${when} следующего хода ${whose}`;
  }

  const forms = DURATION_FORMS[duration.type];
  const value = duration.value ?? 0;

  if (!forms || value <= 0) {
    return undefined;
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
      clauses.push(describeChange(change));
    }
  }

  for (const flag of effect.flags) {
    clauses.push(EFFECT_FLAG_LABELS[flag] ?? flag);
  }

  if (effect.conditionKey) {
    const conditionName = CONDITION_NAMES.get(effect.conditionKey);

    if (conditionName) {
      clauses.push(`состояние: ${conditionName}`);
    }
  }

  if (effect.applySave) {
    const ability = ABILITY_LABELS.get(effect.applySave.ability) ?? '';

    const onSuccess =
      effect.applySave.onSuccess === 'half'
        ? 'при успехе урон вдвое'
        : 'при успехе эффект отменяется';

    clauses.push(
      `спасбросок (${ability}, ${formatSaveDc(effect.applySave.dc)}), ${onSuccess}`,
    );
  }

  if (effect.damageParts?.length) {
    const damage = describeDamageParts(effect.damageParts);

    if (damage) {
      clauses.push(`урон при наложении: ${damage}`);
    }
  }

  if (effect.recurringDamage?.damageParts.length) {
    const damage = describeDamageParts(effect.recurringDamage.damageParts);
    const timing = TIMING_LABELS[effect.recurringDamage.timing] ?? '';

    if (damage) {
      clauses.push(`урон каждый ход (${timing}): ${damage}`);
    }
  }

  if (effect.recurringSave) {
    const ability = ABILITY_LABELS.get(effect.recurringSave.ability) ?? '';
    const timing = TIMING_LABELS[effect.recurringSave.timing] ?? '';

    clauses.push(
      `повторный спасбросок (${ability}, ${formatSaveDc(effect.recurringSave.dc)}) ${timing} снимает эффект`,
    );
  }

  if (effect.aura) {
    const auraTarget = AURA_TARGET_LABELS[effect.aura.target] ?? '';

    clauses.push(`аура ${effect.aura.radius} фт (${auraTarget})`);
  }

  if (effect.areaTrigger && effect.areaTrigger !== 'stay') {
    clauses.push(
      (AREA_TRIGGER_LABELS.get(effect.areaTrigger) ?? '').toLowerCase(),
    );
  }

  if (effect.conditionImmunities?.length) {
    const names = effect.conditionImmunities
      .map((conditionKey) => CONDITION_NAMES.get(conditionKey) ?? conditionKey)
      .join(', ');

    clauses.push(`иммунитет к состояниям: ${names}`);
  }

  if (effect.applyOnSuccessOnly) {
    clauses.push('только при успешном спасброске');
  }

  if (effect.consumeOn) {
    clauses.push(ATTACK_TRIGGER_LABELS[effect.consumeOn] ?? '');
  }

  // Длительность идёт последней и только если есть что описывать: сама по себе
  // она ничего не рассказывает про эффект.
  const duration = describeDuration(effect.duration);

  if (duration && clauses.length > 0) {
    clauses.push(duration);
  }

  if (clauses.length === 0) {
    return '';
  }

  const text = upperFirst(clauses.filter(Boolean).join('; '));

  return text.endsWith('.') ? text : `${text}.`;
}
