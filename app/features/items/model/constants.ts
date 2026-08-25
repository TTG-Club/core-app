import type { SelectOption } from '~/shared/types';
import type { EffectAbility } from '~active-effects/model';

import type {
  DexterityMod,
  ItemCategory,
  ItemEquipmentCategory,
  ItemToolCategory,
  ToolProficiencyMode,
  WeaponDamageAbility,
  WeaponProficiencyMode,
  WeaponSaveEffect,
} from './create';
import type { ItemGroupRoot } from './grouping';

import { EFFECT_ABILITY_OPTIONS } from '~active-effects/model';

/** Вариант выбора со значением из закрытого набора. */
interface ItemSelectOption<Value extends string> {
  label: string;
  value: Value;
}

/**
 * Категории предмета — переключатель «что добавляем» в начале формы. Иконка и
 * пояснение у каждой: в системе D&D приложения это три разные формы, и здесь
 * выбор рода предмета должен читаться так же однозначно.
 */
export const ITEM_CATEGORY_OPTIONS: Array<{
  label: string;
  value: ItemCategory;
  description: string;
  icon: string;
}> = [
  {
    label: 'Оружие',
    value: 'WEAPON',
    description: 'Атака, урон и свойства',
    icon: 'tabler:sword',
  },
  {
    label: 'Доспех',
    value: 'ARMOR',
    description: 'Класс доспеха и требования',
    icon: 'tabler:shield',
  },
  {
    label: 'Инструмент',
    value: 'TOOL',
    description: 'Наборы и музыкальные инструменты',
    icon: 'tabler:tools',
  },
  {
    label: 'Снаряжение',
    value: 'ITEM',
    description: 'Всё прочее из списка снаряжения',
    icon: 'tabler:backpack',
  },
  {
    label: 'Транспорт',
    value: 'VEHICLE',
    description: 'Повозки, корабли и прочий транспорт',
    icon: 'tabler:sailboat',
  },
  {
    label: 'Верховое животное',
    value: 'MOUNT',
    description: 'Ездовые животные и упряжь',
    icon: 'tabler:horse',
  },
];

/** Вкладки формы предмета. */
export const ITEM_EDITOR_TABS = {
  main: 'Основное',
  compatibility: 'Совместимость',
  effects: 'Эффекты',
} as const;

/** Заголовки карточек формы. */
export const ITEM_EDITOR_SECTIONS = {
  category: 'Что добавляем',
  details: 'Подробности',
  description: 'Описание',
  images: 'Изображения',
  weaponMain: 'Основное',
  weaponProperties: 'Свойства',
  weaponRange: 'Дистанция',
  weaponAttack: 'Показатель атаки',
  weaponDamage: 'Урон',
  weaponSave: 'Спасбросок',
  weaponSpecial: 'Особое',
  armor: 'Доспех',
  tool: 'Инструмент',
  gear: 'Снаряжение',
  legacyDamage: 'Урон в прежней форме',
} as const;

/** Подписи полей формы предмета. */
export const ITEM_FORM_LABELS = {
  category: 'Категория предмета',
  categoryHint:
    'Определяет, какие боевые и игровые параметры у предмета есть: у оружия '
    + 'своя вкладка, у доспеха и инструмента — свои.',
  types: 'Типы предмета',
  typesHint: 'Ими предмет попадает в группы раздела и в фильтры',
  cost: 'Количество монет',
  costPlaceholder: 'Введи количество монет',
  coin: 'Номинал монет',
  weight: 'Вес',
  weightPlaceholder: 'Введи вес',
  description: 'Описание',
  descriptionPlaceholder: 'Введи описание',
  image: 'Основное',
  imageHint: 'Эта картинка отображается при просмотре страницы предмета',
  equipmentCategory: 'Категория снаряжения',
  equipmentCategoryUnset: 'Определить по типам предмета',
  equipmentCategoryHint:
    'Чем предмет считается на виртуальном столе. Не выбрано — выводится из '
    + 'типов предмета, как раньше.',
} as const;

/** Подписи подформы оружия. */
export const WEAPON_FORM_LABELS = {
  baseType: 'Базовое оружие',
  baseTypeUnset: 'Определить по английскому названию',
  baseTypeHint:
    'По нему лист персонажа понимает, владеет ли герой этим оружием. Не '
    + 'выбрано — выводится из английского названия.',
  category: 'Категория оружия',
  mastery: 'Приём',
  properties: 'Свойства',
  ammo: 'Тип боеприпаса',
  magazine: 'Боекомплект',
  magazineHint: 'Количество выстрелов до перезарядки (свойство «Боекомплект»)',
  magazinePlaceholder: 'Введи количество выстрелов',
  reach: 'Досягаемость',
  reachHint: 'В футах. Не задано — 5, а со свойством «Досягаемость» 10.',
  rangeNormal: 'Дистанция (нормальная)',
  rangeMax: 'Дистанция (максимальная)',
  rangePlaceholder: 'Введи дистанцию',
  attackAbility: 'Характеристика атаки',
  attackAbilityUnset: 'По правилам вида оружия',
  attackAbilityHint:
    'По правилам рукопашное оружие бьёт от Силы, дальнобойное — от Ловкости, '
    + 'фехтовальное — от большей из двух.',
  attackBonus: 'Бонус к атаке',
  proficiencyMode: 'Учёт бонуса мастерства',
  proficiencyModeUnset: 'Автоматически',
  proficiencyModeHint:
    'Автоматически — по владению героя базовым видом оружия.',
  damageEmpty:
    'Урона нет. Оружие может обходиться без него — например, наносить его '
    + 'только активным эффектом.',
  damageAbility: 'Характеристика урона',
  damageAbilityUnset: 'Как у атаки',
  damageBonus: 'Бонус к урону',
  saveType: 'Характеристика спасброска',
  saveTypeUnset: 'Спасброска нет — обычная атака',
  saveEffect: 'При успешном спасброске',
  saveEffectPlaceholder: 'Выбери исход',
  additional: 'Дополнительно',
  additionalPlaceholder: 'Дополнительная информация',
  additionalHint:
    'Оговорка правил, которую не выразить полями. Заполненная, она добавляет '
    + 'оружию свойство «Особое».',
  bonusPlaceholder: '0',
} as const;

/**
 * Свойства оружия, включающие зависимые от них поля формы. Значения — ключи
 * справочника сайта (`Property` бэкенда).
 */
export const WEAPON_PROPERTY_KEYS = {
  ammunition: 'AMMUNITION',
  magazine: 'MAGAZINE',
  versatile: 'VERSATILE',
} as const;

/** Подписи подформы инструмента. */
export const TOOL_FORM_LABELS = {
  category: 'Категория инструмента',
  categoryUnset: 'Определить по типам предмета',
  baseType: 'Базовый инструмент',
  baseTypeUnset: 'Определить по адресу страницы',
  baseTypeHint:
    'По нему лист персонажа понимает, владеет ли герой этим инструментом.',
  ability: 'Характеристика проверки',
  abilityUnset: 'По правилам проверки',
  bonus: 'Собственный бонус',
  proficiencyMode: 'Учёт владения',
  proficiencyModeUnset: 'Автоматически',
} as const;

/** Подписи вкладки прежнего представления урона. */
export const LEGACY_DAMAGE_LABELS = {
  damage: 'Урон',
  damageType: 'Тип урона',
  versatile: 'Универсальный урон',
  hint:
    'Эти поля справочник хранил до перехода на формулы. Их читают лист '
    + 'персонажа сайта и записи, сохранённые раньше, поэтому они остаются в '
    + 'базе — форма выводит их из первой части урона сама.',
  complexFormula:
    'Первая часть урона сложнее простых костей, поэтому прежние значения '
    + 'остались такими, какими были сохранены.',
} as const;

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
 * Вложенность задаёт только правило отбора (воинское рукопашное оружие — это
 * предмет с типами `MARTIAL_WEAPON` и `MELEE_WEAPON`); в списке группы идут
 * плоско, в порядке обхода дерева, а узел без своих предметов разделителя не
 * получает — поэтому подписи листьев заданы целиком.
 */
export const ITEM_GROUP_ROOTS: Array<ItemGroupRoot> = [
  {
    category: 'WEAPON',
    label: 'Оружие',
    children: [
      {
        type: 'SIMPLE_WEAPON',
        children: [
          {
            type: 'FIREARM',
            label: 'Простое огнестрельное оружие',
            children: [],
          },
          {
            type: 'FUTURISTIC',
            label: 'Простое футуристическое оружие',
            children: [],
          },
          {
            type: 'MELEE_WEAPON',
            label: 'Простое рукопашное оружие',
            children: [],
          },
          {
            type: 'RANGED_WEAPON',
            label: 'Простое дальнобойное оружие',
            children: [],
          },
        ],
      },
      {
        // Огнестрел и футуристика идут перед разделением на рукопашное и
        // дальнобойное: у них те же типы (`RANGED_WEAPON`), но своя группа —
        // иначе револьвер потерялся бы среди луков и арбалетов.
        type: 'MARTIAL_WEAPON',
        children: [
          {
            type: 'FIREARM',
            label: 'Воинское огнестрельное оружие',
            children: [],
          },
          {
            type: 'FUTURISTIC',
            label: 'Воинское футуристическое оружие',
            children: [],
          },
          {
            type: 'MELEE_WEAPON',
            label: 'Воинское рукопашное оружие',
            children: [],
          },
          {
            type: 'RANGED_WEAPON',
            label: 'Воинское дальнобойное оружие',
            children: [],
          },
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

/**
 * Базовые виды оружия — ключи справочника листа персонажа и виртуального стола
 * (`weapon-base-types.json` системы D&D). Свой список, а не словарь сайта:
 * набор базовых видов закрыт правилами, и ключ должен совпасть с тем, по
 * которому лист сверяет владение.
 */
export const WEAPON_BASE_TYPE_OPTIONS: Array<ItemSelectOption<string>> = [
  { label: 'Дубинка', value: 'club' },
  { label: 'Кинжал', value: 'dagger' },
  { label: 'Палица', value: 'greatclub' },
  { label: 'Ручной топор', value: 'handaxe' },
  { label: 'Метательное копьё', value: 'javelin' },
  { label: 'Лёгкий молот', value: 'light-hammer' },
  { label: 'Булава', value: 'mace' },
  { label: 'Боевой посох', value: 'quarterstaff' },
  { label: 'Серп', value: 'sickle' },
  { label: 'Копьё', value: 'spear' },
  { label: 'Дротик', value: 'dart' },
  { label: 'Короткий лук', value: 'shortbow' },
  { label: 'Лёгкий арбалет', value: 'light-crossbow' },
  { label: 'Праща', value: 'sling' },
  { label: 'Боевой топор', value: 'battleaxe' },
  { label: 'Цеп', value: 'flail' },
  { label: 'Глефа', value: 'glaive' },
  { label: 'Секира', value: 'greataxe' },
  { label: 'Двуручный меч', value: 'greatsword' },
  { label: 'Алебарда', value: 'halberd' },
  { label: 'Длинное копьё', value: 'lance' },
  { label: 'Длинный меч', value: 'longsword' },
  { label: 'Молот', value: 'maul' },
  { label: 'Моргенштерн', value: 'morningstar' },
  { label: 'Пика', value: 'pike' },
  { label: 'Рапира', value: 'rapier' },
  { label: 'Скимитар', value: 'scimitar' },
  { label: 'Короткий меч', value: 'shortsword' },
  { label: 'Трезубец', value: 'trident' },
  { label: 'Боевой клевец', value: 'war-pick' },
  { label: 'Боевой молот', value: 'warhammer' },
  { label: 'Кнут', value: 'whip' },
  { label: 'Духовая трубка', value: 'blowgun' },
  { label: 'Ручной арбалет', value: 'hand-crossbow' },
  { label: 'Тяжёлый арбалет', value: 'heavy-crossbow' },
  { label: 'Длинный лук', value: 'longbow' },
  { label: 'Мушкет', value: 'musket' },
  { label: 'Пистоль', value: 'pistol' },
];

/**
 * Базовые инструменты — ключи справочника листа персонажа. Свой список по той
 * же причине, что и у оружия; вдобавок притяжательная форма в адресе страницы
 * (`calligrapher-s-supplies`) с ключом листа (`calligraphers-supplies`) не
 * совпадает, и вывести один из другого нельзя.
 */
export const TOOL_BASE_TYPE_OPTIONS: Array<
  ItemSelectOption<string> & { category: ItemToolCategory }
> = [
  {
    label: 'Инструменты алхимика',
    value: 'alchemists-supplies',
    category: 'artisan',
  },
  {
    label: 'Инструменты пивовара',
    value: 'brewers-supplies',
    category: 'artisan',
  },
  {
    label: 'Инструменты каллиграфа',
    value: 'calligraphers-supplies',
    category: 'artisan',
  },
  {
    label: 'Инструменты плотника',
    value: 'carpenters-tools',
    category: 'artisan',
  },
  {
    label: 'Инструменты картографа',
    value: 'cartographers-tools',
    category: 'artisan',
  },
  {
    label: 'Инструменты сапожника',
    value: 'cobblers-tools',
    category: 'artisan',
  },
  { label: 'Инструменты повара', value: 'cooks-utensils', category: 'artisan' },
  {
    label: 'Инструменты стеклодува',
    value: 'glassblowers-tools',
    category: 'artisan',
  },
  {
    label: 'Инструменты ювелира',
    value: 'jewelers-tools',
    category: 'artisan',
  },
  {
    label: 'Инструменты кожевника',
    value: 'leatherworkers-tools',
    category: 'artisan',
  },
  {
    label: 'Инструменты каменщика',
    value: 'masons-tools',
    category: 'artisan',
  },
  {
    label: 'Инструменты художника',
    value: 'painters-supplies',
    category: 'artisan',
  },
  { label: 'Инструменты гончара', value: 'potters-tools', category: 'artisan' },
  { label: 'Инструменты кузнеца', value: 'smiths-tools', category: 'artisan' },
  {
    label: 'Инструменты ремонтника',
    value: 'tinkers-tools',
    category: 'artisan',
  },
  { label: 'Инструменты ткача', value: 'weavers-tools', category: 'artisan' },
  {
    label: 'Инструменты резчика по дереву',
    value: 'woodcarvers-tools',
    category: 'artisan',
  },
  { label: 'Набор костей', value: 'dice-set', category: 'gaming' },
  {
    label: 'Шахматы «Копьё дракона»',
    value: 'dragonchess-set',
    category: 'gaming',
  },
  {
    label: 'Набор игральных карт',
    value: 'playing-card-set',
    category: 'gaming',
  },
  {
    label: 'Набор для игры «Три дракона»',
    value: 'three-dragon-ante-set',
    category: 'gaming',
  },
  { label: 'Волынка', value: 'bagpipes', category: 'musical' },
  { label: 'Барабан', value: 'drum', category: 'musical' },
  { label: 'Цимбалы', value: 'dulcimer', category: 'musical' },
  { label: 'Флейта', value: 'flute', category: 'musical' },
  { label: 'Лютня', value: 'lute', category: 'musical' },
  { label: 'Лира', value: 'lyre', category: 'musical' },
  { label: 'Рожок', value: 'horn', category: 'musical' },
  { label: 'Флейта Пана', value: 'pan-flute', category: 'musical' },
  { label: 'Шалмей', value: 'shawm', category: 'musical' },
  { label: 'Виола', value: 'viol', category: 'musical' },
  { label: 'Набор для маскировки', value: 'disguise-kit', category: 'other' },
  {
    label: 'Набор для фальсификации',
    value: 'forgery-kit',
    category: 'other',
  },
  { label: 'Набор травника', value: 'herbalism-kit', category: 'other' },
  {
    label: 'Инструменты навигатора',
    value: 'navigators-tools',
    category: 'other',
  },
  { label: 'Набор отравителя', value: 'poisoners-kit', category: 'other' },
  { label: 'Воровские инструменты', value: 'thieves-tools', category: 'other' },
];

/** Категории инструмента (`ToolCategory` VTTG). */
export const TOOL_CATEGORY_OPTIONS: Array<ItemSelectOption<ItemToolCategory>> =
  [
    { label: 'Инструменты ремесленника', value: 'artisan' },
    { label: 'Игровые наборы', value: 'gaming' },
    { label: 'Музыкальные инструменты', value: 'musical' },
    { label: 'Прочие инструменты', value: 'other' },
  ];

/**
 * Категории снаряжения (`EquipmentCategory` VTTG) без брони: её задаёт
 * подформа доспеха своим словарём сайта.
 */
export const EQUIPMENT_CATEGORY_OPTIONS: Array<
  ItemSelectOption<ItemEquipmentCategory>
> = [
  { label: 'Снаряжение приключенца', value: 'adventurer-equipment' },
  { label: 'Безделушка', value: 'trinket' },
  { label: 'Одежда', value: 'clothing' },
  { label: 'Кольцо', value: 'ring' },
  { label: 'Жезл', value: 'wand' },
  { label: 'Чудесный предмет', value: 'wondrous' },
  { label: 'Еда', value: 'food' },
  { label: 'Снаряжение транспорта', value: 'vehicle-equipment' },
];

/**
 * Характеристики для полей оружия и инструмента. Своего словаря не заводим:
 * значения — те же полные имена вокабуляра VTTG, что и у активных эффектов.
 */
export const ITEM_ABILITY_OPTIONS: Array<ItemSelectOption<EffectAbility>> =
  EFFECT_ABILITY_OPTIONS;

/** Характеристика урона: `none` — урон без прибавки характеристики. */
export const WEAPON_DAMAGE_ABILITY_OPTIONS: Array<
  ItemSelectOption<WeaponDamageAbility>
> = [...EFFECT_ABILITY_OPTIONS, { label: 'Без характеристики', value: 'none' }];

/**
 * Режим учёта бонуса мастерства (`WeaponProficiencyMode` VTTG) без варианта
 * `auto`: он и есть «поле не задано», и в списке был бы вторым способом
 * сказать то же самое.
 */
export const WEAPON_PROFICIENCY_MODE_OPTIONS: Array<
  ItemSelectOption<WeaponProficiencyMode>
> = [
  { label: 'Учитывать', value: 'always' },
  { label: 'Не учитывать', value: 'never' },
];

/** Что происходит с уроном при успешном спасброске. */
export const WEAPON_SAVE_EFFECT_OPTIONS: Array<
  ItemSelectOption<WeaponSaveEffect>
> = [
  { label: 'Урон вдвое меньше', value: 'half' },
  { label: 'Урона нет', value: 'none' },
  { label: 'Особый исход', value: 'special' },
];

/** Режим учёта владения инструментом (`ToolProficiencyMode` VTTG) без `auto`. */
export const TOOL_PROFICIENCY_MODE_OPTIONS: Array<
  ItemSelectOption<ToolProficiencyMode>
> = [
  { label: 'Без владения', value: 'none' },
  { label: 'Половина бонуса мастерства', value: 'half' },
  { label: 'Владение', value: 'proficient' },
  { label: 'Компетенция', value: 'expertise' },
];
