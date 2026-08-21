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
function parseEffectValue(value: string): number | null {
  const parsed = Number(value.trim());

  return Number.isInteger(parsed) ? parsed : null;
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
  // Условие («roll.hasAdvantage === true») лист вычислить не может: такое
  // изменение работает не всегда, а пассивный бонус — всегда.
  if (change.condition) {
    return null;
  }

  const target = EFFECT_BONUS_TARGETS[change.key];
  const mode = EFFECT_BONUS_MODES[change.mode];
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
 * Отключённый эффект пропускается целиком, как и нацеленный на кого-то другого:
 * лист считает только то, что предмет даёт своему владельцу. Признак переноса
 * при экипировке (`transfer`) здесь не смотрят — у листа для этого своё
 * условие: бонусы даёт надетый предмет, а требующий настройки — настроенный.
 *
 * @param effects активные эффекты магического предмета.
 * @returns бонусы для записи инвентаря; пустой список — считать нечего.
 */
export function toInventoryBonusesFromEffects(
  effects: ActiveEffect[],
): InventoryItemBonus[] {
  return effects
    .filter(
      (effect) =>
        !effect.disabled && effect.effectTarget !== 'target' && !effect.aura,
    )
    .flatMap((effect) =>
      effect.changes
        .map((change, index) =>
          toInventoryBonus(change, `${effect.id}:${index}`),
        )
        .filter((bonus) => bonus !== null),
    );
}
