import type {
  GeneratedCreature,
  GenerationCandidate,
} from '~calculator/encounter/model';

import { describe, expect, it } from 'vitest';

import {
  generateCreatures,
  getAffordableExperienceValues,
  getCompatibilityScore,
  getGenerationCreatureLimit,
  getGenerationWindow,
} from '~calculator/encounter/model';

/**
 * Детерминированный генератор (mulberry32), чтобы тесты не зависели от
 * случайности.
 * @param seed Зерно.
 */
function seededRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;

    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);

    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;

    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function candidate(
  url: string,
  experience: number,
  extra: Partial<GenerationCandidate> = {},
): GenerationCandidate {
  return {
    url,
    label: url,
    challengeRating: '',
    experience,
    typeCodes: [],
    subtype: '',
    family: '',
    alignment: '',
    companions: [],
    ...extra,
  };
}

function totalOf(picks: Array<GeneratedCreature>): number {
  return picks.reduce(
    (total, { candidate: pick, count }) => total + pick.experience * count,
    0,
  );
}

function countOf(picks: Array<GeneratedCreature>): number {
  return picks.reduce((total, { count }) => total + count, 0);
}

const POOL = [
  candidate('goblin', 50),
  candidate('hobgoblin', 100),
  candidate('goblin-boss', 200),
  candidate('bugbear', 450),
  candidate('ogre', 450),
  candidate('troll', 1_800),
];

describe('getGenerationWindow', () => {
  const budget = { low: 200, moderate: 300, high: 400 };

  it('окно умеренной сложности — от бюджета низкой (не включая) до бюджета умеренной', () => {
    expect(getGenerationWindow('moderate', budget, 0)).toEqual({
      min: 201,
      max: 300,
    });
  });

  it('у низкой сложности нижняя граница — половина её бюджета', () => {
    expect(getGenerationWindow('low', budget, 0)).toEqual({
      min: 100,
      max: 200,
    });
  });

  it('учитывает уже добавленных существ', () => {
    expect(getGenerationWindow('high', budget, 250)).toEqual({
      min: 51,
      max: 150,
    });
  });

  it('исчерпанный бюджет даёт null', () => {
    expect(getGenerationWindow('low', budget, 200)).toBeNull();
  });
});

describe('getAffordableExperienceValues', () => {
  it('берёт только уровни опасности, что умещаются в бюджет', () => {
    expect(getAffordableExperienceValues(100)).toEqual([10, 25, 50, 100]);
  });
});

describe('getGenerationCreatureLimit', () => {
  it('по два существа на персонажа в пределах 4–12', () => {
    expect(getGenerationCreatureLimit(1)).toBe(4);
    expect(getGenerationCreatureLimit(4)).toBe(8);
    expect(getGenerationCreatureLimit(10)).toBe(12);
  });
});

describe('generateCreatures', () => {
  it('всегда попадает в окно, когда это возможно', () => {
    const window = { min: 501, max: 750 };

    for (let seed = 1; seed <= 200; seed += 1) {
      const picks = generateCreatures(POOL, window, 8, seededRandom(seed));
      const total = totalOf(picks);

      expect(total).toBeGreaterThanOrEqual(window.min);
      expect(total).toBeLessThanOrEqual(window.max);
      expect(countOf(picks)).toBeLessThanOrEqual(8);
      expect(picks.length).toBeLessThanOrEqual(3);
    }
  });

  it('не берёт существ дороже верхней границы', () => {
    const picks = generateCreatures(
      POOL,
      { min: 1, max: 449 },
      8,
      seededRandom(7),
    );

    expect(picks.every(({ candidate: pick }) => pick.experience <= 449)).toBe(
      true,
    );
  });

  it('без подходящих кандидатов возвращает пустой список', () => {
    expect(
      generateCreatures(POOL, { min: 1, max: 40 }, 8, seededRandom(1)),
    ).toEqual([]);
  });

  it('если окно недостижимо, отдаёт лучшее, не превышая верхнюю границу', () => {
    const picks = generateCreatures(
      [candidate('troll', 1_800)],
      { min: 3_000, max: 4_000 },
      1,
      seededRandom(3),
    );

    expect(totalOf(picks)).toBe(1_800);
  });
});

describe('совместимость свиты', () => {
  const hobgoblin = candidate('hobgoblin-captain', 700, {
    typeCodes: ['FEY'],
    subtype: 'гоблиноид',
    family: 'хобгоблины',
    alignment: 'LAWFUL_EVIL',
  });

  const goblin = candidate('goblin-warrior', 50, {
    typeCodes: ['FEY'],
    subtype: 'гоблиноид',
    family: 'гоблины',
    alignment: 'CHAOTIC_NEUTRAL',
  });

  const mummy = candidate('mummy', 700, {
    typeCodes: ['UNDEAD'],
    family: 'мумии',
    alignment: 'LAWFUL_EVIL',
  });

  const skeleton = candidate('skeleton', 50, {
    typeCodes: ['UNDEAD'],
    family: 'скелеты',
    alignment: 'LAWFUL_EVIL',
  });

  const knight = candidate('knight', 700, {
    typeCodes: ['HUMANOID'],
    family: 'рыцари',
    alignment: 'LAWFUL_GOOD',
    companions: ['warhorse'],
  });

  const warhorse = candidate('warhorse', 100, {
    typeCodes: ['BEAST'],
    family: 'боевая лошадь',
  });

  const cultist = candidate('cultist', 25, {
    typeCodes: ['HUMANOID'],
    family: 'культисты',
    alignment: 'NEUTRAL_EVIL',
  });

  const wolf = candidate('wolf', 50, {
    typeCodes: ['BEAST'],
    family: 'волки',
  });

  const pool = [
    hobgoblin,
    goblin,
    mummy,
    skeleton,
    knight,
    warhorse,
    cultist,
    wolf,
  ];

  it('ценит спутников выше семейства, подтипа и типа', () => {
    expect(getCompatibilityScore(knight, warhorse)).toBeGreaterThan(
      getCompatibilityScore(hobgoblin, goblin),
    );

    expect(getCompatibilityScore(hobgoblin, goblin)).toBeGreaterThan(
      getCompatibilityScore(mummy, skeleton),
    );

    expect(getCompatibilityScore(mummy, skeleton)).toBeGreaterThan(0);
  });

  it('связь спутников работает в обе стороны', () => {
    expect(getCompatibilityScore(warhorse, knight)).toBeGreaterThan(0);
  });

  it('не сводит добро и зло без явной связи', () => {
    expect(getCompatibilityScore(knight, cultist)).toBe(0);
  });

  it('несвязанные существа несовместимы', () => {
    expect(getCompatibilityScore(mummy, wolf)).toBe(0);
  });

  /**
   * Генерирует группы с заданным главарём (единственным, кто тянет на
   * главаря в окне) и собирает всех, кто попал к нему в свиту.
   */
  function collectRetinue(leader: GenerationCandidate): Set<string> {
    const retinue = new Set<string>();
    const others = pool.filter(({ experience }) => experience < 700);

    for (let seed = 1; seed <= 100; seed += 1) {
      const picks = generateCreatures(
        [leader, ...others],
        { min: 801, max: 1_100 },
        8,
        seededRandom(seed),
      );

      expect(picks[0]?.candidate.url).toBe(leader.url);

      picks.slice(1).forEach(({ candidate: pick }) => retinue.add(pick.url));
    }

    return retinue;
  }

  it('хобгоблин водит гоблинов', () => {
    expect([...collectRetinue(hobgoblin)]).toEqual(['goblin-warrior']);
  });

  it('мумия водит скелетов', () => {
    expect([...collectRetinue(mummy)]).toEqual(['skeleton']);
  });

  it('рыцарь едет с боевыми конями', () => {
    expect([...collectRetinue(knight)]).toEqual(['warhorse']);
  });

  it('без совместимых существ свита набирается из любых', () => {
    const picks = generateCreatures(
      [mummy, wolf],
      { min: 801, max: 1_100 },
      8,
      seededRandom(5),
    );

    expect(totalOf(picks)).toBeGreaterThanOrEqual(801);
  });
});
