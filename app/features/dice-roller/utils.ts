import type {
  CriticalType,
  DiceDetail,
  DiceRollItem,
} from '~dice-roller/types';

/**
 * Проверяет, является ли значение объектом (не null).
 * @param value - Проверяемое значение.
 * @returns True, если значение — объект и не null.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

interface DieNode {
  type: 'die';
  order?: number;
  value?: number;
  rolls?: Array<{
    value?: number;
    valid?: boolean;
    critical?: CriticalType | undefined;
  }>;
  count?: { value?: number };
  die?: { type?: string; value?: number };
  label?: string;
}

/**
 * Проверяет, является ли узел узлом кости (die).
 * @param node - Проверяемый узел.
 * @returns True, если это узел кости.
 */
function isDieNode(node: unknown): node is DieNode {
  if (!isObject(node)) {
    return false;
  }

  const { type, rolls } = node;

  return type === 'die' && Array.isArray(rolls);
}

/**
 * Извлекает массив костей из узла.
 * @param node - Узел для извлечения.
 * @returns Массив узлов костей или null.
 */
function getDiceArray(node: unknown): unknown[] | null {
  if (isObject(node) && Array.isArray(node.dice)) {
    return node.dice as unknown[];
  }

  return null;
}

/**
 * Извлекает выражение (expr) из узла.
 * @param node - Узел для извлечения.
 * @returns Выражение или null.
 */
function getExpr(node: unknown): unknown | null {
  if (isObject(node) && 'expr' in node) {
    return node.expr ?? null;
  }

  return null;
}

/**
 * Формирует строковое описание броска кости на основе его свойств.
 * @param roll - Объект броска с количеством, типом кости и меткой.
 * @param index - Индекс броска в последовательности.
 * @returns Строковое описание броска (например, "2к6").
 */
export function describeDie(
  roll: {
    count?: { value?: number };
    die?: { type?: string; value?: number };
    label?: string;
  },
  index: number,
): string {
  const countValue = roll.count?.value;
  const dieType = roll.die?.type;

  let suffix = '?';

  if (dieType === 'fate') {
    suffix = 'кс';
  } else if (dieType === 'number') {
    const dieValue = roll.die?.value;

    if (dieValue === 100) {
      suffix = 'к100';
    } else if (typeof dieValue === 'number') {
      suffix = `к${dieValue}`;
    }
  }

  if (suffix === '?' && roll.label) {
    return roll.label.replace(/d%/i, 'к100').replace('%', '100');
  }

  if (typeof countValue === 'number') {
    return `${countValue}${suffix}`;
  }

  return `Бросок ${index + 1}`;
}

/**
 * Извлекает детализированную информацию из объекта результата броска.
 * @param roll - Объект с результатом броска.
 * @returns Массив объектов DiceDetail.
 */
export function extractRollDetails(roll: unknown): DiceDetail[] {
  const details: DiceDetail[] = [];

  const traverse = (node: unknown, index: string | number = 0) => {
    if (!isObject(node)) {
      return;
    }

    if (isDieNode(node)) {
      details.push({
        id: `${index}-${node.order}`,
        label: describeDie(node, details.length),
        total: node.value ?? 0,
        rolls: (node.rolls ?? []).map(
          (item, rollIndex: number): DiceRollItem => ({
            id: `${index}-${rollIndex}`,
            value: item?.value ?? 0,
            valid: Boolean(item?.valid),
            critical: (item?.critical as CriticalType | undefined) ?? null,
          }),
        ),
      });

      return;
    }

    const diceList = getDiceArray(node);

    if (diceList) {
      diceList.forEach((child: unknown, childIndex: number) =>
        traverse(child, `${index}-${childIndex}`),
      );
    }

    const expr = getExpr(node);

    if (expr) {
      traverse(expr, `${index}-expr`);
    }
  };

  traverse(roll);

  return details;
}

/**
 * Форматирует краткую сводку деталей броска в строку.
 * @param details - Массив объектов DiceDetail.
 * @returns Отформатированная строка со сводкой.
 */
export function formatDetailSummary(details: DiceDetail[]): string {
  const chunks = details
    .map((detail) => {
      const rolls = detail.rolls
        .filter((item) => item.valid)
        .map((item) => item.value)
        .join(' + ');

      return rolls ? `${detail.label}: ${rolls}` : '';
    })
    .filter(Boolean);

  return chunks.join(' | ');
}

/**
 * Получает числовое значение результата из объекта броска.
 * @param roll - Объект броска.
 * @returns Числовое значение или NaN.
 */
export function getRollValue(roll: unknown): number {
  if (isObject(roll) && typeof roll.value === 'number') {
    return roll.value;
  }

  return Number.NaN;
}
