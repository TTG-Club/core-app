import type { DropdownMenuItem } from '@nuxt/ui';

import type { Level } from '~/shared/types';
import type { RenderNode } from '~ui/markup';

import type {
  AbilityBonusMode,
  AbilityKey,
  AbilityRow,
  ArmorClassAbilityBonus,
  ArmorClassBreakdown,
  ArmorDexterityMod,
  CatalogSpellDetail,
  Character,
  CharacterAbilities,
  CharacterClass,
  CharacterClassResource,
  CharacterCurrency,
  CharacterExtraHitDie,
  CharacterFeature,
  CharacterHealth,
  CharacterHitDie,
  CharacterInventoryGroup,
  CharacterInventoryItem,
  CharacterLevelHitPoints,
  CharacterSkill,
  CharacterSpecies,
  CharacterSpeed,
  CharacterSpell,
  CharacterSpellGroup,
  CharacterToolProficiency,
  CharacterVision,
  ChoiceOptionContext,
  ClassChoice,
  ClassFeatureRow,
  ClassFeatureSummary,
  ClassOption,
  ClassSummary,
  ClassTableColumn,
  CustomArmorType,
  CustomFeatureDraft,
  CustomInventoryItemDraft,
  CustomInventoryKind,
  CustomSpellDraft,
  CustomSpellStatRow,
  DamageDiceGroup,
  DamageRollSource,
  DistanceRowDraft,
  FeatSelectOption,
  FeatSummary,
  FeatureDescriptionNode,
  FeatureOrigin,
  FeatureOriginGroup,
  FeatureTabFilter,
  HitDiceAmount,
  HitDicePool,
  HitDiceSelectPool,
  HitPointsGainMode,
  InventoryArmor,
  InventoryItemOrigin,
  InventoryWeapon,
  ItemSummary,
  MagicItemCatalogGroup,
  MagicItemCatalogGrouping,
  MagicItemCatalogItem,
  PreparedSpellsBreakdown,
  PreparedSpellsScaling,
  PrimarySpeed,
  ProficiencyCatalogGroup,
  ResourceRecovery,
  RollMode,
  SavingThrowRow,
  SkillRow,
  SpeciesFeatureSummary,
  SpeciesSummary,
  SpeedRow,
  SpeedTypeKey,
  SpellcastingBreakdown,
  SpellCatalogPreset,
  SpellDamage,
  SpellSlotCircle,
  SpellSlotRow,
  SpellTabFilter,
  ToolCatalogEntry,
  VisionKey,
  VisionRow,
  WeaponAttack,
  WeaponDamage,
} from './types';

import { capitalize, clamp, upperFirst } from 'es-toolkit';

import { LEVELS } from '~/shared/consts';
import {
  CasterType,
  FULL_CASTER_SPELL_SLOTS,
  HALF_CASTER_SPELL_SLOTS,
  MULTICLASS_SPELL_SLOTS,
  PACT_CASTER_SPELL_SLOTS_COUNT,
  PACT_CASTER_SPELL_SLOTS_LEVEL,
  THIRD_CASTER_SPELL_SLOTS,
} from '~classes/model';
import {
  getNodeText,
  isBlockNode,
  isMarkerNode,
  parse,
  toMarkupSource,
} from '~ui/markup';

import {
  ABILITY_IMPROVEMENT_EXCLUDED_FEAT_CATEGORIES,
  ABILITY_IMPROVEMENT_FEAT_URL_PREFIX,
  ABILITY_IMPROVEMENT_FEATURE_NAMES,
  ABILITY_IMPROVEMENT_SCORE_MAX,
  ABILITY_LABELS,
  ABILITY_ORDER,
  ABILITY_SHORT_LABELS,
  ALL_SPELL_SLOTS_LABEL,
  ARMOR_CLASS_BASE_MAX,
  ARMOR_CLASS_BASE_MIN,
  ARMOR_MATCH_KEYWORDS,
  ARMOR_MEDIUM_DEX_CAP,
  ARMOR_PROFICIENCY_GROUPS,
  CANTRIP_SPELL_LEVEL,
  CARRYING_CAPACITY_MULTIPLIER,
  CARRYING_CAPACITY_SIZE_MULTIPLIERS,
  CATALOG_COPY_MENU_LABEL,
  CHARACTER_FILE_NAME_FALLBACK,
  CLASS_FEAT_CHOICE_ID_SEGMENTS,
  CLASS_SPELL_PROGRESSIONS,
  CLASS_SPELLCASTING_ABILITIES,
  COINS_PER_WEIGHT_UNIT,
  CURRENCY_ORDER,
  CUSTOM_ARMOR_TYPE_BY_DEXTERITY_MOD,
  CUSTOM_ARMOR_TYPE_META,
  CUSTOM_BACKGROUND_URL_PREFIX,
  CUSTOM_CLASS_URL_PREFIX,
  CUSTOM_INVENTORY_KIND_CATEGORIES,
  CUSTOM_INVENTORY_URL_PREFIX,
  CUSTOM_ITEM_WEIGHT_MAX,
  CUSTOM_ITEM_WEIGHT_MIN,
  CUSTOM_MAGIC_ITEM_LABEL,
  CUSTOM_SPECIES_DEFAULT_SPEED,
  CUSTOM_SPECIES_URL_PREFIX,
  CUSTOM_SPELL_FIELDS,
  CUSTOM_SPELL_URL_PREFIX,
  CUSTOM_TRINKET_TYPES_LABEL,
  CUSTOM_WEAPON_PROPERTY_LABELS,
  DAMAGE_BONUS_MAX,
  DAMAGE_BONUS_MIN,
  DAMAGE_DICE_COUNT_MAX,
  DAMAGE_DICE_COUNT_MIN,
  DAMAGE_TYPE_LABELS,
  DARKVISION_PARSE_FALLBACK,
  DEFAULT_ARMOR_CLASS_ABILITY,
  DEFAULT_ROLL_DICE_FACES,
  DEFAULT_WEAPON_ATTACK_ABILITY,
  DICE_NOTATION_LETTER,
  FEATURE_ORIGIN_GROUP_ORDER,
  FEATURE_ORIGIN_LABELS,
  FILTER_CHIP_CLASS,
  FILTER_CHIP_IDLE_CLASS,
  FILTER_CHIP_SELECTED_CLASS,
  HIT_DICE_ROLL_COUNT,
  HIT_POINTS_LEVEL_GAIN_MIN,
  INNATE_SPELL_REMOVE_MENU_LABEL,
  INVENTORY_CATEGORY_ORDER,
  INVENTORY_CATEGORY_TITLES,
  INVENTORY_GRIP_MENU_LABELS,
  INVENTORY_QUANTITY_MAX,
  INVENTORY_QUANTITY_MIN,
  INVENTORY_REMOVE_MENU_LABEL,
  ITEMS_DETAIL_BASE_PATH,
  LEVEL_MIN,
  LEVEL_XP_THRESHOLDS,
  MAGIC_ITEM_CATALOG_EMPTY_GROUP_LABELS,
  MAGIC_ITEMS_DETAIL_BASE_PATH,
  NEW_CUSTOM_INVENTORY_ITEM,
  ORIGIN_FEAT_CATEGORY,
  PACT_SPELL_SLOTS_LABEL,
  PREPARED_SPELLS_COLUMN_KEYWORD,
  PREPARED_SPELLS_COLUMN_PREFIX,
  PREPARED_SPELLS_COUNT_HINT,
  PREPARED_SPELLS_EMPTY_VALUE,
  PREPARED_SPELLS_LABEL,
  PREPARED_SPELLS_MAX,
  PREPARED_SPELLS_MIN,
  PREPARED_SPELLS_VALUE_SEPARATOR,
  RESOURCE_COUNT_MAX,
  RESOURCE_RECOVERY_LABELS,
  RESOURCE_SHORT_LABEL_MAX_LENGTH,
  ROLL_MODE_DICE_COUNT,
  ROLL_MODE_DICE_SUFFIX,
  SHEET_COPY_LIMIT_HINT,
  SHEET_DOWNLOAD_JSON_LABEL,
  SHEET_DOWNLOAD_PDF_HINT,
  SHEET_DOWNLOAD_PDF_LABEL,
  SHEET_PDF_MIME_TYPE,
  SHEET_PLURAL_FORMS,
  SHEET_SAVE_SHARED_LABELS,
  SHEET_SHARE_ACTIVE_HINT,
  SHEET_UNARMORED_LABEL,
  SIZE_LABEL_WORDS,
  SKILL_OWNED_HINTS,
  SKILL_PROFICIENCY_MULTIPLIERS,
  SPEED_PARSE_FALLBACK,
  SPEED_PRIMARY_ORDER,
  SPEED_TYPE_LABELS,
  SPEED_UNIT_SHORT_LABELS,
  SPELL_DAMAGE_ABILITY_MODIFIER_TAG,
  SPELL_DAMAGE_CONDITION_TAG_LABELS,
  SPELL_DAMAGE_TYPE_SEPARATOR,
  SPELL_DAMAGE_TYPE_TAG_LABELS,
  SPELL_DAMAGE_TYPE_TAG_PREFIX,
  SPELL_REMOVE_MENU_LABEL,
  SPELL_SAVE_DC_BASE,
  SPELL_SLOT_FREE_LABEL,
  SPELL_SLOT_USED_LABEL,
  THIRD_CASTER_SUBCLASSES,
  TOOL_CATALOG_GROUP_ORDER,
  TOOL_MATCH_KEYWORDS,
  TOOL_NAME_ALIASES,
  UNARMORED_ARMOR_CLASS_BASE,
  VISION_DISTANCE_MIN,
  VISION_LABELS,
  VISION_ORDER,
  WEAPON_CATEGORY_LABELS,
  WEAPON_MATCH_KEYWORDS,
  WEAPON_PROFICIENCY_GROUPS,
  WEAPON_TRAIT_AXES,
  WEAPON_TRAIT_ITEMS,
  WEAPON_TRAIT_MATCH_KEYWORDS,
  WEIGHT_DECIMALS,
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
 * Бонус мастерства листа: бонус по уровню плюс свой бонус из настроек. Считать
 * бонус мастерства персонажа нужно именно так — везде, где он участвует.
 *
 * @param character персонаж.
 * @returns итоговый бонус мастерства.
 */
export function getCharacterProficiencyBonus(character: Character): number {
  return (
    getProficiencyBonus(character.level)
    + character.settings.customProficiencyBonus
  );
}

/**
 * Бонус инициативы: модификатор Ловкости плюс свой бонус из настроек.
 *
 * @param character персонаж.
 * @returns итоговый бонус инициативы.
 */
export function getInitiativeBonus(character: Character): number {
  return (
    getModifier(character.abilities.dexterity)
    + character.settings.customInitiativeBonus
  );
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

  return modifier + getCharacterProficiencyBonus(character);
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
    getCharacterProficiencyBonus(character)
    * SKILL_PROFICIENCY_MULTIPLIERS[skill.proficiency];

  return modifier + Math.floor(proficiencyPart);
}

/**
 * Проверка, что значение — ключ характеристики: известный ключ тот, у которого
 * есть подпись в `ABILITY_LABELS`.
 *
 * @param candidate проверяемое значение.
 * @returns `true`, если значение — ключ характеристики.
 */
function isAbilityKey(candidate: unknown): candidate is AbilityKey {
  return typeof candidate === 'string' && candidate in ABILITY_LABELS;
}

/**
 * Характеристики в порядке листа (`ABILITY_ORDER`), а не в очерёдности выбора:
 * в селектах порядок задают клики игрока, а читаться список должен так же, как
 * блок характеристик. Повторы отбрасываются.
 *
 * @param abilities выбранные характеристики в произвольном порядке.
 * @returns выбранные характеристики в порядке листа.
 */
export function sortAbilityKeys(abilities: AbilityKey[]): AbilityKey[] {
  return ABILITY_ORDER.filter((key) => abilities.includes(key));
}

/**
 * Разбор значения множественного селекта характеристик: компонент отдаёт его
 * нетипизированным, поэтому в список попадают только известные ключи — сразу в
 * порядке листа.
 *
 * @param value значение множественного селекта характеристик.
 * @returns выбранные характеристики в порядке листа.
 */
export function toSelectedAbilityKeys(value: unknown): AbilityKey[] {
  const selected = Array.isArray(value) ? value : [];

  return sortAbilityKeys(selected.filter(isAbilityKey));
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
      ability: skill.ability,
      abilityLabel: ABILITY_SHORT_LABELS[skill.ability],
      proficiency: skill.proficiency,
      value,
      formattedModifier: getFormattedBonus(value),
      passiveValue: 10 + value,
    };
  });
}

/**
 * Суммарный переносимый вес в фунтах: предметы с учётом количества плюс
 * стандартные монеты — по правилам 2024 монета весит 1/50 фунта. Округляется
 * до одного знака: вес предмета бывает дробным (например, 0,5 фунта).
 *
 * @param inventoryItems предметы инвентаря.
 * @param currency стандартные монеты персонажа.
 * @returns суммарный переносимый вес.
 */
export function getInventoryWeight(
  inventoryItems: CharacterInventoryItem[],
  currency: CharacterCurrency,
): number {
  const itemsWeight = inventoryItems.reduce(
    (sum, inventoryItem) => sum + inventoryItem.weight * inventoryItem.quantity,
    0,
  );

  const coinsCount = CURRENCY_ORDER.reduce(
    (sum, key) => sum + currency[key],
    0,
  );

  const total = itemsWeight + coinsCount / COINS_PER_WEIGHT_UNIT;

  const factor = 10 ** WEIGHT_DECIMALS;

  return Math.round(total * factor) / factor;
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
 * Порядок групп редкости: сначала редкости в порядке словаря, затем
 * незнакомые словарю — по алфавиту.
 *
 * @param rarityKeys редкости, встретившиеся в каталоге.
 * @param rarityOrder редкости в порядке словаря.
 * @returns редкости в порядке следования групп.
 */
function getMagicItemRarityKeyOrder(
  rarityKeys: string[],
  rarityOrder: Set<string>,
): string[] {
  const knownKeys = [...rarityOrder].filter((rarity) =>
    rarityKeys.includes(rarity),
  );

  const unknownKeys = rarityKeys
    .filter((rarityKey) => !rarityOrder.has(rarityKey))
    .sort(sortString);

  return [...knownKeys, ...unknownKeys];
}

/**
 * Группировка каталога магических предметов в модалке добавления: по редкости
 * в порядке словаря, по категории — по алфавиту, либо одной группой без
 * подписи. Внутри группы предметы идут по русскому названию, а предметы без
 * значения поля собираются в отдельную группу в конце списка.
 *
 * @param catalogItems магические предметы каталога.
 * @param grouping выбранная группировка.
 * @param rarityOrder редкости в порядке словаря.
 * @returns группы предметов с подписями для разделителей.
 */
export function getMagicItemCatalogGroups<TItem extends MagicItemCatalogItem>(
  catalogItems: TItem[],
  grouping: MagicItemCatalogGrouping,
  rarityOrder: Set<string>,
): MagicItemCatalogGroup<TItem>[] {
  const sortedItems = [...catalogItems].sort((left, right) =>
    sortString(left.name, right.name),
  );

  if (grouping === 'NONE') {
    return sortedItems.length
      ? [{ key: '', label: '', items: sortedItems }]
      : [];
  }

  const itemsByKey = new Map<string, TItem[]>();

  for (const catalogItem of sortedItems) {
    const groupKey =
      grouping === 'RARITY' ? catalogItem.rarity : catalogItem.category;

    const groupItems = itemsByKey.get(groupKey);

    if (groupItems) {
      groupItems.push(catalogItem);
    } else {
      itemsByKey.set(groupKey, [catalogItem]);
    }
  }

  const filledKeys = [...itemsByKey.keys()].filter((groupKey) => groupKey);

  const orderedKeys =
    grouping === 'RARITY'
      ? getMagicItemRarityKeyOrder(filledKeys, rarityOrder)
      : filledKeys.sort(sortString);

  // Предметы без редкости или категории выпадают и из словаря, и из алфавита,
  // поэтому их группа всегда последняя.
  const groupKeys = itemsByKey.has('') ? [...orderedKeys, ''] : orderedKeys;

  return groupKeys.map((groupKey) => ({
    key: groupKey,
    label: groupKey
      ? upperFirst(groupKey)
      : MAGIC_ITEM_CATALOG_EMPTY_GROUP_LABELS[grouping],
    items: itemsByKey.get(groupKey) ?? [],
  }));
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
    armor: summary.armor,
    weapon: summary.weapon,
    equipped: false,
    twoHanded: false,
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
    armor: null,
    weapon: null,
    equipped: false,
    twoHanded: false,
  };
}

/**
 * Свой ли это предмет инвентаря: заполнен формой листа, а не добавлен из
 * разделов сайта. У своих предметов нет страницы в каталоге, поэтому описание
 * они хранят прямо в листе.
 *
 * @param inventoryItem предмет инвентаря.
 * @returns true — предмет свой.
 */
export function isCustomInventoryItem(
  inventoryItem: CharacterInventoryItem,
): boolean {
  return inventoryItem.url.startsWith(CUSTOM_INVENTORY_URL_PREFIX);
}

/**
 * Кончился ли предмет: количество доведено до нуля. Запись остаётся в списке,
 * но предмета у персонажа нет — надеть его и катить им атаку с уроном нельзя.
 *
 * @param inventoryItem предмет инвентаря.
 * @returns true — предмета не осталось.
 */
export function isMissingInventoryItem(
  inventoryItem: CharacterInventoryItem,
): boolean {
  return inventoryItem.quantity <= 0;
}

/**
 * Универсальное ли это оружие: справочник дал ему второй бросок урона — тот, что
 * катится, если взять оружие двумя руками. Только у такого предмета есть смысл
 * в смене хвата.
 *
 * @param inventoryItem предмет инвентаря.
 * @returns true — хват можно переключать.
 */
export function isVersatileInventoryItem(
  inventoryItem: CharacterInventoryItem,
): boolean {
  return Boolean(inventoryItem.weapon?.versatileDamage);
}

/**
 * Путь детального ответа каталога для предмета инвентаря: магические предметы
 * живут в своём разделе.
 *
 * @param inventoryItem каталожный предмет инвентаря.
 * @returns путь детали предмета.
 */
export function getInventoryItemDetailPath(
  inventoryItem: CharacterInventoryItem,
): string {
  const basePath =
    inventoryItem.category === 'MAGIC_ITEM'
      ? MAGIC_ITEMS_DETAIL_BASE_PATH
      : ITEMS_DETAIL_BASE_PATH;

  return `${basePath}/${inventoryItem.url}`;
}

/**
 * Своя копия каталожного предмета: параметры, количество и надетый доспех
 * остаются прежними, а запись перестаёт зависеть от раздела сайта — она
 * получает свой идентификатор с префиксом `custom:` и забирает описание в лист
 * (у каталожных записей его в документе нет).
 *
 * @param url URL копии (`custom:` + идентификатор); он же её id.
 * @param inventoryItem каталожный предмет инвентаря.
 * @param description описание из справочника; пустое — не загрузилось.
 * @returns предмет инвентаря, помеченный как свой.
 */
export function toCopiedInventoryItem(
  url: string,
  inventoryItem: CharacterInventoryItem,
  description: FeatureDescriptionNode[],
): CharacterInventoryItem {
  return {
    ...inventoryItem,
    id: url,
    url,
    description: [...description],
  };
}

/**
 * Подпись типов своего предмета для строки инвентаря: у доспеха — его тип, у
 * оружия — категория владения и свойства, у безделушки — общая подпись.
 * Магической безделушке подпись «Безделушка» не подходит — группа у неё уже
 * магическая, а параметров, которые стоило бы назвать, нет.
 *
 * @param draft значения формы своего предмета.
 * @returns подпись типов предмета.
 */
function getCustomInventoryTypesLabel(draft: CustomInventoryItemDraft): string {
  if (draft.kind === 'armor') {
    return CUSTOM_ARMOR_TYPE_META[draft.armorType].typesLabel;
  }

  if (draft.kind === 'trinket') {
    return draft.magic ? CUSTOM_MAGIC_ITEM_LABEL : CUSTOM_TRINKET_TYPES_LABEL;
  }

  const labelParts = [WEAPON_CATEGORY_LABELS[draft.weaponCategory]];

  if (draft.ranged) {
    labelParts.push(CUSTOM_WEAPON_PROPERTY_LABELS.ranged);
  }

  if (draft.finesse) {
    labelParts.push(CUSTOM_WEAPON_PROPERTY_LABELS.finesse);
  }

  return labelParts.join(', ');
}

/**
 * Параметры доспеха из значений формы: КД и правило Ловкости берутся из типа
 * доспеха. null — вид предмета не «Доспех».
 *
 * @param draft значения формы своего предмета.
 * @returns параметры доспеха или null.
 */
function getCustomInventoryArmor(
  draft: CustomInventoryItemDraft,
): InventoryArmor | null {
  if (draft.kind !== 'armor') {
    return null;
  }

  const { dexterityMod, shield } = CUSTOM_ARMOR_TYPE_META[draft.armorType];

  return {
    baseArmorClass: getClampedInteger(
      draft.baseArmorClass,
      ARMOR_CLASS_BASE_MIN,
      ARMOR_CLASS_BASE_MAX,
    ),
    dexterityMod,
    shield,
  };
}

/**
 * Параметры оружия из значений формы. Нулевое количество костей означает оружие
 * без броска урона — плитка урона у такого не показывается. null — вид предмета
 * не «Оружие».
 *
 * @param draft значения формы своего предмета.
 * @returns параметры оружия или null.
 */
function getCustomInventoryWeapon(
  draft: CustomInventoryItemDraft,
): InventoryWeapon | null {
  if (draft.kind !== 'weapon') {
    return null;
  }

  const diceCount = getClampedInteger(
    draft.damageDiceCount,
    DAMAGE_DICE_COUNT_MIN,
    DAMAGE_DICE_COUNT_MAX,
  );

  return {
    category: draft.weaponCategory,
    ranged: draft.ranged,
    finesse: draft.finesse,
    // Второй бросок форма не задаёт: у своего оружия свойства «Универсальное»
    // нет — копии каталожного его сохраняет `toUpdatedCustomInventoryItem`.
    versatileDamage: null,
    damage:
      diceCount > 0
        ? {
            diceCount,
            diceFaces: draft.damageDiceFaces,
            bonus: getClampedInteger(
              draft.damageBonus,
              DAMAGE_BONUS_MIN,
              DAMAGE_BONUS_MAX,
            ),
            type: draft.damageType,
          }
        : null,
  };
}

/**
 * Приведение значения числового поля формы к допустимому диапазону. Очищенное
 * поле ввода отдаёт пустое значение, поэтому нечисловое считается нулём — оно
 * же будет подтянуто к границе диапазона.
 *
 * @param value значение поля формы.
 * @param min нижняя граница.
 * @param max верхняя граница.
 * @returns значение в пределах диапазона.
 */
function getClampedNumber(value: number, min: number, max: number): number {
  return clamp(Number.isFinite(value) ? value : 0, min, max);
}

/**
 * То же для целочисленных полей (количество, кости урона, класс доспеха):
 * дробная часть отбрасывается.
 *
 * @param value значение поля формы.
 * @param min нижняя граница.
 * @param max верхняя граница.
 * @returns целое значение в пределах диапазона.
 */
function getClampedInteger(value: number, min: number, max: number): number {
  return Math.trunc(getClampedNumber(value, min, max));
}

/**
 * Вес предмета из значения формы: дробный вес округляется до одного знака —
 * половина фунта у мелочи вроде кинжала обычное дело.
 *
 * @param weight значение поля веса.
 * @returns вес в фунтах.
 */
function getDraftWeight(weight: number): number {
  const factor = 10 ** WEIGHT_DECIMALS;

  const clampedWeight = getClampedNumber(
    weight,
    CUSTOM_ITEM_WEIGHT_MIN,
    CUSTOM_ITEM_WEIGHT_MAX,
  );

  return Math.round(clampedWeight * factor) / factor;
}

/**
 * Предмет инвентаря из значений формы своего предмета. Пустое название означает
 * незаполненную форму — такой предмет не создаётся. Числа приводятся к
 * допустимым диапазонам: поля ввода ограничивают шаг, но не защищают от
 * очищенного или вставленного значения.
 *
 * @param url URL предмета (`custom:` + идентификатор); он же его id.
 * @param draft значения формы.
 * @param equipped доспех надет (сохраняется при редактировании).
 * @returns предмет инвентаря; null — название пустое.
 */
export function toCustomInventoryItem(
  url: string,
  draft: CustomInventoryItemDraft,
  equipped = false,
): CharacterInventoryItem | null {
  const name = draft.name.trim();

  if (!name) {
    return null;
  }

  const quantity = getClampedInteger(
    draft.quantity,
    INVENTORY_QUANTITY_MIN,
    INVENTORY_QUANTITY_MAX,
  );

  return {
    id: url,
    url,
    name,
    // Магическая пометка перебивает группу вида: своё магическое оружие игрок
    // ищет среди магических предметов, а его параметры атаки живут в `weapon`
    // и от группы не зависят.
    category: draft.magic
      ? 'MAGIC_ITEM'
      : CUSTOM_INVENTORY_KIND_CATEGORIES[draft.kind],
    typesLabel: getCustomInventoryTypesLabel(draft),
    cost: draft.cost.trim(),
    weight: getDraftWeight(draft.weight),
    quantity,
    armor: getCustomInventoryArmor(draft),
    weapon: getCustomInventoryWeapon(draft),
    // Надетым остаётся только доспех: у оружия и безделушки параметров доспеха
    // нет, и в подсчёт КД они не идут. Форма может обнулить количество — тогда
    // доспех снимается вместе с ним.
    equipped: draft.kind === 'armor' && equipped && quantity > 0,
    // Хват формой не задаётся: универсальным бывает только каталожное оружие, и
    // его копии хват возвращает `toUpdatedCustomInventoryItem`.
    twoHanded: false,
    description: [...draft.description],
  };
}

/**
 * Возврат свойства «Универсальное» правленому предмету: второго броска в форме
 * нет, и без этого правка копии каталожного меча молча отбирала бы у него хват
 * двумя руками. Кости обычного урона при этом остаются такими, как их задали в
 * форме, — редактируется именно она.
 *
 * @param updatedItem предмет, собранный из значений формы.
 * @param editedItem предмет до правки.
 * @returns предмет с сохранённым вторым броском и хватом.
 */
function withKeptVersatileGrip(
  updatedItem: CharacterInventoryItem,
  editedItem: CharacterInventoryItem,
): CharacterInventoryItem {
  const versatileDamage = editedItem.weapon?.versatileDamage ?? null;

  // Оружие могли переделать в доспех или безделушку — хвату там взяться не от
  // чего.
  if (!updatedItem.weapon || !versatileDamage) {
    return updatedItem;
  }

  return {
    ...updatedItem,
    weapon: { ...updatedItem.weapon, versatileDamage },
    twoHanded: editedItem.twoHanded,
  };
}

/**
 * Правка своего предмета формой листа. Группу задаёт форма (вид предмета плюс
 * магическая пометка), но скопированному магическому предмету, оставшемуся
 * безделушкой, сохраняем подпись типов из каталога («Чудесный предмет, редкий»)
 * — она точнее общей «Магический предмет».
 *
 * @param editedItem редактируемый предмет (свой либо его копия из справочника).
 * @param draft новые значения формы.
 * @returns предмет инвентаря; null — название пустое.
 */
export function toUpdatedCustomInventoryItem(
  editedItem: CharacterInventoryItem,
  draft: CustomInventoryItemDraft,
): CharacterInventoryItem | null {
  const draftItem = toCustomInventoryItem(
    editedItem.url,
    draft,
    editedItem.equipped,
  );

  const updatedItem = draftItem
    ? withKeptVersatileGrip(draftItem, editedItem)
    : null;

  if (
    !updatedItem
    || editedItem.category !== 'MAGIC_ITEM'
    || !draft.magic
    || draft.kind !== 'trinket'
  ) {
    return updatedItem;
  }

  return {
    ...updatedItem,
    typesLabel: editedItem.typesLabel,
  };
}

/**
 * Вид своего предмета по записи инвентаря (обратный разбор для формы
 * редактирования). У магического предмета группа вид не выдаёт — его узнаём по
 * параметрам оружия и доспеха.
 *
 * @param inventoryItem предмет инвентаря.
 * @returns вид своего предмета.
 */
function getCustomInventoryKind(
  inventoryItem: CharacterInventoryItem,
): CustomInventoryKind {
  if (inventoryItem.category === 'WEAPON' || inventoryItem.weapon) {
    return 'weapon';
  }

  return inventoryItem.category === 'ARMOR' || inventoryItem.armor
    ? 'armor'
    : 'trinket';
}

/**
 * Тип доспеха по его параметрам: щит распознаётся флагом, остальные типы — по
 * правилу применения модификатора Ловкости.
 *
 * @param armor параметры доспеха; null — предмет не доспех.
 * @returns тип доспеха для формы.
 */
function getCustomArmorType(armor: InventoryArmor | null): CustomArmorType {
  if (!armor) {
    return NEW_CUSTOM_INVENTORY_ITEM.armorType;
  }

  return armor.shield
    ? 'shield'
    : CUSTOM_ARMOR_TYPE_BY_DEXTERITY_MOD[armor.dexterityMod];
}

/**
 * Значения формы своего предмета из записи инвентаря — для редактирования.
 * Незаполненные для этого вида поля берутся из заготовки: игрок может сменить
 * вид предмета прямо в форме, и они должны быть осмысленными.
 *
 * @param inventoryItem предмет инвентаря.
 * @returns значения формы своего предмета.
 */
export function getCustomInventoryItemDraft(
  inventoryItem: CharacterInventoryItem,
): CustomInventoryItemDraft {
  const { armor, weapon } = inventoryItem;

  return {
    ...NEW_CUSTOM_INVENTORY_ITEM,
    kind: getCustomInventoryKind(inventoryItem),
    name: inventoryItem.name,
    magic: inventoryItem.category === 'MAGIC_ITEM',
    cost: inventoryItem.cost,
    weight: inventoryItem.weight,
    quantity: inventoryItem.quantity,
    armorType: getCustomArmorType(armor),
    baseArmorClass:
      armor?.baseArmorClass ?? NEW_CUSTOM_INVENTORY_ITEM.baseArmorClass,
    weaponCategory:
      weapon?.category ?? NEW_CUSTOM_INVENTORY_ITEM.weaponCategory,
    ranged: weapon?.ranged ?? NEW_CUSTOM_INVENTORY_ITEM.ranged,
    finesse: weapon?.finesse ?? NEW_CUSTOM_INVENTORY_ITEM.finesse,
    damageDiceCount:
      weapon?.damage?.diceCount ?? NEW_CUSTOM_INVENTORY_ITEM.damageDiceCount,
    damageDiceFaces:
      weapon?.damage?.diceFaces ?? NEW_CUSTOM_INVENTORY_ITEM.damageDiceFaces,
    damageBonus: weapon?.damage?.bonus ?? NEW_CUSTOM_INVENTORY_ITEM.damageBonus,
    damageType: weapon?.damage?.type ?? NEW_CUSTOM_INVENTORY_ITEM.damageType,
    description: [...(inventoryItem.description ?? [])],
  };
}

/**
 * Грузоподъёмность персонажа: Сила × 15 с поправкой на размер (правила 2024).
 * Неизвестный или неуказанный размер считаем средним — так лист вёл себя до
 * появления поправки.
 *
 * @param strength значение Силы.
 * @param size подпись размера персонажа; null — не указан.
 * @returns грузоподъёмность в фунтах.
 */
export function getCarryingCapacity(
  strength: number,
  size: string | null = null,
): number {
  const sizeMultiplier =
    CARRYING_CAPACITY_SIZE_MULTIPLIERS[size?.trim().toLowerCase() ?? ''] ?? 1;

  return strength * CARRYING_CAPACITY_MULTIPLIER * sizeMultiplier;
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
 * Вклад модификатора Ловкости в КД по правилу доспеха: лёгкая — модификатор
 * целиком, средняя — не больше +2 (штраф по Ловкости), тяжёлая и щит — без
 * Ловкости.
 *
 * @param mode правило применения модификатора Ловкости.
 * @param dexModifier модификатор Ловкости персонажа.
 * @returns применяемый бонус Ловкости.
 */
function getArmorDexBonus(
  mode: ArmorDexterityMod,
  dexModifier: number,
): number {
  if (mode === 'none') {
    return 0;
  }

  if (mode === 'capped') {
    return Math.min(dexModifier, ARMOR_MEDIUM_DEX_CAP);
  }

  return dexModifier;
}

/**
 * Вклад характеристик в КД: модификатор каждой выбранной характеристики в
 * порядке листа.
 *
 * @param character персонаж.
 * @param abilities выбранные характеристики класса доспеха.
 * @returns модификаторы выбранных характеристик.
 */
function getArmorClassAbilityBonuses(
  character: Character,
  abilities: AbilityKey[],
): ArmorClassAbilityBonus[] {
  return sortAbilityKeys(abilities).map((ability) => ({
    ability,
    modifier: getModifier(character.abilities[ability]),
  }));
}

/**
 * Подпись безброневого класса доспеха (например, `Без доспеха (10 + Ловкость)`).
 * В подпись идёт только Ловкость: остальные выбранные характеристики правило
 * доспеха не ограничивает, и в разборе они показываются отдельными строками.
 *
 * @param abilities выбранные характеристики класса доспеха.
 * @returns подпись безброневого класса доспеха.
 */
export function getUnarmoredArmorClassLabel(abilities: AbilityKey[]): string {
  const parts = [String(UNARMORED_ARMOR_CLASS_BASE)];

  if (abilities.includes(DEFAULT_ARMOR_CLASS_ABILITY)) {
    parts.push(ABILITY_LABELS[DEFAULT_ARMOR_CLASS_ABILITY]);
  }

  return `${SHEET_UNARMORED_LABEL} (${parts.join(' + ')})`;
}

/**
 * Разбор итогового класса доспеха. В ручном режиме (`custom`) — базовое значение
 * плюс модификаторы выбранных характеристик. В автоматическом — по надетой
 * броне: тело даёт лучшая надетая броня (или безброневой `10 + Ловкость`), щит
 * складывается сверху (в зачёт — лучший щит); модификатор Ловкости учитывается
 * по правилу брони, а остальные выбранные характеристики (безброневая защита,
 * песнь клинка) прибавляются к итогу целиком.
 *
 * @param character персонаж.
 * @returns разбор класса доспеха для листа и модалки.
 */
export function getArmorClassBreakdown(
  character: Character,
): ArmorClassBreakdown {
  const { base, abilities, custom } = character.armorClass;

  const abilityBonuses = getArmorClassAbilityBonuses(character, abilities);

  if (custom) {
    const value = abilityBonuses.reduce(
      (total, bonus) => total + bonus.modifier,
      base,
    );

    return {
      value,
      custom: true,
      bodyArmorName: null,
      bodyArmorValue: base,
      dexBonus: 0,
      dexCapped: false,
      shieldBonus: 0,
      extraAbilities: abilityBonuses,
    };
  }

  // Ловкость идёт в КД по правилу доспеха, поэтому её из общего списка
  // выделяем: остальные характеристики правило доспеха не ограничивает.
  const extraAbilities = abilityBonuses.filter(
    (bonus) => bonus.ability !== DEFAULT_ARMOR_CLASS_ABILITY,
  );

  const extraBonus = extraAbilities.reduce(
    (total, bonus) => total + bonus.modifier,
    0,
  );

  const dexModifier = abilities.includes(DEFAULT_ARMOR_CLASS_ABILITY)
    ? getModifier(character.abilities.dexterity)
    : 0;

  // Группа предмета здесь не важна: доспех со своей магической пометкой лежит
  // среди магических предметов, но КД считается по тем же параметрам `armor`.
  // Отсутствующий доспех (количество — ноль) в зачёт не идёт, даже если остался
  // помеченным надетым в старой записи листа.
  const equippedArmor = character.inventory.filter(
    (item): item is CharacterInventoryItem & { armor: InventoryArmor } =>
      item.equipped && item.armor !== null && !isMissingInventoryItem(item),
  );

  // КД тела: сравниваем по эффективному значению (база брони + Ловкость по её
  // правилу). Стартуем с безброневого КД, чтобы надетая слабая броня не роняла
  // защиту ниже `10 + Ловкость`.
  let bodyArmorName: string | null = null;
  let bodyArmorValue = UNARMORED_ARMOR_CLASS_BASE + dexModifier;
  let dexBonus = dexModifier;
  let dexCapped = false;

  for (const item of equippedArmor) {
    if (item.armor.shield) {
      continue;
    }

    const armorDexBonus = getArmorDexBonus(
      item.armor.dexterityMod,
      dexModifier,
    );

    const effectiveValue = item.armor.baseArmorClass + armorDexBonus;

    if (effectiveValue >= bodyArmorValue) {
      bodyArmorName = item.name;
      bodyArmorValue = effectiveValue;
      dexBonus = armorDexBonus;
      dexCapped = armorDexBonus < dexModifier;
    }
  }

  // Щит: в зачёт идёт лучший из надетых (несколько щитов не складываются).
  let shieldBonus = 0;

  for (const item of equippedArmor) {
    if (item.armor.shield && item.armor.baseArmorClass > shieldBonus) {
      shieldBonus = item.armor.baseArmorClass;
    }
  }

  return {
    value: bodyArmorValue + shieldBonus + extraBonus,
    custom: false,
    bodyArmorName,
    bodyArmorValue,
    dexBonus,
    dexCapped,
    shieldBonus,
    extraAbilities,
  };
}

/**
 * Итоговое числовое значение класса доспеха.
 *
 * @param character персонаж.
 * @returns итоговое значение класса доспеха.
 */
export function getArmorClassValue(character: Character): number {
  return getArmorClassBreakdown(character).value;
}

/**
 * Базовая характеристика атаки оружием: настройка листа, а если она не задана —
 * характеристика по правилам (Сила).
 *
 * @param character персонаж.
 * @returns характеристика, от которой считается атака обычным оружием.
 */
export function getWeaponAttackAbility(character: Character): AbilityKey {
  return (
    character.settings.weaponAttackAbility ?? DEFAULT_WEAPON_ATTACK_ABILITY
  );
}

/**
 * Бонус к броску атаки оружием: бонус мастерства (БаБ) плюс модификатор
 * характеристики. Базовая характеристика берётся из настроек листа (по
 * умолчанию — Сила); фехтовальное и дальнобойное оружие бьёт от Ловкости.
 *
 * @param character персонаж.
 * @param weapon параметры оружия.
 * @returns бонус атаки и использованная характеристика.
 */
export function getWeaponAttackBonus(
  character: Character,
  weapon: InventoryWeapon,
): WeaponAttack {
  const ability = getWeaponAbility(character, weapon);

  const value =
    getCharacterProficiencyBonus(character)
    + getModifier(character.abilities[ability]);

  return { value, ability };
}

/**
 * Характеристика конкретного оружия: фехтовальное и дальнобойное бьёт от
 * Ловкости, остальное — от базовой характеристики атаки из настроек листа.
 *
 * @param character персонаж.
 * @param weapon параметры оружия.
 * @returns характеристика атаки и урона этим оружием.
 */
function getWeaponAbility(
  character: Character,
  weapon: InventoryWeapon,
): AbilityKey {
  return weapon.finesse || weapon.ranged
    ? 'dexterity'
    : getWeaponAttackAbility(character);
}

/**
 * Бросок урона оружием: кости из справочника, собственный бонус оружия и
 * модификатор той же характеристики, что и у атаки. Универсальное оружие, взятое
 * двумя руками, катит свой второй бросок — кость у него больше. Использует
 * ASCII-минус — формула уходит в парсер дайс-роллера.
 *
 * @param character персонаж.
 * @param weapon параметры оружия.
 * @param twoHanded оружие взято двумя руками (свойство «Универсальное»).
 * @returns разбор броска урона или null, если справочник не дал костей урона.
 */
export function getWeaponDamage(
  character: Character,
  weapon: InventoryWeapon,
  twoHanded: boolean,
): WeaponDamage | null {
  // Хват двумя руками без второго броска ничего не меняет: оружие катит свой
  // обычный урон.
  const damage = (twoHanded ? weapon.versatileDamage : null) ?? weapon.damage;

  if (!damage) {
    return null;
  }

  const ability = getWeaponAbility(character, weapon);

  const diceNotation = `${damage.diceCount}${DICE_NOTATION_LETTER}${damage.diceFaces}`;

  const totalBonus = damage.bonus + getModifier(character.abilities[ability]);

  const sign = totalBonus < 0 ? '-' : '+';

  return {
    formula:
      totalBonus === 0
        ? diceNotation
        : `${diceNotation}${sign}${Math.abs(totalBonus)}`,
    diceNotation,
    weaponBonus: damage.bonus,
    ability,
    typeLabel: DAMAGE_TYPE_LABELS[damage.type] ?? '',
  };
}

/**
 * Исходные данные броска урона оружием для модалки настройки: кости, бонус
 * оружия и характеристика идут в неё по отдельности, чтобы игрок мог поменять
 * кость, подменить характеристику и докинуть бонус мастера.
 *
 * @param character персонаж.
 * @param weapon параметры оружия.
 * @param twoHanded оружие взято двумя руками (свойство «Универсальное»).
 * @returns данные броска или null, если справочник не дал костей урона.
 */
export function getWeaponDamageSource(
  character: Character,
  weapon: InventoryWeapon,
  twoHanded: boolean,
): DamageRollSource | null {
  const damage = getWeaponDamage(character, weapon, twoHanded);

  if (!damage) {
    return null;
  }

  return {
    diceNotation: damage.diceNotation,
    flatBonus: damage.weaponBonus,
    ability: damage.ability,
    // Модификатор характеристики входит в урон оружия ровно один раз.
    abilityModifierCount: 1,
    typeLabel: damage.typeLabel,
  };
}

/** Слагаемое нотации урона: кости («2к6») либо плоское число («3»). */
const DAMAGE_NOTATION_TERM_PATTERN = new RegExp(
  `([+-]?)(\\d+)(?:${DICE_NOTATION_LETTER}(\\d+))?`,
  'g',
);

/**
 * Разбор нотации урона на группы костей и плоский остаток: формула справочника
 * бывает составной («1к4+1», «2к6+1к8»), а модалка правит кости и бонус по
 * отдельности.
 *
 * @param notation нотация урона в записи дайс-роллера.
 * @returns группы костей в порядке записи и суммарный плоский бонус.
 */
export function parseDamageNotation(notation: string): {
  dice: DamageDiceGroup[];
  flatBonus: number;
} {
  const dice: DamageDiceGroup[] = [];

  let flatBonus = 0;

  for (const term of notation.matchAll(DAMAGE_NOTATION_TERM_PATTERN)) {
    const [, sign, amount, faces] = term;

    const value = Number(amount);
    const signedValue = sign === '-' ? -value : value;

    if (!faces) {
      flatBonus += signedValue;

      continue;
    }

    // Отрицательных костей в бросках урона не бывает: знак минуса перед костью
    // трактуем как обычную кость — иначе формула стала бы неразбираемой.
    dice.push({ count: value, faces: Number(faces) });
  }

  return { dice, flatBonus };
}

/**
 * Нотация урона из групп костей и суммарного бонуса. Использует ASCII-минус —
 * формула уходит в парсер дайс-роллера.
 *
 * @param dice группы костей урона.
 * @param bonus суммарный плоский бонус.
 * @returns формула для дайс-роллера («1к8+1к6+3»); '' — костей и бонуса нет.
 */
export function getDamageFormula(
  dice: DamageDiceGroup[],
  bonus: number,
): string {
  const dicePart = dice
    .map((group) => `${group.count}${DICE_NOTATION_LETTER}${group.faces}`)
    .join('+');

  if (bonus === 0) {
    return dicePart;
  }

  const sign = bonus < 0 ? '-' : '+';
  const bonusPart = `${sign}${Math.abs(bonus)}`;

  return dicePart ? `${dicePart}${bonusPart}` : String(bonus);
}

/**
 * Нотация костей броска проверки: режим задаёт их количество и отбор лучшей
 * либо худшей. Номинал приходит извне — бросают не только к20.
 *
 * @param mode режим броска.
 * @param faces номинал кости (20 — к20).
 * @returns нотация костей для дайс-роллера («2к20вл1»).
 */
export function getRollDiceNotation(mode: RollMode, faces: number): string {
  return `${ROLL_MODE_DICE_COUNT[mode]}${DICE_NOTATION_LETTER}${faces}${ROLL_MODE_DICE_SUFFIX[mode]}`;
}

/**
 * Формула броска проверки для дайс-роллера с учётом режима, модификатора и
 * дополнительного бонуса. Использует ASCII-минус: формула передаётся в парсер.
 *
 * @param modifier модификатор проверки.
 * @param mode режим броска.
 * @param bonus дополнительный бонус.
 * @param faces номинал кости; по умолчанию к20.
 * @returns формула в нотации дайс-роллера (например, «2к20вл1+4»).
 */
export function getCheckFormula(
  modifier: number,
  mode: RollMode,
  bonus: number,
  faces: number = DEFAULT_ROLL_DICE_FACES,
): string {
  const dicePart = getRollDiceNotation(mode, faces);
  const totalModifier = modifier + bonus;

  if (totalModifier === 0) {
    return dicePart;
  }

  const sign = totalModifier < 0 ? '-' : '+';

  return `${dicePart}${sign}${Math.abs(totalModifier)}`;
}

/**
 * Модификатор броска с подменой характеристики: из готового модификатора
 * вычитается вклад базовой характеристики и прибавляется вклад выбранной.
 * Остальные слагаемые (мастерство, владение) остаются на месте.
 *
 * @param character персонаж.
 * @param modifier модификатор броска по правилам.
 * @param baseAbility характеристика, от которой бросок считается по правилам.
 * @param ability характеристика, выбранная игроком.
 * @returns модификатор броска от выбранной характеристики.
 */
export function getSwappedRollModifier(
  character: Character,
  modifier: number,
  baseAbility: AbilityKey,
  ability: AbilityKey,
): number {
  return (
    modifier
    - getModifier(character.abilities[baseAbility])
    + getModifier(character.abilities[ability])
  );
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
 * Подпись номинала кости хитов в русской нотации.
 *
 * @param die номинал кости.
 * @returns подпись вида «к8».
 */
export function getHitDieLabel(die: number): string {
  return `${DICE_NOTATION_LETTER}${die}`;
}

/**
 * Нотация броска одной кости хитов для дайс-роллера.
 *
 * @param die номинал кости.
 * @returns формула вида «1к8».
 */
export function getHitDieFormula(die: number): string {
  return `${HIT_DICE_ROLL_COUNT}${getHitDieLabel(die)}`;
}

/**
 * Кости хитов, сгруппированные по номиналу: классовые и дополнительные
 * складываются, потому что на отдыхе тратятся одинаково. Номиналы без костей в
 * список не входят.
 *
 * @param hitDice кости хитов из классов.
 * @param extraHitDice дополнительные кости хитов.
 * @returns пулы костей по возрастанию номинала.
 */
export function getHitDicePools(
  hitDice: CharacterHitDie[],
  extraHitDice: CharacterExtraHitDie[],
): HitDicePool[] {
  const totalsByDie = new Map<number, { current: number; max: number }>();

  for (const hitDie of [...hitDice, ...extraHitDice]) {
    const pool = totalsByDie.get(hitDie.die) ?? { current: 0, max: 0 };
    const max = Math.max(0, hitDie.max);

    totalsByDie.set(hitDie.die, {
      // Схема документа значения костей не обрезает, поэтому импортированный
      // вручную лист может принести остаток больше максимума или отрицательный —
      // выбор костей на отдыхе такие значения не должны ломать.
      current: pool.current + clamp(hitDie.current, 0, max),
      max: pool.max + max,
    });
  }

  return [...totalsByDie.entries()]
    .filter(([, pool]) => pool.max > 0)
    .map(([die, pool]) => ({
      die,
      label: getHitDieLabel(die),
      current: pool.current,
      max: pool.max,
    }))
    .sort((left, right) => left.die - right.die);
}

/**
 * Изменение остатка костей хитов по номиналам: положительное количество кости
 * возвращает (продолжительный отдых), отрицательное — тратит (короткий).
 * Сперва затрагиваются классовые кости номинала, затем дополнительные; остаток
 * каждой кости не выходит за границы `[0, max]`, поэтому лишнее просто не
 * применится.
 *
 * @param hitDice кости хитов из классов.
 * @param extraHitDice дополнительные кости хитов.
 * @param amounts изменение количества костей по номиналам.
 * @returns новые списки костей хитов.
 */
export function adjustHitDice(
  hitDice: CharacterHitDie[],
  extraHitDice: CharacterExtraHitDie[],
  amounts: HitDiceAmount[],
): { hitDice: CharacterHitDie[]; extraHitDice: CharacterExtraHitDie[] } {
  // Неприменённый остаток по номиналу: тает по мере обхода костей, поэтому одно
  // и то же изменение не применится к номиналу дважды.
  const pending = new Map(
    amounts.map((pool) => [pool.die, Math.trunc(pool.count)]),
  );

  const adjust = <Die extends CharacterHitDie>(hitDie: Die): Die => {
    const left = pending.get(hitDie.die) ?? 0;

    if (left === 0) {
      return hitDie;
    }

    // Отсчёт ведётся от остатка в допустимых границах: импортированный вручную
    // лист мог принести значение вне `[0, max]`, и без этого правка такой кости
    // засчиталась бы как часть изменения, раздув его для следующих костей.
    const sane = clamp(hitDie.current, 0, hitDie.max);
    const current = clamp(sane + left, 0, hitDie.max);

    if (current === hitDie.current) {
      return hitDie;
    }

    pending.set(hitDie.die, left - (current - sane));

    return { ...hitDie, current };
  };

  return {
    hitDice: hitDice.map((hitDie) => adjust(hitDie)),
    extraHitDice: extraHitDice.map((hitDie) => adjust(hitDie)),
  };
}

/**
 * Полный возврат костей хитов: остаток каждой кости поднимается до максимума —
 * так продолжительный отдых работает в редакции 2024 года. Импортированный
 * вручную лист мог принести отрицательный максимум, поэтому остаток не
 * опускается ниже нуля.
 *
 * @param hitDice кости хитов из классов.
 * @param extraHitDice дополнительные кости хитов.
 * @returns новые списки костей хитов.
 */
export function restoreHitDice(
  hitDice: CharacterHitDie[],
  extraHitDice: CharacterExtraHitDie[],
): { hitDice: CharacterHitDie[]; extraHitDice: CharacterExtraHitDie[] } {
  const restore = <Die extends CharacterHitDie>(hitDie: Die): Die => ({
    ...hitDie,
    current: Math.max(0, hitDie.max),
  });

  return {
    hitDice: hitDice.map((hitDie) => restore(hitDie)),
    extraHitDice: extraHitDice.map((hitDie) => restore(hitDie)),
  };
}

/**
 * Выбранные на отдыхе кости, обрезанные пределами номиналов: выбор живёт в
 * модалке, а пределы (остаток костей или нехватка до максимума) меняются после
 * каждого применения. Номиналы без выбора в результат не входят.
 *
 * @param pools пулы костей хитов с пределом выбора.
 * @param counts выбранное количество костей по номиналам.
 * @returns количество костей по номиналам.
 */
export function getSelectedHitDice(
  pools: HitDiceSelectPool[],
  counts: Record<number, number>,
): HitDiceAmount[] {
  return pools
    .map((pool) => ({
      die: pool.die,
      count: clamp(counts[pool.die] ?? 0, 0, pool.limit),
    }))
    .filter((pool) => pool.count > 0);
}

/**
 * Какие кости хитов возвращает продолжительный отдых: по правилам D&D 2024 —
 * все потраченные, без деления пополам и без выбора номиналов. Номиналы без
 * траты в список не входят.
 *
 * @param pools пулы костей хитов по номиналам.
 * @returns количество костей к возврату по номиналам.
 */
export function getLongRestHitDiceRecovery(
  pools: HitDicePool[],
): HitDiceAmount[] {
  return pools
    .map((pool) => ({ die: pool.die, count: pool.max - pool.current }))
    .filter((pool) => pool.count > 0);
}

/**
 * Что вернёт продолжительный отдых, кроме хитов и костей: ячейки заклинаний и
 * все счётчики умений — и с продолжительным, и с коротким восстановлением.
 *
 * @param character персонаж.
 * @returns подписи восстанавливаемого; пустой список — восстанавливать нечего.
 */
export function getLongRestRecoveryLabels(character: Character): string[] {
  const resourceLabels = character.classResources.map(
    (resource) => resource.name,
  );

  return getSpellSlotRows(character).length > 0
    ? [ALL_SPELL_SLOTS_LABEL, ...resourceLabels]
    : resourceLabels;
}

/**
 * Хиты, восстановленные одной костью хитов: выпавшее значение плюс модификатор
 * Телосложения, но не меньше нуля (правило D&D 2024).
 *
 * @param rolled выпавшее на кости значение.
 * @param modifier модификатор Телосложения.
 * @returns восстановленные хиты за кость.
 */
export function getHitDieRestore(rolled: number, modifier: number): number {
  return Math.max(0, rolled + modifier);
}

/**
 * Среднее значение кости хитов по правилам D&D 2024: половина номинала плюс
 * один (среднее броска, округлённое вверх).
 *
 * @param die номинал кости хитов.
 * @returns среднее значение кости.
 */
export function getHitDieAverage(die: number): number {
  return Math.floor(die / 2) + 1;
}

/**
 * Прирост максимума хитов за один уровень: значение кости плюс модификатор
 * Телосложения, но не меньше одного хита (правило D&D 2024).
 *
 * @param dieValue значение кости (среднее, максимум или бросок).
 * @param modifier модификатор Телосложения.
 * @returns прирост максимума хитов.
 */
export function getLevelHitPointsGain(
  dieValue: number,
  modifier: number,
): number {
  return Math.max(HIT_POINTS_LEVEL_GAIN_MIN, dieValue + modifier);
}

/**
 * Раскладка максимума хитов класса по уровням: первый уровень даёт максимум
 * кости, каждый следующий — её среднее значение; модификатор Телосложения
 * прибавляется на каждом уровне (правило D&D 2024).
 *
 * @param die номинал кости хитов класса.
 * @param level уровень персонажа.
 * @param modifier модификатор Телосложения.
 * @returns прирост максимума хитов по уровням.
 */
export function getClassLevelHitPoints(
  die: number,
  level: number,
  modifier: number,
): CharacterLevelHitPoints[] {
  const levels = Math.max(0, Math.trunc(level));

  return Array.from({ length: levels }, (_, index) => ({
    level: index + 1,
    amount:
      index === 0
        ? getLevelHitPointsGain(die, modifier)
        : getLevelHitPointsGain(getHitDieAverage(die), modifier),
  }));
}

/**
 * Максимум хитов класса на уровне — сумма раскладки по уровням.
 *
 * @param die номинал кости хитов класса.
 * @param level уровень персонажа.
 * @param modifier модификатор Телосложения.
 * @returns максимум хитов на уровне.
 */
export function getClassMaxHitPoints(
  die: number,
  level: number,
  modifier: number,
): number {
  return getTotalLevelHitPoints(getClassLevelHitPoints(die, level, modifier));
}

/**
 * Сумма прироста максимума хитов по записям уровней.
 *
 * @param gains записи прироста максимума хитов.
 * @returns суммарный прирост максимума хитов.
 */
function getTotalLevelHitPoints(gains: CharacterLevelHitPoints[]): number {
  return gains.reduce((total, gain) => total + gain.amount, 0);
}

/**
 * Учёт хитов за взятые уровни: прирост записывается по уровням, максимум и
 * текущие хиты растут на его сумму. Записи уровней с теми же номерами
 * заменяются — уровень мог быть взят заново после понижения.
 *
 * @param health здоровье персонажа.
 * @param previousLevel уровень до повышения.
 * @param gains прирост максимума хитов за каждый взятый уровень по порядку.
 * @returns новое здоровье персонажа.
 */
function applyLevelHitPoints(
  health: CharacterHealth,
  previousLevel: number,
  gains: number[],
): CharacterHealth {
  const addedGains = gains.map((amount, index) => ({
    level: previousLevel + index + 1,
    amount: Math.max(0, Math.trunc(amount)),
  }));

  const addedLevels = new Set(addedGains.map((gain) => gain.level));

  const levelGains = [
    ...health.levelGains.filter((gain) => !addedLevels.has(gain.level)),
    ...addedGains,
  ].sort((left, right) => left.level - right.level);

  const total = getTotalLevelHitPoints(addedGains);

  const max = health.max + total;

  return {
    ...health,
    max,
    current: clamp(health.current + total, 0, max),
    levelGains,
  };
}

/**
 * Сколько максимума хитов дали уровни выше указанного — столько вернёт
 * снижение уровня.
 *
 * @param health здоровье персонажа.
 * @param level новый уровень персонажа.
 * @returns прирост, записанный за снимаемые уровни.
 */
export function getLevelHitPointsLoss(
  health: CharacterHealth,
  level: number,
): number {
  return getTotalLevelHitPoints(
    health.levelGains.filter((gain) => gain.level > level),
  );
}

/**
 * Снятие хитов за уровни выше нового: максимум уменьшается на записанный за них
 * прирост, записи этих уровней удаляются, текущие хиты обрезаются новым
 * максимумом. Уровни без записи максимум не двигают.
 *
 * @param health здоровье персонажа.
 * @param level новый уровень персонажа.
 * @returns новое здоровье персонажа.
 */
function removeLevelHitPoints(
  health: CharacterHealth,
  level: number,
): CharacterHealth {
  const levelGains = health.levelGains.filter((gain) => gain.level <= level);

  const loss = getLevelHitPointsLoss(health, level);

  if (loss === 0) {
    return { ...health, levelGains };
  }

  const max = Math.max(0, health.max - loss);

  return {
    ...health,
    max,
    current: clamp(health.current, 0, max),
    levelGains,
  };
}

/**
 * Пересчёт здоровья при смене уровня: взятые уровни дописывают прирост в
 * максимум и текущие хиты, снятые — возвращают записанный за них прирост.
 * Уровень без изменений здоровье не трогает.
 *
 * @param health здоровье персонажа.
 * @param previousLevel уровень до смены.
 * @param nextLevel новый уровень персонажа.
 * @param gains прирост максимума хитов за каждый взятый уровень по порядку.
 * @returns новое здоровье персонажа.
 */
export function adjustHealthForLevel(
  health: CharacterHealth,
  previousLevel: number,
  nextLevel: number,
  gains: number[],
): CharacterHealth {
  if (nextLevel > previousLevel) {
    return applyLevelHitPoints(health, previousLevel, gains);
  }

  if (nextLevel < previousLevel) {
    return removeLevelHitPoints(health, nextLevel);
  }

  return health;
}

/**
 * Смещение количества классовых костей хитов при смене уровня: изменение
 * применяется к кости номинала класса — новые кости приходят непотраченными, а
 * снижение уровня забирает сперва непотраченные. Кости других номиналов
 * (например, добавленные вручную) не трогаются; если кости класса в списке нет,
 * положительное изменение её создаёт.
 *
 * @param hitDice кости хитов из классов.
 * @param die номинал кости хитов класса.
 * @param delta изменение количества костей (разница уровней).
 * @returns новый список костей хитов.
 */
export function shiftClassHitDice(
  hitDice: CharacterHitDie[],
  die: number,
  delta: number,
): CharacterHitDie[] {
  const hasClassDie = hitDice.some((hitDie) => hitDie.die === die);

  if (!hasClassDie) {
    return delta > 0
      ? [...hitDice, { die, current: delta, max: delta }]
      : hitDice;
  }

  return hitDice.map((hitDie) => {
    if (hitDie.die !== die) {
      return hitDie;
    }

    const max = Math.max(0, hitDie.max + delta);

    return { ...hitDie, max, current: clamp(hitDie.current + delta, 0, max) };
  });
}

/**
 * Пересчёт здоровья при смене значения Телосложения: его модификатор входит в
 * максимум хитов на каждом уровне, поэтому изменение модификатора двигает
 * максимум и текущие хиты на разницу, умноженную на уровень. Незаполненное
 * здоровье (нулевой максимум) не трогается — прибавлять не к чему.
 *
 * @param health здоровье персонажа.
 * @param level уровень персонажа.
 * @param previousScore прежнее значение Телосложения.
 * @param nextScore новое значение Телосложения.
 * @returns новое здоровье персонажа.
 */
export function adjustHealthForConstitution(
  health: CharacterHealth,
  level: number,
  previousScore: number,
  nextScore: number,
): CharacterHealth {
  const modifierDelta = getModifier(nextScore) - getModifier(previousScore);

  const delta = modifierDelta * level;

  if (delta === 0 || health.max <= 0) {
    return health;
  }

  const max = Math.max(HIT_POINTS_LEVEL_GAIN_MIN, health.max + delta);

  return {
    ...health,
    max,
    current: clamp(health.current + delta, 0, max),
    // Модификатор входит в прирост каждого уровня, поэтому записи двигаются
    // вместе с максимумом: иначе снижение уровня вернуло бы устаревшую сумму.
    levelGains: health.levelGains.map((gain) => ({
      ...gain,
      amount: Math.max(HIT_POINTS_LEVEL_GAIN_MIN, gain.amount + modifierDelta),
    })),
  };
}

/**
 * Что вернёт короткий отдых, кроме хитов: ресурсы класса с восстановлением
 * «короткий отдых» и ячейки заклинаний договора колдуна.
 *
 * @param character персонаж.
 * @returns подписи восстанавливаемого; пустой список — восстанавливать нечего.
 */
export function getShortRestRecoveryLabels(character: Character): string[] {
  const resourceLabels = character.classResources
    .filter((resource) => resource.recovery === 'short-rest')
    .map((resource) => resource.name);

  const hasPactSlots = getSpellSlotRows(character).some(
    (row) => row.recovery === 'short-rest',
  );

  return hasPactSlots
    ? [PACT_SPELL_SLOTS_LABEL, ...resourceLabels]
    : resourceLabels;
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
 * Пояснение к предупреждению о потраченных ячейках круга: бросок при этом
 * состоялся, поэтому текст говорит, что именно осталось несделанным.
 *
 * @param level круг заклинания.
 * @returns описание для тоста.
 */
export function getSpellSlotsEmptyDescription(level: number): string {
  return `Все ячейки (${getSpellLevelLabel(level).toLowerCase()}) уже потрачены — бросок сделан, ячейка не списана.`;
}

/**
 * Круги, которые список заклинаний уже показывает: круги самих заклинаний и
 * круги с ячейками. Ячейки идут отдельно — их тратят и на повышение круга уже
 * известного заклинания, поэтому круг с ячейками виден и без своих заклинаний.
 * Не путать с `getAvailableSpellLevels`: там круги, которые даёт класс, здесь —
 * круги, которые уже есть на руках.
 *
 * @param spells заклинания списка (книга, врождённые).
 * @param slotLevels круги, у которых есть ячейки заклинаний.
 * @returns круги по возрастанию, заговоры первыми.
 */
export function getSpellListLevels(
  spells: CharacterSpell[],
  slotLevels: number[],
): number[] {
  return [
    ...new Set([...spells.map((spell) => spell.level), ...slotLevels]),
  ].sort((left, right) => left - right);
}

/**
 * Проходит ли заклинание отбор вкладки: подготовленное — только помеченное
 * значком (заговоры и врождённые подготовки не требуют, поэтому под таким
 * отбором их не остаётся), круг — любой из отобранных.
 *
 * @param spell заклинание списка.
 * @param filter отбор вкладки заклинаний.
 * @returns true — заклинание остаётся в списке.
 */
export function matchesSpellFilter(
  spell: CharacterSpell,
  filter: SpellTabFilter,
): boolean {
  if (filter.preparedOnly && !(isPreparableSpell(spell) && spell.prepared)) {
    return false;
  }

  return !filter.levels.length || filter.levels.includes(spell.level);
}

/**
 * Оформление чипа отбора: выбранный горит тёплым, невыбранный теплеет только
 * под курсором.
 *
 * @param isSelected чип выбран.
 * @returns классы чипа.
 */
export function getFilterChipClass(isSelected: boolean): string {
  return `${FILTER_CHIP_CLASS} ${isSelected ? FILTER_CHIP_SELECTED_CLASS : FILTER_CHIP_IDLE_CLASS}`;
}

/**
 * Группировка заклинаний по кругам: заговоры, затем круги по возрастанию;
 * внутри круга — по алфавиту. Круги из `slotLevels` попадают в результат даже
 * без заклинаний: ячейки этих кругов тратятся и на повышение круга уже
 * известных заклинаний, поэтому их разделитель нужен всегда.
 *
 * @param spells заклинания книги персонажа.
 * @param slotLevels круги, у которых есть ячейки заклинаний.
 * @returns группы заклинаний с подписями для разделителей.
 */
export function getSpellGroups(
  spells: CharacterSpell[],
  slotLevels: number[],
): CharacterSpellGroup[] {
  return getSpellListLevels(spells, slotLevels).map((level) => ({
    level,
    label: getSpellGroupLabel(level),
    spells: spells
      .filter((spell) => spell.level === level)
      .sort((left, right) => left.name.localeCompare(right.name, 'ru')),
  }));
}

/**
 * Возвращает врождённые заклинания, уже открытые на текущем уровне персонажа.
 *
 * @param character персонаж листа.
 * @returns доступные врождённые заклинания вида и происхождения.
 */
export function getAvailableInnateSpells(
  character: Character,
): CharacterSpell[] {
  return (character.species?.innateSpells ?? [])
    .filter((innateSpell) => innateSpell.requiredLevel <= character.level)
    .map((innateSpell) => innateSpell.spell);
}

/**
 * Своё ли это заклинание: добавлено формой листа, а не выбрано из каталога.
 * У своих заклинаний нет страницы в разделе «Заклинания», поэтому описание они
 * хранят прямо в листе.
 *
 * @param spell заклинание книги персонажа.
 * @returns true — заклинание своё.
 */
export function isCustomSpell(spell: CharacterSpell): boolean {
  return spell.url.startsWith(CUSTOM_SPELL_URL_PREFIX);
}

/**
 * Требует ли заклинание подготовки: заговоры доступны всегда и в число
 * подготовленных не входят, поэтому пометить их нельзя. Врождённые заклинания
 * вида в книге персонажа не лежат — подготовка их тоже не касается.
 *
 * @param spell заклинание книги персонажа.
 * @returns true — заклинание можно пометить подготовленным.
 */
export function isPreparableSpell(spell: CharacterSpell): boolean {
  return spell.level > CANTRIP_SPELL_LEVEL;
}

/**
 * Заполненные характеристики своего заклинания (время, дистанция, компоненты,
 * длительность) для развёрнутой карточки; незаполненные поля пропускаются.
 *
 * @param spell заклинание книги персонажа.
 * @returns строки «подпись — значение».
 */
export function getSpellStatRows(spell: CharacterSpell): CustomSpellStatRow[] {
  return CUSTOM_SPELL_FIELDS.map((field) => ({
    key: field.key,
    label: field.label,
    value: spell[field.key]?.trim() ?? '',
  })).filter((row) => row.value);
}

/**
 * Разделитель взаимоисключающих формул урона внутри одной записи справочника:
 * пробелы вокруг плюса отличают выбор формулы от слагаемого («+1»).
 */
const SPELL_DAMAGE_VARIANT_SEPARATOR = ' + ';

/** Тег формулы справочника: `@dmg.fire`, `@target.full`, `@mod.spell`. */
const SPELL_FORMULA_TAG_PATTERN = /@[a-z]+(?:\.[a-z]+)*/gi;

/** Тег вместе с предшествующим плюсом — так его вырезают из формулы целиком. */
const SPELL_FORMULA_TAG_WITH_SIGN_PATTERN = /\+?@[a-z]+(?:\.[a-z]+)*/gi;

/** Латинское и русское обозначение кости в формуле справочника (`8d6`). */
const SPELL_FORMULA_DICE_LETTER_PATTERN = /(\d)[dд](\d)/gi;

/** Пробелы внутри формулы — дайс-роллеру они не нужны. */
const SPELL_FORMULA_SPACE_PATTERN = /\s+/g;

/**
 * Формула, которую понимает дайс-роллер: кости и слагаемые через плюс-минус.
 * Всё, что после разбора тегов в неё не уложилось, показывать нельзя — бросок
 * с потерянной частью формулы врал бы.
 */
const SPELL_DAMAGE_EXPRESSION_PATTERN = new RegExp(
  `^\\d+(?:${DICE_NOTATION_LETTER}\\d+)?(?:[+-]\\d+(?:${DICE_NOTATION_LETTER}\\d+)?)*$`,
);

/** Разобранные теги одной формулы урона. */
interface SpellDamageTags {
  /** Названия типов урона в порядке появления; пусто — тип не распознан. */
  typeLabels: string[];

  /** Формула помечена тегом типа урона (а не лечения). */
  hasDamageType: boolean;

  /** Название условия применения формулы; '' — условия нет. */
  conditionLabel: string;

  /** Сколько раз в формулу входит модификатор заклинательной характеристики. */
  abilityModifierCount: number;
}

/**
 * Разбор тегов одной формулы справочника. Незнакомый тег (лечение, чужой
 * модификатор) делает формулу непригодной: подставить его нечем, а выкинуть —
 * значит соврать в броске.
 *
 * @param formula формула урона из справочника.
 * @returns разобранные теги; null — встретился неподдерживаемый тег.
 */
function parseSpellDamageTags(formula: string): SpellDamageTags | null {
  const tags: SpellDamageTags = {
    typeLabels: [],
    hasDamageType: false,
    conditionLabel: '',
    abilityModifierCount: 0,
  };

  for (const match of formula.matchAll(SPELL_FORMULA_TAG_PATTERN)) {
    const tag = match[0].slice(1);

    if (tag.startsWith(SPELL_DAMAGE_TYPE_TAG_PREFIX)) {
      tags.hasDamageType = true;

      const typeLabel = SPELL_DAMAGE_TYPE_TAG_LABELS[tag];

      if (typeLabel && !tags.typeLabels.includes(typeLabel)) {
        tags.typeLabels.push(typeLabel);
      }

      continue;
    }

    if (tag in SPELL_DAMAGE_CONDITION_TAG_LABELS) {
      tags.conditionLabel = SPELL_DAMAGE_CONDITION_TAG_LABELS[tag] ?? '';

      continue;
    }

    if (tag === SPELL_DAMAGE_ABILITY_MODIFIER_TAG) {
      tags.abilityModifierCount += 1;

      continue;
    }

    return null;
  }

  return tags.hasDamageType ? tags : null;
}

/**
 * Кости броска из записи справочника: теги вырезаются, а кость приводится к
 * нотации дайс-роллера. Модификатор заклинательной характеристики сюда не
 * входит — его подставляют отдельно, чтобы его можно было пересчитать.
 *
 * @param formula формула урона из справочника.
 * @returns нотация костей для дайс-роллера («8к6»).
 */
function getSpellDamageDiceNotation(formula: string): string {
  return formula
    .replace(SPELL_FORMULA_TAG_WITH_SIGN_PATTERN, '')
    .replace(SPELL_FORMULA_SPACE_PATTERN, '')
    .replace(SPELL_FORMULA_DICE_LETTER_PATTERN, `$1${DICE_NOTATION_LETTER}$2`);
}

/**
 * Формула броска из записи справочника: к костям добавляется модификатор
 * заклинательной характеристики числом.
 *
 * @param diceNotation нотация костей броска.
 * @param abilityBonus суммарный модификатор из тегов `mod.spell`.
 * @returns формула для дайс-роллера; '' — разобрать её не удалось.
 */
function getSpellDamageExpression(
  diceNotation: string,
  abilityBonus: number,
): string {
  const sign = abilityBonus < 0 ? '-' : '+';

  const expression =
    abilityBonus === 0
      ? diceNotation
      : `${diceNotation}${sign}${Math.abs(abilityBonus)}`;

  return SPELL_DAMAGE_EXPRESSION_PATTERN.test(expression) ? expression : '';
}

/**
 * Броски урона заклинания из формул справочника. Одна запись справочника может
 * описывать несколько взаимоисключающих бросков (кость зависит от состояния
 * цели) — каждый становится отдельной плиткой. Лечение и формулы с
 * неподдерживаемыми тегами пропускаются: плитка урона о них не говорит.
 *
 * @param damageFormulas формулы урона заклинания из справочника.
 * @param spellAbilityModifier модификатор заклинательной характеристики.
 * @returns броски урона в порядке справочника; пусто — урона у заклинания нет.
 */
export function getSpellDamage(
  damageFormulas: string[],
  spellAbilityModifier: number,
): SpellDamage[] {
  return damageFormulas
    .flatMap((damageFormula) =>
      damageFormula.split(SPELL_DAMAGE_VARIANT_SEPARATOR),
    )
    .map((formula) => {
      const tags = parseSpellDamageTags(formula);

      if (!tags) {
        return null;
      }

      const diceNotation = getSpellDamageDiceNotation(formula);

      const expression = getSpellDamageExpression(
        diceNotation,
        tags.abilityModifierCount * spellAbilityModifier,
      );

      if (!expression) {
        return null;
      }

      return {
        formula: expression,
        diceNotation,
        abilityModifierCount: tags.abilityModifierCount,
        typeLabel: tags.typeLabels.join(SPELL_DAMAGE_TYPE_SEPARATOR),
        conditionLabel: tags.conditionLabel,
      };
    })
    .filter((damage): damage is SpellDamage => damage !== null);
}

/**
 * Заклинание книги из значений формы своего заклинания. Пустое название
 * означает незаполненную форму — такое заклинание не создаётся.
 *
 * @param url URL заклинания (`custom:` + идентификатор).
 * @param draft значения формы.
 * @returns заклинание книги; null — название пустое.
 */
export function toCustomSpell(
  url: string,
  draft: CustomSpellDraft,
): CharacterSpell | null {
  const name = draft.name.trim();

  if (!name) {
    return null;
  }

  return {
    url,
    name,
    level: draft.level,
    school: draft.school.trim(),
    concentration: draft.concentration,
    ritual: draft.ritual,
    castingTime: draft.castingTime.trim(),
    range: draft.range.trim(),
    components: draft.components.trim(),
    duration: draft.duration.trim(),
    description: [...draft.description],
  };
}

/**
 * Своя копия каталожного заклинания: круг, школа и признаки концентрации с
 * ритуалом остаются прежними, а характеристики с описанием переезжают из
 * справочника в лист — у каталожных записей их в документе нет. Новый URL с
 * префиксом `custom:` делает запись своей: дальше её правит форма листа.
 *
 * @param url URL копии (`custom:` + идентификатор).
 * @param spell каталожное заклинание книги.
 * @param detail деталь из справочника; null — не загрузилась.
 * @returns заклинание книги, помеченное как своё.
 */
export function toCopiedSpell(
  url: string,
  spell: CharacterSpell,
  detail: CatalogSpellDetail | null,
): CharacterSpell {
  return {
    ...spell,
    url,
    castingTime: detail?.castingTime ?? '',
    range: detail?.range ?? '',
    components: detail?.components ?? '',
    duration: detail?.duration ?? '',
    description: detail ? [...detail.description] : [],
  };
}

/**
 * Приведение названия записи справочника к сопоставимому виду: регистр, «ё» и
 * лишние пробелы у названий каталога, листа и чужих файлов расходятся
 * («инструменты стеклодува», «Инструменты  ткача »). Одна на все сопоставления
 * по названию — классы, инструменты, предметы импорта.
 *
 * @param name название записи.
 * @returns нормализованное название.
 */
export function normalizeCatalogName(name: string): string {
  return name.trim().toLowerCase().replaceAll('ё', 'е').replace(/\s+/gu, ' ');
}

/**
 * Заклинательная характеристика класса по его базовому названию (для режима
 * «Авто»). Классы-незаклинатели и отсутствие класса дают null.
 *
 * @param characterClass класс персонажа; null — не выбран.
 * @returns заклинательная характеристика или null, если не определена.
 */
export function getClassSpellcastingAbility(
  characterClass: CharacterClass | null,
): AbilityKey | null {
  if (!characterClass) {
    return null;
  }

  return (
    CLASS_SPELLCASTING_ABILITIES[normalizeCatalogName(characterClass.name)]
    ?? null
  );
}

/**
 * Тип заклинательства класса по его названию и названию подкласса. Запасной
 * путь для листов, сохранённых до появления `casterType`: у воина и плута
 * ячейки даёт подкласс (мистический рыцарь и мистический ловкач).
 *
 * @param characterClass класс персонажа.
 * @returns тип заклинательства; null — класс ячеек заклинаний не даёт.
 */
function getLegacyCasterType(
  characterClass: CharacterClass,
): CasterType | null {
  const casterType =
    CLASS_SPELL_PROGRESSIONS[normalizeCatalogName(characterClass.name)];

  if (casterType) {
    return casterType;
  }

  const { subclassName } = characterClass;

  return subclassName
    && THIRD_CASTER_SUBCLASSES.includes(normalizeCatalogName(subclassName))
    ? CasterType.THIRD
    : null;
}

/**
 * Тип заклинательства класса персонажа: берётся из листа (`casterType`
 * справочника, записанный визардом класса), а у листов без этого поля
 * определяется по названию класса и подкласса.
 *
 * @param characterClass класс персонажа; null — не выбран.
 * @returns тип заклинательства; null — класс ячеек заклинаний не даёт.
 */
export function getClassCasterType(
  characterClass: CharacterClass | null,
): CasterType | null {
  if (!characterClass) {
    return null;
  }

  return characterClass.casterType ?? getLegacyCasterType(characterClass);
}

/**
 * Тип заклинательства выбранной в визарде пары «класс — подкласс». Подкласс
 * перекрывает класс, только когда сам даёт заклинательство: ячейки воина и
 * плута появляются лишь у мистического рыцаря и мистического ловкача, а
 * остальные их подклассы (как и класс) заклинательства не дают.
 *
 * @param classSummary деталь выбранного класса.
 * @param subclassSummary деталь выбранного подкласса; null — не выбран.
 * @returns тип заклинательства для записи в лист.
 */
export function getSelectedCasterType(
  classSummary: ClassSummary,
  subclassSummary: ClassSummary | null,
): CasterType | null {
  const subclassCasterType = subclassSummary?.casterType;

  return subclassCasterType && subclassCasterType !== CasterType.NONE
    ? subclassCasterType
    : classSummary.casterType;
}

/**
 * Строка таблицы ячеек заклинаний для типа заклинательства и уровня персонажа.
 * Таблицы общие с разделом «Классы» — там ими рисуется прогрессия класса.
 *
 * @param casterType тип заклинательства класса.
 * @param level уровень персонажа (нормализованный).
 * @returns количество ячеек по кругам, индекс — круг минус 1.
 */
function getCasterTypeSpellSlots(
  casterType: CasterType,
  level: Level,
): number[] {
  if (casterType === CasterType.FULL) {
    return FULL_CASTER_SPELL_SLOTS[level];
  }

  if (casterType === CasterType.HALF) {
    return HALF_CASTER_SPELL_SLOTS[level];
  }

  if (casterType === CasterType.THIRD) {
    return THIRD_CASTER_SPELL_SLOTS[level];
  }

  if (casterType === CasterType.MULTICLASS) {
    return MULTICLASS_SPELL_SLOTS[level];
  }

  // Все ячейки колдуна — одного круга: младшие круги остаются пустыми и в
  // разделители списка не попадают.
  if (casterType === CasterType.PACT) {
    const pactLevel = PACT_CASTER_SPELL_SLOTS_LEVEL[level];

    return Array.from({ length: pactLevel }, (_slot, index) =>
      index === pactLevel - 1 ? PACT_CASTER_SPELL_SLOTS_COUNT[level] : 0,
    );
  }

  return [];
}

/**
 * Количество ячеек заклинаний по кругам для класса и уровня персонажа. Уровень
 * вне диапазона таблиц (битый документ) ячеек не даёт.
 *
 * @param casterType тип заклинательства класса.
 * @param level уровень персонажа.
 * @returns количество ячеек, индекс — круг минус 1.
 */
function getSpellSlotMaximums(casterType: CasterType, level: number): number[] {
  const characterLevel = LEVELS.find(
    (tableLevel) => tableLevel === Math.trunc(level),
  );

  return characterLevel
    ? getCasterTypeSpellSlots(casterType, characterLevel)
    : [];
}

/**
 * Ряды ячеек заклинаний персонажа: максимум круга считается по классу и уровню,
 * трата берётся с листа и обрезается по максимуму (уровень мог измениться после
 * траты). Круги без ячеек в результат не входят.
 *
 * @param character персонаж.
 * @returns ряды ячеек по возрастанию круга.
 */
export function getSpellSlotRows(character: Character): SpellSlotRow[] {
  const casterType = getClassCasterType(character.characterClass);

  if (!casterType) {
    return [];
  }

  // Ячейки договора колдуна возвращаются коротким отдыхом, обычные — только
  // продолжительным.
  const recovery: ResourceRecovery =
    casterType === CasterType.PACT ? 'short-rest' : 'long-rest';

  const usedByLevel = new Map(
    character.spellSlots.map((slot) => [slot.level, slot.used]),
  );

  return getSpellSlotMaximums(casterType, character.level)
    .map((max, index) => ({
      level: index + 1,
      max,
      used: clamp(usedByLevel.get(index + 1) ?? 0, 0, max),
      recovery,
    }))
    .filter((row) => row.max > 0);
}

/**
 * Кружки ячеек круга для разделителя списка заклинаний: закрашенные кружки —
 * потраченные ячейки, пустые — оставшиеся.
 *
 * @param row ряд ячеек круга.
 * @returns кружки по порядку с подписями для скринридера.
 */
export function getSpellSlotCircles(row: SpellSlotRow): SpellSlotCircle[] {
  return Array.from({ length: row.max }, (_slot, index) => {
    const used = index < row.used;

    return {
      index,
      used,
      label: `${getSpellLevelLabel(row.level)}, ячейка ${index + 1}: ${
        used ? SPELL_SLOT_USED_LABEL : SPELL_SLOT_FREE_LABEL
      }`,
    };
  });
}

/**
 * Подсказка ряда ячеек круга: сколько ячеек осталось и чем они восстанавливаются.
 *
 * @param row ряд ячеек круга.
 * @returns строка подсказки для тултипа разделителя.
 */
export function getSpellSlotSummary(row: SpellSlotRow): string {
  const free = row.max - row.used;

  return `Свободно ячеек: ${free} из ${row.max} · ${RESOURCE_RECOVERY_LABELS[row.recovery]}`;
}

/**
 * Круги заклинаний, доступные персонажу на его уровне класса: заговоры и все
 * круги вплоть до старшего, для которого класс даёт ячейки. Отдельно нигде не
 * хранится — считается от `casterType` и уровня, поэтому повышение и снижение
 * уровня меняют список сами собой.
 *
 * @param character персонаж.
 * @returns круги по возрастанию; пусто — класс заклинаний пока не даёт.
 */
export function getAvailableSpellLevels(character: Character): number[] {
  const slotRows = getSpellSlotRows(character);

  if (!slotRows.length) {
    return [];
  }

  // Ячейки колдуна одного круга: младших рядов у него нет, но заклинания этих
  // кругов ему доступны — считаем по старшему ряду, а не по их количеству.
  const maxLevel = Math.max(...slotRows.map((row) => row.level));

  return Array.from(
    { length: maxLevel + 1 },
    (_availableLevel, index) => index,
  );
}

/**
 * Начальный выбор фильтров каталога заклинаний по персонажу: доступные круги и
 * его класс. Каталог открывается уже суженным до того, что персонаж способен
 * выучить, а не до всего справочника.
 *
 * @param character персонаж.
 * @returns пресет фильтров модалки добавления заклинаний.
 */
export function getSpellCatalogPreset(
  character: Character,
): SpellCatalogPreset {
  return {
    levels: getAvailableSpellLevels(character),
    classUrl: character.characterClass?.url ?? '',
  };
}

/** Всё, кроме букв: названия колонок таблицы класса сравниваются без них. */
const NON_LETTER_PATTERN = /\P{L}/gu;

/** Целое неотрицательное число целиком (значение колонки таблицы класса). */
const INTEGER_VALUE_PATTERN = /^\d+$/;

/**
 * Колонка таблицы класса с числом подготовленных заклинаний. Название
 * справочник сокращает по-разному («Подг. закл.», «Подг. Закл»), поэтому
 * сравниваются только буквы: название начинается с «подг» и содержит «закл».
 *
 * @param column колонка таблицы прогрессии класса.
 * @returns колонка описывает подготовленные заклинания.
 */
function isPreparedSpellsColumn(column: ClassTableColumn): boolean {
  const letters = column.name.toLowerCase().replace(NON_LETTER_PATTERN, '');

  return (
    letters.startsWith(PREPARED_SPELLS_COLUMN_PREFIX)
    && letters.includes(PREPARED_SPELLS_COLUMN_KEYWORD)
  );
}

/**
 * Прогрессия числа подготовленных заклинаний из таблицы прогрессии. Таблицу
 * отдаёт справочник, поэтому лист запоминает её при выборе класса: колонка
 * бывает и у класса (заклинатели), и только у подкласса (мистический рыцарь).
 * Нечисловые значения колонки отбрасываются.
 *
 * @param table таблица прогрессии класса и подкласса.
 * @returns записи «с уровня — столько заклинаний» по возрастанию уровня.
 */
export function derivePreparedSpellsScaling(
  table: ClassTableColumn[],
): PreparedSpellsScaling[] {
  const column = table.find(isPreparedSpellsColumn);

  if (!column) {
    return [];
  }

  return column.scaling
    .filter((entry) => INTEGER_VALUE_PATTERN.test(entry.value.trim()))
    .map((entry) => ({ level: entry.level, value: Number(entry.value) }))
    .sort((firstEntry, secondEntry) => firstEntry.level - secondEntry.level);
}

/**
 * Число подготовленных заклинаний по таблице класса на уровне персонажа:
 * берётся запись с наибольшим уровнем, не превышающим текущий.
 *
 * @param scaling прогрессия подготовленных заклинаний класса.
 * @param level уровень персонажа.
 * @returns число заклинаний; null — записи для уровня нет.
 */
function getPreparedSpellsAtLevel(
  scaling: PreparedSpellsScaling[],
  level: number,
): number | null {
  let value: number | null = null;

  for (const entry of scaling) {
    if (entry.level <= level) {
      value = entry.value;
    }
  }

  return value;
}

/**
 * Разбор числа подготовленных заклинаний: сколько их даёт таблица класса на
 * текущем уровне, какой бонус к этому числу задан вручную и какое значение
 * выходит итогом. Своё число выключает подсчёт по классу целиком (бонус к нему
 * не прибавляется).
 *
 * @param character персонаж.
 * @returns разбор для блока вкладки и модалки настройки.
 */
export function getPreparedSpellsBreakdown(
  character: Character,
): PreparedSpellsBreakdown {
  const { custom, bonus } = character.spellcasting.prepared;

  const classValue = getPreparedSpellsAtLevel(
    character.characterClass?.preparedSpells ?? [],
    character.level,
  );

  // Класс подготовку не считает: бонус прибавлять не к чему, число остаётся
  // неопределённым, пока игрок не задаст своё.
  const autoValue =
    classValue === null
      ? null
      : clamp(classValue + bonus, PREPARED_SPELLS_MIN, PREPARED_SPELLS_MAX);

  // Своё число клампится и здесь, а не только в экшене: документ мог прийти
  // импортом руками, а схема числа не обрезает.
  const customValue =
    custom === null
      ? null
      : clamp(custom, PREPARED_SPELLS_MIN, PREPARED_SPELLS_MAX);

  return {
    value: customValue ?? autoValue,
    count: character.spells.filter(
      (spell) => isPreparableSpell(spell) && spell.prepared,
    ).length,
    classValue,
    custom: custom !== null,
    bonus,
  };
}

/**
 * Значение блока подготовленных заклинаний: сколько отмечено из того, сколько
 * можно держать («4 / 17»). Предел неизвестен — вместо числа прочерк: пометить
 * при этом можно сколько угодно.
 *
 * @param prepared разбор числа подготовленных заклинаний.
 * @returns строка блока вкладки заклинаний.
 */
export function getPreparedSpellsValue(
  prepared: PreparedSpellsBreakdown,
): string {
  const limit =
    prepared.value === null
      ? PREPARED_SPELLS_EMPTY_VALUE
      : String(prepared.value);

  return `${prepared.count}${PREPARED_SPELLS_VALUE_SEPARATOR}${limit}`;
}

/**
 * Начало подсказки блока подготовленных заклинаний: сколько отмечено и сколько
 * держать можно. Предел неизвестен — вместо числа прочерк.
 *
 * @param prepared разбор числа подготовленных заклинаний.
 * @returns строка вида «Подготовлено заклинаний: 4 из 17».
 */
export function getPreparedSpellsCountHint(
  prepared: PreparedSpellsBreakdown,
): string {
  const limit =
    prepared.value === null
      ? PREPARED_SPELLS_EMPTY_VALUE
      : String(prepared.value);

  return `${PREPARED_SPELLS_COUNT_HINT}: ${prepared.count} из ${limit}`;
}

/**
 * Описание предупреждения о достигнутом пределе подготовленных заклинаний.
 *
 * @param limit сколько заклинаний можно держать подготовленными.
 * @returns текст тоста.
 */
export function getPreparedSpellsLimitDescription(limit: number): string {
  return `Подготовлено ${limit} из ${limit} — снимите подготовку с другого заклинания или измените число в блоке «${PREPARED_SPELLS_LABEL}».`;
}

/**
 * Разбор заклинательства: сложность спасброска от заклинаний и бонус на
 * попадание атакой заклинанием. Заклинательная характеристика — заданная
 * вручную либо (при null) определяемая по классу. Если характеристика не
 * определена, её модификатор считается нулевым.
 *
 * Сложность спасброска — `8 + бонус мастерства + модификатор характеристики`;
 * бонус атаки — `бонус мастерства + модификатор характеристики` (D&D 2024).
 *
 * @param character персонаж.
 * @returns разбор заклинательства для вкладки и модалки настройки.
 */
export function getSpellcastingBreakdown(
  character: Character,
): SpellcastingBreakdown {
  const explicitAbility = character.spellcasting.ability;
  const auto = explicitAbility === null;

  const ability =
    explicitAbility ?? getClassSpellcastingAbility(character.characterClass);

  const abilityModifier = ability
    ? getModifier(character.abilities[ability])
    : 0;

  const proficiencyBonus = getCharacterProficiencyBonus(character);

  return {
    ability,
    auto,
    abilityModifier,
    proficiencyBonus,
    saveDc: SPELL_SAVE_DC_BASE + proficiencyBonus + abilityModifier,
    attackBonus: proficiencyBonus + abilityModifier,
    prepared: getPreparedSpellsBreakdown(character),
  };
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
 * Группа отбора по источнику особенности: подвид попадает в группу вида (свой
 * чип ради подвида ряд отбора не растит), ручная запись — в свои особенности.
 *
 * @param origin происхождение особенности.
 * @returns группа отбора вкладки особенностей.
 */
export function getFeatureOriginGroup(
  origin: FeatureOrigin,
): FeatureOriginGroup {
  return origin === 'lineage' ? 'species' : origin;
}

/**
 * Группы источников, которые вкладка уже показывает: по ним и отбирают. Пустых
 * чипов не бывает — источника, которого нет в списке, нет и в ряду отбора.
 *
 * @param features особенности персонажа.
 * @returns группы источников в порядке чипов.
 */
export function getFeatureOriginGroups(
  features: CharacterFeature[],
): FeatureOriginGroup[] {
  const listGroups = new Set(
    features.map((feature) => getFeatureOriginGroup(feature.origin)),
  );

  return FEATURE_ORIGIN_GROUP_ORDER.filter((originGroup) =>
    listGroups.has(originGroup),
  );
}

/**
 * Проходит ли особенность отбор вкладки: источник — любой из отобранных.
 *
 * @param feature особенность списка.
 * @param filter отбор вкладки особенностей.
 * @returns true — особенность остаётся в списке.
 */
export function matchesFeatureFilter(
  feature: CharacterFeature,
  filter: FeatureTabFilter,
): boolean {
  return (
    !filter.origins.length
    || filter.origins.includes(getFeatureOriginGroup(feature.origin))
  );
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
 * Черты, выданные классовым умением, лежат под классовым идентификатором
 * (`class:{featureKey}:fighting-style:{url}`, `class:{featureKey}:{level}:ability-improvement:{url}`)
 * — иначе их копии не удалялись бы вместе с умением, — поэтому url берётся из
 * хвоста после служебного сегмента.
 *
 * @param featureId идентификатор особенности.
 * @returns url черты или null, если особенность — не черта.
 */
export function getFeatUrlFromFeatureId(featureId: string): string | null {
  for (const segment of CLASS_FEAT_CHOICE_ID_SEGMENTS) {
    const marker = `:${segment}:`;
    const markerIndex = featureId.indexOf(marker);

    if (markerIndex !== -1) {
      return featureId.slice(markerIndex + marker.length);
    }
  }

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
        level: null,
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
    level: null,
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
 * Названия владений инструментами — для мест, где ссылка не нужна (PDF, опции
 * выбора в мастерах).
 *
 * @param tools владения инструментами.
 * @returns подписи владений.
 */
export function getToolNames(tools: CharacterToolProficiency[]): string[] {
  return tools.map((tool) => tool.name);
}

/**
 * Подпись инструмента, которого нет в каталоге: API отдаёт названия и с
 * маленькой буквы («инструменты стеклодува»). Регистр остальных слов не
 * трогаем — в названиях встречаются имена собственные.
 *
 * @param name название инструмента из ответа API.
 * @returns название с заглавной первой буквой.
 */
function toDisplayToolName(name: string): string {
  const trimmed = name.trim();

  return trimmed ? `${trimmed[0]?.toUpperCase()}${trimmed.slice(1)}` : trimmed;
}

/**
 * Ключ сопоставления владения инструментом — нормализованное название с учётом
 * устаревших названий каталога. Ключ именно по названию, а не по ссылке: одно и
 * то же владение приходит из класса прозой (без ссылки) и из предыстории
 * разметкой (со ссылкой), и по ссылке они бы не сошлись.
 *
 * @param name название инструмента (владения листа либо записи каталога).
 * @returns ключ для сравнения и дедупликации.
 */
export function getToolProficiencyKey(name: string): string {
  const normalized = normalizeCatalogName(name);

  const alias = TOOL_NAME_ALIASES[normalized];

  return alias ? normalizeCatalogName(alias) : normalized;
}

/**
 * Список владений инструментами без дублей: запись со ссылкой вытесняет такую
 * же без ссылки, поэтому владение, выданное классом по прозе, получает ссылку
 * от предыстории с разметкой.
 *
 * @param tools владения инструментами.
 * @returns владения без повторов.
 */
export function dedupeToolProficiencies(
  tools: CharacterToolProficiency[],
): CharacterToolProficiency[] {
  const merged = new Map<string, CharacterToolProficiency>();

  for (const tool of tools) {
    const key = getToolProficiencyKey(tool.name);

    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, tool);

      continue;
    }

    if (!existing.url && tool.url) {
      merged.set(key, { ...existing, url: tool.url });
    }
  }

  return [...merged.values()];
}

/**
 * Объединение владений инструментами без дублей.
 *
 * @param current владения листа.
 * @param incoming добавляемые владения.
 * @returns объединённый список владений.
 */
export function unionToolProficiencies(
  current: CharacterToolProficiency[],
  incoming: CharacterToolProficiency[],
): CharacterToolProficiency[] {
  return dedupeToolProficiencies([...current, ...incoming]);
}

/**
 * Поиск инструмента в каталоге раздела «Предметы»: сперва по названию (с учётом
 * регистра, `ё` и устаревших названий), затем по ссылке — в ответах API имя и
 * ссылка расходятся независимо друг от друга («Инструменты жестянщика» с url
 * ремонтника; «инструменты стеклодува» с устаревшим url).
 *
 * @param tool владение инструментом (из листа или из ответа API).
 * @param catalog записи каталога инструментов.
 * @returns запись каталога либо undefined, если инструмента на сайте нет.
 */
export function findToolInCatalog(
  tool: CharacterToolProficiency,
  catalog: ToolCatalogEntry[],
): ToolCatalogEntry | undefined {
  const key = getToolProficiencyKey(tool.name);

  const byName = catalog.find(
    (catalogItem) => getToolProficiencyKey(catalogItem.name) === key,
  );

  if (byName) {
    return byName;
  }

  return tool.url
    ? catalog.find((catalogItem) => catalogItem.url === tool.url)
    : undefined;
}

/**
 * Приведение владений к каталогу: найденное берёт название и ссылку с сайта,
 * ненайденное остаётся своим инструментом игрока (без ссылки — описание такому
 * не откроется).
 *
 * @param tools владения инструментами.
 * @param catalog записи каталога инструментов.
 * @returns владения, сверенные с каталогом, без дублей.
 */
export function resolveToolProficiencies(
  tools: CharacterToolProficiency[],
  catalog: ToolCatalogEntry[],
): CharacterToolProficiency[] {
  return dedupeToolProficiencies(
    tools.map((tool) => {
      const catalogItem = findToolInCatalog(tool, catalog);

      return catalogItem
        ? { name: catalogItem.name, url: catalogItem.url }
        : { name: tool.name, url: null };
    }),
  );
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
 * Сегменты прозы владений по группам каталога: сегмент группы тянется от её
 * ключевого слова до упоминания следующей группы. Так уточнение остаётся при
 * своей группе — в «Простое оружие, воинское оружие со свойством лёгкое»
 * «лёгкое» относится только к воинскому.
 *
 * @param normalizedProse строка владений в нижнем регистре.
 * @param groups группы каталога владений.
 * @param keywordsByKey ключевые слова групп по ключу группы.
 * @returns сегмент прозы по ключу группы; групп без упоминания в карте нет.
 */
function getProseSegmentsByGroup(
  normalizedProse: string,
  groups: ProficiencyCatalogGroup[],
  keywordsByKey: Record<string, string[]>,
): Map<string, string> {
  const mentions = groups
    .map((group) => ({
      key: group.key,
      // Math.min пустого списка — Infinity: группа в прозе не упомянута.
      index: Math.min(
        ...(keywordsByKey[group.key] ?? [])
          .map((keyword) => normalizedProse.indexOf(keyword))
          .filter((index) => index >= 0),
      ),
    }))
    .filter((mention) => Number.isFinite(mention.index))
    .sort((first, second) => first.index - second.index);

  return new Map(
    mentions.map((mention, position) => [
      mention.key,
      normalizedProse.slice(
        mention.index,
        mentions[position + 1]?.index ?? normalizedProse.length,
      ),
    ]),
  );
}

/**
 * Сужение группы оружия признаками из прозы: «воинское оружие со свойством
 * фехтовальное или лёгкое» — это не вся группа, а только её оружие с такими
 * свойствами. Признаки одной оси объединяются, оси пересекаются
 * (`WEAPON_TRAIT_AXES`).
 *
 * @param group группа каталога оружия.
 * @param segment сегмент прозы владений этой группы в нижнем регистре.
 * @returns виды оружия группы либо null, если проза группу не сужает.
 */
function narrowWeaponGroupItems(
  group: ProficiencyCatalogGroup,
  segment: string,
): string[] | null {
  const matchedAxes = WEAPON_TRAIT_AXES.map((axis) =>
    axis.filter((trait) =>
      WEAPON_TRAIT_MATCH_KEYWORDS[trait].some((keyword) =>
        segment.includes(keyword),
      ),
    ),
  ).filter((traits) => traits.length > 0);

  if (!matchedAxes.length) {
    return null;
  }

  return group.items.filter((weapon) =>
    matchedAxes.every((traits) =>
      traits.some((trait) => WEAPON_TRAIT_ITEMS[trait].includes(weapon)),
    ),
  );
}

/**
 * Виды группы, названные в прозе поимённо: так разбирается проза без упоминания
 * самой группы («Ручные арбалеты, длинные мечи, рапиры, короткие мечи»).
 *
 * @param group группа каталога владений.
 * @param normalizedProse строка владений в нижнем регистре.
 * @returns виды группы, встреченные в прозе.
 */
function getNamedGroupItems(
  group: ProficiencyCatalogGroup,
  normalizedProse: string,
): string[] {
  return group.items.filter((catalogItem) =>
    normalizedProse.includes(catalogItem.toLowerCase()),
  );
}

/**
 * Сопоставление прозы владений класса с каталогом: упомянутая группа даётся
 * целиком, если её сегмент прозы не сужен признаками (тогда берутся только
 * подходящие виды), а не упомянутая — отдельными видами по вхождению названия.
 *
 * @param prose строка владений из ответа API.
 * @param groups группы каталога владений.
 * @param keywordsByKey ключевые слова групп по ключу группы.
 * @param narrowGroupItems сужение группы по её сегменту прозы (только оружие).
 * @returns список подписей владений для листа.
 */
export function matchProficiencyGroups(
  prose: string,
  groups: ProficiencyCatalogGroup[],
  keywordsByKey: Record<string, string[]>,
  narrowGroupItems?: (
    group: ProficiencyCatalogGroup,
    segment: string,
  ) => string[] | null,
): string[] {
  const normalizedProse = prose.toLowerCase();

  const segmentsByGroup = getProseSegmentsByGroup(
    normalizedProse,
    groups,
    keywordsByKey,
  );

  const matched = groups.flatMap((group) => {
    const segment = segmentsByGroup.get(group.key);

    if (segment === undefined) {
      return getNamedGroupItems(group, normalizedProse);
    }

    // Пустой список сужения — проза назвала признаки, под которые в группе
    // ничего не подходит; вся группа в этом случае всё равно не даётся.
    return narrowGroupItems?.(group, segment) ?? [group.all];
  });

  return [...new Set(matched)];
}

/**
 * Владения класса бронёй и оружием, распознанные из прозы ответа (best-effort);
 * распознанное игрок затем правит существующими модалками. Инструменты сюда не
 * входят — у них свой каталог с сайта (`matchToolProficiencies`). Уточнённая
 * группа оружия («воинское оружие со свойством фехтовальное или лёгкое» у
 * плута) даётся подходящими видами, а не целиком.
 *
 * @param proficiencyText владения класса прозой (armor/weapon).
 * @param proficiencyText.armor владения бронёй прозой.
 * @param proficiencyText.weapon владения оружием прозой.
 * @returns списки владений по группам листа.
 */
export function matchClassProficiencies(proficiencyText: {
  armor: string;
  weapon: string;
}): { armor: string[]; weapons: string[] } {
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
      narrowWeaponGroupItems,
    ),
  };
}

/**
 * Разбиение прозы владений инструментами на отдельные упоминания: «Воровские
 * инструменты, Инструменты ремонтника и один тип ремесленных инструментов» —
 * три записи, из которых последняя окажется выбором.
 *
 * @param prose проза владений инструментами.
 * @returns непустые фрагменты прозы.
 */
function splitToolProse(prose: string): string[] {
  return prose
    .split(/[,;.]|\sи\s/i)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

/**
 * Инструмент каталога, названный во фрагменте прозы. Приоритет строгий: сперва
 * точное совпадение названия, затем вхождение — во фрагменте бывает лишнее
 * («владение инструментами ремонтника»). Из нескольких вхождений берётся самое
 * длинное название: короткое («Виола») иначе перебило бы более точное.
 *
 * @param segment фрагмент прозы владений.
 * @param catalog записи каталога инструментов.
 * @returns запись каталога либо undefined, если инструмент не назван.
 */
function findToolInProseSegment(
  segment: string,
  catalog: ToolCatalogEntry[],
): ToolCatalogEntry | undefined {
  const segmentKey = getToolProficiencyKey(segment);

  const exactMatch = catalog.find(
    (toolEntry) => getToolProficiencyKey(toolEntry.name) === segmentKey,
  );

  if (exactMatch) {
    return exactMatch;
  }

  const normalized = normalizeCatalogName(segment);

  return catalog
    .filter((toolEntry) =>
      normalized.includes(normalizeCatalogName(toolEntry.name)),
    )
    .sort((first, second) => second.name.length - first.name.length)
    .at(0);
}

/**
 * Фиксированные владения инструментами из прозы класса. Каждый фрагмент, не
 * похожий на выбор, ищется в каталоге сайта; ненайденное становится своим
 * инструментом (без ссылки), чтобы владение не потерялось.
 *
 * @param prose проза владений инструментами (`proficiency.tool`).
 * @param catalog записи каталога инструментов.
 * @returns владения инструментами для листа.
 */
export function matchToolProficiencies(
  prose: string,
  catalog: ToolCatalogEntry[],
): CharacterToolProficiency[] {
  const matched: CharacterToolProficiency[] = [];

  for (const segment of splitToolProse(stripMarkupMarkers(prose))) {
    if (isToolChoiceProse(segment)) {
      continue;
    }

    const catalogItem = findToolInProseSegment(segment, catalog);

    matched.push(
      catalogItem
        ? { name: catalogItem.name, url: catalogItem.url }
        : { name: toDisplayToolName(segment), url: null },
    );
  }

  return dedupeToolProficiencies(matched);
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
 * Вывод отмеченных ресурсов класса из таблицы прогрессии. Значение на текущем
 * уровне должно быть целым числом в допустимом диапазоне. Значения игрок затем
 * правит вручную.
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
    if (column.resourceRecovery === 'NONE') {
      continue;
    }

    const value = getColumnValueAtLevel(column, level)?.trim();

    if (!value || !INTEGER_VALUE_PATTERN.test(value)) {
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
      recovery:
        column.resourceRecovery === 'SHORT_REST' ? 'short-rest' : 'long-rest',
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
  return collectClassFeatures(
    base,
    subclass,
    (featureLevel) => featureLevel <= level,
    choices,
  );
}

/**
 * Классовые особенности ровно указанного уровня: базовый класс даёт свои,
 * выбранный подкласс — свои. Нужны мастеру повышения уровня, который выдаёт
 * умения по шагу на уровень.
 *
 * @param base деталь базового класса.
 * @param subclass деталь подкласса; null — подкласс не выбран.
 * @param level уровень, умения которого нужны.
 * @param choices выборы игрока по идентификаторам особенностей.
 * @returns особенности этого уровня.
 */
export function buildLevelClassFeatures(
  base: ClassSummary,
  subclass: ClassSummary | null,
  level: number,
  choices: Record<string, string>,
): CharacterFeature[] {
  return collectClassFeatures(
    base,
    subclass,
    (featureLevel) => featureLevel === level,
    choices,
  );
}

/**
 * Особенность листа из описания особенности класса.
 *
 * @param summary особенность из ответа класса.
 * @param originName название источника (класса или подкласса).
 * @param choices выборы игрока по идентификаторам особенностей.
 * @returns особенность персонажа.
 */
function toCharacterFeature(
  summary: ClassFeatureSummary,
  originName: string,
  choices: Record<string, string>,
): CharacterFeature {
  const id = getCharacterFeatureId('class', summary.key);

  const choice = choices[id]?.trim();

  return {
    id,
    name: summary.name,
    description: [...summary.description],
    origin: 'class',
    originName,
    level: summary.level,
    choice: choice || null,
  };
}

/**
 * Общая сборка классовых особенностей по предикату уровня: дубли по ключу
 * отбрасываются, идентификатор — `class:<key>`, выбор игрока подставляется по
 * нему же.
 *
 * @param base деталь базового класса.
 * @param subclass деталь подкласса; null — подкласс не выбран.
 * @param matchesLevel предикат уровня особенности.
 * @param choices выборы игрока по идентификаторам особенностей.
 * @returns особенности, прошедшие предикат.
 */
function collectClassFeatures(
  base: ClassSummary,
  subclass: ClassSummary | null,
  matchesLevel: (featureLevel: number) => boolean,
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
        || !matchesLevel(summary.level)
        || seenKeys.has(summary.key)
      ) {
        continue;
      }

      seenKeys.add(summary.key);

      features.push(toCharacterFeature(summary, originName, choices));
    }
  };

  append(base.features, base.name, false);

  if (subclass) {
    append(subclass.features, subclass.name, true);
  }

  return features;
}

/**
 * Умения подкласса до указанного уровня включительно. Нужны, когда подкласс
 * выбирается позже порогового уровня: вместе с ним персонаж получает и умения
 * более ранних уровней подкласса.
 *
 * @param subclass деталь подкласса.
 * @param level уровень персонажа.
 * @param choices выборы игрока по идентификаторам особенностей.
 * @returns умения подкласса.
 */
export function buildSubclassFeatures(
  subclass: ClassSummary,
  level: number,
  choices: Record<string, string>,
): CharacterFeature[] {
  return subclass.features
    .filter((summary) => summary.isSubclass && summary.level <= level)
    .map((summary) => toCharacterFeature(summary, subclass.name, choices));
}

/**
 * Строки карточек умений уровня для мастера повышения: к каждому умению
 * распознаётся выбор внутри описания (навык, компетентность, язык).
 *
 * @param base деталь базового класса.
 * @param subclass деталь подкласса; null — подкласс не выбран.
 * @param level уровень, умения которого нужны.
 * @param skillNames имена навыков персонажа.
 * @returns строки умений этого уровня.
 */
export function getLevelFeatureRows(
  base: ClassSummary,
  subclass: ClassSummary | null,
  level: number,
  skillNames: string[],
): ClassFeatureRow[] {
  const rows: ClassFeatureRow[] = [];

  const append = (
    summaries: ClassFeatureSummary[],
    originLabel: string,
    onlySubclass: boolean,
  ): void => {
    for (const summary of summaries) {
      // Улучшение характеристик справочник даёт один раз, а повторы держит в
      // таблице прогрессии: без них выбор черты был бы только на первом уровне
      // умения (у воина — на 4-м, но не на 6, 8, 12 …).
      const isRepeatedImprovement =
        summary.abilityImprovement && summary.scalingLevels.includes(level);

      if (
        summary.isSubclass !== onlySubclass
        || (summary.level !== level && !isRepeatedImprovement)
      ) {
        continue;
      }

      const baseId = getCharacterFeatureId('class', summary.key);

      // Каждый уровень улучшения характеристик — свой выбор, поэтому в
      // идентификатор строки идёт уровень: иначе выборы разных уровней
      // затирали бы друг друга общим ключом умения.
      const id = summary.abilityImprovement ? `${baseId}:${level}` : baseId;

      rows.push({
        id,
        name: summary.name,
        level,
        description: [...summary.description],
        originLabel,
        // Выбор черты рисуется своим блоком, поэтому текстовый выбор такому
        // умению не нужен — иначе под чертой висело бы пустое поле ввода.
        choice: summary.abilityImprovement
          ? null
          : detectFeatureChoice(id, summary.description, skillNames),
        abilityImprovement: summary.abilityImprovement,
      });
    }
  };

  append(base.features, `${FEATURE_ORIGIN_LABELS.class}: ${base.name}`, false);

  if (subclass) {
    append(subclass.features, `Подкласс: ${subclass.name}`, true);
  }

  return rows;
}

/**
 * Сбор выборов игрока из карточек умений: навыки, компетентность, языки и
 * текст выбора для самого умения.
 *
 * @param rows строки умений с распознанными выборами.
 * @param selections значения пикеров по идентификатору выбора.
 * @returns выбранные навыки, языки и подписи выбора по идентификатору умения.
 */
export function collectChoiceSelections(
  rows: ClassFeatureRow[],
  selections: Record<string, string[]>,
): {
  proficientSkills: string[];
  expertiseSkills: string[];
  languages: string[];
  featureChoices: Record<string, string>;
} {
  const proficientSkills: string[] = [];
  const expertiseSkills: string[] = [];
  const languages: string[] = [];
  const featureChoices: Record<string, string> = {};

  for (const row of rows) {
    const choice = row.choice;

    if (!choice) {
      continue;
    }

    const values = selections[choice.id] ?? [];

    if (!values.length) {
      continue;
    }

    if (choice.kind === 'skill-proficiency') {
      proficientSkills.push(...values);
    } else if (choice.kind === 'skill-expertise') {
      expertiseSkills.push(...values);
    } else if (choice.kind === 'language') {
      languages.push(...values);
    }

    featureChoices[choice.id] = values.join(', ');
  }

  return { proficientSkills, expertiseSkills, languages, featureChoices };
}

/**
 * Слияние особенностей листа с новыми: запись с тем же идентификатором
 * заменяется входящей, остальные сохраняются на своих местах, новые
 * дописываются в конец. В отличие от выбора класса, ручные особенности и
 * умения прошлых уровней не теряются.
 *
 * @param current особенности листа.
 * @param incoming новые особенности.
 * @returns объединённый список особенностей.
 */
export function mergeCharacterFeatures(
  current: CharacterFeature[],
  incoming: CharacterFeature[],
): CharacterFeature[] {
  const incomingById = new Map(
    incoming.map((feature) => [feature.id, feature]),
  );

  const merged = current.map((feature) => {
    const replacement = incomingById.get(feature.id);

    if (replacement) {
      incomingById.delete(feature.id);
    }

    return replacement ?? feature;
  });

  return [...merged, ...incomingById.values()];
}

/**
 * Слияние ресурсов класса при повышении уровня: максимум берётся новый, а
 * потраченное сохраняется — прибавка максимума приходит непотраченной, как
 * новые кости хитов. Ресурсы без пары среди новых (добавленные вручную) не
 * трогаются.
 *
 * @param current ресурсы листа.
 * @param incoming ресурсы, пересчитанные на новый уровень.
 * @returns объединённый список ресурсов.
 */
export function mergeClassResources(
  current: CharacterClassResource[],
  incoming: CharacterClassResource[],
): CharacterClassResource[] {
  const incomingById = new Map(
    incoming.map((resource) => [resource.id, resource]),
  );

  const merged = current.map((resource) => {
    const next = incomingById.get(resource.id);

    if (!next) {
      return resource;
    }

    incomingById.delete(resource.id);

    const gain = Math.max(0, next.max - resource.max);

    return {
      ...resource,
      name: next.name,
      shortLabel: next.shortLabel,
      recovery: next.recovery,
      max: next.max,
      current: clamp(resource.current + gain, 0, next.max),
    };
  });

  return [...merged, ...incomingById.values()];
}

/**
 * Умения, полученные выше указанного уровня, — их забирает снижение уровня.
 * Уровень проставлен у классовых умений и у черт, взятых за классовое улучшение
 * характеристик, поэтому уходят и они. Записи без уровня (умения вида, черты,
 * добавленные вручную, и листы до учёта уровня) не трогаются.
 *
 * @param features особенности листа.
 * @param level новый уровень персонажа.
 * @returns умения снимаемых уровней.
 */
export function getFeaturesAboveLevel(
  features: CharacterFeature[],
  level: number,
): CharacterFeature[] {
  return features.filter(
    (feature) => feature.level !== null && feature.level > level,
  );
}

/**
 * Снятие классовых умений за уровни выше указанного.
 *
 * @param features особенности листа.
 * @param level новый уровень персонажа.
 * @returns особенности без умений снятых уровней.
 */
export function removeFeaturesAboveLevel(
  features: CharacterFeature[],
  level: number,
): CharacterFeature[] {
  const removedIds = new Set(
    getFeaturesAboveLevel(features, level).map((feature) => feature.id),
  );

  if (!removedIds.size) {
    return features;
  }

  return features.filter((feature) => !removedIds.has(feature.id));
}

/**
 * Отбор опций каталога по источникам, включённым в профиле. Пустой список
 * источников означает, что ограничения нет (настройка не задана или её не
 * удалось загрузить).
 *
 * @param options опции класса или подкласса.
 * @param selectedSourceIds идентификаторы включённых источников (`PHB`).
 * @returns опции разрешённых источников.
 */
export function filterClassOptionsBySources(
  options: ClassOption[],
  selectedSourceIds: string[],
): ClassOption[] {
  if (!selectedSourceIds.length) {
    return options;
  }

  const allowed = new Set(selectedSourceIds);

  return options.filter((option) => allowed.has(option.sourceLabel));
}

/**
 * Проверка значения способа прироста хитов: контролы отдают его нетипизированным.
 *
 * @param value значение из контрола.
 * @returns true — значение является способом прироста хитов.
 */
export function isHitPointsGainMode(
  value: unknown,
): value is HitPointsGainMode {
  return value === 'average' || value === 'roll' || value === 'max';
}

/**
 * Прирост максимума хитов за уровень по выбранному способу: среднее кости,
 * максимум кости или брошенное значение.
 *
 * @param mode способ прироста.
 * @param die номинал кости хитов класса.
 * @param modifier модификатор Телосложения.
 * @param rolled выпавшее на кости значение; null — кость ещё не брошена.
 * @returns прирост максимума хитов; 0 — в режиме броска до броска.
 */
export function getHitPointsGainForMode(
  mode: HitPointsGainMode,
  die: number,
  modifier: number,
  rolled: number | null,
): number {
  if (mode === 'max') {
    return getLevelHitPointsGain(die, modifier);
  }

  if (mode === 'average') {
    return getLevelHitPointsGain(getHitDieAverage(die), modifier);
  }

  return rolled === null ? 0 : getLevelHitPointsGain(rolled, modifier);
}

/**
 * Уровень персонажа для подписи в списке: не ниже первого. У листа без класса
 * уровень ещё не набран, но персонаж всё равно первого уровня, а не нулевого.
 *
 * @param character персонаж листа.
 * @returns уровень для отображения.
 */
export function getDisplayLevel(character: Character): number {
  return Math.max(character.level, LEVEL_MIN);
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
 * Проза владения инструментами описывает ВЫБОР, а не фиксированную выдачу.
 * Формулировки в ответах API разные: «Выберите…», «на ваш выбор», «Один из
 * музыкальных инструментов», «один тип ремесленных инструментов», «Один
 * музыкальный инструмент или инструмент ремесленников».
 *
 * @param toolText проза владения инструментами.
 * @returns true — фрагмент описывает выбор.
 */
export function isToolChoiceProse(toolText: string): boolean {
  const normalized = toolText.toLowerCase().replaceAll('ё', 'е');

  // «выбер…» (Выберите) и «выбор» (на выбор) — разные корни, оба означают выбор.
  return (
    /выб[ео]р/.test(normalized)
    || /\bодн(?:ин|им|ого|ой|ому)?\s+(?:вид|тип|из)/.test(normalized)
    || (/\bодин\b/.test(normalized) && /\bили\b/.test(normalized))
  );
}

/**
 * Выбор владения инструментами из прозы. Группы каталога определяются по
 * ключевому слову («музыкальн» → музыкальные инструменты), их может быть
 * несколько («музыкальный инструмент или инструмент ремесленников»); пустой
 * список групп означает выбор из всего каталога сайта.
 *
 * @param toolText проза владения инструментами.
 * @param id идентификатор выбора (для class/background).
 * @returns выбор инструментов или null, если выбора нет.
 */
export function getClassToolChoice(
  toolText: string,
  id = 'class-tools',
): ClassChoice | null {
  if (!isToolChoiceProse(toolText)) {
    return null;
  }

  const normalized = toolText.toLowerCase().replaceAll('ё', 'е');

  const toolGroups = TOOL_CATALOG_GROUP_ORDER.filter((groupKey) =>
    TOOL_MATCH_KEYWORDS[groupKey].some((keyword) =>
      normalized.includes(keyword),
    ),
  );

  return {
    id,
    kind: 'tool',
    label: 'Владение инструментами',
    count: parseChoiceCount(toolText),
    listed: [],
    toolGroups,
  };
}

/** Корень слова «компетентность»: от него отсчитывается количество навыков. */
const EXPERTISE_KEYWORD = 'компетентност';

/**
 * Компетентность как выдача умения («вы получаете компетентность»), а не
 * упоминание слова в прозе: у «Острого словца» барда компетентность — фигура
 * речи («подрывать уверенность и компетентность других»), и распознанный выбор
 * требовал бы 60 навыков (число приезжало из «в пределах 60 фт.»).
 */
const EXPERTISE_GRANT_PATTERN = new RegExp(
  `(?:получ|приобрет)\\p{L}*\\s+${EXPERTISE_KEYWORD}`,
  'u',
);

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

  // Количество считается от первого упоминания компетентности, а не от самой
  // выдачи: у следопыта число стоит до неё («Выберите одно из ваших владений
  // навыком… Вы получаете компетентность»).
  if (EXPERTISE_GRANT_PATTERN.test(text)) {
    return {
      id: featureId,
      kind: 'skill-expertise',
      label: '',
      count: parseChoiceCount(text.slice(text.indexOf(EXPERTISE_KEYWORD))),
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
 * Пометки навыков, которыми персонаж уже владеет: название навыка → подпись для
 * списка выбора. По правилам 2024 повторное владение ничего не даёт (бонус
 * мастерства не складывается) и компетенцию не выдаёт, поэтому такие навыки
 * помечаются, но остаются доступными: у мастера может действовать правило 2014
 * «возьми взамен другое владение».
 *
 * @param skills навыки персонажа.
 * @returns пометки по названиям навыков, которыми персонаж владеет.
 */
export function getOwnedSkillHints(
  skills: CharacterSkill[],
): Record<string, string> {
  return Object.fromEntries(
    skills
      .filter((skill) => skill.proficiency !== 'none')
      .map((skill) => [skill.name, SKILL_OWNED_HINTS[skill.proficiency]]),
  );
}

/**
 * Пометки опций выбора: они нужны только выбору владения навыком. Опции выбора
 * компетенции и так собраны из навыков с владением, а известные языки и
 * инструменты `resolveChoiceOptions` вырезает из списка.
 *
 * @param choice распознанный выбор.
 * @param skills навыки персонажа.
 * @returns пометки по названиям опций выбора.
 */
export function getChoiceSkillHints(
  choice: ClassChoice,
  skills: CharacterSkill[],
): Record<string, string> {
  return choice.kind === 'skill-proficiency' ? getOwnedSkillHints(skills) : {};
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
 * Снятие маркеров разметки каталога с прозы владений («{@item Инструменты
 * повара|url:cook-s-utensils-phb}» → «Инструменты повара»). Разбор идёт общим
 * парсером разметки: в ответах API маркеры бывают битыми (пропущена `}`, лишние
 * пробелы у `|`), а он такие строки не роняет и не теряет подпись.
 *
 * @param text проза владений с маркерами разметки.
 * @returns та же проза с подписями маркеров вместо самих маркеров.
 */
export function stripMarkupMarkers(text: string): string {
  return getNodeText(parse(text)).replaceAll(/\s+/g, ' ').trim();
}

/**
 * Разбор владения инструментом из ответа API: подпись и относительная ссылка на
 * предмет каталога. На проде владения приходят маркером
 * («{@item Воровские инструменты|url:thieves-tools-phb}»), на деве — плоским
 * текстом, поэтому ссылка необязательна. Подпись остаётся сырой: сверит её с
 * каталогом сайта `resolveToolProficiencies`.
 *
 * @param toolText строка владения инструментом.
 * @returns владение инструментом с ссылкой либо без неё.
 */
export function parseToolMarker(toolText: string): CharacterToolProficiency {
  const urlMatch = /url:([\w-]+)/.exec(toolText);

  return {
    name: toDisplayToolName(stripMarkupMarkers(toolText)),
    url: urlMatch?.[1] ?? null,
  };
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
 * Разбор ключа характеристики из ответа API (`STRENGTH`) в ключ листа
 * (`strength`). Регистр приводится, неизвестное значение отбрасывается.
 *
 * @param value значение характеристики из ответа API.
 * @returns ключ характеристики листа; null — значение не распознано.
 */
export function parseApiAbilityKey(value: string): AbilityKey | null {
  const normalized = value.trim().toLowerCase();

  return ABILITY_ORDER.find((key) => key === normalized) ?? null;
}

/**
 * Запасное распознавание умения, дающего черту за улучшение характеристик:
 * по названию либо по ссылке на черту «Улучшение характеристик» в описании.
 *
 * Основной источник — флаг `abilityImprovement` из ответа класса; проверка
 * нужна для записей, где он ещё не проставлен (самодельные классы, строки до
 * бэкфилла).
 *
 * @param name название умения класса.
 * @param description описание умения в разметке сайта.
 * @returns true — умение даёт выбор черты.
 */
export function isAbilityImprovementFeature(
  name: string,
  description: RenderNode,
): boolean {
  const normalizedName = name.toLowerCase().replaceAll('ё', 'е');

  if (
    ABILITY_IMPROVEMENT_FEATURE_NAMES.some((featureName) =>
      normalizedName.includes(featureName),
    )
  ) {
    return true;
  }

  const { url } = parseFeatMarker(getNodeText(description));

  return url !== null && url.startsWith(ABILITY_IMPROVEMENT_FEAT_URL_PREFIX);
}

/**
 * Опции черт, доступных за классовое улучшение характеристик: убираются черты
 * запрещённых категорий (происхождения и эпические), черты из отключённых в
 * профиле источников и уже взятые на листе — кроме повторяемых, их можно брать
 * снова. Черта, уже выбранная на другом шаге мастера, из списка тоже уходит.
 *
 * Источники отбираются на клиенте: ручка `/feats/select` по ним не фильтрует.
 * Пустой список источников ограничения не накладывает.
 *
 * @param options все черты каталога.
 * @param takenUrls url черт, уже взятых на листе или в мастере.
 * @param selectedUrl url черты, выбранной в этом же селекторе; '' — не выбрана.
 * @param selectedSourceIds источники, разрешённые настройкой профиля.
 * @returns черты, доступные для выбора.
 */
export function getAbilityImprovementFeatOptions(
  options: FeatSelectOption[],
  takenUrls: Set<string>,
  selectedUrl: string,
  selectedSourceIds: string[] = [],
): FeatSelectOption[] {
  const allowedSources = new Set(selectedSourceIds);

  return options.filter((option) => {
    // Выбранная здесь черта остаётся видимой, иначе селектор показал бы пустое
    // значение вместо сделанного выбора.
    if (option.url === selectedUrl) {
      return true;
    }

    if (
      ABILITY_IMPROVEMENT_EXCLUDED_FEAT_CATEGORIES.includes(option.category)
    ) {
      return false;
    }

    if (allowedSources.size > 0 && !allowedSources.has(option.sourceLabel)) {
      return false;
    }

    return option.repeatability || !takenUrls.has(option.url);
  });
}

/**
 * Прибавки к характеристикам по выбору игрока в черте: каждый заполненный слот
 * даёт +1 своей характеристике, повтор характеристики складывается (так «+2 к
 * одной» получается двумя одинаковыми слотами).
 *
 * @param abilities выбранные характеристики (null — слот не заполнен).
 * @returns прибавки по характеристикам.
 */
export function collectFeatAbilityIncreases(
  abilities: (AbilityKey | null)[],
): Partial<Record<AbilityKey, number>> {
  const increases: Partial<Record<AbilityKey, number>> = {};

  for (const ability of abilities) {
    if (ability) {
      increases[ability] = (increases[ability] ?? 0) + 1;
    }
  }

  return increases;
}

/**
 * Сложение прибавок к характеристикам из нескольких черт.
 *
 * @param increases прибавки по чертам.
 * @returns суммарные прибавки по характеристикам.
 */
export function mergeAbilityIncreases(
  increases: Partial<Record<AbilityKey, number>>[],
): Partial<Record<AbilityKey, number>> {
  const total: Partial<Record<AbilityKey, number>> = {};

  for (const increase of increases) {
    for (const key of ABILITY_ORDER) {
      const amount = increase[key];

      if (amount) {
        total[key] = (total[key] ?? 0) + amount;
      }
    }
  }

  return total;
}

/**
 * Применение прибавок к характеристикам с потолком в 20: выбор не поднимает
 * характеристику выше предела, но и не опускает уже превышающее его значение
 * (оно могло прийти от эпического дара или ручной правки).
 *
 * @param abilities значения характеристик персонажа.
 * @param increases прибавки по характеристикам.
 * @returns новые значения характеристик.
 */
export function applyAbilityIncreases(
  abilities: CharacterAbilities,
  increases: Partial<Record<AbilityKey, number>>,
): CharacterAbilities {
  const result = { ...abilities };

  for (const key of ABILITY_ORDER) {
    const amount = increases[key];

    if (amount) {
      // `clamp` здесь не подходит: у характеристики выше предела (эпический
      // дар, ручная правка) нижняя граница окажется больше верхней, и значение
      // не выросло бы, а упало до предела.
      result[key] = Math.max(
        abilities[key],
        Math.min(abilities[key] + amount, ABILITY_IMPROVEMENT_SCORE_MAX),
      );
    }
  }

  return result;
}

/**
 * Сколько ещё можно прибавить характеристике до предела: по нему выбор
 * подсказывает, что характеристика уже упёрлась в 20.
 *
 * @param score текущее значение характеристики.
 * @returns остаток до предела; 0 — предел уже достигнут.
 */
export function getAbilityIncreaseHeadroom(score: number): number {
  return Math.max(0, ABILITY_IMPROVEMENT_SCORE_MAX - score);
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

/**
 * URL своей предыстории: ссылки на раздел у неё нет, поэтому запись листа
 * получает свой идентификатор с префиксом `custom:` — как свои предметы и
 * заклинания.
 *
 * @returns URL своей предыстории (`custom:` + идентификатор).
 */
export function buildCustomBackgroundUrl(): string {
  return `${CUSTOM_BACKGROUND_URL_PREFIX}${crypto.randomUUID()}`;
}

/**
 * URL своего вида: ссылки на раздел у него нет, поэтому запись листа получает
 * свой идентификатор с префиксом `custom:` — как своя предыстория.
 *
 * @returns URL своего вида (`custom:` + идентификатор).
 */
export function buildCustomSpeciesUrl(): string {
  return `${CUSTOM_SPECIES_URL_PREFIX}${crypto.randomUUID()}`;
}

/**
 * Дистанция строки указанного типа.
 *
 * @param rows строки формы «тип + дистанция».
 * @param key искомый тип передвижения или зрения.
 * @returns дистанция в футах; 0 — строки такого типа в форме нет.
 */
function getRowDistance(rows: DistanceRowDraft[], key: string): number {
  return rows.find((row) => row.key === key)?.value ?? 0;
}

/**
 * Строки передвижения своего вида по умолчанию: заранее заведена только
 * ходьба — остальные типы игрок добавляет сам.
 *
 * @returns строки формы с одной ходьбой.
 */
export function buildDefaultSpeedRows(): DistanceRowDraft[] {
  return [
    {
      id: crypto.randomUUID(),
      key: 'walk',
      value: CUSTOM_SPECIES_DEFAULT_SPEED,
    },
  ];
}

/**
 * Строки зрения из зрения персонажа: заводятся только заданные дистанции —
 * форма не показывает типы, которых у персонажа нет.
 *
 * @param vision текущее зрение персонажа.
 * @returns строки формы по ненулевым дистанциям.
 */
export function buildVisionRows(vision: CharacterVision): DistanceRowDraft[] {
  return VISION_ORDER.filter((key) => vision[key] > VISION_DISTANCE_MIN).map(
    (key) => ({ id: crypto.randomUUID(), key, value: vision[key] }),
  );
}

/**
 * Скорости листа из строк формы: незаведённые типы получают ноль — на листе это
 * и означает «такого передвижения нет».
 *
 * @param rows строки передвижения формы.
 * @returns скорости по всем типам передвижения.
 */
export function buildSpeedValuesFromRows(
  rows: DistanceRowDraft[],
): Record<SpeedTypeKey, number> {
  return {
    walk: getRowDistance(rows, 'walk'),
    burrow: getRowDistance(rows, 'burrow'),
    climb: getRowDistance(rows, 'climb'),
    fly: getRowDistance(rows, 'fly'),
    swim: getRowDistance(rows, 'swim'),
  };
}

/**
 * Зрение листа из строк формы: незаведённые типы получают ноль — на листе это и
 * означает «такого зрения нет».
 *
 * @param rows строки зрения формы.
 * @returns дистанции по всем типам зрения.
 */
export function buildVisionValuesFromRows(
  rows: DistanceRowDraft[],
): Record<VisionKey, number> {
  return {
    normal: getRowDistance(rows, 'normal'),
    darkvision: getRowDistance(rows, 'darkvision'),
    blindsight: getRowDistance(rows, 'blindsight'),
    tremorsense: getRowDistance(rows, 'tremorsense'),
    truesight: getRowDistance(rows, 'truesight'),
  };
}

/**
 * Особенности листа из черновиков формы своего вида: строки без названия
 * отбрасываются, описание разбирается из хранимой разметки редактора.
 *
 * @param drafts черновики особенностей формы.
 * @param speciesName название своего вида — источник особенности на листе.
 * @returns особенности с происхождением «вид».
 */
export function buildCustomSpeciesFeatures(
  drafts: CustomFeatureDraft[],
  speciesName: string,
): CharacterFeature[] {
  return drafts
    .filter((draft) => draft.name.trim())
    .map((draft) => ({
      id: getCharacterFeatureId('species', draft.id),
      name: draft.name.trim(),
      description: parseStoredMarkupNodes(draft.description),
      origin: 'species',
      originName: speciesName,
      // Особенность своего вида к уровню класса не привязана: снятие уровня её
      // не заберёт.
      level: null,
      choice: null,
    }));
}

/**
 * URL своего класса: ссылки на раздел у него нет, поэтому запись листа получает
 * свой идентификатор с префиксом `custom:` — как своя предыстория и свой вид.
 *
 * @returns URL своего класса (`custom:` + идентификатор).
 */
export function buildCustomClassUrl(): string {
  return `${CUSTOM_CLASS_URL_PREFIX}${crypto.randomUUID()}`;
}

/**
 * Умения листа из черновиков формы своего класса: строки без названия
 * отбрасываются, описание разбирается из хранимой разметки редактора.
 * Идентификатор классовый (`class:`) — смена класса заберёт эти умения вместе с
 * самим классом, как и умения класса каталога.
 *
 * @param drafts черновики умений формы.
 * @param className название своего класса — источник умения на листе.
 * @returns умения с происхождением «класс».
 */
export function buildCustomClassFeatures(
  drafts: CustomFeatureDraft[],
  className: string,
): CharacterFeature[] {
  return drafts
    .filter((draft) => draft.name.trim())
    .map((draft) => ({
      id: getCharacterFeatureId('class', draft.id),
      name: draft.name.trim(),
      description: parseStoredMarkupNodes(draft.description),
      origin: 'class',
      originName: className,
      // Уровень форма не спрашивает: без него снятие уровня умение не заберёт —
      // свой класс правится вручную на вкладке «Особенности».
      level: null,
      choice: null,
    }));
}

/**
 * Черты происхождения для своей предыстории: из каталога `/select` остаются
 * только черты категории происхождения, а при заданной настройке источников —
 * ещё и книги, включённые в профиле (сам эндпоинт по источникам не фильтрует).
 *
 * @param options черты каталога.
 * @param selectedSourceIds включённые источники; пусто — ограничения нет.
 * @returns черты происхождения для селектора.
 */
export function getOriginFeatOptions(
  options: FeatSelectOption[],
  selectedSourceIds: string[] = [],
): FeatSelectOption[] {
  const allowedSources = new Set(selectedSourceIds);

  return options.filter((option) => {
    if (option.category !== ORIGIN_FEAT_CATEGORY) {
      return false;
    }

    return allowedSources.size === 0 || allowedSources.has(option.sourceLabel);
  });
}

/**
 * Имя файла для экспорта листа: имя персонажа без запрещённых в файловой
 * системе символов. Пустое имя заменяется общим запасным значением.
 *
 * @param name имя персонажа.
 * @returns безопасное имя файла без расширения.
 */
function getCharacterFileName(name: string): string {
  const safeName = name
    .trim()
    .replace(/[/:*?"<>|]+/g, ' ')
    .trim();

  return safeName || CHARACTER_FILE_NAME_FALLBACK;
}

/**
 * Скачивание листа в виде JSON-файла: сериализует персонажа (та же форма, что
 * уходит в автосохранение).
 *
 * Ссылка на изображение в файл не попадает: она ведёт в наше хранилище и
 * действительна только для своего владельца — в чужом аккаунте или стороннем
 * сервисе картинка всё равно не откроется. Пустое поле честнее битой ссылки.
 *
 * @param character персонаж скачиваемого листа.
 */
export function downloadCharacterJson(character: Character): void {
  const json = JSON.stringify({ ...character, avatarUrl: null }, null, 2);

  downloadBlob(
    new Blob([json], { type: 'application/json' }),
    `${getCharacterFileName(character.name)}.json`,
  );
}

/**
 * Скачивание листа в виде PDF: раскладка близка к официальному листу D&D 2024,
 * дальше идут снаряжение, заклинания и справочник с полными описаниями.
 *
 * Сборщик и pdf-lib загружаются динамически: они нужны только в момент экспорта,
 * а в основном бандле весили бы больше самого листа.
 *
 * @param character персонаж скачиваемого листа.
 */
export async function downloadCharacterPdf(
  character: Character,
): Promise<void> {
  const { buildCharacterSheetPdf } = await import('./pdf');

  const bytes = await buildCharacterSheetPdf(character);

  // Копия байтов в свежий массив: `Blob` принимает только представления над
  // `ArrayBuffer`, а pdf-lib отдаёт массив над `ArrayBufferLike`.
  downloadBlob(
    new Blob([new Uint8Array(bytes)], { type: SHEET_PDF_MIME_TYPE }),
    `${getCharacterFileName(character.name)}.pdf`,
  );
}

/** Доступность действий и обработчики пунктов меню действий над листом. */
export interface SheetActionMenuOptions {
  /** Копия листа доступна: в лимите активных листов есть свободное место. */
  canDuplicate: boolean;

  /** Удаление листа доступно из этого места. */
  canRemove: boolean;

  /**
   * Доступ по ссылке уже включён — пункт подсказывает состояние, не открывая
   * модалку. Учитывается только вместе с `onShare`.
   */
  isShared?: boolean;

  /**
   * Лист открыт по ссылке: остаётся только выгрузка документа. Копия, удаление,
   * настройки и управление доступом — права владельца, зрителю их не показываем.
   */
  isReadonly?: boolean;

  /**
   * Лист заперт замком: правки запрещены, поэтому пункт настроек скрыт — он
   * упёрся бы в ту же блокировку. Действий над листом целиком замок не касается.
   */
  isLocked?: boolean;

  /** Идёт сборка PDF: пункт показывает загрузку и не принимает повторный клик. */
  isPdfLoading?: boolean;

  onDownload: () => void;
  onDownloadPdf: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onSettings: () => void;

  /**
   * Открытие модалки «Поделиться»; не передан — пункта в меню нет. Так меню
   * чужого листа и мест без управления доступом остаётся без лишнего действия.
   */
  onShare?: () => void;
}

/**
 * Пункты меню действий над листом — общие для шапки открытого листа и карточки
 * в списке персонажей: экспорт, копия, доступ по ссылке и настройки одной
 * группой, удаление — отдельной, оно необратимее прочих. У листа, открытого по
 * ссылке, остаётся только выгрузка: сохранить его к себе зритель может кнопками
 * в шапке, а не отсюда.
 *
 * @param options доступность действий и обработчики пунктов.
 * @returns группы пунктов для `UDropdownMenu`.
 */
export function getSheetActionMenuItems(
  options: SheetActionMenuOptions,
): Array<Array<DropdownMenuItem>> {
  // Экспорт в PDF идёт первым: играют по нему, а JSON нужен для переноса листа.
  const downloadPdf: DropdownMenuItem = {
    label: SHEET_DOWNLOAD_PDF_LABEL,
    icon: 'tabler:file-type-pdf',
    description: SHEET_DOWNLOAD_PDF_HINT,
    loading: options.isPdfLoading,
    disabled: options.isPdfLoading,
    onSelect: options.onDownloadPdf,
  };

  const download: DropdownMenuItem = {
    label: SHEET_DOWNLOAD_JSON_LABEL,
    icon: 'tabler:download',
    onSelect: options.onDownload,
  };

  if (options.isReadonly) {
    return [[downloadPdf, download]];
  }

  const actions: DropdownMenuItem[] = [
    downloadPdf,
    download,
    {
      label: 'Создать копию',
      icon: 'tabler:copy',
      // Причина недоступности прямо в пункте: без неё серый пункт выглядит
      // поломкой, а тултипа у пунктов меню нет.
      description: options.canDuplicate ? undefined : SHEET_COPY_LIMIT_HINT,
      disabled: !options.canDuplicate,
      onSelect: options.onDuplicate,
    },
  ];

  if (options.onShare) {
    actions.push({
      label: 'Поделиться листом',
      icon: options.isShared ? 'tabler:link' : 'tabler:share',
      // Включённый доступ виден прямо в меню: иначе о том, что лист уже открыт
      // по ссылке, нельзя узнать, не заглянув в модалку.
      description: options.isShared ? SHEET_SHARE_ACTIVE_HINT : undefined,
      onSelect: options.onShare,
    });
  }

  if (!options.isLocked) {
    actions.push({
      label: 'Настройки',
      icon: 'tabler:settings',
      onSelect: options.onSettings,
    });
  }

  if (!options.canRemove) {
    return [actions];
  }

  return [
    actions,
    [
      {
        label: 'Удалить лист',
        icon: 'tabler:trash',
        color: 'error',
        onSelect: options.onRemove,
      },
    ],
  ];
}

/** Доступность действий и обработчики меню сохранённого чужого листа. */
export interface SavedSheetActionMenuOptions {
  /** Копия доступна: в лимите своих активных листов есть свободное место. */
  canCopy: boolean;

  /** Идёт сборка PDF: пункт показывает загрузку и не принимает повторный клик. */
  isPdfLoading?: boolean;

  onDownload: () => void;
  onDownloadPdf: () => void;
  onCopy: () => void;
  onRemove: () => void;
}

/**
 * Пункты меню карточки чужого листа, сохранённого по ссылке. От меню своего
 * листа отличается тем, чего у зрителя нет: правок, настроек и управления
 * доступом. Копия остаётся — она создаёт уже свой лист.
 *
 * @param options доступность действий и обработчики пунктов.
 * @returns группы пунктов для `UDropdownMenu`.
 */
export function getSavedSheetActionMenuItems(
  options: SavedSheetActionMenuOptions,
): Array<Array<DropdownMenuItem>> {
  return [
    [
      {
        label: SHEET_DOWNLOAD_PDF_LABEL,
        icon: 'tabler:file-type-pdf',
        description: SHEET_DOWNLOAD_PDF_HINT,
        loading: options.isPdfLoading,
        disabled: options.isPdfLoading,
        onSelect: options.onDownloadPdf,
      },
      {
        label: SHEET_DOWNLOAD_JSON_LABEL,
        icon: 'tabler:download',
        onSelect: options.onDownload,
      },
      {
        label: SHEET_SAVE_SHARED_LABELS.copy,
        icon: 'tabler:copy',
        // Причина недоступности прямо в пункте — как и у копии своего листа.
        description: options.canCopy ? undefined : SHEET_COPY_LIMIT_HINT,
        disabled: !options.canCopy,
        onSelect: options.onCopy,
      },
    ],
    [
      {
        label: 'Убрать из списка',
        icon: 'tabler:link-off',
        color: 'error',
        onSelect: options.onRemove,
      },
    ],
  ];
}

/**
 * Хвост подписи лимита: что с ним делает подписка. Числа приходят с сервера —
 * на клиенте лимиты не хардкодятся, поэтому равенство лимитов и означает
 * «подписка уже действует», а ноль — «сервер про подписку не рассказал».
 *
 * @param limit выданный пользователю лимит.
 * @param subscriberLimit лимит, который даёт подписка.
 * @returns фраза о подписке или пустая строка, если сказать нечего.
 */
function getSubscriptionLimitSuffix(
  limit: number,
  subscriberLimit: number,
): string {
  if (!subscriberLimit) {
    return '';
  }

  if (subscriberLimit <= limit) {
    return ' Лимит расширен подпиской.';
  }

  return ` С подпиской — до ${subscriberLimit} ${getPlural(subscriberLimit, SHEET_PLURAL_FORMS)}.`;
}

/**
 * Подпись счётчика своих листов для тултипа раздела.
 *
 * @param count число активных листов.
 * @param limit лимит активных листов.
 * @param subscriberLimit лимит активных листов по подписке.
 * @returns текст тултипа.
 */
export function getSheetsCountTooltip(
  count: number,
  limit: number,
  subscriberLimit: number,
): string {
  return `Активных листов — ${count} из ${limit} возможных.${getSubscriptionLimitSuffix(limit, subscriberLimit)}`;
}

/**
 * Подпись счётчика сохранённых чужих листов для тултипа раздела.
 *
 * @param count число сохранённых записей.
 * @param limit лимит сохранённых записей.
 * @param subscriberLimit лимит сохранённых записей по подписке.
 * @returns текст тултипа.
 */
export function getSavedSheetsCountTooltip(
  count: number,
  limit: number,
  subscriberLimit: number,
): string {
  return `Чужих листов, сохранённых по ссылке, — ${count} из ${limit} возможных.${getSubscriptionLimitSuffix(limit, subscriberLimit)}`;
}

/**
 * Подпись тултипа истории удалённых листов: как её восстанавливать, насколько
 * она глубока и что с глубиной делает подписка.
 *
 * @param historyLimit глубина истории; 0 — сервер лимит не прислал.
 * @param subscriberHistoryLimit глубина истории по подписке.
 * @returns текст тултипа.
 */
export function getSheetsHistoryTooltip(
  historyLimit: number,
  subscriberHistoryLimit: number,
): string {
  const restoreHint =
    'Удалённые листы можно восстановить, пока в лимите активных есть свободное место.';

  if (!historyLimit) {
    return restoreHint;
  }

  return `${restoreHint} В истории хранятся последние ${historyLimit} удалённых листов — более старые вытесняются новыми удалениями.${getSubscriptionLimitSuffix(historyLimit, subscriberHistoryLimit)}`;
}

/**
 * Подсказка о расширении лимита своих листов подпиской: показывается там, где
 * пользователь в лимит упёрся.
 *
 * @param subscriberLimit лимит активных листов по подписке.
 * @returns текст подсказки.
 */
export function getSheetsSubscriptionHint(subscriberLimit: number): string {
  return `Подписка расширяет лимит активных листов до ${subscriberLimit}.`;
}

/**
 * Подсказка о расширении лимита сохранённых чужих листов подпиской.
 *
 * @param subscriberLimit лимит сохранённых записей по подписке.
 * @returns текст подсказки.
 */
export function getSavedSheetsSubscriptionHint(
  subscriberLimit: number,
): string {
  return `Подписка расширяет лимит сохранённых листов до ${subscriberLimit}.`;
}

// Меню «Добавить» на вкладках листа: варианты добавления живут в выпадающем
// меню, а не в ряду кнопок — ряд не растёт с каждым новым источником и не
// переносится на вторую строку в узком дровере.

/** Обработчики пунктов меню «Добавить» на вкладке снаряжения. */
export interface EquipmentAddMenuOptions {
  onAddItem: () => void;
  onAddMagicItem: () => void;
  onAddCustomItem: () => void;
}

/**
 * Пункты меню «Добавить» на вкладке снаряжения: предмет из каталога,
 * магический предмет и свой, заполняемый вручную.
 *
 * @param options обработчики пунктов.
 * @returns пункты для `UDropdownMenu`.
 */
export function getEquipmentAddMenuItems(
  options: EquipmentAddMenuOptions,
): DropdownMenuItem[] {
  return [
    {
      label: 'Предмет',
      icon: 'tabler:package',
      onSelect: options.onAddItem,
    },
    {
      label: 'Магический предмет',
      icon: 'tabler:sparkles',
      onSelect: options.onAddMagicItem,
    },
    {
      label: 'Свой предмет',
      icon: 'tabler:pencil-plus',
      onSelect: options.onAddCustomItem,
    },
  ];
}

/** Обработчики пунктов меню «Добавить» на вкладке заклинаний. */
export interface SpellsAddMenuOptions {
  onAddSpell: () => void;
  onAddCustomSpell: () => void;
}

/**
 * Пункты меню «Добавить» на вкладке заклинаний: заклинание из каталога и своё,
 * заполняемое вручную.
 *
 * @param options обработчики пунктов.
 * @returns пункты для `UDropdownMenu`.
 */
export function getSpellsAddMenuItems(
  options: SpellsAddMenuOptions,
): DropdownMenuItem[] {
  return [
    {
      label: 'Заклинание',
      icon: 'tabler:wand',
      onSelect: options.onAddSpell,
    },
    {
      label: 'Своё заклинание',
      icon: 'tabler:pencil-plus',
      onSelect: options.onAddCustomSpell,
    },
  ];
}

/** Обработчики пунктов меню «Добавить» на вкладке особенностей. */
export interface FeaturesAddMenuOptions {
  onAddFeature: () => void;
  onAddFeat: () => void;
}

/**
 * Пункты меню «Добавить» на вкладке особенностей: своя особенность и черта из
 * каталога. Иконка карандаша — та же, что у своего заклинания: заполняется
 * вручную, а не выбирается из раздела сайта.
 *
 * @param options обработчики пунктов.
 * @returns пункты для `UDropdownMenu`.
 */
export function getFeaturesAddMenuItems(
  options: FeaturesAddMenuOptions,
): DropdownMenuItem[] {
  return [
    {
      label: 'Особенность',
      icon: 'tabler:pencil-plus',
      onSelect: options.onAddFeature,
    },
    {
      label: 'Черта',
      icon: 'tabler:award',
      onSelect: options.onAddFeat,
    },
  ];
}

/** Обработчики пунктов меню строки каталожной или своей записи листа. */
export interface SheetEntryMenuOptions {
  /**
   * Правка записи; не передан — пункта нет. У каталожной записи править нечего:
   * её поля приходят из раздела сайта.
   */
  onEdit?: () => void;

  /**
   * Копия каталожной записи в лист; не передан — пункта нет. Своя запись уже
   * живёт в листе, копировать её незачем.
   */
  onCopy?: () => void;

  onRemove: () => void;
}

/**
 * Пункты меню строки: правка своей записи, копия каталожной в лист и удаление.
 * Порядок общий для снаряжения и заклинаний — сначала то, что меняет саму
 * запись, потом удаление.
 *
 * @param options обработчики пунктов.
 * @param removeLabel подпись удаления (у снаряжения и книги она своя).
 * @returns пункты для `UDropdownMenu`.
 */
function getSheetEntryMenuItems(
  options: SheetEntryMenuOptions,
  removeLabel: string,
): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = [];

  if (options.onEdit) {
    items.push({
      label: 'Редактировать',
      icon: 'tabler:pencil',
      onSelect: options.onEdit,
    });
  }

  if (options.onCopy) {
    items.push({
      label: CATALOG_COPY_MENU_LABEL,
      icon: 'tabler:copy',
      onSelect: options.onCopy,
    });
  }

  items.push({
    label: removeLabel,
    icon: 'tabler:trash',
    color: 'error',
    onSelect: options.onRemove,
  });

  return items;
}

/** Обработчики пунктов меню строки снаряжения. */
export interface InventoryItemMenuOptions extends SheetEntryMenuOptions {
  /**
   * Смена хвата универсального оружия; не передан — пункта нет (второго броска
   * у предмета нет, и переключать нечего).
   */
  onToggleGrip?: () => void;

  /** Оружие уже взято двумя руками — пункт предлагает вернуть его в одну. */
  twoHanded: boolean;
}

/**
 * Пункты меню строки снаряжения. Действия убраны под многоточие, а не стоят
 * кнопками в строке: у каталожного предмета их два, у своего — тоже два, но
 * другие, и трейлинг соседних строк не выравнивался бы. Смена хвата стоит
 * первой: это игровое действие, к нему возвращаются в бою, а правка и удаление
 * меняют саму запись.
 *
 * @param options обработчики пунктов.
 * @returns пункты для `UDropdownMenu`.
 */
export function getInventoryItemMenuItems(
  options: InventoryItemMenuOptions,
): DropdownMenuItem[] {
  const items = getSheetEntryMenuItems(options, INVENTORY_REMOVE_MENU_LABEL);

  if (!options.onToggleGrip) {
    return items;
  }

  return [
    {
      label: options.twoHanded
        ? INVENTORY_GRIP_MENU_LABELS.oneHanded
        : INVENTORY_GRIP_MENU_LABELS.twoHanded,
      icon: 'tabler:sword',
      onSelect: options.onToggleGrip,
    },
    ...items,
  ];
}

/**
 * Пункты меню строки заклинания — те же действия, что и у снаряжения: строки
 * обеих вкладок ведут себя одинаково.
 *
 * @param options обработчики пунктов.
 * @returns пункты для `UDropdownMenu`.
 */
export function getSpellMenuItems(
  options: SheetEntryMenuOptions,
): DropdownMenuItem[] {
  return getSheetEntryMenuItems(options, SPELL_REMOVE_MENU_LABEL);
}

/**
 * Пункты меню строки врождённого заклинания: править нечего — запись приходит
 * от вида, поэтому вместо правки ей, как и каталожной, предлагается копия в
 * лист, после которой она становится своей.
 *
 * @param options обработчики пунктов (копия в лист и удаление).
 * @returns пункты для `UDropdownMenu`.
 */
export function getInnateSpellMenuItems(
  options: SheetEntryMenuOptions,
): DropdownMenuItem[] {
  return getSheetEntryMenuItems(options, INNATE_SPELL_REMOVE_MENU_LABEL);
}

/**
 * Текст подтверждения удаления предмета: называет предмет, чтобы в длинном
 * списке было видно, какая именно строка исчезнет.
 *
 * @param name название предмета.
 * @returns описание для диалога подтверждения.
 */
export function getInventoryRemoveDescription(name: string): string {
  return `«${name}» исчезнет из снаряжения — вернуть его можно только заново добавив.`;
}
