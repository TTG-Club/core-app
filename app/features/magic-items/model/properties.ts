/**
 * Свойства магического предмета для блока на странице раздела.
 *
 * Структуру мастерская описывает бонусами, частями урона и механикой, а
 * страница показывает её строками «название — значение». Собираем их здесь, а
 * не в шаблоне: правил хватает на несколько ветвлений, и в разметке они
 * читались бы хуже.
 */

import type { MagicItemBaseWeapon } from './base-weapon';
import type { MagicItemDetailResponse } from './detail';

import { uniq } from 'es-toolkit';

import {
  DAMAGE_FORMULA_DICE_SYMBOL,
  DAMAGE_TYPE_LABELS,
  describeDamageFormulaCreatureTypes,
  listDamageFormulaCreatureTypes,
  parseDamageFormulaDice,
} from '~ui/damage-formula';

import {
  MAGIC_ITEM_BONUS_NONE,
  MAGIC_ITEM_PROPERTY_LABELS,
  MAGIC_ITEM_PROPERTY_PHRASES,
  MAGIC_ITEM_RECHARGE_EVENT_OPTIONS,
} from './constants';

/** Строка блока свойств: название и готовое к показу значение. */
export interface MagicItemPropertyRow {
  /** Ключ строки для `v-for`. */
  key: string;

  label: string;

  /**
   * Значение по строкам. Почти у всех свойств строка одна; у дополнительного
   * урона их столько, сколько разных бросков.
   */
  lines: Array<string>;
}

/** Бросок дополнительного урона и те, кому он достаётся. */
interface ExtraDamageCaption {
  /** Урон словами: «2к6 Излучение». */
  damageLabel: string;
  /** Ключи типов существ; пусто — урон достаётся любой цели. */
  creatureTypes: Array<string>;
}

/**
 * Часть урона в читаемом виде: «2к6 Огненный». Формулу сложнее простых костей
 * разобрать нельзя — такую показываем как есть, чтобы не потерять её вовсе.
 *
 * @param formula формула части урона.
 * @returns подпись части урона.
 */
function formatDamagePart(formula: string): string {
  const dice = parseDamageFormulaDice(formula);

  if (!dice) {
    return formula;
  }

  const notation = `${dice.diceCount}${DAMAGE_FORMULA_DICE_SYMBOL}${dice.diceFaces}`;
  const bonus = dice.bonus === 0 ? '' : getFormattedBonus(dice.bonus);

  return [`${notation}${bonus}`, DAMAGE_TYPE_LABELS[dice.type] ?? '']
    .filter(Boolean)
    .join(' ');
}

/**
 * Подпись части дополнительного урона. Типы существ читаются только у формулы
 * из простых костей: сложную показываем как есть, и её токены видны сами.
 *
 * @param formula формула части урона.
 * @returns урон словами и типы существ, которым он достаётся.
 */
function toExtraDamageCaption(formula: string): ExtraDamageCaption {
  return {
    damageLabel: formatDamagePart(formula),
    creatureTypes: parseDamageFormulaDice(formula)
      ? listDamageFormulaCreatureTypes(formula)
      : [],
  };
}

/**
 * Один ли это урон по разным типам существ. Урон любой цели не склеивается:
 * две такие части — это действительно два броска.
 *
 * @param firstCaption подпись части урона.
 * @param secondCaption подпись другой части урона.
 * @returns `true`, если урон совпал и обе части ограничены типом существа.
 */
function isSameTypedDamage(
  firstCaption: ExtraDamageCaption,
  secondCaption: ExtraDamageCaption,
): boolean {
  return (
    firstCaption.damageLabel === secondCaption.damageLabel
    && firstCaption.creatureTypes.length > 0
    && secondCaption.creatureTypes.length > 0
  );
}

/**
 * Склеивает одинаковый урон по разным типам существ в одну подпись: «2к6
 * излучением по исчадиям» и «2к6 излучением по нежити» — это один бросок, а не
 * два, и двумя строками он читался бы как 4к6.
 *
 * @param captions подписи частей урона в порядке частей.
 * @returns подписи без повторов одного урона по типам существ.
 */
function mergeExtraDamageCaptions(
  captions: Array<ExtraDamageCaption>,
): Array<ExtraDamageCaption> {
  return captions.reduce<Array<ExtraDamageCaption>>(
    (mergedCaptions, caption) => {
      const hasSameDamage = mergedCaptions.some((mergedCaption) =>
        isSameTypedDamage(mergedCaption, caption),
      );

      if (!hasSameDamage) {
        return [...mergedCaptions, caption];
      }

      return mergedCaptions.map((mergedCaption) =>
        isSameTypedDamage(mergedCaption, caption)
          ? {
              ...mergedCaption,
              creatureTypes: uniq([
                ...mergedCaption.creatureTypes,
                ...caption.creatureTypes,
              ]),
            }
          : mergedCaption,
      );
    },
    [],
  );
}

/**
 * Строки дополнительного урона: «2к6 Излучение — по исчадиям и нежити».
 *
 * @param formulas формулы частей урона.
 * @returns по строке на каждый разный бросок.
 */
function getExtraDamageLines(formulas: Array<string>): Array<string> {
  return mergeExtraDamageCaptions(formulas.map(toExtraDamageCaption)).map(
    (caption) =>
      [
        caption.damageLabel,
        describeDamageFormulaCreatureTypes(caption.creatureTypes),
      ]
        .filter(Boolean)
        .join(MAGIC_ITEM_PROPERTY_PHRASES.recipientJoiner),
  );
}

/**
 * Основной урон немагической основы: «1к6 Дробящий (Булава)», у универсального
 * оружия — «1к8 Рубящий, двумя руками 1к10 Рубящий (Длинный меч)».
 *
 * @param baseWeapon урон основы.
 * @returns значение строки основного урона.
 */
function formatBaseWeaponDamage(baseWeapon: MagicItemBaseWeapon): string {
  const versatileDamage = baseWeapon.versatileFormula
    ? `${MAGIC_ITEM_PROPERTY_PHRASES.versatilePrefix}${formatDamagePart(baseWeapon.versatileFormula)}`
    : '';

  const damageLabel = [
    formatDamagePart(baseWeapon.damageFormula),
    versatileDamage,
  ]
    .filter(Boolean)
    .join(MAGIC_ITEM_PROPERTY_PHRASES.listJoiner);

  return baseWeapon.name
    ? `${damageLabel}${MAGIC_ITEM_PROPERTY_PHRASES.baseNamePrefix}${baseWeapon.name}${MAGIC_ITEM_PROPERTY_PHRASES.baseNameSuffix}`
    : damageLabel;
}

/** Название события восстановления зарядов; '' — событие не задано. */
function getRechargeEventLabel(event: string | undefined): string {
  return (
    MAGIC_ITEM_RECHARGE_EVENT_OPTIONS.find((option) => option.value === event)
      ?.label ?? ''
  );
}

/**
 * Строки блока свойств магического предмета.
 *
 * @param magicItem деталь магического предмета.
 * @param baseWeapon урон немагической основы; без него основы нет или она ещё
 *   не загружена.
 * @returns строки блока; пустой список — структуры у записи нет.
 */
export function getMagicItemPropertyRows(
  magicItem: MagicItemDetailResponse,
  baseWeapon?: MagicItemBaseWeapon,
): MagicItemPropertyRow[] {
  const rows: MagicItemPropertyRow[] = [];

  // Основа идёт первой: бонусы и дополнительный урон ложатся поверх неё.
  if (baseWeapon) {
    rows.push({
      key: 'baseDamage',
      label: MAGIC_ITEM_PROPERTY_LABELS.baseDamage,
      lines: [formatBaseWeaponDamage(baseWeapon)],
    });
  }

  const bonuses = magicItem.bonuses;

  if (bonuses) {
    const bonusRows = [
      {
        key: 'attack',
        label: MAGIC_ITEM_PROPERTY_LABELS.attack,
        value: bonuses.attack,
      },
      {
        key: 'damage',
        label: MAGIC_ITEM_PROPERTY_LABELS.damage,
        value: bonuses.damage,
      },
      {
        key: 'armorClass',
        label: MAGIC_ITEM_PROPERTY_LABELS.armorClass,
        value: bonuses.armorClass,
      },
    ];

    for (const bonus of bonusRows) {
      if (bonus.value !== MAGIC_ITEM_BONUS_NONE) {
        rows.push({
          key: bonus.key,
          label: bonus.label,
          lines: [getFormattedBonus(bonus.value)],
        });
      }
    }
  }

  const damageParts = (magicItem.damageParts ?? []).filter((part) =>
    part.formula.trim(),
  );

  if (damageParts.length) {
    rows.push({
      key: 'extraDamage',
      label: MAGIC_ITEM_PROPERTY_LABELS.extraDamage,
      lines: getExtraDamageLines(
        damageParts.map((damagePart) => damagePart.formula.trim()),
      ),
    });
  }

  const resource = magicItem.mechanics?.resource;
  const maxCharges = resource?.maxCharges ?? 0;

  if (maxCharges > 0) {
    rows.push({
      key: 'charges',
      label: MAGIC_ITEM_PROPERTY_LABELS.charges,
      lines: [String(maxCharges)],
    });

    const eventLabel = getRechargeEventLabel(resource?.rechargeEvent);

    const recharge = [resource?.recharge?.trim() ?? '', eventLabel]
      .filter(Boolean)
      .join(' ');

    if (recharge) {
      rows.push({
        key: 'recharge',
        label: MAGIC_ITEM_PROPERTY_LABELS.recharge,
        lines: [recharge],
      });
    }

    // Расход в один заряд повторять незачем: это значение по умолчанию.
    if ((resource?.cost ?? 0) > 1) {
      rows.push({
        key: 'chargeCost',
        label: MAGIC_ITEM_PROPERTY_LABELS.chargeCost,
        lines: [String(resource?.cost)],
      });
    }
  }

  const passive = magicItem.mechanics?.passive?.trim();

  if (passive) {
    rows.push({
      key: 'passive',
      label: MAGIC_ITEM_PROPERTY_LABELS.passive,
      lines: [passive],
    });
  }

  const traits = [
    magicItem.focus ? MAGIC_ITEM_PROPERTY_LABELS.focus : '',
    magicItem.adamantine ? MAGIC_ITEM_PROPERTY_LABELS.adamantine : '',
  ].filter(Boolean);

  if (traits.length) {
    rows.push({
      key: 'traits',
      label: MAGIC_ITEM_PROPERTY_LABELS.traits,
      lines: [traits.join(MAGIC_ITEM_PROPERTY_PHRASES.listJoiner)],
    });
  }

  return rows;
}
