import { describe, expect, it } from 'vitest';

import { ABILITY_KEYS, AbilityKey } from '~/shared/types';
import {
  formatAbilityBonusLabel,
  getBackgroundSourceLabel,
  getThreeOnesAbilityOptions,
} from '~calculator/abilities/model';

describe('formatAbilityBonusLabel', () => {
  it('подписывает характеристику размером бонуса', () => {
    expect(formatAbilityBonusLabel(AbilityKey.STRENGTH, 2)).toBe('Сила (+2)');
  });
});

describe('getBackgroundSourceLabel', () => {
  it('добавляет к названию начало «Предыстория:»', () => {
    expect(getBackgroundSourceLabel('Мудрец')).toBe('Предыстория: Мудрец');
  });
});

describe('getThreeOnesAbilityOptions', () => {
  it('предлагает все характеристики, пока не выбрано три', () => {
    const options = getThreeOnesAbilityOptions([
      AbilityKey.STRENGTH,
      AbilityKey.WISDOM,
    ]);

    expect(options.map((option) => option.value)).toEqual(ABILITY_KEYS);
    expect(options.some((option) => option.disabled)).toBe(false);
  });

  it('блокирует невыбранные характеристики, когда выбрано три', () => {
    const selected = [
      AbilityKey.STRENGTH,
      AbilityKey.WISDOM,
      AbilityKey.CHARISMA,
    ];

    const enabled = getThreeOnesAbilityOptions(selected)
      .filter((option) => !option.disabled)
      .map((option) => option.value);

    expect(enabled).toEqual(selected);
  });
});
