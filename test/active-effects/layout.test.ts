import { describe, expect, it } from 'vitest';

import {
  applyConditionPresetToEffect,
  buildConditionActiveEffect,
  clearInertEffectFields,
  createEffectForContext,
  createEffectTriggerPreset,
  DEFAULT_EFFECT_SAVE_DC,
  describeEffectFlag,
  describeEffectScenario,
  EFFECT_FORM_STEPS,
  EFFECT_SUCCESS_OUTCOMES,
  listEffectFormSteps,
  listEffectListTriggers,
  listEffectTriggerPresets,
  listInertEffectFields,
  listTriggerActionTypes,
  listTriggerTags,
  normalizeEffectDraft,
  readEffectDelivery,
  readEffectSuccessOutcome,
  readEffectTrigger,
  resolveEffectFormLayout,
  triggerEventAcceptsDcFormula,
  triggerEventHasOtherParty,
  writeEffectDelivery,
  writeEffectSaveEnabled,
  writeEffectSuccessOutcome,
  writeEffectTrigger,
  writeEffectTriggerRow,
} from '~active-effects/model';

import {
  ALL_CREATURES_AURA,
  ALLIES_AURA,
  CONSTITUTION_SAVE,
  createEffect,
  POISON_DAMAGE,
  resolveLayoutFor,
  SAVE_DC,
  WALK_SPEED_CHANGE,
} from './fixtures';

/** Радиус ауры, настроенный автором. */
const CUSTOM_AURA_RADIUS = 30;

/** Сл, набранная автором вручную. */
const TYPED_SAVE_DC = 15;

describe('новый эффект по месту формы', () => {
  it('у действия существа и заклинания эффект сразу на цели', () => {
    for (const context of ['creatureAction', 'spell'] as const) {
      const effect = createEffectForContext(context, 'effect_new', 'Новый');

      expect(effect.effectTarget, context).toBe('target');
      expect(readEffectDelivery(effect, context)).toBe('target');
    }
  });

  it('у черты существа, оружия, предмета и умения эффект на носителе', () => {
    for (const context of [
      'creatureTrait',
      'weapon',
      'item',
      'feature',
    ] as const) {
      const effect = createEffectForContext(context, 'effect_new', 'Новый');

      expect(effect.effectTarget, context).toBe('self');
      expect(readEffectDelivery(effect, context)).toBe('carrier');
    }
  });
});

describe('раскладка формы эффекта', () => {
  it('черта персонажа на носителе — пассив: только то, что меняет', () => {
    const layout = resolveLayoutFor('feature');

    expect(layout.deliveryOptions).toEqual(['carrier', 'aura']);
    expect(layout.showTrigger).toBe(false);
    expect(layout.showSave).toBe(false);
    expect(layout.saveUnavailableReason).toBeNull();
    expect(layout.showRecurringDamage).toBe(false);
    expect(layout.showDuration).toBe(false);
    expect(layout.showRecurringSave).toBe(false);
    expect(layout.showConditionImmunities).toBe(true);
  });

  it('черта существа на носителе: урон и лечение каждый ход, без повторного спасброска', () => {
    const layout = resolveLayoutFor('creatureTrait');

    expect(layout.showRecurringDamage).toBe(true);
    expect(layout.showRecurringSave).toBe(false);
    expect(layout.showDuration).toBe(false);
    expect(layout.showConsumeOn).toBe(false);
    expect(resolveLayoutFor('item').showRecurringDamage).toBe(false);
  });

  it('аура умения («Аура защиты»): «пока внутри» без сроков, вход — со спасброском', () => {
    const stay = resolveLayoutFor('feature', { aura: ALLIES_AURA });

    expect(stay.delivery).toBe('aura');
    expect(stay.showAuraSettings).toBe(true);
    expect(stay.showSave).toBe(false);
    expect(stay.saveUnavailableReason).toBe('stayTrigger');
    expect(stay.showDuration).toBe(false);
    expect(stay.showRecurringSave).toBe(false);

    const enter = resolveLayoutFor('feature', {
      aura: ALLIES_AURA,
      areaTrigger: 'enter',
    });

    expect(enter.showSave).toBe(true);
    expect(enter.showTriggerDamage).toBe(true);
    expect(enter.showDuration).toBe(true);
    expect(enter.minSaveDc).toBe(1);
  });

  it('оружие на владельце подсказывает, где спасбросок', () => {
    const layout = resolveLayoutFor('weapon');

    expect(layout.deliveryOptions).toEqual(['carrier', 'target', 'aura']);
    expect(layout.showSave).toBe(false);
    expect(layout.saveUnavailableReason).toBe('onCarrier');
  });

  it('оружие «на цели при попадании»: спасбросок, Сл 0 — Сл оружия', () => {
    const effect = writeEffectDelivery(createEffect(), 'target');
    const layout = resolveEffectFormLayout('weapon', effect);

    expect(layout.delivery).toBe('target');
    expect(layout.showSave).toBe(true);
    expect(layout.showDuration).toBe(true);
    expect(layout.successOutcomeForActionSave).toBe(false);
    expect(layout.minSaveDc).toBe(0);
  });

  it('аура предмета «пока внутри»: без длительности, иммунитеты достаются накрытым', () => {
    const layout = resolveLayoutFor('item', { aura: ALLIES_AURA });

    expect(layout.delivery).toBe('aura');
    expect(layout.showAuraSettings).toBe(true);
    expect(layout.showSave).toBe(false);
    expect(layout.saveUnavailableReason).toBe('stayTrigger');
    expect(layout.showDuration).toBe(false);
    expect(layout.showConditionImmunities).toBe(true);
    expect(layout.showRecurringDamage).toBe(true);
    expect(layout.minSaveDc).toBe(1);
  });

  it('аура своих эффектов «пока внутри» тикает длительностью носителя', () => {
    const layout = resolveLayoutFor('ownEffects', { aura: ALLIES_AURA });

    expect(layout.showDuration).toBe(true);
    expect(layout.showRecurringSave).toBe(false);
  });

  it('свой эффект на носителе проживает свою жизнь', () => {
    const layout = resolveLayoutFor('ownEffects');

    expect(layout.showSave).toBe(false);
    expect(layout.showRecurringDamage).toBe(true);
    expect(layout.showDuration).toBe(true);
    expect(layout.showRecurringSave).toBe(true);
    expect(layout.showConsumeOn).toBe(true);
  });

  it('действие существа: Сл 0 — Сл действия, «при успехе» — к спасброску действия', () => {
    const layout = resolveLayoutFor('creatureAction', {
      effectTarget: 'target',
      conditionKey: 'prone',
    });

    expect(layout.deliveryOptions).toEqual(['target']);
    expect(layout.minSaveDc).toBe(0);
    expect(layout.successOutcomeForActionSave).toBe(true);

    expect(layout.successOutcomes).toEqual([
      'nothing',
      'effectWithoutDamage',
      'onlyOnSuccess',
    ]);
  });

  it('свой спасбросок эффекта снимает привязку «при успехе» к действию', () => {
    const layout = resolveLayoutFor('spell', {
      effectTarget: 'target',
      applySave: CONSTITUTION_SAVE,
    });

    expect(layout.successOutcomeForActionSave).toBe(false);
    expect(layout.minSaveDc).toBe(0);
  });

  it('заклинание на заклинателе: Сл 0 — Сл заклинателя при любой доставке', () => {
    expect(resolveLayoutFor('spell').minSaveDc).toBe(0);
    expect(resolveLayoutFor('spell', { aura: ALLIES_AURA }).minSaveDc).toBe(0);
  });
});

describe('доставка эффекта', () => {
  it('«на цели» снимает ауру и момент срабатывания', () => {
    const effect = writeEffectDelivery(
      createEffect({ aura: ALLIES_AURA, areaTrigger: 'enter' }),
      'target',
    );

    expect(effect.effectTarget).toBe('target');
    expect(effect.aura).toBeUndefined();
    expect(effect.areaTrigger).toBeUndefined();
  });

  it('аура сохраняет уже настроенный радиус', () => {
    const effect = writeEffectDelivery(
      createEffect({ aura: { ...ALLIES_AURA, radius: CUSTOM_AURA_RADIUS } }),
      'aura',
    );

    expect(effect.effectTarget).toBe('self');
    expect(effect.aura?.radius).toBe(CUSTOM_AURA_RADIUS);
  });

  it('«пока внутри» не хранится полем', () => {
    const effect = writeEffectTrigger(
      createEffect({ areaTrigger: 'enter' }),
      'stay',
    );

    expect(effect.areaTrigger).toBeUndefined();
    expect(readEffectTrigger(effect)).toBe('stay');
  });
});

describe('исход успешного спасброска', () => {
  /** Ожидаемые поля по исходу. */
  const OUTCOME_FIELDS = {
    nothing: ['negate', undefined, undefined],
    halfDamage: ['half', undefined, undefined],
    halfDamageWithEffect: ['half', true, undefined],
    effectWithoutDamage: ['negate', true, undefined],
    onlyOnSuccess: ['negate', undefined, true],
  } as const;

  it('запись и чтение сходятся для каждого исхода, обоих флагов сразу не бывает', () => {
    for (const outcome of EFFECT_SUCCESS_OUTCOMES) {
      const effect = writeEffectSuccessOutcome(
        createEffect({
          applySave: CONSTITUTION_SAVE,
          applyOnSuccess: true,
          applyOnSuccessOnly: true,
        }),
        outcome,
      );

      const [onSuccess, applyOnSuccess, applyOnSuccessOnly] =
        OUTCOME_FIELDS[outcome];

      expect(readEffectSuccessOutcome(effect)).toBe(outcome);
      expect(effect.applySave?.onSuccess, outcome).toBe(onSuccess);
      expect(effect.applyOnSuccess, outcome).toBe(applyOnSuccess);
      expect(effect.applyOnSuccessOnly, outcome).toBe(applyOnSuccessOnly);
    }
  });

  it('варианты — только осмысленные для настройки', () => {
    const listOutcomes = (overrides: Parameters<typeof createEffect>[0]) =>
      resolveLayoutFor('weapon', {
        effectTarget: 'target',
        applySave: CONSTITUTION_SAVE,
        ...overrides,
      }).successOutcomes;

    expect(
      listOutcomes({
        applySave: { ...CONSTITUTION_SAVE, onSuccess: 'negate' },
      }),
    ).toEqual(['nothing']);

    expect(listOutcomes({ damageParts: POISON_DAMAGE })).toEqual([
      'nothing',
      'halfDamage',
    ]);

    expect(
      listOutcomes({ damageParts: POISON_DAMAGE, conditionKey: 'poisoned' }),
    ).toEqual([...EFFECT_SUCCESS_OUTCOMES]);

    expect(listOutcomes({ conditionKey: 'poisoned' })).toEqual([
      'nothing',
      'halfDamage',
      'effectWithoutDamage',
      'onlyOnSuccess',
    ]);
  });

  it('без спасброска у оружия выбора нет', () => {
    expect(
      resolveLayoutFor('weapon', {
        effectTarget: 'target',
        conditionKey: 'poisoned',
      }).successOutcomes,
    ).toEqual([]);
  });
});

describe('неработающие поля', () => {
  it('на черте персонажа находятся и убираются', () => {
    const effect = createEffect({
      aura: ALLIES_AURA,
      applySave: CONSTITUTION_SAVE,
      recurringSave: { ability: 'wisdom', dc: SAVE_DC, timing: 'endOfTurn' },
      duration: { type: 'rounds', value: 3 },
      changes: [WALK_SPEED_CHANGE],
    });

    const layout = resolveEffectFormLayout('feature', effect);
    const inert = listInertEffectFields(effect, layout);

    // Аура умения работает: персонаж излучает её сам
    expect(inert).toEqual(['applySave', 'recurringSave', 'duration']);

    const cleared = clearInertEffectFields(effect, inert, 'feature');

    expect(cleared.aura).toEqual(ALLIES_AURA);
    expect(cleared.applySave).toBeUndefined();
    expect(cleared.recurringSave).toBeUndefined();
    expect(cleared.duration).toEqual({ type: 'permanent' });
    expect(cleared.changes).toEqual([WALK_SPEED_CHANGE]);

    expect(
      listInertEffectFields(
        cleared,
        resolveEffectFormLayout('feature', cleared),
      ),
    ).toEqual([]);
  });

  it('эффект черты существа, умения и предмета «на цели» возвращается на носителя', () => {
    const effect = createEffect({ effectTarget: 'target' });

    for (const context of ['creatureTrait', 'feature', 'item'] as const) {
      const layout = resolveEffectFormLayout(context, effect);

      expect(listInertEffectFields(effect, layout), context).toEqual([
        'effectTarget',
      ]);

      expect(
        clearInertEffectFields(effect, ['effectTarget'], context).effectTarget,
        context,
      ).toBe('self');
    }
  });

  it('эффект действия существа «на носителе» уходит на цель', () => {
    const effect = createEffect({ effectTarget: 'self' });
    const layout = resolveEffectFormLayout('creatureAction', effect);

    expect(layout.delivery).toBe('target');
    expect(listInertEffectFields(effect, layout)).toEqual(['effectTarget']);

    expect(
      clearInertEffectFields(effect, ['effectTarget'], 'creatureAction')
        .effectTarget,
    ).toBe('target');
  });

  it('спасбросок, «при успехе» и урон у ауры «пока внутри»', () => {
    const effect = createEffect({
      aura: ALLIES_AURA,
      applySave: CONSTITUTION_SAVE,
      applyOnSuccess: true,
      damageParts: POISON_DAMAGE,
    });

    const layout = resolveEffectFormLayout('item', effect);
    const inert = listInertEffectFields(effect, layout);

    expect(inert).toEqual(['applySave', 'successOutcome', 'damageParts']);

    const cleared = clearInertEffectFields(effect, inert, 'item');

    expect(cleared.applySave).toBeUndefined();
    expect(cleared.applyOnSuccess).toBeUndefined();
    expect(cleared.applyOnSuccessOnly).toBeUndefined();
    expect(cleared.damageParts).toBeUndefined();
  });
});

describe('шаги формы', () => {
  it('черта — выбор «на персонаже / аурой», «что меняет» и срабатывания урона', () => {
    expect(listEffectFormSteps(resolveLayoutFor('feature'))).toEqual([
      'trigger',
      'modifiers',
      'triggers',
    ]);
  });

  it('аура «пока внутри» объясняет, почему нет спасброска', () => {
    expect(
      listEffectFormSteps(resolveLayoutFor('item', { aura: ALLIES_AURA })),
    ).toEqual(['trigger', 'save', 'modifiers', 'triggers']);
  });

  it('аура заклинания «при входе» — все шаги', () => {
    expect(
      listEffectFormSteps(
        resolveLayoutFor('spell', { aura: ALLIES_AURA, areaTrigger: 'enter' }),
      ),
    ).toEqual([...EFFECT_FORM_STEPS]);
  });

  it('действие существа: выбирать доставку не из чего', () => {
    expect(
      listEffectFormSteps(
        resolveLayoutFor('creatureAction', { effectTarget: 'target' }),
      ),
    ).toEqual(['save', 'damage', 'modifiers', 'duration', 'triggers']);
  });
});

describe('переключатели спасбросков', () => {
  it('новый спасбросок: Сл по умолчанию у ауры предмета, Сл источника у заклинания', () => {
    const auraEffect = createEffect({
      aura: ALLIES_AURA,
      areaTrigger: 'enter',
    });

    expect(
      writeEffectSaveEnabled(
        auraEffect,
        true,
        resolveEffectFormLayout('item', auraEffect),
      ).applySave,
    ).toEqual({
      ability: 'wisdom',
      dc: DEFAULT_EFFECT_SAVE_DC,
      onSuccess: 'negate',
    });

    const spellEffect = createEffect({ effectTarget: 'target' });

    expect(
      writeEffectSaveEnabled(
        spellEffect,
        true,
        resolveEffectFormLayout('spell', spellEffect),
      ).applySave?.dc,
    ).toBe(0);
  });

  it('включение не сбрасывает уже настроенный спасбросок', () => {
    const effect = createEffect({
      effectTarget: 'target',
      applySave: CONSTITUTION_SAVE,
    });

    expect(
      writeEffectSaveEnabled(
        effect,
        true,
        resolveEffectFormLayout('weapon', effect),
      ).applySave,
    ).toEqual(CONSTITUTION_SAVE);
  });

  it('без спасброска у оружия уходит и «при успехе»', () => {
    const effect = createEffect({
      effectTarget: 'target',
      applySave: CONSTITUTION_SAVE,
      applyOnSuccessOnly: true,
    });

    const cleared = writeEffectSaveEnabled(
      effect,
      false,
      resolveEffectFormLayout('weapon', effect),
    );

    expect(cleared.applySave).toBeUndefined();
    expect(cleared.applyOnSuccessOnly).toBeUndefined();
  });

  it('у действия существа «при успехе» остаётся за спасброском действия', () => {
    const effect = createEffect({
      effectTarget: 'target',
      applySave: CONSTITUTION_SAVE,
      applyOnSuccessOnly: true,
    });

    const cleared = writeEffectSaveEnabled(
      effect,
      false,
      resolveEffectFormLayout('creatureAction', effect),
    );

    expect(cleared.applySave).toBeUndefined();
    expect(cleared.applyOnSuccessOnly).toBe(true);
  });
});

describe('список «Срабатывания»', () => {
  it('события и действия по месту', () => {
    const own = resolveLayoutFor('ownEffects');

    expect(own.triggerEvents).toEqual([
      'turnStart',
      'turnEnd',
      'attackRoll',
      'damageTaken',
      'hpZero',
    ]);

    expect(own.triggerActions).toEqual([
      'damage',
      'applyCondition',
      'applyTag',
      'setHp',
      'endCast',
      'removeSelf',
    ]);

    expect(listTriggerActionTypes(own, 'attackRoll')).toEqual([
      'damage',
      'applyCondition',
      'applyTag',
      'endCast',
      'removeSelf',
    ]);

    expect(listTriggerActionTypes(own, 'hpZero')).toEqual([
      'damage',
      'applyCondition',
      'applyTag',
      'setHp',
      'endCast',
      'removeSelf',
    ]);

    expect(triggerEventAcceptsDcFormula('damageTaken')).toBe(true);
    expect(triggerEventAcceptsDcFormula('turnEnd')).toBe(false);
    expect(triggerEventHasOtherParty('attackRoll')).toBe(true);
    expect(triggerEventHasOtherParty('damageTaken')).toBe(true);
    expect(triggerEventHasOtherParty('hpZero')).toBe(false);

    const spellZone = resolveLayoutFor('spell', { effectTarget: 'zone' });

    expect(spellZone.triggerEvents).toEqual([
      'turnStart',
      'turnEnd',
      'enter',
      'exit',
    ]);

    expect(spellZone.triggerActions).toEqual([
      'damage',
      'applyCondition',
      'applyTag',
    ]);

    // В ауру входят и выходят так же, как в зону
    expect(
      resolveLayoutFor('spell', { aura: ALL_CREATURES_AURA }).triggerEvents,
    ).toEqual([
      'turnStart',
      'turnEnd',
      'enter',
      'exit',
      'damageTaken',
      'hpZero',
    ]);

    const trait = resolveLayoutFor('creatureTrait');

    expect(trait.triggerEvents).toEqual([
      'turnStart',
      'turnEnd',
      'damageTaken',
      'hpZero',
    ]);

    expect(trait.triggerActions).toEqual([
      'damage',
      'applyCondition',
      'applyTag',
      'setHp',
    ]);

    // Эффект накладывают — выбирается и ход наложившего
    expect(own.triggerTurnOwners).toEqual(['subject', 'source']);
    // У черты существа наложившего нет
    expect(trait.triggerTurnOwners).toEqual(['subject']);

    for (const context of ['feature', 'item'] as const) {
      expect(resolveLayoutFor(context).triggerEvents, context).toEqual([
        'damageTaken',
        'hpZero',
      ]);
    }

    expect(resolveLayoutFor('weapon').triggerEvents).toEqual([]);
  });

  it('пресеты по месту; повторный спасбросок повторяет спасбросок эффекта', () => {
    expect(listEffectTriggerPresets(resolveLayoutFor('ownEffects'))).toEqual([
      'recurringDamage',
      'recurringSave',
      'consumeOn',
      'hpZeroToOne',
      'tagOnDamage',
      'custom',
    ]);

    expect(
      listEffectTriggerPresets(
        resolveLayoutFor('spell', { effectTarget: 'zone' }),
      ),
    ).toEqual(['recurringDamage', 'custom']);

    const effect = createEffect({
      effectTarget: 'target',
      applySave: CONSTITUTION_SAVE,
    });

    const layout = resolveEffectFormLayout('weapon', effect);
    const preset = createEffectTriggerPreset('recurringSave', effect, layout);

    expect(writeEffectTriggerRow(effect, 0, preset).recurringSave).toEqual({
      ability: 'constitution',
      dc: SAVE_DC,
      timing: 'endOfTurn',
    });

    const spell = createEffect({ effectTarget: 'target' });

    // У заклинания — Сл заклинателя
    expect(
      createEffectTriggerPreset(
        'recurringSave',
        spell,
        resolveEffectFormLayout('spell', spell),
      ).save?.dc,
    ).toBe(0);
  });

  it('запись «сначала старые поля»: лимит уводит строку в triggers, удаление снимает поле', () => {
    const layout = resolveLayoutFor('ownEffects');
    const effect = createEffect();

    const burning = writeEffectTriggerRow(
      effect,
      0,
      createEffectTriggerPreset('recurringDamage', effect, layout),
    );

    expect(burning.recurringDamage).toEqual({
      damageParts: [],
      timing: 'startOfTurn',
    });

    expect(burning.triggers).toBeUndefined();

    const [row] = listEffectListTriggers(burning);

    expect(row).toBeDefined();

    if (!row) {
      return;
    }

    const limited = writeEffectTriggerRow(burning, 0, {
      ...row,
      actions: [{ type: 'damage', parts: POISON_DAMAGE }],
      limit: { max: 1, per: 'turn' },
    });

    expect(limited.recurringDamage).toBeUndefined();
    expect(limited.triggers).toHaveLength(1);
    // Id legacy.* не уходит в triggers
    expect(limited.triggers?.[0]?.id).not.toBe(row.id);
    expect(limited.triggers?.[0]?.limit).toEqual({ max: 1, per: 'turn' });

    const consumed = writeEffectTriggerRow(
      limited,
      1,
      createEffectTriggerPreset('consumeOn', limited, layout),
    );

    expect(consumed.consumeOn).toBe('carrierAttack');

    // Старые поля читаются первыми
    expect(
      listEffectListTriggers(consumed).map((trigger) => trigger.event),
    ).toEqual(['attackRoll', 'turnStart']);

    const removed = writeEffectTriggerRow(consumed, 0, null);

    expect(removed.consumeOn).toBeUndefined();
    expect(removed.triggers).toHaveLength(1);
  });

  it('срабатывание не для этого места — плашкой; «Убрать» оставляет работающие', () => {
    const effect = createEffect({
      effectTarget: 'zone',
      triggers: [
        {
          id: 'trigger_attack',
          event: 'attackRoll',
          actions: [{ type: 'removeSelf' }],
        },
        {
          id: 'trigger_turn',
          event: 'turnStart',
          actions: [{ type: 'damage', parts: POISON_DAMAGE }],
        },
      ],
    });

    const layout = resolveEffectFormLayout('spell', effect);

    expect(listInertEffectFields(effect, layout)).toEqual(['triggers']);

    const cleared = clearInertEffectFields(effect, ['triggers'], 'spell');

    expect(cleared.triggers?.map((trigger) => trigger.id)).toEqual([
      'trigger_turn',
    ]);

    expect(
      listInertEffectFields(
        { ...effect, effectTarget: 'self' },
        resolveLayoutFor('ownEffects'),
      ),
    ).toEqual([]);
  });

  it('черта существа: срабатывание броска атаки не работает', () => {
    const effect = createEffect({
      triggers: [
        {
          id: 'trigger_attack',
          event: 'attackRoll',
          actions: [{ type: 'applyTag', tag: 'огонь' }],
        },
      ],
    });

    expect(
      listInertEffectFields(
        effect,
        resolveEffectFormLayout('creatureTrait', effect),
      ),
    ).toEqual(['triggers']);
  });

  it('сохранение: без действий не пишется, Сл и лимит — в границах', () => {
    const effect = createEffect({
      effectTarget: 'zone',
      triggers: [
        { id: 'trigger_empty', event: 'turnStart', actions: [] },
        {
          id: 'trigger_stench',
          event: 'turnStart',
          save: { ability: 'constitution', dc: -3 },
          actions: [{ type: 'applyCondition', conditionKey: 'poisoned' }],
          limit: { max: 0, per: 'round' },
        },
      ],
    });

    const itemLayout = resolveEffectFormLayout('item', effect);
    const saved = normalizeEffectDraft(effect, itemLayout);

    expect(saved.triggers?.map((trigger) => trigger.id)).toEqual([
      'trigger_stench',
    ]);

    expect(saved.triggers?.[0]?.save?.dc).toBe(1);
    expect(saved.triggers?.[0]?.limit).toEqual({ max: 1, per: 'round' });

    expect(
      normalizeEffectDraft(
        createEffect({
          triggers: [{ id: 'trigger_bare', event: 'turnEnd', actions: [] }],
        }),
        itemLayout,
      ).triggers,
    ).toBeUndefined();
  });
});

describe('шаблон состояния', () => {
  it('берёт то, что делает состояние, и оставляет срабатывание', () => {
    const effect = createEffect({
      origin: 'spell',
      aura: ALLIES_AURA,
      areaTrigger: 'enter',
      applySave: CONSTITUTION_SAVE,
      damageParts: POISON_DAMAGE,
      duration: { type: 'minutes', value: 1 },
      changes: [WALK_SPEED_CHANGE],
      exhaustionLevel: 2,
    });

    const condition = buildConditionActiveEffect('poisoned');

    expect(condition).not.toBeNull();

    if (!condition) {
      return;
    }

    const applied = applyConditionPresetToEffect(effect, condition);

    expect(applied.id).toBe(effect.id);
    expect(applied.origin).toBe('spell');
    expect(applied.aura).toEqual(ALLIES_AURA);
    expect(applied.areaTrigger).toBe('enter');
    expect(applied.applySave).toEqual(CONSTITUTION_SAVE);
    expect(applied.damageParts).toEqual(POISON_DAMAGE);
    expect(applied.duration).toEqual({ type: 'minutes', value: 1 });
    expect(applied.conditionKey).toBe('poisoned');
    expect(applied.name).toBe(condition.name);
    expect(applied.changes).toEqual(condition.changes);
    expect(applied.flags).toEqual(condition.flags);
    expect(applied.exhaustionLevel).toBeUndefined();
  });
});

describe('черновик перед сохранением', () => {
  it('имя без пробелов, пустые списки — отсутствием поля, Сл по месту', () => {
    const effect = createEffect({
      name: '  Яд  ',
      aura: ALLIES_AURA,
      areaTrigger: 'enter',
      applySave: CONSTITUTION_SAVE,
      recurringSave: {
        ability: 'wisdom',
        dc: TYPED_SAVE_DC,
        timing: 'endOfTurn',
      },
      damageParts: [],
      conditionImmunities: [],
    });

    const normalized = normalizeEffectDraft(
      effect,
      resolveEffectFormLayout('item', effect),
    );

    expect(normalized.name).toBe('Яд');
    expect(normalized.recurringSave?.dc).toBe(TYPED_SAVE_DC);
    expect(normalized.damageParts).toBeUndefined();
    expect(normalized.conditionImmunities).toBeUndefined();
  });

  it('сл спасброска против урона каждый ход: 0 у ауры предмета — 1', () => {
    const effect = createEffect({
      aura: ALLIES_AURA,
      recurringDamage: {
        damageParts: POISON_DAMAGE,
        timing: 'startOfTurn',
        save: { ...CONSTITUTION_SAVE, dc: 0 },
      },
    });

    const normalized = normalizeEffectDraft(
      effect,
      resolveEffectFormLayout('item', effect),
    );

    expect(normalized.recurringDamage?.save?.dc).toBe(1);
    expect(normalized.recurringDamage?.damageParts).toEqual(POISON_DAMAGE);
  });

  it('отметка без годного ключа выбрасывается одна, а не со срабатыванием', () => {
    const effect = createEffect({
      triggers: [
        {
          id: 'trigger_marks',
          event: 'turnStart',
          actions: [
            { type: 'applyTag', tag: '' },
            { type: 'applyTag', tag: 'огонь' },
          ],
        },
        {
          id: 'trigger_blank',
          event: 'turnEnd',
          actions: [{ type: 'applyTag', tag: 'с пробелом' }],
        },
      ],
    });

    const normalized = normalizeEffectDraft(
      effect,
      resolveEffectFormLayout('ownEffects', effect),
    );

    expect(
      normalized.triggers?.map((trigger) => [
        trigger.id,
        trigger.actions.map((action) =>
          action.type === 'applyTag' ? action.tag : action.type,
        ),
      ]),
    ).toEqual([['trigger_marks', ['огонь']]]);

    expect(listTriggerTags(effect.triggers ?? [])).toEqual(['огонь']);
  });

  it('сл 0 остаётся «Сл источника» только там, где источник есть', () => {
    const spellEffect = createEffect({
      effectTarget: 'target',
      applySave: { ...CONSTITUTION_SAVE, dc: 0 },
    });

    expect(
      normalizeEffectDraft(
        spellEffect,
        resolveEffectFormLayout('spell', spellEffect),
      ).applySave?.dc,
    ).toBe(0);

    const auraEffect = createEffect({
      aura: ALLIES_AURA,
      areaTrigger: 'enter',
      applySave: { ...CONSTITUTION_SAVE, dc: 0 },
    });

    expect(
      normalizeEffectDraft(
        auraEffect,
        resolveEffectFormLayout('item', auraEffect),
      ).applySave?.dc,
    ).toBe(1);
  });
});

describe('живая сводка эффекта', () => {
  it('аура: спасбросок при входе, провал и успех', () => {
    const effect = createEffect({
      aura: ALLIES_AURA,
      areaTrigger: 'enter',
      applySave: CONSTITUTION_SAVE,
      damageParts: POISON_DAMAGE,
      conditionKey: 'poisoned',
      duration: { type: 'minutes', value: 1 },
    });

    expect(describeEffectScenario(effect, 'creatureTrait')).toBe(
      'Когда существо входит в ауру 10 фт (союзники): спасбросок Телосложения, Сл 13. '
        + 'Провал — 2d6 ядом, «Отравленный», на 1 минуту. '
        + 'Успех — половина урона.',
    );
  });

  it('оружие: спасбросок при попадании', () => {
    const effect = createEffect({
      effectTarget: 'target',
      applySave: { ...CONSTITUTION_SAVE, onSuccess: 'negate' },
      conditionKey: 'poisoned',
      duration: { type: 'rounds', value: 1 },
    });

    expect(describeEffectScenario(effect, 'weapon')).toBe(
      'При попадании оружием: спасбросок Телосложения, Сл 13. '
        + 'Провал — «Отравленный», на 1 раунд. Успех — ничего.',
    );
  });

  it('«только при успехе»: провал ничего не даёт', () => {
    const effect = writeEffectSuccessOutcome(
      createEffect({
        effectTarget: 'target',
        applySave: CONSTITUTION_SAVE,
        changes: [WALK_SPEED_CHANGE],
      }),
      'onlyOnSuccess',
    );

    expect(describeEffectScenario(effect, 'weapon')).toBe(
      'При попадании оружием: спасбросок Телосложения, Сл 13. '
        + 'Провал — ничего. Успех — Скорость (ходьба) +10 фт.',
    );
  });

  it('пассив черты не говорит о спасброске и длительности', () => {
    const effect = createEffect({
      changes: [WALK_SPEED_CHANGE],
      applySave: CONSTITUTION_SAVE,
      duration: { type: 'rounds', value: 3 },
    });

    expect(describeEffectScenario(effect, 'feature')).toBe(
      'Постоянно у персонажа: Скорость (ходьба) +10 фт.',
    );
  });

  it('пустой эффект', () => {
    expect(describeEffectScenario(createEffect(), 'item')).toBe(
      'Пока предмет надет: эффект пока ничего не делает.',
    );
  });

  it('действие существа: Сл 0 — Сл действия', () => {
    const effect = createEffect({
      effectTarget: 'target',
      applySave: { ability: 'strength', dc: 0, onSuccess: 'negate' },
      conditionKey: 'prone',
    });

    expect(describeEffectScenario(effect, 'creatureAction')).toBe(
      'Когда действие задело цель: спасбросок Силы, Сл действия. '
        + 'Провал — «Лежащий ничком». Успех — ничего.',
    );
  });

  it('«при успехе» спасброска действия', () => {
    const effect = createEffect({
      effectTarget: 'target',
      conditionKey: 'grappled',
    });

    expect(
      describeEffectScenario(
        writeEffectSuccessOutcome(effect, 'onlyOnSuccess'),
        'creatureAction',
      ),
    ).toBe(
      'Когда действие задело цель, если цель прошла спасбросок: «Схваченный».',
    );

    expect(
      describeEffectScenario(
        writeEffectSuccessOutcome(effect, 'effectWithoutDamage'),
        'creatureAction',
      ),
    ).toBe(
      'Когда действие задело цель: «Схваченный». '
        + 'Эффект ложится и при успешном спасброске.',
    );
  });

  it('заклинание на цели: «Когда заклинание задело цель»', () => {
    const effect = createEffect({
      effectTarget: 'target',
      conditionKey: 'restrained',
      duration: { type: 'rounds', value: 10 },
      recurringSave: { ability: 'strength', dc: 0, timing: 'endOfTurn' },
    });

    expect(describeEffectScenario(effect, 'spell')).toBe(
      'Когда заклинание задело цель: «Опутанный», повторный спасбросок Силы '
        + 'Сл заклинателя в конце хода снимает эффект, на 10 раундов.',
    );
  });

  it('состояние из шаблона не перечисляет свои правила, только добавленные', () => {
    const condition = buildConditionActiveEffect('poisoned');

    expect(condition?.flags.length).toBeGreaterThan(0);

    if (!condition) {
      return;
    }

    const effect = applyConditionPresetToEffect(
      createEffect({ effectTarget: 'target' }),
      condition,
    );

    expect(describeEffectScenario(effect, 'weapon')).toBe(
      'При попадании оружием: «Отравленный».',
    );

    expect(
      describeEffectScenario(
        { ...effect, changes: [...effect.changes, WALK_SPEED_CHANGE] },
        'weapon',
      ),
    ).toBe('При попадании оружием: «Отравленный», Скорость (ходьба) +10 фт.');
  });

  it('аура «пока внутри»: урон каждый ход со спасброском', () => {
    for (const [onSuccess, successLabel] of [
      ['negate', 'без урона'],
      ['half', 'половина урона'],
    ] as const) {
      const effect = createEffect({
        aura: ALLIES_AURA,
        recurringDamage: {
          damageParts: POISON_DAMAGE,
          timing: 'startOfTurn',
          save: { ...CONSTITUTION_SAVE, onSuccess },
        },
      });

      expect(describeEffectScenario(effect, 'creatureTrait')).toBe(
        'Существам в ауре 10 фт (союзники): каждый ход 2d6 ядом в начале хода '
          + `(спасбросок Телосложения, Сл 13: успех — ${successLabel}).`,
      );
    }
  });

  it('лечение каждый ход — токеном в формуле', () => {
    const effect = createEffect({
      triggers: [
        {
          id: 'trigger_regeneration',
          event: 'turnStart',
          condition: 'self.tag !== "noRegen"',
          actions: [{ type: 'damage', parts: [{ formula: '15@heal' }] }],
        },
      ],
    });

    expect(describeEffectScenario(effect, 'creatureTrait')).toBe(
      'Постоянно у существа: в начале хода, если на носителе нет отметки '
        + '«noRegen»: 15 лечения.',
    );
  });

  it('аура и снятие после атаки', () => {
    expect(
      describeEffectScenario(
        createEffect({ aura: ALLIES_AURA, changes: [WALK_SPEED_CHANGE] }),
        'item',
      ),
    ).toBe('Существам в ауре 10 фт (союзники): Скорость (ходьба) +10 фт.');

    expect(
      describeEffectScenario(
        createEffect({
          flags: ['attack.advantage'],
          consumeOn: 'carrierAttack',
        }),
        'ownEffects',
      ),
    ).toBe(
      `Пока эффект активен: ${describeEffectFlag('attack.advantage')}, `
        + 'снимается после своей атаки.',
    );
  });
});
