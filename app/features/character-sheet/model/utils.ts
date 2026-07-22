import type {
  AbilityKey,
  AbilityRow,
  Character,
  CharacterExtraHitDie,
  CharacterFeature,
  CharacterHitDie,
  CharacterInventorySection,
  CharacterSkill,
  CharacterSpecies,
  CharacterSpeed,
  CharacterSpell,
  CharacterSpellGroup,
  CharacterVision,
  FeatureDescriptionNode,
  FeatureOrigin,
  PrimarySpeed,
  ProficiencyCatalogGroup,
  RollMode,
  SavingThrowRow,
  SkillRow,
  SpeciesFeatureSummary,
  SpeciesSummary,
  SpeedRow,
  SpeedTypeKey,
  VisionRow,
} from './types';

import { isBlockNode, isMarkerNode, parse, toMarkupSource } from '~ui/markup';

import {
  ABILITY_LABELS,
  ABILITY_ORDER,
  ABILITY_SHORT_LABELS,
  CARRYING_CAPACITY_MULTIPLIER,
  DARKVISION_PARSE_FALLBACK,
  LEVEL_XP_THRESHOLDS,
  ROLL_MODE_DICE_NOTATION,
  SIZE_LABEL_WORDS,
  SKILL_PROFICIENCY_MULTIPLIERS,
  SPEED_PARSE_FALLBACK,
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
 * Итоговый класс доспеха: базовое значение плюс модификатор выбранной
 * характеристики.
 *
 * @param character персонаж.
 * @returns итоговое значение класса доспеха.
 */
export function getArmorClassValue(character: Character): number {
  const { base, ability } = character.armorClass;

  if (!ability) {
    return base;
  }

  return base + getModifier(character.abilities[ability]);
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

/**
 * Разбор строки скорости вида (например, «30 футов, полёт 50 футов»). Первое
 * число считается скоростью ходьбы (бэкенд всегда ставит её первой), остальные
 * типы ищутся по корням слов; «парит»/«парение» включает парение.
 *
 * @param speedText строка скорости из ответа API.
 * @returns скорости персонажа в футах.
 */
export function parseSpeedFromText(speedText: string): CharacterSpeed {
  const walkMatch = /(\d+)/.exec(speedText);
  const flyMatch = /пол[её]т\D{0,12}(\d+)/i.exec(speedText);
  const climbMatch = /лазан\D{0,12}(\d+)/i.exec(speedText);
  const swimMatch = /плаван\D{0,12}(\d+)/i.exec(speedText);
  const burrowMatch = /копан\D{0,12}(\d+)/i.exec(speedText);

  return {
    values: {
      walk: walkMatch?.[1] ? Number(walkMatch[1]) : SPEED_PARSE_FALLBACK,
      fly: flyMatch?.[1] ? Number(flyMatch[1]) : 0,
      climb: climbMatch?.[1] ? Number(climbMatch[1]) : 0,
      swim: swimMatch?.[1] ? Number(swimMatch[1]) : 0,
      burrow: burrowMatch?.[1] ? Number(burrowMatch[1]) : 0,
    },
    hover: /пар(?:ит|ен)/i.test(speedText),
    unit: 'feet',
  };
}

/**
 * Разбор строки размера вида: возвращает найденные размеры в порядке каталога
 * (у видов D&D 2024 бывает выбор, например «Средний или Маленький»).
 *
 * @param sizeText строка размера из ответа API.
 * @returns найденные подписи размеров.
 */
export function parseSizeOptionsFromText(sizeText: string): string[] {
  const normalizedText = sizeText.toLowerCase();

  return SIZE_LABEL_WORDS.filter((word) =>
    normalizedText.includes(word.toLowerCase()),
  );
}

/**
 * Дистанция тёмного зрения из особенностей вида: ищется особенность с
 * упоминанием тёмного зрения, из её текста берётся первое число с футами.
 *
 * @param features особенности вида и подвида.
 * @returns дистанция в футах; 0 — тёмного зрения нет.
 */
export function getDarkvisionDistance(
  features: SpeciesFeatureSummary[],
): number {
  for (const feature of features) {
    const featureText = [feature.name, ...feature.description]
      .join(' ')
      .toLowerCase()
      .replaceAll('ё', 'е');

    if (!/темн\S*\s+зрен/.test(featureText)) {
      continue;
    }

    const distanceMatch = /(\d+)\s*фут/.exec(featureText);

    return distanceMatch?.[1]
      ? Number(distanceMatch[1])
      : DARKVISION_PARSE_FALLBACK;
  }

  return 0;
}

/**
 * Подпись круга заклинания для строки списка.
 *
 * @param level круг заклинания; 0 — заговор.
 * @returns подпись круга (например, «Заговор» или «3 круг»).
 */
export function getSpellLevelLabel(level: number): string {
  return level === 0 ? 'Заговор' : `${level} круг`;
}

/**
 * Подпись группы заклинаний одного круга для разделителя списка.
 *
 * @param level круг заклинания; 0 — заговоры.
 * @returns подпись группы (например, «Заговоры» или «3 круг»).
 */
export function getSpellGroupLabel(level: number): string {
  return level === 0 ? 'Заговоры' : `${level} круг`;
}

/**
 * Группировка заклинаний по кругам: заговоры, затем круги по возрастанию;
 * внутри круга — по алфавиту.
 *
 * @param spells заклинания книги персонажа.
 * @returns группы заклинаний с подписями для разделителей.
 */
export function getSpellGroups(
  spells: CharacterSpell[],
): CharacterSpellGroup[] {
  const sortedSpells = [...spells].sort(
    (left, right) =>
      left.level - right.level || left.name.localeCompare(right.name, 'ru'),
  );

  const groups: CharacterSpellGroup[] = [];

  for (const spell of sortedSpells) {
    const lastGroup = groups.at(-1);

    if (!lastGroup || lastGroup.level !== spell.level) {
      groups.push({
        level: spell.level,
        label: getSpellGroupLabel(spell.level),
        spells: [spell],
      });
    } else {
      lastGroup.spells.push(spell);
    }
  }

  return groups;
}

/**
 * Разбор хранимого значения редактора разметки в узлы для рендера. Значение —
 * JSON-строка массива узлов (`toStoredMarkup`) либо исходник/пустая строка;
 * сегментация повторяет форму хранения: блочные маркеры — узлами, абзацы —
 * строками.
 *
 * @param stored значение модели редактора разметки.
 * @returns узлы описания для `MarkupRender`.
 */
export function parseStoredMarkupNodes(
  stored: string,
): FeatureDescriptionNode[] {
  const sourceText = toMarkupSource(stored);

  const nodes: FeatureDescriptionNode[] = [];

  for (const segment of sourceText.split(/\n{2,}/)) {
    const text = segment.trim();

    if (!text) {
      continue;
    }

    const parsedNodes = parse(text);

    const [firstNode] = parsedNodes;

    if (
      parsedNodes.length === 1
      && isMarkerNode(firstNode)
      && isBlockNode(firstNode)
    ) {
      nodes.push(firstNode);
    } else {
      nodes.push(text);
    }
  }

  return nodes;
}

/**
 * Идентификатор особенности персонажа по происхождению и URL особенности.
 *
 * @param origin происхождение особенности.
 * @param featureUrl URL особенности из ответа API.
 * @returns устойчивый идентификатор особенности.
 */
export function getCharacterFeatureId(
  origin: FeatureOrigin,
  featureUrl: string,
): string {
  return `${origin}:${featureUrl}`;
}

/**
 * Сборка особенностей персонажа из деталей вида и подвида. Выбор игрока
 * подставляется по идентификатору особенности (`origin:url`).
 *
 * @param species деталь вида.
 * @param lineage деталь подвида; null — подвида нет.
 * @param choices выборы игрока по идентификаторам особенностей.
 * @returns особенности персонажа для вкладки «Особенности».
 */
export function buildCharacterFeatures(
  species: SpeciesSummary,
  lineage: SpeciesSummary | null,
  choices: Record<string, string>,
): CharacterFeature[] {
  const toFeatures = (
    summary: SpeciesSummary,
    origin: FeatureOrigin,
  ): CharacterFeature[] =>
    summary.features.map((feature) => {
      const id = getCharacterFeatureId(origin, feature.url);

      const choice = choices[id]?.trim();

      return {
        id,
        name: feature.name,
        description: [...feature.description],
        origin,
        originName: summary.name,
        choice: choice || null,
      };
    });

  return [
    ...toFeatures(species, 'species'),
    ...(lineage ? toFeatures(lineage, 'lineage') : []),
  ];
}

/**
 * Отображаемое название вида с подвидом (например, «Эльф (Высший эльф)»).
 *
 * @param species выбранный вид персонажа.
 * @returns название вида, при наличии — с подвидом в скобках.
 */
export function getSpeciesDisplayName(species: CharacterSpecies): string {
  return species.lineageName
    ? `${species.name} (${species.lineageName})`
    : species.name;
}

/**
 * Схлопывание списка владений для отображения: если есть запись «вся группа»,
 * отдельные виды этой группы из списка убираются.
 *
 * @param proficiencies список владений.
 * @param groups группы каталога владений.
 * @returns список без видов, уже покрытых записью «вся группа».
 */
export function collapseProficiencies(
  proficiencies: string[],
  groups: ProficiencyCatalogGroup[],
): string[] {
  const coveredNames = new Set(
    groups
      .filter((group) => proficiencies.includes(group.all))
      .flatMap((group) => group.items),
  );

  return proficiencies.filter((name) => !coveredNames.has(name));
}
