/**
 * Свойства магического предмета для блока на странице раздела.
 *
 * Структуру мастерская описывает бонусами, частями урона и механикой, а
 * страница показывает её строками «название — значение». Собираем их здесь, а
 * не в шаблоне: правил хватает на несколько ветвлений, и в разметке они
 * читались бы хуже.
 */

import type { MagicItemDetailResponse } from './detail';

import {
  DAMAGE_FORMULA_DICE_SYMBOL,
  DAMAGE_TYPE_LABELS,
  parseDamageFormulaDice,
} from '~ui/damage-formula';

import {
  MAGIC_ITEM_BONUS_NONE,
  MAGIC_ITEM_PROPERTY_LABELS,
  MAGIC_ITEM_RECHARGE_EVENT_OPTIONS,
} from './constants';

/** Строка блока свойств: название и готовое к показу значение. */
export interface MagicItemPropertyRow {
  /** Ключ строки для `v-for`. */
  key: string;

  label: string;
  value: string;
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
 * @returns строки блока; пустой список — структуры у записи нет.
 */
export function getMagicItemPropertyRows(
  magicItem: MagicItemDetailResponse,
): MagicItemPropertyRow[] {
  const rows: MagicItemPropertyRow[] = [];

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
          value: getFormattedBonus(bonus.value),
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
      value: damageParts
        .map((part) => formatDamagePart(part.formula.trim()))
        .join(', '),
    });
  }

  const resource = magicItem.mechanics?.resource;
  const maxCharges = resource?.maxCharges ?? 0;

  if (maxCharges > 0) {
    rows.push({
      key: 'charges',
      label: MAGIC_ITEM_PROPERTY_LABELS.charges,
      value: String(maxCharges),
    });

    const eventLabel = getRechargeEventLabel(resource?.rechargeEvent);

    const recharge = [resource?.recharge?.trim() ?? '', eventLabel]
      .filter(Boolean)
      .join(' ');

    if (recharge) {
      rows.push({
        key: 'recharge',
        label: MAGIC_ITEM_PROPERTY_LABELS.recharge,
        value: recharge,
      });
    }

    // Расход в один заряд повторять незачем: это значение по умолчанию.
    if ((resource?.cost ?? 0) > 1) {
      rows.push({
        key: 'chargeCost',
        label: MAGIC_ITEM_PROPERTY_LABELS.chargeCost,
        value: String(resource?.cost),
      });
    }
  }

  const passive = magicItem.mechanics?.passive?.trim();

  if (passive) {
    rows.push({
      key: 'passive',
      label: MAGIC_ITEM_PROPERTY_LABELS.passive,
      value: passive,
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
      value: traits.join(', '),
    });
  }

  return rows;
}
