import type { FeatureDescriptionNode } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  toPdfPlainText,
  toPdfTextBlocks,
} from '~character-sheet/model/pdf/markup-text';

/** Описание черты «Драчун»: маркеры лежат в строках внутри пунктов списка. */
const BRAWLER_DESCRIPTION: FeatureDescriptionNode[] = [
  'Вы получаете следующие эффекты:',
  {
    type: 'list',
    content: [
      {
        type: 'li',
        content: [
          '{@b Усиленный безоружный удар.} Когда вы попадаете {@glossary безоружным ударом|url:unarmed-strike-phb} и наносите урон.',
        ],
      },
    ],
  },
];

describe('toPdfTextBlocks', () => {
  it('разбирает маркеры в строках внутри пунктов списка', () => {
    const item = toPdfTextBlocks(BRAWLER_DESCRIPTION).find(
      (block) => block.kind === 'listItem',
    );

    const runs = item?.runs ?? [];

    expect(runs[0]).toEqual({
      text: 'Усиленный безоружный удар.',
      style: 'bold',
    });

    expect(runs.map((run) => run.text).join('')).toBe(
      'Усиленный безоружный удар. Когда вы попадаете безоружным ударом и наносите урон.',
    );

    expect(runs.slice(1).every((run) => run.style === 'regular')).toBe(true);
  });

  it('не оставляет сырых маркеров в плоском тексте', () => {
    expect(toPdfPlainText(BRAWLER_DESCRIPTION)).not.toContain('{@');
  });
});
