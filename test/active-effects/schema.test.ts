import { describe, expect, it } from 'vitest';

import {
  normalizeActiveEffects,
  normalizeLoadedActiveEffects,
} from '~active-effects/model';

/** Сл, пришедшая из поля формы строкой. */
const TYPED_DC = 14;

/**
 * Сырой эффект, как его отдаёт сервер.
 *
 * @param overrides поля, отличные от умолчания.
 * @returns объект эффекта.
 */
function createRawEffect(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: 'effect_raw',
    name: 'Эффект',
    description: '',
    disabled: false,
    origin: 'spell',
    transfer: false,
    duration: { type: 'permanent' },
    changes: [],
    flags: [],
    ...overrides,
  };
}

describe('терпимая загрузка эффектов', () => {
  it('эффект без id или с changes не той формы выпадает, соседний остаётся', () => {
    const loaded = normalizeLoadedActiveEffects([
      createRawEffect({ id: undefined }),
      createRawEffect({ changes: 'мусор' }),
      createRawEffect({ id: 'effect_ok' }),
      'мусор',
    ]);

    expect(loaded.map((effect) => effect.id)).toEqual(['effect_ok']);
  });

  it('плохая строка модификатора выпадает одна, остальные остаются', () => {
    const [effect] = normalizeLoadedActiveEffects([
      createRawEffect({
        changes: [
          { key: 'armorClass', mode: 'add', value: '1', priority: 20 },
          { key: 'armorClass', mode: 'teleport', value: '1', priority: 20 },
          { key: 'initiative', mode: 'add', value: '2', priority: '' },
        ],
      }),
    ]);

    expect(effect?.changes).toEqual([
      { key: 'armorClass', mode: 'add', value: '1', priority: 20 },
      { key: 'initiative', mode: 'add', value: '2', priority: 20 },
    ]);
  });

  it('незнакомый флаг выпадает, эффект остаётся', () => {
    const [effect] = normalizeLoadedActiveEffects([
      createRawEffect({ flags: ['attack.advantage', 'homebrew.flag'] }),
    ]);

    expect(effect?.flags).toEqual(['attack.advantage']);
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
          save: { ability: 'constitution', dc: 0, onSuccess: 'half' },
        },
      }),
    ]);

    expect(effect?.effectTarget).toBe('zone');
    expect(effect?.exhaustionLevel).toBe(2);

    expect(effect?.recurringDamage?.save).toEqual({
      ability: 'constitution',
      dc: 0,
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
            save: { ability: 'wisdom', dc: String(TYPED_DC), dcFormula: 5 },
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
    expect(trigger?.save).toEqual({ ability: 'wisdom', dc: TYPED_DC });
    expect(trigger?.limit).toBeUndefined();
    expect(trigger?.actions[0]?.on).toBeUndefined();
  });

  it('эффект без срабатываний разбирается как раньше — поле не появляется', () => {
    const [effect] = normalizeLoadedActiveEffects([createRawEffect()]);

    expect(JSON.parse(JSON.stringify(effect))).not.toHaveProperty('triggers');
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
    const rawEffect = createRawEffect({
      icon: 'tabler:flame',
      effectTarget: 'target',
      conditionKey: 'restrained',
      applySave: { ability: 'strength', dc: 0, onSuccess: 'negate' },
      recurringSave: { ability: 'strength', dc: 0, timing: 'endOfTurn' },
      recurringDamage: {
        damageParts: [{ formula: '2d6@dmg.fire', target: 'selected' }],
        timing: 'startOfTurn',
      },
      consumeOn: 'carrierAttack',
      duration: { type: 'rounds', value: 10 },
      changes: [{ key: 'armorClass', mode: 'add', value: '1', priority: 20 }],
      flags: ['attack.disadvantage'],
    });

    const saved = normalizeActiveEffects(
      normalizeLoadedActiveEffects([rawEffect]),
      'spell',
    );

    expect(JSON.parse(JSON.stringify(saved))).toEqual([rawEffect]);
  });

  it('урон каждый ход без частей не пишется, «при успехе» — ровно один исход', () => {
    const [effect] = normalizeActiveEffects(
      normalizeLoadedActiveEffects([
        createRawEffect({
          effectTarget: 'target',
          applySave: { ability: 'strength', dc: 13, onSuccess: 'half' },
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

  it('сл 0 у предмета поднимается до 1, у заклинания остаётся «Авто»', () => {
    const rawEffect = createRawEffect({
      aura: { radius: 10, target: 'all', applyToSelf: false },
      areaTrigger: 'enter',
      applySave: { ability: 'wisdom', dc: 0, onSuccess: 'negate' },
    });

    const loaded = normalizeLoadedActiveEffects([rawEffect]);

    expect(normalizeActiveEffects(loaded, 'item')[0]?.applySave?.dc).toBe(1);
    expect(normalizeActiveEffects(loaded, 'spell')[0]?.applySave?.dc).toBe(0);
  });
});
