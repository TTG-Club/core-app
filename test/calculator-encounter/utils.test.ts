import type { EncounterCreature } from '~calculator/encounter/model';

import { describe, expect, it } from 'vitest';

import {
  calculateEncounter,
  countCustomCreatures,
  createCustomCreature,
  CUSTOM_CREATURE_DEFAULT_NAME,
  DEFAULT_ENCOUNTER_STATE,
  findCustomCreature,
  getBudgetSegments,
  getChallengeRatingItems,
  getCharacterBudget,
  getEncounterDifficulty,
  getExperienceByChallengeRating,
  getPartyBudget,
  getTransferBatches,
  isCustomCreature,
  parseEncounterState,
} from '~calculator/encounter/model';

function makeCreature(
  overrides: Partial<EncounterCreature>,
): EncounterCreature {
  return {
    id: 'creature',
    url: 'goblin',
    name: 'Гоблин',
    challengeRating: '1/4',
    experience: 50,
    inLair: false,
    count: 1,
    ...overrides,
  };
}

describe('getCharacterBudget', () => {
  it('берёт бюджет из таблицы DMG 2024', () => {
    expect(getCharacterBudget(1)).toEqual({ low: 50, moderate: 75, high: 100 });

    expect(getCharacterBudget(5)).toEqual({
      low: 500,
      moderate: 750,
      high: 1_100,
    });

    expect(getCharacterBudget(20)).toEqual({
      low: 6_400,
      moderate: 13_200,
      high: 22_000,
    });
  });

  it('прижимает уровень к диапазону 1–20', () => {
    expect(getCharacterBudget(0)).toEqual(getCharacterBudget(1));
    expect(getCharacterBudget(25)).toEqual(getCharacterBudget(20));
  });
});

describe('getPartyBudget', () => {
  it('складывает бюджеты всех персонажей', () => {
    expect(
      getPartyBudget([
        { id: 'a', level: 3, count: 3 },
        { id: 'b', level: 4, count: 1 },
      ]),
    ).toEqual({ low: 700, moderate: 1_050, high: 1_700 });
  });

  it('пустая группа — нулевой бюджет', () => {
    expect(getPartyBudget([])).toEqual({ low: 0, moderate: 0, high: 0 });
  });
});

describe('getExperienceByChallengeRating', () => {
  it('знает дробные и целые уровни опасности', () => {
    expect(getExperienceByChallengeRating('1/4')).toBe(50);
    expect(getExperienceByChallengeRating('30')).toBe(155_000);
  });

  it('неизвестный уровень опасности даёт 0', () => {
    expect(getExperienceByChallengeRating('—')).toBe(0);
  });
});

describe('getEncounterDifficulty', () => {
  const budget = { low: 200, moderate: 300, high: 400 };

  it('без опыта или без группы сложности нет', () => {
    expect(getEncounterDifficulty(0, budget)).toBe('none');

    expect(getEncounterDifficulty(100, { low: 0, moderate: 0, high: 0 })).toBe(
      'none',
    );
  });

  it('граница бюджета входит в свою сложность', () => {
    expect(getEncounterDifficulty(200, budget)).toBe('low');
    expect(getEncounterDifficulty(201, budget)).toBe('moderate');
    expect(getEncounterDifficulty(300, budget)).toBe('moderate');
    expect(getEncounterDifficulty(400, budget)).toBe('high');
    expect(getEncounterDifficulty(401, budget)).toBe('beyond');
  });
});

describe('calculateEncounter', () => {
  it('складывает опыт существ без множителей', () => {
    const result = calculateEncounter(
      [{ id: 'party', level: 1, count: 4 }],
      [
        makeCreature({ count: 4 }),
        makeCreature({ id: 'boss', experience: 100, count: 1 }),
      ],
    );

    expect(result).toEqual({
      budget: { low: 200, moderate: 300, high: 400 },
      totalExperience: 300,
      characterCount: 4,
      experiencePerCharacter: 75,
      difficulty: 'moderate',
    });
  });

  it('в логове считает опыт в логове', () => {
    const dragon = makeCreature({
      experience: 18_000,
      experienceInLair: 20_000,
      inLair: true,
    });

    expect(calculateEncounter([], [dragon]).totalExperience).toBe(20_000);

    expect(
      calculateEncounter([], [{ ...dragon, inLair: false }]).totalExperience,
    ).toBe(18_000);
  });

  it('без опыта в логове переключатель ни на что не влияет', () => {
    expect(
      calculateEncounter([], [makeCreature({ inLair: true })]).totalExperience,
    ).toBe(50);
  });
});

describe('getBudgetSegments', () => {
  const budget = { low: 200, moderate: 300, high: 400 };

  it('делит шкалу пропорционально бюджетам', () => {
    expect(getBudgetSegments(0, budget).map(({ width }) => width)).toEqual([
      0.5, 0.25, 0.25,
    ]);
  });

  it('без группы делит шкалу поровну и ничего не заполняет', () => {
    const segments = getBudgetSegments(500, { low: 0, moderate: 0, high: 0 });

    expect(segments.map(({ width }) => width)).toEqual([1 / 3, 1 / 3, 1 / 3]);
    expect(segments.map(({ fill }) => fill)).toEqual([0, 0, 0]);
  });

  it('заполняет зоны по порядку', () => {
    expect(getBudgetSegments(250, budget).map(({ fill }) => fill)).toEqual([
      1, 0.5, 0,
    ]);

    expect(getBudgetSegments(1_000, budget).map(({ fill }) => fill)).toEqual([
      1, 1, 1,
    ]);
  });
});

describe('parseEncounterState', () => {
  it('битое значение даёт начальное состояние', () => {
    expect(parseEncounterState({ party: 'oops' })).toEqual(
      DEFAULT_ENCOUNTER_STATE,
    );
  });

  it('пропускает корректное состояние', () => {
    const state = {
      party: [{ id: 'a', level: 5, count: 2 }],
      creatures: [makeCreature({})],
    };

    expect(parseEncounterState(state)).toEqual(state);
  });
});

describe('getTransferBatches', () => {
  it('складывает строки одного существа в одну пачку', () => {
    expect(
      getTransferBatches([
        makeCreature({ id: 'a', url: 'goblin', count: 3 }),
        makeCreature({ id: 'b', url: 'wolf', count: 2 }),
        makeCreature({ id: 'c', url: 'goblin', count: 1, inLair: true }),
      ]),
    ).toEqual([
      { creatureUrl: 'goblin', count: 4 },
      { creatureUrl: 'wolf', count: 2 },
    ]);
  });

  it('без существ пачек нет', () => {
    expect(getTransferBatches([])).toEqual([]);
  });

  it('своих монстров пропускает', () => {
    expect(
      getTransferBatches([
        makeCreature({ id: 'a', url: 'goblin', count: 2 }),
        makeCreature({ id: 'b', url: undefined, name: 'Тварь', count: 3 }),
      ]),
    ).toEqual([{ creatureUrl: 'goblin', count: 2 }]);
  });
});

describe('getChallengeRatingItems', () => {
  it('идёт по порядку от 0 до 30, дроби — после нуля', () => {
    const values = getChallengeRatingItems().map(({ value }) => value);

    expect(values.slice(0, 6)).toEqual(['0', '1/8', '1/4', '1/2', '1', '2']);
    expect(values.at(-1)).toBe('30');
    expect(values).toHaveLength(34);
  });

  it('подписывает опыт', () => {
    expect(getChallengeRatingItems()[2]?.label).toBe('1/4 · 50 опыта');
  });
});

describe('свои монстры', () => {
  const draft = { name: '  Болотная тварь ', challengeRating: '3', count: 2 };

  it('createCustomCreature берёт опыт по показателю опасности', () => {
    expect(createCustomCreature('own', draft)).toEqual({
      id: 'own',
      name: 'Болотная тварь',
      challengeRating: '3',
      experience: 700,
      inLair: false,
      count: 2,
    });
  });

  it('пустое название — название по умолчанию', () => {
    expect(createCustomCreature('own', { ...draft, name: ' ' }).name).toBe(
      CUSTOM_CREATURE_DEFAULT_NAME,
    );
  });

  it('считается в сложности как существо бестиария', () => {
    const result = calculateEncounter(
      [{ id: 'party', level: 1, count: 4 }],
      [makeCreature({}), createCustomCreature('own', draft)],
    );

    expect(result.totalExperience).toBe(50 + 700 * 2);
  });

  it('findCustomCreature ищет по названию и показателю опасности', () => {
    const own = createCustomCreature('own', draft);
    const goblin = makeCreature({});

    expect(findCustomCreature([goblin, own], draft)).toBe(own);

    expect(
      findCustomCreature([own], { ...draft, challengeRating: '4' }),
    ).toBeUndefined();

    expect(
      findCustomCreature([goblin], {
        ...draft,
        name: 'Гоблин',
        challengeRating: '1/4',
      }),
    ).toBeUndefined();
  });

  it('isCustomCreature и countCustomCreatures', () => {
    const own = createCustomCreature('own', draft);

    expect(isCustomCreature(own)).toBe(true);
    expect(isCustomCreature(makeCreature({}))).toBe(false);
    expect(countCustomCreatures([own, makeCreature({ count: 5 })])).toBe(2);
  });

  it('переживает чтение из хранилища', () => {
    const state = {
      party: [{ id: 'a', level: 5, count: 2 }],
      creatures: [createCustomCreature('own', draft), makeCreature({})],
    };

    expect(parseEncounterState(state)).toEqual(state);
  });
});
