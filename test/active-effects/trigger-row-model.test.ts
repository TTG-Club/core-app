import type {
  EffectFormLayout,
  EffectTrigger,
  EffectTriggerAction,
} from '~active-effects/model';

import { describe, expect, it } from 'vitest';

import {
  clearTriggerActionGate,
  createEffectTriggerAction,
  DEFAULT_EFFECT_TAG,
  DEFAULT_SET_HP_VALUE,
  DEFAULT_TRIGGER_ATTACK_ROLE,
  DEFAULT_TRIGGER_CONDITION,
  EFFECT_TRIGGER_DAMAGE_HALF_GATE,
  normalizeLoadedActiveEffects,
  omitTriggerSaveDcFormula,
  readTriggerActionRounds,
  resolveEffectFormLayout,
  writeTriggerActionGate,
  writeTriggerActionRounds,
  writeTriggerEvent,
} from '~active-effects/model';

import { createEffect, POISON_DAMAGE, resolveLayoutFor } from './fixtures';

/** Спасбросок строки: Телосложение, Сл 13. */
const CONSTITUTION_SAVE = { ability: 'constitution', dc: 13 } as const;

/** Формула Сл от урона события. */
const DAMAGE_DC_FORMULA = 'max(10, floor(@damage / 2))';

/** Срок отметки или состояния в тестах, раундов. */
const ACTION_ROUNDS = 2;

/**
 * Раскладка формы с заданным набором действий срабатывания: так тест не
 * зависит от того, какие действия место формы разрешает.
 */
const TRIGGER_LAYOUT: EffectFormLayout = {
  ...resolveLayoutFor('feature'),
  triggerActions: [
    'damage',
    'applyCondition',
    'applyTag',
    'setHp',
    'removeSelf',
  ],
};

/** Урон «провал — полный, успех — половина». */
const HALF_DAMAGE_ACTION: EffectTriggerAction = {
  type: 'damage',
  parts: POISON_DAMAGE,
  on: 'always',
  halfOnSave: true,
};

/** Отравление при успехе на два раунда. */
const SAVED_CONDITION_ACTION: EffectTriggerAction = {
  type: 'applyCondition',
  conditionKey: 'poisoned',
  on: 'saved',
  duration: { type: 'rounds', value: ACTION_ROUNDS },
};

/**
 * Строка срабатывания.
 *
 * @param overrides поля, отличные от умолчания.
 * @returns строка.
 */
function createTrigger(overrides: Partial<EffectTrigger> = {}): EffectTrigger {
  return {
    id: 'trigger_test',
    event: 'turnStart',
    actions: [],
    ...overrides,
  };
}

describe('новое действие срабатывания', () => {
  it('у каждого вида — свои значения по умолчанию', () => {
    expect(createEffectTriggerAction('damage')).toStrictEqual({
      type: 'damage',
      parts: [],
    });

    expect(createEffectTriggerAction('applyCondition')).toStrictEqual({
      type: 'applyCondition',
      conditionKey: DEFAULT_TRIGGER_CONDITION,
    });

    expect(createEffectTriggerAction('applyTag')).toStrictEqual({
      type: 'applyTag',
      tag: DEFAULT_EFFECT_TAG,
    });

    expect(createEffectTriggerAction('setHp')).toStrictEqual({
      type: 'setHp',
      value: DEFAULT_SET_HP_VALUE,
    });

    expect(createEffectTriggerAction('removeSelf')).toStrictEqual({
      type: 'removeSelf',
    });
  });
});

describe('действие без исхода', () => {
  it('урон теряет исход и «половину», части остаются', () => {
    expect(clearTriggerActionGate(HALF_DAMAGE_ACTION)).toStrictEqual({
      type: 'damage',
      parts: POISON_DAMAGE,
    });
  });

  it('остальные действия теряют только исход', () => {
    expect(clearTriggerActionGate(SAVED_CONDITION_ACTION)).toEqual({
      type: 'applyCondition',
      conditionKey: 'poisoned',
      duration: { type: 'rounds', value: ACTION_ROUNDS },
    });
  });
});

describe('спасбросок без формулы Сл', () => {
  it('остаются характеристика и число', () => {
    expect(
      omitTriggerSaveDcFormula({
        ...CONSTITUTION_SAVE,
        dcFormula: DAMAGE_DC_FORMULA,
      }),
    ).toStrictEqual(CONSTITUTION_SAVE);
  });
});

describe('смена события строки', () => {
  it('с броска атаки на ход: роль и получатель снимаются, id и условие остаются', () => {
    const trigger = createTrigger({
      event: 'attackRoll',
      role: 'target',
      recipient: 'other',
      condition: 'roll.hasAdvantage',
      actions: [{ type: 'removeSelf', on: 'always' }],
    });

    expect(writeTriggerEvent(trigger, 'turnEnd', TRIGGER_LAYOUT)).toEqual({
      id: trigger.id,
      event: 'turnEnd',
      condition: 'roll.hasAdvantage',
      actions: [{ type: 'removeSelf', on: 'always' }],
    });
  });

  it('с хода на бросок атаки: чей ход снимается, роль — по умолчанию', () => {
    const trigger = createTrigger({ event: 'turnStart', turnOf: 'source' });

    expect(writeTriggerEvent(trigger, 'attackRoll', TRIGGER_LAYOUT)).toEqual({
      id: trigger.id,
      event: 'attackRoll',
      role: DEFAULT_TRIGGER_ATTACK_ROLE,
      actions: [],
    });
  });

  it('роль у броска атаки сохраняется', () => {
    const trigger = createTrigger({ event: 'attackRoll', role: 'target' });

    expect(writeTriggerEvent(trigger, 'attackRoll', TRIGGER_LAYOUT).role).toBe(
      'target',
    );
  });

  it('формула Сл остаётся у событий урона и снимается у остальных', () => {
    const save = { ...CONSTITUTION_SAVE, dcFormula: DAMAGE_DC_FORMULA };
    const trigger = createTrigger({ event: 'damageTaken', save });

    expect(writeTriggerEvent(trigger, 'hpZero', TRIGGER_LAYOUT).save).toEqual(
      save,
    );

    expect(
      writeTriggerEvent(trigger, 'turnStart', TRIGGER_LAYOUT).save,
    ).toStrictEqual(CONSTITUTION_SAVE);
  });

  it('без спасброска спасбросок не появляется', () => {
    const trigger = createTrigger({ event: 'damageTaken' });

    expect(
      writeTriggerEvent(trigger, 'turnStart', TRIGGER_LAYOUT).save,
    ).toBeUndefined();
  });

  it('действия, которые на новом событии не работают, отбрасываются', () => {
    const setHpAction = createEffectTriggerAction('setHp');
    const damageAction = createEffectTriggerAction('damage');

    const trigger = createTrigger({
      event: 'hpZero',
      actions: [setHpAction, damageAction],
    });

    expect(
      writeTriggerEvent(trigger, 'damageTaken', TRIGGER_LAYOUT).actions,
    ).toEqual([damageAction]);

    expect(
      writeTriggerEvent(trigger, 'hpZero', TRIGGER_LAYOUT).actions,
    ).toEqual([setHpAction, damageAction]);
  });
});

describe('исход действия по выбору', () => {
  it('у урона обычный исход снимает «половину»', () => {
    expect(writeTriggerActionGate(HALF_DAMAGE_ACTION, 'failed')).toStrictEqual({
      type: 'damage',
      parts: POISON_DAMAGE,
      on: 'failed',
    });
  });

  it('«половина» у урона — всегда и вдвое при успехе', () => {
    expect(
      writeTriggerActionGate(
        { type: 'damage', parts: POISON_DAMAGE, on: 'failed' },
        EFFECT_TRIGGER_DAMAGE_HALF_GATE,
      ),
    ).toStrictEqual(HALF_DAMAGE_ACTION);
  });

  it('«половина» не у урона не пишется', () => {
    expect(
      writeTriggerActionGate(
        SAVED_CONDITION_ACTION,
        EFFECT_TRIGGER_DAMAGE_HALF_GATE,
      ),
    ).toBeNull();
  });

  it('остальные действия получают выбранный исход', () => {
    expect(writeTriggerActionGate(SAVED_CONDITION_ACTION, 'failed')).toEqual({
      ...SAVED_CONDITION_ACTION,
      on: 'failed',
    });
  });
});

describe('срок действия в раундах', () => {
  it('читается у состояния и отметки со сроком в раундах', () => {
    expect(readTriggerActionRounds(SAVED_CONDITION_ACTION)).toBe(ACTION_ROUNDS);

    expect(
      readTriggerActionRounds({
        type: 'applyTag',
        tag: DEFAULT_EFFECT_TAG,
        duration: { type: 'rounds', value: ACTION_ROUNDS },
      }),
    ).toBe(ACTION_ROUNDS);
  });

  it('без срока, со сроком не в раундах и у других действий — `null`', () => {
    expect(
      readTriggerActionRounds({ type: 'applyTag', tag: DEFAULT_EFFECT_TAG }),
    ).toBeNull();

    expect(
      readTriggerActionRounds({
        type: 'applyCondition',
        conditionKey: 'poisoned',
        duration: { type: 'permanent' },
      }),
    ).toBeNull();

    expect(readTriggerActionRounds(HALF_DAMAGE_ACTION)).toBeNull();
  });

  it('число пишется сроком в раундах', () => {
    expect(
      writeTriggerActionRounds(
        { type: 'applyTag', tag: DEFAULT_EFFECT_TAG },
        ACTION_ROUNDS,
      ),
    ).toEqual({
      type: 'applyTag',
      tag: DEFAULT_EFFECT_TAG,
      duration: { type: 'rounds', value: ACTION_ROUNDS },
    });
  });

  it('пустое поле и ноль снимают срок', () => {
    expect(
      writeTriggerActionRounds(SAVED_CONDITION_ACTION, undefined),
    ).toHaveProperty('duration', undefined);

    expect(
      writeTriggerActionRounds(SAVED_CONDITION_ACTION, null),
    ).toHaveProperty('duration', undefined);

    expect(writeTriggerActionRounds(SAVED_CONDITION_ACTION, 0)).toHaveProperty(
      'duration',
      undefined,
    );
  });

  it('у действия без срока ничего не меняется', () => {
    expect(writeTriggerActionRounds(HALF_DAMAGE_ACTION, ACTION_ROUNDS)).toBe(
      HALF_DAMAGE_ACTION,
    );
  });
});

describe('заготовки новых действий', () => {
  it('каждое действие места «заклинание на цели» проходит схему записи', () => {
    const layout = resolveEffectFormLayout(
      'spell',
      createEffect({ effectTarget: 'target' }),
    );

    for (const actionType of layout.triggerActions) {
      const action = createEffectTriggerAction(actionType);

      const [loadedEffect] = normalizeLoadedActiveEffects([
        createEffect({
          triggers: [
            { id: 'trigger_new', event: 'applied', actions: [action] },
          ],
        }),
      ]);

      // Пустой `{ type }` у действия с обязательными полями выпал бы при
      // следующем открытии
      expect(loadedEffect?.triggers?.[0]?.actions, actionType).toEqual([
        action,
      ]);
    }
  });
});

describe('смена события строки 0.8.66', () => {
  it('снятое состояние и шаг пути живут только у своих событий', () => {
    const lostTrigger = createTrigger({
      event: 'conditionLost',
      conditionKey: 'grappled',
    });

    expect(
      writeTriggerEvent(lostTrigger, 'conditionLost', TRIGGER_LAYOUT)
        .conditionKey,
    ).toBe('grappled');

    expect(
      writeTriggerEvent(lostTrigger, 'turnStart', TRIGGER_LAYOUT).conditionKey,
    ).toBeUndefined();

    const pathTrigger = createTrigger({ event: 'moved', everyFeet: 5 });

    expect(
      writeTriggerEvent(pathTrigger, 'moved', TRIGGER_LAYOUT).everyFeet,
    ).toBe(5);

    expect(
      writeTriggerEvent(pathTrigger, 'healed', TRIGGER_LAYOUT).everyFeet,
    ).toBeUndefined();
  });

  it('без формулы Сл режим спасброска и его условия остаются', () => {
    const save = {
      ...CONSTITUTION_SAVE,
      mode: 'advantage',
      dcFormula: DAMAGE_DC_FORMULA,
      modeIf: [{ condition: 'self.hp.temp === 0', mode: 'disadvantage' }],
      autoFailIf: 'self.condition === "unconscious"',
    } as const;

    const trigger = createTrigger({ event: 'damageTaken', save });

    expect(
      writeTriggerEvent(trigger, 'turnStart', TRIGGER_LAYOUT).save,
    ).toStrictEqual({
      ...CONSTITUTION_SAVE,
      mode: 'advantage',
      modeIf: [{ condition: 'self.hp.temp === 0', mode: 'disadvantage' }],
      autoFailIf: 'self.condition === "unconscious"',
    });
  });
});
