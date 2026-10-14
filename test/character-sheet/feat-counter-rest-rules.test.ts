import { describe, expect, it } from 'vitest';

import { parseFeatDetail } from '~character-sheet/model';

/** Ключ ресурса черты в ответах справочника. */
const COUNTER_KEY = 'luck';

/**
 * Собирает детальный ответ черты с одним ресурсом.
 *
 * @param counterFields поля ресурса поверх ключа, названия и максимума.
 * @returns ответ `GET /api/v2/feats/{url}`.
 */
function createFeatResponse(counterFields: Record<string, unknown>) {
  return {
    url: 'lucky',
    name: { rus: 'Удачливый' },
    category: 'GENERAL',
    description: [],
    mechanics: {
      counters: [
        {
          key: COUNTER_KEY,
          name: 'Очки удачи',
          max: '@prof',
          ...counterFields,
        },
      ],
    },
  };
}

describe('правила отдыха ресурса из справочника', () => {
  it('раздельные правила приходят на лист, недостающее — «ничего»', () => {
    const feat = parseFeatDetail(
      createFeatResponse({
        recovery: 'LONG_REST',
        shortRest: { mode: 'AMOUNT', amount: 2 },
      }),
    );

    expect(feat?.counters[0]).toMatchObject({
      shortRest: { mode: 'amount', amount: 2 },
      longRest: { mode: 'none' },
    });
  });

  it('без раздельных правил остаётся откат одним словом', () => {
    const feat = parseFeatDetail(
      createFeatResponse({ recovery: 'SHORT_REST_ONE' }),
    );

    expect(feat?.counters[0]?.recovery).toBe('short-rest-one');
    expect(feat?.counters[0]?.shortRest).toBeUndefined();
    expect(feat?.counters[0]?.longRest).toBeUndefined();
  });
});
