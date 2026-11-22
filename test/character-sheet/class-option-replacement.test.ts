import type { CharacterFeature, ClassSummary } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  buildLevelClassFeatures,
  getClassFeatureId,
  getLevelFeatureRows,
  getOptionReplacementId,
  getTakenOptionValues,
  parseClassDetail,
  removeFeaturesAboveLevel,
  withoutDroppedOptionFeatures,
  withStoredFeatureAnswers,
} from '~character-sheet/model';
import { normalizeLoadedClass } from '~classes/model';

const CLASS_URL = 'warlock-phb';

const FEATURE_ID = getClassFeatureId(CLASS_URL, 'invocations');

const POOL_KEY = `${FEATURE_ID}:options`;

const AGONIZING = 'Мучительный взрыв';
const CHAIN = 'Договор цепи';
const MASK = 'Маска многих лиц';
const REPELLING = 'Отталкивающий взрыв';
const TWO_MINDS = 'Взгляд двух умов';
const DEVIL_SIGHT = 'Дьявольское зрение';

/**
 * Вариант воззвания в ответе класса.
 *
 * @param key ключ варианта.
 * @param name название варианта.
 * @param patch прочие поля варианта.
 * @returns вариант умения в ответе.
 */
function createOption(
  key: string,
  name: string,
  patch: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    key,
    name: { rus: name, eng: '' },
    requiredClassLevel: null,
    repeatable: false,
    description: '',
    ...patch,
  };
}

/** Колдун с воззваниями: 1 с первого уровня, 3 со второго, 5 с пятого. */
function createWarlock(replacement: string | null): ClassSummary {
  const summary = parseClassDetail({
    url: CLASS_URL,
    name: { rus: 'Колдун' },
    hasSubclasses: false,
    features: [
      {
        key: 'invocations',
        level: 1,
        name: 'Таинственные воззвания',
        description: '',
        options: [
          createOption('agonizing', AGONIZING),
          createOption('pact-chain', CHAIN, {
            grantedSpells: [
              {
                spell: {
                  url: 'find-familiar-phb',
                  name: { rus: 'Поиск фамильяра' },
                  level: 1,
                  school: 'conjuration',
                  concentration: false,
                  ritual: true,
                },
              },
            ],
          }),
          createOption('mask', MASK),
          createOption('repelling', REPELLING),
          createOption('two-minds', TWO_MINDS, { requiredClassLevel: 5 }),
          createOption('devil-sight', DEVIL_SIGHT),
        ],
        optionsChoice: {
          count: 1,
          scaling: [
            { level: 1, count: 1 },
            { level: 2, count: 3 },
            { level: 5, count: 5 },
          ],
          replacement,
        },
      },
    ],
  });

  if (!summary) {
    throw new Error('Класс не разобрался');
  }

  return summary;
}

const warlock = createWarlock('EVERY_LEVEL');

/** Ответы второго уровня: одно воззвание первого и два второго. */
const SECOND_LEVEL_ANSWERS: Record<string, string[]> = {
  [`${POOL_KEY}-1`]: [AGONIZING],
  [`${POOL_KEY}-2`]: [CHAIN, MASK],
};

/** Ответы второго уровня ключами записи умения. */
const SECOND_LEVEL_ANSWERS_TAILS = {
  'options-1': [AGONIZING],
  'options-2': [CHAIN, MASK],
};

const REPLACE_3 = getOptionReplacementId(POOL_KEY, 3);
const REPLACE_5 = getOptionReplacementId(POOL_KEY, 5);

/**
 * Записи листа, которые повышение на уровень собирает для колдуна.
 *
 * @param level уровень класса.
 * @param answers ответы игрока по идентификаторам выборов.
 * @returns пересобранные записи.
 */
function buildLevel(
  level: number,
  answers: Record<string, string[]>,
): CharacterFeature[] {
  return buildLevelClassFeatures(
    warlock,
    null,
    level,
    {},
    { answers, proficientSkillNames: [] },
  );
}

/**
 * Запись самого умения среди собранных.
 *
 * @param features собранные записи.
 * @returns запись умения.
 */
function getMainFeature(features: CharacterFeature[]): CharacterFeature {
  const feature = features.find((entry) => entry.id === FEATURE_ID);

  if (!feature) {
    throw new Error('Умение не собрано');
  }

  return feature;
}

/**
 * Названия вариантов, у которых есть своя запись.
 *
 * @param features собранные записи.
 * @returns названия вариантов без названия умения.
 */
function getOptionRecordNames(features: CharacterFeature[]): string[] {
  return features
    .filter((feature) => feature.id.startsWith(`${FEATURE_ID}:option:`))
    .map((feature) => feature.name.split(': ')[1] ?? '')
    .toSorted();
}

describe('замена варианта умения при повышении уровня', () => {
  it('форма класса не теряет правило замены при загрузке', () => {
    const loaded = normalizeLoadedClass({
      features: [
        {
          key: 'invocations',
          options: [],
          optionsChoice: {
            count: 1,
            scaling: [],
            replacement: 'CHOICE_LEVELS',
          },
        },
      ],
    });

    expect(loaded.features).toMatchObject([
      { optionsChoice: { replacement: 'CHOICE_LEVELS' } },
    ]);
  });

  it('на третьем уровне предлагает заменить взятое раньше', () => {
    const [row] = getLevelFeatureRows(warlock, null, 3, SECOND_LEVEL_ANSWERS);

    expect(row?.optionReplacement?.id).toBe(REPLACE_3);
    expect(row?.optionReplacement?.removable).toEqual([AGONIZING, CHAIN, MASK]);
    expect(row?.choices).toEqual([]);
  });

  it('без правила замены умение на третьем уровне не возвращается', () => {
    const rows = getLevelFeatureRows(
      createWarlock(null),
      null,
      3,
      SECOND_LEVEL_ANSWERS,
    );

    expect(rows).toEqual([]);
  });

  it('при «только на ступенях» заменяют на пятом, но не на третьем', () => {
    const choiceLevels = createWarlock('CHOICE_LEVELS');

    expect(
      getLevelFeatureRows(choiceLevels, null, 3, SECOND_LEVEL_ANSWERS),
    ).toEqual([]);

    const [row] = getLevelFeatureRows(
      choiceLevels,
      null,
      5,
      SECOND_LEVEL_ANSWERS,
    );

    expect(row?.optionReplacement?.id).toBe(REPLACE_5);
  });

  it('пул замены — без взятого и без убранного, с уровнем этого шага', () => {
    const [row] = getLevelFeatureRows(warlock, null, 3, SECOND_LEVEL_ANSWERS);
    const choice = row?.optionReplacement?.choice;

    if (!choice) {
      throw new Error('Замены нет');
    }

    const selections = { ...SECOND_LEVEL_ANSWERS, [REPLACE_3]: [CHAIN] };
    const taken = new Set(getTakenOptionValues(choice, selections));

    // «Взгляд двух умов» — с пятого уровня, на третьем его нет
    expect(choice.listed.filter((name) => !taken.has(name))).toEqual([
      REPELLING,
      DEVIL_SIGHT,
    ]);
  });

  it('замена меняет строку умения и записи вариантов с дарами', () => {
    const answers = {
      ...SECOND_LEVEL_ANSWERS,
      [REPLACE_3]: [CHAIN, REPELLING],
    };

    const features = buildLevel(3, answers);
    const main = getMainFeature(features);

    expect(main.choice).toBe(`${AGONIZING}, ${MASK}, ${REPELLING}`);

    expect(main.choiceAnswers).toMatchObject({
      'options-1': [AGONIZING],
      'options-2': [CHAIN, MASK],
      'options-replace-3': [CHAIN, REPELLING],
    });

    expect(getOptionRecordNames(features)).toEqual(
      [AGONIZING, MASK, REPELLING].toSorted(),
    );

    expect(features.flatMap((feature) => feature.spells ?? [])).toEqual([]);
  });

  it('применение уносит запись убранного варианта', () => {
    const secondLevel = buildLevel(2, SECOND_LEVEL_ANSWERS);

    const thirdLevel = buildLevel(3, {
      ...SECOND_LEVEL_ANSWERS,
      [REPLACE_3]: [CHAIN, REPELLING],
    });

    const remaining = withoutDroppedOptionFeatures(secondLevel, thirdLevel);

    expect(getOptionRecordNames(remaining)).toEqual(
      [AGONIZING, MASK].toSorted(),
    );
  });

  it('пятый уровень: новые варианты и ещё замена не теряют прошлую', () => {
    const third = buildLevel(3, {
      ...SECOND_LEVEL_ANSWERS,
      [REPLACE_3]: [CHAIN, REPELLING],
    });

    // Повторное повышение: ответы прошлых уровней — только с записи листа
    const stored = withStoredFeatureAnswers(
      {},
      third,
      CLASS_URL,
      warlock.features,
    );

    expect(stored[REPLACE_3]).toEqual([CHAIN, REPELLING]);

    const [row] = getLevelFeatureRows(warlock, null, 5, stored);

    const stepChoice = row?.choices.find(
      (choice) => choice.id === `${POOL_KEY}-5`,
    );

    if (!stepChoice || !row?.optionReplacement) {
      throw new Error('Нет ступени или замены пятого уровня');
    }

    // Убранный на третьем «Договор цепи» снова доступен
    const stepTaken = new Set(getTakenOptionValues(stepChoice, stored));

    expect(stepChoice.listed.filter((name) => !stepTaken.has(name))).toEqual([
      CHAIN,
      TWO_MINDS,
      DEVIL_SIGHT,
    ]);

    expect(row.optionReplacement.removable).toEqual([
      AGONIZING,
      MASK,
      REPELLING,
    ]);

    // Новые и замена не предлагают одно и то же дважды
    const selections = {
      ...stored,
      [`${POOL_KEY}-5`]: [TWO_MINDS, DEVIL_SIGHT],
      [REPLACE_5]: [AGONIZING, CHAIN],
    };

    expect(
      getTakenOptionValues(row.optionReplacement.choice, selections),
    ).toEqual(expect.arrayContaining([TWO_MINDS, DEVIL_SIGHT, AGONIZING]));

    expect(getTakenOptionValues(stepChoice, selections)).toContain(CHAIN);

    const fifth = buildLevel(5, selections);
    const main = getMainFeature(fifth);

    expect(main.choice).toBe(
      `${MASK}, ${TWO_MINDS}, ${DEVIL_SIGHT}, ${REPELLING}, ${CHAIN}`,
    );

    expect(getOptionRecordNames(fifth)).toEqual(
      [MASK, TWO_MINDS, DEVIL_SIGHT, REPELLING, CHAIN].toSorted(),
    );

    // «Договор цепи», взятый заменой, приносит свой «Поиск фамильяра»
    const chain = fifth.find(
      (feature) => feature.id === `${FEATURE_ID}:option:pact-chain`,
    );

    expect(chain?.level).toBe(5);

    expect(chain?.spells?.map((spell) => spell.url)).toEqual([
      'find-familiar-phb',
    ]);
  });

  it('понижение уровня откатывает замену вместе с уровнем', () => {
    const third = buildLevel(3, {
      ...SECOND_LEVEL_ANSWERS,
      [REPLACE_3]: [CHAIN, REPELLING],
    });

    const rolledBack = removeFeaturesAboveLevel(third, { [CLASS_URL]: 2 });
    const main = getMainFeature(rolledBack);

    expect(main.choice).toBe(`${AGONIZING}, ${CHAIN}, ${MASK}`);
    expect(main.choiceAnswers).toEqual(SECOND_LEVEL_ANSWERS_TAILS);

    // Запись варианта, взятого заменой, снимается с уровнем замены
    expect(getOptionRecordNames(rolledBack)).toEqual(
      [AGONIZING, MASK].toSorted(),
    );
  });
});
