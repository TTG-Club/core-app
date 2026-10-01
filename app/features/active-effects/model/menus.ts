/**
 * Готовые меню редактора активных эффектов: «Готовые» флаги и «Готовые»
 * модификаторы. Зеркало `effectFlagMenu.ts` и `effectModifierMenu.ts` из VTTG.
 *
 * Здесь же библиотеки полей «что меняется» и «особое правило»: те же строки,
 * разложенные по разделам меню (`EFFECT_TARGET_LIBRARY`, `EFFECT_FLAG_LIBRARY`).
 *
 * Своих списков ключей здесь НЕ заводится: разделы выводятся по приставке
 * ключа из тех же справочников, что питают библиотеки полей формы
 * (`EFFECT_FLAG_LABELS`, `EFFECT_TARGET_KEY_SUGGESTIONS`,
 * `EFFECT_CONDITION_EXPR_SUGGESTIONS`). Второй список рано или поздно разошёлся
 * бы с первым, и меню предлагало бы то, чего движок не знает.
 */

import type { EffectChangeMode, EffectLibrarySuggestion } from './types';

import { ABILITY_CHECK_KEY } from './changeDice';
import {
  EFFECT_CARRIER_ARMOR_CONDITION_PREFIX,
  EFFECT_CARRIER_TYPE_CONDITION_PREFIX,
  EFFECT_CONDITION_EXPR_SUGGESTIONS,
  EFFECT_CONDITION_SECTIONS,
  EFFECT_DAMAGE_DEFENSE_KINDS,
  EFFECT_DAMAGE_TYPE_OPTIONS,
  EFFECT_FLAG_LABELS,
  EFFECT_MENU_SORT_LOCALE,
  EFFECT_STRENGTH_ATTACK_CONDITION,
  EFFECT_TARGET_KEY_SUGGESTIONS,
  EFFECT_TARGET_TYPE_CONDITION_PREFIX,
  RAGE_DAMAGE_BONUS_FORMULA,
  SAVE_VS_CONDITION_FLAG_KEYS,
  SHILLELAGH_DAMAGE_TYPE,
  SHILLELAGH_WEAPON_CONDITION,
  WEAPON_ATTACK_ABILITY_KEY,
  WEAPON_DAMAGE_DICE_KEY,
  WEAPON_DAMAGE_TYPE_KEY,
  WEAPON_SPELL_ABILITY_VALUE,
} from './constants';

/** Пункт меню флагов. */
export interface EffectFlagMenuItem {
  /** Ключ флага. */
  key: string;
  /**
   * Подпись пункта. У защит от урона — короткая (один тип урона): вид защиты
   * уже назван подписью вложенного раздела.
   */
  label: string;
}

/** Раздел меню флагов со своими пунктами и (у защит) вложенными разделами. */
export interface EffectFlagMenuGroup {
  label: string;
  items: EffectFlagMenuItem[];
  /** Вложенные разделы — второй уровень меню. */
  groups?: EffectFlagMenuGroup[];
}

/** Раздел меню флагов и его подпись; порядок — от частого к редкому. */
const EFFECT_FLAG_GROUPS = [
  { key: 'attack', label: 'Свои атаки' },
  { key: 'attacksAgainst', label: 'Атаки по носителю' },
  { key: 'abilityCheck', label: 'Проверки характеристик' },
  { key: 'saves', label: 'Спасброски' },
  { key: 'saveVsCondition', label: 'Спасброски против состояний' },
  { key: 'saveAutoFail', label: 'Автопровалы спасбросков' },
  { key: 'skills', label: 'Навыки' },
  { key: 'damageDefense', label: 'Защиты от урона' },
  { key: 'restrictions', label: 'Ограничения действий' },
  { key: 'other', label: 'Прочее' },
] as const;

/** Приставки флагов раздела «Ограничения действий». */
const RESTRICTION_FLAG_PREFIXES: readonly string[] = [
  'actions.',
  'spellcasting.',
  'concentration.',
];

/** Множество типов урона, к которым применимы защиты. */
const DEFENSIBLE_DAMAGE_TYPE_LABELS: Record<string, string> =
  Object.fromEntries(
    EFFECT_DAMAGE_TYPE_OPTIONS.map((damageType) => [
      damageType.value,
      damageType.label,
    ]),
  );

/**
 * Вид защиты от урона, заданный приставкой ключа флага.
 *
 * @param flagKey ключ флага.
 * @returns вид защиты либо `undefined` — флаг не про защиту от урона.
 */
function getDamageDefenseKind(flagKey: string): string | undefined {
  return EFFECT_DAMAGE_DEFENSE_KINDS.find((kind) =>
    flagKey.startsWith(`${kind.value}.`),
  )?.value;
}

/**
 * Раздел, к которому относится флаг. Определяется приставкой ключа — так новый
 * флаг попадает в меню сам.
 *
 * Порядок проверок важен: автопровал спасброска начинается с той же приставки
 * `save.`, что и обычные спасброски, и должен отобраться раньше.
 *
 * @param flagKey ключ флага.
 * @returns ключ раздела меню.
 */
function getFlagGroupKey(flagKey: string): string {
  if (flagKey.startsWith('save.autoFail.')) {
    return 'saveAutoFail';
  }

  // Раньше общей ветки спасбросков: приставка `save.` у них та же, а тридцать
  // позиций в одном разделе с остальными не читаются.
  if (SAVE_VS_CONDITION_FLAG_KEYS.has(flagKey)) {
    return 'saveVsCondition';
  }

  if (flagKey.startsWith('save.')) {
    return 'saves';
  }

  if (flagKey.startsWith('attacksAgainst.')) {
    return 'attacksAgainst';
  }

  if (flagKey.startsWith('attack.')) {
    return 'attack';
  }

  if (flagKey.startsWith('abilityCheck.')) {
    return 'abilityCheck';
  }

  if (flagKey.startsWith('skill.')) {
    return 'skills';
  }

  if (RESTRICTION_FLAG_PREFIXES.some((prefix) => flagKey.startsWith(prefix))) {
    return 'restrictions';
  }

  return getDamageDefenseKind(flagKey) ?? 'other';
}

/**
 * Подпись пункта: у защиты от урона — только тип урона, вид защиты назван
 * подписью вложенного раздела.
 *
 * @param flagKey ключ флага.
 * @param fullLabel подпись из справочника флагов.
 * @returns подпись пункта меню.
 */
function getFlagItemLabel(flagKey: string, fullLabel: string): string {
  const kind = getDamageDefenseKind(flagKey);

  if (!kind) {
    return fullLabel;
  }

  return (
    DEFENSIBLE_DAMAGE_TYPE_LABELS[flagKey.slice(kind.length + 1)] ?? fullLabel
  );
}

/**
 * Собирает меню флагов разделами: у защит от урона второй уровень по виду
 * защиты — сорок с лишним пунктов одним списком на экран не помещаются.
 *
 * @returns разделы меню флагов.
 */
function buildFlagMenu(): EffectFlagMenuGroup[] {
  const itemsByGroup = new Map<string, EffectFlagMenuItem[]>();

  for (const [flagKey, flagLabel] of Object.entries(EFFECT_FLAG_LABELS)) {
    const groupKey = getFlagGroupKey(flagKey);
    const items = itemsByGroup.get(groupKey) ?? [];

    items.push({ key: flagKey, label: getFlagItemLabel(flagKey, flagLabel) });
    itemsByGroup.set(groupKey, items);
  }

  return EFFECT_FLAG_GROUPS.map((group): EffectFlagMenuGroup | undefined => {
    if (group.key !== 'damageDefense') {
      const items = itemsByGroup.get(group.key) ?? [];

      return items.length > 0 ? { label: group.label, items } : undefined;
    }

    const nested = EFFECT_DAMAGE_DEFENSE_KINDS.map(
      (kind): EffectFlagMenuGroup => ({
        label: kind.label,
        items: itemsByGroup.get(kind.value) ?? [],
      }),
    ).filter((nestedGroup) => nestedGroup.items.length > 0);

    return nested.length > 0
      ? { label: group.label, items: [], groups: nested }
      : undefined;
  }).filter((group): group is EffectFlagMenuGroup => group !== undefined);
}

/** Меню флагов разделами. Считается один раз: список флагов статичен. */
export const EFFECT_FLAG_MENU: ReadonlyArray<EffectFlagMenuGroup> =
  buildFlagMenu();

/**
 * Строки библиотеки особых правил одного раздела меню; вложенные разделы (виды
 * защиты от урона) становятся разделами библиотеки сами.
 *
 * @param group раздел меню флагов.
 * @returns строки библиотеки.
 */
function buildFlagLibrarySection(
  group: EffectFlagMenuGroup,
): EffectLibrarySuggestion[] {
  return [
    // Полная подпись, а не короткая пункта меню: в поиске «Огненный» без
    // «Сопротивление» не отличить от иммунитета
    ...group.items.map((flagItem) => ({
      value: flagItem.key,
      label: EFFECT_FLAG_LABELS[flagItem.key] ?? flagItem.label,
      section: group.label,
    })),
    ...(group.groups ?? []).flatMap(buildFlagLibrarySection),
  ];
}

/**
 * Библиотека особых правил теми же разделами, что и меню «Готовые»: одна
 * раскладка на оба входа.
 */
export const EFFECT_FLAG_LIBRARY: ReadonlyArray<EffectLibrarySuggestion> =
  EFFECT_FLAG_MENU.flatMap(buildFlagLibrarySection);

/** Готовая строка модификатора: что подставится в новую строку формы. */
export interface EffectModifierPreset {
  /**
   * Ключ изменения. Пусто — пункт задаёт только условие: что менять, автор
   * называет сам (разделы «Условие: …»).
   */
  key: string;
  label: string;
  mode: EffectChangeMode;
  /** Значение строки; не задано — форма подставит своё по умолчанию. */
  value?: string;
  /**
   * Условие строки. У пункта-условия без ключа остальные поля пусты; у готовой
   * строки «Дубинки» оно идёт вместе с ключом и значением.
   */
  condition?: string;
}

/**
 * Подменю одного «что меняется» с готовыми «как»: у навыка — число, кость к
 * броску или бонус мастерства. Преимущество и помеха сюда не входят: это
 * особые правила, и у них своё меню — второй вход к тому же вёл бы к путанице.
 */
export interface EffectModifierSubmenu {
  /** Ключ того, что меняется. */
  key: string;
  /** Подпись подменю — что меняется. */
  label: string;
  /** Готовые варианты. */
  options: EffectModifierPreset[];
}

/** Пункт раздела меню: готовая строка либо подменю вариантов. */
export type EffectModifierMenuItem =
  | EffectModifierPreset
  | EffectModifierSubmenu;

/** Раздел меню модификаторов. */
export interface EffectModifierMenuGroup {
  label: string;
  items: EffectModifierMenuItem[];
}

/**
 * Пункт меню — подменю вариантов, а не готовая строка.
 *
 * @param menuItem пункт раздела меню.
 * @returns `true` для подменю.
 */
export function isEffectModifierSubmenu(
  menuItem: EffectModifierMenuItem,
): menuItem is EffectModifierSubmenu {
  return 'options' in menuItem;
}

/** Разделы меню модификаторов; порядок — от частого к редкому. */
const EFFECT_MODIFIER_GROUPS = [
  { key: 'core', label: 'Основное' },
  { key: 'senses', label: 'Чувства' },
  { key: 'movement', label: 'Скорости' },
  { key: 'abilities', label: 'Характеристики' },
  { key: 'saves', label: 'Спасброски' },
  { key: 'skills', label: 'Проверки и навыки' },
  { key: 'attack', label: 'Атака' },
  { key: 'damage', label: 'Урон' },
  { key: 'weapon', label: 'Оружие: замены' },
  { key: 'rollCondition', label: 'Условие: бросок, атака, цель' },
  { key: 'carrierType', label: 'Условие: тип носителя' },
  { key: 'carrierArmor', label: 'Условие: доспех носителя' },
  { key: 'targetType', label: 'Условие: тип цели' },
] as const;

/** Приставка ключей замены свойств оружия. */
const WEAPON_KEY_PREFIX = 'weapon.';

/**
 * Раздел, к которому относится ключ изменения. Определяется приставкой — так
 * новый ключ попадает в меню сам.
 *
 * @param changeKey ключ изменения эффекта.
 * @returns ключ раздела меню.
 */
function getModifierGroupKey(changeKey: string): string {
  if (changeKey.startsWith('ability.')) {
    return 'abilities';
  }

  if (changeKey.startsWith('save.')) {
    return 'saves';
  }

  // Все проверки характеристик — рядом с навыками: навык тоже проверка
  if (changeKey.startsWith('skill.') || changeKey === ABILITY_CHECK_KEY) {
    return 'skills';
  }

  if (changeKey.startsWith('attack.')) {
    return 'attack';
  }

  if (changeKey.startsWith('damage.')) {
    return 'damage';
  }

  if (changeKey.startsWith(WEAPON_KEY_PREFIX)) {
    return 'weapon';
  }

  if (changeKey.startsWith('movement.')) {
    return 'movement';
  }

  if (changeKey.startsWith('sense.')) {
    return 'senses';
  }

  return 'core';
}

/**
 * Режим по умолчанию для ключа: чувства и новые виды движения не складываются —
 * два источника слепого зрения дают не сумму, а большую дальность («Повысить
 * до»). Прибавка к скорости ходьбы остаётся прибавкой.
 *
 * @param changeKey ключ изменения эффекта.
 * @returns режим применения.
 */
function getDefaultModeOfKey(changeKey: string): EffectChangeMode {
  if (changeKey.startsWith('sense.')) {
    return 'upgrade';
  }

  if (changeKey.startsWith('movement.') && changeKey !== 'movement.walk') {
    return 'upgrade';
  }

  // Кость, характеристику и тип урона оружия не прибавить — только заменить
  if (changeKey.startsWith(WEAPON_KEY_PREFIX)) {
    return 'override';
  }

  return 'add';
}

/**
 * Значение по умолчанию раздела: только там, где единица выглядела бы ошибкой —
 * чувство «1 фут» или скорость полёта «1 фут».
 *
 * @param groupKey ключ раздела меню.
 * @returns значение по умолчанию либо `undefined`.
 */
function getDefaultValueOfGroup(groupKey: string): string | undefined {
  if (groupKey === 'senses') {
    return '60';
  }

  if (groupKey === 'movement') {
    return '10';
  }

  return undefined;
}

/**
 * Значения по умолчанию у ключей замены оружия: единица, которую форма
 * подставляет прочим ключам, здесь не значит ничего.
 */
const WEAPON_KEY_DEFAULT_VALUES: Readonly<Record<string, string>> = {
  [WEAPON_DAMAGE_DICE_KEY]: '1к8',
  [WEAPON_ATTACK_ABILITY_KEY]: WEAPON_SPELL_ABILITY_VALUE,
  [WEAPON_DAMAGE_TYPE_KEY]: SHILLELAGH_DAMAGE_TYPE,
};

/** Кость «Дубинки» по уровню заклинателя: к8, к10, к12, 2к6. */
const SHILLELAGH_DAMAGE_DICE =
  '(1 + steps(@level, 17))к(8 + 2 * steps(@level, 5, 11) - 6 * steps(@level, 17))';

/**
 * Комбинации, где важен не только ключ, но и значение: одним ключом их не
 * выразить. Своего раздела у них нет — каждая встаёт в конец раздела своего
 * ключа.
 */
const EFFECT_MODIFIER_READY_PRESETS: EffectModifierPreset[] = [
  {
    key: 'initiative',
    label: 'Инициатива: + бонус мастерства',
    mode: 'add',
    value: '@prof',
  },
  {
    key: 'hitPoints.max',
    label: 'Максимум хитов: за каждый уровень персонажа',
    mode: 'add',
    value: '@level',
  },
  {
    key: 'hitPoints.max',
    label: 'Максимум хитов: за каждый уровень класса',
    mode: 'add',
    value: '@classLevel',
  },
  {
    key: 'movement.fly',
    label: 'Полёт: равен скорости ходьбы',
    mode: 'upgrade',
    value: '@speed.walk',
  },
  {
    key: 'movement.climb',
    label: 'Лазание: равно скорости ходьбы',
    mode: 'upgrade',
    value: '@speed.walk',
  },
  {
    key: 'movement.swim',
    label: 'Плавание: равно скорости ходьбы',
    mode: 'upgrade',
    value: '@speed.walk',
  },
  {
    key: 'movement.fly',
    label: 'Полёт: равен скорости плавания',
    mode: 'upgrade',
    value: '@speed.swim',
  },
  {
    key: 'armorClass',
    label: 'КД: +1 в доспехе (Оборона)',
    mode: 'add',
    value: '1',
    condition: `${EFFECT_CARRIER_ARMOR_CONDITION_PREFIX}"any"`,
  },
  // Ярость 2024: +2, с 9-го уровня варвара +3, с 16-го +4 — только удары Силой
  {
    key: 'damage.melee',
    label: 'Урон Ярости: +2 → +4 по уровню класса, удары Силой',
    mode: 'add',
    value: RAGE_DAMAGE_BONUS_FORMULA,
    condition: EFFECT_STRENGTH_ATTACK_CONDITION,
  },
  {
    key: 'damage.ranged',
    label: 'Урон Ярости: то же для метательного оружия Силой',
    mode: 'add',
    value: RAGE_DAMAGE_BONUS_FORMULA,
    condition: EFFECT_STRENGTH_ATTACK_CONDITION,
  },
  {
    key: 'damage.weapon',
    label: 'Урон предмета: +1к6 огнём',
    mode: 'add',
    value: '1к6@dmg.fire',
  },
  {
    key: 'damage.all',
    label: 'Урон: +2к6 только по нежити',
    mode: 'add',
    value: '2к6@target.type.undead',
  },
  // «Дубинка»: кость растёт по уровню заклинателя — к8, к10, к12, 2к6
  {
    key: WEAPON_DAMAGE_DICE_KEY,
    label: 'Дубинка: кость к8 → 2к6 по уровню',
    mode: 'override',
    value: SHILLELAGH_DAMAGE_DICE,
    condition: SHILLELAGH_WEAPON_CONDITION,
  },
  {
    key: WEAPON_ATTACK_ABILITY_KEY,
    label: 'Дубинка: заклинательная характеристика',
    mode: 'override',
    value: WEAPON_SPELL_ABILITY_VALUE,
    condition: SHILLELAGH_WEAPON_CONDITION,
  },
  {
    key: WEAPON_DAMAGE_TYPE_KEY,
    label: 'Дубинка: силовой урон',
    mode: 'override',
    value: SHILLELAGH_DAMAGE_TYPE,
    condition: SHILLELAGH_WEAPON_CONDITION,
  },
];

/**
 * Прибавки к проверке, из которых выбирает автор. Кость — одним пунктом:
 * вычитается она той же строкой со знаком минус, и второй пункт «−1к4» был бы
 * тем же самым, только с другим числом.
 */
const CHECK_BONUS_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'Число', value: '1' },
  { label: 'Кость к броску', value: '1к4' },
  { label: 'Бонус мастерства', value: '@prof' },
];

/**
 * Подменю одной проверки: готовые прибавки.
 *
 * @param changeKey ключ проверки.
 * @param label подпись проверки из библиотеки ключей.
 * @returns подменю вариантов.
 */
function buildCheckSubmenu(
  changeKey: string,
  label: string,
): EffectModifierSubmenu {
  return {
    key: changeKey,
    label,
    options: CHECK_BONUS_OPTIONS.map((option) => ({
      key: changeKey,
      label: option.label,
      mode: 'add',
      value: option.value,
    })),
  };
}

/**
 * Порядок раздела проверок: «Все проверки» первыми, навыки — по алфавиту их
 * русских названий. Навык ищут по имени, а порядок ключей следует английским
 * названиям.
 *
 * @param menuItems пункты раздела проверок.
 * @returns пункты в порядке показа.
 */
function sortCheckItems(
  menuItems: readonly EffectModifierMenuItem[],
): EffectModifierMenuItem[] {
  return [...menuItems].sort((left, right) => {
    const isLeftFirst = left.key === ABILITY_CHECK_KEY;

    if (isLeftFirst !== (right.key === ABILITY_CHECK_KEY)) {
      return isLeftFirst ? -1 : 1;
    }

    return left.label.localeCompare(right.label, EFFECT_MENU_SORT_LOCALE);
  });
}

/**
 * Разделы библиотеки условий, из которых собран раздел меню «Условие: бросок,
 * атака, цель». Союзники рядом и защита в меню не идут: их три десятка, и
 * подменю перестало бы помещаться на экран, — они остаются в библиотеке.
 */
const ROLL_CONDITION_SECTIONS: ReadonlySet<string> = new Set([
  EFFECT_CONDITION_SECTIONS.roll,
  EFFECT_CONDITION_SECTIONS.targetHp,
  EFFECT_CONDITION_SECTIONS.targetMark,
]);

/**
 * Пункты-условия: выбор заполняет ТОЛЬКО поле условия, ключ и значение
 * остаются пустыми — что именно ограничивает условие, автор называет сам.
 *
 * Своего списка условий здесь нет: источник тот же, что и у библиотеки условий
 * формы, — второй список разошёлся бы с первым.
 *
 * @param belongsToGroup подходит ли условие в раздел меню.
 * @returns готовые строки-условия.
 */
function buildConditionPresets(
  belongsToGroup: (suggestion: EffectLibrarySuggestion) => boolean,
): EffectModifierPreset[] {
  return EFFECT_CONDITION_EXPR_SUGGESTIONS.filter(belongsToGroup).map(
    (suggestion) => ({
      key: '',
      label: suggestion.label,
      mode: 'add' as const,
      condition: suggestion.value,
    }),
  );
}

/**
 * Собирает меню модификаторов: сперва простые ключи раздела, следом готовые
 * комбинации того же раздела.
 *
 * @returns разделы меню модификаторов.
 */
function buildModifierMenu(): EffectModifierMenuGroup[] {
  const itemsByGroup = new Map<string, EffectModifierMenuItem[]>();

  for (const suggestion of EFFECT_TARGET_KEY_SUGGESTIONS) {
    const groupKey = getModifierGroupKey(suggestion.value);
    const items = itemsByGroup.get(groupKey) ?? [];

    // Проверки — подменю: «как именно лучше» у навыка несколько, и ни одно не
    // угадать за автора
    items.push(
      groupKey === 'skills'
        ? buildCheckSubmenu(suggestion.value, suggestion.label)
        : {
            key: suggestion.value,
            label: suggestion.label,
            mode: getDefaultModeOfKey(suggestion.value),
            value:
              getDefaultValueOfGroup(groupKey)
              ?? WEAPON_KEY_DEFAULT_VALUES[suggestion.value],
          },
    );

    itemsByGroup.set(groupKey, items);
  }

  itemsByGroup.set('skills', sortCheckItems(itemsByGroup.get('skills') ?? []));

  for (const preset of EFFECT_MODIFIER_READY_PRESETS) {
    const groupKey = getModifierGroupKey(preset.key);
    const items = itemsByGroup.get(groupKey) ?? [];

    items.push(preset);
    itemsByGroup.set(groupKey, items);
  }

  itemsByGroup.set(
    'rollCondition',
    buildConditionPresets((suggestion) =>
      ROLL_CONDITION_SECTIONS.has(suggestion.section),
    ),
  );

  itemsByGroup.set(
    'carrierType',
    buildConditionPresets((suggestion) =>
      suggestion.value.startsWith(EFFECT_CARRIER_TYPE_CONDITION_PREFIX),
    ),
  );

  itemsByGroup.set(
    'carrierArmor',
    buildConditionPresets((suggestion) =>
      suggestion.value.startsWith(EFFECT_CARRIER_ARMOR_CONDITION_PREFIX),
    ),
  );

  itemsByGroup.set(
    'targetType',
    buildConditionPresets((suggestion) =>
      suggestion.value.startsWith(EFFECT_TARGET_TYPE_CONDITION_PREFIX),
    ),
  );

  return EFFECT_MODIFIER_GROUPS.map((group) => ({
    label: group.label,
    items: itemsByGroup.get(group.key) ?? [],
  })).filter((group) => group.items.length > 0);
}

/** Меню модификаторов разделами. Считается один раз: списки ключей статичны. */
export const EFFECT_MODIFIER_MENU: ReadonlyArray<EffectModifierMenuGroup> =
  buildModifierMenu();

/**
 * Библиотека ключей «что меняется» по разделам меню «Готовые»: в поиске ключи
 * лежат теми же группами, что и в меню, — искать их в двух местах по разной
 * раскладке было бы вдвое труднее.
 */
export const EFFECT_TARGET_LIBRARY: ReadonlyArray<EffectLibrarySuggestion> =
  EFFECT_MODIFIER_GROUPS.flatMap((group) =>
    EFFECT_TARGET_KEY_SUGGESTIONS.filter(
      (suggestion) => getModifierGroupKey(suggestion.value) === group.key,
    ).map((suggestion) => ({ ...suggestion, section: group.label })),
  );
