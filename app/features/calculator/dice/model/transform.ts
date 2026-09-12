import type { FormulaNode } from './types';

import { DICE_MAX_COUNT } from './constants';

/** На что делится урон при сопротивлении. */
const RESISTANCE_DIVISOR = 2;

/** Во сколько раз крит увеличивает число костей урона. */
const CRITICAL_DICE_MULTIPLIER = 2;

/**
 * Удваивает кости урона — как при критическом попадании.
 *
 * Модификаторы не трогаются: по правилам крит удваивает только кости.
 * У формулы с проверкой удваивается лишь урон — бросок самой проверки
 * остаётся прежним, иначе d20 превратилась бы в 2d20.
 *
 * @param node - Корневой узел формулы
 * @returns Формула с удвоенными костями урона
 *
 * @example
 * doubleDamageDice(parseFormula('2d4 + 3')); // 4d4 + 3
 */
export function doubleDamageDice(node: FormulaNode): FormulaNode {
  switch (node.type) {
    case 'dice':
      return {
        ...node,
        count: Math.min(node.count * CRITICAL_DICE_MULTIPLIER, DICE_MAX_COUNT),
      };
    case 'binary':
      return {
        ...node,
        left: doubleDamageDice(node.left),
        right: doubleDamageDice(node.right),
      };
    case 'onHit':
      return { ...node, damage: doubleDamageDice(node.damage) };
    default:
      return node;
  }
}

/**
 * Заставляет формулу считать урон так, будто попадание критическое.
 *
 * У формулы с проверкой попадание начинает наносить крит-урон: объявленный
 * в `crit (…)` либо, если его нет, удвоенные кости. Тот же урон подставляется
 * и в саму крит-ветку — иначе натуральная 20 удвоила бы уже удвоенное.
 * У формулы без проверки крит сводится к удвоению костей.
 *
 * @param node - Корневой узел формулы
 * @returns Формула, считающая критический урон
 *
 * @example
 * forceCriticalDamage(parseFormula('2d4 + 3')); // 4d4 + 3
 */
export function forceCriticalDamage(node: FormulaNode): FormulaNode {
  if (node.type === 'onHit') {
    const critical = node.criticalDamage ?? doubleDamageDice(node.damage);

    return { ...node, damage: critical, criticalDamage: critical };
  }

  if (node.type === 'binary') {
    return {
      ...node,
      left: forceCriticalDamage(node.left),
      right: forceCriticalDamage(node.right),
    };
  }

  return doubleDamageDice(node);
}

/**
 * Делит итог формулы пополам — как при сопротивлении урону.
 * Скобки вокруг исходной формулы расставит печать: делится весь итог,
 * а не последнее слагаемое.
 *
 * @param node - Корневой узел формулы
 * @returns Формула, поделённая пополам
 *
 * @example
 * halveDamage(parseFormula('2d6 + 3')); // (2d6 + 3) / 2
 */
export function halveDamage(node: FormulaNode): FormulaNode {
  return {
    type: 'binary',
    operator: '/',
    left: node,
    right: { type: 'number', value: RESISTANCE_DIVISOR },
  };
}
