import type { EffectFormContext } from '~active-effects/model';

import { describe, expect, it } from 'vitest';

import {
  APPLIER_SAVE_DC,
  DEFAULT_EFFECT_CHANGE_PRIORITY,
  FIXED_MIN_SAVE_DC,
  normalizeActiveEffects,
  normalizeLoadedActiveEffects,
} from '~active-effects/model';

import {
  AURA_RADIUS,
  createRawEffect,
  SAVE_DC,
  stripUndefinedKeys,
  TYPED_SAVE_DC,
} from './fixtures';

describe('терпимая загрузка эффектов', () => {
  it('эффект без id или с changes не той формы выпадает, соседний остаётся', () => {
    const loadedEffects = normalizeLoadedActiveEffects([
      createRawEffect({ id: undefined }),
      createRawEffect({ changes: 'мусор' }),
      createRawEffect({ id: 'effect_ok' }),
      'мусор',
    ]);

    expect(loadedEffects.map((effect) => effect.id)).toEqual(['effect_ok']);
  });

  it('плохая строка модификатора выпадает одна, остальные остаются', () => {
    const [effect] = normalizeLoadedActiveEffects([
      createRawEffect({
        changes: [
          {
            key: 'armorClass',
            mode: 'add',
            value: '1',
            priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
          },
          {
            key: 'armorClass',
            mode: 'teleport',
            value: '1',
            priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
          },
          { key: 'initiative', mode: 'add', value: '2', priority: '' },
        ],
      }),
    ]);

    expect(effect?.changes).toEqual([
      {
        key: 'armorClass',
        mode: 'add',
        value: '1',
        priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
      },
      {
        key: 'initiative',
        mode: 'add',
        value: '2',
        priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
      },
    ]);
  });

  it('незнакомый флаг остаётся: словарь сайта отстаёт от системы', () => {
    const [effect] = normalizeLoadedActiveEffects([
      createRawEffect({
        flags: [
          'attack.advantage',
          'healing.blocked',
          'homebrew.flag',
          '',
          '   ',
          42,
          null,
        ],
      }),
    ]);

    expect(effect?.flags).toEqual([
      'attack.advantage',
      'healing.blocked',
      'homebrew.flag',
    ]);
  });

  it('незнакомые значения перечислений обнуляют поле, а не эффект', () => {
    const [effect] = normalizeLoadedActiveEffects([
      createRawEffect({
        areaTrigger: 'onMoonrise',
        effectTarget: 'everywhere',
        consumeOn: 'sometimes',
        duration: { type: 'turn', turnAnchor: 'moon' },
      }),
    ]);

    expect(effect).toBeDefined();
    expect(effect?.areaTrigger).toBeUndefined();
    expect(effect?.effectTarget).toBeUndefined();
    expect(effect?.consumeOn).toBeUndefined();
    expect(effect?.duration.type).toBe('turn');
    expect(effect?.duration.turnAnchor).toBeUndefined();
  });

  it('доставка «зоной», спасбросок урона каждый ход и степень истощения переживают загрузку', () => {
    const [effect] = normalizeLoadedActiveEffects([
      createRawEffect({
        effectTarget: 'zone',
        conditionKey: 'exhaustion',
        exhaustionLevel: 2,
        recurringDamage: {
          damageParts: [{ formula: '2d10@dmg.radiant' }],
          timing: 'endOfTurn',
          save: {
            ability: 'constitution',
            dc: APPLIER_SAVE_DC,
            onSuccess: 'half',
          },
        },
      }),
    ]);

    expect(effect?.effectTarget).toBe('zone');
    expect(effect?.exhaustionLevel).toBe(2);

    expect(effect?.recurringDamage?.save).toEqual({
      ability: 'constitution',
      dc: APPLIER_SAVE_DC,
      onSuccess: 'half',
    });
  });

  it('срабатывание с незнакомым действием выпадает, соседнее и зарезервированное остаются', () => {
    const [effect] = normalizeLoadedActiveEffects([
      createRawEffect({
        triggers: [
          { id: 'ok', event: 'turnEnd', actions: [{ type: 'removeSelf' }] },
          {
            id: 'future',
            event: 'onMoonrise',
            actions: [{ type: 'removeSelf' }],
          },
          {
            id: 'bad-action',
            event: 'turnEnd',
            actions: [{ type: 'teleport' }],
          },
          {
            id: 'bad-tag',
            event: 'turnEnd',
            actions: [{ type: 'applyTag', tag: 'a b' }],
          },
          { id: 'no-actions', event: 'turnEnd', actions: [] },
          { event: 'turnEnd', actions: [{ type: 'removeSelf' }] },
          { id: 'rest', event: 'rest', actions: [{ type: 'removeSelf' }] },
          'мусор',
        ],
      }),
    ]);

    expect(effect?.triggers?.map((trigger) => trigger.id)).toEqual([
      'ok',
      'rest',
    ]);
  });

  it('негодные необязательные поля срабатывания обнуляют поле, числа строкой — числами', () => {
    const [effect] = normalizeLoadedActiveEffects([
      createRawEffect({
        triggers: [
          {
            id: 'form',
            event: 'turnStart',
            turnOf: 'someone',
            condition: '',
            save: {
              ability: 'wisdom',
              dc: String(TYPED_SAVE_DC),
              dcFormula: 5,
            },
            limit: { max: 0, per: 'turn' },
            actions: [
              { type: 'damage', parts: [{ formula: '1d6' }], on: 'sometimes' },
            ],
          },
        ],
      }),
    ]);

    const [trigger] = effect?.triggers ?? [];

    expect(trigger?.turnOf).toBeUndefined();
    expect(trigger?.condition).toBeUndefined();
    expect(trigger?.save).toEqual({ ability: 'wisdom', dc: TYPED_SAVE_DC });
    expect(trigger?.limit).toBeUndefined();
    expect(trigger?.actions[0]?.on).toBeUndefined();
  });

  it('эффект без срабатываний разбирается как раньше — поле не появляется', () => {
    const [effect] = normalizeLoadedActiveEffects([createRawEffect()]);

    expect(stripUndefinedKeys(effect)).not.toHaveProperty('triggers');
  });

  it('части урона срабатывания с легаси-типом переносят его в формулу', () => {
    const [effect] = normalizeLoadedActiveEffects([
      createRawEffect({
        triggers: [
          {
            id: 'burn',
            event: 'turnStart',
            actions: [
              { type: 'damage', parts: [{ formula: '2d6', type: 'fire' }] },
            ],
          },
        ],
      }),
    ]);

    const [action] = effect?.triggers?.[0]?.actions ?? [];

    expect(action?.type === 'damage' ? action.parts : []).toEqual([
      { formula: '2d6@dmg.fire' },
    ]);
  });
});

describe('сохранение эффектов', () => {
  it('старый эффект без новых полей после «открыл и сохранил» тот же', () => {
    const legacyStoredEffect = createRawEffect({
      icon: 'tabler:flame',
      effectTarget: 'target',
      conditionKey: 'restrained',
      applySave: {
        ability: 'strength',
        dc: APPLIER_SAVE_DC,
        onSuccess: 'negate',
      },
      recurringSave: {
        ability: 'strength',
        dc: APPLIER_SAVE_DC,
        timing: 'endOfTurn',
      },
      recurringDamage: {
        damageParts: [{ formula: '2d6@dmg.fire', target: 'selected' }],
        timing: 'startOfTurn',
      },
      consumeOn: 'carrierAttack',
      duration: { type: 'rounds', value: 10 },
      changes: [
        {
          key: 'armorClass',
          mode: 'add',
          value: '1',
          priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
        },
      ],
      flags: ['attack.disadvantage'],
    });

    const savedEffects = normalizeActiveEffects(
      normalizeLoadedActiveEffects([legacyStoredEffect]),
      'spell',
    );

    expect(stripUndefinedKeys(savedEffects)).toEqual([legacyStoredEffect]);
  });

  it('поля применения, варианта и новых срабатываний переживают «открыл и сохранил»', () => {
    const storedEffect = createRawEffect({
      activation: { mode: 'toggle', counter: 'rage' },
      variant: { group: 'вариант', label: 'Оглушение', pick: 'random' },
      landingCondition: 'source.weaponMastery === true',
      rollCondition: 'incoming.attackType === "melee"',
      aura: {
        radius: AURA_RADIUS,
        target: 'allies',
        applyToSelf: true,
        visible: true,
        radiusFormula: '10 + 20 * floor(@classLevel / 18)',
        whileCapable: true,
      },
      triggers: [
        {
          id: 'rest',
          event: 'rest',
          restType: 'short',
          actions: [
            { type: 'reduceMaxHp', amount: '@damage', endsOnRest: 'never' },
          ],
        },
        {
          id: 'burst',
          event: 'hpZero',
          recipient: 'area',
          area: { radius: AURA_RADIUS, target: 'enemies' },
          save: { ability: 'dexterity', dc: SAVE_DC, mode: 'advantage' },
          actions: [
            { type: 'applyTag', tag: 'burst', stack: true },
            {
              type: 'applyCondition',
              conditionKey: 'prone',
              recurringSave: {
                ability: 'strength',
                dc: SAVE_DC,
                timing: 'endOfTurn',
              },
            },
          ],
        },
      ],
    });

    const savedEffects = normalizeActiveEffects(
      normalizeLoadedActiveEffects([storedEffect]),
      'ownEffects',
    );

    expect(stripUndefinedKeys(savedEffects)).toEqual([storedEffect]);
  });

  it('эффекты сценариев системы переживают круг «открыл и сохранил»', () => {
    // Данные — из tests/scenarios системы: зелье (I16), «Тактика стаи»,
    // «Опрокидывание» (W08) и взрыв спор на нуле хитов
    const scenarios: Array<{
      context: EffectFormContext;
      name: string;
      storedEffect: Record<string, unknown>;
    }> = [
      {
        context: 'item',
        name: 'Зелье лечения',
        storedEffect: createRawEffect({
          name: 'Зелье лечения',
          activation: { mode: 'use' },
          triggers: [
            {
              id: 'trigger_heal',
              event: 'applied',
              actions: [
                {
                  type: 'damage',
                  // Цель части урона сайт пишет явно — у системы это умолчание
                  parts: [{ formula: '2d4@heal+2', target: 'selected' }],
                },
                { type: 'removeSelf' },
              ],
            },
          ],
        }),
      },
      {
        context: 'creatureTrait',
        name: 'Тактика стаи',
        storedEffect: createRawEffect({
          name: 'Тактика стаи',
          flags: ['attack.advantage'],
          rollCondition: 'target.allyAdjacent',
        }),
      },
      {
        context: 'weapon',
        name: 'Опрокидывание',
        storedEffect: createRawEffect({
          name: 'Опрокидывание',
          effectTarget: 'target',
          landingCondition: 'source.weaponMastery === true',
          applySave: {
            ability: 'constitution',
            dc: APPLIER_SAVE_DC,
            onSuccess: 'negate',
          },
          conditionKey: 'prone',
        }),
      },
      {
        context: 'creatureTrait',
        name: 'Газовые споры',
        storedEffect: createRawEffect({
          name: 'Газовые споры',
          triggers: [
            {
              id: 'trigger_spores',
              event: 'hpZero',
              recipient: 'area',
              area: { radius: 10, target: 'all' },
              save: { ability: 'constitution', dc: SAVE_DC },
              actions: [
                {
                  type: 'applyCondition',
                  conditionKey: 'poisoned',
                  recurringSave: {
                    ability: 'constitution',
                    dc: SAVE_DC,
                    timing: 'endOfTurn',
                  },
                },
              ],
            },
          ],
        }),
      },
    ];

    for (const { context, name, storedEffect } of scenarios) {
      const savedEffects = normalizeActiveEffects(
        normalizeLoadedActiveEffects([storedEffect]),
        context,
      );

      expect(stripUndefinedKeys(savedEffects), name).toEqual([storedEffect]);
    }
  });

  it('урон каждый ход без частей не пишется, «при успехе» — ровно один исход', () => {
    const [effect] = normalizeActiveEffects(
      normalizeLoadedActiveEffects([
        createRawEffect({
          effectTarget: 'target',
          applySave: { ability: 'strength', dc: SAVE_DC, onSuccess: 'half' },
          applyOnSuccess: true,
          applyOnSuccessOnly: true,
          recurringDamage: { damageParts: [], timing: 'startOfTurn' },
        }),
      ]),
      'weapon',
    );

    expect(effect?.recurringDamage).toBeUndefined();
    expect(effect?.applyOnSuccess).toBeUndefined();
    expect(effect?.applyOnSuccessOnly).toBe(true);
  });

  it('вложенное срабатывание состояния и блок «по выбору» переживают круг', () => {
    const storedEffect = createRawEffect({
      triggers: [
        {
          id: 'trigger_sleep',
          event: 'applied',
          actions: [
            {
              type: 'applyCondition',
              conditionKey: 'unconscious',
              triggers: [
                {
                  id: 'trigger_wake',
                  event: 'damageTaken',
                  actions: [{ type: 'removeSelf' }],
                },
              ],
            },
          ],
        },
        {
          id: 'trigger_heal',
          event: 'turnStart',
          recipient: 'choice',
          choice: {
            radius: AURA_RADIUS,
            target: 'allies',
            count: 2,
            condition: 'self.creatureType === "undead"',
            optional: true,
            chooser: 'source',
          },
          actions: [{ type: 'damage', parts: [{ formula: '5@heal' }] }],
        },
      ],
    });

    const [effect] = normalizeActiveEffects(
      normalizeLoadedActiveEffects([storedEffect]),
      'spell',
    );

    const [sleepTrigger, healTrigger] = effect?.triggers ?? [];
    const [applyCondition] = sleepTrigger?.actions ?? [];

    expect(
      applyCondition?.type === 'applyCondition'
        ? applyCondition.triggers
        : undefined,
    ).toEqual([
      {
        id: 'trigger_wake',
        event: 'damageTaken',
        actions: [{ type: 'removeSelf' }],
      },
    ]);

    expect(healTrigger?.recipient).toBe('choice');

    expect(stripUndefinedKeys(healTrigger?.choice ?? {})).toEqual({
      radius: AURA_RADIUS,
      target: 'allies',
      count: 2,
      condition: 'self.creatureType === "undead"',
      optional: true,
      chooser: 'source',
    });
  });

  it('сл 0 у предмета поднимается до 1, у заклинания остаётся «Авто»', () => {
    const auraSaveEffect = createRawEffect({
      aura: { radius: AURA_RADIUS, target: 'all', applyToSelf: false },
      areaTrigger: 'enter',
      applySave: {
        ability: 'wisdom',
        dc: APPLIER_SAVE_DC,
        onSuccess: 'negate',
      },
    });

    const loadedEffects = normalizeLoadedActiveEffects([auraSaveEffect]);

    expect(
      normalizeActiveEffects(loadedEffects, 'item')[0]?.applySave?.dc,
    ).toBe(FIXED_MIN_SAVE_DC);

    expect(
      normalizeActiveEffects(loadedEffects, 'spell')[0]?.applySave?.dc,
    ).toBe(APPLIER_SAVE_DC);
  });
});
