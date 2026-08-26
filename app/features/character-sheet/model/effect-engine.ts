/**
 * Разбор активных эффектов листа персонажа: флаги режима броска и условные
 * слагаемые урона.
 *
 * Сосед `effects.ts`, а не его замена: тот переводит числовые изменения в
 * пассивные бонусы инвентаря (класс доспеха, спасброски, навыки), и этот путь
 * остаётся. Здесь — всё, что бонусом не выражается: булевы флаги
 * («преимущество на Скрытность») и слагаемые, которые появляются только в
 * момент броска («+1к8 при дальнобойной атаке»).
 *
 * Словарь условий закрыт и повторяет `evaluateCondition` движка системы D&D:
 * условие сравнивается строкой, а не вычисляется. Выражение, которого в словаре
 * нет, считается невыполненным — эффект, «настроенный» неизвестным условием,
 * лучше не применить, чем применить всегда.
 */

import type { ActiveEffect, EffectChange } from '~active-effects/model';

import type { RollMode } from './types';

import { EFFECT_SKILL_OPTIONS } from '~active-effects/model';

/** Вид броска, для которого подбирается режим. */
export type SheetRollKind =
  | 'abilityCheck'
  | 'skill'
  | 'savingThrow'
  | 'attack'
  | 'initiative';

/** Обстоятельства броска: по ним вычисляются условия и профильные флаги. */
export interface SheetRollContext {
  /** Вид броска. */
  kind: SheetRollKind;

  /** Характеристика броска; для проверки навыка — его характеристика. */
  ability?: string;

  /** Ключ навыка — только для проверки навыка. */
  skill?: string;

  /** Категория атаки — только для броска атаки. */
  attackType?: 'melee' | 'ranged' | 'spell';

  /**
   * Бросок вызван заклинанием или иным магическим эффектом.
   *
   * Признак ситуации, а не носителя: Мантия сопротивления заклинаниям даёт
   * преимущество только на такой спасбросок и молчит на спасброске от яда.
   */
  againstMagic?: boolean;

  /** Цель уже выбрана и у неё полный запас хитов. */
  targetIsFull?: boolean;
}

/** Разобранные эффекты листа. */
export interface ResolvedSheetEffects {
  /** Флаги, действующие безусловно. */
  flags: ReadonlySet<string>;

  /** Изменения с условием — их проверяют в момент броска. */
  conditionalChanges: EffectChange[];
}

/**
 * Условия по состоянию хитов цели — словарь системы D&D дословно. Ключ
 * сравнивается целиком: это не выражение, а закрытый перечень.
 */
const TARGET_HP_CONDITIONS: Record<string, 'full' | 'notFull'> = {
  'target.hp.value === target.hp.max': 'full',
  'target.hp.value < target.hp.max': 'notFull',
};

/** Признак «значение изменения — кость, а не число». */
const DICE_VALUE_REGEX = /\d*\s*[кd]\s*\d+/i;

/**
 * Русское название навыка → его ключ в словаре эффектов.
 *
 * Строки навыков лист называет по-русски, а флаг эффекта — английским ключом
 * (`skill.stealth.advantage`). Карта собирается из общего списка навыков домена
 * эффектов, чтобы второй перечень не разъехался с первым.
 */
const SKILL_KEY_BY_NAME: Record<string, string> = Object.fromEntries(
  EFFECT_SKILL_OPTIONS.map((skill) => [skill.label, skill.value]),
);

/**
 * Ключ навыка по его русскому названию из строки листа.
 *
 * @param name название навыка.
 * @returns ключ навыка; `undefined` — свой навык игрока, флагов у него нет.
 */
export function getSkillKeyByName(name: string): string | undefined {
  return SKILL_KEY_BY_NAME[name];
}

/**
 * Разбирает эффекты в набор безусловных флагов и список условных изменений.
 *
 * Выключенный эффект и эффект, нацеленный на кого-то другого, пропускаются:
 * лист считает только то, что действует на самого персонажа.
 *
 * @param effects активные эффекты персонажа и его снаряжения.
 * @returns флаги и условные изменения.
 */
export function resolveSheetEffects(
  effects: readonly ActiveEffect[],
): ResolvedSheetEffects {
  const flags = new Set<string>();
  const conditionalChanges: EffectChange[] = [];

  for (const effect of effects) {
    if (effect.disabled || effect.effectTarget === 'target') {
      continue;
    }

    for (const flag of effect.flags) {
      flags.add(flag);
    }

    for (const change of effect.changes) {
      if (change.condition) {
        conditionalChanges.push(change);
      }
    }
  }

  return { flags, conditionalChanges };
}

/**
 * Выполняется ли условие изменения при данных обстоятельствах броска.
 *
 * @param condition условие изменения.
 * @param context обстоятельства броска.
 * @returns признак выполнения; неизвестное условие — всегда `false`.
 */
export function evaluateSheetCondition(
  condition: string,
  context: SheetRollContext,
): boolean {
  const trimmed = condition.trim();

  if (trimmed === 'roll.hasAdvantage === true') {
    return false;
  }

  if (trimmed === 'roll.hasDisadvantage === true') {
    return false;
  }

  const hpGate = TARGET_HP_CONDITIONS[trimmed];

  if (hpGate) {
    if (context.targetIsFull === undefined) {
      return false;
    }

    return hpGate === 'full' ? context.targetIsFull : !context.targetIsFull;
  }

  return false;
}

/**
 * Условные слагаемые урона для броска: значения-кости из изменений
 * `damage.melee` / `damage.ranged` / `damage.spell`, чьё условие выполнено.
 *
 * Этим и описывается «Дварфийский метатель наносит 1к8 только при
 * дальнобойной атаке»: отдельного поля условия у части урона не нужно.
 *
 * @param resolved разобранные эффекты листа.
 * @param context обстоятельства броска.
 * @returns формулы слагаемых; пустой список — добавлять нечего.
 */
export function getConditionalDamageFormulas(
  resolved: ResolvedSheetEffects,
  context: SheetRollContext,
): string[] {
  if (!context.attackType) {
    return [];
  }

  const wantedKey = `damage.${context.attackType}`;

  return resolved.conditionalChanges
    .filter(
      (change) =>
        change.key === wantedKey
        && DICE_VALUE_REGEX.test(change.value)
        && change.condition !== undefined
        && evaluateSheetCondition(change.condition, context),
    )
    .map((change) => change.value);
}

/**
 * Есть ли у персонажа флаг преимущества для этого броска.
 *
 * @param flags безусловные флаги персонажа.
 * @param context обстоятельства броска.
 * @returns признак преимущества.
 */
function hasAdvantageFlag(
  flags: ReadonlySet<string>,
  context: SheetRollContext,
): boolean {
  const { kind, ability, skill, attackType, againstMagic } = context;

  if (kind === 'attack') {
    return (
      flags.has('attack.advantage')
      || (attackType !== undefined
        && flags.has(`attack.${attackType}.advantage`))
    );
  }

  if (kind === 'initiative') {
    return (
      flags.has('initiative.advantage')
      || flags.has('abilityCheck.advantage.dexterity')
      || flags.has('abilityCheck.advantage')
    );
  }

  if (kind === 'savingThrow') {
    return (
      flags.has('save.advantage')
      || (ability !== undefined && flags.has(`save.advantage.${ability}`))
      || (againstMagic === true && flags.has('save.advantage.vsMagic'))
    );
  }

  return (
    flags.has('abilityCheck.advantage')
    || (ability !== undefined && flags.has(`abilityCheck.advantage.${ability}`))
    || (skill !== undefined && flags.has(`skill.${skill}.advantage`))
  );
}

/**
 * Есть ли у персонажа флаг помехи для этого броска.
 *
 * @param flags безусловные флаги персонажа.
 * @param context обстоятельства броска.
 * @returns признак помехи.
 */
function hasDisadvantageFlag(
  flags: ReadonlySet<string>,
  context: SheetRollContext,
): boolean {
  const { kind, ability, skill, attackType, againstMagic } = context;

  if (kind === 'attack') {
    return (
      flags.has('attack.disadvantage')
      || (attackType !== undefined
        && flags.has(`attack.${attackType}.disadvantage`))
    );
  }

  if (kind === 'initiative') {
    return (
      flags.has('initiative.disadvantage')
      || flags.has('abilityCheck.disadvantage.dexterity')
      || flags.has('abilityCheck.disadvantage')
    );
  }

  if (kind === 'savingThrow') {
    return (
      flags.has('save.disadvantage')
      || (ability !== undefined && flags.has(`save.disadvantage.${ability}`))
      || (againstMagic === true && flags.has('save.disadvantage.vsMagic'))
    );
  }

  return (
    flags.has('abilityCheck.disadvantage')
    || (ability !== undefined
      && flags.has(`abilityCheck.disadvantage.${ability}`))
    || (skill !== undefined && flags.has(`skill.${skill}.disadvantage`))
  );
}

/**
 * Режим броска по флагам персонажа. Зеркало `resolveAttackRollMode` и
 * `resolveSavingThrowRollMode` из системы D&D: преимущество и помеха взаимно
 * гасятся до обычного броска.
 *
 * @param flags безусловные флаги персонажа.
 * @param context обстоятельства броска.
 * @returns режим броска.
 */
export function getSheetRollMode(
  flags: ReadonlySet<string>,
  context: SheetRollContext,
): RollMode {
  const advantage = hasAdvantageFlag(flags, context);
  const disadvantage = hasDisadvantageFlag(flags, context);

  if (advantage && !disadvantage) {
    return 'advantage';
  }

  if (disadvantage && !advantage) {
    return 'disadvantage';
  }

  return 'normal';
}

/**
 * Автоматически проваливается ли спасбросок этой характеристики.
 *
 * @param flags безусловные флаги персонажа.
 * @param ability характеристика спасброска.
 * @returns признак автопровала.
 */
export function isSavingThrowAutoFailed(
  flags: ReadonlySet<string>,
  ability: string,
): boolean {
  return flags.has(`save.autoFail.${ability}`);
}
