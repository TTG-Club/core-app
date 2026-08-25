import type { ActiveEffect, EffectAbility } from '~active-effects/model';
import type { DamageFormulaPart } from '~ui/damage-formula';
import type { EditorBaseInfoState } from '~ui/editor';

import { isPlainObject } from 'es-toolkit';
import { z } from 'zod';

import {
  normalizeActiveEffects,
  normalizeLoadedActiveEffects,
} from '~active-effects/model';
import {
  createEmptyDamageFormulaPart,
  DAMAGE_FORMULA_DICE_SYMBOL,
  DAMAGE_TYPE_TAGS,
  DEFAULT_DAMAGE_FORMULA_TARGET,
  isDamageFormulaTarget,
  parseDamageFormulaDice,
} from '~ui/damage-formula';

import { DEFAULT_ITEM_CATEGORY, WEAPON_PROPERTY_KEYS } from './constants';

/** Категории предмета (`ItemCategory` бэкенда). */
export type ItemCategory =
  | 'WEAPON'
  | 'ARMOR'
  | 'ITEM'
  | 'TOOL'
  | 'VEHICLE'
  | 'MOUNT';

/** Типы предмета (`ItemType` бэкенда) — значения группы фильтров `itemType`. */
export type ItemType =
  | 'ADVENTURING_GEAR'
  | 'SIEGE_EQUIPMENT'
  | 'ARTISAN_S_TOOLS'
  | 'TOOL'
  | 'INSTRUMENT'
  | 'FOOD_AND_DRINK'
  | 'GAMING_SET'
  | 'AMMUNITION'
  | 'WEAPON'
  | 'MARTIAL_WEAPON'
  | 'SIMPLE_WEAPON'
  | 'MELEE_WEAPON'
  | 'RANGED_WEAPON'
  | 'FIREARM'
  | 'FUTURISTIC'
  | 'EXPLOSIVE'
  | 'ARMOR'
  | 'LIGHT_ARMOR'
  | 'MEDIUM_ARMOR'
  | 'HEAVY_ARMOR'
  | 'SHIELD'
  | 'SPELLCASTING_FOCUS'
  | 'POISON'
  | 'MOUNT'
  | 'TACK_AND_HARNESS'
  | 'VEHICLE'
  | 'VEHICLE_AIR'
  | 'VEHICLE_LAND'
  | 'VEHICLE_WATER';

export type DexterityMod = 'PLUS' | 'PLUS_MAX_2' | 'NONE';

/**
 * Режим учёта бонуса мастерства при атаке этим оружием. Зеркало
 * `WeaponProficiencyMode` из VTTG: `auto` — по владению носителя.
 */
export type WeaponProficiencyMode = 'auto' | 'always' | 'never';

/**
 * Режим учёта владения инструментом. Зеркало `ToolProficiencyMode` из VTTG:
 * `auto` — по владению носителя.
 */
export type ToolProficiencyMode =
  | 'auto'
  | 'none'
  | 'half'
  | 'proficient'
  | 'expertise';

/**
 * Характеристика, чей модификатор идёт в урон. `none` — урон без прибавки
 * характеристики; поле не задано — та же, что у атаки (как по правилам).
 */
export type WeaponDamageAbility = EffectAbility | 'none';

/** Что происходит с уроном при успешном спасброске (`saveEffect` VTTG). */
export type WeaponSaveEffect = 'half' | 'none' | 'special';

/** Категория инструмента. Зеркало `ToolCategory` из VTTG. */
export type ItemToolCategory = 'artisan' | 'gaming' | 'musical' | 'other';

/**
 * Категория снаряжения. Зеркало `EquipmentCategory` из VTTG. Броню задаёт
 * подформа доспеха (`ArmorCategory` сайта), здесь — всё остальное.
 */
export type ItemEquipmentCategory =
  | 'trinket'
  | 'ring'
  | 'clothing'
  | 'wand'
  | 'wondrous'
  | 'food'
  | 'adventurer-equipment'
  | 'vehicle-equipment';

export interface Roll {
  diceCount: number | undefined; // количество костей
  dice: string | undefined; // тип кости
  bonus: number | undefined; // бонус
}

export interface Damage {
  roll: Roll;
  type: string | undefined; // тип урона
}

export interface Range {
  normal: number | undefined; // нормальная дистанция
  max: number | undefined; // максимальная дистанция
}

export interface WeaponCreate {
  category: string | undefined; // категория оружия
  properties: Array<string>; // свойства
  mastery: string | undefined; // приём
  range: Range; // дистанция
  ammo: string | undefined; // тип боеприпаса
  magazine: number | undefined; // боекомплект: выстрелов до перезарядки
  additional: string | undefined; // дополнительно

  /**
   * Урон оружия частями-формулами — источник истины, единый с заклинаниями.
   * Первая часть несёт и формулу двуручного хвата (`versatileFormula`).
   */
  damageParts: Array<DamageFormulaPart>;

  /**
   * Урон связкой «кости + тип», как справочник хранил его до частей-формул.
   * Поле живёт дальше: его читают лист персонажа сайта и записи, сохранённые
   * раньше. Форма его не правит — оно выводится из первой части.
   */
  damage: Damage;
  /** Универсальный урон в прежней форме — пара к {@link WeaponCreate.damage}. */
  versatile: Roll;

  /** Ключ базового оружия VTTG (`longsword`); пусто — вывести из названия. */
  baseType: string | undefined;
  /** Досягаемость в футах; пусто — по свойству «Досягаемость». */
  reach: number | undefined;
  /** Характеристика броска атаки; пусто — по правилам вида оружия. */
  attackAbility: EffectAbility | undefined;
  proficiencyMode: WeaponProficiencyMode | undefined;
  attackBonus: number | undefined;
  /** Характеристика урона; пусто — как у атаки. */
  damageAbility: WeaponDamageAbility | undefined;
  damageBonus: number | undefined;
  /** Характеристика спасброска; пусто — обычная атака с броском попадания. */
  saveType: EffectAbility | undefined;
  saveEffect: WeaponSaveEffect | undefined;
}

export interface ArmorCreate {
  category: string | undefined; // категория доспеха
  armorClass: number | undefined; // КД
  mod: DexterityMod | undefined; // модификатор Ловкости
  strength: string | undefined; // требование Силы
  stealth: boolean | undefined; // помеха Скрытности
}

export interface ToolCreate {
  category: ItemToolCategory | undefined; // пусто — вывести из типов предмета
  baseType: string | undefined; // ключ инструмента VTTG; пусто — из адреса
  ability: EffectAbility | undefined; // характеристика проверки инструментом
  bonus: number | undefined; // собственный бонус инструмента
  proficiencyMode: ToolProficiencyMode | undefined;
}

export interface ItemCreate extends EditorBaseInfoState {
  category: ItemCategory; // категория
  types: Array<string>; // типы
  description: string; // описание маркап
  cost: number | undefined; // стоимость
  coin: string | undefined; // номинал монеты в стоимости
  weight: string | undefined; // вес
  image: string | undefined;
  /** Категория снаряжения VTTG; пусто — вывести из типов предмета. */
  equipmentCategory: ItemEquipmentCategory | undefined;
  weapon: WeaponCreate; // данные оружия
  armor: ArmorCreate; // данные доспеха
  tool: ToolCreate; // данные инструмента
  activeEffects: Array<ActiveEffect>; // активные эффекты для экспорта в VTTG
}

/** Пустая подформа оружия. */
export function createEmptyWeapon(): WeaponCreate {
  return {
    category: undefined,
    properties: [],
    mastery: undefined,
    range: { normal: undefined, max: undefined },
    ammo: undefined,
    magazine: undefined,
    additional: undefined,
    damageParts: [createEmptyDamageFormulaPart()],
    damage: {
      roll: { diceCount: undefined, dice: undefined, bonus: undefined },
      type: undefined,
    },
    versatile: { diceCount: undefined, dice: undefined, bonus: undefined },
    baseType: undefined,
    reach: undefined,
    attackAbility: undefined,
    proficiencyMode: undefined,
    attackBonus: undefined,
    damageAbility: undefined,
    damageBonus: undefined,
    saveType: undefined,
    saveEffect: undefined,
  };
}

/** Пустая подформа доспеха. */
export function createEmptyArmor(): ArmorCreate {
  return {
    category: undefined,
    armorClass: undefined,
    mod: undefined,
    strength: undefined,
    stealth: false,
  };
}

/** Пустая подформа инструмента. */
export function createEmptyTool(): ToolCreate {
  return {
    category: undefined,
    baseType: undefined,
    ability: undefined,
    bonus: undefined,
    proficiencyMode: undefined,
  };
}

/** Пустое состояние формы предмета. */
export function createEmptyItem(): ItemCreate {
  return {
    url: '',
    name: {
      rus: '',
      eng: '',
      alt: [],
    },
    source: {
      url: undefined,
      page: undefined,
    },
    srdVersion: undefined,
    description: '',
    category: DEFAULT_ITEM_CATEGORY,
    types: [],
    cost: undefined,
    coin: undefined,
    weight: undefined,
    image: undefined,
    equipmentCategory: undefined,
    tags: [],
    weapon: createEmptyWeapon(),
    armor: createEmptyArmor(),
    tool: createEmptyTool(),
    activeEffects: [],
  };
}

/**
 * Бросок формы из разобранной формулы. Кость справочник хранит строкой
 * (`d8`), а формула — числом граней.
 *
 * @param formula формула части урона.
 * @returns бросок; `undefined` — формула сложнее простых костей.
 */
function parseSimpleDiceFormula(formula: string | undefined): Roll | undefined {
  const dice = parseDamageFormulaDice(formula);

  if (!dice) {
    return undefined;
  }

  return {
    diceCount: dice.diceCount,
    dice: `d${dice.diceFaces}`,
    bonus: dice.bonus === 0 ? undefined : dice.bonus,
  };
}

/**
 * Собирает формулу части урона из прежней связки «кости + тип».
 *
 * @param roll бросок урона.
 * @param damageType ключ типа урона справочника.
 * @returns формула; пустая строка — костей нет.
 */
function toDamageFormula(
  roll: Roll | undefined,
  damageType: string | undefined,
): string {
  const faces = /\d+/.exec(roll?.dice ?? '')?.[0];

  if (!faces) {
    return '';
  }

  const diceCount = roll?.diceCount ?? 1;
  const bonus = roll?.bonus ?? 0;
  const signedBonus = bonus > 0 ? `+${bonus}` : `${bonus}`;
  const bonusPart = bonus === 0 ? '' : signedBonus;
  const tag = damageType ? DAMAGE_TYPE_TAGS[damageType] : undefined;

  return `${diceCount}${DAMAGE_FORMULA_DICE_SYMBOL}${faces}${bonusPart}${tag ? `@${tag}` : ''}`;
}

/**
 * Прежняя связка «кости + тип» из частей урона. Выводится только из простой
 * формулы: у сложной (с модификаторами и условиями) прежнего представления
 * нет, и старые значения остаются нетронутыми, а не стираются.
 *
 * @param weapon подформа оружия.
 * @returns урон и универсальный урон в прежней форме.
 */
export function toLegacyWeaponDamage(
  weapon: WeaponCreate,
): Pick<WeaponCreate, 'damage' | 'versatile'> {
  const [firstPart] = weapon.damageParts;
  const roll = parseSimpleDiceFormula(firstPart?.formula);

  if (!firstPart || !roll) {
    return { damage: weapon.damage, versatile: weapon.versatile };
  }

  const emptyRoll: Roll = {
    diceCount: undefined,
    dice: undefined,
    bonus: undefined,
  };

  return {
    damage: {
      roll,
      type:
        parseDamageFormulaDice(firstPart.formula)?.type || weapon.damage.type,
    },
    versatile: parseSimpleDiceFormula(firstPart.versatileFormula) ?? emptyRoll,
  };
}

/**
 * Бросок из «сырого» ответа: `null` в нём равнозначен отсутствию значения, но
 * поля формы такого не знают — приводим к `undefined` одним местом.
 *
 * @param raw бросок из ответа раздела.
 * @returns бросок формы; `undefined` — броска нет.
 */
function toRoll(raw: LoadedRoll): Roll | undefined {
  if (!raw) {
    return undefined;
  }

  return {
    diceCount: raw.diceCount ?? undefined,
    dice: raw.dice ?? undefined,
    bonus: raw.bonus ?? undefined,
  };
}

/** Схема прежнего броска: значения приходят из «сырого» ответа раздела. */
const loadedRollSchema = z
  .object({
    diceCount: z.coerce.number().nullish().catch(null),
    dice: z.string().nullish().catch(null),
    bonus: z.coerce.number().nullish().catch(null),
  })
  .nullish()
  .catch(null);

type LoadedRoll = z.infer<typeof loadedRollSchema>;

/** Схема оружия в объёме, нужном для восстановления частей урона. */
const loadedWeaponSchema = z
  .object({
    damageParts: z
      .array(
        z.object({
          formula: z.string().catch(''),
          target: z.string().nullish().catch(null),
          requiresDamage: z.boolean().nullish().catch(null),
          versatileFormula: z.string().nullish().catch(null),
        }),
      )
      .nullish()
      .catch(null),
    damage: z
      .object({
        roll: loadedRollSchema,
        type: z.string().nullish().catch(null),
      })
      .nullish()
      .catch(null),
    versatile: loadedRollSchema,
  })
  .catch({ damageParts: null, damage: null, versatile: null });

/**
 * Части урона загруженного оружия. Записи, сохранённые до частей-формул,
 * получают первую часть из прежней связки «кости + тип» — заполнять урон
 * заново не нужно.
 *
 * @param rawWeapon значение поля `weapon` из ответа раздела.
 * @returns части урона; пустой список — урона нет.
 */
function normalizeLoadedDamageParts(
  rawWeapon: unknown,
): Array<DamageFormulaPart> {
  const parsed = loadedWeaponSchema.parse(rawWeapon);

  if (parsed.damageParts?.length) {
    return parsed.damageParts.map((part) => ({
      formula: part.formula,
      target: isDamageFormulaTarget(part.target)
        ? part.target
        : DEFAULT_DAMAGE_FORMULA_TARGET,
      requiresDamage: part.requiresDamage ?? false,
      versatileFormula: part.versatileFormula ?? undefined,
    }));
  }

  const damageType = parsed.damage?.type ?? undefined;
  const formula = toDamageFormula(toRoll(parsed.damage?.roll), damageType);

  if (!formula) {
    return [];
  }

  return [
    {
      formula,
      target: DEFAULT_DAMAGE_FORMULA_TARGET,
      requiresDamage: false,
      versatileFormula:
        toDamageFormula(toRoll(parsed.versatile), damageType) || undefined,
    },
  ];
}

/**
 * Приводит «сырой» ответ раздела к состоянию формы.
 *
 * Бэкенд может вернуть подформы как `null` (или без вложенных объектов) —
 * такие значения убираем, чтобы при слиянии применились пустые заготовки и
 * форма не падала при переключении категории.
 *
 * @param raw «сырой» ответ раздела или снимок ревизии.
 * @returns состояние для слияния с пустой формой.
 */
export function normalizeLoadedItem(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  // Подформы, пришедшие как `null` или не объектом, в состояние не берём:
  // тогда при слиянии применятся пустые заготовки и форма не упадёт на
  // переключении категории.
  const subforms = Object.fromEntries(
    (['weapon', 'armor', 'tool'] as const)
      .filter((key) => isPlainObject(raw[key]))
      .map((key) => [key, raw[key]]),
  );

  const { weapon: _weapon, armor: _armor, tool: _tool, ...rest } = raw;

  const normalized: Record<string, unknown> = {
    ...rest,
    ...subforms,
    activeEffects: normalizeLoadedActiveEffects(raw.activeEffects),
  };

  if (isPlainObject(normalized.weapon)) {
    normalized.weapon = {
      ...normalized.weapon,
      damageParts: normalizeLoadedDamageParts(normalized.weapon),
    };
  }

  return normalized;
}

/** Часть урона без формулы — незаполненная строка редактора. */
function hasDamageFormula(part: DamageFormulaPart): boolean {
  return part.formula.trim().length > 0;
}

/**
 * Оружие для отправки: незаполненные части урона отбрасываются, формула
 * двуручного хвата остаётся только у первой части и только у универсального
 * оружия, прежняя связка «кости + тип» пересобирается из первой части.
 *
 * Гейт по свойству «Универсальное» — тот же, что в форме системы: без него
 * оружие, у которого свойство сняли, увозило бы на стол двуручный урон, а
 * форма его уже не показывает.
 *
 * @param weapon подформа оружия.
 * @returns оружие для запроса.
 */
function normalizeWeaponBeforeSubmit(weapon: WeaponCreate): WeaponCreate {
  const hasVersatile = weapon.properties.includes(
    WEAPON_PROPERTY_KEYS.versatile,
  );

  const damageParts = weapon.damageParts
    .filter(hasDamageFormula)
    .map((part, index) => ({
      ...part,
      formula: part.formula.trim(),
      versatileFormula:
        hasVersatile && index === 0
          ? part.versatileFormula?.trim() || undefined
          : undefined,
    }));

  const normalized: WeaponCreate = { ...weapon, damageParts };

  return { ...normalized, ...toLegacyWeaponDamage(normalized) };
}

/**
 * Состояние формы для отправки. Отправляем только подходящую категории
 * подформу: чужие данные сохранять незачем, а лист персонажа читает подформу
 * по категории предмета и на чужой посчитал бы неверные КД и атаку.
 *
 * @param state состояние формы.
 * @returns тело запроса.
 */
export function normalizeItemBeforeSubmit(state: ItemCreate): ItemCreate {
  return {
    ...state,
    weapon: normalizeWeaponBeforeSubmit(
      state.category === 'WEAPON' ? state.weapon : createEmptyWeapon(),
    ),
    armor: state.category === 'ARMOR' ? state.armor : createEmptyArmor(),
    tool: state.category === 'TOOL' ? state.tool : createEmptyTool(),
    activeEffects: normalizeActiveEffects(state.activeEffects),
  };
}
