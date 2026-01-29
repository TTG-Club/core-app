import type { CriticalType, DiceDetail, DiceRollItem } from './types';

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

export function extractRollDetails(roll: any): DiceDetail[] {
  const details: DiceDetail[] = [];

  const traverse = (node: any, index: string | number = 0) => {
    if (!node || typeof node !== 'object') {
      return;
    }

    if (node.type === 'die' && Array.isArray(node.rolls)) {
      details.push({
        id: `${index}-${node.order}`,
        label: describeDie(node, details.length),
        total: node.value,
        rolls: node.rolls.map(
          (item: any, rollIndex: number): DiceRollItem => ({
            id: `${index}-${rollIndex}`,
            value: item.value,
            valid: item.valid,
            critical: (item.critical as CriticalType | undefined) ?? null,
          }),
        ),
      });

      return;
    }

    if (Array.isArray(node.dice)) {
      node.dice.forEach((child: any, childIndex: number) =>
        traverse(child, `${index}-${childIndex}`),
      );
    }

    if (node.expr) {
      traverse(node.expr, `${index}-expr`);
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
