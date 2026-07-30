import type { SelectOption } from '~/shared/types';

import type { DexterityMod, ItemCategory } from './create';
import type { ItemGroupRoot } from './grouping';

/** Категории предмета для селектора в форме заполнения. */
export const ITEM_CATEGORY_OPTIONS: Array<
  SelectOption & { value: ItemCategory }
> = [
  { label: 'Оружие', value: 'WEAPON' },
  { label: 'Доспех', value: 'ARMOR' },
  { label: 'Прочее', value: 'ITEM' },
];

/** Ключ группы фильтров раздела с типами предметов: источник подписей групп. */
export const ITEM_TYPE_FILTER_KEY = 'itemType';

/** Ключ и подпись группы для предметов без известной категории. */
export const ITEM_OTHER_GROUP_KEY = 'OTHER';
export const ITEM_OTHER_GROUP_LABEL = 'Прочее';

/**
 * Иерархия групп раздела снаряжения. Корни — категории предмета
 * (`ItemCategory`), у которых нет своего словаря в фильтрах, поэтому подписи
 * заданы здесь. Вложенные уровни — типы предмета (`ItemType`); их подписи
 * берутся из группы фильтров `itemType`, чтобы не расходиться с фильтром.
 *
 * Порядок ветвей задаёт порядок групп в списке, а вложенность — уровень
 * разделителя: «Оружие» → «Воинское оружие» → «Рукопашное оружие».
 */
export const ITEM_GROUP_ROOTS: Array<ItemGroupRoot> = [
  {
    category: 'WEAPON',
    label: 'Оружие',
    children: [
      {
        type: 'SIMPLE_WEAPON',
        children: [
          { type: 'MELEE_WEAPON', children: [] },
          { type: 'RANGED_WEAPON', children: [] },
        ],
      },
      {
        type: 'MARTIAL_WEAPON',
        children: [
          { type: 'MELEE_WEAPON', children: [] },
          { type: 'RANGED_WEAPON', children: [] },
        ],
      },
      { type: 'FIREARM', children: [] },
      { type: 'FUTURISTIC', children: [] },
      { type: 'EXPLOSIVE', children: [] },
    ],
  },
  {
    category: 'ARMOR',
    label: 'Доспехи',
    children: [
      { type: 'LIGHT_ARMOR', children: [] },
      { type: 'MEDIUM_ARMOR', children: [] },
      { type: 'HEAVY_ARMOR', children: [] },
      { type: 'SHIELD', children: [] },
    ],
  },
  {
    category: 'ITEM',
    label: 'Снаряжение',
    children: [
      { type: 'ADVENTURING_GEAR', children: [] },
      {
        // Тип `TOOL` в разделе называется «Инструменты» и служит надмножеством
        // для остальных наборов, поэтому он же — узел для их подгрупп.
        type: 'TOOL',
        children: [
          { type: 'ARTISAN_S_TOOLS', children: [] },
          { type: 'INSTRUMENT', children: [] },
          { type: 'GAMING_SET', children: [] },
        ],
      },
      { type: 'SPELLCASTING_FOCUS', children: [] },
      { type: 'AMMUNITION', children: [] },
      { type: 'FOOD_AND_DRINK', children: [] },
      { type: 'POISON', children: [] },
      { type: 'SIEGE_EQUIPMENT', children: [] },
      { type: 'TACK_AND_HARNESS', children: [] },
    ],
  },
  {
    category: 'TOOL',
    label: 'Инструменты',
    children: [
      { type: 'ARTISAN_S_TOOLS', children: [] },
      { type: 'INSTRUMENT', children: [] },
      { type: 'GAMING_SET', children: [] },
    ],
  },
  {
    category: 'VEHICLE',
    label: 'Транспорт',
    children: [
      { type: 'VEHICLE_LAND', children: [] },
      { type: 'VEHICLE_WATER', children: [] },
      { type: 'VEHICLE_AIR', children: [] },
    ],
  },
  {
    category: 'MOUNT',
    label: 'Верховые животные',
    children: [{ type: 'TACK_AND_HARNESS', children: [] }],
  },
];

/** Варианты добавления модификатора Ловкости к классу доспеха. */
export const DEXTERITY_MOD_OPTIONS: Array<
  SelectOption & { value: DexterityMod }
> = [
  { label: '+ модификатор Ловкости', value: 'PLUS' },
  { label: '+ модификатор Ловкости (максимум +2)', value: 'PLUS_MAX_2' },
  { label: 'Без модификатора Ловкости', value: 'NONE' },
];
