import { describe, expect, it } from 'vitest';

import {
  formatSubscriptionLimitValue,
  VTTG_SUBSCRIPTION_LIMIT_LABELS,
} from '~vttg/model';

describe('formatSubscriptionLimitValue', () => {
  it('показывает число как есть', () => {
    expect(formatSubscriptionLimitValue(20)).toBe('20');
  });

  it('подписывает отсутствие возможности', () => {
    expect(formatSubscriptionLimitValue('none')).toBe(
      VTTG_SUBSCRIPTION_LIMIT_LABELS.none,
    );
  });
});
