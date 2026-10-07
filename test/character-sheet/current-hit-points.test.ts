import type { Character, CharacterFeature } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  adjustHealthForConstitution,
  applyLevelHitPoints,
  buildAbilityImprovementFeature,
  DEFAULT_CHARACTER,
  getMaxHitPoints,
  removeLevelHitPoints,
  withFeatModifiers,
  withSettledCurrentHitPoints,
} from '~character-sheet/model';

/** URL класса в записях прироста хитов. */
const CLASS_URL = 'fighter-phb';

/** Уровень воина до повышения. */
const LEVEL = 9;

/** Записанный максимум воина 9 уровня с Телосложением 10: 10 + 8 × 6. */
const RECORDED_MAX = 58;

/** Итоговый максимум с Телосложением 12: по хиту сверху за каждый уровень. */
const TOTAL_MAX = RECORDED_MAX + LEVEL;

/** Прирост за уровень: среднее к10 при записанном Телосложении 10. */
const LEVEL_GAIN = 6;

/** Повышение характеристик 4 уровня: Телосложение +2 эффектом. */
const CONSTITUTION_INCREASE: CharacterFeature = buildAbilityImprovementFeature({
  featureRowId: `class:${CLASS_URL}:ability-score-improvement:4`,
  className: 'Воин',
  classLevel: 4,
  increases: { constitution: 2 },
});

/**
 * Воин 9 уровня с записанным Телосложением 10.
 *
 * @param current текущие хиты.
 * @param features особенности листа.
 * @returns лист персонажа.
 */
function createFighter(
  current: number,
  features: CharacterFeature[] = [CONSTITUTION_INCREASE],
): Character {
  return {
    ...DEFAULT_CHARACTER,
    level: LEVEL,
    features,
    health: {
      ...DEFAULT_CHARACTER.health,
      max: RECORDED_MAX,
      current,
      levelGains: Array.from({ length: LEVEL }, (_, index) => ({
        level: index + 1,
        classUrl: CLASS_URL,
        amount: index === 0 ? 10 : LEVEL_GAIN,
      })),
    },
  };
}

/**
 * Повышение уровня так, как его применяет лист: прирост в здоровье, затем
 * общая сверка.
 *
 * @param character лист до повышения.
 * @returns лист после повышения на один уровень.
 */
function levelUp(character: Character): Character {
  return withFeatModifiers(
    {
      ...character,
      level: character.level + 1,
      health: applyLevelHitPoints(character.health, character.level, [
        { classUrl: CLASS_URL, amount: LEVEL_GAIN },
      ]),
    },
    character,
  );
}

describe('текущие хиты при изменении листа', () => {
  it('прибавка Телосложения входит в итоговый максимум один раз', () => {
    expect(getMaxHitPoints(createFighter(TOTAL_MAX))).toBe(TOTAL_MAX);
  });

  it('здоровый персонаж остаётся здоровым после повышения уровня', () => {
    const next = levelUp(createFighter(TOTAL_MAX));

    expect(next.health.max).toBe(RECORDED_MAX + LEVEL_GAIN);
    expect(next.health.current).toBe(getMaxHitPoints(next));
  });

  it('раненый получает прирост уровня целиком и не лечится сверх него', () => {
    const wounded = TOTAL_MAX - 20;
    const next = levelUp(createFighter(wounded));

    // Прирост по записанному Телосложению и хит прибавки за новый уровень.
    expect(next.health.current).toBe(wounded + LEVEL_GAIN + 1);
  });

  it('повышение Телосложения эффектом поднимает и текущие хиты', () => {
    const before = createFighter(RECORDED_MAX, []);

    const next = withFeatModifiers(
      { ...before, features: [CONSTITUTION_INCREASE] },
      before,
    );

    expect(next.health.max).toBe(RECORDED_MAX);
    expect(next.health.current).toBe(TOTAL_MAX);
  });

  it('снятие уровня обрезает текущие хиты итоговым максимумом', () => {
    const before = createFighter(TOTAL_MAX);

    const next = withFeatModifiers(
      {
        ...before,
        level: LEVEL - 1,
        health: removeLevelHitPoints(before.health, { [CLASS_URL]: 1 }),
      },
      before,
    );

    expect(next.health.current).toBe(getMaxHitPoints(next));
    expect(getMaxHitPoints(next)).toBe(RECORDED_MAX - LEVEL_GAIN + LEVEL - 1);
  });

  it('правка записанного Телосложения двигает текущие хиты на изменение итога', () => {
    const before = createFighter(TOTAL_MAX);

    // 10 → 11: записанный модификатор прежний, итоговое 13 — тоже +1.
    const sameModifier = withSettledCurrentHitPoints(
      {
        ...before,
        abilities: { ...before.abilities, constitution: 11 },
        health: adjustHealthForConstitution(before.health, LEVEL, 10, 11),
      },
      before,
    );

    expect(sameModifier.health.current).toBe(TOTAL_MAX);

    // 10 → 12: записанный модификатор +1, итоговое 14 — уже +2.
    const higherModifier = withSettledCurrentHitPoints(
      {
        ...before,
        abilities: { ...before.abilities, constitution: 12 },
        health: adjustHealthForConstitution(before.health, LEVEL, 10, 12),
      },
      before,
    );

    expect(getMaxHitPoints(higherModifier)).toBe(RECORDED_MAX + LEVEL * 2);
    expect(higherModifier.health.current).toBe(RECORDED_MAX + LEVEL * 2);
  });

  it('незаполненное здоровье не трогается', () => {
    const empty: Character = {
      ...DEFAULT_CHARACTER,
      features: [CONSTITUTION_INCREASE],
    };

    expect(withSettledCurrentHitPoints(empty, empty)).toBe(empty);
  });
});
