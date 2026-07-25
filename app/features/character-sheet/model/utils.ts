import type { DropdownMenuItem } from '@nuxt/ui';

import type { Level } from '~/shared/types';
import type { RenderNode } from '~ui/markup';

import type {
  AbilityBonusMode,
  AbilityKey,
  AbilityRow,
  ArmorClassBreakdown,
  ArmorDexterityMod,
  Character,
  CharacterClass,
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
  CustomArmorType,
  CustomInventoryItemDraft,
  CustomInventoryKind,
  CustomSpellDraft,
  CustomSpellStatRow,
  FeatSummary,
  FeatureDescriptionNode,
  FeatureOrigin,
  HitDiceAmount,
  HitDicePool,
  HitDiceSelectPool,
  InventoryArmor,
  InventoryItemOrigin,
  InventoryWeapon,
  ItemSummary,
  MagicItemCatalogItem,
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
  SpellSlotCircle,
  SpellSlotRow,
  VisionRow,
  WeaponAttack,
  WeaponDamage,
} from './types';

import { capitalize, clamp } from 'es-toolkit';

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
  ABILITY_LABELS,
  ABILITY_ORDER,
  ABILITY_SHORT_LABELS,
  ALL_SPELL_SLOTS_LABEL,
  ARMOR_CLASS_BASE_MAX,
  ARMOR_CLASS_BASE_MIN,
  ARMOR_MATCH_KEYWORDS,
  ARMOR_MEDIUM_DEX_CAP,
  ARMOR_PROFICIENCY_GROUPS,
  CARRYING_CAPACITY_MULTIPLIER,
  CHARACTER_FILE_NAME_FALLBACK,
  CLASS_SPELL_PROGRESSIONS,
  CLASS_SPELLCASTING_ABILITIES,
  CUSTOM_ARMOR_TYPE_BY_DEXTERITY_MOD,
  CUSTOM_ARMOR_TYPE_META,
  CUSTOM_INVENTORY_KIND_CATEGORIES,
  CUSTOM_INVENTORY_URL_PREFIX,
  CUSTOM_ITEM_WEIGHT_MAX,
  CUSTOM_ITEM_WEIGHT_MIN,
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
  DEFAULT_WEAPON_ATTACK_ABILITY,
  DICE_NOTATION_LETTER,
  HIT_DICE_LONG_REST_DIVISOR,
  HIT_DICE_LONG_REST_MIN,
  HIT_DICE_ROLL_COUNT,
  INVENTORY_CATEGORY_ORDER,
  INVENTORY_CATEGORY_TITLES,
  INVENTORY_QUANTITY_MAX,
  INVENTORY_QUANTITY_MIN,
  INVENTORY_REMOVE_MENU_LABEL,
  LEVEL_XP_THRESHOLDS,
  NEW_CUSTOM_INVENTORY_ITEM,
  PACT_SPELL_SLOTS_LABEL,
  RESOURCE_RECOVERY_LABELS,
  ROLL_MODE_DICE_NOTATION,
  SHEET_COPY_LIMIT_HINT,
  SHEET_SHARE_ACTIVE_HINT,
  SIZE_LABEL_WORDS,
  SKILL_PROFICIENCY_MULTIPLIERS,
  SPEED_PARSE_FALLBACK,
  SPEED_PRIMARY_ORDER,
  SPEED_TYPE_LABELS,
  SPEED_UNIT_SHORT_LABELS,
  SPELL_SAVE_DC_BASE,
  SPELL_SLOT_FREE_LABEL,
  SPELL_SLOT_USED_LABEL,
  THIRD_CASTER_SUBCLASSES,
  TOOL_MATCH_KEYWORDS,
  TOOL_PROFICIENCY_GROUPS,
  UNARMORED_ARMOR_CLASS_BASE,
  VISION_LABELS,
  VISION_ORDER,
  WEAPON_CATEGORY_LABELS,
  WEAPON_MATCH_KEYWORDS,
  WEAPON_PROFICIENCY_GROUPS,
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
 * Подпись типов своего предмета для строки инвентаря: у доспеха — его тип, у
 * оружия — категория владения и свойства, у безделушки — общая подпись.
 *
 * @param draft значения формы своего предмета.
 * @returns подпись типов предмета.
 */
function getCustomInventoryTypesLabel(draft: CustomInventoryItemDraft): string {
  if (draft.kind === 'armor') {
    return CUSTOM_ARMOR_TYPE_META[draft.armorType].typesLabel;
  }

  if (draft.kind === 'trinket') {
    return CUSTOM_TRINKET_TYPES_LABEL;
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

  return {
    id: url,
    url,
    name,
    category: CUSTOM_INVENTORY_KIND_CATEGORIES[draft.kind],
    typesLabel: getCustomInventoryTypesLabel(draft),
    cost: draft.cost.trim(),
    weight: getDraftWeight(draft.weight),
    quantity: getClampedInteger(
      draft.quantity,
      INVENTORY_QUANTITY_MIN,
      INVENTORY_QUANTITY_MAX,
    ),
    armor: getCustomInventoryArmor(draft),
    weapon: getCustomInventoryWeapon(draft),
    // Надетым остаётся только доспех: у оружия и безделушки параметров доспеха
    // нет, и в подсчёт КД они не идут.
    equipped: draft.kind === 'armor' && equipped,
    description: [...draft.description],
  };
}

/**
 * Вид своего предмета по его категории инвентаря (обратный разбор для формы
 * редактирования).
 *
 * @param inventoryItem предмет инвентаря.
 * @returns вид своего предмета.
 */
function getCustomInventoryKind(
  inventoryItem: CharacterInventoryItem,
): CustomInventoryKind {
  if (inventoryItem.category === 'WEAPON') {
    return 'weapon';
  }

  return inventoryItem.category === 'ARMOR' ? 'armor' : 'trinket';
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
 * Разбор итогового класса доспеха. В ручном режиме (`custom`) — базовое значение
 * плюс модификатор выбранной характеристики. В автоматическом — по надетой
 * броне: тело даёт лучшая надетая броня (или безброневой `10 + Ловкость`), щит
 * складывается сверху (в зачёт — лучший щит); модификатор Ловкости учитывается
 * по правилу брони.
 *
 * @param character персонаж.
 * @returns разбор класса доспеха для листа и модалки.
 */
export function getArmorClassBreakdown(
  character: Character,
): ArmorClassBreakdown {
  const { base, ability, custom } = character.armorClass;

  if (custom) {
    const value = ability
      ? base + getModifier(character.abilities[ability])
      : base;

    return {
      value,
      custom: true,
      bodyArmorName: null,
      bodyArmorValue: value,
      dexBonus: 0,
      dexCapped: false,
      shieldBonus: 0,
    };
  }

  const dexModifier = getModifier(character.abilities.dexterity);

  const equippedArmor = character.inventory.filter(
    (item): item is CharacterInventoryItem & { armor: InventoryArmor } =>
      item.equipped && item.category === 'ARMOR' && item.armor !== null,
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
    value: bodyArmorValue + shieldBonus,
    custom: false,
    bodyArmorName,
    bodyArmorValue,
    dexBonus,
    dexCapped,
    shieldBonus,
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
    getProficiencyBonus(character.level)
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
 * модификатор той же характеристики, что и у атаки. Использует ASCII-минус —
 * формула уходит в парсер дайс-роллера.
 *
 * @param character персонаж.
 * @param weapon параметры оружия.
 * @returns разбор броска урона или null, если справочник не дал костей урона.
 */
export function getWeaponDamage(
  character: Character,
  weapon: InventoryWeapon,
): WeaponDamage | null {
  if (!weapon.damage) {
    return null;
  }

  const ability = getWeaponAbility(character, weapon);

  const diceNotation = `${weapon.damage.diceCount}${DICE_NOTATION_LETTER}${weapon.damage.diceFaces}`;

  const totalBonus =
    weapon.damage.bonus + getModifier(character.abilities[ability]);

  const sign = totalBonus < 0 ? '-' : '+';

  return {
    formula:
      totalBonus === 0
        ? diceNotation
        : `${diceNotation}${sign}${Math.abs(totalBonus)}`,
    diceNotation,
    weaponBonus: weapon.damage.bonus,
    ability,
    typeLabel: DAMAGE_TYPE_LABELS[weapon.damage.type] ?? '',
  };
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
 * Сколько костей хитов возвращает продолжительный отдых: половина от общего
 * количества костей, но не меньше одной (правило D&D 2024). Больше, чем
 * потрачено, вернуть нельзя, а без костей возвращать нечего.
 *
 * @param pools пулы костей хитов по номиналам.
 * @returns количество костей к возврату.
 */
export function getLongRestHitDiceCount(pools: HitDicePool[]): number {
  const totals = pools.reduce(
    (total, pool) => ({
      current: total.current + pool.current,
      max: total.max + pool.max,
    }),
    { current: 0, max: 0 },
  );

  const spent = totals.max - totals.current;

  if (spent <= 0) {
    return 0;
  }

  return Math.min(
    spent,
    Math.max(
      HIT_DICE_LONG_REST_MIN,
      Math.floor(totals.max / HIT_DICE_LONG_REST_DIVISOR),
    ),
  );
}

/**
 * Раскладка возвращаемых костей по умолчанию: сперва крупные номиналы —
 * они полезнее в бою, а перераспределить выбор игрок может сам.
 *
 * @param pools пулы костей хитов с пределом возврата по номиналу.
 * @param count сколько костей возвращается всего.
 * @returns количество костей к возврату по номиналам.
 */
export function getDefaultHitDiceRecovery(
  pools: HitDiceSelectPool[],
  count: number,
): HitDiceAmount[] {
  let pending = Math.max(0, Math.trunc(count));

  return [...pools]
    .sort((left, right) => right.die - left.die)
    .map((pool) => {
      const taken = clamp(pending, 0, pool.limit);

      pending -= taken;

      return { die: pool.die, count: taken };
    })
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
  const levels = [
    ...new Set([...spells.map((spell) => spell.level), ...slotLevels]),
  ].sort((left, right) => left - right);

  return levels.map((level) => ({
    level,
    label: getSpellGroupLabel(level),
    spells: spells
      .filter((spell) => spell.level === level)
      .sort((left, right) => left.name.localeCompare(right.name, 'ru')),
  }));
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
 * Заполненные характеристики своего заклинания (время, дистанция, компоненты,
 * длительность) для развёрнутой карточки; незаполненные поля пропускаются.
 *
 * @param spell заклинание книги персонажа.
 * @returns строки «подпись — значение».
 */
export function getCustomSpellStatRows(
  spell: CharacterSpell,
): CustomSpellStatRow[] {
  return CUSTOM_SPELL_FIELDS.map((field) => ({
    key: field.key,
    label: field.label,
    value: spell[field.key]?.trim() ?? '',
  })).filter((row) => row.value);
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
 * Приведение названия класса или подкласса к ключу карт заклинательства.
 *
 * @param name название класса или подкласса.
 * @returns название без крайних пробелов, в нижнем регистре и без «ё».
 */
function normalizeClassName(name: string): string {
  return name.trim().toLowerCase().replaceAll('ё', 'е');
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
    CLASS_SPELLCASTING_ABILITIES[normalizeClassName(characterClass.name)]
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
    CLASS_SPELL_PROGRESSIONS[normalizeClassName(characterClass.name)];

  if (casterType) {
    return casterType;
  }

  const { subclassName } = characterClass;

  return subclassName
    && THIRD_CASTER_SUBCLASSES.includes(normalizeClassName(subclassName))
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

  const proficiencyBonus = getProficiencyBonus(character.level);

  return {
    ability,
    auto,
    abilityModifier,
    proficiencyBonus,
    saveDc: SPELL_SAVE_DC_BASE + proficiencyBonus + abilityModifier,
    attackBonus: proficiencyBonus + abilityModifier,
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
 * уходит в автосохранение) и отдаёт браузеру ссылку на blob. Работает только в
 * браузере — вызывается по действию пользователя.
 *
 * Ссылка на изображение в файл не попадает: она ведёт в наше хранилище и
 * действительна только для своего владельца — в чужом аккаунте или стороннем
 * сервисе картинка всё равно не откроется. Пустое поле честнее битой ссылки.
 *
 * @param character персонаж скачиваемого листа.
 */
export function downloadCharacterJson(character: Character): void {
  const json = JSON.stringify({ ...character, avatarUrl: null }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${getCharacterFileName(character.name)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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

  onDownload: () => void;
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
 * группой, удаление — отдельной, оно необратимее прочих.
 *
 * @param options доступность действий и обработчики пунктов.
 * @returns группы пунктов для `UDropdownMenu`.
 */
export function getSheetActionMenuItems(
  options: SheetActionMenuOptions,
): Array<Array<DropdownMenuItem>> {
  const download: DropdownMenuItem = {
    label: 'Скачать JSON',
    icon: 'tabler:download',
    onSelect: options.onDownload,
  };

  if (options.isReadonly) {
    return [[download]];
  }

  const actions: DropdownMenuItem[] = [
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

/** Обработчики пунктов меню строки снаряжения. */
export interface InventoryItemMenuOptions {
  /**
   * Правка предмета; не передан — пункта нет. У каталожного предмета править
   * нечего: его поля приходят из раздела сайта.
   */
  onEdit?: () => void;

  onRemove: () => void;
}

/**
 * Пункты меню строки снаряжения: правка своего предмета и удаление. Действия
 * убраны под многоточие, а не стоят кнопками в строке: у каталожного предмета
 * их одно, у своего — два, и трейлинг соседних строк не выравнивался бы.
 *
 * @param options обработчики пунктов.
 * @returns пункты для `UDropdownMenu`.
 */
export function getInventoryItemMenuItems(
  options: InventoryItemMenuOptions,
): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = [];

  if (options.onEdit) {
    items.push({
      label: 'Редактировать',
      icon: 'tabler:pencil',
      onSelect: options.onEdit,
    });
  }

  items.push({
    label: INVENTORY_REMOVE_MENU_LABEL,
    icon: 'tabler:trash',
    color: 'error',
    onSelect: options.onRemove,
  });

  return items;
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
