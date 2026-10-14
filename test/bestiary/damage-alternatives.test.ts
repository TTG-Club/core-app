import type { CreatureDamageAlternative } from '~bestiary/model';
import type { DamageFormulaPart } from '~ui/damage-formula';

import { describe, expect, it } from 'vitest';

import {
  createCreatureDamageAlternative,
  createEmptyCreatureActionEffect,
  CREATURE_ACTION_EFFECT_CONTEXTS,
  getCreatureActionCombatFilledCount,
  getCreatureDamageAlternativeView,
  MAX_CREATURE_DAMAGE_ALTERNATIVES,
  normalizeCreatureActionEffect,
  parseLoadedCreatureActionEffect,
  replaceCreatureDamageAlternativeParts,
} from '~bestiary/model';

/** Основной урон роя из бестиария 2024. */
const SWARM_BASE_FORMULA = '4к8@dmg.necrotic + 2';

/** Урон «или» роя: пока рой окровавлен. */
const SWARM_BLOODIED_FORMULA = '2к8@dmg.necrotic@self.status.bloodied + 2';

/** Подпись варианта химеры. */
const ADVANTAGE_LABEL = 'С преимуществом';

/** Урон «или» химеры. */
const CHIMERA_ADVANTAGE_FORMULA = '4к6 + 4';

/** Формула варианта «если цель схвачена». */
const TARGET_GRAPPLED_FORMULA = '2к8@target.status.grappled';

/** Строка варианта, который берётся сам, когда атакующий окровавлен. */
const SELF_BLOODIED_CAPTION = 'Берётся сам — если у атакующего: Окровавленный';

/**
 * Создаёт часть урона в виде, который отдаёт разбор `/raw`.
 *
 * @param formula формула части.
 * @returns часть урона.
 */
function createPart(formula: string): DamageFormulaPart {
  return {
    formula,
    target: 'selected',
    requiresDamage: false,
    versatileFormula: undefined,
  };
}

/**
 * Создаёт вариант урона для формы.
 *
 * @param condition способ выбора.
 * @param formula формула единственной части.
 * @returns вариант урона.
 */
function createAlternative(
  condition: CreatureDamageAlternative['condition'],
  formula: string,
): CreatureDamageAlternative {
  return { condition, label: '', damageParts: [createPart(formula)] };
}

/**
 * Создаёт вариант урона в виде ответа бэкенда.
 *
 * @param condition способ выбора, как он лежит в данных.
 * @param formula формула единственной части.
 * @returns вариант, как его хранит бэкенд.
 */
function createLoadedAlternative(condition: string, formula: string) {
  return {
    condition,
    damageParts: [{ formula, target: 'selected', requiresDamage: false }],
  };
}

describe('разбор урона «или» из /raw', () => {
  it('сохраняет способы formula, ask и random', () => {
    const effect = parseLoadedCreatureActionEffect({
      damageParts: [{ formula: SWARM_BASE_FORMULA, target: 'selected' }],
      damageAlternatives: [
        createLoadedAlternative('formula', SWARM_BLOODIED_FORMULA),
        {
          ...createLoadedAlternative('ask', CHIMERA_ADVANTAGE_FORMULA),
          label: ADVANTAGE_LABEL,
        },
        createLoadedAlternative('random', '1к6'),
      ],
    });

    expect(effect.damageAlternatives).toEqual([
      createAlternative('formula', SWARM_BLOODIED_FORMULA),
      {
        ...createAlternative('ask', CHIMERA_ADVANTAGE_FORMULA),
        label: ADVANTAGE_LABEL,
      },
      createAlternative('random', '1к6'),
    ]);
  });

  it('без поля — пустой список', () => {
    expect(
      parseLoadedCreatureActionEffect({ damageParts: [] }).damageAlternatives,
    ).toEqual([]);

    expect(parseLoadedCreatureActionEffect(null).damageAlternatives).toEqual(
      [],
    );
  });

  it('мусор выпадает, соседние остаются', () => {
    const effect = parseLoadedCreatureActionEffect({
      damageAlternatives: [
        createLoadedAlternative('selfStatus', '2к8'),
        { condition: 'ask', damageParts: [] },
        { condition: 'ask' },
        'строка',
        createLoadedAlternative('ask', '1к10'),
      ],
    });

    expect(effect.damageAlternatives).toEqual([
      createAlternative('ask', '1к10'),
    ]);
  });

  it('сверх предела — обрезается до предела', () => {
    const effect = parseLoadedCreatureActionEffect({
      damageAlternatives: Array.from(
        { length: MAX_CREATURE_DAMAGE_ALTERNATIVES + 1 },
        (_, index) => createLoadedAlternative('ask', `${index + 1}к6`),
      ),
    });

    expect(effect.damageAlternatives).toHaveLength(
      MAX_CREATURE_DAMAGE_ALTERNATIVES,
    );

    expect(effect.damageAlternatives.at(-1)?.damageParts[0]?.formula).toBe(
      `${MAX_CREATURE_DAMAGE_ALTERNATIVES}к6`,
    );
  });

  it('поле битого типа не роняет механику', () => {
    const effect = parseLoadedCreatureActionEffect({
      attackBonus: 4,
      damageAlternatives: 'мусор',
    });

    expect(effect.attackBonus).toBe(4);
    expect(effect.damageAlternatives).toEqual([]);
  });
});

describe('отправка урона «или»', () => {
  it('пустые части и варианты выбрасываются, подпись обрезается', () => {
    const effect = normalizeCreatureActionEffect(
      {
        ...createEmptyCreatureActionEffect(),
        damageAlternatives: [
          {
            condition: 'ask',
            label: `  ${ADVANTAGE_LABEL}  `,
            damageParts: [
              createPart(` ${CHIMERA_ADVANTAGE_FORMULA} `),
              createPart('  '),
            ],
          },
          { condition: 'random', label: 'пустой', damageParts: [] },
          { condition: 'formula', label: '', damageParts: [createPart('')] },
          {
            condition: 'random',
            label: '   ',
            damageParts: [createPart('1к6')],
          },
        ],
      },
      CREATURE_ACTION_EFFECT_CONTEXTS.actions,
    );

    expect(effect.damageAlternatives).toEqual([
      {
        condition: 'ask',
        label: ADVANTAGE_LABEL,
        damageParts: [createPart(CHIMERA_ADVANTAGE_FORMULA)],
      },
      {
        condition: 'random',
        label: undefined,
        damageParts: [createPart('1к6')],
      },
    ]);

    // Пустая подпись в запрос не уходит
    expect(JSON.stringify(effect.damageAlternatives[1])).not.toContain('label');
  });
});

describe('вариант в форме', () => {
  it('с состоянием в формуле берётся сам и прячет способы', () => {
    const alternativeView = getCreatureDamageAlternativeView(
      createAlternative('formula', SWARM_BLOODIED_FORMULA),
      false,
    );

    expect(alternativeView.isAutomatic).toBe(true);
    expect(alternativeView.automaticCaption).toBe(SELF_BLOODIED_CAPTION);
    expect(alternativeView.lacksStatus).toBe(false);
  });

  it('несколько состояний — через « и »', () => {
    const alternativeView = getCreatureDamageAlternativeView(
      createAlternative(
        'formula',
        `${SWARM_BLOODIED_FORMULA} + 1к6@target.status.grappled`,
      ),
      false,
    );

    expect(alternativeView.automaticCaption).toBe(
      `${SELF_BLOODIED_CAPTION} и если у цели: Схваченный`,
    );
  });

  it('ввод состояния в формулу ставит способ «по формуле»', () => {
    const alternative = replaceCreatureDamageAlternativeParts(
      createAlternative('ask', '2к8'),
      [createPart(TARGET_GRAPPLED_FORMULA)],
    );

    expect(alternative.condition).toBe('formula');

    // Без состояния способ не трогается
    expect(
      replaceCreatureDamageAlternativeParts(createAlternative('ask', '2к8'), [
        createPart('3к8'),
      ]).condition,
    ).toBe('ask');
  });

  it('«по формуле» без состояния предупреждает', () => {
    const alternativeView = getCreatureDamageAlternativeView(
      createAlternative('formula', '2к8 + 2'),
      false,
    );

    expect(alternativeView.isAutomatic).toBe(false);
    expect(alternativeView.automaticCaption).toBe('');
    expect(alternativeView.lacksStatus).toBe(true);

    expect(
      getCreatureDamageAlternativeView(createAlternative('ask', '2к8'), false)
        .lacksStatus,
    ).toBe(false);
  });

  it('состояние цели у действия с областью предупреждает', () => {
    const alternative = createAlternative('formula', TARGET_GRAPPLED_FORMULA);

    expect(getCreatureDamageAlternativeView(alternative, true).warnsArea).toBe(
      true,
    );

    expect(getCreatureDamageAlternativeView(alternative, false).warnsArea).toBe(
      false,
    );
  });

  it('новый вариант копирует непустой основной урон', () => {
    expect(
      createCreatureDamageAlternative([
        createPart(SWARM_BASE_FORMULA),
        createPart(''),
      ]),
    ).toEqual(createAlternative('formula', SWARM_BASE_FORMULA));

    expect(createCreatureDamageAlternative([]).damageParts).toHaveLength(1);
  });
});

describe('бейдж раздела «Бой»', () => {
  it('только вариант с формулой — урон заполнен', () => {
    expect(
      getCreatureActionCombatFilledCount(createEmptyCreatureActionEffect()),
    ).toBe(0);

    expect(
      getCreatureActionCombatFilledCount({
        ...createEmptyCreatureActionEffect(),
        damageAlternatives: [createAlternative('ask', '1к6')],
      }),
    ).toBe(1);
  });
});
