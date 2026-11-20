import type { CharacterHealth } from '~character-sheet/model';
import type { ParticipantSheetLink } from '~initiative/model';

import { describe, expect, it } from 'vitest';

import { DEFAULT_CHARACTER } from '~character-sheet/model';
import {
  applyHitPointsDelta,
  applyTrackerHitPointsToHealth,
  buildSheetPlayerOption,
  mergeTemporaryHitPoints,
} from '~initiative/model';

describe('applyHitPointsDelta', () => {
  it('урон сначала снимает временные хиты', () => {
    expect(applyHitPointsDelta({ current: 20, temporary: 5 }, -3, 30)).toEqual({
      current: 20,
      temporary: 2,
    });
  });

  it('остаток урона после временных хитов снимает текущие', () => {
    expect(applyHitPointsDelta({ current: 20, temporary: 5 }, -8, 30)).toEqual({
      current: 17,
      temporary: 0,
    });
  });

  it('урон не опускает хиты ниже нуля', () => {
    expect(applyHitPointsDelta({ current: 4, temporary: 2 }, -50, 30)).toEqual({
      current: 0,
      temporary: 0,
    });
  });

  it('лечение не трогает временные хиты и упирается в максимум', () => {
    expect(applyHitPointsDelta({ current: 28, temporary: 5 }, 5, 30)).toEqual({
      current: 30,
      temporary: 5,
    });
  });

  it('без известного максимума лечение не ограничено', () => {
    expect(applyHitPointsDelta({ current: 10, temporary: 0 }, 5, 0)).toEqual({
      current: 15,
      temporary: 0,
    });
  });
});

describe('mergeTemporaryHitPoints', () => {
  it('большее значение заменяет прежнее', () => {
    expect(mergeTemporaryHitPoints(5, 8)).toBe(8);
  });

  it('меньшее значение прежнее не меняет', () => {
    expect(mergeTemporaryHitPoints(8, 5)).toBe(8);
  });

  it('без прежних временных хитов ставится новое значение', () => {
    expect(mergeTemporaryHitPoints(0, 6)).toBe(6);
  });
});

describe('applyTrackerHitPointsToHealth', () => {
  const health: CharacterHealth = {
    ...DEFAULT_CHARACTER.health,
    current: 10,
    max: 30,
    temporary: 0,
    exhaustion: 2,
  };

  it('пишет в лист текущие и временные хиты, не трогая остальное', () => {
    expect(
      applyTrackerHitPointsToHealth(health, { current: 18, temporary: 7 }),
    ).toEqual({ ...health, current: 18, temporary: 7 });
  });

  it('снимает временные хиты листа нулём', () => {
    expect(
      applyTrackerHitPointsToHealth(
        { ...health, temporary: 5 },
        { current: 10, temporary: 0 },
      ).temporary,
    ).toBe(0);
  });

  it('зажимает текущие хиты максимумом листа, временные — нулём снизу', () => {
    expect(
      applyTrackerHitPointsToHealth(health, { current: 45, temporary: -3 }),
    ).toEqual({ ...health, current: 30, temporary: 0 });
  });

  it('не режет текущие хиты сверху, пока максимум листа неизвестен', () => {
    expect(
      applyTrackerHitPointsToHealth(
        { ...health, max: 0 },
        { current: 12, temporary: 0 },
      ).current,
    ).toBe(12);
  });
});

describe('buildSheetPlayerOption', () => {
  const link: Omit<ParticipantSheetLink, 'avatarUrl'> = {
    sheetId: 'sheet-id',
    source: 'own',
    shareToken: null,
    savedId: null,
  };

  it('берёт с листа временные хиты вместе с текущими', () => {
    const option = buildSheetPlayerOption(
      {
        ...DEFAULT_CHARACTER,
        health: {
          ...DEFAULT_CHARACTER.health,
          current: 12,
          max: 20,
          temporary: 6,
        },
      },
      link,
    );

    expect(option.currentHitPoints).toBe(12);
    expect(option.temporaryHitPoints).toBe(6);
  });
});
