import type {
  ActiveEffect,
  EffectFormContext,
  EffectTrigger,
} from '~active-effects/model';

import { describe, expect, it } from 'vitest';

import {
  describeActiveEffect,
  describeEffectChangeCondition,
  describeEffectLight,
  describeEffectTrigger,
  describeSaveDcFormulaError,
  describeSaveOverride,
  EFFECT_FLAG_OPTIONS,
  EFFECT_SAVE_DC_FORMULA_ERRORS,
  formatEffectSaveDc,
  normalizeActiveEffects,
  normalizeLoadedActiveEffects,
  parseCreatureTypeCondition,
  readTriggerConditionParts,
  writeCreatureTypeCondition,
  writeTriggerCondition,
  writeTriggerEvent,
} from '~active-effects/model';

import {
  CONSTITUTION_SAVE,
  createEffect,
  createRawEffect,
  POISON_DAMAGE,
  resolveLayoutFor,
  SAVE_DC,
  stripUndefinedKeys,
} from './fixtures';

/** Сл формулой по владельцу эффекта: «Ошеломляющий удар». */
const OWNER_DC_FORMULA = '8 + @prof + @mod.wis';

/** Сл формулой от урона события. */
const DAMAGE_DC_FORMULA = 'max(10, floor(@damage / 2))';

/** Свет «Короны света»: яркий 30 фт и тусклый ещё 30. */
const CROWN_LIGHT = { bright: 30, dim: 30, color: '#ffeeaa' } as const;

/** «Легендарное сопротивление»: три раза в день. */
const LEGENDARY_RESISTANCE = { limit: { max: 3, per: 'longRest' } } as const;

/** Условие «цель — нежить или исчадие». */
const UNDEAD_OR_FIEND_TARGET = 'target.creatureType === "undead, fiend"';

/** Условие «носитель — не конструкт и не нежить». */
const NOT_CONSTRUCT_CARRIER = 'self.creatureType !== "construct, undead"';

/** Условие «спасбросок вызвало исчадие или нежить». */
const FIEND_SOURCE = 'source.creatureType === "fiend, undead"';

/** Флаги волны 1: ограничения действий. */
const RESTRICTION_FLAGS = [
  'actions.noReaction',
  'actions.noBonusAction',
  'actions.oneActionOrBonus',
  'spellcasting.blocked',
  'spellcasting.noVerbal',
  'concentration.blocked',
];

/**
 * Эффект по кругу редактора: сохранение (`normalizeActiveEffects` и
 * `JSON`), затем разбор ответа сервера.
 *
 * @param effect эффект из формы.
 * @param context место формы.
 * @returns эффект, каким его снова откроет форма.
 */
function roundTripEffect(
  effect: ActiveEffect,
  context: EffectFormContext,
): ActiveEffect | undefined {
  return normalizeLoadedActiveEffects(
    stripUndefinedKeys(normalizeActiveEffects([effect], context)),
  )[0];
}

/**
 * Эффект, сохранённый формой, как его увидит сервер.
 *
 * @param effect эффект из формы.
 * @param context место формы.
 * @returns данные эффекта.
 */
function saveEffect(effect: ActiveEffect, context: EffectFormContext): unknown {
  return stripUndefinedKeys(normalizeActiveEffects([effect], context)[0]);
}

/**
 * Срабатывание урона по носителю со спасброском.
 *
 * @param dcFormula формула Сл.
 * @returns срабатывание.
 */
function createDamageTakenTrigger(dcFormula: string): EffectTrigger {
  return {
    id: 'trigger_test',
    event: 'damageTaken',
    save: { ability: 'constitution', dc: SAVE_DC, dcFormula },
    actions: [{ type: 'removeSelf', on: 'saved' }],
  };
}

describe('сл формулой (dcFormula)', () => {
  it('переживает сохранение во всех пяти местах и у наложенного состояния', () => {
    const effect = createEffect({
      applySave: { ...CONSTITUTION_SAVE, dcFormula: OWNER_DC_FORMULA },
      recurringSave: {
        ability: 'wisdom',
        dc: SAVE_DC,
        dcFormula: OWNER_DC_FORMULA,
        timing: 'endOfTurn',
      },
      recurringDamage: {
        damageParts: POISON_DAMAGE,
        timing: 'startOfTurn',
        save: { ...CONSTITUTION_SAVE, dcFormula: OWNER_DC_FORMULA },
      },
      escape: {
        check: { skill: 'athletics', dc: SAVE_DC, dcFormula: OWNER_DC_FORMULA },
      },
      triggers: [
        createDamageTakenTrigger(DAMAGE_DC_FORMULA),
        {
          id: 'trigger_stun',
          event: 'attackRoll',
          save: { ability: 'constitution', dc: 0, dcFormula: OWNER_DC_FORMULA },
          actions: [
            {
              type: 'applyCondition',
              conditionKey: 'stunned',
              recurringSave: {
                ability: 'constitution',
                dc: 0,
                dcFormula: OWNER_DC_FORMULA,
                timing: 'endOfTurn',
              },
            },
          ],
        },
      ],
    });

    const loaded = roundTripEffect(effect, 'generic');

    expect(loaded?.applySave?.dcFormula).toBe(OWNER_DC_FORMULA);
    expect(loaded?.recurringSave?.dcFormula).toBe(OWNER_DC_FORMULA);
    expect(loaded?.recurringDamage?.save?.dcFormula).toBe(OWNER_DC_FORMULA);
    expect(loaded?.escape?.check?.dcFormula).toBe(OWNER_DC_FORMULA);
    expect(loaded?.triggers?.[0]?.save?.dcFormula).toBe(DAMAGE_DC_FORMULA);
    expect(loaded?.triggers?.[1]?.save?.dcFormula).toBe(OWNER_DC_FORMULA);

    const stunAction = loaded?.triggers?.[1]?.actions[0];

    expect(
      stunAction?.type === 'applyCondition'
        ? stunAction.recurringSave?.dcFormula
        : undefined,
    ).toBe(OWNER_DC_FORMULA);
  });

  it('пустая формула не пишется, число Сл остаётся', () => {
    const saved = saveEffect(
      createEffect({
        applySave: { ...CONSTITUTION_SAVE, dcFormula: '  ' },
        escape: { check: { skill: 'athletics', dc: SAVE_DC, dcFormula: '' } },
        triggers: [createDamageTakenTrigger('')],
      }),
      'generic',
    );

    expect(JSON.stringify(saved)).not.toContain('dcFormula');
    expect(saved).toMatchObject({ applySave: { dc: SAVE_DC } });
  });

  it('формула по владельцу работает на любом событии, @damage — только у урона', () => {
    const layout = resolveLayoutFor('generic');

    const ownerFormula = writeTriggerEvent(
      createDamageTakenTrigger(OWNER_DC_FORMULA),
      'turnEnd',
      layout,
    );

    const damageFormula = writeTriggerEvent(
      createDamageTakenTrigger(DAMAGE_DC_FORMULA),
      'turnEnd',
      layout,
    );

    expect(ownerFormula.save?.dcFormula).toBe(OWNER_DC_FORMULA);
    expect(damageFormula.save?.dcFormula).toBeUndefined();

    expect(
      describeSaveDcFormulaError(DAMAGE_DC_FORMULA, { acceptsDamage: false }),
    ).toBe(EFFECT_SAVE_DC_FORMULA_ERRORS.damageOutsideEvent);

    expect(
      describeSaveDcFormulaError(OWNER_DC_FORMULA, { acceptsDamage: false }),
    ).toBeUndefined();
  });

  it('читается словами в описании', () => {
    expect(formatEffectSaveDc({ dc: SAVE_DC, dcFormula: '8 + @prof' })).toBe(
      'Сл 8 + бонус мастерства',
    );

    expect(formatEffectSaveDc({ dc: SAVE_DC })).toBe(`Сл ${SAVE_DC}`);

    expect(
      describeEffectTrigger(createDamageTakenTrigger('@spellDc'), {
        formatDc: formatEffectSaveDc,
      }),
    ).toContain('Сл Сл заклинаний');
  });
});

describe('провал в успех (saveOverride)', () => {
  it('счётчик и ресурс переживают сохранение', () => {
    expect(
      roundTripEffect(
        createEffect({ saveOverride: LEGENDARY_RESISTANCE }),
        'feature',
      )?.saveOverride,
    ).toEqual(LEGENDARY_RESISTANCE);

    expect(
      roundTripEffect(
        createEffect({ saveOverride: { counter: ' luck ' } }),
        'feature',
      )?.saveOverride,
    ).toEqual({ counter: 'luck' });
  });

  it('блок, которому нечем платить, не пишется', () => {
    expect(
      saveEffect(createEffect({ saveOverride: { counter: '   ' } }), 'feature'),
    ).not.toHaveProperty('saveOverride');

    expect(
      normalizeLoadedActiveEffects([createRawEffect({ saveOverride: {} })])[0]
        ?.saveOverride,
    ).toBeUndefined();
  });

  it('читается словами', () => {
    expect(describeSaveOverride(LEGENDARY_RESISTANCE)).toBe(
      'провал спасброска — вместо этого успех, 3 раза до долгого отдыха',
    );

    expect(describeSaveOverride({ counter: 'luck' })).toBe(
      'провал спасброска — вместо этого успех за ресурс «luck»',
    );
  });

  it('работает только там, где эффект лежит на носителе', () => {
    expect(resolveLayoutFor('creatureTrait').showSaveOverride).toBe(true);
    expect(resolveLayoutFor('generic').showSaveOverride).toBe(true);
    expect(resolveLayoutFor('creatureAction').showSaveOverride).toBe(false);
  });
});

describe('свет (light)', () => {
  it('переживает сохранение', () => {
    expect(
      roundTripEffect(createEffect({ light: CROWN_LIGHT }), 'spell')?.light,
    ).toEqual(CROWN_LIGHT);

    const flickering = { bright: 0, dim: 10, animation: 'torch' } as const;

    expect(
      roundTripEffect(createEffect({ light: flickering }), 'item')?.light,
    ).toEqual(flickering);
  });

  it('свет без радиуса, белый цвет и ровный свет не пишутся', () => {
    expect(
      saveEffect(createEffect({ light: { bright: 0, dim: 0 } }), 'spell'),
    ).not.toHaveProperty('light');

    expect(
      saveEffect(
        createEffect({
          light: { bright: 20, dim: 20, color: '#FFFFFF', animation: 'none' },
        }),
        'spell',
      ),
    ).toMatchObject({ light: { bright: 20, dim: 20 } });

    expect(
      JSON.stringify(
        saveEffect(
          createEffect({
            light: { bright: 20, dim: 20, color: '#FFFFFF', animation: 'none' },
          }),
          'spell',
        ),
      ),
    ).not.toMatch(/color|animation/);
  });

  it('битый цвет при разборе снимается, свет остаётся', () => {
    expect(
      normalizeLoadedActiveEffects([
        createRawEffect({ light: { bright: 30, dim: 30, color: 'yellow' } }),
      ])[0]?.light,
    ).toEqual({ bright: 30, dim: 30 });
  });

  it('читается словами', () => {
    expect(describeEffectLight(CROWN_LIGHT)).toBe(
      'излучает яркий свет 30 фт и тусклый ещё 30 фт',
    );

    expect(describeEffectLight({ bright: 0, dim: 10 })).toBe(
      'излучает тусклый 10 фт',
    );

    expect(describeActiveEffect(createEffect({ light: CROWN_LIGHT }))).toMatch(
      /^Излучает яркий свет 30 фт и тусклый ещё 30 фт/,
    );
  });
});

describe('флаги ограничений действий', () => {
  it('есть в словаре сайта и переживают сохранение', () => {
    const knownFlags = new Set(EFFECT_FLAG_OPTIONS.map((flag) => flag.value));

    expect(RESTRICTION_FLAGS.every((flag) => knownFlags.has(flag))).toBe(true);

    expect(
      roundTripEffect(createEffect({ flags: RESTRICTION_FLAGS }), 'spell')
        ?.flags,
    ).toEqual(RESTRICTION_FLAGS);
  });
});

describe('условие по типу существа списком', () => {
  it('разбирается и пишется обратно той же строкой', () => {
    for (const condition of [
      UNDEAD_OR_FIEND_TARGET,
      NOT_CONSTRUCT_CARRIER,
      FIEND_SOURCE,
    ]) {
      const parsed = parseCreatureTypeCondition(condition);

      expect(parsed).toBeDefined();

      expect(
        parsed && writeCreatureTypeCondition(parsed.subject, parsed.condition),
      ).toBe(condition);
    }

    expect(
      parseCreatureTypeCondition('target.creatureType === "undead, dragonkin"'),
    ).toBeUndefined();
  });

  it('читается словами', () => {
    expect(describeEffectChangeCondition(UNDEAD_OR_FIEND_TARGET)).toBe(
      'Цель — Нежить или Исчадие',
    );

    expect(describeEffectChangeCondition(NOT_CONSTRUCT_CARRIER)).toBe(
      'Носитель — не Конструкт и не Нежить',
    );
  });

  it('в условии срабатывания — список и «не из списка»', () => {
    const parts = readTriggerConditionParts(NOT_CONSTRUCT_CARRIER);

    expect(parts).toEqual([
      { kind: 'selfCreatureTypeNot', value: 'construct, undead' },
    ]);

    expect(writeTriggerCondition(parts)).toBe(NOT_CONSTRUCT_CARRIER);

    expect(
      describeEffectTrigger(
        {
          id: 'trigger_type',
          event: 'damageTaken',
          condition: 'target.creatureType === "undead, fiend"',
          actions: [{ type: 'removeSelf' }],
        },
        { formatDc: formatEffectSaveDc },
      ),
    ).toContain('другая сторона — Нежить или Исчадие');
  });

  it('переживает сохранение во всех местах условий', () => {
    const effect = createEffect({
      changes: [
        {
          key: 'damage.all',
          mode: 'add',
          value: '1к8',
          condition: UNDEAD_OR_FIEND_TARGET,
          priority: 20,
        },
      ],
      rollCondition: FIEND_SOURCE,
      landingCondition: NOT_CONSTRUCT_CARRIER,
      triggers: [
        {
          id: 'trigger_type',
          event: 'turnStart',
          condition: NOT_CONSTRUCT_CARRIER,
          recipient: 'choice',
          choice: { radius: 30, condition: UNDEAD_OR_FIEND_TARGET },
          actions: [{ type: 'removeSelf' }],
        },
      ],
    });

    const loaded = roundTripEffect(effect, 'generic');

    expect(loaded?.changes[0]?.condition).toBe(UNDEAD_OR_FIEND_TARGET);
    expect(loaded?.rollCondition).toBe(FIEND_SOURCE);
    expect(loaded?.landingCondition).toBe(NOT_CONSTRUCT_CARRIER);
    expect(loaded?.triggers?.[0]?.condition).toBe(NOT_CONSTRUCT_CARRIER);

    expect(loaded?.triggers?.[0]?.choice?.condition).toBe(
      UNDEAD_OR_FIEND_TARGET,
    );
  });
});
