import type { RenderNode } from '~ui/markup';

import type {
  AbilityBonusMode,
  AbilityKey,
  AbilityRow,
  Character,
  CharacterClass,
  CharacterClassResource,
  CharacterExtraHitDie,
  CharacterFeature,
  CharacterHitDie,
  CharacterInventoryGroup,
  CharacterInventoryItem,
  CharacterSkill,
  CharacterSpecies,
  CharacterSpeed,
  CharacterSpell,
  CharacterSpellGroup,
  CharacterVision,
  ChoiceOptionContext,
  ClassChoice,
  ClassFeatureSummary,
  ClassSummary,
  ClassTableColumn,
  FeatSummary,
  FeatureDescriptionNode,
  FeatureOrigin,
  InventoryItemOrigin,
  ItemSummary,
  MagicItemCatalogItem,
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

import { capitalize } from 'es-toolkit';

import {
  getNodeText,
  isBlockNode,
  isMarkerNode,
  parse,
  toMarkupSource,
} from '~ui/markup';

import {
  ABILITY_LABELS,
  ABILITY_ORDER,
  ABILITY_SHORT_LABELS,
  ARMOR_MATCH_KEYWORDS,
  ARMOR_PROFICIENCY_GROUPS,
  CARRYING_CAPACITY_MULTIPLIER,
  CLASS_RESOURCE_DENY_KEYWORDS,
  DARKVISION_PARSE_FALLBACK,
  INVENTORY_CATEGORY_ORDER,
  INVENTORY_CATEGORY_TITLES,
  LEVEL_XP_THRESHOLDS,
  RESOURCE_COUNT_MAX,
  RESOURCE_SHORT_LABEL_MAX_LENGTH,
  ROLL_MODE_DICE_NOTATION,
  SIZE_LABEL_WORDS,
  SKILL_PROFICIENCY_MULTIPLIERS,
  SPEED_PARSE_FALLBACK,
  SPEED_PRIMARY_ORDER,
  SPEED_TYPE_LABELS,
  SPEED_UNIT_SHORT_LABELS,
  TOOL_MATCH_KEYWORDS,
  TOOL_PROFICIENCY_GROUPS,
  VISION_LABELS,
  VISION_ORDER,
  WEAPON_MATCH_KEYWORDS,
  WEAPON_PROFICIENCY_GROUPS,
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
 * Суммарный вес инвентаря в фунтах с учётом количества. Округляется до одного
 * знака: вес предмета бывает дробным (например, 0,5 фунта).
 *
 * @param inventoryItems предметы инвентаря.
 * @returns суммарный вес всех предметов.
 */
export function getInventoryWeight(
  inventoryItems: CharacterInventoryItem[],
): number {
  const total = inventoryItems.reduce(
    (sum, inventoryItem) => sum + inventoryItem.weight * inventoryItem.quantity,
    0,
  );

  return Math.round(total * 10) / 10;
}

/**
 * Группировка предметов инвентаря по категориям в порядке каталога: оружие,
 * доспехи, прочее; внутри группы — по алфавиту. Пустые группы пропускаются.
 *
 * @param inventoryItems предметы инвентаря.
 * @returns группы предметов с подписями для разделителей.
 */
export function getInventoryGroups(
  inventoryItems: CharacterInventoryItem[],
): CharacterInventoryGroup[] {
  return INVENTORY_CATEGORY_ORDER.map((category) => ({
    category,
    title: INVENTORY_CATEGORY_TITLES[category],
    items: inventoryItems
      .filter((inventoryItem) => inventoryItem.category === category)
      .sort((left, right) => left.name.localeCompare(right.name, 'ru')),
  })).filter((group) => group.items.length > 0);
}

/**
 * Идентификатор предмета инвентаря по разделу-источнику и URL предмета.
 *
 * @param origin раздел-источник предмета.
 * @param itemUrl URL предмета из ответа API.
 * @returns устойчивый идентификатор предмета инвентаря.
 */
export function getInventoryItemId(
  origin: InventoryItemOrigin,
  itemUrl: string,
): string {
  return `${origin}:${itemUrl}`;
}

/**
 * Разбор строки веса предмета (например, «20 фнт.» или «0,5 фнт.»).
 *
 * @param weightText строка веса из ответа API.
 * @returns вес в фунтах; 0 — не распознан.
 */
export function parseItemWeight(weightText: string): number {
  const weightMatch = /(\d+(?:[.,]\d+)?)/.exec(weightText);

  return weightMatch?.[1] ? Number(weightMatch[1].replace(',', '.')) : 0;
}

/**
 * Сборка предмета инвентаря из детали предмета раздела «Предметы»: одна штука.
 *
 * @param summary деталь предмета.
 * @returns предмет инвентаря для вкладки «Снаряжение».
 */
export function buildInventoryItem(
  summary: ItemSummary,
): CharacterInventoryItem {
  return {
    id: getInventoryItemId('item', summary.url),
    url: summary.url,
    name: summary.name,
    category: summary.category,
    typesLabel: summary.typesLabel,
    cost: summary.cost,
    weight: summary.weight,
    quantity: 1,
  };
}

/**
 * Сборка предмета инвентаря из ссылки каталога магических предметов: категория
 * и редкость известны прямо из поиска, поэтому деталь не запрашивается; вес и
 * стоимость у магических предметов раздел не отдаёт.
 *
 * @param catalogItem магический предмет каталога.
 * @returns предмет инвентаря для вкладки «Снаряжение».
 */
export function buildMagicItemInventoryItem(
  catalogItem: MagicItemCatalogItem,
): CharacterInventoryItem {
  const typesLabel = [capitalize(catalogItem.category), catalogItem.rarity]
    .filter(Boolean)
    .join(', ');

  return {
    id: getInventoryItemId('magic-item', catalogItem.url),
    url: catalogItem.url,
    name: catalogItem.name,
    category: 'MAGIC_ITEM',
    typesLabel,
    cost: '',
    weight: 0,
    quantity: 1,
  };
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
 * Извлекает url черты из идентификатора особенности. Обычная черта — `feat:url`,
 * повторяемая — `feat:url:uuid` (у каждой копии свой суффикс). Url черты не
 * содержит двоеточий, поэтому берём сегмент между первым и вторым `:`.
 *
 * @param featureId идентификатор особенности.
 * @returns url черты или null, если особенность — не черта.
 */
export function getFeatUrlFromFeatureId(featureId: string): string | null {
  if (!featureId.startsWith('feat:')) {
    return null;
  }

  const afterPrefix = featureId.slice('feat:'.length);
  const separatorIndex = afterPrefix.indexOf(':');

  return separatorIndex === -1
    ? afterPrefix
    : afterPrefix.slice(0, separatorIndex);
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
 * Сборка особенности персонажа из детали черты раздела «Черты». Категория
 * черты сохраняется как источник особенности (для подсказки на бейдже).
 * Повторяемая черта получает уникальный суффикс в идентификаторе — так копии
 * одной черты не схлопываются дедупом и удаляются/правятся независимо.
 *
 * @param summary деталь черты.
 * @param repeatable черту можно брать несколько раз (уникальный id для копии).
 * @returns особенность персонажа с происхождением «Черта».
 */
export function buildFeatFeature(
  summary: FeatSummary,
  repeatable = false,
): CharacterFeature {
  const baseId = getCharacterFeatureId('feat', summary.url);

  return {
    id: repeatable ? `${baseId}:${crypto.randomUUID()}` : baseId,
    name: summary.name,
    description: [...summary.description],
    origin: 'feat',
    originName: summary.category,
    choice: null,
  };
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

/**
 * Распознавание характеристик из прозы (например, спасброски класса «Сила и
 * Телосложение» или характеристики предыстории): совпадения ищутся по полным
 * названиям характеристик.
 *
 * @param text строка с названиями характеристик из ответа API.
 * @returns распознанные характеристики.
 */
export function parseAbilityKeys(text: string): AbilityKey[] {
  const normalizedText = text.toLowerCase();

  return ABILITY_ORDER.filter((key) =>
    normalizedText.includes(ABILITY_LABELS[key].toLowerCase()),
  );
}

/**
 * Сопоставление прозы владений класса с каталогом: если проза содержит
 * ключевое слово группы — добавляется «вся группа», иначе ищутся отдельные виды
 * по вхождению названия.
 *
 * @param prose строка владений из ответа API.
 * @param groups группы каталога владений.
 * @param keywordsByKey ключевые слова групп по ключу группы.
 * @returns список подписей владений для листа.
 */
export function matchProficiencyGroups(
  prose: string,
  groups: ProficiencyCatalogGroup[],
  keywordsByKey: Record<string, string[]>,
): string[] {
  const normalizedProse = prose.toLowerCase();

  const matched = new Set<string>();

  for (const group of groups) {
    const keywords = keywordsByKey[group.key] ?? [];

    const hasGroupKeyword = keywords.some((keyword) =>
      normalizedProse.includes(keyword),
    );

    if (hasGroupKeyword) {
      matched.add(group.all);

      continue;
    }

    for (const item of group.items) {
      if (normalizedProse.includes(item.toLowerCase())) {
        matched.add(item);
      }
    }
  }

  return [...matched];
}

/**
 * Владения класса, распознанные из прозы ответа (best-effort). Броня, оружие и
 * инструменты сопоставляются с существующими каталогами владений; распознанное
 * игрок затем правит существующими модалками.
 *
 * @param proficiencyText владения класса прозой (armor/weapon/tool).
 * @param proficiencyText.armor владения бронёй прозой.
 * @param proficiencyText.weapon владения оружием прозой.
 * @param proficiencyText.tool владения инструментами прозой.
 * @returns списки владений по группам листа.
 */
export function matchClassProficiencies(proficiencyText: {
  armor: string;
  weapon: string;
  tool: string;
}): { armor: string[]; weapons: string[]; tools: string[] } {
  return {
    armor: matchProficiencyGroups(
      proficiencyText.armor,
      ARMOR_PROFICIENCY_GROUPS,
      ARMOR_MATCH_KEYWORDS,
    ),
    weapons: matchProficiencyGroups(
      proficiencyText.weapon,
      WEAPON_PROFICIENCY_GROUPS,
      WEAPON_MATCH_KEYWORDS,
    ),
    tools: matchProficiencyGroups(
      proficiencyText.tool,
      TOOL_PROFICIENCY_GROUPS,
      TOOL_MATCH_KEYWORDS,
    ),
  };
}

/**
 * Значение колонки таблицы прогрессии на заданном уровне: берётся запись с
 * наибольшим уровнем, не превышающим текущий.
 *
 * @param column колонка таблицы прогрессии.
 * @param level уровень персонажа.
 * @returns значение колонки; null — записи для уровня нет.
 */
function getColumnValueAtLevel(
  column: ClassTableColumn,
  level: number,
): string | null {
  let value: string | null = null;
  let bestLevel = 0;

  for (const entry of column.scaling) {
    if (entry.level <= level && entry.level >= bestLevel) {
      bestLevel = entry.level;
      value = entry.value;
    }
  }

  return value;
}

/**
 * Эвристический вывод ресурсов класса из таблицы прогрессии: колонка становится
 * ресурсом, только если её значение на текущем уровне — целое число в
 * допустимом диапазоне, а название не входит в стоп-слова (заклинания, ячейки,
 * бонусы, урон, уровень). Значения игрок затем правит вручную.
 *
 * @param table таблица прогрессии класса.
 * @param level уровень персонажа.
 * @returns ресурсы класса с устойчивыми идентификаторами.
 */
export function deriveClassResources(
  table: ClassTableColumn[],
  level: number,
): CharacterClassResource[] {
  const resources: CharacterClassResource[] = [];

  for (const column of table) {
    const normalizedName = column.name.toLowerCase().replaceAll('ё', 'е');

    const isDenied = CLASS_RESOURCE_DENY_KEYWORDS.some((keyword) =>
      normalizedName.includes(keyword.replaceAll('ё', 'е')),
    );

    if (isDenied) {
      continue;
    }

    const value = getColumnValueAtLevel(column, level)?.trim();

    if (!value || !/^\d+$/.test(value)) {
      continue;
    }

    const max = Number(value);

    if (max < 1 || max > RESOURCE_COUNT_MAX) {
      continue;
    }

    resources.push({
      id: `class:res:${column.name}`,
      name: column.name,
      shortLabel: column.name.slice(0, RESOURCE_SHORT_LABEL_MAX_LENGTH),
      recovery: 'long-rest',
      current: max,
      max,
    });
  }

  return resources;
}

/**
 * Приведение узла разметки класса (`RenderNode`) к массиву узлов описания
 * особенности: строка и одиночный узел заворачиваются в массив.
 *
 * @param node узел описания из ответа класса.
 * @returns узлы описания для листа.
 */
export function toDescriptionNodes(node: RenderNode): FeatureDescriptionNode[] {
  return Array.isArray(node) ? [...node] : [node];
}

/**
 * Сборка классовых особенностей персонажа из деталей класса и подкласса.
 * Берутся особенности с уровнем не выше уровня персонажа: базовый класс даёт
 * особенности без пометки подкласса, подкласс — с пометкой. Дубли по ключу
 * отбрасываются. Выбор игрока подставляется по идентификатору особенности
 * (`class:key`).
 *
 * @param base деталь базового класса.
 * @param subclass деталь подкласса; null — подкласс не выбран.
 * @param level уровень персонажа.
 * @param choices выборы игрока по идентификаторам особенностей.
 * @returns классовые особенности для вкладки «Особенности».
 */
export function buildClassFeatures(
  base: ClassSummary,
  subclass: ClassSummary | null,
  level: number,
  choices: Record<string, string>,
): CharacterFeature[] {
  const seenKeys = new Set<string>();
  const features: CharacterFeature[] = [];

  const append = (
    summaries: ClassFeatureSummary[],
    originName: string,
    onlySubclass: boolean,
  ): void => {
    for (const summary of summaries) {
      if (
        summary.isSubclass !== onlySubclass
        || summary.level > level
        || seenKeys.has(summary.key)
      ) {
        continue;
      }

      seenKeys.add(summary.key);

      const id = getCharacterFeatureId('class', summary.key);

      const choice = choices[id]?.trim();

      features.push({
        id,
        name: summary.name,
        description: [...summary.description],
        origin: 'class',
        originName,
        choice: choice || null,
      });
    }
  };

  append(base.features, base.name, false);

  if (subclass) {
    append(subclass.features, subclass.name, true);
  }

  return features;
}

/**
 * Отображаемое название класса с подклассом (например, «Плут (Мистический
 * ловкач)»).
 *
 * @param characterClass выбранный класс персонажа.
 * @returns название класса, при наличии — с подклассом в скобках.
 */
export function getClassDisplayName(characterClass: CharacterClass): string {
  return characterClass.subclassName
    ? `${characterClass.name} (${characterClass.subclassName})`
    : characterClass.name;
}

/**
 * Количество для выбора из прозы: первое число либо числительное словом
 * (один/два/три/четыре); по умолчанию 1.
 *
 * @param text строка с описанием выбора.
 * @returns распознанное количество.
 */
export function parseChoiceCount(text: string): number {
  const match = /(\d+)|оди?н|(дв[ае])|(тр[иеё])|(четыр)/i.exec(text);

  if (!match) {
    return 1;
  }

  if (match[1]) {
    return Number(match[1]);
  }

  if (match[2]) {
    return 2;
  }

  if (match[3]) {
    return 3;
  }

  if (match[4]) {
    return 4;
  }

  return 1;
}

/**
 * Выбор владения навыками из прозы `proficiency.skill` («Выберите N навыка из…»
 * или «Выберите любые N навыка»). Перечисленные навыки распознаются по вхождению
 * известных названий; «любые» — опции резолвятся всеми навыками в визарде.
 *
 * @param skillText проза выбора навыков класса.
 * @param skillNames имена всех навыков персонажа.
 * @returns выбор навыков или null, если проза не о навыках.
 */
export function getClassSkillChoice(
  skillText: string,
  skillNames: string[],
): ClassChoice | null {
  if (!/навык/i.test(skillText)) {
    return null;
  }

  const listed = /любы/i.test(skillText)
    ? []
    : skillNames.filter((name) => skillText.includes(name));

  return {
    id: 'class-skills',
    kind: 'skill-proficiency',
    label: 'Владение навыками',
    count: parseChoiceCount(skillText),
    listed,
  };
}

/**
 * Выбор владения инструментами из прозы («Выберите N … инструмента», «N … на
 * ваш выбор»). Группа определяется по ключевому слову (например, «музыкальн» →
 * музыкальные инструменты); иначе опции резолвятся всем каталогом в визарде.
 *
 * @param toolText проза владения инструментами.
 * @param id идентификатор выбора (для class/background).
 * @returns выбор инструментов или null, если выбора нет.
 */
export function getClassToolChoice(
  toolText: string,
  id = 'class-tools',
): ClassChoice | null {
  // «выбер…» (Выберите) и «выбор» (на выбор) — разные корни, оба означают выбор.
  if (!/выб[ео]р/i.test(toolText)) {
    return null;
  }

  const normalized = toolText.toLowerCase();

  const matchedGroup = TOOL_PROFICIENCY_GROUPS.find((group) =>
    TOOL_MATCH_KEYWORDS[group.key].some((keyword) =>
      normalized.includes(keyword),
    ),
  );

  return {
    id,
    kind: 'tool',
    label: 'Владение инструментами',
    count: parseChoiceCount(toolText),
    listed: matchedGroup ? [...matchedGroup.items] : [],
  };
}

/**
 * Распознавание выбора внутри особенности класса или вида: компетентность
 * (экспертиза), владение навыком на выбор или язык на выбор. Иначе — null
 * (особенность остаётся со свободным текстовым выбором). Инструменты здесь не
 * распознаются: у классов они идут из владений (`proficiency.tool`), а в тексте
 * особенностей «инструмент» часто упоминается как фокусировка заклинателя.
 *
 * @param featureId идентификатор особенности (он же id выбора).
 * @param description описание особенности (узлы разметки или строки).
 * @param skillNames имена всех навыков персонажа (для списка навыков в выборе).
 * @returns выбор особенности или null.
 */
export function detectFeatureChoice(
  featureId: string,
  description: RenderNode | RenderNode[],
  skillNames: string[],
): ClassChoice | null {
  const rawText = getNodeText(description);

  const text = rawText.toLowerCase().replaceAll('ё', 'е');

  if (text.includes('компетентност')) {
    return {
      id: featureId,
      kind: 'skill-expertise',
      label: '',
      count: parseChoiceCount(text.slice(text.indexOf('компетентност'))),
      listed: [],
    };
  }

  if (
    text.includes('навык')
    && text.includes('владени')
    && text.includes('выбор')
  ) {
    return {
      id: featureId,
      kind: 'skill-proficiency',
      label: '',
      count: parseChoiceCount(text),
      listed: skillNames.filter((name) => rawText.includes(name)),
    };
  }

  if (text.includes('язык') && text.includes('выбор')) {
    return {
      id: featureId,
      kind: 'language',
      label: '',
      count: parseChoiceCount(text),
      listed: [],
    };
  }

  return null;
}

/**
 * Опции пикера выбора в зависимости от его типа. Единая логика для визардов
 * класса и вида.
 *
 * @param choice распознанный выбор.
 * @param context контекст резолюции (навыки, языки, инструменты).
 * @returns список опций для селектора.
 */
export function resolveChoiceOptions(
  choice: ClassChoice,
  context: ChoiceOptionContext,
): string[] {
  if (choice.kind === 'skill-proficiency') {
    return choice.listed.length ? choice.listed : context.skillNames;
  }

  if (choice.kind === 'skill-expertise') {
    return [
      ...new Set([
        ...context.proficientSkillNames,
        ...context.chosenProficientSkills,
      ]),
    ];
  }

  if (choice.kind === 'language') {
    const known = new Set(context.knownLanguages);

    return context.allLanguages.filter((name) => !known.has(name));
  }

  const knownTools = new Set(context.knownTools);

  const toolOptions = choice.listed.length ? choice.listed : context.allTools;

  return toolOptions.filter((name) => !knownTools.has(name));
}

/**
 * Применение выбранных навыков к списку навыков персонажа: экспертиза
 * перекрывает владение; уровень владения повышается только с «нет владения».
 *
 * @param skills навыки персонажа.
 * @param proficient навыки для владения.
 * @param expertise навыки для экспертизы.
 * @returns новый список навыков с применёнными уровнями.
 */
export function applySkillProficiencies(
  skills: CharacterSkill[],
  proficient: string[],
  expertise: string[],
): CharacterSkill[] {
  const proficientSet = new Set(proficient);
  const expertiseSet = new Set(expertise);

  return skills.map((skill): CharacterSkill => {
    if (expertiseSet.has(skill.name)) {
      return { ...skill, proficiency: 'expertise' };
    }

    if (proficientSet.has(skill.name) && skill.proficiency === 'none') {
      return { ...skill, proficiency: 'proficient' };
    }

    return skill;
  });
}

/**
 * Разбор маркера черты предыстории («{@feat Название [Eng]|url:...} (Уточнение)»):
 * url черты, её название и уточнение в скобках.
 *
 * @param featText строка черты из ответа API.
 * @returns url, название и уточнение черты.
 */
export function parseFeatMarker(featText: string): {
  url: string | null;
  name: string;
  subchoice: string;
} {
  const urlMatch = /url:([\w-]+)/.exec(featText);
  const nameMatch = /@feat\s+([^[|]+)/.exec(featText);
  const subchoiceMatch = /\(([^)]+)\)\s*$/.exec(featText);

  return {
    url: urlMatch?.[1] ?? null,
    name: nameMatch?.[1]?.trim() ?? '',
    subchoice: subchoiceMatch?.[1]?.trim() ?? '',
  };
}

/**
 * Прибавки к характеристикам от предыстории: режим «+2/+1» даёт +2 и +1 двум
 * характеристикам, «+1/+1/+1» — по +1 всем трём из списка.
 *
 * @param abilities характеристики предыстории (до трёх).
 * @param mode режим распределения прибавок.
 * @param plusTwo характеристика с +2 (для режима «+2/+1»); null — не выбрана.
 * @param plusOne характеристика с +1 (для режима «+2/+1»); null — не выбрана.
 * @returns прибавки по характеристикам.
 */
export function computeAbilityBonuses(
  abilities: AbilityKey[],
  mode: AbilityBonusMode,
  plusTwo: AbilityKey | null,
  plusOne: AbilityKey | null,
): Partial<Record<AbilityKey, number>> {
  const bonuses: Partial<Record<AbilityKey, number>> = {};

  if (mode === '1-1-1') {
    for (const key of abilities) {
      bonuses[key] = 1;
    }

    return bonuses;
  }

  if (plusTwo) {
    bonuses[plusTwo] = 2;
  }

  if (plusOne && plusOne !== plusTwo) {
    bonuses[plusOne] = 1;
  }

  return bonuses;
}
