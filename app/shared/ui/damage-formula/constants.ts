/**
 * Словарь токенов формулы урона/лечения VTTG. Один на всё, что такие формулы
 * пишет: части урона заклинания и части урона активного эффекта.
 *
 * Зеркало `DamagePartRow.vue` + `CREATURE_CATEGORIES` из системы D&D.
 */

import type { DamageFormulaTarget } from './part';

/** Приставка токена формулы. */
export const DAMAGE_FORMULA_TAG_PREFIX = '@';

/** Арифметический разделитель слагаемых. */
export const DAMAGE_FORMULA_SEPARATOR = '+';

/** Символ кости в формуле (русская «к»). */
export const DAMAGE_FORMULA_DICE_SYMBOL = 'к';

/** Вкладка-помощник ввода формулы: имя слота `UTabs`. */
export type DamageFormulaToolSlot =
  | 'modifiers'
  | 'dice'
  | 'damageTypes'
  | 'healing'
  | 'conditions'
  | 'creatureTypes';

interface DamageFormulaTag {
  label: string;
  value: string;
}

/** Кости, доступные кнопками. */
export const DAMAGE_FORMULA_DICE: Array<{ label: string; value: number }> = [
  { label: 'к4', value: 4 },
  { label: 'к6', value: 6 },
  { label: 'к8', value: 8 },
  { label: 'к10', value: 10 },
  { label: 'к12', value: 12 },
  { label: 'к20', value: 20 },
];

/** Модификаторы — отдельные слагаемые формулы. */
export const DAMAGE_FORMULA_MODIFIER_TAGS: Array<DamageFormulaTag> = [
  { label: 'Заклинание (@mod.spell)', value: 'mod.spell' },
  { label: 'Сила (@mod.str)', value: 'mod.str' },
  { label: 'Ловкость (@mod.dex)', value: 'mod.dex' },
  { label: 'Телосложение (@mod.con)', value: 'mod.con' },
  { label: 'Интеллект (@mod.int)', value: 'mod.int' },
  { label: 'Мудрость (@mod.wis)', value: 'mod.wis' },
  { label: 'Харизма (@mod.cha)', value: 'mod.cha' },
  { label: 'Мастерство (@prof)', value: 'prof' },
  { label: 'Уровень (@level)', value: 'level' },
];

/**
 * Вид части задаётся ТОЛЬКО токеном лечения: он помечает своё слагаемое и все
 * последующие без собственного токена.
 */
export const DAMAGE_FORMULA_HEALING_TAGS: Array<DamageFormulaTag> = [
  { label: 'Лечение (@heal)', value: 'heal' },
  { label: 'Временные ХП (@heal.temp)', value: 'heal.temp' },
];

/** Условия по хитам цели: слагаемое достаётся только подходящей цели. */
export const DAMAGE_FORMULA_CONDITION_TAGS: Array<DamageFormulaTag> = [
  { label: 'Полное HP (@target.full)', value: 'target.full' },
  { label: 'Неполное HP (@target.notFull)', value: 'target.notFull' },
];

/**
 * Типы существ для токена `@target.type.<тип>`: слагаемое достаётся только
 * целям названного типа.
 *
 * Свой список, а не словарь бестиария сайта: там ключи другие (`SLIME`, пять
 * видов `SWARM_OF_*`), а токену нужен ровно тип существа VTTG.
 */
export const DAMAGE_FORMULA_CREATURE_TYPE_TAGS: Array<DamageFormulaTag> = [
  { label: 'Аберрация', value: 'target.type.aberration' },
  { label: 'Зверь', value: 'target.type.beast' },
  { label: 'Небожитель', value: 'target.type.celestial' },
  { label: 'Конструкт', value: 'target.type.construct' },
  { label: 'Дракон', value: 'target.type.dragon' },
  { label: 'Элементаль', value: 'target.type.elemental' },
  { label: 'Фея', value: 'target.type.fey' },
  { label: 'Исчадие', value: 'target.type.fiend' },
  { label: 'Великан', value: 'target.type.giant' },
  { label: 'Гуманоид', value: 'target.type.humanoid' },
  { label: 'Чудовище', value: 'target.type.monstrosity' },
  { label: 'Слизь', value: 'target.type.ooze' },
  { label: 'Растение', value: 'target.type.plant' },
  { label: 'Нежить', value: 'target.type.undead' },
  { label: 'Рой', value: 'target.type.swarm' },
];

/** Подписи вкладок и полей редактора формулы. */
export const DAMAGE_FORMULA_LABELS = {
  formula: 'Формула',
  formulaPlaceholder: 'Например: 8к6@dmg.fire',
  modifiers: 'Добавить мод',
  dice: 'Кости',
  damageTypes: 'Тип урона',
  healing: 'Лечение',
  conditions: 'Условия',
  creatureTypes: 'Тип существ',
} as const;

/**
 * Ключ типа урона справочника сайта → токен формулы VTTG. Справочник отдаёт
 * `FIRE`, а формуле нужен `dmg.fire`; перевод живёт здесь, у знающей оба
 * словаря стороны.
 *
 * Ключ `FAIR` — прежнее имя огненного урона: встречается в данных до
 * переименования.
 */
export const DAMAGE_TYPE_TAGS: Record<string, string> = {
  ACID: 'dmg.acid',
  BLUDGEONING: 'dmg.bludgeoning',
  COLD: 'dmg.cold',
  FAIR: 'dmg.fire',
  FIRE: 'dmg.fire',
  FORCE: 'dmg.force',
  LIGHTNING: 'dmg.lightning',
  NECROTIC: 'dmg.necrotic',
  PIERCING: 'dmg.piercing',
  POISON: 'dmg.poison',
  PSYCHIC: 'dmg.psychic',
  RADIANT: 'dmg.radiant',
  SLASHING: 'dmg.slashing',
  THUNDER: 'dmg.thunder',
};

/**
 * Ключ типа урона справочника сайта → его русское название. Живёт рядом с
 * {@link DAMAGE_TYPE_TAGS}: набор ключей у них один, и разъехаться они не должны.
 * Отдельной картой, а не запросом словаря — разбор формулы синхронный, и подпись
 * нужна там же, где она разбирается.
 */
export const DAMAGE_TYPE_LABELS: Record<string, string> = {
  ACID: 'Кислотный',
  BLUDGEONING: 'Дробящий',
  COLD: 'Холодный',
  FAIR: 'Огненный',
  FIRE: 'Огненный',
  FORCE: 'Силовое поле',
  LIGHTNING: 'Электрический',
  NECROTIC: 'Некротический',
  PIERCING: 'Колющий',
  POISON: 'Ядовитый',
  PSYCHIC: 'Психический',
  RADIANT: 'Излучение',
  SLASHING: 'Рубящий',
  THUNDER: 'Звуковой',
};

/**
 * Цель части урона. Значения — словарь VTTG (`DamagePartTarget`); в формулу
 * они не пишутся, а хранятся рядом с ней.
 */
export const DAMAGE_FORMULA_TARGET_OPTIONS: Array<{
  label: string;
  value: DamageFormulaTarget;
}> = [
  { label: 'Выбранная цель', value: 'selected' },
  { label: 'На себя', value: 'self' },
  { label: 'Указать отдельно', value: 'choose' },
];

/** Подписи строки части урона в редакторе — зеркало `DAMAGE_PART_LABELS` VTTG. */
export const DAMAGE_PART_LABELS = {
  partPrefix: 'Часть ',
  formula: 'Формула',
  formulaPlaceholder: 'Например: 8к6@dmg.fire',
  target: 'Цель',
  onlyIfDamaged: 'Только если нанесён урон',
  onlyIfDamagedHint:
    'Часть применится, только если урон по цели действительно прошёл — '
    + '«лечусь, лишь когда задел врага».',
  addPart: 'Добавить часть',
  remove: 'Удалить часть',
  versatile: 'Урон двуручным хватом',
  versatileHint:
    'Заменяет формулу части, когда оружие держат двумя руками — свойство '
    + '«Универсальное».',
} as const;
