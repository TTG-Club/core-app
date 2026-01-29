import type { CriticalType, DiceDetail, DiceRollItem } from './types';

function isObject(value: unknown): value is Record<string, unknown> {
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

function isDieNode(node: unknown): node is DieNode {
  return (
    isObject(node) &&
    (node as Record<string, unknown>).type === 'die' &&
    Array.isArray((node as Record<string, unknown>).rolls)
  );
}

function getDiceArray(node: unknown): unknown[] | null {
  if (!isObject(node)) {
    return null;
  }

  const dice = (node as Record<string, unknown>).dice;

  return Array.isArray(dice) ? (dice as unknown[]) : null;
}

function getExpr(node: unknown): unknown | null {
  if (!isObject(node)) {
    return null;
  }

  const expr = (node as Record<string, unknown>).expr;

  return expr ?? null;
}

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

export function extractRollDetails(roll: unknown): DiceDetail[] {
  const details: DiceDetail[] = [];

  const traverse = (node: unknown, index: string | number = 0) => {
    if (!isObject(node)) {
      return;
    }

    if (isDieNode(node)) {
      details.push({
        id: `${index}-${(node as DieNode).order}`,
        label: describeDie(node, details.length),
        total: (node as DieNode).value ?? 0,
        rolls: ((node as DieNode).rolls ?? []).map(
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
