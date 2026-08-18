import type { DropdownMenuItem } from '@nuxt/ui';

import type { AbilityKey as ApiAbilityKey, Level } from '~/shared/types';
import type { MagicItemBonuses } from '~magic-items/model';
import type { RenderNode } from '~ui/markup';

import type {
  AbilityBonusMode,
  AbilityKey,
  AbilityRow,
  ArmorClassAbilityBonus,
  ArmorClassBreakdown,
  ArmorDexterityMod,
  AttunementBreakdown,
  BonusBreakdownPart,
  CarryingCapacityBreakdown,
  CatalogSpellDetail,
  Character,
  CharacterAbilities,
  CharacterAttunement,
  CharacterClass,
  CharacterClassResource,
  CharacterCurrency,
  CharacterCustomBonus,
  CharacterExhaustionEffects,
  CharacterExtraHitDie,
  CharacterFeature,
  CharacterFeatureModifiers,
  CharacterHealth,
  CharacterHitDie,
  CharacterInventoryGroup,
  CharacterInventoryItem,
  CharacterLevelHitPoints,
  CharacterPersonality,
  CharacterProficiencies,
  CharacterSavingThrow,
  CharacterSettings,
  CharacterSkill,
  CharacterSpecies,
  CharacterSpeed,
  CharacterSpell,
  CharacterSpellGroup,
  CharacterSpellSlot,
  CharacterToolProficiency,
  CharacterVision,
  ChoiceOptionContext,
  ClassChoice,
  ClassFeatureRow,
  ClassFeatureSummary,
  ClassOption,
  ClassResourceRecoveryBadge,
  ClassSummary,
  ClassTableColumn,
  CurrencyKey,
  CustomArmorType,
  CustomBonusSource,
  CustomFeatureDraft,
  CustomInventoryItemDraft,
  CustomInventoryKind,
  CustomSpellDraft,
  CustomSpellStatRow,
  DamageDiceGroup,
  DamageRollSource,
  DistanceRowDraft,
  FeatGrantedSpeedKey,
  FeatSelectOption,
  FeatSpeedModifiers,
  FeatSummary,
  FeatureDescriptionNode,
  FeatureOrigin,
  FeatureOriginGroup,
  FeatureTabFilter,
  GrantedProficiencies,
  GrantedStartingEquipment,
  HitDiceAmount,
  HitDicePool,
  HitDiceSelectPool,
  HitPointsGainMode,
  InventoryArmor,
  InventoryBonusSource,
  InventoryBonusTargetGroup,
  InventoryBonusTargetKind,
  InventoryBonusTargetOption,
  InventoryCharges,
  InventoryItemBonus,
  InventoryItemOrigin,
  InventoryWeapon,
  InventoryWeaponDamage,
  ItemSummary,
  LevelUpHitPointsGain,
  MagicItemCatalogGroup,
  MagicItemCatalogGrouping,
  MagicItemCatalogItem,
  MagicItemRarityKey,
  MagicItemSummary,
  PersonalityFieldRow,
  PreparedSpellKind,
  PreparedSpellsBreakdown,
  PreparedSpellsScaling,
  PrimarySpeed,
  ProficiencyCatalogGroup,
  ProficiencyGrant,
  ResourceRecovery,
  ResourceRecoveryMode,
  ResourceRecoveryRule,
  RollMode,
  SavingThrowRow,
  SkillRow,
  SkillRowGroup,
  SpeciesFeatureSummary,
  SpeciesSummary,
  SpeedRow,
  SpeedTypeKey,
  SpeedUnit,
  SpellcastingBreakdown,
  SpellcastingClassRow,
  SpellCatalogPreset,
  SpellDamage,
  SpellSlotCircle,
  SpellSlotKind,
  SpellSlotRow,
  SpellTabFilter,
  StartingEquipmentGrant,
  StartingEquipmentItem,
  StartingEquipmentOption,
  ToolCatalogEntry,
  VisionKey,
  VisionRow,
  WeaponAttack,
  WeaponDamage,
} from './types';

import {
  capitalize,
  clamp,
  mapValues,
  round,
  union,
  uniqBy,
  upperFirst,
} from 'es-toolkit';

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
  EMPTY_MAGIC_ITEM_BONUSES,
  MAGIC_ITEM_BONUS_NONE,
} from '~magic-items/model';
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
  ABILITY_SCORES_LABELS,
  ABILITY_SHORT_LABELS,
  ALL_SPELL_SLOTS_LABEL,
  API_ABILITY_KEYS,
  ARMOR_CLASS_BASE_MAX,
  ARMOR_CLASS_BASE_MIN,
  ARMOR_CLASS_LABELS,
  ARMOR_MATCH_KEYWORDS,
  ARMOR_MEDIUM_DEX_CAP,
  ARMOR_PROFICIENCY_GROUPS,
  ATTUNEMENT_BONUS_MAX,
  ATTUNEMENT_BONUS_MIN,
  ATTUNEMENT_LABELS,
  ATTUNEMENT_MAX,
  ATTUNEMENT_MIN,
  ATTUNEMENT_RULE_LIMIT,
  ATTUNEMENT_VALUE_SEPARATOR,
  CANTRIP_SPELL_LEVEL,
  CANTRIPS_COLUMN_PREFIX,
  CARRYING_CAPACITY_LABELS,
  CARRYING_CAPACITY_MULTIPLIER,
  CARRYING_CAPACITY_SIZE_AUTO,
  CARRYING_CAPACITY_SIZE_LABELS,
  CARRYING_CAPACITY_SIZE_MULTIPLIERS,
  CATALOG_COPY_MENU_LABEL,
  CHARACTER_FILE_NAME_FALLBACK,
  CLASS_FEAT_CHOICE_ID_SEGMENTS,
  CLASS_FEATURE_ID_PREFIX,
  CLASS_RESOURCE_ID_PREFIX,
  CLASS_SPELL_PROGRESSIONS,
  CLASS_SPELLCASTING_ABILITIES,
  CLASSES_LABEL_SEPARATOR,
  COINS_PER_WEIGHT_UNIT,
  CURRENCY_AMOUNT_MAX,
  CURRENCY_AMOUNT_MIN,
  CURRENCY_GOLD_RATES,
  CURRENCY_KEYS_BY_LABEL,
  CURRENCY_LABELS,
  CURRENCY_ORDER,
  CUSTOM_ARMOR_TYPE_BY_DEXTERITY_MOD,
  CUSTOM_ARMOR_TYPE_META,
  CUSTOM_BACKGROUND_URL_PREFIX,
  CUSTOM_BONUS_FLAT_SOURCE,
  CUSTOM_BONUS_KIND_LABELS,
  CUSTOM_BONUS_MAX,
  CUSTOM_BONUS_MIN,
  CUSTOM_BONUS_PROFICIENCY_SOURCE,
  CUSTOM_CLASS_URL_PREFIX,
  CUSTOM_FLAT_BONUS_LABEL,
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
  DAMAGE_TYPE_NONE,
  DARKVISION_PARSE_FALLBACK,
  DEFAULT_ARMOR_CLASS_ABILITY,
  DEFAULT_INITIATIVE_ABILITY,
  DEFAULT_INVENTORY_MAGIC_STATE,
  DEFAULT_ROLL_DICE_FACES,
  DEFAULT_ROLL_MODE,
  DEFAULT_WEAPON_ATTACK_ABILITY,
  DICE_NOTATION_LETTER,
  EXHAUSTION_D20_PENALTY_PER_LEVEL,
  EXHAUSTION_LABELS,
  EXHAUSTION_LEVEL_MAX,
  EXHAUSTION_LEVEL_MIN,
  EXHAUSTION_SPEED_PENALTY_BY_UNIT,
  EXHAUSTION_SPEED_PENALTY_PER_LEVEL,
  FEAT_CUSTOM_BONUS_ID_PREFIX,
  FEATURE_ORIGIN_GROUP_ORDER,
  FEATURE_ORIGIN_LABELS,
  FILTER_CHIP_CLASS,
  FILTER_CHIP_IDLE_CLASS,
  FILTER_CHIP_SELECTED_CLASS,
  HEAVY_WEAPON_ABILITY_MINIMUM,
  HIT_DICE_ROLL_COUNT,
  HIT_POINTS_LEVEL_GAIN_MIN,
  INNATE_SPELL_REMOVE_MENU_LABEL,
  INVENTORY_ACTIVE_MENU_LABELS,
  INVENTORY_ATTUNEMENT_MENU_LABELS,
  INVENTORY_BONUS_GROUP_LABELS,
  INVENTORY_BONUS_LABELS,
  INVENTORY_BONUS_TARGET_LABELS,
  INVENTORY_BONUS_TARGET_PREFIXES,
  INVENTORY_BONUS_TARGET_SEPARATOR,
  INVENTORY_CATEGORY_ORDER,
  INVENTORY_CATEGORY_TITLES,
  INVENTORY_EQUIP_ICONS,
  INVENTORY_GRIP_MENU_LABELS,
  INVENTORY_QUANTITY_MAX,
  INVENTORY_QUANTITY_MIN,
  INVENTORY_REMOVE_MENU_LABEL,
  INVENTORY_RESTORE_CHARGES_MENU_LABEL,
  ITEM_BONUS_MAX,
  ITEM_BONUS_MIN,
  ITEM_SPEED_BONUS_MAX,
  ITEM_SPEED_BONUS_MIN,
  ITEMS_DETAIL_BASE_PATH,
  LEVEL_MAX,
  LEVEL_MIN,
  LEVEL_XP_THRESHOLDS,
  MAGIC_ITEM_ARTIFACT_COST_LABEL,
  MAGIC_ITEM_CATALOG_EMPTY_GROUP_LABELS,
  MAGIC_ITEM_RARITY_COSTS,
  MAGIC_ITEMS_DETAIL_BASE_PATH,
  MULTICLASS_ABILITY_REQUIREMENT,
  MULTICLASS_REQUIREMENT_WARNING_PREFIX,
  NEW_CUSTOM_BONUS,
  NEW_CUSTOM_INVENTORY_ITEM,
  ORIGIN_FEAT_CATEGORY,
  PACT_SPELL_SLOT_LABEL,
  PACT_SPELL_SLOTS_LABEL,
  PASSIVE_SKILL_BASE,
  PERSONALITY_EMPTY_VALUE,
  PERSONALITY_TEXT_FIELDS,
  PREPARED_KIND_LABELS,
  PREPARED_SPELLS_COLUMN_KEYWORD,
  PREPARED_SPELLS_COLUMN_PREFIX,
  PREPARED_SPELLS_EMPTY_VALUE,
  PREPARED_SPELLS_MAX,
  PREPARED_SPELLS_MIN,
  PREPARED_SPELLS_VALUE_SEPARATOR,
  PROFICIENCY_SOURCE_PREFIXES,
  RESOURCE_CHARGE_FORMS,
  RESOURCE_COUNT_MAX,
  RESOURCE_RECOVERY_ALL_LABEL,
  RESOURCE_RECOVERY_ALL_SHORT_LABEL,
  RESOURCE_RECOVERY_AMOUNT_MIN,
  RESOURCE_RECOVERY_FIELDS,
  RESOURCE_RECOVERY_ICONS,
  RESOURCE_RECOVERY_LABELS,
  RESOURCE_SHORT_LABEL_MAX_LENGTH,
  ROLL_MODE_DICE_COUNT,
  ROLL_MODE_DICE_SUFFIX,
  SAVING_THROW_PROFICIENCY_LABELS,
  SHEET_ABILITY_SETTINGS_LABELS,
  SHEET_COPY_LIMIT_HINT,
  SHEET_DOWNLOAD_JSON_LABEL,
  SHEET_DOWNLOAD_PDF_HINT,
  SHEET_DOWNLOAD_PDF_LABEL,
  SHEET_PDF_MIME_TYPE,
  SHEET_PERSONALITY_LABELS,
  SHEET_PLURAL_FORMS,
  SHEET_SAVE_SHARED_LABELS,
  SHEET_SHARE_ACTIVE_HINT,
  SHEET_UNARMORED_LABEL,
  SIZE_LABEL_WORDS,
  SKILL_GROUP_ALL_KEY,
  SKILL_OWNED_HINTS,
  SKILL_PROFICIENCY_LABELS,
  SKILL_PROFICIENCY_MULTIPLIERS,
  SPEED_FEET_RATIO_BY_UNIT,
  SPEED_PARSE_FALLBACK,
  SPEED_PRIMARY_ORDER,
  SPEED_TYPE_LABELS,
  SPEED_UNIT_FRACTION_DIGITS,
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
  STARTING_EQUIPMENT_CUSTOM_ID_SEGMENT,
  STARTING_EQUIPMENT_LABELS,
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
import { DEFAULT_CHARACTER } from './mock';

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
 * Основа бонуса мастерства: своё значение из настроек, а без него — бонус по
 * уровню персонажа.
 *
 * @param character персонаж.
 * @returns основа бонуса мастерства.
 */
export function getBaseProficiencyBonus(character: Character): number {
  return (
    character.settings.customProficiencyBase
    ?? getProficiencyBonus(character.level)
  );
}

/**
 * Бонус мастерства листа: основа плюс свои бонусы из настроек. Считать бонус
 * мастерства персонажа нужно именно так — везде, где он участвует.
 *
 * Записи вида «бонус мастерства» здесь пропускаются: сам себе слагаемым он быть
 * не может, а без отбора подсчёт ушёл бы в бесконечную рекурсию. В остальных
 * целях (инициатива, навыки, спасброски) такие записи работают как обычно.
 *
 * @param character персонаж.
 * @returns итоговый бонус мастерства.
 */
export function getCharacterProficiencyBonus(character: Character): number {
  return (
    getBaseProficiencyBonus(character)
    + getCustomBonusesValue(
      character,
      character.settings.customProficiencyBonuses.filter(
        (bonus) => bonus.kind !== 'proficiency',
      ),
    )
  );
}

/**
 * Работают ли сейчас пассивные бонусы предмета. Бонус даёт надетый предмет,
 * которого у персонажа не ноль, а предмету с настройкой нужна ещё и сама
 * настройка — ненастроенный магический предмет по правилам 2024 не работает.
 *
 * @param inventoryItem предмет инвентаря.
 * @returns true — бонусы предмета идут в лист.
 */
function isActiveBonusItem(inventoryItem: CharacterInventoryItem): boolean {
  return (
    inventoryItem.equipped
    && !isMissingInventoryItem(inventoryItem)
    && (!inventoryItem.requiresAttunement || inventoryItem.attuned)
  );
}

/**
 * Подходит ли бонус предмета под цель. Ключ сверяется, только когда цель его
 * требует: «Все спасброски» и «Класс доспеха» уточнения не имеют.
 *
 * @param bonus бонус предмета.
 * @param kind вид цели.
 * @param key ключ цели (характеристика, скорость, название навыка); '' — цель
 *   уточнения не требует.
 * @returns true — бонус идёт в эту цель.
 */
function isMatchingBonus(
  bonus: InventoryItemBonus,
  kind: InventoryBonusTargetKind,
  key: string,
): boolean {
  return bonus.kind === kind && (!key || bonus.key === key);
}

/**
 * Сумма бонусов одного предмета для цели — считается и по неработающему
 * предмету (сводка в его строке показывает, что он даст).
 *
 * @param inventoryItem предмет инвентаря.
 * @param kind вид цели.
 * @param key ключ цели; '' — цель уточнения не требует.
 * @returns суммарная прибавка предмета.
 */
function getItemBonusValue(
  inventoryItem: CharacterInventoryItem,
  kind: InventoryBonusTargetKind,
  key = '',
): number {
  return inventoryItem.bonuses.reduce(
    (total, bonus) =>
      isMatchingBonus(bonus, kind, key) ? total + bonus.value : total,
    0,
  );
}

/**
 * Суммарная прибавка работающего снаряжения к цели: её лист и добавляет к
 * своему значению.
 *
 * @param character персонаж.
 * @param kind вид цели.
 * @param key ключ цели; '' — цель уточнения не требует.
 * @returns суммарная прибавка снаряжения.
 */
export function getInventoryBonusValue(
  character: Character,
  kind: InventoryBonusTargetKind,
  key = '',
): number {
  return character.inventory.reduce(
    (total, item) =>
      isActiveBonusItem(item)
        ? total + getItemBonusValue(item, kind, key)
        : total,
    0,
  );
}

/**
 * Предметы, дающие бонус в нужную цель, — строками разбора значения: без них
 * итог не сходится ни с характеристикой, ни с владением.
 *
 * @param character персонаж.
 * @param kind вид цели.
 * @param key ключ цели; '' — цель уточнения не требует.
 * @returns вклады предметов; пустой список — таких предметов нет.
 */
export function getInventoryBonusSources(
  character: Character,
  kind: InventoryBonusTargetKind,
  key = '',
): InventoryBonusSource[] {
  return character.inventory
    .filter(isActiveBonusItem)
    .map((item) => ({
      id: item.id,
      name: item.name,
      value: getItemBonusValue(item, kind, key),
    }))
    .filter((source) => source.value !== 0);
}

/**
 * Прибавка снаряжения к спасброску характеристики: свои бонусы спасброска и
 * общие «ко всем спасброскам» складываются.
 *
 * @param character персонаж.
 * @param ability характеристика спасброска.
 * @returns прибавка снаряжения к спасброску.
 */
export function getInventorySavingThrowBonus(
  character: Character,
  ability: AbilityKey,
): number {
  return (
    getInventoryBonusValue(character, 'saving-throw', ability)
    + getInventoryBonusValue(character, 'all-saving-throws')
  );
}

/**
 * Вклады предметов в спасбросок: адресные и общие вместе, в одном списке
 * разбора.
 *
 * @param character персонаж.
 * @param ability характеристика спасброска.
 * @returns вклады предметов в спасбросок.
 */
export function getInventorySavingThrowSources(
  character: Character,
  ability: AbilityKey,
): InventoryBonusSource[] {
  return [
    ...getInventoryBonusSources(character, 'saving-throw', ability),
    ...getInventoryBonusSources(character, 'all-saving-throws'),
  ];
}

/**
 * Персонаж без своих бонусов характеристик. На нём и считаются сами эти бонусы:
 * бонус вида «бонус мастерства» зовёт подсчёт мастерства, а тот умеет брать
 * модификатор характеристики — на исходном персонаже подсчёт пошёл бы по кругу.
 *
 * @param character персонаж.
 * @returns персонаж с пустыми своими бонусами характеристик.
 */
function toBaseAbilityCharacter(character: Character): Character {
  return {
    ...character,
    abilityBonuses: mapValues(character.abilityBonuses, () => []),
  };
}

/**
 * Сумма своих бонусов к значению характеристики.
 *
 * @param character персонаж.
 * @param ability ключ характеристики.
 * @returns вклад своих бонусов в значение характеристики.
 */
export function getAbilityBonusesValue(
  character: Character,
  ability: AbilityKey,
): number {
  const bonuses = character.abilityBonuses[ability];

  if (!bonuses.length) {
    return 0;
  }

  return getCustomBonusesValue(toBaseAbilityCharacter(character), bonuses);
}

/**
 * Значения характеристик с бонусами снаряжения и своими бонусами — именно их
 * показывает лист и от них считаются модификаторы. Правка характеристик идёт по
 * записанным значениям (`character.abilities`), а не по этим.
 *
 * @param character персонаж.
 * @returns значения характеристик со всеми прибавками.
 */
export function getEffectiveAbilities(
  character: Character,
): CharacterAbilities {
  return mapValues(
    character.abilities,
    (score, key) =>
      score
      + getInventoryBonusValue(character, 'ability', key)
      + getAbilityBonusesValue(character, key),
  );
}

/**
 * Значение одной характеристики с бонусами снаряжения и своими бонусами.
 *
 * @param character персонаж.
 * @param ability ключ характеристики.
 * @returns значение характеристики.
 */
export function getEffectiveAbilityScore(
  character: Character,
  ability: AbilityKey,
): number {
  return (
    character.abilities[ability]
    + getInventoryBonusValue(character, 'ability', ability)
    + getAbilityBonusesValue(character, ability)
  );
}

/**
 * Модификатор характеристики с бонусами снаряжения — им считаются все значения
 * листа: спасброски, навыки, КД, атаки и заклинательство.
 *
 * @param character персонаж.
 * @param ability ключ характеристики.
 * @returns модификатор характеристики.
 */
export function getAbilityModifier(
  character: Character,
  ability: AbilityKey,
): number {
  return getModifier(getEffectiveAbilityScore(character, ability));
}

/**
 * Характеристика инициативы: своя из настроек, а без неё — Ловкость по
 * правилам.
 *
 * @param character персонаж.
 * @returns характеристика, чей модификатор идёт в инициативу.
 */
export function getInitiativeAbility(character: Character): AbilityKey {
  return character.settings.initiativeAbility ?? DEFAULT_INITIATIVE_ABILITY;
}

/**
 * Основа инициативы: своё значение из настроек, а без него — модификатор
 * характеристики инициативы.
 *
 * @param character персонаж.
 * @returns основа инициативы.
 */
export function getBaseInitiativeBonus(character: Character): number {
  return (
    character.settings.customInitiativeBase
    ?? getAbilityModifier(character, getInitiativeAbility(character))
  );
}

/**
 * Бонус инициативы: основа плюс свои бонусы из настроек.
 *
 * @param character персонаж.
 * @returns итоговый бонус инициативы.
 */
export function getInitiativeBonus(character: Character): number {
  return (
    getBaseInitiativeBonus(character)
    + getCustomBonusesValue(
      character,
      character.settings.customInitiativeBonuses,
    )
    + getInventoryBonusValue(character, 'initiative')
    // Инициатива в редакции 2024 — проверка характеристики, а значит бросок
    // к20 со штрафом истощения.
    - getExhaustionD20Penalty(character)
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
 * Значение спасброска: модификатор характеристики, бонус мастерства при
 * владении, свои бонусы записи и общие бонусы ко всем спасброскам.
 *
 * @param character персонаж.
 * @param savingThrow спасбросок персонажа.
 * @returns значение спасброска.
 */
export function getSavingThrowValue(
  character: Character,
  savingThrow: CharacterSavingThrow,
): number {
  const proficiencyPart = savingThrow.proficient
    ? getCharacterProficiencyBonus(character)
    : 0;

  return (
    getAbilityModifier(character, savingThrow.ability)
    + proficiencyPart
    + getCustomBonusesValue(character, savingThrow.bonuses)
    + getCustomBonusesValue(character, character.commonSavingThrowBonuses)
    // Плащ защиты и подобные предметы: и адресные бонусы, и «ко всем сразу».
    + getInventorySavingThrowBonus(character, savingThrow.key)
    // Спасбросок — бросок к20, поэтому истощение снимает с него свой штраф.
    - getExhaustionD20Penalty(character)
  );
}

/**
 * Спасбросок к правилам: характеристика своя же, без своих бонусов. Владение
 * настройка не трогает — его даёт класс, а не подсчёт.
 *
 * @param savingThrow спасбросок персонажа.
 * @returns спасбросок, считающийся по правилам.
 */
export function toDefaultSavingThrow(
  savingThrow: CharacterSavingThrow,
): CharacterSavingThrow {
  return { ...savingThrow, ability: savingThrow.key, bonuses: [] };
}

/**
 * Спасбросок отличается от правил: характеристика подменена или есть свои
 * бонусы. Общие бонусы листа сюда не входят — они правятся своим блоком.
 *
 * @param savingThrow спасбросок персонажа.
 * @returns `true`, если спасбросок считается не по правилам.
 */
export function isChangedSavingThrow(
  savingThrow: CharacterSavingThrow,
): boolean {
  return (
    savingThrow.ability !== savingThrow.key || savingThrow.bonuses.length > 0
  );
}

/**
 * Спасброски с владениями выбранных характеристик: остальное записей не
 * касается — подменённая характеристика и свои бонусы переживают смену класса.
 *
 * @param savingThrows спасброски персонажа.
 * @param abilities характеристики, спасбросками которых персонаж владеет.
 * @returns спасброски с проставленным владением.
 */
export function withSavingThrowProficiencies(
  savingThrows: CharacterSavingThrow[],
  abilities: AbilityKey[],
): CharacterSavingThrow[] {
  return savingThrows.map((savingThrow) => ({
    ...savingThrow,
    proficient: abilities.includes(savingThrow.key),
  }));
}

/**
 * Приведение спасбросков к записи листа: своим бонусам нужна та же чистка, что
 * и бонусам навыков и настроек.
 *
 * @param savingThrows спасброски из черновика модалки.
 * @returns спасброски для записи в лист.
 */
export function toStoredSavingThrows(
  savingThrows: CharacterSavingThrow[],
): CharacterSavingThrow[] {
  return savingThrows.map((savingThrow) => ({
    ...savingThrow,
    bonuses: toStoredCustomBonuses(savingThrow.bonuses),
  }));
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
  const modifier = getAbilityModifier(character, skill.ability);

  const proficiencyPart =
    getCharacterProficiencyBonus(character)
    * SKILL_PROFICIENCY_MULTIPLIERS[skill.proficiency];

  return (
    modifier
    + Math.floor(proficiencyPart)
    + getCustomBonusesValue(character, skill.bonuses)
    // Перчатки вора и подобные предметы прибавляют к проверкам своего навыка.
    + getInventoryBonusValue(character, 'skill', skill.name)
    // Проверка навыка — бросок к20; пассивное значение считается от неё же,
    // поэтому истощение опускает и его.
    - getExhaustionD20Penalty(character)
  );
}

/**
 * Характеристика навыка по правилам: список навыков любого листа заведён из
 * заготовки, поэтому подменённой характеристике всегда есть куда откатиться.
 *
 * @param skillName название навыка.
 * @returns характеристика навыка по правилам; null — навыка нет в заготовке.
 */
export function getDefaultSkillAbility(skillName: string): AbilityKey | null {
  const defaultSkill = DEFAULT_CHARACTER.skills.find(
    (skill) => skill.name === skillName,
  );

  return defaultSkill?.ability ?? null;
}

/**
 * Свой навык игрока: в заготовке листа такого названия нет, значит правилами
 * он не задан. Отдельного признака в документе не нужно — список навыков по
 * правилам закрыт и известен заранее.
 *
 * @param skillName название навыка.
 * @returns `true`, если навык заведён игроком.
 */
export function isCustomSkill(skillName: string): boolean {
  return getDefaultSkillAbility(skillName) === null;
}

/**
 * Есть ли уже навык с таким названием. Сравнение нестрогое (регистр, «ё»,
 * лишние пробелы): «ловкость рук» и «Ловкость  Рук» — один и тот же навык, а
 * два одноимённых навыка сломали бы правку по названию.
 *
 * @param skills навыки персонажа.
 * @param name проверяемое название.
 * @returns `true`, если навык с таким названием уже есть.
 */
export function hasSkillName(skills: CharacterSkill[], name: string): boolean {
  const key = normalizeCatalogName(name);

  return skills.some((skill) => normalizeCatalogName(skill.name) === key);
}

/**
 * Свой навык из введённого названия: владения и своих бонусов у нового навыка
 * нет — их игрок задаёт в той же модалке.
 *
 * @param name название навыка.
 * @param ability характеристика навыка.
 * @returns свой навык для списка навыков листа.
 */
export function toCustomSkill(
  name: string,
  ability: AbilityKey,
): CharacterSkill {
  return {
    name: name.trim(),
    ability,
    proficiency: 'none',
    bonuses: [],
  };
}

/**
 * Навыки по алфавиту: свой навык встаёт среди навыков по правилам, а не в
 * хвост списка — и в панели листа, и в PDF его ищут по алфавиту.
 *
 * @param skills навыки персонажа.
 * @returns навыки, отсортированные по названию.
 */
export function sortSkillsByName(skills: CharacterSkill[]): CharacterSkill[] {
  return [...skills].sort((left, right) =>
    left.name.localeCompare(right.name, 'ru'),
  );
}

/**
 * Приведение своих бонусов к записи листа: числа округляются и ограничиваются
 * допустимым диапазоном, пометки источников обрезаются по краям. Очищенное
 * поле ввода отдаёт `NaN`, а свои бонусы входят в бонус мастерства — без этой
 * подстраховки `NaN` разошёлся бы по всему листу: спасброски, навыки, атаки и
 * сложность спасбросков от заклинаний стали бы пустыми.
 *
 * @param bonuses свои бонусы из черновика формы.
 * @returns свои бонусы для записи в лист.
 */
export function toStoredCustomBonuses(
  bonuses: CharacterCustomBonus[],
): CharacterCustomBonus[] {
  return bonuses.map((bonus) => ({
    ...bonus,
    value: Number.isFinite(bonus.value)
      ? clamp(Math.trunc(bonus.value), CUSTOM_BONUS_MIN, CUSTOM_BONUS_MAX)
      : 0,
    label: bonus.label.trim(),
  }));
}

/**
 * Приведение своего значения основы к записи листа: чистка та же, что у своих
 * бонусов, а `null` (счёт по правилам) остаётся собой.
 *
 * @param base своё значение основы из черновика формы.
 * @returns своё значение основы для записи в лист.
 */
export function toStoredCustomBase(base: number | null): number | null {
  if (base === null) {
    return null;
  }

  return Number.isFinite(base)
    ? clamp(Math.trunc(base), CUSTOM_BONUS_MIN, CUSTOM_BONUS_MAX)
    : 0;
}

/**
 * Приведение настроек листа к записи: своим бонусам мастерства и инициативы
 * нужна та же чистка, что и бонусам навыка.
 *
 * @param settings настройки из черновика модалки.
 * @returns настройки для записи в лист.
 */
export function toStoredSettings(
  settings: CharacterSettings,
): CharacterSettings {
  return {
    ...settings,
    customProficiencyBase: toStoredCustomBase(settings.customProficiencyBase),
    customProficiencyBonuses: toStoredCustomBonuses(
      settings.customProficiencyBonuses,
    ),
    customInitiativeBase: toStoredCustomBase(settings.customInitiativeBase),
    customInitiativeBonuses: toStoredCustomBonuses(
      settings.customInitiativeBonuses,
    ),
  };
}

/**
 * Источник своего бонуса одним значением — для селектора, где своё число и
 * характеристики стоят общим списком.
 *
 * @param bonus свой бонус.
 * @returns источник бонуса.
 */
export function getCustomBonusSource(
  bonus: CharacterCustomBonus,
): CustomBonusSource {
  if (bonus.kind === 'ability') {
    return bonus.ability;
  }

  return bonus.kind === 'proficiency'
    ? CUSTOM_BONUS_PROFICIENCY_SOURCE
    : CUSTOM_BONUS_FLAT_SOURCE;
}

/**
 * Смена источника своего бонуса: вид и характеристика берутся из выбранного
 * источника, а своё число остаётся нетронутым — оно ждёт возврата к нему.
 *
 * @param bonus свой бонус.
 * @param source выбранный источник бонуса.
 * @returns бонус с новым источником.
 */
export function withCustomBonusSource(
  bonus: CharacterCustomBonus,
  source: CustomBonusSource,
): CharacterCustomBonus {
  if (source === CUSTOM_BONUS_FLAT_SOURCE) {
    return { ...bonus, kind: 'flat' };
  }

  if (source === CUSTOM_BONUS_PROFICIENCY_SOURCE) {
    return { ...bonus, kind: 'proficiency' };
  }

  return { ...bonus, kind: 'ability', ability: source };
}

/**
 * Значение одного своего бонуса: модификатор выбранной характеристики либо
 * своё число.
 *
 * @param character персонаж.
 * @param bonus свой бонус.
 * @returns вклад бонуса в итоговое значение.
 */
export function getCustomBonusValue(
  character: Character,
  bonus: CharacterCustomBonus,
): number {
  if (bonus.kind === 'ability') {
    return getAbilityModifier(character, bonus.ability);
  }

  // Бонус мастерства растёт с уровнем, поэтому своим числом он не описывается:
  // «Бдительный» прибавляет к инициативе именно его, а не +2 навсегда.
  if (bonus.kind === 'proficiency') {
    return getCharacterProficiencyBonus(character);
  }

  // Записанный бонус уже приведён `toStoredCustomBonuses`, но черновики форм
  // считаются этой же функцией: очищенное поле ввода отдаёт NaN, и без
  // подстраховки он расползся бы по всему предпросмотру — значению навыка,
  // плиткам разбора и итогам.
  return Number.isFinite(bonus.value) ? bonus.value : 0;
}

/**
 * Сумма своих бонусов сверх правил.
 *
 * @param character персонаж.
 * @param bonuses свои бонусы.
 * @returns суммарный вклад своих бонусов.
 */
export function getCustomBonusesValue(
  character: Character,
  bonuses: CharacterCustomBonus[],
): number {
  return bonuses.reduce(
    (sum, bonus) => sum + getCustomBonusValue(character, bonus),
    0,
  );
}

/**
 * Подпись источника бонуса: своя пометка игрока, а без неё — характеристика
 * или общее название своего бонуса.
 *
 * @param bonus свой бонус.
 * @returns подпись источника бонуса.
 */
export function getCustomBonusLabel(bonus: CharacterCustomBonus): string {
  if (bonus.label) {
    return bonus.label;
  }

  if (bonus.kind === 'ability') {
    return ABILITY_LABELS[bonus.ability];
  }

  return bonus.kind === 'proficiency'
    ? CUSTOM_BONUS_KIND_LABELS.proficiency
    : CUSTOM_FLAT_BONUS_LABEL;
}

/**
 * Разбор значения навыка на слагаемые: характеристика, бонус мастерства по
 * уровню владения и каждый свой бонус. Владения нет — бонуса мастерства в
 * разборе тоже нет, показывать нулевую строку незачем.
 *
 * @param character персонаж.
 * @param skill навык персонажа.
 * @returns слагаемые значения навыка в порядке подсчёта.
 */
export function getSkillBreakdown(
  character: Character,
  skill: CharacterSkill,
): BonusBreakdownPart[] {
  const proficiencyPart = Math.floor(
    getCharacterProficiencyBonus(character)
      * SKILL_PROFICIENCY_MULTIPLIERS[skill.proficiency],
  );

  const proficiencyParts: BonusBreakdownPart[] =
    skill.proficiency === 'none'
      ? []
      : [
          {
            id: 'proficiency',
            label: SKILL_PROFICIENCY_LABELS[skill.proficiency],
            formattedValue: getFormattedBonus(proficiencyPart),
          },
        ];

  // Истощение снимает своё с каждой проверки: без строки разбора значение
  // навыка не сходилось бы ни с характеристикой, ни с владением.
  const exhaustionPenalty = getExhaustionD20Penalty(character);

  const exhaustionParts: BonusBreakdownPart[] =
    exhaustionPenalty === 0
      ? []
      : [
          {
            id: 'exhaustion',
            label: EXHAUSTION_LABELS.title,
            formattedValue: getFormattedBonus(-exhaustionPenalty),
          },
        ];

  return [
    {
      id: 'ability',
      label: ABILITY_LABELS[skill.ability],
      formattedValue: getFormattedBonus(
        getAbilityModifier(character, skill.ability),
      ),
    },
    ...proficiencyParts,
    ...skill.bonuses.map((bonus) => ({
      id: bonus.id,
      label: getCustomBonusLabel(bonus),
      formattedValue: getFormattedBonus(getCustomBonusValue(character, bonus)),
    })),
    ...getInventoryBonusSources(character, 'skill', skill.name).map(
      (source) => ({
        id: source.id,
        label: source.name,
        formattedValue: getFormattedBonus(source.value),
      }),
    ),
    ...exhaustionParts,
  ];
}

/**
 * Подсказка к значению навыка со своими бонусами: без разбора итог не сходится
 * с характеристикой строки. Навык по правилам объяснять нечего — у него `null`.
 *
 * @param character персонаж.
 * @param skill навык персонажа.
 * @returns разбор значения строкой или null.
 */
export function getSkillBonusHint(
  character: Character,
  skill: CharacterSkill,
): string | null {
  if (!skill.bonuses.length && getExhaustionD20Penalty(character) === 0) {
    return null;
  }

  return getSkillBreakdown(character, skill)
    .map((part) => `${part.label} ${part.formattedValue}`)
    .join(' · ');
}

/**
 * Разбор значения спасброска на слагаемые: характеристика, бонус мастерства при
 * владении, каждый свой бонус записи и каждый общий бонус листа. Владения нет —
 * бонуса мастерства в разборе тоже нет, показывать нулевую строку незачем.
 *
 * @param character персонаж.
 * @param savingThrow спасбросок персонажа.
 * @returns слагаемые значения спасброска в порядке подсчёта.
 */
export function getSavingThrowBreakdown(
  character: Character,
  savingThrow: CharacterSavingThrow,
): BonusBreakdownPart[] {
  const proficiencyParts: BonusBreakdownPart[] = savingThrow.proficient
    ? [
        {
          id: 'proficiency',
          label: SAVING_THROW_PROFICIENCY_LABELS.proficient,
          formattedValue: getFormattedBonus(
            getCharacterProficiencyBonus(character),
          ),
        },
      ]
    : [];

  // Истощение снимает своё с каждого броска к20: без строки разбора значение
  // спасброска не сходилось бы ни с характеристикой, ни с владением.
  const exhaustionPenalty = getExhaustionD20Penalty(character);

  const exhaustionParts: BonusBreakdownPart[] =
    exhaustionPenalty === 0
      ? []
      : [
          {
            id: 'exhaustion',
            label: EXHAUSTION_LABELS.title,
            formattedValue: getFormattedBonus(-exhaustionPenalty),
          },
        ];

  return [
    {
      id: 'ability',
      label: ABILITY_LABELS[savingThrow.ability],
      formattedValue: getFormattedBonus(
        getAbilityModifier(character, savingThrow.ability),
      ),
    },
    ...proficiencyParts,
    ...[...savingThrow.bonuses, ...character.commonSavingThrowBonuses].map(
      (bonus) => ({
        id: bonus.id,
        label: getCustomBonusLabel(bonus),
        formattedValue: getFormattedBonus(
          getCustomBonusValue(character, bonus),
        ),
      }),
    ),
    // Предмет в разборе назван по имени: игрок должен видеть, что именно
    // прибавляет к спасброску, а не безымянную строку «снаряжение».
    ...getInventorySavingThrowSources(character, savingThrow.key).map(
      (source) => ({
        id: source.id,
        label: source.name,
        formattedValue: getFormattedBonus(source.value),
      }),
    ),
    ...exhaustionParts,
  ];
}

/**
 * Подсказка к значению спасброска: без разбора итог не сходится ни с подписью
 * строки, ни с характеристикой. Спасбросок по правилам объяснять нечего — у
 * него `null`.
 *
 * @param character персонаж.
 * @param savingThrow спасбросок персонажа.
 * @returns разбор значения строкой или null.
 */
export function getSavingThrowBonusHint(
  character: Character,
  savingThrow: CharacterSavingThrow,
): string | null {
  const isPlain =
    !isChangedSavingThrow(savingThrow)
    && character.commonSavingThrowBonuses.length === 0
    && getInventorySavingThrowSources(character, savingThrow.key).length === 0
    && getExhaustionD20Penalty(character) === 0;

  if (isPlain) {
    return null;
  }

  return getSavingThrowBreakdown(character, savingThrow)
    .map((part) => `${part.label} ${part.formattedValue}`)
    .join(' · ');
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
 * Разбор значения характеристики на слагаемые: записанное значение, каждый
 * предмет по названию и каждый свой бонус по пометке. Предмет и свой бонус
 * названы поимённо — игрок должен видеть, что именно поднимает характеристику.
 *
 * @param character персонаж.
 * @param ability ключ характеристики.
 * @returns слагаемые значения характеристики в порядке подсчёта.
 */
export function getAbilityScoreBreakdown(
  character: Character,
  ability: AbilityKey,
): BonusBreakdownPart[] {
  // Бонусы считаются на том же базовом персонаже, что и в подсчёте значения:
  // иначе бонус мастерства в разборе разошёлся бы с итогом на плитке.
  const baseCharacter = toBaseAbilityCharacter(character);

  return [
    {
      id: 'score',
      label: SHEET_ABILITY_SETTINGS_LABELS.breakdownScore,
      formattedValue: String(character.abilities[ability]),
    },
    ...getInventoryBonusSources(character, 'ability', ability).map(
      (source) => ({
        id: source.id,
        label: source.name,
        formattedValue: getFormattedBonus(source.value),
      }),
    ),
    ...character.abilityBonuses[ability].map((bonus) => ({
      id: bonus.id,
      label: getCustomBonusLabel(bonus),
      formattedValue: getFormattedBonus(
        getCustomBonusValue(baseCharacter, bonus),
      ),
    })),
  ];
}

/**
 * Подсказка к значению характеристики: без разбора не понять, почему на плитке
 * одно число, а в настройке другое. Значению без прибавок объяснять нечего — у
 * него `null`.
 *
 * @param character персонаж.
 * @param ability ключ характеристики.
 * @returns разбор значения строкой или null.
 */
export function getAbilityScoreHint(
  character: Character,
  ability: AbilityKey,
): string | null {
  const isPlain =
    getEffectiveAbilityScore(character, ability)
    === character.abilities[ability];

  if (isPlain) {
    return null;
  }

  return getAbilityScoreBreakdown(character, ability)
    .map((part) => `${part.label} ${part.formattedValue}`)
    .join(' · ');
}

/**
 * Строки блока характеристик.
 *
 * @param character персонаж.
 * @returns строки для отображения характеристик.
 */
export function getAbilityRows(character: Character): AbilityRow[] {
  const abilities = getEffectiveAbilities(character);

  return ABILITY_ORDER.map((key) => ({
    key,
    label: ABILITY_LABELS[key],
    shortLabel: ABILITY_SHORT_LABELS[key],
    score: abilities[key],
    formattedModifier: getFormattedModifier(abilities[key]),
    // Плитка показывает значение с прибавками, а правится записанное: без
    // разницы игрок не понял бы, почему в настройке другое число.
    bonus: abilities[key] - character.abilities[key],
    bonusHint: getAbilityScoreHint(character, key),
  }));
}

/**
 * Строки блока спасбросков.
 *
 * @param character персонаж.
 * @returns строки для отображения спасбросков.
 */
export function getSavingThrowRows(character: Character): SavingThrowRow[] {
  return character.savingThrows.map((savingThrow) => {
    const value = getSavingThrowValue(character, savingThrow);

    return {
      key: savingThrow.key,
      label: `${ABILITY_SHORT_LABELS[savingThrow.key]}.`,
      ability: savingThrow.ability,
      proficient: savingThrow.proficient,
      value,
      formattedValue: getFormattedBonus(value),
      bonusHint: getSavingThrowBonusHint(character, savingThrow),
    };
  });
}

/**
 * Характеристики, от которых навык получает свои бонусы: только вид
 * «модификатор характеристики», без повторов и без характеристики самого
 * навыка — она в строке и так есть.
 *
 * @param skill навык персонажа.
 * @returns характеристики-источники бонусов навыка.
 */
function getSkillBonusAbilities(skill: CharacterSkill): AbilityKey[] {
  const abilities = skill.bonuses
    .filter(
      (bonus) => bonus.kind === 'ability' && bonus.ability !== skill.ability,
    )
    .map((bonus) => bonus.ability);

  return [...new Set(abilities)];
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
      bonusAbilities: getSkillBonusAbilities(skill),
      abilityLabel: ABILITY_SHORT_LABELS[skill.ability],
      proficiency: skill.proficiency,
      value,
      formattedModifier: getFormattedBonus(value),
      passiveValue: PASSIVE_SKILL_BASE + value,
      bonusHint: getSkillBonusHint(character, skill),
    };
  });
}

/**
 * Группы списка навыков. Без группировки список остаётся одной группой без
 * подписи — так и панель, и модалка настройки рисуют его одним и тем же
 * списком, без второй ветки разметки. С группировкой навыки идут в порядке
 * характеристик, а внутри группы — в исходном порядке (по алфавиту, как их
 * хранит лист); характеристику навыку даёт только его собственная, свои бонусы
 * от других характеристик группу не задают. Характеристики без навыков
 * пропускаются: у Телосложения по правилам их нет вовсе.
 *
 * Записи навыков берутся любые: панель листа группирует готовые строки, а
 * модалка настройки — сами навыки черновика.
 *
 * @param rows записи навыков с характеристикой.
 * @param groupedByAbility группировать ли навыки по характеристикам.
 * @returns группы навыков для вывода.
 */
export function getSkillRowGroups<Row extends { ability: AbilityKey }>(
  rows: Row[],
  groupedByAbility: boolean,
): Array<SkillRowGroup<Row>> {
  if (!groupedByAbility) {
    return [
      { key: SKILL_GROUP_ALL_KEY, ability: null, title: null, rows: [...rows] },
    ];
  }

  return ABILITY_ORDER.map((ability) => ({
    key: ability,
    ability,
    title: ABILITY_LABELS[ability],
    rows: rows.filter((row) => row.ability === ability),
  })).filter((group) => group.rows.length > 0);
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
    armorClassBonus: MAGIC_ITEM_BONUS_NONE,
    weapon: summary.weapon,
    equipped: false,
    twoHanded: false,
    // Пассивные бонусы есть только у своих предметов: их задаёт форма листа.
    bonuses: [],
    // Настройка и заряды бывают только у магии — раздел «Предметы» их не знает.
    ...DEFAULT_INVENTORY_MAGIC_STATE,
  };
}

/**
 * Стоимость в золотых монетах из подписи справочника («10 зм», «5 см»).
 * Разряды числа справочник разделяет пробелом («1 500 зм»), в том числе
 * неразрывным, поэтому пробелы внутри числа склеиваются: иначе у латных
 * доспехов читалось бы 500 вместо 1500.
 *
 * @param costText подпись стоимости из ответа API.
 * @returns стоимость в золотых; null — подпись не распознана («варьируется»).
 */
export function parseItemCostInGold(costText: string): number | null {
  // Класс `\s` покрывает и обычный пробел, и неразрывный — им справочник
  // разделяет разряды числа. После пробела внутри числа цифра обязательна,
  // иначе разделитель разрядов и пробел перед монетой стали бы разменными.
  const costMatch = /(\d+(?:\s\d+)*(?:[.,]\d+)?)\s*([^\s\d]+)/.exec(costText);

  if (!costMatch?.[1] || !costMatch[2]) {
    return null;
  }

  const currencyKey = CURRENCY_KEYS_BY_LABEL[costMatch[2].toLowerCase()];

  if (!currencyKey) {
    return null;
  }

  const amount = Number(costMatch[1].replace(/\s/g, '').replace(',', '.'));

  return Number.isFinite(amount)
    ? amount * CURRENCY_GOLD_RATES[currencyKey]
    : null;
}

/**
 * Подпись стоимости в золотых монетах. Дробная часть остаётся, только если она
 * есть: медные и серебряные цены основы дают доли золотого.
 *
 * @param gold стоимость в золотых монетах.
 * @returns подпись для строки инвентаря («410 зм»).
 */
function getGoldCostLabel(gold: number): string {
  const rounded = Math.round(gold * 100) / 100;

  return `${String(rounded).replace('.', ',')} ${CURRENCY_LABELS.gold.toLowerCase()}`;
}

/**
 * Стоимость магического предмета: цена магии по редкости плюс стоимость
 * немагической основы, если она есть. Артефакт бесценен; у редкости без цены в
 * таблице (не определена) остаётся одна основа, а нераспознанная цена основы
 * («варьируется») — одна цена магии.
 *
 * @param rarity редкость магического предмета.
 * @param baseItem деталь немагической основы; null — основы нет.
 * @returns подпись стоимости; '' — посчитать не из чего.
 */
export function getMagicItemCost(
  rarity: MagicItemRarityKey,
  baseItem: ItemSummary | null,
): string {
  if (rarity === 'ARTIFACT') {
    return MAGIC_ITEM_ARTIFACT_COST_LABEL;
  }

  const rarityCost = MAGIC_ITEM_RARITY_COSTS[rarity];
  const baseCost = baseItem ? parseItemCostInGold(baseItem.cost) : null;

  if (rarityCost === undefined) {
    return baseCost === null ? '' : getGoldCostLabel(baseCost);
  }

  return getGoldCostLabel(rarityCost + (baseCost ?? 0));
}

/**
 * Урон основы с магической надбавкой: бонус к урону складывается с собственным
 * бонусом оружия из справочника.
 *
 * @param damage урон немагической основы; null — справочник его не отдал.
 * @param damageBonus бонус к урону от магии.
 * @returns урон с надбавкой; null — урона у основы нет.
 */
function getMagicWeaponDamage(
  damage: InventoryWeaponDamage | null,
  damageBonus: number,
): InventoryWeaponDamage | null {
  if (!damage) {
    return null;
  }

  return { ...damage, bonus: damage.bonus + damageBonus };
}

/**
 * Оружие магического предмета: параметры немагической основы плюс бонусы магии
 * к атаке и урону (у универсального оружия — в обоих бросках).
 *
 * @param weapon оружие немагической основы; null — основа не оружие.
 * @param bonuses бонусы магического предмета.
 * @returns параметры оружия для строки инвентаря; null — оружия нет.
 */
function getMagicItemWeapon(
  weapon: InventoryWeapon | null,
  bonuses: MagicItemBonuses,
): InventoryWeapon | null {
  if (!weapon) {
    return null;
  }

  return {
    ...weapon,
    attackBonus: weapon.attackBonus + bonuses.attack,
    damage: getMagicWeaponDamage(weapon.damage, bonuses.damage),
    versatileDamage: getMagicWeaponDamage(
      weapon.versatileDamage,
      bonuses.damage,
    ),
  };
}

/**
 * Заряды предмета для записи инвентаря: свежий предмет заряжен полностью.
 *
 * @param maxCharges максимум зарядов из каталога.
 * @returns заряды предмета; null — зарядов у него нет.
 */
function getInventoryCharges(maxCharges: number): InventoryCharges | null {
  const max = Math.max(0, Math.trunc(maxCharges));

  return max > 0 ? { current: max, max } : null;
}

/**
 * Доспех магического предмета: бонус к КД входит в базовое значение основы —
 * так магический щит остаётся щитом и правило «в зачёт идёт лучший» работает
 * по итоговому числу.
 *
 * @param armor доспех немагической основы; null — основа не доспех.
 * @param armorClassBonus бонус к КД от магии.
 * @returns параметры доспеха для строки инвентаря; null — доспеха нет.
 */
function getMagicItemArmor(
  armor: InventoryArmor | null,
  armorClassBonus: number,
): InventoryArmor | null {
  if (!armor) {
    return null;
  }

  return { ...armor, baseArmorClass: armor.baseArmorClass + armorClassBonus };
}

/**
 * Сборка предмета инвентаря из ссылки каталога магических предметов: категория
 * и редкость известны прямо из поиска, а своих веса и стоимости раздел не
 * отдаёт. Цена берётся по редкости из таблицы, и предмет, сделанный на основе
 * ровно одного немагического, добавляет к ней цену основы, а заодно забирает её
 * вес и боевые параметры. Бонусы мастерской ложатся поверх основы; бонус к КД
 * предмета без брони (плащ защиты) становится плоской надбавкой.
 *
 * @param catalogItem магический предмет каталога.
 * @param summary редкость, бонусы и немагическая основа; null — «сырой» ответ не загрузился.
 * @returns предмет инвентаря для вкладки «Снаряжение».
 */
export function buildMagicItemInventoryItem(
  catalogItem: MagicItemCatalogItem,
  summary: MagicItemSummary | null,
): CharacterInventoryItem {
  const typesLabel = [capitalize(catalogItem.category), catalogItem.rarity]
    .filter(Boolean)
    .join(', ');

  const bonuses = summary?.bonuses ?? EMPTY_MAGIC_ITEM_BONUSES;
  const baseItem = summary?.baseItem ?? null;
  const armor = getMagicItemArmor(baseItem?.armor ?? null, bonuses.armorClass);

  return {
    id: getInventoryItemId('magic-item', catalogItem.url),
    url: catalogItem.url,
    name: catalogItem.name,
    category: 'MAGIC_ITEM',
    typesLabel,
    cost: summary ? getMagicItemCost(summary.rarity, baseItem) : '',
    weight: baseItem?.weight ?? 0,
    quantity: 1,
    armor,
    // Бонус доспешной основы уже вошёл в её КД — второй раз он не считается.
    armorClassBonus: armor ? MAGIC_ITEM_BONUS_NONE : bonuses.armorClass,
    weapon: getMagicItemWeapon(baseItem?.weapon ?? null, bonuses),
    equipped: false,
    twoHanded: false,
    // Пассивные бонусы есть только у своих предметов: их задаёт форма листа.
    bonuses: [],
    ...DEFAULT_INVENTORY_MAGIC_STATE,
    // Настройка — свойство предмета: настроиться игрок решает сам, но
    // предлагать это лист должен только там, где настройка вообще нужна.
    requiresAttunement: summary?.requiresAttunement ?? false,
    // Свежий предмет попадает на лист заряженным полностью.
    charges: getInventoryCharges(summary?.maxCharges ?? 0),
  };
}

/**
 * Название позиции стартового снаряжения с уточнением из справочника
 * («Книга (по истории)»).
 *
 * @param item позиция варианта стартового снаряжения.
 * @returns название для строки инвентаря и подписи варианта.
 */
function getStartingEquipmentItemName(item: StartingEquipmentItem): string {
  return item.hint ? `${item.name} (${item.hint})` : item.name;
}

/**
 * Подпись варианта стартового снаряжения: предметы с количеством и монеты в
 * конце — ровно то, что попадёт на лист при выборе этого варианта.
 *
 * @param option вариант стартового снаряжения.
 * @returns перечисление через запятую.
 */
export function getStartingEquipmentSummary(
  option: StartingEquipmentOption,
): string {
  const parts = option.items.map((item) => {
    const name = getStartingEquipmentItemName(item);

    return item.quantity > 1
      ? `${name} ${STARTING_EQUIPMENT_LABELS.quantityPrefix}${item.quantity}`
      : name;
  });

  if (option.coins > 0) {
    parts.push(`${option.coins} ${CURRENCY_LABELS[option.coinKey]}`);
  }

  return parts.join(', ') || STARTING_EQUIPMENT_LABELS.emptyOptionDescription;
}

/**
 * Предмет инвентаря для позиции варианта стартового снаряжения. Каталожная
 * позиция собирается из детали раздела «Предметы» (категория, вес, боевые
 * параметры) и получает количество варианта; позиция, детали которой не
 * загрузились, остаётся ссылкой на каталог с одним названием; позиции без
 * ссылки (например, «музыкальный инструмент») становятся своим предметом листа
 * — игрок заменит его настоящим.
 *
 * @param item позиция варианта стартового снаряжения.
 * @param summary деталь предмета каталога; null — ссылки нет или она не загрузилась.
 * @returns предмет инвентаря для вкладки «Снаряжение».
 */
export function buildStartingEquipmentItem(
  item: StartingEquipmentItem,
  summary: ItemSummary | null,
): CharacterInventoryItem {
  if (summary) {
    return { ...buildInventoryItem(summary), quantity: item.quantity };
  }

  const name = getStartingEquipmentItemName(item);

  if (item.url) {
    return {
      id: getInventoryItemId('item', item.url),
      url: item.url,
      name,
      category: 'ITEM',
      typesLabel: '',
      cost: '',
      weight: 0,
      quantity: item.quantity,
      armor: null,
      armorClassBonus: MAGIC_ITEM_BONUS_NONE,
      weapon: null,
      equipped: false,
      twoHanded: false,
      bonuses: [],
      ...DEFAULT_INVENTORY_MAGIC_STATE,
    };
  }

  // Идентификатор своей позиции строится от названия, а не случайным: повторный
  // выбор того же класса складывает количество вместо второй такой же строки.
  const url = `${CUSTOM_INVENTORY_URL_PREFIX}${STARTING_EQUIPMENT_CUSTOM_ID_SEGMENT}${name.toLowerCase()}`;

  return {
    id: url,
    url,
    name,
    category: 'ITEM',
    typesLabel: '',
    cost: '',
    weight: 0,
    quantity: item.quantity,
    armor: null,
    armorClassBonus: MAGIC_ITEM_BONUS_NONE,
    weapon: null,
    equipped: false,
    twoHanded: false,
    // Пассивные бонусы есть только у своих предметов: их задаёт форма листа.
    bonuses: [],
    ...DEFAULT_INVENTORY_MAGIC_STATE,
    description: [],
  };
}

/**
 * Слияние добавляемых предметов с инвентарём: уже лежащий в инвентаре предмет
 * получает прибавку к количеству (стартовый набор и покупка одного и того же
 * кинжала — одна строка), новый уходит в конец списка.
 *
 * @param inventory текущий инвентарь персонажа.
 * @param addedItems добавляемые предметы (повторы внутри списка складываются).
 * @returns новый инвентарь.
 */
export function mergeInventoryItems(
  inventory: CharacterInventoryItem[],
  addedItems: CharacterInventoryItem[],
): CharacterInventoryItem[] {
  const addedQuantities = new Map<string, number>();

  for (const addedItem of addedItems) {
    addedQuantities.set(
      addedItem.id,
      (addedQuantities.get(addedItem.id) ?? 0) + addedItem.quantity,
    );
  }

  const merged = inventory.map((inventoryItem) => {
    const addedQuantity = addedQuantities.get(inventoryItem.id);

    if (addedQuantity === undefined) {
      return inventoryItem;
    }

    addedQuantities.delete(inventoryItem.id);

    return {
      ...inventoryItem,
      quantity: getClampedInteger(
        inventoryItem.quantity + addedQuantity,
        INVENTORY_QUANTITY_MIN,
        INVENTORY_QUANTITY_MAX,
      ),
    };
  });

  // Оставшиеся в карте предметы — новые для инвентаря; ключ удаляется вместе с
  // добавлением, поэтому повтор одного предмета в списке не даёт двух строк.
  for (const addedItem of addedItems) {
    const quantity = addedQuantities.get(addedItem.id);

    if (quantity === undefined) {
      continue;
    }

    addedQuantities.delete(addedItem.id);

    merged.push({
      ...addedItem,
      quantity: getClampedInteger(
        quantity,
        INVENTORY_QUANTITY_MIN,
        INVENTORY_QUANTITY_MAX,
      ),
    });
  }

  return merged;
}

/**
 * Изменение количества одной денежной единицы кошелька; результат остаётся в
 * допустимом диапазоне (снятие монет, которых уже потратили, уводит единицу в
 * ноль, а не в минус).
 *
 * @param currency кошелёк персонажа.
 * @param key денежная единица.
 * @param delta прибавка (отрицательная — снятие).
 * @returns новый кошелёк.
 */
function addCurrencyAmount(
  currency: CharacterCurrency,
  key: CurrencyKey,
  delta: number,
): CharacterCurrency {
  const total = { ...currency };

  total[key] = getClampedInteger(
    currency[key] + delta,
    CURRENCY_AMOUNT_MIN,
    CURRENCY_AMOUNT_MAX,
  );

  return total;
}

/**
 * Снятие выданного источником стартового снаряжения: у строк инвентаря
 * вычитается ровно выданное количество, опустевшие строки уходят из списка.
 * Купленное сверх набора остаётся — вычитается доля источника, а не вся строка.
 *
 * @param inventory текущий инвентарь персонажа.
 * @param granted выданное снаряжение источника.
 * @returns инвентарь без выданных предметов.
 */
function removeGrantedInventoryItems(
  inventory: CharacterInventoryItem[],
  granted: GrantedStartingEquipment,
): CharacterInventoryItem[] {
  const grantedQuantities = new Map<string, number>();

  for (const item of granted.items) {
    grantedQuantities.set(
      item.id,
      (grantedQuantities.get(item.id) ?? 0) + item.quantity,
    );
  }

  return inventory
    .map((inventoryItem) => {
      const grantedQuantity = grantedQuantities.get(inventoryItem.id);

      if (grantedQuantity === undefined) {
        return inventoryItem;
      }

      return {
        ...inventoryItem,
        quantity: Math.max(inventoryItem.quantity - grantedQuantity, 0),
      };
    })
    .filter(
      (inventoryItem) =>
        !grantedQuantities.has(inventoryItem.id) || inventoryItem.quantity > 0,
    );
}

/**
 * Пересчёт инвентаря и кошелька при смене стартового снаряжения источника:
 * выданное прошлым выбором снимается, выданное новым — прибавляется. Оба шага
 * идут вместе, поэтому повторный выбор того же класса или предыстории оставляет
 * лист таким же, а не удваивает набор.
 *
 * @param inventory текущий инвентарь персонажа.
 * @param currency текущий кошелёк персонажа.
 * @param previous снаряжение, выданное прошлым выбором; null — не выдавалось.
 * @param next снаряжение нового выбора; null — вариант не выбран.
 * @returns инвентарь, кошелёк и запись выданного для листа.
 */
export function applyStartingEquipmentChange(
  inventory: CharacterInventoryItem[],
  currency: CharacterCurrency,
  previous: GrantedStartingEquipment | null,
  next: StartingEquipmentGrant | null,
): {
  inventory: CharacterInventoryItem[];
  currency: CharacterCurrency;
  granted: GrantedStartingEquipment | null;
} {
  const withoutPrevious = previous
    ? removeGrantedInventoryItems(inventory, previous)
    : inventory;

  const currencyWithoutPrevious = previous
    ? addCurrencyAmount(currency, previous.coinKey, -previous.coins)
    : currency;

  if (!next) {
    return {
      inventory: withoutPrevious,
      currency: currencyWithoutPrevious,
      granted: null,
    };
  }

  return {
    inventory: mergeInventoryItems(withoutPrevious, next.items),
    currency: addCurrencyAmount(
      currencyWithoutPrevious,
      next.coinKey,
      next.coins,
    ),
    // Запоминается то, что просил выдать источник: слияние могло досыпать
    // количество к уже лежавшей строке, и снимать нужно ровно свою долю.
    granted: {
      items: next.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
      coins: next.coins,
      coinKey: next.coinKey,
    },
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
 * Можно ли предмет надеть. Доспех и щит идут в подсчёт класса доспеха, предмет
 * со своим плоским бонусом (плащ защиты) — тоже, а остальной магии отметка
 * нужна, чтобы кольцо и амулет вообще можно было носить: их свойства работают
 * только на надетом предмете. Обычному оружию и снаряжению надеваться некуда.
 *
 * @param inventoryItem предмет инвентаря.
 * @returns true — предмет надевается.
 */
export function isEquippableInventoryItem(
  inventoryItem: CharacterInventoryItem,
): boolean {
  return (
    inventoryItem.armor !== null
    || inventoryItem.armorClassBonus !== MAGIC_ITEM_BONUS_NONE
    || inventoryItem.category === 'MAGIC_ITEM'
    // Свой предмет бывает и немагическим (наручи мастера-оружейника): пока его
    // не надеть, заданные ему бонусы в лист не пойдут.
    || hasInventoryItemBonuses(inventoryItem)
  );
}

/**
 * Иконка кнопки «надеть»: её выбирает вид предмета, а не сам факт надевания —
 * щит на магическом мече говорил бы о предмете неправду. Вид берём тот же, что
 * и форма своего предмета: магическая группа его не выдаёт, зато выдают
 * параметры оружия и доспеха.
 *
 * @param inventoryItem предмет инвентаря.
 * @param equipped предмет надет.
 * @returns имя иконки.
 */
export function getInventoryEquipIcon(
  inventoryItem: CharacterInventoryItem,
  equipped: boolean,
): string {
  const icons = INVENTORY_EQUIP_ICONS[getCustomInventoryKind(inventoryItem)];

  return equipped ? icons.equipped : icons.idle;
}

/**
 * Даёт ли предмет хоть какой-нибудь пассивный бонус листу.
 *
 * @param inventoryItem предмет инвентаря.
 * @returns true — у предмета есть пассивные бонусы.
 */
export function hasInventoryItemBonuses(
  inventoryItem: CharacterInventoryItem,
): boolean {
  return inventoryItem.bonuses.length > 0;
}

/**
 * Составное значение цели для селектора формы: вид и ключ в одной строке, ведь
 * селект отдаёт одно значение.
 *
 * @param kind вид цели.
 * @param key ключ цели; '' — цель уточнения не требует.
 * @returns значение варианта селектора.
 */
export function toInventoryBonusTargetValue(
  kind: InventoryBonusTargetKind,
  key: string,
): string {
  return `${kind}${INVENTORY_BONUS_TARGET_SEPARATOR}${key}`;
}

/**
 * Разбор значения селектора обратно в цель бонуса. Название навыка может
 * содержать двоеточие, поэтому ключом считается всё после ПЕРВОГО разделителя.
 *
 * @param value значение варианта селектора.
 * @returns цель бонуса; null — значение не разбирается.
 */
export function parseInventoryBonusTarget(
  value: string,
): { kind: InventoryBonusTargetKind; key: string } | null {
  const separatorIndex = value.indexOf(INVENTORY_BONUS_TARGET_SEPARATOR);

  if (separatorIndex < 0) {
    return null;
  }

  const kind = value.slice(0, separatorIndex);

  if (!isInventoryBonusTargetKind(kind)) {
    return null;
  }

  return { kind, key: value.slice(separatorIndex + 1) };
}

/**
 * Проверка, что строка — известный вид цели бонуса: значения селектора приходят
 * нетипизированными, а в запись листа должен попасть только known-вид.
 *
 * @param candidate проверяемое значение.
 * @returns true — значение является видом цели.
 */
function isInventoryBonusTargetKind(
  candidate: string,
): candidate is InventoryBonusTargetKind {
  return (
    candidate in INVENTORY_BONUS_TARGET_PREFIXES
    || candidate in INVENTORY_BONUS_TARGET_LABELS
  );
}

/**
 * Подпись цели бонуса: у целей с уточнением — «Спасбросок: Ловкость», у
 * остальных — их собственное название.
 *
 * @param kind вид цели.
 * @param key ключ цели; '' — цель уточнения не требует.
 * @returns подпись цели.
 */
export function getInventoryBonusTargetLabel(
  kind: InventoryBonusTargetKind,
  key: string,
): string {
  if (kind === 'skill') {
    return `${INVENTORY_BONUS_TARGET_PREFIXES.skill}: ${key}`;
  }

  if (kind === 'speed') {
    const speedLabel = isSpeedTypeKey(key) ? SPEED_TYPE_LABELS[key] : key;

    return `${INVENTORY_BONUS_TARGET_PREFIXES.speed}: ${speedLabel}`;
  }

  if (
    kind === 'ability'
    || kind === 'ability-check'
    || kind === 'saving-throw'
  ) {
    const abilityLabel = isAbilityKey(key) ? ABILITY_LABELS[key] : key;

    return `${INVENTORY_BONUS_TARGET_PREFIXES[kind]}: ${abilityLabel}`;
  }

  return INVENTORY_BONUS_TARGET_LABELS[kind];
}

/**
 * Проверка, что значение — ключ скорости передвижения.
 *
 * @param candidate проверяемое значение.
 * @returns true — значение является ключом скорости.
 */
function isSpeedTypeKey(candidate: string): candidate is SpeedTypeKey {
  return candidate in SPEED_TYPE_LABELS;
}

/**
 * Вариант цели для селектора формы: значение и подпись одной цели.
 *
 * @param kind вид цели.
 * @param key ключ цели; '' — цель уточнения не требует.
 * @returns вариант цели бонуса.
 */
function toInventoryBonusTargetOption(
  kind: InventoryBonusTargetKind,
  key: string,
): InventoryBonusTargetOption {
  return {
    value: toInventoryBonusTargetValue(kind, key),
    label: getInventoryBonusTargetLabel(kind, key),
  };
}

/**
 * Варианты цели бонуса для селектора формы, сгруппированные по смыслу. Навыки
 * берутся из самого листа: свои навыки игрока усиливаются наравне с навыками
 * по правилам.
 *
 * @param character персонаж.
 * @returns группы вариантов цели бонуса.
 */
export function getInventoryBonusTargetGroups(
  character: Character,
): InventoryBonusTargetGroup[] {
  return [
    {
      label: INVENTORY_BONUS_GROUP_LABELS.abilities,
      items: ABILITY_ORDER.map((ability) =>
        toInventoryBonusTargetOption('ability', ability),
      ),
    },
    {
      label: INVENTORY_BONUS_GROUP_LABELS.checks,
      items: ABILITY_ORDER.map((ability) =>
        toInventoryBonusTargetOption('ability-check', ability),
      ),
    },
    {
      label: INVENTORY_BONUS_GROUP_LABELS.savingThrows,
      items: [
        toInventoryBonusTargetOption('all-saving-throws', ''),
        ...ABILITY_ORDER.map((ability) =>
          toInventoryBonusTargetOption('saving-throw', ability),
        ),
      ],
    },
    {
      label: INVENTORY_BONUS_GROUP_LABELS.skills,
      items: character.skills.map((skill) =>
        toInventoryBonusTargetOption('skill', skill.name),
      ),
    },
    {
      label: INVENTORY_BONUS_GROUP_LABELS.speeds,
      items: [
        toInventoryBonusTargetOption('all-speeds', ''),
        ...SPEED_PRIMARY_ORDER.map((speedKey) =>
          toInventoryBonusTargetOption('speed', speedKey),
        ),
      ],
    },
    {
      label: INVENTORY_BONUS_GROUP_LABELS.other,
      items: [
        toInventoryBonusTargetOption('armor-class', ''),
        toInventoryBonusTargetOption('initiative', ''),
        toInventoryBonusTargetOption('spell-save-dc', ''),
        toInventoryBonusTargetOption('spell-attack', ''),
      ],
    },
  ];
}

/**
 * Настраивается ли персонаж на предмет: настройку требует сам предмет, и лист
 * предлагает её только там, где каталог её назвал.
 *
 * @param inventoryItem предмет инвентаря.
 * @returns true — на предмет можно настроиться.
 */
export function isAttunableInventoryItem(
  inventoryItem: CharacterInventoryItem,
): boolean {
  return inventoryItem.requiresAttunement;
}

/**
 * Можно ли предмет включить. Включение — про магию: у обычного снаряжения
 * свойств, которые работают не всегда, нет.
 *
 * @param inventoryItem предмет инвентаря.
 * @returns true — предмет включается.
 */
export function isActivatableInventoryItem(
  inventoryItem: CharacterInventoryItem,
): boolean {
  return inventoryItem.category === 'MAGIC_ITEM';
}

/**
 * Сводка магии предмета для его строки: что именно он даёт листу. Собирается из
 * всех его надбавок — и боевых (попадание, дополнительный урон, класс доспеха),
 * и пассивных, — потому что игрок читает их одним списком.
 *
 * @param inventoryItem предмет инвентаря.
 * @returns подписи бонусов; пустой список — предмет ничего не даёт.
 */
export function getInventoryItemBonusLabels(
  inventoryItem: CharacterInventoryItem,
): string[] {
  const labels: string[] = [];

  const attackBonus =
    inventoryItem.weapon?.attackBonus ?? MAGIC_ITEM_BONUS_NONE;

  if (attackBonus !== MAGIC_ITEM_BONUS_NONE) {
    labels.push(
      `${INVENTORY_BONUS_LABELS.attack} ${getFormattedBonus(attackBonus)}`,
    );
  }

  const extraDamage = inventoryItem.weapon?.extraDamage;

  if (extraDamage && extraDamage.diceCount > 0) {
    const damageTypeLabel = DAMAGE_TYPE_LABELS[extraDamage.type] ?? '';

    const notation = `${extraDamage.diceCount}${DICE_NOTATION_LETTER}${extraDamage.diceFaces}`;

    labels.push(
      [INVENTORY_BONUS_LABELS.extraDamage, notation, damageTypeLabel]
        .filter(Boolean)
        .join(' '),
    );
  }

  if (inventoryItem.armorClassBonus !== MAGIC_ITEM_BONUS_NONE) {
    labels.push(
      `${INVENTORY_BONUS_TARGET_LABELS['armor-class']} ${getFormattedBonus(
        inventoryItem.armorClassBonus,
      )}`,
    );
  }

  for (const bonus of inventoryItem.bonuses) {
    if (bonus.value === 0) {
      continue;
    }

    labels.push(
      `${getInventoryBonusTargetLabel(bonus.kind, bonus.key)} ${getFormattedBonus(
        bonus.value,
      )}`,
    );
  }

  return labels;
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

  if (draft.heavy) {
    labelParts.push(CUSTOM_WEAPON_PROPERTY_LABELS.heavy);
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

  const bonus = getClampedInteger(
    draft.damageBonus,
    DAMAGE_BONUS_MIN,
    DAMAGE_BONUS_MAX,
  );

  const versatileDiceCount = getClampedInteger(
    draft.versatileDiceCount,
    DAMAGE_DICE_COUNT_MIN,
    DAMAGE_DICE_COUNT_MAX,
  );

  const extraDiceCount = getClampedInteger(
    draft.extraDamageDiceCount,
    DAMAGE_DICE_COUNT_MIN,
    DAMAGE_DICE_COUNT_MAX,
  );

  return {
    category: draft.weaponCategory,
    ranged: draft.ranged,
    finesse: draft.finesse,
    heavy: draft.heavy,
    // Собственный бонус к попаданию есть у любого оружия: чаще его даёт магия,
    // но задать его игрок должен уметь и без неё. Дополнительный урон остаётся
    // магическим — у обычного оружия его поля в форме выключены.
    attackBonus: getClampedInteger(
      draft.attackBonus,
      ITEM_BONUS_MIN,
      ITEM_BONUS_MAX,
    ),
    // Второй бросок есть только у универсального оружия; тип урона и
    // собственный бонус у обоих хватов общие — по правилам меняется лишь кость.
    versatileDamage:
      draft.versatile && versatileDiceCount > 0
        ? {
            diceCount: versatileDiceCount,
            diceFaces: draft.versatileDiceFaces,
            bonus,
            type: draft.damageType,
          }
        : null,
    extraDamage:
      draft.magic && extraDiceCount > 0
        ? {
            diceCount: extraDiceCount,
            diceFaces: draft.extraDamageDiceFaces,
            type: draft.extraDamageType,
          }
        : null,
    damage:
      diceCount > 0
        ? {
            diceCount,
            diceFaces: draft.damageDiceFaces,
            bonus,
            type: draft.damageType,
          }
        : null,
  };
}

/**
 * Пассивные бонусы предмета из значений формы. null — предмет ничего не даёт:
 * пустой блок в записи листа только мешал бы отличать «бонусов нет» от
 * «бонусы обнулены».
 *
 * @param draft значения формы своего предмета.
 * @returns пассивные бонусы предмета или null.
 */
function getCustomInventoryBonuses(
  draft: CustomInventoryItemDraft,
): InventoryItemBonus[] {
  // Бонусы задаёт вкладка магии, и снятая пометка их отменяет: иначе
  // выключенные поля продолжали бы считаться в листе.
  if (!draft.magic) {
    return [];
  }

  return (
    draft.bonuses
      .map((bonus) => ({
        ...bonus,
        value: getClampedInteger(
          bonus.value,
          getInventoryBonusMin(bonus.kind),
          getInventoryBonusMax(bonus.kind),
        ),
      }))
      // Нулевая строка — незаполненная: она ничего не даёт, но занимала бы место
      // и в сводке предмета, и в разборе значений листа.
      .filter((bonus) => bonus.value !== 0)
  );
}

/**
 * Нижняя граница величины бонуса: у скоростей она считается в футах, поэтому
 * шире, чем у прибавок к броскам.
 *
 * @param kind вид цели бонуса.
 * @returns минимальное значение бонуса.
 */
export function getInventoryBonusMin(kind: InventoryBonusTargetKind): number {
  return kind === 'speed' || kind === 'all-speeds'
    ? ITEM_SPEED_BONUS_MIN
    : ITEM_BONUS_MIN;
}

/**
 * Верхняя граница величины бонуса.
 *
 * @param kind вид цели бонуса.
 * @returns максимальное значение бонуса.
 */
export function getInventoryBonusMax(kind: InventoryBonusTargetKind): number {
  return kind === 'speed' || kind === 'all-speeds'
    ? ITEM_SPEED_BONUS_MAX
    : ITEM_BONUS_MAX;
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
export function getClampedInteger(
  value: number,
  min: number,
  max: number,
): number {
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
 * @param equipped предмет надет (сохраняется при редактировании).
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
    // Своя запись держит прибавку к КД строкой бонусов, как и все остальные
    // прибавки; поле остаётся каталожным записям, где раздел отдаёт его числом.
    armorClassBonus: MAGIC_ITEM_BONUS_NONE,
    weapon: getCustomInventoryWeapon(draft),
    // Надетым остаётся то, что надевают: доспех и любой магический предмет
    // (кольцо и плащ доспехом не являются, но носятся). У обычного оружия и
    // безделушки отметке взяться неоткуда. Форма может обнулить количество —
    // тогда предмет снимается вместе с ним.
    equipped:
      (draft.kind === 'armor' || draft.magic) && equipped && quantity > 0,
    // Хват начинается с одной руки: взять универсальное оружие двумя предлагает
    // меню предмета, а правку хвата сохраняет `toUpdatedCustomInventoryItem`.
    twoHanded: false,
    bonuses: getCustomInventoryBonuses(draft),
    // Включение и настройка — состояние игрока, форма задаёт только само
    // требование настройки и запас зарядов; свежий предмет заряжен полностью.
    // Немагическому предмету ни то, ни другое не нужно.
    ...DEFAULT_INVENTORY_MAGIC_STATE,
    requiresAttunement: draft.magic && draft.requiresAttunement,
    charges: draft.magic ? getInventoryCharges(draft.maxCharges) : null,
    description: [...draft.description],
  };
}

/**
 * Возврат хвата правленому предмету: сам второй бросок задаёт форма, но брать
 * оружие двумя руками игрок решает в бою — правка описания меча не должна
 * перекладывать его в одну руку. Переставшее быть универсальным оружие хват
 * теряет: катить им по большей кости больше нечем.
 *
 * @param updatedItem предмет, собранный из значений формы.
 * @param editedItem предмет до правки.
 * @returns предмет с сохранённым хватом.
 */
function withKeptVersatileGrip(
  updatedItem: CharacterInventoryItem,
  editedItem: CharacterInventoryItem,
): CharacterInventoryItem {
  if (!updatedItem.weapon?.versatileDamage) {
    return updatedItem;
  }

  return { ...updatedItem, twoHanded: editedItem.twoHanded };
}

/**
 * Возврат состояния магии правленому предмету: настройка, включение и остаток
 * зарядов — состояние игрока, а не значения формы, и правка названия жезла не
 * должна его обнулять. Само требование настройки и запас зарядов задаёт форма,
 * поэтому остаток обрезается новым максимумом, а снятое требование снимает и
 * настройку.
 *
 * @param updatedItem предмет, собранный из значений формы.
 * @param editedItem предмет до правки.
 * @returns предмет с сохранённым состоянием магии.
 */
function withKeptMagicState(
  updatedItem: CharacterInventoryItem,
  editedItem: CharacterInventoryItem,
): CharacterInventoryItem {
  const charges = updatedItem.charges
    ? {
        ...updatedItem.charges,
        current: clamp(
          editedItem.charges?.current ?? updatedItem.charges.max,
          0,
          updatedItem.charges.max,
        ),
      }
    : null;

  return {
    ...updatedItem,
    attuned: updatedItem.requiresAttunement && editedItem.attuned,
    active: isActivatableInventoryItem(updatedItem) && editedItem.active,
    charges,
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
    ? withKeptMagicState(
        withKeptVersatileGrip(draftItem, editedItem),
        editedItem,
      )
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
 * Строки бонусов для формы. Каталожная копия держит прибавку к КД полем, а
 * форма правит её строкой, поэтому поле разворачивается в строку — иначе
 * правка копии плаща защиты молча отобрала бы у него защиту.
 *
 * @param inventoryItem предмет инвентаря.
 * @returns строки бонусов для формы.
 */
function getCustomInventoryBonusRows(
  inventoryItem: CharacterInventoryItem,
): InventoryItemBonus[] {
  const armorClassRows: InventoryItemBonus[] =
    inventoryItem.armorClassBonus === MAGIC_ITEM_BONUS_NONE
      ? []
      : [
          {
            id: crypto.randomUUID(),
            kind: 'armor-class',
            key: '',
            value: inventoryItem.armorClassBonus,
          },
        ];

  return [
    ...armorClassRows,
    ...inventoryItem.bonuses.map((bonus) => ({ ...bonus })),
  ];
}

/**
 * Значение селектора типа урона из хранимого типа: пустого значения у селекта
 * нет, поэтому незаполненный тип показывается вариантом «не указан».
 *
 * @param damageType хранимый тип урона; пустая строка — тип не указан.
 * @returns значение варианта селектора.
 */
export function toDamageTypeValue(damageType: string): string {
  return damageType || DAMAGE_TYPE_NONE;
}

/**
 * Хранимый тип урона из значения селектора: вариантом «не указан» игрок
 * сбрасывает выбранный тип.
 *
 * @param selectValue значение варианта селектора.
 * @returns тип урона; пустая строка — тип не указан.
 */
export function parseDamageTypeValue(selectValue: string): string {
  return selectValue === DAMAGE_TYPE_NONE ? '' : selectValue;
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
  const { armor, weapon, charges } = inventoryItem;

  const versatileDamage = weapon?.versatileDamage ?? null;
  const extraDamage = weapon?.extraDamage ?? null;

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
    heavy: weapon?.heavy ?? NEW_CUSTOM_INVENTORY_ITEM.heavy,
    damageDiceCount:
      weapon?.damage?.diceCount ?? NEW_CUSTOM_INVENTORY_ITEM.damageDiceCount,
    damageDiceFaces:
      weapon?.damage?.diceFaces ?? NEW_CUSTOM_INVENTORY_ITEM.damageDiceFaces,
    damageBonus: weapon?.damage?.bonus ?? NEW_CUSTOM_INVENTORY_ITEM.damageBonus,
    damageType: weapon?.damage?.type ?? NEW_CUSTOM_INVENTORY_ITEM.damageType,
    // Универсальность узнаётся по самому второму броску — отдельного признака у
    // оружия нет, как и у каталожного.
    versatile: versatileDamage !== null,
    versatileDiceCount:
      versatileDamage?.diceCount
      ?? NEW_CUSTOM_INVENTORY_ITEM.versatileDiceCount,
    versatileDiceFaces:
      versatileDamage?.diceFaces
      ?? NEW_CUSTOM_INVENTORY_ITEM.versatileDiceFaces,
    attackBonus: weapon?.attackBonus ?? NEW_CUSTOM_INVENTORY_ITEM.attackBonus,
    extraDamageDiceCount:
      extraDamage?.diceCount ?? NEW_CUSTOM_INVENTORY_ITEM.extraDamageDiceCount,
    extraDamageDiceFaces:
      extraDamage?.diceFaces ?? NEW_CUSTOM_INVENTORY_ITEM.extraDamageDiceFaces,
    extraDamageType:
      extraDamage?.type ?? NEW_CUSTOM_INVENTORY_ITEM.extraDamageType,
    bonuses: getCustomInventoryBonusRows(inventoryItem),
    requiresAttunement: inventoryItem.requiresAttunement,
    maxCharges: charges?.max ?? NEW_CUSTOM_INVENTORY_ITEM.maxCharges,
    description: [...(inventoryItem.description ?? [])],
  };
}

/**
 * Поправка грузоподъёмности на размер. Неизвестный или неуказанный размер
 * считаем средним — так лист вёл себя до появления поправки.
 *
 * @param size подпись размера; null — не указан.
 * @returns множитель грузоподъёмности.
 */
function getCarryingCapacitySizeMultiplier(size: string | null): number {
  return (
    CARRYING_CAPACITY_SIZE_MULTIPLIERS[size?.trim().toLowerCase() ?? ''] ?? 1
  );
}

/**
 * Грузоподъёмность персонажа: Сила × 15 с поправкой на размер (правила 2024).
 *
 * @param strength значение Силы.
 * @param size подпись размера персонажа; null — не указан.
 * @returns грузоподъёмность в фунтах.
 */
function getCarryingCapacity(strength: number, size: string | null): number {
  return (
    strength
    * CARRYING_CAPACITY_MULTIPLIER
    * getCarryingCapacitySizeMultiplier(size)
  );
}

/**
 * Подпись поправки на размер: множитель с русской запятой, чтобы «×0,5»
 * читалось как в тексте правил.
 *
 * @param multiplier множитель грузоподъёмности.
 * @returns подпись множителя.
 */
export function getCarryingCapacityMultiplierLabel(multiplier: number): string {
  return `×${multiplier.toLocaleString('ru-RU')}`;
}

/**
 * Варианты размера для подсчёта грузоподъёмности: размер персонажа и каждая
 * категория со своей поправкой в подписи — так видно, во сколько раз меняется
 * предел.
 *
 * @param size размер персонажа; null — не указан.
 * @returns варианты выбора размера для подсчёта.
 */
export function getCarryingCapacitySizeOptions(
  size: string | null,
): Array<{ label: string; value: string }> {
  const autoLabel = size
    ? `${CARRYING_CAPACITY_LABELS.sizeAuto} (${size.toLowerCase()})`
    : CARRYING_CAPACITY_LABELS.sizeAutoUnknown;

  return [
    { label: autoLabel, value: CARRYING_CAPACITY_SIZE_AUTO },
    ...CARRYING_CAPACITY_SIZE_LABELS.map((sizeLabel) => ({
      label: `${sizeLabel} · ${getCarryingCapacityMultiplierLabel(
        getCarryingCapacitySizeMultiplier(sizeLabel),
      )}`,
      value: sizeLabel,
    })),
  ];
}

/**
 * Разбор предела переносимого веса: расчёт по правилам (Сила × 15 с поправкой
 * на размер) либо своё значение листа, а сверху — свой бонус. Ниже нуля предел
 * не опускается: отрицательный предел не значил бы ничего сверх пустых рук.
 *
 * @param character персонаж.
 * @returns разбор грузоподъёмности для листа и модалки настройки.
 */
export function getCarryingCapacityBreakdown(
  character: Character,
): CarryingCapacityBreakdown {
  const { size, custom, bonus } = character.carryingCapacity;

  // Размер для подсчёта задаётся отдельно от размера персонажа: «Мощное
  // телосложение» считает существо крупнее только для переносимого веса.
  const capacitySize = size ?? character.size;

  // Сила с прибавками (пояс силы великанов, свои бонусы): грузоподъёмность
  // считается от того же значения, что показывает плитка характеристики.
  const strength = getEffectiveAbilityScore(character, 'strength');

  const ruleValue = getCarryingCapacity(strength, capacitySize);

  const base = custom ?? ruleValue;

  return {
    value: Math.max(0, base + bonus),
    custom: custom !== null,
    strength,
    sizeMultiplier: getCarryingCapacitySizeMultiplier(capacitySize),
    ruleValue,
    bonus,
  };
}

/**
 * Предел переносимого веса с учётом настроек листа.
 *
 * @param character персонаж.
 * @returns грузоподъёмность в фунтах.
 */
export function getCarryingCapacityValue(character: Character): number {
  return getCarryingCapacityBreakdown(character).value;
}

/**
 * Разбор предела настройки на магические предметы: сколько предметов настроено
 * сейчас, из чего сложился предел (правило 2024, модификатор характеристики или
 * своё число) и какой бонус к нему задан. Своё число выключает подсчёт целиком —
 * бонус к нему не прибавляется.
 *
 * @param character персонаж.
 * @returns разбор для плитки вкладки снаряжения и модалки настройки.
 */
export function getAttunementBreakdown(
  character: Character,
): AttunementBreakdown {
  const { custom, ability, bonus } = character.attunement;

  const abilityModifier = ability ? getAbilityModifier(character, ability) : 0;

  const baseValue = ability ? abilityModifier : ATTUNEMENT_RULE_LIMIT;

  // Своё число клампится и здесь, а не только в экшене: документ мог прийти
  // импортом руками, а схема числа не обрезает.
  const value =
    custom === null
      ? getClampedInteger(baseValue + bonus, ATTUNEMENT_MIN, ATTUNEMENT_MAX)
      : getClampedInteger(custom, ATTUNEMENT_MIN, ATTUNEMENT_MAX);

  return {
    value,
    // Считаются те же предметы, у которых в строке горит значок «Настроен»:
    // отсутствующий предмет (количество — ноль) настройку не теряет, иначе
    // плитка расходилась бы со списком.
    count: character.inventory.filter(
      (inventoryItem) =>
        isAttunableInventoryItem(inventoryItem) && inventoryItem.attuned,
    ).length,
    custom: custom !== null,
    ability,
    abilityModifier,
    baseValue,
    bonus,
  };
}

/**
 * Значение плитки настройки на предметы: сколько настроено из того, сколько
 * можно («2 / 3»).
 *
 * @param attunement разбор предела настройки.
 * @returns строка плитки вкладки снаряжения.
 */
export function getAttunementValue(attunement: AttunementBreakdown): string {
  return `${attunement.count}${ATTUNEMENT_VALUE_SEPARATOR}${attunement.value}`;
}

/**
 * Подсказка плитки настройки на предметы: сколько настроено и откуда взялся
 * предел — правило, модификатор характеристики (с бонусом, если он задан) либо
 * своё число.
 *
 * @param attunement разбор предела настройки.
 * @returns текст подсказки плитки вкладки снаряжения.
 */
export function getAttunementHint(attunement: AttunementBreakdown): string {
  const { value, count, custom, ability, baseValue, bonus } = attunement;

  const { countHint, openHint, hints } = ATTUNEMENT_LABELS;

  const headHint = `${countHint}: ${count} из ${value}`;

  if (custom) {
    return `${headHint}. ${hints.custom} — ${openHint}`;
  }

  const baseHint = ability
    ? `${hints.ability} «${ABILITY_LABELS[ability]}»`
    : hints.rule;

  const baseLabel =
    bonus === 0
      ? String(baseValue)
      : `${baseValue} ${getFormattedBonus(bonus)} = ${value}`;

  return `${headHint}. ${baseHint}: ${baseLabel} — ${openHint}`;
}

/**
 * Описание предупреждения о достигнутом пределе настройки на предметы.
 *
 * @param limit сколько предметов можно держать настроенными.
 * @returns текст тоста.
 */
export function getAttunementLimitDescription(limit: number): string {
  return `Настроено ${limit} из ${limit} — снимите настройку с другого предмета или измените предел в плитке «${ATTUNEMENT_LABELS.stat}».`;
}

/**
 * Настройка предела настройки на предметы с очисткой чисел формы: очищенное
 * поле ввода отдаёт `NaN`, а предел входит в проверку каждой новой настройки.
 *
 * @param attunement настройка из модалки.
 * @returns настройка для записи листа.
 */
export function getStoredAttunement(
  attunement: CharacterAttunement,
): CharacterAttunement {
  return {
    custom:
      attunement.custom === null
        ? null
        : getClampedInteger(attunement.custom, ATTUNEMENT_MIN, ATTUNEMENT_MAX),
    ability: attunement.ability,
    bonus: getClampedInteger(
      attunement.bonus,
      ATTUNEMENT_BONUS_MIN,
      ATTUNEMENT_BONUS_MAX,
    ),
  };
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
 * Ловкости. Свой предел листа заменяет правило доспеха целиком: игрок задаёт
 * его умениями вроде «Воина в средних доспехах» или под свой доспех.
 *
 * @param mode правило применения модификатора Ловкости.
 * @param dexModifier модификатор Ловкости персонажа.
 * @param dexLimit свой предел бонуса Ловкости; null — по правилу доспеха.
 * @returns применяемый бонус Ловкости.
 */
function getArmorDexBonus(
  mode: ArmorDexterityMod,
  dexModifier: number,
  dexLimit: number | null,
): number {
  if (dexLimit !== null) {
    return Math.min(dexModifier, dexLimit);
  }

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
    modifier: getAbilityModifier(character, ability),
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
 * Подпись урезанной Ловкости для разбора КД: сколько модификатора дошло до КД
 * из полного и кто урезал — правило доспеха или свой предел листа. Одно число в
 * скобках игрок читал как предел, хотя это применённый бонус.
 *
 * @param breakdown разбор класса доспеха.
 * @returns подпись урезанного модификатора Ловкости.
 */
export function getArmorDexCappedLabel(breakdown: ArmorClassBreakdown): string {
  const reason = breakdown.dexLimited
    ? ARMOR_CLASS_LABELS.dexLimitedHint
    : ARMOR_CLASS_LABELS.dexCappedHint;

  const applied = getFormattedBonus(breakdown.dexBonus);
  const full = getFormattedBonus(breakdown.dexModifier);

  return `${reason}: ${applied} ${ARMOR_CLASS_LABELS.dexCappedOf} ${full}`;
}

/**
 * Магическая надбавка к КД самого доспеха: у каталожной записи она уже входит в
 * значение брони, у своей — лежит отдельным полем, и без настройки (если предмет
 * её требует) не работает. Она идёт в сравнение «в зачёт лучшая броня», а не
 * плоской прибавкой поверх: иначе слабый доспех с большой надбавкой прибавлял бы
 * к чужому КД.
 *
 * @param inventoryItem надетый доспех или щит.
 * @returns надбавка к КД доспеха; 0 — её нет или она не работает.
 */
function getArmorMagicBonus(inventoryItem: CharacterInventoryItem): number {
  return isActiveBonusItem(inventoryItem)
    ? getInventoryItemArmorClassBonus(inventoryItem)
    : 0;
}

/**
 * Прибавка предмета к классу доспеха: у каталожной записи она пришла полем
 * из раздела, у своей — строкой бонусов.
 *
 * @param inventoryItem предмет инвентаря.
 * @returns прибавка предмета к КД.
 */
export function getInventoryItemArmorClassBonus(
  inventoryItem: CharacterInventoryItem,
): number {
  return (
    inventoryItem.armorClassBonus
    + getItemBonusValue(inventoryItem, 'armor-class')
  );
}

/**
 * Разбор итогового класса доспеха. В ручном режиме (`custom`) — базовое значение
 * плюс модификаторы выбранных характеристик. В автоматическом — по надетой
 * броне: тело даёт лучшая надетая броня (или безброневой `10 + Ловкость`), щит
 * складывается сверху (в зачёт — лучший щит); модификатор Ловкости учитывается
 * по правилу брони (или по своему пределу листа, если он задан), а остальные
 * выбранные характеристики (безброневая защита, песнь клинка) прибавляются к
 * итогу целиком.
 *
 * @param character персонаж.
 * @returns разбор класса доспеха для листа и модалки.
 */
export function getArmorClassBreakdown(
  character: Character,
): ArmorClassBreakdown {
  const { base, abilities, custom, dexLimit } = character.armorClass;

  const abilityBonuses = getArmorClassAbilityBonuses(character, abilities);

  // Прибавка черт идёт и в ручной режим: она не зависит от того, откуда взята
  // основа КД. Условные прибавки («Оборона» — только в доспехе) в механику не
  // попадают и остаются в описании черты.
  const featBonus = getFeatArmorClassBonus(character.features);

  if (custom) {
    const value = abilityBonuses.reduce(
      (total, bonus) => total + bonus.modifier,
      base + featBonus,
    );

    return {
      value,
      custom: true,
      bodyArmorName: null,
      bodyArmorValue: base,
      dexBonus: 0,
      dexModifier: 0,
      dexCapped: false,
      dexLimited: false,
      shieldBonus: 0,
      itemBonus: 0,
      featBonus,
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

  // Модификатор берётся с прибавками к Ловкости (снаряжение, свои бонусы) — как
  // и у остальных характеристик КД выше: по записанному значению КД разошёлся
  // бы с плиткой характеристики.
  const dexModifier = abilities.includes(DEFAULT_ARMOR_CLASS_ABILITY)
    ? getAbilityModifier(character, DEFAULT_ARMOR_CLASS_ABILITY)
    : 0;

  // Группа предмета здесь не важна: доспех со своей магической пометкой лежит
  // среди магических предметов, но КД считается по тем же параметрам `armor`.
  // Отсутствующий доспех (количество — ноль) в зачёт не идёт, даже если остался
  // помеченным надетым в старой записи листа. Сам доспех работает и без
  // настройки (это всё ещё латы), а вот его магическая надбавка — нет: она идёт
  // в зачёт по тем же правилам, что и остальные пассивные бонусы.
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
      dexLimit,
    );

    const effectiveValue =
      item.armor.baseArmorClass + getArmorMagicBonus(item) + armorDexBonus;

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
    const shieldValue = item.armor.baseArmorClass + getArmorMagicBonus(item);

    if (item.armor.shield && shieldValue > shieldBonus) {
      shieldBonus = shieldValue;
    }
  }

  // Плащ и кольцо защиты бронёй не являются и по правилам складываются друг с
  // другом, поэтому их бонусы суммируются, а не соревнуются за лучший. Надбавка
  // самой брони сюда не идёт — она уже учтена в её значении.
  const itemBonus = character.inventory.reduce(
    (total, item) =>
      item.armor === null && isActiveBonusItem(item)
        ? total + getInventoryItemArmorClassBonus(item)
        : total,
    0,
  );

  return {
    value: bodyArmorValue + shieldBonus + itemBonus + featBonus + extraBonus,
    custom: false,
    bodyArmorName,
    bodyArmorValue,
    dexBonus,
    dexModifier,
    dexCapped,
    // Свой предел заменяет правило доспеха целиком, поэтому при заданном
    // пределе урезал Ловкость именно он.
    dexLimited: dexCapped && dexLimit !== null,
    shieldBonus,
    itemBonus,
    featBonus,
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
 * Приписка магии в конце названия предмета («Длинный меч, +1»): владение
 * оружием даётся виду, а не конкретному экземпляру.
 */
const WEAPON_MAGIC_SUFFIX_PATTERN = /[\s,]*[+-]\d+\s*$/u;

/** Уточнение в скобках в конце названия предмета («Дубинка (большая)»). */
const WEAPON_HINT_PATTERN = /\s*\([^()]*\)\s*$/u;

/**
 * Название оружия в сопоставимом с каталогом владений виде: без уточнения в
 * скобках и приписки магии.
 *
 * @param name название предмета или вида оружия.
 * @returns название для сверки владения.
 */
function getWeaponMatchName(name: string): string {
  return normalizeCatalogName(
    name
      .replace(WEAPON_HINT_PATTERN, '')
      .replace(WEAPON_MAGIC_SUFFIX_PATTERN, ''),
  );
}

/** Виды оружия каталога владений по сопоставимому названию. */
const WEAPON_CATALOG_MATCH_NAMES = new Set(
  WEAPON_PROFICIENCY_GROUPS.flatMap((group) =>
    group.items.map((name) => getWeaponMatchName(name)),
  ),
);

/**
 * Виды оружия, которыми персонаж владеет, в сопоставимом виде: запись «вся
 * группа» разворачивается в свои виды, остальные записи (в том числе не из
 * каталога) идут как есть.
 *
 * @param character персонаж.
 * @returns названия видов оружия для сверки владения.
 */
function getProficientWeaponNames(character: Character): Set<string> {
  return new Set(
    character.proficiencies.weapons.flatMap((entry) => {
      const group = WEAPON_PROFICIENCY_GROUPS.find(
        (candidate) =>
          normalizeCatalogName(candidate.all) === normalizeCatalogName(entry),
      );

      return (group?.items ?? [entry]).map((name) => getWeaponMatchName(name));
    }),
  );
}

/**
 * Владеет ли персонаж этим оружием: название предмета сверяется со списком
 * владений листа, где запись «вся группа» стоит за все виды своей категории.
 *
 * Оружие, которого в каталоге видов нет (своё, магическое со своим названием),
 * лист считает знакомым: сверять такое не с чем, а отнимать бонус мастерства по
 * одному лишь незнакомому названию — портить чужие листы вслепую.
 *
 * @param character персонаж.
 * @param inventoryItem предмет инвентаря с оружием.
 * @returns true — бонус мастерства идёт в атаку этим оружием.
 */
export function isProficientWeapon(
  character: Character,
  inventoryItem: CharacterInventoryItem,
): boolean {
  const matchName = getWeaponMatchName(inventoryItem.name);

  return (
    getProficientWeaponNames(character).has(matchName)
    || !WEAPON_CATALOG_MATCH_NAMES.has(matchName)
  );
}

/**
 * Бонус к броску атаки оружием: бонус мастерства (БаБ) плюс модификатор
 * характеристики. Базовая характеристика берётся из настроек листа (по
 * умолчанию — Сила); фехтовальное и дальнобойное оружие бьёт от Ловкости.
 *
 * Бонус мастерства даёт владение оружием: без него по правилам 2024 в атаке
 * остаются только модификатор характеристики и собственный бонус оружия.
 *
 * @param character персонаж.
 * @param weapon параметры оружия.
 * @param isProficient персонаж владеет этим оружием.
 * @returns бонус атаки и использованная характеристика.
 */
export function getWeaponAttackBonus(
  character: Character,
  weapon: InventoryWeapon,
  isProficient: boolean,
): WeaponAttack {
  const ability = getWeaponAbility(character, weapon);

  const proficiencyBonus = isProficient
    ? getCharacterProficiencyBonus(character)
    : 0;

  const value =
    proficiencyBonus
    + getAbilityModifier(character, ability)
    + weapon.attackBonus
    - getExhaustionD20Penalty(character);

  return {
    value,
    ability,
    weaponBonus: weapon.attackBonus,
    proficiencyBonus,
    heavyAbility: getHeavyWeaponAbility(character, weapon),
  };
}

/**
 * Характеристика, которой тяжёлому оружию не хватает до броска без помехи.
 * По правилам 2024 требование у свойства своё и от настройки листа не зависит:
 * рукопашному тяжёлому оружию нужна Сила, дальнобойному — Ловкость, и меньше 13
 * любая из них даёт помеху на атаку.
 *
 * @param character персонаж.
 * @param weapon параметры оружия.
 * @returns недостающая характеристика; null — помехи нет (оружие не тяжёлое
 *   либо требование выполнено).
 */
function getHeavyWeaponAbility(
  character: Character,
  weapon: InventoryWeapon,
): AbilityKey | null {
  if (!weapon.heavy) {
    return null;
  }

  const ability: AbilityKey = weapon.ranged ? 'dexterity' : 'strength';

  return getEffectiveAbilityScore(character, ability)
    < HEAVY_WEAPON_ABILITY_MINIMUM
    ? ability
    : null;
}

/**
 * Режим броска атаки по правилам: тяжёлое оружие не по руке бьёт с помехой,
 * остальное — обычным броском. Правило живёт в модели, а не в модалке: та
 * только открывается в предложенном режиме, а сменить его игрок волен сам.
 *
 * @param attack разбор бонуса атаки оружием.
 * @returns режим броска, которым открывается модалка атаки.
 */
export function getWeaponAttackRollMode(attack: WeaponAttack): RollMode {
  return attack.heavyAbility ? 'disadvantage' : DEFAULT_ROLL_MODE;
}

/**
 * Подсказка помехи от свойства «Тяжёлое»: называет характеристику, которой не
 * хватает, — сам значок «Помеха» о причине не говорит.
 *
 * @param ability недостающая характеристика.
 * @returns текст подсказки.
 */
export function getHeavyWeaponHint(ability: AbilityKey): string {
  return `Тяжёлое оружие: атака с помехой, пока характеристика «${ABILITY_LABELS[ability]}» меньше ${HEAVY_WEAPON_ABILITY_MINIMUM}`;
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

  // Дополнительный урон катится вместе с основным одной формулой: у него свой
  // тип, но отдельного броска правила не требуют.
  const extraDamage = weapon.extraDamage;

  const extraNotation =
    extraDamage && extraDamage.diceCount > 0
      ? `${extraDamage.diceCount}${DICE_NOTATION_LETTER}${extraDamage.diceFaces}`
      : '';

  const diceFormula = extraNotation
    ? `${diceNotation}+${extraNotation}`
    : diceNotation;

  const totalBonus = damage.bonus + getAbilityModifier(character, ability);

  const sign = totalBonus < 0 ? '-' : '+';

  return {
    formula:
      totalBonus === 0
        ? diceFormula
        : `${diceFormula}${sign}${Math.abs(totalBonus)}`,
    diceNotation,
    weaponBonus: damage.bonus,
    ability,
    typeLabel: DAMAGE_TYPE_LABELS[damage.type] ?? '',
    extraNotation,
    extraTypeLabel: extraDamage
      ? (DAMAGE_TYPE_LABELS[extraDamage.type] ?? '')
      : '',
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

  // Дополнительный урон уходит в модалку своей группой костей (её нотация
  // разбирается в отдельную строку): игрок видит обе кости и может поправить
  // любую. Тип у него свой, поэтому в подписи типы перечисляются через плюс.
  const typeLabel = damage.extraTypeLabel
    ? [damage.typeLabel, damage.extraTypeLabel].filter(Boolean).join(' + ')
    : damage.typeLabel;

  return {
    diceNotation: damage.extraNotation
      ? `${damage.diceNotation}+${damage.extraNotation}`
      : damage.diceNotation,
    flatBonus: damage.weaponBonus,
    ability: damage.ability,
    // Модификатор характеристики входит в урон оружия ровно один раз.
    abilityModifierCount: 1,
    typeLabel,
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
    - getAbilityModifier(character, baseAbility)
    + getAbilityModifier(character, ability)
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
 * счётчики умений с восстановлением на продолжительном отдыхе.
 *
 * @param character персонаж.
 * @returns подписи восстанавливаемого; пустой список — восстанавливать нечего.
 */
export function getLongRestRecoveryLabels(character: Character): string[] {
  const resourceLabels = getResourceRecoveryLabels(
    character.classResources,
    'long-rest',
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
 * @param classUrl URL класса, которому принадлежит прирост.
 * @param die номинал кости хитов класса.
 * @param level уровень персонажа В ЭТОМ классе.
 * @param modifier модификатор Телосложения.
 * @param isFirstClass класс взят первым (максимум кости на первом уровне даёт
 *   только он; второй класс мультикласса получает среднее и на своём первом
 *   уровне — правило D&D 2024).
 * @returns прирост максимума хитов по уровням.
 */
export function getClassLevelHitPoints(
  classUrl: string,
  die: number,
  level: number,
  modifier: number,
  isFirstClass = true,
): CharacterLevelHitPoints[] {
  const levels = Math.max(0, Math.trunc(level));

  return Array.from({ length: levels }, (_, index) => ({
    level: index + 1,
    classUrl,
    amount:
      index === 0 && isFirstClass
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
  return getTotalLevelHitPoints(
    getClassLevelHitPoints('', die, level, modifier),
  );
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
 * Учёт хитов за взятые уровни: прирост дописывается записями, максимум и
 * текущие хиты растут на его сумму. Номер уровня в записи — общий уровень
 * персонажа после взятия, класс — чей это уровень.
 *
 * @param health здоровье персонажа.
 * @param previousLevel общий уровень до повышения.
 * @param gains прирост максимума хитов за каждый взятый уровень по порядку.
 * @returns новое здоровье персонажа.
 */
export function applyLevelHitPoints(
  health: CharacterHealth,
  previousLevel: number,
  gains: LevelUpHitPointsGain[],
): CharacterHealth {
  const addedGains = gains.map((gain, index) => ({
    level: previousLevel + index + 1,
    classUrl: gain.classUrl,
    amount: Math.max(0, Math.trunc(gain.amount)),
  }));

  const levelGains = [...health.levelGains, ...addedGains];

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
 * Записи прироста, которые заберёт снижение уровней классов: у каждого класса
 * снимаются последние по счёту записи — ровно столько, на сколько падает его
 * уровень. Номер уровня в записи — общий уровень персонажа, поэтому у
 * мультикласса отбор идёт по классу и порядку, а не по номеру.
 *
 * @param levelGains записи прироста максимума хитов.
 * @param removedByClass сколько уровней снимается у каждого класса.
 * @returns снимаемые записи прироста.
 */
function getRemovedLevelGains(
  levelGains: CharacterLevelHitPoints[],
  removedByClass: Record<string, number>,
): Set<CharacterLevelHitPoints> {
  const removed = new Set<CharacterLevelHitPoints>();

  for (const [classUrl, count] of Object.entries(removedByClass)) {
    if (count <= 0) {
      continue;
    }

    const classGains = levelGains.filter((gain) => gain.classUrl === classUrl);

    for (const gain of classGains.slice(-count)) {
      removed.add(gain);
    }
  }

  return removed;
}

/**
 * Сколько максимума хитов вернёт снижение уровней классов.
 *
 * @param health здоровье персонажа.
 * @param removedByClass сколько уровней снимается у каждого класса.
 * @returns прирост, записанный за снимаемые уровни.
 */
export function getLevelHitPointsLoss(
  health: CharacterHealth,
  removedByClass: Record<string, number>,
): number {
  return getTotalLevelHitPoints([
    ...getRemovedLevelGains(health.levelGains, removedByClass),
  ]);
}

/**
 * Снятие хитов за снимаемые уровни классов: максимум уменьшается на записанный
 * за них прирост, записи удаляются, текущие хиты обрезаются новым максимумом.
 * Уровни без записи максимум не двигают.
 *
 * @param health здоровье персонажа.
 * @param removedByClass сколько уровней снимается у каждого класса.
 * @returns новое здоровье персонажа.
 */
export function removeLevelHitPoints(
  health: CharacterHealth,
  removedByClass: Record<string, number>,
): CharacterHealth {
  const removed = getRemovedLevelGains(health.levelGains, removedByClass);

  if (!removed.size) {
    return health;
  }

  const levelGains = health.levelGains.filter((gain) => !removed.has(gain));

  const loss = getTotalLevelHitPoints([...removed]);

  const max = Math.max(0, health.max - loss);

  return {
    ...health,
    max,
    current: clamp(health.current, 0, max),
    levelGains,
  };
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
 * Что даёт уровень истощения по правилам 2024 года: каждый уровень снижает все
 * проверки к20 на 2 и все скорости на 5 футов, шестой уровень — смертельный.
 *
 * @param level уровень истощения (значения вне границ обрезаются).
 * @returns эффекты уровня истощения.
 */
export function getExhaustionEffects(
  level: number,
): CharacterExhaustionEffects {
  const currentLevel = clamp(
    Math.trunc(level),
    EXHAUSTION_LEVEL_MIN,
    EXHAUSTION_LEVEL_MAX,
  );

  return {
    level: currentLevel,
    d20Penalty: currentLevel * EXHAUSTION_D20_PENALTY_PER_LEVEL,
    speedPenalty: currentLevel * EXHAUSTION_SPEED_PENALTY_PER_LEVEL,
    isLethal: currentLevel === EXHAUSTION_LEVEL_MAX,
  };
}

/**
 * Строка эффектов уровня истощения для подписи блока и подсказок делений:
 * нулевой уровень — истощения нет, шестой — смерть, остальные — штраф к
 * проверкам к20 и снижение скорости. Снижение считается в единицах листа,
 * поэтому строка сходится с числами плитки скорости; дорожные мили и
 * километры истощение не трогает, и про скорость там не пишется.
 *
 * @param level уровень истощения.
 * @param unit единица измерения скоростей листа.
 * @returns описание эффектов уровня.
 */
export function getExhaustionSummary(level: number, unit: SpeedUnit): string {
  const effects = getExhaustionEffects(level);

  if (effects.level === EXHAUSTION_LEVEL_MIN) {
    return EXHAUSTION_LABELS.none;
  }

  if (effects.isLethal) {
    return EXHAUSTION_LABELS.death;
  }

  const d20Part = `−${effects.d20Penalty} ${EXHAUSTION_LABELS.d20Effect}`;

  const speedPenalty = effects.level * EXHAUSTION_SPEED_PENALTY_BY_UNIT[unit];

  if (speedPenalty === 0) {
    return d20Part;
  }

  return [
    d20Part,
    `${EXHAUSTION_LABELS.speedEffect} −${speedPenalty} ${SPEED_UNIT_SHORT_LABELS[unit]}`,
  ].join(', ');
}

/**
 * Штраф истощения к броскам к20 (PHB 2024): каждый уровень снимает 2 с проверок
 * характеристик и навыков, спасбросков, атак оружием и заклинаниями. Сложность
 * спасброска от заклинаний — не бросок к20, её истощение не трогает.
 *
 * @param character персонаж.
 * @returns штраф к броскам к20 (положительное число, его вычитают).
 */
export function getExhaustionD20Penalty(character: Character): number {
  return getExhaustionEffects(character.health.exhaustion).d20Penalty;
}

/**
 * Снижение каждой скорости истощением в единицах листа персонажа.
 *
 * @param character персонаж.
 * @returns снижение скорости (положительное число, его вычитают).
 */
export function getExhaustionSpeedPenalty(character: Character): number {
  return (
    getExhaustionEffects(character.health.exhaustion).level
    * EXHAUSTION_SPEED_PENALTY_BY_UNIT[character.speed.unit]
  );
}

/**
 * Скорости персонажа с учётом истощения — именно их показывает лист и печатает
 * PDF. Ниже нуля скорость не опускается, а нулевая так и остаётся нулевой:
 * ноль означает, что такой скорости у персонажа нет. Правка скоростей идёт по
 * записанным значениям (`character.speed`), а не по этим.
 *
 * @param character персонаж.
 * @returns скорости с применённым истощением.
 */
export function getEffectiveSpeed(character: Character): CharacterSpeed {
  const penalty = getExhaustionSpeedPenalty(character);

  // Прибавка «ко всем скоростям» идёт к каждому способу передвижения, которым
  // персонаж владеет (сапоги скорости), а адресная — только к своему (крылатые
  // сапоги). Нулевой скорости не прибавляет ни та, ни другая: ноль означает,
  // что такого передвижения у персонажа нет.
  const commonBonus = getInventoryBonusValue(character, 'all-speeds');

  const featSpeed = getFeatSpeedModifiers(
    character.features,
    character.speed.unit,
  );

  // Ходьба считается первой: от неё зависят скорости, которые черта приравняла
  // к ней.
  const walk = Math.max(0, character.speed.values.walk + featSpeed.walkBonus);

  // Черта выдаёт скорость с нуля (полёт тому, кто не летал), поэтому её вклад
  // идёт до отбора нулевых значений — в отличие от бонусов предметов, которые
  // ускоряют только то, чем персонаж уже владеет.
  const granted: Record<SpeedTypeKey, number> = {
    ...character.speed.values,
    walk,
    fly: getGrantedSpeed(character.speed.values.fly, featSpeed, 'fly', walk),
    climb: getGrantedSpeed(
      character.speed.values.climb,
      featSpeed,
      'climb',
      walk,
    ),
    swim: getGrantedSpeed(character.speed.values.swim, featSpeed, 'swim', walk),
  };

  const values = mapValues(granted, (value, key) => {
    if (value <= 0) {
      return value;
    }

    const bonus = commonBonus + getInventoryBonusValue(character, 'speed', key);

    return Math.max(0, value + bonus - penalty);
  });

  return { ...character.speed, values };
}

/**
 * Значение проверки характеристики: её модификатор со штрафом истощения. Сам
 * модификатор истощение не трогает — он идёт ещё и в КД, хиты и сложность
 * спасбросков от заклинаний, где штрафа к20 нет.
 *
 * @param character персонаж.
 * @param ability ключ характеристики.
 * @returns значение проверки характеристики.
 */
export function getAbilityCheckValue(
  character: Character,
  ability: AbilityKey,
): number {
  return (
    getAbilityModifier(character, ability)
    // Предмет может усиливать сами проверки, не трогая значение характеристики.
    + getInventoryBonusValue(character, 'ability-check', ability)
    - getExhaustionD20Penalty(character)
  );
}

/**
 * Правило восстановления ресурса для вида отдыха.
 *
 * @param resource ресурс класса.
 * @param rest вид отдыха.
 * @returns правило восстановления на этом отдыхе.
 */
export function getResourceRecoveryRule(
  resource: CharacterClassResource,
  rest: ResourceRecovery,
): ResourceRecoveryRule {
  return rest === 'short-rest' ? resource.shortRest : resource.longRest;
}

/**
 * Сколько зарядов вернёт правило восстановления: «все заряды» — до максимума,
 * «своё число» — заданное количество (выше максимума оно не поднимет).
 *
 * @param rule правило восстановления.
 * @param max максимум зарядов ресурса.
 * @returns число возвращаемых зарядов.
 */
export function getResourceRecoveryAmount(
  rule: ResourceRecoveryRule,
  max: number,
): number {
  if (rule.mode === 'none') {
    return 0;
  }

  return rule.mode === 'all' ? max : clamp(Math.trunc(rule.amount), 0, max);
}

/**
 * Подпись правила восстановления: «все заряды» либо число зарядов. Пустая
 * строка — отдых ресурс не возвращает.
 *
 * @param rule правило восстановления.
 * @returns подпись правила.
 */
export function getResourceRecoveryLabel(rule: ResourceRecoveryRule): string {
  if (rule.mode === 'none') {
    return '';
  }

  return rule.mode === 'all'
    ? RESOURCE_RECOVERY_ALL_LABEL
    : `${rule.amount} ${getPlural(rule.amount, RESOURCE_CHARGE_FORMS)}`;
}

/**
 * Независимая копия ресурса для формы: правила восстановления копируются
 * отдельно, иначе поля формы правили бы запись листа до сохранения.
 *
 * @param resource ресурс класса.
 * @returns копия ресурса без общих с исходником вложенных объектов.
 */
export function toClassResourceDraft(
  resource: CharacterClassResource,
): CharacterClassResource {
  return {
    ...resource,
    shortRest: { ...resource.shortRest },
    longRest: { ...resource.longRest },
  };
}

/**
 * Приведение правила восстановления к допустимым значениям: число зарядов —
 * целое не меньше минимума и не больше максимума ресурса.
 *
 * @param rule правило восстановления.
 * @param max максимум зарядов ресурса.
 * @returns правило с допустимым числом зарядов.
 */
export function normalizeResourceRecoveryRule(
  rule: ResourceRecoveryRule,
  max: number,
): ResourceRecoveryRule {
  return {
    mode: rule.mode,
    amount: clamp(
      Math.trunc(rule.amount),
      RESOURCE_RECOVERY_AMOUNT_MIN,
      Math.max(RESOURCE_RECOVERY_AMOUNT_MIN, max),
    ),
  };
}

/**
 * Пометки восстановления ресурса для строки панели: по одной на вид отдыха,
 * который возвращает заряды. Пустой список — ресурс отдыхом не восстанавливается.
 *
 * @param resource ресурс класса.
 * @returns пометки восстановления в порядке «короткий, продолжительный».
 */
export function getResourceRecoveryBadges(
  resource: CharacterClassResource,
): ClassResourceRecoveryBadge[] {
  return RESOURCE_RECOVERY_FIELDS.filter(
    (field) => resource[field.key].mode !== 'none',
  ).map((field) => {
    const rule = resource[field.key];

    return {
      rest: field.rest,
      icon: RESOURCE_RECOVERY_ICONS[field.rest],
      text:
        rule.mode === 'all'
          ? RESOURCE_RECOVERY_ALL_SHORT_LABEL
          : String(rule.amount),
      hint: `${RESOURCE_RECOVERY_LABELS[field.rest]}: ${getResourceRecoveryLabel(rule)}`,
    };
  });
}

/**
 * Восстановление ресурса одной строкой: виды отдыха, возвращающие заряды, с
 * количеством. Пустая строка — ресурс отдыхом не восстанавливается.
 *
 * @param resource ресурс класса.
 * @returns строка для подсказки и PDF.
 */
export function getResourceRecoverySummary(
  resource: CharacterClassResource,
): string {
  return getResourceRecoveryBadges(resource)
    .map((badge) => badge.hint)
    .join(' · ');
}

/**
 * Ресурсы класса после отдыха: каждому возвращается столько зарядов, сколько
 * задано его правилом для этого вида отдыха, но не выше максимума.
 *
 * @param resources ресурсы класса.
 * @param rest вид отдыха.
 * @returns ресурсы с обновлённым остатком зарядов.
 */
export function restoreClassResources(
  resources: CharacterClassResource[],
  rest: ResourceRecovery,
): CharacterClassResource[] {
  return resources.map((resource) => {
    const restored = getResourceRecoveryAmount(
      getResourceRecoveryRule(resource, rest),
      resource.max,
    );

    return {
      ...resource,
      current: clamp(resource.current + restored, 0, resource.max),
    };
  });
}

/**
 * Подписи ресурсов, которые вернёт отдых: название и сколько зарядов
 * возвращается. Ресурсы, которых этот отдых не касается, в список не входят.
 *
 * @param resources ресурсы класса.
 * @param rest вид отдыха.
 * @returns подписи вида «Ярость: все заряды».
 */
function getResourceRecoveryLabels(
  resources: CharacterClassResource[],
  rest: ResourceRecovery,
): string[] {
  return resources
    .map((resource) => ({
      name: resource.name,
      rule: getResourceRecoveryRule(resource, rest),
    }))
    .filter((recovery) => recovery.rule.mode !== 'none')
    .map(
      (recovery) =>
        `${recovery.name}: ${getResourceRecoveryLabel(recovery.rule)}`,
    );
}

/**
 * Что вернёт короткий отдых, кроме хитов: ресурсы класса с восстановлением на
 * коротком отдыхе и ячейки заклинаний договора колдуна.
 *
 * @param character персонаж.
 * @returns подписи восстанавливаемого; пустой список — восстанавливать нечего.
 */
export function getShortRestRecoveryLabels(character: Character): string[] {
  const resourceLabels = getResourceRecoveryLabels(
    character.classResources,
    'short-rest',
  );

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
 * значком (врождённые заклинания помечены сразу, пока подготовку с них не
 * сняли), круг — любой из отобранных.
 *
 * @param spell заклинание списка.
 * @param filter отбор вкладки заклинаний.
 * @returns true — заклинание остаётся в списке.
 */
export function matchesSpellFilter(
  spell: CharacterSpell,
  filter: SpellTabFilter,
): boolean {
  if (filter.preparedOnly && !spell.prepared) {
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
 * Возвращает заклинания, которые персонаж знает вне книги: врождённые
 * заклинания вида, уже открытые на текущем уровне, и заклинания, выдаваемые
 * чертами. Место среди подготовленных они не занимают — счётчик смотрит только
 * на книгу персонажа, — а подготовку игрок снимает и возвращает вручную,
 * поэтому запись без флага считается подготовленной.
 *
 * Одно и то же заклинание может прийти дважды (вид и черта, две черты): в
 * списке ему место одно, и остаётся первая запись — правки достаются ей.
 *
 * @param character персонаж листа.
 * @returns заклинания вне книги персонажа.
 */
export function getAvailableInnateSpells(
  character: Character,
): CharacterSpell[] {
  const granted = [
    ...(character.species?.innateSpells ?? [])
      .filter((innateSpell) => innateSpell.requiredLevel <= character.level)
      .map((innateSpell) => innateSpell.spell),
    ...getFeatureSpells(character.features),
  ];

  return uniqBy(granted, (spell) => spell.url).map((spell) => ({
    ...spell,
    prepared: isInnateSpellPrepared(spell),
  }));
}

/**
 * Заклинания, лежащие в записях особенностей персонажа.
 *
 * Происхождение записи не проверяется: заклинания кладёт себе только черта, но
 * если их начнёт выдавать классовое умение, список подхватит и его.
 *
 * @param features особенности персонажа.
 * @returns заклинания всех записей подряд.
 */
function getFeatureSpells(features: CharacterFeature[]): CharacterSpell[] {
  return features.flatMap((feature) => feature.spells ?? []);
}

/**
 * Ищет заклинание в записях особенностей: по нему правка выбирает, куда писать
 * — в вид или в запись черты.
 *
 * @param features особенности персонажа.
 * @param spellUrl URL заклинания.
 * @returns заклинание записи; undefined — записи с ним нет.
 */
export function findFeatureSpell(
  features: CharacterFeature[],
  spellUrl: string,
): CharacterSpell | undefined {
  return getFeatureSpells(features).find((spell) => spell.url === spellUrl);
}

/**
 * Выбрасывает заклинание из записей особенностей. Вернуть его можно, добавив
 * черту заново — как врождённое заклинание возвращается выбором вида.
 *
 * @param features особенности персонажа.
 * @param spellUrl URL заклинания.
 * @returns особенности без этого заклинания.
 */
export function removeFeatureSpell(
  features: CharacterFeature[],
  spellUrl: string,
): CharacterFeature[] {
  return features.map((feature) =>
    feature.spells
      ? {
          ...feature,
          spells: feature.spells.filter((spell) => spell.url !== spellUrl),
        }
      : feature,
  );
}

/**
 * Отмечает подготовку заклинания в записях особенностей.
 *
 * @param features особенности персонажа.
 * @param spellUrl URL заклинания.
 * @param prepared новое состояние подготовки.
 * @returns особенности с обновлённой пометкой.
 */
export function setFeatureSpellPrepared(
  features: CharacterFeature[],
  spellUrl: string,
  prepared: boolean,
): CharacterFeature[] {
  return features.map((feature) =>
    feature.spells
      ? {
          ...feature,
          spells: feature.spells.map((spell) =>
            spell.url === spellUrl ? { ...spell, prepared } : spell,
          ),
        }
      : feature,
  );
}

/**
 * Подготовлено ли врождённое заклинание: флага нет — подготовлено (лист мог
 * быть сохранён до появления пометки, да и новая запись приходит готовой).
 *
 * @param spell врождённое заклинание вида.
 * @returns true — заклинание подготовлено.
 */
export function isInnateSpellPrepared(spell: CharacterSpell): boolean {
  return spell.prepared !== false;
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
 * К какому счётчику подготовки относится заклинание книги: заговоры считаются
 * отдельно от заклинаний кругов — их число задаёт своя колонка таблицы класса.
 * Врождённые заклинания вида в книге персонажа не лежат, подготовка их не
 * касается.
 *
 * @param spell заклинание книги персонажа.
 * @returns вид подготовки заклинания.
 */
export function getSpellPreparedKind(spell: CharacterSpell): PreparedSpellKind {
  return spell.level === CANTRIP_SPELL_LEVEL ? 'cantrips' : 'spells';
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

  // Заданная игроком характеристика класса перекрывает карту по названию: у
  // своего класса названия в карте нет вовсе.
  return (
    characterClass.spellcastingAbility
    ?? CLASS_SPELLCASTING_ABILITIES[normalizeCatalogName(characterClass.name)]
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
 * Новые уровни классов с клампом и без превышения общего максимума: лишние
 * уровни срезаются у последних классов, чтобы сумма влезла в 20 (правило D&D).
 *
 * @param classes классы персонажа.
 * @param levels желаемые уровни по URL класса; класса без записи не трогает.
 * @returns уровни классов по URL.
 */
export function getClampedClassLevels(
  classes: CharacterClass[],
  levels: Record<string, number>,
): Record<string, number> {
  const result: Record<string, number> = {};

  let remaining = LEVEL_MAX;

  for (const characterClass of classes) {
    const requested = clamp(
      Math.trunc(levels[characterClass.url] ?? characterClass.level),
      LEVEL_MIN,
      LEVEL_MAX,
    );

    const level = clamp(requested, LEVEL_MIN, Math.max(LEVEL_MIN, remaining));

    result[characterClass.url] = level;
    remaining -= level;
  }

  return result;
}

/**
 * Уровень заклинателя мультикласса (правило D&D 2024): полные заклинатели дают
 * весь свой уровень, половинные (паладин, следопыт) — половину с округлением
 * ВВЕРХ, треть-заклинатели (мистический рыцарь, мистический ловкач) — треть с
 * округлением ВНИЗ. Округление разное не по недосмотру: таблицы прогрессии 2024
 * ложатся именно так (паладин 5 = заклинатель 3, ловкач 5 = заклинатель 1).
 * Колдун в счёт не идёт: его Магия договора существует отдельно от общих ячеек.
 *
 * Сверено с `spellcastingLevel` из `POST /api/v2/multiclass` по 170 сочетаниям
 * классов PHB.
 *
 * @param classes классы персонажа.
 * @returns уровень для таблицы ячеек мультикласса; 0 — ячеек нет.
 */
export function getMulticlassSpellcastingLevel(
  classes: CharacterClass[],
): number {
  return classes.reduce((total, characterClass) => {
    const casterType = getClassCasterType(characterClass);

    const level = Math.max(0, Math.trunc(characterClass.level));

    if (casterType === CasterType.FULL) {
      return total + level;
    }

    if (casterType === CasterType.HALF) {
      return total + Math.ceil(level / 2);
    }

    if (casterType === CasterType.THIRD) {
      return total + Math.floor(level / 3);
    }

    return total;
  }, 0);
}

/**
 * Суммарный уровень колдуна: по нему считаются ячейки договора. У мультикласса
 * они существуют отдельно от общих — и по количеству, и по отдыху.
 *
 * @param classes классы персонажа.
 * @returns уровень для таблиц договора; 0 — колдуна среди классов нет.
 */
export function getPactCasterLevel(classes: CharacterClass[]): number {
  return classes.reduce(
    (total, characterClass) =>
      getClassCasterType(characterClass) === CasterType.PACT
        ? total + Math.max(0, Math.trunc(characterClass.level))
        : total,
    0,
  );
}

/**
 * Ряды ячеек одного вида: максимум по таблице, трата берётся с листа и
 * обрезается по максимуму (уровень мог измениться после траты). Круги без ячеек
 * в результат не входят.
 *
 * @param maximums количество ячеек по кругам (индекс — круг минус 1).
 * @param kind вид ячеек: обычные либо договор колдуна.
 * @param spellSlots траты с листа.
 * @returns ряды ячеек по возрастанию круга.
 */
function toSpellSlotRows(
  maximums: number[],
  kind: SpellSlotKind,
  spellSlots: CharacterSpellSlot[],
): SpellSlotRow[] {
  // Ячейки договора колдуна возвращаются коротким отдыхом, обычные — только
  // продолжительным.
  const recovery: ResourceRecovery =
    kind === 'pact' ? 'short-rest' : 'long-rest';

  const usedByLevel = new Map(
    spellSlots
      .filter((slot) => slot.kind === kind)
      .map((slot) => [slot.level, slot.used]),
  );

  return maximums
    .map((max, index) => ({
      level: index + 1,
      max,
      used: clamp(usedByLevel.get(index + 1) ?? 0, 0, max),
      recovery,
      kind,
    }))
    .filter((row) => row.max > 0);
}

/**
 * Ряды ячеек заклинаний персонажа. Один класс считается по своей таблице
 * (у колдуна это сразу ячейки договора), мультикласс — по таблице
 * мультиклассового заклинателя, а уровни колдуна дают отдельные ряды договора
 * сверх неё (правило D&D 2024).
 *
 * @param character персонаж.
 * @returns ряды ячеек: сперва обычные по возрастанию круга, затем договор.
 */
export function getSpellSlotRows(character: Character): SpellSlotRow[] {
  const classes = getCharacterClasses(character);

  if (classes.length <= 1) {
    const casterType = getClassCasterType(classes[0] ?? null);

    if (!casterType) {
      return [];
    }

    // Единственный колдун — весь его запас и есть договор: считается по своей
    // таблице, а не по мультиклассовой.
    const kind: SpellSlotKind =
      casterType === CasterType.PACT ? 'pact' : 'standard';

    return toSpellSlotRows(
      getSpellSlotMaximums(casterType, character.level),
      kind,
      character.spellSlots,
    );
  }

  const standardRows = toSpellSlotRows(
    getSpellSlotMaximums(
      CasterType.MULTICLASS,
      getMulticlassSpellcastingLevel(classes),
    ),
    'standard',
    character.spellSlots,
  );

  const pactRows = toSpellSlotRows(
    getSpellSlotMaximums(CasterType.PACT, getPactCasterLevel(classes)),
    'pact',
    character.spellSlots,
  );

  return [...standardRows, ...pactRows];
}

/**
 * Кружки ячеек круга для разделителя списка заклинаний: закрашенные кружки —
 * потраченные ячейки, пустые — оставшиеся.
 *
 * @param row ряд ячеек круга.
 * @returns кружки по порядку с подписями для скринридера.
 */
export function getSpellSlotCircles(row: SpellSlotRow): SpellSlotCircle[] {
  const kindLabel = row.kind === 'pact' ? ` ${PACT_SPELL_SLOT_LABEL}` : '';

  return Array.from({ length: row.max }, (_slot, index) => {
    const used = index < row.used;

    return {
      index,
      used,
      label: `${getSpellLevelLabel(row.level)}, ячейка${kindLabel} ${index + 1}: ${
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

  const kindLabel = row.kind === 'pact' ? ` ${PACT_SPELL_SLOT_LABEL}` : '';

  return `Свободно ячеек${kindLabel}: ${free} из ${row.max} · ${RESOURCE_RECOVERY_LABELS[row.recovery]}`;
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
 * Колонка таблицы класса с числом заговоров («Заговоры», «Заг.»): сравниваются
 * только буквы названия. Колонка подготовленных заклинаний под неё не подходит —
 * её название начинается с «подг».
 *
 * @param column колонка таблицы прогрессии класса.
 * @returns колонка описывает число заговоров.
 */
function isCantripsColumn(column: ClassTableColumn): boolean {
  return column.name
    .toLowerCase()
    .replace(NON_LETTER_PATTERN, '')
    .startsWith(CANTRIPS_COLUMN_PREFIX);
}

/**
 * Прогрессия числа из колонки таблицы прогрессии. Нечисловые значения колонки
 * отбрасываются: справочник ставит в них прочерки и пометки.
 *
 * @param table таблица прогрессии класса и подкласса.
 * @param matchColumn отбор нужной колонки по её названию.
 * @returns записи «с уровня — столько» по возрастанию уровня.
 */
function deriveColumnScaling(
  table: ClassTableColumn[],
  matchColumn: (column: ClassTableColumn) => boolean,
): PreparedSpellsScaling[] {
  const column = table.find(matchColumn);

  if (!column) {
    return [];
  }

  return column.scaling
    .filter((entry) => INTEGER_VALUE_PATTERN.test(entry.value.trim()))
    .map((entry) => ({ level: entry.level, value: Number(entry.value) }))
    .sort((firstEntry, secondEntry) => firstEntry.level - secondEntry.level);
}

/**
 * Прогрессия числа подготовленных заклинаний из таблицы прогрессии. Таблицу
 * отдаёт справочник, поэтому лист запоминает её при выборе класса: колонка
 * бывает и у класса (заклинатели), и только у подкласса (мистический рыцарь).
 *
 * @param table таблица прогрессии класса и подкласса.
 * @returns записи «с уровня — столько заклинаний» по возрастанию уровня.
 */
export function derivePreparedSpellsScaling(
  table: ClassTableColumn[],
): PreparedSpellsScaling[] {
  return deriveColumnScaling(table, isPreparedSpellsColumn);
}

/**
 * Прогрессия числа заговоров из той же таблицы: заговоры подготавливаются
 * наравне с заклинаниями, но их число задаёт своя колонка.
 *
 * @param table таблица прогрессии класса и подкласса.
 * @returns записи «с уровня — столько заговоров» по возрастанию уровня.
 */
export function deriveCantripsScaling(
  table: ClassTableColumn[],
): PreparedSpellsScaling[] {
  return deriveColumnScaling(table, isCantripsColumn);
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
 * Разбор числа подготовленных заклинаний (или заговоров — у них свой счётчик и
 * своя колонка таблицы класса): сколько их даёт таблица класса на текущем
 * уровне, какой бонус к этому числу задан вручную и какое значение выходит
 * итогом. Своё число выключает подсчёт по классу целиком (бонус к нему не
 * прибавляется).
 *
 * @param character персонаж.
 * @param kind вид подготовки: заклинания книги либо заговоры.
 * @returns разбор для блока вкладки и модалки настройки.
 */
export function getPreparedSpellsBreakdown(
  character: Character,
  kind: PreparedSpellKind,
): PreparedSpellsBreakdown {
  const isCantrips = kind === 'cantrips';

  const { custom, bonus } = isCantrips
    ? character.spellcasting.preparedCantrips
    : character.spellcasting.prepared;

  // У мультикласса каждый класс готовит по своей таблице и своему уровню в нём,
  // поэтому числа складываются. Классы без колонки подготовки в сумму не входят
  // — иначе плитка показала бы число, которого таблицы не дают.
  const classValue = getCharacterClasses(character).reduce<number | null>(
    (total, characterClass) => {
      const value = getPreparedSpellsAtLevel(
        isCantrips
          ? characterClass.preparedCantrips
          : characterClass.preparedSpells,
        characterClass.level,
      );

      return value === null ? total : (total ?? 0) + value;
    },
    null,
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
      (spell) => spell.prepared && getSpellPreparedKind(spell) === kind,
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
 * Начало подсказки блока подготовленных: сколько отмечено и сколько держать
 * можно. Предел неизвестен — вместо числа прочерк.
 *
 * @param prepared разбор числа подготовленных.
 * @param kind вид подготовки: заклинания книги либо заговоры.
 * @returns строка вида «Подготовлено заклинаний: 4 из 17».
 */
export function getPreparedSpellsCountHint(
  prepared: PreparedSpellsBreakdown,
  kind: PreparedSpellKind,
): string {
  const limit =
    prepared.value === null
      ? PREPARED_SPELLS_EMPTY_VALUE
      : String(prepared.value);

  return `${PREPARED_KIND_LABELS[kind].countHint}: ${prepared.count} из ${limit}`;
}

/**
 * Подсказка плитки подготовки: сколько отмечено и откуда взялось число — из
 * таблицы класса (с бонусом, если он задан) либо указано вручную.
 *
 * @param prepared разбор числа подготовленных.
 * @param kind вид подготовки: заклинания книги либо заговоры.
 * @returns текст подсказки плитки шапки вкладки.
 */
export function getPreparedSpellsHint(
  prepared: PreparedSpellsBreakdown,
  kind: PreparedSpellKind,
): string {
  const { value, classValue, custom, bonus } = prepared;

  const countHint = getPreparedSpellsCountHint(prepared, kind);

  const { hints } = PREPARED_KIND_LABELS[kind];

  if (custom) {
    return `${countHint}. ${hints.custom}`;
  }

  if (classValue === null) {
    return `${countHint}. ${hints.unknown}`;
  }

  if (bonus === 0) {
    return `${countHint}. ${hints.auto}: ${classValue}`;
  }

  return `${countHint}. ${hints.auto}: ${classValue} ${getFormattedBonus(bonus)} = ${value}`;
}

/**
 * Описание предупреждения о достигнутом пределе подготовленных.
 *
 * @param limit сколько можно держать подготовленными.
 * @param kind вид подготовки: заклинания книги либо заговоры.
 * @returns текст тоста.
 */
export function getPreparedSpellsLimitDescription(
  limit: number,
  kind: PreparedSpellKind,
): string {
  const { statFull } = PREPARED_KIND_LABELS[kind];

  return `Подготовлено ${limit} из ${limit} — снимите подготовку с другой записи или измените число в блоке «${statFull}».`;
}

/**
 * Заклинательство каждого класса персонажа: по правилам 2024 у мультикласса
 * характеристика своя у каждого класса, поэтому Сл спасброска и бонус атаки
 * считаются порознь. Классы-незаклинатели в строки не попадают — им нечего
 * показывать; исключение — единственный класс листа: без строки блок
 * заклинательства исчез бы вовсе, а игрок мог захотеть задать характеристику
 * вручную.
 *
 * @param character персонаж.
 * @returns строки заклинательства по классам.
 */
export function getSpellcastingRows(
  character: Character,
): SpellcastingClassRow[] {
  const classes = getCharacterClasses(character);

  const proficiencyBonus = getCharacterProficiencyBonus(character);

  // Жезл боевого мага и прочая магия прибавляют к заклинательству, пока предмет
  // надет (и настроен, если он этого требует). Предмет один на персонажа,
  // поэтому его прибавка идёт каждому классу.
  const itemSaveDcBonus = getInventoryBonusValue(character, 'spell-save-dc');
  const itemAttackBonus = getInventoryBonusValue(character, 'spell-attack');

  const d20Penalty = getExhaustionD20Penalty(character);

  return classes
    .filter(
      (characterClass) =>
        classes.length === 1 || getClassCasterType(characterClass) !== null,
    )
    .map((characterClass) => {
      const ability = getClassSpellcastingAbility(characterClass);

      const abilityModifier = ability
        ? getAbilityModifier(character, ability)
        : 0;

      return {
        classUrl: characterClass.url,
        className: characterClass.name,
        ability,
        auto: characterClass.spellcastingAbility === null,
        abilityModifier,
        saveDc:
          SPELL_SAVE_DC_BASE
          + proficiencyBonus
          + abilityModifier
          + itemSaveDcBonus,
        // Сложность спасброска — не бросок к20, истощение её не трогает, а вот
        // атака заклинанием — бросок.
        attackBonus:
          proficiencyBonus + abilityModifier + itemAttackBonus - d20Penalty,
      };
    });
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
 * Числа верхнего уровня (`saveDc`, `attackBonus`) — у первого класса-заклинателя:
 * ими пользуются PDF и подсказки, где строка одна. Полный разбор мультикласса —
 * в `rows`.
 *
 * @param character персонаж.
 * @returns разбор заклинательства для вкладки и модалки настройки.
 */
export function getSpellcastingBreakdown(
  character: Character,
): SpellcastingBreakdown {
  const rows = getSpellcastingRows(character);

  const proficiencyBonus = getCharacterProficiencyBonus(character);

  const [primaryRow] = rows;

  return {
    ability: primaryRow?.ability ?? null,
    auto: primaryRow?.auto ?? true,
    abilityModifier: primaryRow?.abilityModifier ?? 0,
    proficiencyBonus,
    saveDc:
      primaryRow?.saveDc
      ?? SPELL_SAVE_DC_BASE
        + proficiencyBonus
        + getInventoryBonusValue(character, 'spell-save-dc'),
    attackBonus:
      primaryRow?.attackBonus
      ?? proficiencyBonus
        + getInventoryBonusValue(character, 'spell-attack')
        - getExhaustionD20Penalty(character),
    rows,
    prepared: getPreparedSpellsBreakdown(character, 'spells'),
    preparedCantrips: getPreparedSpellsBreakdown(character, 'cantrips'),
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
 * Особенности, разложенные по источникам: сперва вид с подвидом, затем класс,
 * черты и свои записи — тем же порядком, что и чипы отбора. Внутри источника
 * порядок листа сохранён, поэтому умения класса так и идут по уровням.
 *
 * @param features особенности персонажа.
 * @returns особенности в порядке групп источников.
 */
export function sortFeaturesByOriginGroup(
  features: CharacterFeature[],
): CharacterFeature[] {
  return [...features].sort(
    (left, right) =>
      FEATURE_ORIGIN_GROUP_ORDER.indexOf(getFeatureOriginGroup(left.origin))
      - FEATURE_ORIGIN_GROUP_ORDER.indexOf(getFeatureOriginGroup(right.origin)),
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
 * Начало идентификаторов классовых умений одного класса. Ключи умений в
 * справочнике НЕ уникальны между классами (`ispolzovanie-zaklinanij` есть и у
 * паладина, и у волшебника), поэтому в мультиклассе они разнесены по url класса.
 *
 * @param classUrl URL класса.
 * @returns префикс идентификаторов умений класса.
 */
export function getClassFeatureIdPrefix(classUrl: string): string {
  return `${CLASS_FEATURE_ID_PREFIX}${classUrl}:`;
}

/**
 * Идентификатор классового умения.
 *
 * @param classUrl URL класса, который даёт умение.
 * @param featureKey ключ умения из справочника.
 * @returns устойчивый идентификатор умения на листе.
 */
export function getClassFeatureId(
  classUrl: string,
  featureKey: string,
): string {
  return `${getClassFeatureIdPrefix(classUrl)}${featureKey}`;
}

/**
 * Начало идентификаторов производных ресурсов одного класса. Названия колонок
 * таблиц тоже повторяются между классами («Подг. закл.»), поэтому и они
 * разнесены по url класса.
 *
 * @param classUrl URL класса.
 * @returns префикс идентификаторов ресурсов класса.
 */
export function getClassResourceIdPrefix(classUrl: string): string {
  return `${CLASS_RESOURCE_ID_PREFIX}${classUrl}:`;
}

/**
 * Идентификатор производного ресурса класса.
 *
 * @param classUrl URL класса.
 * @param columnName название колонки таблицы прогрессии.
 * @returns устойчивый идентификатор ресурса на листе.
 */
export function getClassResourceId(
  classUrl: string,
  columnName: string,
): string {
  return `${getClassResourceIdPrefix(classUrl)}${columnName}`;
}

/**
 * Классы персонажа по порядку: основной, затем дополнительные. Мультиклассовые
 * подсчёты (уровень, ячейки, кости хитов) ходят только через эту функцию, чтобы
 * не разбираться с «основной плюс остальные» на каждом месте.
 *
 * @param character персонаж.
 * @returns классы персонажа; пусто — класс не выбран.
 */
export function getCharacterClasses(character: Character): CharacterClass[] {
  return character.characterClass
    ? [character.characterClass, ...character.additionalClasses]
    : [...character.additionalClasses];
}

/**
 * Общий уровень персонажа — сумма уровней его классов (правило D&D).
 *
 * @param classes классы персонажа.
 * @returns общий уровень в границах правил.
 */
export function getTotalClassLevel(classes: CharacterClass[]): number {
  const total = classes.reduce(
    (sum, characterClass) =>
      sum + Math.max(0, Math.trunc(characterClass.level)),
    0,
  );

  return clamp(total, LEVEL_MIN, LEVEL_MAX);
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
 * Механика черты кладётся в запись снимком: прибавка «Крепкого» к максимуму
 * хитов зависит от уровня взятия, поэтому лист обязан помнить и её, и сам
 * уровень — за механикой в справочник он больше не ходит.
 *
 * Выбранная игроком компетентность попадает в тот же снимок: журнал выдач
 * пересобирается из него, и без этого выбор терялся бы при ближайшей сверке.
 *
 * @param summary деталь черты.
 * @param options параметры взятия черты.
 * @param options.repeatable черту можно брать несколько раз (уникальный id).
 * @param options.level уровень взятия черты; null — уровень неизвестен.
 * @param options.expertiseSkills навыки, в которых игрок выбрал компетентность.
 * @param options.choiceAnswers ответы игрока на выборы черты по ключу выбора.
 * @param options.spells заклинания, выбранные игроком при взятии черты.
 * @returns особенность персонажа с происхождением «Черта».
 */
export function buildFeatFeature(
  summary: FeatSummary,
  options: {
    repeatable?: boolean;
    level?: number | null;
    expertiseSkills?: string[];
    choiceAnswers?: Record<string, string[]>;
    spells?: CharacterSpell[];
  } = {},
): CharacterFeature {
  const {
    repeatable = false,
    level = null,
    expertiseSkills = [],
    choiceAnswers = {},
    spells = [],
  } = options;

  // Выбранные игроком заклинания лежат там же, где выдаваемые чертой: и те, и
  // другие персонаж знает вне книги заклинаний.
  const featureSpells = [...(summary.spells ?? []), ...spells];

  const baseId = getCharacterFeatureId('feat', summary.url);

  return {
    id: repeatable ? `${baseId}:${crypto.randomUUID()}` : baseId,
    name: summary.name,
    description: [...summary.description],
    origin: 'feat',
    originName: summary.category,
    level,
    choice: null,
    modifiers: summary.modifiers,
    proficiencies: withChosenExpertise(summary.proficiencies, expertiseSkills),
    // Копия списка: подготовку игрок снимает прямо в записи, и делить её с
    // деталью справочника, из которой собрана черта, нельзя.
    spells: featureSpells.length ? featureSpells : null,
    // Пустой набор не пишется: у черты без выборов запись остаётся такой же,
    // какой была до их появления.
    choiceAnswers: Object.keys(choiceAnswers).length
      ? choiceAnswers
      : undefined,
  };
}

/**
 * Снимок владений черты с выбранной игроком компетентностью. Черта могла не
 * выдавать ничего сама — тогда снимок заводится ради одного выбора.
 *
 * @param granted выданные чертой владения; null — черта их не выдаёт.
 * @param expertiseSkills навыки, в которых игрок выбрал компетентность.
 * @returns снимок владений записи умения; null — записывать нечего.
 */
function withChosenExpertise(
  granted: GrantedProficiencies | null,
  expertiseSkills: string[],
): GrantedProficiencies | null {
  if (!expertiseSkills.length) {
    return granted;
  }

  const base: GrantedProficiencies = granted ?? {
    armor: [],
    weapons: [],
    tools: [],
    languages: [],
    skills: [],
    expertiseSkills: [],
  };

  return {
    ...base,
    expertiseSkills: union(base.expertiseSkills, expertiseSkills),
  };
}

/**
 * Владения всех выдач одним набором: по нему считается, что на листе держится
 * выдачами, а что отмечено игроком вручную.
 *
 * @param grants записи журнала выдач.
 * @returns объединение выданного по группам; инструменты — по названиям.
 */
function collectGrantedProficiencies(grants: ProficiencyGrant[]): {
  armor: Set<string>;
  weapons: Set<string>;
  tools: Set<string>;
  languages: Set<string>;
} {
  return {
    armor: new Set(grants.flatMap((grant) => grant.armor)),
    weapons: new Set(grants.flatMap((grant) => grant.weapons)),
    // Инструменты сверяются по названию: ссылка на предмет у одной и той же
    // записи бывает и заполненной, и пустой (свой инструмент игрока).
    tools: new Set(
      grants.flatMap((grant) => grant.tools.map(({ name }) => name)),
    ),
    languages: new Set(grants.flatMap((grant) => grant.languages)),
  };
}

/**
 * Приведение владений листа к новому журналу выдач.
 *
 * Применяется РАЗНИЦА журналов, а не всё выданное: добавляется то, что выдачей
 * стало, снимается то, чем быть перестало, а к остальному лист не притрагивается.
 * Иначе сверка доливала бы всё выданное на каждом шаге и возвращала владение,
 * которое игрок снял в панели, — а он снял его сознательно.
 *
 * Отмеченное игроком вручную не трогается: его в журнале нет. Обратная сторона —
 * владение, которое игрок отметил сам, а потом ровно то же выдал класс или
 * черта, уйдёт вместе с ними: различить эти два случая по одному списку нельзя.
 * Ровно тот же размен уже сделан у выданного снаряжения
 * ({@link applyStartingEquipmentChange}).
 *
 * @param proficiencies владения персонажа.
 * @param previous журнал выдач до изменения.
 * @param next журнал выдач после изменения.
 * @returns владения, согласованные с новым журналом.
 */
export function applyProficiencyGrants(
  proficiencies: CharacterProficiencies,
  previous: ProficiencyGrant[],
  next: ProficiencyGrant[],
): CharacterProficiencies {
  const before = collectGrantedProficiencies(previous);
  const after = collectGrantedProficiencies(next);

  return {
    ...proficiencies,
    armor: applyGrantedNames(proficiencies.armor, before.armor, after.armor),
    weapons: applyGrantedNames(
      proficiencies.weapons,
      before.weapons,
      after.weapons,
    ),
    tools: unionToolProficiencies(
      proficiencies.tools.filter(
        (tool) => !isRevoked(tool.name, before.tools, after.tools),
      ),
      next
        .flatMap((grant) => grant.tools)
        .filter((tool) => !before.tools.has(tool.name)),
    ),
    languages: applyGrantedNames(
      proficiencies.languages,
      before.languages,
      after.languages,
    ),
  };
}

/**
 * Список владений после смены журнала: снимается то, что выдачей быть
 * перестало, добавляется то, что выдачей стало.
 *
 * @param items владения группы.
 * @param before выданное до изменения.
 * @param after выданное после изменения.
 * @returns владения группы после сверки.
 */
function applyGrantedNames(
  items: string[],
  before: Set<string>,
  after: Set<string>,
): string[] {
  const kept = items.filter((item) => !isRevoked(item, before, after));

  const added = [...after].filter((item) => !before.has(item));

  return union(kept, added);
}

/**
 * Перестал ли источник выдавать это владение: было в журнале, а в новом его
 * нет. Только такое снимается с листа.
 *
 * @param key название владения (у инструментов — их название).
 * @param before выданное до изменения.
 * @param after выданное после изменения.
 * @returns true — владение снимается.
 */
function isRevoked(
  key: string,
  before: Set<string>,
  after: Set<string>,
): boolean {
  return before.has(key) && !after.has(key);
}

/**
 * Приведение навыков к новому журналу выдач.
 *
 * Навык — не строка в списке владений, а запись со своим уровнем, поэтому
 * правило своё. Как и у владений, применяется РАЗНИЦА журналов: уровень трогают
 * только навыки, ставшие выдачей или переставшие ею быть. Навык, который
 * источник давал и раньше, не трогается вовсе — иначе сверка поднимала бы
 * обратно то, что игрок сознательно сбросил.
 *
 * Ставший выдачей навык поднимается до владения, но только с «нет владения»:
 * половину владения и компетентность источник не трогает — они выше и получены
 * иначе. Ровно так же ведёт себя {@link applySkillProficiencies}.
 *
 * Переставший быть выдачей возвращается на уровень ниже — ровно на тот, с
 * которого источник его поднял: владение уходит в «нет владения»,
 * компетентность возвращается во владение. И только если уровень в точности
 * тот, что источник и дал: поднятое игроком поверх выдачи снятие не отбирает.
 *
 * @param skills навыки персонажа.
 * @param previous журнал выдач до изменения.
 * @param next журнал выдач после изменения.
 * @returns навыки с уровнями, согласованными с журналом.
 */
function applyGrantedSkills(
  skills: CharacterSkill[],
  previous: ProficiencyGrant[],
  next: ProficiencyGrant[],
): CharacterSkill[] {
  const before = new Set(previous.flatMap((grant) => grant.skills));
  const after = new Set(next.flatMap((grant) => grant.skills));

  const expertiseBefore = new Set(
    previous.flatMap((grant) => grant.expertiseSkills),
  );

  const expertiseAfter = new Set(
    next.flatMap((grant) => grant.expertiseSkills),
  );

  return skills.map((skill): CharacterSkill => {
    // Компетентность идёт первой: она выше владения, и черта, выдавшая оба
    // разом, должна оставить навык на верхнем уровне.
    if (expertiseAfter.has(skill.name) && !expertiseBefore.has(skill.name)) {
      return skill.proficiency === 'expertise'
        ? skill
        : { ...skill, proficiency: 'expertise' };
    }

    if (
      isRevoked(skill.name, expertiseBefore, expertiseAfter)
      && skill.proficiency === 'expertise'
    ) {
      return { ...skill, proficiency: 'proficient' };
    }

    if (after.has(skill.name) && !before.has(skill.name)) {
      return skill.proficiency === 'none'
        ? { ...skill, proficiency: 'proficient' }
        : skill;
    }

    if (
      isRevoked(skill.name, before, after)
      && skill.proficiency === 'proficient'
    ) {
      return { ...skill, proficiency: 'none' };
    }

    return skill;
  });
}

/**
 * Идентификатор источника выдачи для журнала владений.
 *
 * @param kind вид источника.
 * @param key url класса, предыстории или вида либо идентификатор записи умения.
 * @returns идентификатор источника.
 */
export function getProficiencySourceId(
  kind: keyof typeof PROFICIENCY_SOURCE_PREFIXES,
  key: string,
): string {
  return `${PROFICIENCY_SOURCE_PREFIXES[kind]}${key}`;
}

/**
 * Журнал выдач с обновлённой записью источника: прежняя запись заменяется, а
 * пустая выдача (источник ушёл или ничего не даёт) запись убирает.
 *
 * @param grants журнал выдач листа.
 * @param source идентификатор источника.
 * @param granted выданные владения; null — источник ничего не выдаёт.
 * @returns новый журнал выдач.
 */
export function withProficiencyGrant(
  grants: ProficiencyGrant[],
  source: string,
  granted: GrantedProficiencies | null,
): ProficiencyGrant[] {
  const others = grants.filter((grant) => grant.source !== source);

  if (!granted || !hasGrantedProficiencies(granted)) {
    return others;
  }

  return [...others, { ...granted, source }];
}

/**
 * Есть ли в наборе хоть одно владение: пустые записи в журнал не попадают —
 * снимать по ним нечего.
 *
 * @param granted набор выданных владений.
 * @returns true — набор не пуст.
 */
function hasGrantedProficiencies(granted: GrantedProficiencies): boolean {
  return Boolean(
    granted.armor.length
    || granted.weapons.length
    || granted.tools.length
    || granted.languages.length
    || granted.skills.length
    || granted.expertiseSkills.length,
  );
}

/**
 * Постоянные модификаторы листа от черт: записи без снимка механики (умения
 * вида и класса, ручные записи, черты, добавленные до её появления) выпадают.
 *
 * @param features особенности листа.
 * @returns модификаторы черт в порядке записей.
 */
function getFeatureModifiers(
  features: CharacterFeature[],
): CharacterFeatureModifiers[] {
  return features.flatMap((feature) =>
    feature.modifiers ? [feature.modifiers] : [],
  );
}

/**
 * Прибавка к максимуму хитов от одной черты:
 * `flat + perAcquisitionLevel × уровень взятия +
 * perLevelAfterAcquisition × (текущий уровень − уровень взятия)`.
 *
 * Уровень взятия у черты за классовое улучшение характеристик — уровень В
 * КЛАССЕ (`useLevelUpWizard` записывает его вместе с давшим черту умением), а у
 * взятой вручную — общий уровень персонажа. У мультикласса это разные числа, но
 * ни одна размеченная черта разницы не замечает: у «Крепкого»
 * `perAcquisitionLevel` и `perLevelAfterAcquisition` равны, а значит прибавка
 * сводится к `2 × текущий уровень` при любом уровне взятия. Появится черта, где
 * они различаются, — уровень взятия придётся хранить общим, а не классовым.
 *
 * @param feature особенность листа.
 * @param level текущий общий уровень персонажа.
 * @returns прибавка к максимуму хитов от этой черты.
 */
function getFeatureHitPointsBonus(
  feature: CharacterFeature,
  level: number,
): number {
  const hitPoints = feature.modifiers?.hitPoints;

  if (!hitPoints) {
    return 0;
  }

  // Уровень взятия не записан (лист собран до его учёта) — считаем черту
  // взятой сейчас: слагаемое «за уровни после взятия» тогда обнуляется.
  //
  // Выше текущего уровня взятие не поднимается: снятые уровни забирают черты за
  // классовое улучшение характеристик, но не взятую вручную, и без этого предела
  // «Крепкий», взятый на 12 уровне, держал бы +24 и на третьем.
  const acquisitionLevel = Math.min(feature.level ?? level, level);

  const levelsAfter = level - acquisitionLevel;

  return (
    (hitPoints.flat ?? 0)
    + (hitPoints.perAcquisitionLevel ?? 0) * acquisitionLevel
    + (hitPoints.perLevelAfterAcquisition ?? 0) * levelsAfter
  );
}

/**
 * Прибавка к максимуму хитов от всех черт листа. Слагаемое к сумме
 * `health.levelGains`: конвейер своих бонусов (`customBonus`) сюда не годится —
 * он покрывает только броски к20.
 *
 * @param features особенности листа.
 * @param level текущий общий уровень персонажа.
 * @returns суммарная прибавка к максимуму хитов от черт.
 */
function getFeatHitPointsBonus(
  features: CharacterFeature[],
  level: number,
): number {
  return features.reduce(
    (total, feature) => total + getFeatureHitPointsBonus(feature, level),
    0,
  );
}

/**
 * Доведение здоровья до нового вклада черт: максимум и текущие хиты двигаются
 * на разницу между прежней и новой прибавкой. Вызывается всюду, где меняются
 * черты или уровень, — иначе прибавка «Крепкого» либо потерялась бы при
 * пересчёте уровней, либо начислилась дважды.
 *
 * Незаполненное здоровье (нулевой максимум) не трогается — как и в
 * {@link adjustHealthForConstitution}: прибавлять не к чему.
 *
 * @param health здоровье персонажа.
 * @param previous особенности и уровень до изменения.
 * @param next особенности и уровень после изменения.
 * @returns новое здоровье персонажа.
 */
function applyFeatHitPoints(
  health: CharacterHealth,
  previous: Pick<Character, 'features' | 'level'>,
  next: Pick<Character, 'features' | 'level'>,
): CharacterHealth {
  const delta =
    getFeatHitPointsBonus(next.features, next.level)
    - getFeatHitPointsBonus(previous.features, previous.level);

  if (delta === 0 || health.max <= 0) {
    return health;
  }

  const max = Math.max(0, health.max + delta);

  return { ...health, max, current: clamp(health.current + delta, 0, max) };
}

/**
 * Постоянная прибавка к КД от черт листа.
 *
 * @param features особенности листа.
 * @returns суммарная прибавка к классу доспеха.
 */
function getFeatArmorClassBonus(features: CharacterFeature[]): number {
  return getFeatureModifiers(features).reduce(
    (total, modifiers) => total + (modifiers.armorClassBonus ?? 0),
    0,
  );
}

/**
 * Изменение скоростей чертами, приведённое к единицам листа.
 *
 * Ходьбе черты прибавляют, и прибавки складываются: «Подвижный» (+10) и «Метка
 * пути» (+5) дают +15. Полёт, лазание и плавание черта задаёт числом — это само
 * значение скорости, а не прибавка, поэтому у нескольких черт в зачёт идёт
 * большее. Флаги «равна скорости ходьбы» собираются отдельно: их применяет
 * {@link getGrantedSpeed} уже по посчитанной ходьбе.
 *
 * @param features особенности листа.
 * @param unit единица измерения скоростей листа.
 * @returns изменение скоростей чертами в единицах листа.
 */
function getFeatSpeedModifiers(
  features: CharacterFeature[],
  unit: SpeedUnit,
): FeatSpeedModifiers {
  let walkBonusInFeet = 0;

  const grantedInFeet: Record<FeatGrantedSpeedKey, number> = {
    fly: 0,
    climb: 0,
    swim: 0,
  };

  const equalsWalk: Record<FeatGrantedSpeedKey, boolean> = {
    fly: false,
    climb: false,
    swim: false,
  };

  for (const modifiers of getFeatureModifiers(features)) {
    const { speed } = modifiers;

    if (!speed) {
      continue;
    }

    walkBonusInFeet += speed.walkBonus ?? 0;

    grantedInFeet.fly = Math.max(grantedInFeet.fly, speed.fly ?? 0);
    grantedInFeet.climb = Math.max(grantedInFeet.climb, speed.climb ?? 0);
    grantedInFeet.swim = Math.max(grantedInFeet.swim, speed.swim ?? 0);

    equalsWalk.fly ||= speed.flyEqualsWalk ?? false;
    equalsWalk.climb ||= speed.climbEqualsWalk ?? false;
    equalsWalk.swim ||= speed.swimEqualsWalk ?? false;
  }

  // Складываем в футах и переводим один раз на итог способа передвижения:
  // 0.3 — двоичная дробь, и перевод каждой прибавки порознь дал бы в подписи
  // плитки хвост вида 0.8999999999999999.
  const ratio = SPEED_FEET_RATIO_BY_UNIT[unit];

  return {
    walkBonus: round(walkBonusInFeet * ratio, SPEED_UNIT_FRACTION_DIGITS),
    granted: mapValues(grantedInFeet, (feet) =>
      round(feet * ratio, SPEED_UNIT_FRACTION_DIGITS),
    ),
    equalsWalk,
  };
}

/**
 * Скорость полёта, лазания или плавания с учётом черт. Три источника — своя
 * скорость персонажа, выданная чертой и равенство скорости ходьбы — друг с
 * другом не спорят: в зачёт идёт большее. Иначе черта, дающая полёт «как
 * скорость ходьбы», урезала бы уже имеющиеся крылья.
 *
 * @param value записанная скорость персонажа.
 * @param featSpeed изменение скоростей чертами листа.
 * @param key способ передвижения.
 * @param walk итоговая скорость ходьбы.
 * @returns скорость с учётом черт.
 */
function getGrantedSpeed(
  value: number,
  featSpeed: FeatSpeedModifiers,
  key: FeatGrantedSpeedKey,
  walk: number,
): number {
  return Math.max(
    value,
    featSpeed.granted[key],
    featSpeed.equalsWalk[key] ? walk : 0,
  );
}

/**
 * Заведён ли свой бонус чертой листа. Такие записи пересобирает сверка
 * (`withFeatModifiers`), поэтому править и удалять их вручную нечего: правка
 * вернулась бы назад при ближайшей смене черт — форма их и не даёт трогать.
 *
 * @param bonus свой бонус листа.
 * @returns true — запись завела черта.
 */
export function isFeatCustomBonus(bonus: CharacterCustomBonus): boolean {
  return bonus.id.startsWith(FEAT_CUSTOM_BONUS_ID_PREFIX);
}

/**
 * Свои бонусы инициативы, заведённые чертами листа: по записи на каждую черту с
 * флагом `initiativeProficiencyBonus` («Бдительный»). Сверка идемпотентна —
 * заведённые чертами записи пересобираются целиком, а добавленные игроком
 * вручную остаются нетронутыми. Вызывается всюду, где меняется список черт.
 *
 * @param bonuses свои бонусы инициативы из настроек листа.
 * @param features особенности листа.
 * @returns свои бонусы инициативы, согласованные с чертами.
 */
function withFeatInitiativeBonuses(
  bonuses: CharacterCustomBonus[],
  features: CharacterFeature[],
): CharacterCustomBonus[] {
  const manual = bonuses.filter((bonus) => !isFeatCustomBonus(bonus));

  const fromFeats = features
    .filter((feature) => feature.modifiers?.initiativeProficiencyBonus)
    .map<CharacterCustomBonus>((feature) => ({
      id: `${FEAT_CUSTOM_BONUS_ID_PREFIX}${feature.id}`,
      kind: 'proficiency',
      // Запись хранит оба источника разом, поэтому характеристика нужна и
      // бонусу мастерства: в счёт она не идёт и ждёт, если игрок переключит
      // источник вручную. Берётся заготовка новой записи — как у кнопки
      // «Добавить бонус».
      ability: NEW_CUSTOM_BONUS.ability,
      value: 0,
      // Пометка источника — название черты: в разборе инициативы игрок должен
      // видеть, откуда взялся бонус мастерства, а не безымянную строку.
      label: feature.name,
    }));

  return [...manual, ...fromFeats];
}

/**
 * Записи журнала выдач от черт листа: по записи на каждую черту со снимком
 * владений. Записи прочих источников (класс, предыстория, вид) не трогаются.
 *
 * Журнал — слепок источников: запись пересобирается из снимка на записи умения.
 * Это безопасно ровно потому, что сверка применяет разницу журналов, а не всё
 * выданное: у черты, которая была на листе и осталась, запись до и после
 * одинакова, и ни владений, ни уровней навыков такая сверка не трогает.
 *
 * @param grants журнал выдач листа.
 * @param features особенности листа.
 * @returns журнал, согласованный с чертами.
 */
function withFeatProficiencyGrants(
  grants: ProficiencyGrant[],
  features: CharacterFeature[],
): ProficiencyGrant[] {
  const others = grants.filter(
    (grant) => !grant.source.startsWith(PROFICIENCY_SOURCE_PREFIXES.feature),
  );

  const fromFeatures = features.flatMap<ProficiencyGrant>((feature) =>
    feature.proficiencies
      ? [
          {
            ...feature.proficiencies,
            source: getProficiencySourceId('feature', feature.id),
          },
        ]
      : [],
  );

  return [...others, ...fromFeatures];
}

/**
 * Доведение листа до нового набора черт и уровня.
 *
 * Постоянные модификаторы черт лист хранит по-разному, и сверка нужна не всем.
 * КД и скорости считаются на лету — там слагаемое от черт появляется само.
 * Максимум хитов, наоборот, хранится числом и правится игроком вручную, поэтому
 * его прибавка ведётся разницей: иначе пересчёт уровней или смена класса затёрли
 * бы её, а повторное применение начислило бы дважды. Свои бонусы инициативы и
 * записи журнала выдач пересобираются целиком — эти части сверки идемпотентны.
 *
 * Вызывать нужно везде, где меняется список особенностей или уровень.
 *
 * @param next лист после изменения.
 * @param previous особенности и уровень до изменения.
 * @returns лист с согласованной прибавкой черт.
 */
export function withFeatModifiers(
  next: Character,
  previous: Pick<Character, 'features' | 'level'>,
): Character {
  const proficiencyGrants = withFeatProficiencyGrants(
    next.proficiencyGrants,
    next.features,
  );

  return {
    ...next,
    health: applyFeatHitPoints(next.health, previous, next),
    settings: {
      ...next.settings,
      customInitiativeBonuses: withFeatInitiativeBonuses(
        next.settings.customInitiativeBonuses,
        next.features,
      ),
    },
    proficiencyGrants,
    // Прежний журнал ещё лежит в `next`: черты уже сменились, а записи — нет,
    // поэтому он и служит состоянием «до».
    proficiencies: applyProficiencyGrants(
      next.proficiencies,
      next.proficiencyGrants,
      proficiencyGrants,
    ),
    skills: applyGrantedSkills(
      next.skills,
      next.proficiencyGrants,
      proficiencyGrants,
    ),
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
 * Требования к характеристикам для взятия уровня в классе (правило D&D 2024):
 * значение 13 в каждой из ключевых характеристик класса. Список берётся из
 * прозы `primaryCharacteristics` справочника — так же его выводит бэкенд для
 * инструмента мультикласса.
 *
 * @param character персонаж.
 * @param primaryCharacteristics проза ключевых характеристик класса.
 * @returns характеристики, которых персонажу не хватает; пусто — требования
 *   выполнены либо класс их не называет.
 */
export function getUnmetMulticlassRequirements(
  character: Character,
  primaryCharacteristics: string,
): AbilityKey[] {
  return parseAbilityKeys(primaryCharacteristics).filter(
    (ability) =>
      getEffectiveAbilityScore(character, ability)
      < MULTICLASS_ABILITY_REQUIREMENT,
  );
}

/**
 * Подсказка о невыполненных требованиях мультиклассирования.
 *
 * @param abilities характеристики, которых не хватает.
 * @returns текст предупреждения; пустая строка — требования выполнены.
 */
export function getMulticlassRequirementWarning(
  abilities: AbilityKey[],
): string {
  if (!abilities.length) {
    return '';
  }

  const list = abilities
    .map(
      (ability) =>
        `${ABILITY_LABELS[ability]} ${MULTICLASS_ABILITY_REQUIREMENT}`,
    )
    .join(', ');

  return `${MULTICLASS_REQUIREMENT_WARNING_PREFIX} ${list}.`;
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
 * @param classUrl URL класса — названия колонок повторяются между классами.
 * @param table таблица прогрессии класса.
 * @param level уровень персонажа В ЭТОМ классе.
 * @returns ресурсы класса с устойчивыми идентификаторами.
 */
export function deriveClassResources(
  classUrl: string,
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

    // Таблица класса знает только вид отдыха, поэтому ресурс возвращается
    // целиком: точные порции игрок задаёт в настройке ресурсов сам.
    const shortRestMode: ResourceRecoveryMode =
      column.resourceRecovery === 'SHORT_REST' ? 'all' : 'none';

    resources.push({
      id: getClassResourceId(classUrl, column.name),
      name: column.name,
      shortLabel: column.name.slice(0, RESOURCE_SHORT_LABEL_MAX_LENGTH),
      shortRest: { mode: shortRestMode, amount: RESOURCE_RECOVERY_AMOUNT_MIN },
      longRest: { mode: 'all', amount: RESOURCE_RECOVERY_AMOUNT_MIN },
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
 * (`class:<url класса>:<ключ>`).
 *
 * @param base деталь базового класса.
 * @param subclass деталь подкласса; null — подкласс не выбран.
 * @param level уровень персонажа В ЭТОМ классе.
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
 * @param classUrl URL класса — ключи умений в справочнике повторяются между
 *   классами, поэтому идентификатор разнесён по классам.
 * @param summary особенность из ответа класса.
 * @param originName название источника (класса или подкласса).
 * @param choices выборы игрока по идентификаторам особенностей.
 * @returns особенность персонажа.
 */
function toCharacterFeature(
  classUrl: string,
  summary: ClassFeatureSummary,
  originName: string,
  choices: Record<string, string>,
): CharacterFeature {
  const id = getClassFeatureId(classUrl, summary.key);

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
 * отбрасываются, идентификатор — `class:<url класса>:<key>`, выбор игрока
 * подставляется по нему же.
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

      features.push(toCharacterFeature(base.url, summary, originName, choices));
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
 * @param classUrl URL базового класса — умения подкласса лежат под ним.
 * @param subclass деталь подкласса.
 * @param level уровень персонажа В ЭТОМ классе.
 * @param choices выборы игрока по идентификаторам особенностей.
 * @returns умения подкласса.
 */
export function buildSubclassFeatures(
  classUrl: string,
  subclass: ClassSummary,
  level: number,
  choices: Record<string, string>,
): CharacterFeature[] {
  return subclass.features
    .filter((summary) => summary.isSubclass && summary.level <= level)
    .map((summary) =>
      toCharacterFeature(classUrl, summary, subclass.name, choices),
    );
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

      const baseId = getClassFeatureId(base.url, summary.key);

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
          : getClassFeatureChoice(id, summary, skillNames),
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
 * новые кости хитов. Правила восстановления остаются как есть: таблица класса
 * знает только вид отдыха и затёрла бы порции, настроенные игроком вручную.
 * Ресурсы без пары среди новых (добавленные вручную) не трогаются.
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
      max: next.max,
      current: clamp(resource.current + gain, 0, next.max),
    };
  });

  return [...merged, ...incomingById.values()];
}

/**
 * Умения класса, полученные выше указанного уровня В ЭТОМ КЛАССЕ, — их забирает
 * снижение его уровня. Уровень проставлен у классовых умений и у черт, взятых
 * за классовое улучшение характеристик, поэтому уходят и они. Умения других
 * классов, вида и добавленные вручную не трогаются.
 *
 * @param features особенности листа.
 * @param classLevels новые уровни классов по их URL.
 * @returns умения снимаемых уровней.
 */
export function getFeaturesAboveLevel(
  features: CharacterFeature[],
  classLevels: Record<string, number>,
): CharacterFeature[] {
  return features.filter((feature) => {
    if (feature.level === null) {
      return false;
    }

    const classUrl = Object.keys(classLevels).find((url) =>
      feature.id.startsWith(getClassFeatureIdPrefix(url)),
    );

    return (
      classUrl !== undefined && feature.level > (classLevels[classUrl] ?? 0)
    );
  });
}

/**
 * Снятие классовых умений за уровни выше нового уровня их класса.
 *
 * @param features особенности листа.
 * @param classLevels новые уровни классов по их URL.
 * @returns особенности без умений снятых уровней.
 */
export function removeFeaturesAboveLevel(
  features: CharacterFeature[],
  classLevels: Record<string, number>,
): CharacterFeature[] {
  const removedIds = new Set(
    getFeaturesAboveLevel(features, classLevels).map((feature) => feature.id),
  );

  if (!removedIds.size) {
    return features;
  }

  return features.filter((feature) => !removedIds.has(feature.id));
}

/**
 * Снятие всего, что дал класс: его умения и производные ресурсы. Ручные записи
 * и записи других классов остаются на месте.
 *
 * @param features особенности листа.
 * @param classUrl URL снимаемого класса.
 * @returns особенности без умений этого класса.
 */
export function removeClassFeatures(
  features: CharacterFeature[],
  classUrl: string,
): CharacterFeature[] {
  const prefix = getClassFeatureIdPrefix(classUrl);

  return features.filter((feature) => !feature.id.startsWith(prefix));
}

/**
 * Снятие производных ресурсов класса (`class:res:<url>:*`); заведённые вручную
 * счётчики и ресурсы других классов остаются.
 *
 * @param resources ресурсы листа.
 * @param classUrl URL класса.
 * @returns ресурсы без производных ресурсов этого класса.
 */
export function removeClassResources(
  resources: CharacterClassResource[],
  classUrl: string,
): CharacterClassResource[] {
  const prefix = getClassResourceIdPrefix(classUrl);

  return resources.filter((resource) => !resource.id.startsWith(prefix));
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
 * Подпись классов персонажа с уровнем каждого («Паладин (Клятва преданности) 3
 * · Волшебник 2»). У одноклассового персонажа выходит прежняя строка шапки.
 *
 * @param character персонаж.
 * @returns подпись классов; пустая строка — класс не выбран.
 */
export function getClassesDisplayLabel(character: Character): string {
  return getCharacterClasses(character)
    .map(
      (characterClass) =>
        `${getClassDisplayName(characterClass)} ${characterClass.level}`,
    )
    .join(CLASSES_LABEL_SEPARATOR);
}

/**
 * Кости хитов, которые дают классы персонажа: номиналы сводятся вместе (два
 * класса с к8 дают одну запись), количество — уровень в классе.
 *
 * @param classes классы персонажа.
 * @returns максимум костей по номиналам, по убыванию номинала.
 */
export function getClassHitDiceMaximums(
  classes: CharacterClass[],
): Array<{ die: number; max: number }> {
  const maxByDie = new Map<number, number>();

  for (const characterClass of classes) {
    const die = Math.trunc(characterClass.hitDie);

    if (die <= 0) {
      continue;
    }

    const level = Math.max(0, Math.trunc(characterClass.level));

    maxByDie.set(die, (maxByDie.get(die) ?? 0) + level);
  }

  return [...maxByDie.entries()]
    .map(([die, max]) => ({ die, max }))
    .sort((left, right) => right.die - left.die);
}

/**
 * Пересборка костей хитов под уровни классов: максимум каждого номинала
 * становится суммой уровней классов с этой костью, потраченные кости остаются
 * потраченными (остаток обрезается новым максимумом, а прибавка приходит
 * непотраченной). Номиналы, которых у классов нет, с листа уходят.
 *
 * @param hitDice кости хитов листа.
 * @param classes классы персонажа.
 * @returns новый список костей хитов.
 */
export function syncClassHitDice(
  hitDice: CharacterHitDie[],
  classes: CharacterClass[],
): CharacterHitDie[] {
  const currentByDie = new Map(
    hitDice.map((hitDie) => [hitDie.die, hitDie] as const),
  );

  return getClassHitDiceMaximums(classes).map(({ die, max }) => {
    const existing = currentByDie.get(die);

    if (!existing) {
      return { die, current: max, max };
    }

    const spent = Math.max(
      0,
      existing.max - clamp(existing.current, 0, existing.max),
    );

    return { die, current: clamp(max - spent, 0, max), max };
  });
}

/**
 * Числительные выбора: цифрой либо словом в любом падеже. Косвенные падежи
 * обязательны — «владение двумя навыками» без них не распознавалось и давало
 * один навык вместо двух. Корень «дву» сужен до «двум/двух», иначе числительным
 * стало бы свойство оружия «Двуручное».
 */
const CHOICE_COUNT_SOURCE = String.raw`(\d+)|оди?н|(дв[ае]|дву[мх])|(тр[иеё])|(четыр)`;

/**
 * Количество из совпадения числительного: цифра как есть, слово — по группе.
 *
 * @param match совпадение `CHOICE_COUNT_SOURCE`.
 * @returns распознанное количество.
 */
function getMatchedChoiceCount(match: RegExpMatchArray): number {
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
 * Количество для выбора из прозы: первое число либо числительное словом
 * (один/два/три/четыре); по умолчанию 1.
 *
 * @param text строка с описанием выбора.
 * @returns распознанное количество.
 */
export function parseChoiceCount(text: string): number {
  const match = new RegExp(CHOICE_COUNT_SOURCE, 'i').exec(text);

  return match ? getMatchedChoiceCount(match) : 1;
}

/**
 * Количество из фразы о выдаче: берётся последнее числительное, то есть
 * ближайшее к предмету выдачи. У «Благословения знаний» жреца фраза начинается
 * с инструментов («владение одним типом инструментов… и двумя из следующих
 * навыков»), и первое числительное описывает инструменты, а не навыки.
 *
 * @param text отрезок фразы до предмета выдачи.
 * @returns распознанное количество.
 */
export function parseTrailingChoiceCount(text: string): number {
  const match = [...text.matchAll(new RegExp(CHOICE_COUNT_SOURCE, 'gi'))].at(
    -1,
  );

  return match ? getMatchedChoiceCount(match) : 1;
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

/** Корень слова «владение»: одно из условий выдачи владения навыком. */
const PROFICIENCY_KEYWORD = 'владени';

/** Корень слова «навык»: предмет выдачи, которым заканчивается фраза. */
const SKILL_KEYWORD = 'навык';

/** Корень слова «выбор»: выдача должна быть выбором, а не фиксированной. */
const CHOICE_KEYWORD = 'выбор';

/** Максимум символов между глаголом выдачи и словом «навык» внутри фразы. */
const SKILL_GRANT_SPAN = 160;

/**
 * Глаголы выдачи: «получаете», «приобретаете» и все формы выбора — «выберите»,
 * «на выбор», «выбираете», «можете выбрать». Формы выбора расходятся по корню
 * («выбер» и «выбра»), и без второй из них «Шёпот мёртвых» плута («вы можете
 * выбрать одно владение навыком») переставал считаться выбором.
 */
const GRANT_VERB_SOURCE = String.raw`получ|приобрет|выб(?:[еои]р|ра)`;

/**
 * Фраза о выдаче владения навыком: глагол выдачи или выбора, а следом «навык»
 * в пределах одного предложения (точка фразу обрывает). Одних лишь слов
 * «навык», «владение» и «выбор» где угодно в описании мало: «Дикая форма»
 * друида говорит «вы также сохраняете владение навыками», слово «выбор»
 * приезжает из соседнего абзаца про известные формы — и визард просил выбрать
 * два произвольных навыка из восемнадцати на втором уровне.
 *
 * Начало фразы служит и якорем количества: у «Величия гения» паладина (Клятва
 * благородных гениев) описание открывается формулой доспеха («базовый КД равен
 * 10 + …»), и счёт по всему описанию требовал 10 навыков при четырёх
 * перечисленных — шаг визарда становился непроходимым.
 */
const SKILL_GRANT_PATTERN = new RegExp(
  `(?:${GRANT_VERB_SOURCE})[^.]{0,${SKILL_GRANT_SPAN}}?${SKILL_KEYWORD}`,
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
    text.includes(SKILL_KEYWORD)
    && text.includes(PROFICIENCY_KEYWORD)
    && text.includes(CHOICE_KEYWORD)
  ) {
    const grant = SKILL_GRANT_PATTERN.exec(text);

    if (grant) {
      // Количество ищется до предмета выдачи: дальше идёт перечень навыков, а в
      // нём числительные встречаются в названиях и ссылках.
      const phrase = grant[0].slice(0, -SKILL_KEYWORD.length);

      return {
        id: featureId,
        kind: 'skill-proficiency',
        label: '',
        count: parseTrailingChoiceCount(phrase),
        listed: skillNames.filter((name) => rawText.includes(name)),
      };
    }
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
 * Выбор внутри умения класса: структурный из справочника, а если его там нет —
 * распознанный по прозе описания. Структура точнее прозы (у неё явные пул и
 * количество), поэтому имеет приоритет; проза остаётся страховкой для умений,
 * которым выбор ещё не проставили в редакторе класса.
 *
 * @param featureId идентификатор умения (он же id выбора).
 * @param summary умение класса или подкласса.
 * @param skillNames имена всех навыков персонажа.
 * @returns выбор умения или null.
 */
export function getClassFeatureChoice(
  featureId: string,
  summary: ClassFeatureSummary,
  skillNames: string[],
): ClassChoice | null {
  const skillChoice = summary.skillChoice;

  if (skillChoice) {
    return {
      id: featureId,
      kind: 'skill-proficiency',
      label: '',
      count: skillChoice.count,
      // Пустой пул в справочнике означает выбор из всех навыков: пустой
      // `listed` резолвится всеми навыками листа в `resolveChoiceOptions`.
      listed: skillChoice.skills,
    };
  }

  return detectFeatureChoice(featureId, summary.description, skillNames);
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

  // Пул характеристик перечислен в самой механике черты, а пул заклинаний
  // собирается поиском по каталогу и приходит уже готовым: и то, и другое лежит
  // в `listed`. Без этой ветки они провалились бы в выбор инструмента ниже.
  if (choice.kind === 'spellcasting-ability' || choice.kind === 'spell') {
    return choice.listed;
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
 * Сколько опций требуется выбрать: распознанное из прозы количество не может
 * превышать длину списка. Количество приезжает из эвристики по тексту, и
 * завышенное число делало шаг визарда непроходимым — условие «выбрано меньше
 * требуемого» не выполнить, а кнопка «Далее» остаётся заблокированной.
 *
 * @param choice распознанный выбор.
 * @param options доступные опции выбора.
 * @returns требуемое число опций.
 */
export function getRequiredChoiceCount(
  choice: ClassChoice,
  options: string[],
): number {
  return Math.min(choice.count, options.length);
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
 * Характеристики листа из набора калькулятора: ключи набора приводятся к ключам
 * листа (`STRENGTH` → `strength`) по `API_ABILITY_KEYS`, а к базовому значению
 * добавляются прибавки предыстории — лист хранит характеристики уже вместе с
 * ними. Характеристика, которой в наборе нет, остаётся прежней. Диапазон здесь
 * не ограничивается: обрезка живёт в `setAbilityScores`, единой точке записи.
 *
 * @param abilities текущие характеристики листа.
 * @param scores набор значений калькулятора (ключи в верхнем регистре).
 * @param bonuses прибавки предыстории к характеристикам.
 * @returns характеристики листа с записанным набором.
 */
export function getAbilitiesFromScores(
  abilities: CharacterAbilities,
  scores: Partial<Record<ApiAbilityKey, number>>,
  bonuses: Partial<Record<AbilityKey, number>>,
): CharacterAbilities {
  const result = { ...abilities };

  for (const key of ABILITY_ORDER) {
    const score = scores[API_ABILITY_KEYS[key]];

    if (score === undefined) {
      continue;
    }

    result[key] = score + (bonuses[key] ?? 0);
  }

  return result;
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
   * Открытие набора характеристик; не передан — пункта в меню нет. В карточке
   * списка лист не открыт, и записывать набор было бы некуда.
   */
  onAbilityScores?: () => void;

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

  if (!options.isLocked && options.onAbilityScores) {
    actions.push({
      label: ABILITY_SCORES_LABELS.menu,
      icon: 'tabler:dice-6',
      onSelect: options.onAbilityScores,
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

  /** Настройка на предмет; не передан — предмет её не требует. */
  onToggleAttunement?: () => void;

  /** Персонаж уже настроен — пункт предлагает снять настройку. */
  attuned: boolean;

  /** Включение предмета; не передан — включать нечего (немагический предмет). */
  onToggleActive?: () => void;

  /** Предмет уже включён — пункт предлагает выключить его. */
  active: boolean;

  /** Восстановление зарядов; не передан — зарядов у предмета нет. */
  onRestoreCharges?: () => void;
}

/**
 * Пункты меню строки снаряжения. Действия убраны под многоточие, а не стоят
 * кнопками в строке: у каталожного предмета их два, у своего — тоже два, но
 * другие, и трейлинг соседних строк не выравнивался бы. Игровые действия (хват,
 * настройка, включение, заряды) идут первыми: к ним возвращаются в бою, а правка
 * и удаление меняют саму запись.
 *
 * @param options обработчики пунктов.
 * @returns пункты для `UDropdownMenu`.
 */
export function getInventoryItemMenuItems(
  options: InventoryItemMenuOptions,
): DropdownMenuItem[] {
  const items = getSheetEntryMenuItems(options, INVENTORY_REMOVE_MENU_LABEL);
  const gameItems: DropdownMenuItem[] = [];

  if (options.onToggleGrip) {
    gameItems.push({
      label: options.twoHanded
        ? INVENTORY_GRIP_MENU_LABELS.oneHanded
        : INVENTORY_GRIP_MENU_LABELS.twoHanded,
      icon: 'tabler:sword',
      onSelect: options.onToggleGrip,
    });
  }

  if (options.onToggleAttunement) {
    gameItems.push({
      label: options.attuned
        ? INVENTORY_ATTUNEMENT_MENU_LABELS.unattune
        : INVENTORY_ATTUNEMENT_MENU_LABELS.attune,
      icon: 'tabler:sparkles',
      onSelect: options.onToggleAttunement,
    });
  }

  if (options.onToggleActive) {
    gameItems.push({
      label: options.active
        ? INVENTORY_ACTIVE_MENU_LABELS.deactivate
        : INVENTORY_ACTIVE_MENU_LABELS.activate,
      icon: 'tabler:player-play',
      onSelect: options.onToggleActive,
    });
  }

  if (options.onRestoreCharges) {
    gameItems.push({
      label: INVENTORY_RESTORE_CHARGES_MENU_LABEL,
      icon: 'tabler:battery-charging',
      onSelect: options.onRestoreCharges,
    });
  }

  return [...gameItems, ...items];
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

/**
 * Текст подтверждения удаления особенности: называет особенность, чтобы в
 * длинном списке было видно, какая именно строка исчезнет.
 *
 * @param name название особенности.
 * @returns описание для диалога подтверждения.
 */
export function getFeatureRemoveDescription(name: string): string {
  return `«${name}» исчезнет с листа вместе со сделанным в ней выбором — вернуть её можно только заново добавив.`;
}

/**
 * Личность без пробелов по краям полей. Поля правятся вводом от руки, и строка
 * из одних пробелов считалась бы заполненной: плитка показывала бы пустоту
 * вместо прочерка, а описание — рамку без текста.
 *
 * @param personality личность персонажа из формы.
 * @returns личность, готовая к записи в лист.
 */
export function toTrimmedPersonality(
  personality: CharacterPersonality,
): CharacterPersonality {
  return {
    alignment: personality.alignment.trim(),
    age: personality.age.trim(),
    height: personality.height.trim(),
    weight: personality.weight.trim(),
    eyes: personality.eyes.trim(),
    hair: personality.hair.trim(),
    skin: personality.skin.trim(),
    description: personality.description.trim(),
  };
}

/**
 * Плитки примет на вкладке «Личность»: мировоззрение и свободные поля в одном
 * ряду. Незаполненные поля не пропускаются, а показывают прочерк — ряд плиток
 * заодно подсказывает, что о персонаже ещё можно записать.
 *
 * @param personality личность персонажа.
 * @returns плитки в порядке отрисовки.
 */
export function getPersonalityRows(
  personality: CharacterPersonality,
): PersonalityFieldRow[] {
  const rows: PersonalityFieldRow[] = [
    {
      key: 'alignment',
      label: SHEET_PERSONALITY_LABELS.alignmentField,
      value: personality.alignment || PERSONALITY_EMPTY_VALUE,
      filled: Boolean(personality.alignment),
    },
  ];

  for (const field of PERSONALITY_TEXT_FIELDS) {
    const value = personality[field.key].trim();

    rows.push({
      key: field.key,
      label: field.label,
      value: value || PERSONALITY_EMPTY_VALUE,
      filled: Boolean(value),
    });
  }

  return rows;
}
