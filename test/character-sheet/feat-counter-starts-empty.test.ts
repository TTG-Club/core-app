import type {
  Character,
  CharacterClassResource,
  CharacterFeature,
  FeatCounter,
  ResourceRecoveryRule,
} from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CHARACTER,
  parseFeatDetail,
  withFeatResources,
} from '~character-sheet/model';

/** Максимум ресурса в тестах: своим числом, чтобы не зависеть от персонажа. */
const COUNTER_MAX = 4;

/** Сколько зарядов персонаж набрал действием к моменту пересборки листа. */
const GAINED_CHARGES = 3;

/** Уровень, с которого ресурс со ступенями появляется на листе. */
const SCALING_START_LEVEL = 3;

/** Правило «отдых ничего не возвращает» в виде листа. */
const NO_REST_RECOVERY: ResourceRecoveryRule = { mode: 'none', amount: 1 };

/**
 * Собирает ресурс справочника, который отдых не возвращает.
 *
 * @param counterFields поля ресурса поверх заготовки.
 * @returns ресурс из механики записи.
 */
function createCounter(counterFields: Partial<FeatCounter> = {}): FeatCounter {
  return {
    key: 'mutation-points',
    name: 'Очки мутации',
    shortName: '',
    max: String(COUNTER_MAX),
    scaling: [],
    min: 0,
    recovery: 'long-rest',
    shortRest: NO_REST_RECOVERY,
    longRest: NO_REST_RECOVERY,
    ...counterFields,
  };
}

/**
 * Собирает особенность листа с одним ресурсом.
 *
 * @param counter ресурс особенности.
 * @returns особенность листа.
 */
function createFeature(counter: FeatCounter): CharacterFeature {
  return {
    id: 'class:druid:mutation',
    name: 'Мутация',
    description: [],
    origin: 'class',
    originName: 'Друид',
    level: 1,
    choice: null,
    counters: [counter],
  };
}

/**
 * Сверяет лист с особенностью и отдаёт её ресурс.
 *
 * @param counter ресурс особенности.
 * @param character лист персонажа.
 * @returns ресурс особенности на листе.
 */
function settleFeatureResource(
  counter: FeatCounter,
  character: Character = DEFAULT_CHARACTER,
): CharacterClassResource | undefined {
  return withFeatResources(
    character.classResources,
    [createFeature(counter)],
    character,
  )[0];
}

/**
 * Лист, на котором уже лежит ресурс особенности.
 *
 * @param resource ресурс листа; нет — лист остаётся без ресурсов.
 * @param characterFields поля листа поверх заготовки.
 * @returns лист персонажа.
 */
function createCharacterWithResource(
  resource: CharacterClassResource | undefined,
  characterFields: Partial<Character> = {},
): Character {
  return {
    ...DEFAULT_CHARACTER,
    ...characterFields,
    classResources: resource ? [resource] : [],
  };
}

describe('ресурс «появляется пустым»', () => {
  it('отметка приходит из справочника только взведённой', () => {
    const feat = parseFeatDetail({
      url: 'mutation',
      name: { rus: 'Мутация' },
      category: 'GENERAL',
      description: [],
      mechanics: {
        counters: [
          {
            key: 'empty',
            name: 'Пустой',
            max: String(COUNTER_MAX),
            startsEmpty: true,
          },
          {
            key: 'full',
            name: 'Полный',
            max: String(COUNTER_MAX),
            startsEmpty: false,
          },
        ],
      },
    });

    expect(feat?.counters[0]?.startsEmpty).toBe(true);
    expect(feat?.counters[1]).not.toHaveProperty('startsEmpty');
  });

  it('новый ресурс с отметкой встаёт на ноль, без неё — полным', () => {
    expect(
      settleFeatureResource(createCounter({ startsEmpty: true })),
    ).toMatchObject({ current: 0, max: COUNTER_MAX });

    expect(settleFeatureResource(createCounter())).toMatchObject({
      current: COUNTER_MAX,
      max: COUNTER_MAX,
    });
  });

  it('набранные заряды пересборка листа не обнуляет', () => {
    const counter = createCounter({ startsEmpty: true });
    const createdResource = settleFeatureResource(counter);

    const characterWithCharges = createCharacterWithResource(
      createdResource && { ...createdResource, current: GAINED_CHARGES },
    );

    expect(settleFeatureResource(counter, characterWithCharges)?.current).toBe(
      GAINED_CHARGES,
    );
  });

  it('ресурс со ступенями пуст и на уровне своего появления', () => {
    const counter = createCounter({
      startsEmpty: true,
      scaling: [{ level: SCALING_START_LEVEL, max: COUNTER_MAX }],
    });

    const resourceBeforeStart = settleFeatureResource(counter);

    expect(resourceBeforeStart?.max).toBe(0);

    const grownCharacter = createCharacterWithResource(resourceBeforeStart, {
      level: SCALING_START_LEVEL,
    });

    expect(settleFeatureResource(counter, grownCharacter)).toMatchObject({
      current: 0,
      max: COUNTER_MAX,
    });
  });
});
