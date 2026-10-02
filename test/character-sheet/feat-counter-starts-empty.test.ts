import type {
  Character,
  CharacterFeature,
  FeatCounter,
} from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CHARACTER,
  parseFeatDetail,
  withFeatResources,
} from '~character-sheet/model';

/** Максимум ресурса в тестах: своим числом, чтобы не зависеть от персонажа. */
const COUNTER_MAX = 4;

/** Уровень, с которого ресурс со ступенями появляется на листе. */
const SCALING_START_LEVEL = 3;

/**
 * Собирает ресурс справочника, который отдых не возвращает.
 *
 * @param fields поля ресурса поверх заготовки.
 * @returns ресурс из механики записи.
 */
function createCounter(fields: Partial<FeatCounter> = {}): FeatCounter {
  return {
    key: 'mutation-points',
    name: 'Очки мутации',
    shortName: '',
    max: String(COUNTER_MAX),
    scaling: [],
    min: 0,
    recovery: 'long-rest',
    shortRest: { mode: 'none', amount: 1 },
    longRest: { mode: 'none', amount: 1 },
    ...fields,
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
 * Ресурсы листа после сверки с особенностью.
 *
 * @param counter ресурс особенности.
 * @param character лист персонажа.
 * @returns ресурсы листа.
 */
function settleResources(
  counter: FeatCounter,
  character: Character = DEFAULT_CHARACTER,
) {
  return withFeatResources(
    character.classResources,
    [createFeature(counter)],
    character,
  );
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
          { key: 'empty', name: 'Пустой', max: '4', startsEmpty: true },
          { key: 'full', name: 'Полный', max: '4', startsEmpty: false },
        ],
      },
    });

    expect(feat?.counters[0]?.startsEmpty).toBe(true);
    expect(feat?.counters[1]).not.toHaveProperty('startsEmpty');
  });

  it('новый ресурс с отметкой встаёт на ноль, без неё — полным', () => {
    const [empty] = settleResources(createCounter({ startsEmpty: true }));
    const [full] = settleResources(createCounter());

    expect(empty).toMatchObject({ current: 0, max: COUNTER_MAX });
    expect(full).toMatchObject({ current: COUNTER_MAX, max: COUNTER_MAX });
  });

  it('набранные заряды пересборка листа не обнуляет', () => {
    const counter = createCounter({ startsEmpty: true });
    const [created] = settleResources(counter);

    const gained: Character = {
      ...DEFAULT_CHARACTER,
      classResources: created ? [{ ...created, current: 3 }] : [],
    };

    expect(settleResources(counter, gained)[0]?.current).toBe(3);
  });

  it('ресурс со ступенями пуст и на уровне своего появления', () => {
    const counter = createCounter({
      startsEmpty: true,
      scaling: [{ level: SCALING_START_LEVEL, max: COUNTER_MAX }],
    });

    const [beforeStart] = settleResources(counter);

    expect(beforeStart?.max).toBe(0);

    const grown: Character = {
      ...DEFAULT_CHARACTER,
      level: SCALING_START_LEVEL,
      classResources: beforeStart ? [beforeStart] : [],
    };

    expect(settleResources(counter, grown)[0]).toMatchObject({
      current: 0,
      max: COUNTER_MAX,
    });
  });
});
