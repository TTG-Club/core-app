/**
 * Перевод активных эффектов VTTG в пассивные бонусы предмета инвентаря.
 *
 * Мастерская описывает влияние магического предмета на персонажа словарём VTTG
 * (`mechanics.activeEffects`), а лист считает свои значения бонусами
 * `InventoryItemBonus`. Здесь их и сводят: лист берёт из эффекта только
 * числовые изменения, попадающие в известные ему цели, — остальное (флаги,
 * ауры, урон, периодика) остаётся работой виртуального стола.
 */

import type { ActiveEffect, EffectChange } from '~active-effects/model';

import type {
  InventoryBonusMode,
  InventoryBonusTarget,
  InventoryItemBonus,
  SpeedTypeKey,
} from './types';

import { camelCase } from 'es-toolkit';

import { ABILITY_ORDER, SKILL_NAME_BY_API_KEY } from './constants';

/** Способы передвижения VTTG к ключам скоростей листа. */
const EFFECT_SPEED_KEYS: Record<string, SpeedTypeKey> = {
  walk: 'walk',
  fly: 'fly',
  swim: 'swim',
  climb: 'climb',
  burrow: 'burrow',
};

/** Цели изменений с фиксированным ключом. */
const EFFECT_FIXED_TARGETS: Record<string, InventoryBonusTarget> = {
  'armorClass': { kind: 'armor-class' },
  'initiative': { kind: 'initiative' },
  'spellSaveDC': { kind: 'spell-save-dc' },
  'attack.spell': { kind: 'spell-attack' },
  'attack.melee': { kind: 'melee-attack' },
  'attack.ranged': { kind: 'ranged-attack' },
  'proficiencyBonus': { kind: 'proficiency-bonus' },
  'hitPoints.max': { kind: 'hit-points-max' },
};

/**
 * Карта целей из пар «ключ изменения → цель». Отдельной функцией с явным типом
 * пар: у `Object.fromEntries` без него вид цели расширяется до строки, и
 * опечатка в нём прошла бы проверку типов молча.
 *
 * @param entries пары «ключ изменения → цель».
 * @returns карта целей.
 */
function toTargetMap(
  entries: Array<[string, InventoryBonusTarget]>,
): Record<string, InventoryBonusTarget> {
  return Object.fromEntries(entries);
}

/**
 * Ключ изменения VTTG → цель бонуса листа. Характеристики, спасброски, навыки и
 * скорости раскрываются из справочников листа: так карта не разъезжается с
 * набором навыков и не повторяет их русские названия.
 */
const EFFECT_BONUS_TARGETS: Record<string, InventoryBonusTarget> = {
  ...EFFECT_FIXED_TARGETS,
  ...toTargetMap(
    ABILITY_ORDER.flatMap((ability) => [
      [`ability.${ability}`, { kind: 'ability', key: ability }],
      [`save.${ability}`, { kind: 'saving-throw', key: ability }],
    ]),
  ),
  ...toTargetMap(
    Object.entries(SKILL_NAME_BY_API_KEY).map(([apiKey, skillName]) => [
      `skill.${camelCase(apiKey)}`,
      { kind: 'skill', key: skillName },
    ]),
  ),
  ...toTargetMap(
    Object.entries(EFFECT_SPEED_KEYS).map(([effectKey, speedKey]) => [
      `movement.${effectKey}`,
      { kind: 'speed', key: speedKey },
    ]),
  ),
};

/**
 * Режим изменения VTTG → режим бонуса листа. Умножения и пользовательского
 * режима в карте нет: первому в правилах предметов места нет, второй без движка
 * виртуального стола ничего не значит.
 */
const EFFECT_BONUS_MODES: Record<string, InventoryBonusMode> = {
  add: 'add',
  override: 'override',
  upgrade: 'upgrade',
  downgrade: 'downgrade',
};

/**
 * Величина изменения числом. Значение эффекта — строка, и в ней бывает формула
 * с @-переменными («@abilities.str.mod») или кость: посчитать такое лист не
 * может, и бонус из неё не выйдет.
 *
 * @param value значение изменения эффекта.
 * @returns целое число; null — значение не число.
 */
export function parseEffectValue(value: string): number | null {
  const parsed = Number(value.trim());

  return Number.isInteger(parsed) ? parsed : null;
}

/**
 * Действует ли эффект на владельца записи прямо сейчас.
 *
 * Выключенный пропускается целиком, как и нацеленный на кого-то другого и аура:
 * лист считает только то, что запись даёт своему владельцу, — ауру и чужую цель
 * отыгрывает виртуальный стол.
 *
 * @param effect активный эффект записи.
 * @returns true — эффект работает на владельца.
 */
export function isSelfAppliedEffect(effect: ActiveEffect): boolean {
  return !effect.disabled && effect.effectTarget !== 'target' && !effect.aura;
}

/**
 * Цель бонуса листа по ключу изменения эффекта.
 *
 * @param key ключ изменения (`armorClass`, `ability.strength`).
 * @returns цель бонуса; null — такой цели лист не считает.
 */
export function getEffectBonusTarget(key: string): InventoryBonusTarget | null {
  return EFFECT_BONUS_TARGETS[key] ?? null;
}

/**
 * Режим бонуса листа по режиму изменения эффекта.
 *
 * @param mode режим изменения.
 * @returns режим бонуса; null — такого режима лист не считает.
 */
export function getEffectBonusMode(mode: string): InventoryBonusMode | null {
  return EFFECT_BONUS_MODES[mode] ?? null;
}

/**
 * Бонус листа из одного изменения эффекта.
 *
 * @param change изменение эффекта.
 * @param id идентификатор строки бонуса.
 * @returns бонус предмета; null — лист такого изменения не считает.
 */
function toInventoryBonus(
  change: EffectChange,
  id: string,
): InventoryItemBonus | null {
  // Условие («без доспеха», «цель ранена») в снимок не унести: оно проверяется
  // каждый раз заново, этим занят живой путь бонусов эффектов.
  if (change.condition) {
    return null;
  }

  const target = getEffectBonusTarget(change.key);
  const mode = getEffectBonusMode(change.mode);
  const value = parseEffectValue(change.value);

  if (!target || !mode || value === null) {
    return null;
  }

  // Нулевая прибавка ничего не даёт, но занимала бы строку в сводке предмета.
  // Нулевое значение остальных режимов осмысленно: им ноль — это итог.
  if (mode === 'add' && value === 0) {
    return null;
  }

  return {
    id,
    kind: target.kind,
    key: target.key ?? '',
    value,
    mode,
    priority: change.priority,
  };
}

/**
 * Пассивные бонусы предмета из его активных эффектов.
 *
 * Признак переноса при экипировке (`transfer`) здесь не смотрят — у листа для
 * этого своё условие: бонусы даёт надетый предмет, а требующий настройки —
 * настроенный.
 *
 * @param effects активные эффекты магического предмета.
 * @returns бонусы для записи инвентаря; пустой список — считать нечего.
 */
export function toInventoryBonusesFromEffects(
  effects: ActiveEffect[],
): InventoryItemBonus[] {
  return effects
    .filter(isSelfAppliedEffect)
    .flatMap((effect) =>
      effect.changes
        .map((change, index) =>
          toInventoryBonus(change, `${effect.id}:${index}`),
        )
        .filter((bonus) => bonus !== null),
    );
}
