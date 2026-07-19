import type {
  AbilityKey,
  AbilityRow,
  Character,
  CharacterExtraHitDie,
  CharacterHitDie,
  CharacterInventorySection,
  CharacterSkill,
  CharacterSpeed,
  CharacterVision,
  PrimarySpeed,
  RollMode,
  SavingThrowRow,
  SkillRow,
  SpeedRow,
  SpeedTypeKey,
  VisionRow,
} from './types';

import {
  ABILITY_LABELS,
  ABILITY_ORDER,
  ABILITY_SHORT_LABELS,
  CARRYING_CAPACITY_MULTIPLIER,
  LEVEL_XP_THRESHOLDS,
  ROLL_MODE_DICE_NOTATION,
  SKILL_PROFICIENCY_MULTIPLIERS,
  SPEED_PRIMARY_ORDER,
  SPEED_TYPE_LABELS,
  SPEED_UNIT_SHORT_LABELS,
  VISION_LABELS,
  VISION_ORDER,
} from './constants';

/**
 * Форматирование готового бонуса со знаком.
 *
 * @param bonus значение бонуса.
 * @returns отформатированный бонус (например, '+4' или '−1').
 */
export function getFormattedBonus(bonus: number): string {
  return `${bonus < 0 ? '−' : '+'}${Math.abs(bonus)}`;
}

/**
 * Бонус мастерства персонажа по уровню.
 *
 * @param level уровень персонажа.
 * @returns бонус мастерства.
 */
export function getProficiencyBonus(level: number): number {
  return 2 + Math.floor((level - 1) / 4);
}

/**
 * Суммарный опыт, необходимый для достижения следующего уровня. Для 20-го
 * уровня возвращается порог самого 20-го уровня — выше расти некуда.
 *
 * @param level текущий уровень персонажа.
 * @returns порог опыта следующего уровня.
 */
export function getNextLevelExperience(level: number): number {
  const nextIndex = Math.min(level, LEVEL_XP_THRESHOLDS.length - 1);

  return LEVEL_XP_THRESHOLDS[nextIndex] ?? 0;
}

/**
 * Значение спасброска: модификатор характеристики плюс бонус мастерства при
 * владении.
 *
 * @param character персонаж.
 * @param ability ключ характеристики.
 * @returns значение спасброска.
 */
export function getSavingThrowValue(
  character: Character,
  ability: AbilityKey,
): number {
  const modifier = getModifier(character.abilities[ability]);

  if (!character.savingThrowProficiencies.includes(ability)) {
    return modifier;
  }

  return modifier + getProficiencyBonus(character.level);
}

/**
 * Значение навыка с учётом уровня владения.
 *
 * @param character персонаж.
 * @param skill навык персонажа.
 * @returns значение навыка.
 */
export function getSkillValue(
  character: Character,
  skill: CharacterSkill,
): number {
  const modifier = getModifier(character.abilities[skill.ability]);

  const proficiencyPart =
    getProficiencyBonus(character.level)
    * SKILL_PROFICIENCY_MULTIPLIERS[skill.proficiency];

  return modifier + Math.floor(proficiencyPart);
}

/**
 * Строки блока характеристик.
 *
 * @param character персонаж.
 * @returns строки для отображения характеристик.
 */
export function getAbilityRows(character: Character): AbilityRow[] {
  return ABILITY_ORDER.map((key) => ({
    key,
    label: ABILITY_LABELS[key],
    shortLabel: ABILITY_SHORT_LABELS[key],
    score: character.abilities[key],
    formattedModifier: getFormattedModifier(character.abilities[key]),
  }));
}

/**
 * Строки блока спасбросков.
 *
 * @param character персонаж.
 * @returns строки для отображения спасбросков.
 */
export function getSavingThrowRows(character: Character): SavingThrowRow[] {
  return ABILITY_ORDER.map((key) => {
    const value = getSavingThrowValue(character, key);

    return {
      key,
      label: `${ABILITY_SHORT_LABELS[key]}.`,
      proficient: character.savingThrowProficiencies.includes(key),
      value,
      formattedValue: getFormattedBonus(value),
    };
  });
}

/**
 * Строки списка навыков.
 *
 * @param character персонаж.
 * @returns строки для отображения навыков с пассивными значениями.
 */
export function getSkillRows(character: Character): SkillRow[] {
  return character.skills.map((skill) => {
    const value = getSkillValue(character, skill);

    return {
      name: skill.name,
      abilityLabel: ABILITY_SHORT_LABELS[skill.ability],
      proficiency: skill.proficiency,
      value,
      formattedModifier: getFormattedBonus(value),
      passiveValue: 10 + value,
    };
  });
}

/**
 * Суммарный вес инвентаря в фунтах.
 *
 * @param sections разделы инвентаря.
 * @returns суммарный вес всех предметов с учётом количества.
 */
export function getInventoryWeight(
  sections: CharacterInventorySection[],
): number {
  return sections.reduce(
    (total, section) =>
      total
      + section.items.reduce(
        (sectionTotal, inventoryItem) =>
          sectionTotal + inventoryItem.weight * inventoryItem.quantity,
        0,
      ),
    0,
  );
}

/**
 * Грузоподъёмность персонажа по значению Силы.
 *
 * @param strength значение Силы.
 * @returns грузоподъёмность в фунтах.
 */
export function getCarryingCapacity(strength: number): number {
  return strength * CARRYING_CAPACITY_MULTIPLIER;
}

/**
 * Название типа передвижения с пометкой парения для полёта.
 *
 * @param speed скорости персонажа.
 * @param key ключ типа передвижения.
 * @returns название типа передвижения.
 */
function getSpeedTypeLabel(speed: CharacterSpeed, key: SpeedTypeKey): string {
  if (key === 'fly' && speed.hover) {
    return `${SPEED_TYPE_LABELS.fly} (парение)`;
  }

  return SPEED_TYPE_LABELS[key];
}

/**
 * Основной тип передвижения: с наибольшей скоростью, при равенстве приоритет у
 * ходьбы.
 *
 * @param speed скорости персонажа.
 * @returns основной тип передвижения для плитки листа.
 */
export function getPrimarySpeed(speed: CharacterSpeed): PrimarySpeed {
  let primaryKey: SpeedTypeKey = 'walk';

  for (const key of SPEED_PRIMARY_ORDER) {
    if (speed.values[key] > speed.values[primaryKey]) {
      primaryKey = key;
    }
  }

  return {
    key: primaryKey,
    label: SPEED_TYPE_LABELS[primaryKey],
    value: speed.values[primaryKey],
    unitLabel: SPEED_UNIT_SHORT_LABELS[speed.unit],
  };
}

/**
 * Строки всех ненулевых скоростей, по убыванию значения.
 *
 * @param speed скорости персонажа.
 * @returns строки для подсказки на плитке скорости.
 */
export function getSpeedRows(speed: CharacterSpeed): SpeedRow[] {
  const unitLabel = SPEED_UNIT_SHORT_LABELS[speed.unit];

  return SPEED_PRIMARY_ORDER.filter((key) => speed.values[key] > 0)
    .map((key) => ({
      key,
      label: getSpeedTypeLabel(speed, key),
      value: speed.values[key],
      formattedValue: `${speed.values[key]} ${unitLabel}`,
    }))
    .sort((left, right) => right.value - left.value);
}

/**
 * Формула броска d20 для дайс-роллера с учётом режима, модификатора и
 * дополнительного бонуса. Использует ASCII-минус: формула передаётся в парсер.
 *
 * @param modifier модификатор проверки.
 * @param mode режим броска.
 * @param bonus дополнительный бонус.
 * @returns формула в нотации дайс-роллера (например, «2к20вл1+4»).
 */
export function getCheckFormula(
  modifier: number,
  mode: RollMode,
  bonus: number,
): string {
  const dicePart = ROLL_MODE_DICE_NOTATION[mode];
  const totalModifier = modifier + bonus;

  if (totalModifier === 0) {
    return dicePart;
  }

  const sign = totalModifier < 0 ? '-' : '+';

  return `${dicePart}${sign}${Math.abs(totalModifier)}`;
}

/**
 * Строки зрения для подсказки: обычное зрение всегда, тёмное — только при
 * ненулевой дистанции.
 *
 * @param vision зрение персонажа.
 * @returns строки для подсказки у глазка на аватаре.
 */
export function getVisionRows(vision: CharacterVision): VisionRow[] {
  const unitLabel = SPEED_UNIT_SHORT_LABELS[vision.unit];

  return VISION_ORDER.map((key) => ({
    key,
    label: VISION_LABELS[key],
    formattedValue: vision[key] > 0 ? `${vision[key]} ${unitLabel}` : null,
  })).filter((row) => row.key === 'normal' || row.formattedValue !== null);
}

/**
 * Суммарное количество костей хитов (классовых и дополнительных).
 *
 * @param hitDice кости хитов из классов.
 * @param extraHitDice дополнительные кости хитов.
 * @returns оставшееся и максимальное количество костей.
 */
export function getHitDiceTotals(
  hitDice: CharacterHitDie[],
  extraHitDice: CharacterExtraHitDie[],
): { current: number; max: number } {
  const allDice = [...hitDice, ...extraHitDice];

  return {
    current: allDice.reduce((total, hitDie) => total + hitDie.current, 0),
    max: allDice.reduce((total, hitDie) => total + hitDie.max, 0),
  };
}
