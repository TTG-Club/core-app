import type {
  CheckFormulaNode,
  CheckOutcome,
  CheckRollPart,
  DiceFormulaNode,
  DiceRollPart,
  FormulaNode,
  RolledFace,
  RollMode,
  RollPart,
} from './types';

import { D20_SIDES } from './constants';
import { applyOperator } from './operators';
import { doubleDamageDice } from './transform';

/**
 * Что нужно собрать по ходу броска: подробный разбор для показа
 * и исход первой проверки для оценки шансов.
 */
interface RollContext {
  parts: RollPart[] | null;
  firstOutcome: CheckOutcome | null;
}

/** Итог броска формулы вместе с разбором по костям. */
interface FormulaRoll {
  value: number;
  parts: RollPart[];
}

/**
 * Бросает одну кость с указанным числом граней.
 *
 * @param sides - Число граней
 * @returns Выпавшее значение от 1 до числа граней
 */
function rollDie(sides: number): number {
  return 1 + Math.floor(Math.random() * sides);
}

/**
 * Собирает короткую подпись броска костей: `4d6kh3`, `d20r1`.
 *
 * @param node - Узел броска костей
 * @returns Подпись для разбора результата
 */
function createDiceLabel(node: DiceFormulaNode): string {
  const count = node.count > 1 ? String(node.count) : '';

  const keep = node.keep
    ? `k${node.keep.kind === 'highest' ? 'h' : 'l'}${node.keep.amount}`
    : '';

  const reroll = node.reroll ? `r${node.reroll}` : '';

  return `${count}d${node.sides}${keep}${reroll}`;
}

/**
 * Бросает группу костей с учётом переброса и правила `kh` / `kl`.
 *
 * @param node - Узел броска костей
 * @returns Сумма учтённых костей и разбор группы для показа
 */
function rollDicePart(node: DiceFormulaNode): {
  sum: number;
  part: DiceRollPart;
} {
  // Показать нужно все грани, включая переброшенные, а считать — только
  // живые, поэтому списка два. Хранятся ссылки на сами грани, а не индексы:
  // грани создаются здесь же и наружу до конца функции не видны.
  const faces: RolledFace[] = [];
  const activeFaces: RolledFace[] = [];

  for (let index = 0; index < node.count; index += 1) {
    let value = rollDie(node.sides);

    if (node.reroll && value <= node.reroll) {
      faces.push({ value, dropped: true, rerolled: true });
      value = rollDie(node.sides);
    }

    const face: RolledFace = { value, dropped: false, rerolled: false };

    faces.push(face);
    activeFaces.push(face);
  }

  let keptFaces = activeFaces;

  if (node.keep) {
    const sorted = [...activeFaces].sort(
      (left, right) => right.value - left.value,
    );

    keptFaces =
      node.keep.kind === 'highest'
        ? sorted.slice(0, node.keep.amount)
        : sorted.slice(sorted.length - node.keep.amount);

    const kept = new Set(keptFaces);

    for (const face of activeFaces) {
      if (!kept.has(face)) {
        face.dropped = true;
      }
    }
  }

  const sum = keptFaces.reduce((total, face) => total + face.value, 0);

  return {
    sum,
    part: {
      type: 'dice',
      sides: node.sides,
      label: createDiceLabel(node),
      faces,
    },
  };
}

/**
 * Находит натуральное значение d20 в разборе броска.
 * Это первая группа двадцатигранников; у `2d20kh1` учитывается оставшаяся кость.
 *
 * @param parts - Разбор броска проверки
 * @returns Натуральное значение либо null, если d20 в броске не было
 */
function findNaturalD20(parts: RollPart[]): number | null {
  for (const part of parts) {
    if (part.type !== 'dice' || part.sides !== D20_SIDES) {
      continue;
    }

    return part.faces
      .filter((face) => !face.dropped)
      .reduce((total, face) => total + face.value, 0);
  }

  return null;
}

/**
 * Определяет исход проверки. Против КД натуральная 20 всегда даёт крит,
 * а натуральная 1 — промах, независимо от суммы.
 *
 * @param node - Узел проверки
 * @param total - Итог броска проверки
 * @param natural - Натуральное значение d20 либо null
 * @returns Исход проверки
 */
function resolveOutcome(
  node: CheckFormulaNode,
  total: number,
  natural: number | null,
): CheckOutcome {
  if (node.kind === 'armorClass' && natural === D20_SIDES) {
    return 'critical';
  }

  if (node.kind === 'armorClass' && natural === 1) {
    return 'miss';
  }

  return total >= node.target ? 'hit' : 'miss';
}

/**
 * Считает значение узла формулы, попутно наполняя разбор броска.
 *
 * @param node - Узел формулы
 * @param context - Накопитель разбора и исхода первой проверки
 * @returns Числовой итог узла
 */
function rollNode(node: FormulaNode, context: RollContext): number {
  switch (node.type) {
    case 'number':
      return node.value;
    case 'dice': {
      const { sum, part } = rollDicePart(node);

      context.parts?.push(part);

      return sum;
    }
    case 'check':
      return rollCheck(node, context).outcome === 'miss' ? 0 : 1;
    case 'onHit': {
      const { outcome } = rollCheck(node.check, context);

      // При `save half` бросок делает цель: удачный спасбросок снимает
      // половину урона, проваленный оставляет полный.
      if (node.saveHalf) {
        const damage = rollNode(node.damage, context);

        return outcome === 'miss' ? damage : Math.floor(damage / 2);
      }

      if (outcome === 'miss') {
        return 0;
      }

      // Без явного `crit (…)` крит удваивает кости урона — как в правилах.
      // Клауза нужна лишь там, где крит-урон к удвоению не сводится.
      if (outcome === 'critical') {
        return rollNode(
          node.criticalDamage ?? doubleDamageDice(node.damage),
          context,
        );
      }

      return rollNode(node.damage, context);
    }
    case 'binary':
    default:
      return applyOperator(
        node.operator,
        rollNode(node.left, context),
        rollNode(node.right, context),
      );
  }
}

/**
 * Выполняет проверку против СЛ или КД и дописывает её в разбор броска.
 *
 * @param node - Узел проверки
 * @param context - Накопитель разбора и исхода первой проверки
 * @returns Итог броска проверки и её исход
 */
function rollCheck(
  node: CheckFormulaNode,
  context: RollContext,
): { total: number; outcome: CheckOutcome } {
  const localParts: RollPart[] = [];
  const total = rollNode(node.roll, { ...context, parts: localParts });
  const natural = findNaturalD20(localParts);
  const outcome = resolveOutcome(node, total, natural);

  if (context.firstOutcome === null) {
    context.firstOutcome = outcome;
  }

  if (context.parts) {
    const checkPart: CheckRollPart = {
      type: 'check',
      kind: node.kind,
      target: node.target,
      total,
      natural,
      outcome,
    };

    context.parts.push(...localParts, checkPart);
  }

  return { total, outcome };
}

/**
 * Бросает формулу и собирает подробный разбор по костям и проверкам.
 *
 * Голая проверка вида `d20 + 5 КД 15` сама по себе даёт 0 или 1,
 * поэтому результатом показывается сумма самого броска.
 *
 * @param node - Корневой узел формулы
 * @returns Итог броска и его разбор
 */
export function rollFormula(node: FormulaNode): FormulaRoll {
  const parts: RollPart[] = [];
  const value = rollNode(node, { parts, firstOutcome: null });

  if (node.type === 'check') {
    const check = parts.find((part) => part.type === 'check');

    if (check) {
      return { value: check.total, parts };
    }
  }

  return { value, parts };
}

/**
 * Быстро бросает формулу без сбора разбора — для оценки шансов.
 *
 * @param node - Корневой узел формулы
 * @returns Итог броска и исход первой проверки, если она была
 */
export function simulateFormula(node: FormulaNode): {
  value: number;
  outcome: CheckOutcome | null;
} {
  const context: RollContext = { parts: null, firstOutcome: null };
  const value = rollNode(node, context);

  return { value, outcome: context.firstOutcome };
}

/**
 * Превращает каждую одиночную d20 формулы в бросок с преимуществом или помехой.
 * Кости с заданным вручную `kh` / `kl` не трогаются.
 *
 * @param node - Корневой узел формулы
 * @param mode - Режим броска либо null
 * @returns Изменённая формула и признак того, что режим на что-то повлиял
 */
export function applyRollMode(
  node: FormulaNode,
  mode: RollMode | null,
): { node: FormulaNode; changed: boolean } {
  if (!mode) {
    return { node, changed: false };
  }

  let changed = false;

  const walk = (current: FormulaNode): FormulaNode => {
    switch (current.type) {
      case 'dice': {
        if (
          current.sides !== D20_SIDES
          || current.count !== 1
          || current.keep
        ) {
          return current;
        }

        changed = true;

        return {
          type: 'dice',
          count: 2,
          sides: D20_SIDES,
          keep: {
            kind: mode === 'advantage' ? 'highest' : 'lowest',
            amount: 1,
          },
          reroll: current.reroll,
        };
      }
      case 'binary':
        return {
          ...current,
          left: walk(current.left),
          right: walk(current.right),
        };
      case 'check':
        return { ...current, roll: walk(current.roll) };
      case 'onHit': {
        const check = walk(current.check);

        return check.type === 'check' ? { ...current, check } : current;
      }
      default:
        return current;
    }
  };

  return { node: walk(node), changed };
}
