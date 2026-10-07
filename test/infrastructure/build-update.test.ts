import { describe, expect, it } from 'vitest';

import { parseLatestBuildId } from '~infrastructure/build-update/model';

const LATEST_BUILD_ID = '3e230e7f-1e09-4d82-954e-5285c71f51d1';

describe('parseLatestBuildId', () => {
  it('достаёт номер сборки из ответа сервера', () => {
    expect(
      parseLatestBuildId({ id: LATEST_BUILD_ID, timestamp: 1790498420256 }),
    ).toBe(LATEST_BUILD_ID);
  });

  it('не принимает пустой номер', () => {
    expect(parseLatestBuildId({ id: '' })).toBeUndefined();
  });

  it('не принимает ответ другой формы', () => {
    expect(parseLatestBuildId('<html>')).toBeUndefined();
    expect(parseLatestBuildId(null)).toBeUndefined();
  });
});
