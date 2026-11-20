import { describe, expect, it } from 'vitest';

import { parseConditionDescription } from '~initiative/model';

describe('parseConditionDescription', () => {
  it('возвращает описание статьи глоссария разметкой', () => {
    const description = [
      'Когда вы находитесь в состоянии {@i ослеплённый}:',
      { type: 'list', attrs: { type: 'unordered' }, content: [['пункт']] },
    ];

    expect(
      parseConditionDescription({ url: 'blinded-phb', description }),
    ).toEqual(description);
  });

  it('отвергает ответ без описания', () => {
    expect(() => parseConditionDescription({ url: 'blinded-phb' })).toThrow();
  });

  it('отвергает узлы, которые не являются разметкой', () => {
    expect(() =>
      parseConditionDescription({ description: [42, null] }),
    ).toThrow();
  });
});
