import type { EffectTrigger } from '~active-effects/model';

import { describe, expect, it } from 'vitest';

import {
  APPLIER_SAVE_DC,
  collectEffectTriggers,
  describeEffectTrigger,
  isLegacyTrigger,
  LEGACY_TRIGGER_IDS,
  listEffectListTriggers,
  resolveTriggerActionGate,
  writeEffectSuccessOutcome,
  writeEffectTriggers,
} from '~active-effects/model';

import {
  createEffect,
  POISON_DAMAGE,
  SAVE_DC,
  serializeEffect,
  TYPED_SAVE_DC,
} from './fixtures';

/** Спасбросок Телосложения со Сл эффектов в тестах, без исхода. */
const CONSTITUTION_TRIGGER_SAVE = {
  ability: 'constitution',
  dc: SAVE_DC,
} as const;

/**
 * Подпись Сл для фраз: `APPLIER_SAVE_DC` — Сл заклинателя.
 *
 * @param dc сложность.
 * @returns подпись.
 */
function formatDc(dc: number): string {
  return dc === APPLIER_SAVE_DC ? 'Сл заклинателя' : `Сл ${dc}`;
}

describe('чтение старых полей как срабатываний', () => {
  it('урон каждый ход: без спасброска, «без урона» и «половина урона»', () => {
    const recurringDamageEffect = createEffect({
      recurringDamage: { damageParts: POISON_DAMAGE, timing: 'startOfTurn' },
    });

    expect(listEffectListTriggers(recurringDamageEffect)).toEqual([
      {
        id: LEGACY_TRIGGER_IDS.recurringDamage,
        event: 'turnStart',
        actions: [{ type: 'damage', parts: POISON_DAMAGE, on: 'always' }],
      },
    ]);

    const [negateOnSaveTrigger] = listEffectListTriggers(
      createEffect({
        recurringDamage: {
          damageParts: POISON_DAMAGE,
          timing: 'endOfTurn',
          save: { ...CONSTITUTION_TRIGGER_SAVE, onSuccess: 'negate' },
        },
      }),
    );

    expect(negateOnSaveTrigger?.event).toBe('turnEnd');
    expect(negateOnSaveTrigger?.save).toEqual(CONSTITUTION_TRIGGER_SAVE);

    expect(negateOnSaveTrigger?.actions[0]).toEqual({
      type: 'damage',
      parts: POISON_DAMAGE,
      on: 'failed',
    });

    const [halfOnSaveTrigger] = listEffectListTriggers(
      createEffect({
        recurringDamage: {
          damageParts: POISON_DAMAGE,
          timing: 'endOfTurn',
          save: { ...CONSTITUTION_TRIGGER_SAVE, onSuccess: 'half' },
        },
      }),
    );

    expect(halfOnSaveTrigger?.actions[0]).toEqual({
      type: 'damage',
      parts: POISON_DAMAGE,
      on: 'always',
      halfOnSave: true,
    });
  });

  it('повторный спасбросок снимает эффект при успехе, снятие после атаки — по роли', () => {
    const effect = createEffect({
      recurringSave: {
        ability: 'wisdom',
        dc: TYPED_SAVE_DC,
        timing: 'endOfTurn',
      },
      consumeOn: 'attackOnCarrier',
    });

    expect(listEffectListTriggers(effect)).toEqual([
      {
        id: LEGACY_TRIGGER_IDS.recurringSave,
        event: 'turnEnd',
        save: { ability: 'wisdom', dc: TYPED_SAVE_DC },
        actions: [{ type: 'removeSelf', on: 'saved' }],
      },
      {
        id: LEGACY_TRIGGER_IDS.consumeOn,
        event: 'attackRoll',
        role: 'target',
        actions: [{ type: 'removeSelf', on: 'always' }],
      },
    ]);
  });

  it('разовое срабатывание: событие по доставке, гейты по исходу «при успехе»', () => {
    const successOutcomeGates = [
      {
        outcome: 'nothing',
        damageGate: 'failed',
        effectGate: 'failed',
        halfOnSave: undefined,
      },
      {
        outcome: 'halfDamage',
        damageGate: 'always',
        effectGate: 'failed',
        halfOnSave: true,
      },
      {
        outcome: 'halfDamageWithEffect',
        damageGate: 'always',
        effectGate: 'always',
        halfOnSave: true,
      },
      {
        outcome: 'effectWithoutDamage',
        damageGate: 'failed',
        effectGate: 'always',
        halfOnSave: undefined,
      },
      {
        outcome: 'onlyOnSuccess',
        damageGate: 'saved',
        effectGate: 'saved',
        halfOnSave: undefined,
      },
    ] as const;

    for (const {
      outcome,
      damageGate,
      effectGate,
      halfOnSave,
    } of successOutcomeGates) {
      const effect = writeEffectSuccessOutcome(
        createEffect({
          effectTarget: 'target',
          conditionKey: 'poisoned',
          applySave: { ...CONSTITUTION_TRIGGER_SAVE, onSuccess: 'negate' },
          damageParts: POISON_DAMAGE,
        }),
        outcome,
      );

      const [landing] = collectEffectTriggers(effect);

      expect(landing?.id, outcome).toBe(LEGACY_TRIGGER_IDS.landing);
      expect(landing?.event, outcome).toBe('applied');
      expect(landing?.save, outcome).toEqual(CONSTITUTION_TRIGGER_SAVE);

      expect(
        landing?.actions.map((action) => [
          action.type,
          action.on,
          action.type === 'damage' ? action.halfOnSave : undefined,
        ]),
        outcome,
      ).toEqual([
        ['damage', damageGate, halfOnSave],
        ['applySelf', effectGate, undefined],
      ]);
    }

    const [exitTrigger] = collectEffectTriggers(
      createEffect({ areaTrigger: 'exit', damageParts: POISON_DAMAGE }),
    );

    expect(exitTrigger?.event).toBe('exit');

    // У эффекта «на носителе» разового срабатывания нет
    expect(
      collectEffectTriggers(
        createEffect({
          applySave: { ...CONSTITUTION_TRIGGER_SAVE, onSuccess: 'negate' },
        }),
      ),
    ).toEqual([]);
  });

  it('явные срабатывания идут после старых полей', () => {
    const stench: EffectTrigger = {
      id: 'trigger_stench',
      event: 'turnStart',
      save: CONSTITUTION_TRIGGER_SAVE,
      actions: [{ type: 'applyCondition', conditionKey: 'poisoned' }],
    };

    const effect = createEffect({
      consumeOn: 'carrierAttack',
      triggers: [stench],
    });

    expect(listEffectListTriggers(effect).map((trigger) => trigger.id)).toEqual(
      [LEGACY_TRIGGER_IDS.consumeOn, 'trigger_stench'],
    );
  });

  it('гейт по умолчанию: при спасброске — провал, но «половина при успехе» бьёт всегда', () => {
    const withSave = { save: CONSTITUTION_TRIGGER_SAVE };

    expect(
      resolveTriggerActionGate(withSave, {
        type: 'damage',
        parts: POISON_DAMAGE,
      }),
    ).toBe('failed');

    expect(
      resolveTriggerActionGate({}, { type: 'damage', parts: POISON_DAMAGE }),
    ).toBe('always');

    expect(
      resolveTriggerActionGate(withSave, {
        type: 'damage',
        parts: POISON_DAMAGE,
        halfOnSave: true,
      }),
    ).toBe('always');

    expect(
      resolveTriggerActionGate(withSave, {
        type: 'damage',
        parts: POISON_DAMAGE,
        halfOnSave: true,
        on: 'saved',
      }),
    ).toBe('saved');
  });
});

describe('запись «сначала старые поля»', () => {
  it('круг чтение → запись не меняет эффект со всеми старыми полями', () => {
    const saves = [
      undefined,
      { ...CONSTITUTION_TRIGGER_SAVE, onSuccess: 'negate' },
      { ...CONSTITUTION_TRIGGER_SAVE, onSuccess: 'half' },
    ] as const;

    for (const save of saves) {
      for (const consumeOn of [
        undefined,
        'carrierAttack',
        'attackOnCarrier',
      ] as const) {
        for (const recurringSave of [
          undefined,
          { ability: 'wisdom', dc: APPLIER_SAVE_DC, timing: 'startOfTurn' },
        ] as const) {
          const effect = createEffect({
            recurringDamage: {
              damageParts: POISON_DAMAGE,
              timing: 'startOfTurn',
              ...(save ? { save } : {}),
            },
            ...(recurringSave ? { recurringSave } : {}),
            ...(consumeOn ? { consumeOn } : {}),
          });

          expect(
            serializeEffect(
              writeEffectTriggers(effect, listEffectListTriggers(effect)),
            ),
          ).toBe(serializeEffect(effect));
        }
      }
    }
  });

  it('невыразимое старым полем уходит в triggers: лимит, условие, ход источника, второй урон', () => {
    const damageTrigger: EffectTrigger = {
      id: LEGACY_TRIGGER_IDS.recurringDamage,
      event: 'turnStart',
      actions: [{ type: 'damage', parts: POISON_DAMAGE, on: 'always' }],
    };

    const effectWithExtraTriggers = writeEffectTriggers(createEffect(), [
      damageTrigger,
      { ...damageTrigger, id: 'second' },
      { ...damageTrigger, id: 'limited', limit: { max: 1, per: 'turn' } },
      { ...damageTrigger, id: 'source', turnOf: 'source' },
      {
        ...damageTrigger,
        id: 'conditional',
        condition: 'self.hp.value < self.hp.max',
      },
    ]);

    expect(effectWithExtraTriggers.recurringDamage).toEqual({
      damageParts: POISON_DAMAGE,
      timing: 'startOfTurn',
    });

    expect(
      effectWithExtraTriggers.triggers?.map((trigger) => trigger.id),
    ).toEqual(['second', 'limited', 'source', 'conditional']);
  });

  it('старые поля, которых нет в списке, снимаются; разовое срабатывание не трогается', () => {
    const effect = createEffect({
      effectTarget: 'target',
      applySave: { ...CONSTITUTION_TRIGGER_SAVE, onSuccess: 'negate' },
      recurringSave: { ability: 'wisdom', dc: SAVE_DC, timing: 'endOfTurn' },
      consumeOn: 'carrierAttack',
    });

    const effectWithoutConsumeOn = writeEffectTriggers(
      effect,
      collectEffectTriggers(effect).filter(
        (trigger) => trigger.id !== LEGACY_TRIGGER_IDS.consumeOn,
      ),
    );

    expect(effectWithoutConsumeOn.consumeOn).toBeUndefined();
    expect(effectWithoutConsumeOn.recurringSave).toEqual(effect.recurringSave);
    expect(effectWithoutConsumeOn.applySave).toEqual(effect.applySave);
    expect(effectWithoutConsumeOn.triggers).toBeUndefined();
  });

  it('невыразимая строка с id legacy.* получает новый id', () => {
    const effectWithLimitedSave = writeEffectTriggers(createEffect(), [
      {
        id: LEGACY_TRIGGER_IDS.recurringSave,
        event: 'turnEnd',
        save: CONSTITUTION_TRIGGER_SAVE,
        actions: [{ type: 'removeSelf', on: 'saved' }],
        limit: { max: 1, per: 'round' },
      },
    ]);

    const [limitedSaveTrigger] = effectWithLimitedSave.triggers ?? [];

    expect(effectWithLimitedSave.recurringSave).toBeUndefined();
    expect(effectWithLimitedSave.triggers).toHaveLength(1);

    expect(limitedSaveTrigger && isLegacyTrigger(limitedSaveTrigger)).toBe(
      false,
    );
  });
});

describe('фразы срабатываний', () => {
  it('новые срабатывания: момент, спасбросок, исходы, лимит, ход источника', () => {
    expect(
      describeEffectTrigger(
        {
          id: 'stench',
          event: 'turnStart',
          save: { ability: 'constitution', dc: SAVE_DC },
          actions: [
            {
              type: 'applyCondition',
              conditionKey: 'poisoned',
              duration: { type: 'rounds', value: 1 },
            },
          ],
          limit: { max: 1, per: 'turn' },
        },
        { formatDc },
      ),
    ).toBe(
      `в начале хода: спасбросок Телосложения, Сл ${SAVE_DC}; провал — «Отравленный» на 1 раунд; `
        + 'успех — ничего, не чаще одного раза за ход',
    );

    expect(
      describeEffectTrigger(
        {
          id: 'burn',
          event: 'turnEnd',
          turnOf: 'source',
          save: { ability: 'dexterity', dc: APPLIER_SAVE_DC },
          actions: [
            {
              type: 'damage',
              parts: [{ formula: '2d6', type: 'fire' }],
              on: 'always',
              halfOnSave: true,
            },
            { type: 'removeSelf', on: 'saved' },
          ],
          limit: { max: 3, per: 'longRest' },
        },
        { formatDc },
      ),
    ).toBe(
      'в конце хода источника: спасбросок Ловкости, Сл заклинателя; провал — 2d6 огненный; '
        + 'успех — половина урона, эффект снимается, не чаще 3 раз за долгий отдых',
    );
  });

  it('условие, Сл формулой и «хиты становятся»', () => {
    expect(
      describeEffectTrigger(
        {
          id: 'fortitude',
          event: 'hpZero',
          condition: 'damage.type !== "radiant" && damage.isCritical === false',
          save: { ability: 'constitution', dc: 5, dcFormula: '5 + @damage' },
          actions: [{ type: 'setHp', value: 1, on: 'saved' }],
        },
        { formatDc },
      ),
    ).toBe(
      'когда хиты падают до 0, если урон не излучением и не критическое попадание: '
        + 'спасбросок Телосложения, Сл = 5 + урон; провал — ничего; успех — хиты становятся 1',
    );
  });

  it('старые поля описываются прежними фразами сводки', () => {
    const effect = createEffect({
      conditionKey: 'poisoned',
      recurringDamage: {
        damageParts: POISON_DAMAGE,
        timing: 'startOfTurn',
        save: { ...CONSTITUTION_TRIGGER_SAVE, onSuccess: 'half' },
      },
      recurringSave: {
        ability: 'wisdom',
        dc: TYPED_SAVE_DC,
        timing: 'endOfTurn',
      },
      consumeOn: 'carrierAttack',
    });

    expect(
      listEffectListTriggers(effect).map((trigger) =>
        describeEffectTrigger(trigger, { formatDc }),
      ),
    ).toEqual([
      `каждый ход 2d6 ядом в начале хода (спасбросок Телосложения, Сл ${SAVE_DC}: успех — половина урона)`,
      `повторный спасбросок Мудрости Сл ${TYPED_SAVE_DC} в конце хода снимает эффект`,
      'снимается после своей атаки',
    ]);
  });
});
