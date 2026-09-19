import type { EffectTrigger } from '~active-effects/model';

import { describe, expect, it } from 'vitest';

import {
  APPLIER_SAVE_DC,
  applyConditionPresetToEffect,
  buildConditionActiveEffect,
  buildTriggerRecipientOptions,
  clearInertEffectFields,
  createEffectForContext,
  createEffectTriggerPreset,
  DEFAULT_EFFECT_SAVE_DC,
  describeEffectFlag,
  describeEffectScenario,
  EFFECT_FORM_STEPS,
  EFFECT_SUCCESS_OUTCOMES,
  FIXED_MIN_SAVE_DC,
  listEffectFormSteps,
  listEffectListTriggers,
  listEffectTriggerPresets,
  listInertEffectFields,
  listTriggerActionTypes,
  listTriggerTags,
  MIN_TRIGGER_AREA_RADIUS,
  normalizeEffectDraft,
  readEffectAreaTrigger,
  readEffectDelivery,
  readEffectSuccessOutcome,
  resolveEffectFormLayout,
  triggerEventAcceptsArea,
  triggerEventAcceptsDcFormula,
  triggerEventHasOtherParty,
  writeEffectAreaTrigger,
  writeEffectDelivery,
  writeEffectSaveEnabled,
  writeEffectSuccessOutcome,
  writeEffectTriggerRow,
  writeTriggerEvent,
} from '~active-effects/model';

import {
  ALL_CREATURES_AURA,
  ALLIES_AURA,
  AURA_RADIUS,
  CONSTITUTION_SAVE,
  createEffect,
  NEW_EFFECT_ID,
  NEW_EFFECT_NAME,
  POISON_DAMAGE,
  resolveLayoutFor,
  SAVE_DC,
  TYPED_SAVE_DC,
  WALK_SPEED_CHANGE,
} from './fixtures';

/** Радиус ауры, настроенный автором. */
const CUSTOM_AURA_RADIUS = 30;

/** Отрицательный радиус «всем в радиусе»: нормализация поднимает его до нуля. */
const NEGATIVE_AREA_RADIUS = -5;

describe('новый эффект по месту формы', () => {
  it('у действия существа и заклинания эффект сразу на цели', () => {
    for (const context of ['creatureAction', 'spell'] as const) {
      const effect = createEffectForContext(
        context,
        NEW_EFFECT_ID,
        NEW_EFFECT_NAME,
      );

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
      const effect = createEffectForContext(
        context,
        NEW_EFFECT_ID,
        NEW_EFFECT_NAME,
      );

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
    const stayLayout = resolveLayoutFor('feature', { aura: ALLIES_AURA });

    expect(stayLayout.delivery).toBe('aura');
    expect(stayLayout.showAuraSettings).toBe(true);
    expect(stayLayout.showSave).toBe(false);
    expect(stayLayout.saveUnavailableReason).toBe('stayTrigger');
    expect(stayLayout.showDuration).toBe(false);
    expect(stayLayout.showRecurringSave).toBe(false);

    const enterLayout = resolveLayoutFor('feature', {
      aura: ALLIES_AURA,
      areaTrigger: 'enter',
    });

    expect(enterLayout.showSave).toBe(true);
    expect(enterLayout.showTriggerDamage).toBe(true);
    expect(enterLayout.showDuration).toBe(true);
    expect(enterLayout.minSaveDc).toBe(FIXED_MIN_SAVE_DC);
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
    expect(layout.minSaveDc).toBe(APPLIER_SAVE_DC);
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
    expect(layout.minSaveDc).toBe(FIXED_MIN_SAVE_DC);
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

    expect(layout.deliveryOptions).toEqual(['target', 'carrier']);
    expect(layout.minSaveDc).toBe(APPLIER_SAVE_DC);
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
    expect(layout.minSaveDc).toBe(APPLIER_SAVE_DC);
  });

  it('заклинание на заклинателе: Сл 0 — Сл заклинателя при любой доставке', () => {
    expect(resolveLayoutFor('spell').minSaveDc).toBe(APPLIER_SAVE_DC);

    expect(resolveLayoutFor('spell', { aura: ALLIES_AURA }).minSaveDc).toBe(
      APPLIER_SAVE_DC,
    );
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
    const effect = writeEffectAreaTrigger(
      createEffect({ areaTrigger: 'enter' }),
      'stay',
    );

    expect(effect.areaTrigger).toBeUndefined();
    expect(readEffectAreaTrigger(effect)).toBe('stay');
  });
});

describe('исход успешного спасброска', () => {
  /** Ожидаемые поля по исходу. */
  const OUTCOME_FIELDS = {
    nothing: {
      onSuccess: 'negate',
      applyOnSuccess: undefined,
      applyOnSuccessOnly: undefined,
    },
    halfDamage: {
      onSuccess: 'half',
      applyOnSuccess: undefined,
      applyOnSuccessOnly: undefined,
    },
    halfDamageWithEffect: {
      onSuccess: 'half',
      applyOnSuccess: true,
      applyOnSuccessOnly: undefined,
    },
    effectWithoutDamage: {
      onSuccess: 'negate',
      applyOnSuccess: true,
      applyOnSuccessOnly: undefined,
    },
    onlyOnSuccess: {
      onSuccess: 'negate',
      applyOnSuccess: undefined,
      applyOnSuccessOnly: true,
    },
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

      const { onSuccess, applyOnSuccess, applyOnSuccessOnly } =
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
    const inertFields = listInertEffectFields(effect, layout);

    // Аура умения работает: персонаж излучает её сам
    expect(inertFields).toEqual(['applySave', 'recurringSave', 'duration']);

    const clearedEffect = clearInertEffectFields(
      effect,
      inertFields,
      'feature',
    );

    expect(clearedEffect.aura).toEqual(ALLIES_AURA);
    expect(clearedEffect.applySave).toBeUndefined();
    expect(clearedEffect.recurringSave).toBeUndefined();
    expect(clearedEffect.duration).toEqual({ type: 'permanent' });
    expect(clearedEffect.changes).toEqual([WALK_SPEED_CHANGE]);

    expect(
      listInertEffectFields(
        clearedEffect,
        resolveEffectFormLayout('feature', clearedEffect),
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

  it('эффект действия существа ложится и на само существо', () => {
    const effect = createEffect({ effectTarget: 'self' });
    const layout = resolveEffectFormLayout('creatureAction', effect);

    // Доставка «На существе» работает с 0.8.62: неработающих полей нет
    expect(layout.delivery).toBe('carrier');
    expect(listInertEffectFields(effect, layout)).toEqual([]);
  });

  it('спасбросок, «при успехе» и урон у ауры «пока внутри»', () => {
    const effect = createEffect({
      aura: ALLIES_AURA,
      applySave: CONSTITUTION_SAVE,
      applyOnSuccess: true,
      damageParts: POISON_DAMAGE,
    });

    const layout = resolveEffectFormLayout('item', effect);
    const inertFields = listInertEffectFields(effect, layout);

    expect(inertFields).toEqual(['applySave', 'successOutcome', 'damageParts']);

    const clearedEffect = clearInertEffectFields(effect, inertFields, 'item');

    expect(clearedEffect.applySave).toBeUndefined();
    expect(clearedEffect.applyOnSuccess).toBeUndefined();
    expect(clearedEffect.applyOnSuccessOnly).toBeUndefined();
    expect(clearedEffect.damageParts).toBeUndefined();
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

  it('действие существа: шаг держат условие наложения и вариант', () => {
    expect(
      listEffectFormSteps(
        resolveLayoutFor('creatureAction', { effectTarget: 'target' }),
      ),
    ).toEqual([
      'trigger',
      'save',
      'damage',
      'modifiers',
      'duration',
      'triggers',
    ]);
  });

  it('условие наложения и вариант держат шаг «Когда срабатывает»', () => {
    expect(listEffectFormSteps(resolveLayoutFor('condition'))).toEqual([
      'modifiers',
    ]);

    const layout = resolveLayoutFor('spell', { effectTarget: 'target' });

    expect(layout.showVariant).toBe(true);
    expect(listEffectFormSteps(layout)).toContain('trigger');
  });
});

describe('получатель «всем в радиусе»', () => {
  /**
   * Срабатывание после нормализации черновика.
   *
   * @param trigger поля срабатывания поверх обязательных.
   * @returns срабатывание записи.
   */
  function normalizeAreaTrigger(
    trigger: Partial<EffectTrigger>,
  ): EffectTrigger | undefined {
    const draft = createEffect({
      triggers: [
        {
          id: 'trigger_area',
          event: 'hpZero',
          actions: [{ type: 'removeSelf' }],
          ...trigger,
        },
      ],
    });

    return normalizeEffectDraft(draft, resolveLayoutFor('creatureTrait'))
      .triggers?.[0];
  }

  it('выбор только у событий сервера со сценой, радиус от нуля', () => {
    expect(triggerEventAcceptsArea('hpZero')).toBe(true);
    expect(triggerEventAcceptsArea('applied')).toBe(true);
    expect(triggerEventAcceptsArea('turnStart')).toBe(false);

    expect(
      normalizeAreaTrigger({
        recipient: 'area',
        area: { radius: NEGATIVE_AREA_RADIUS, target: 'enemies' },
      })?.area,
    ).toEqual({ radius: MIN_TRIGGER_AREA_RADIUS, target: 'enemies' });

    const turnTrigger = normalizeAreaTrigger({
      event: 'turnStart',
      recipient: 'area',
      area: { radius: AURA_RADIUS },
    });

    expect(turnTrigger?.recipient).toBeUndefined();
    expect(turnTrigger?.area).toBeUndefined();
  });

  it('смена события уносит недоступного получателя и его радиус', () => {
    const areaTrigger: EffectTrigger = {
      id: 'trigger_area',
      event: 'hpZero',
      recipient: 'area',
      area: { radius: AURA_RADIUS },
      actions: [{ type: 'removeSelf' }],
    };

    expect(
      buildTriggerRecipientOptions(areaTrigger).map(
        (recipientOption) => recipientOption.value,
      ),
    ).toEqual(['subject', 'area']);

    const turnTrigger = writeTriggerEvent(
      areaTrigger,
      'turnStart',
      resolveLayoutFor('ownEffects'),
    );

    expect(turnTrigger.recipient).toBeUndefined();
    expect(turnTrigger.area).toBeUndefined();
  });
});

describe('применение и включение', () => {
  it('способы по месту формы: предмет применяют, умение ещё и включают', () => {
    expect(resolveLayoutFor('item').activationModes).toEqual(['use']);

    expect(resolveLayoutFor('feature').activationModes).toEqual([
      'use',
      'toggle',
    ]);

    expect(resolveLayoutFor('ownEffects').activationModes).toEqual([
      'use',
      'toggle',
    ]);

    expect(resolveLayoutFor('spell').activationModes).toEqual([]);
    expect(resolveLayoutFor('creatureTrait').activationModes).toEqual([]);
  });

  it('применяемый предмет: цель, копия живёт сама и слышит «при наложении»', () => {
    const potion = createEffect({ activation: { mode: 'use' } });
    const potionLayout = resolveEffectFormLayout('item', potion);

    expect(potionLayout.deliveryOptions).toEqual(['carrier', 'target', 'aura']);
    expect(potionLayout.showDuration).toBe(true);
    expect(potionLayout.showVariant).toBe(true);
    expect(potionLayout.showLandingCondition).toBe(true);
    expect(potionLayout.showActivationCounter).toBe(false);
    expect(potionLayout.triggerEvents).toContain('applied');
    expect(potionLayout.triggerActions).toContain('removeSelf');

    const potionOnTarget = createEffect({
      activation: { mode: 'use' },
      effectTarget: 'target',
    });

    expect(
      listInertEffectFields(
        potionOnTarget,
        resolveEffectFormLayout('item', potionOnTarget),
      ),
    ).toEqual([]);

    const wornItem = createEffect({ effectTarget: 'target' });

    expect(
      listInertEffectFields(
        wornItem,
        resolveEffectFormLayout('item', wornItem),
      ),
    ).toEqual(['effectTarget']);
  });

  it('переключаемое умение: ресурс и событие «При включении»', () => {
    const rage = createEffect({
      activation: { mode: 'toggle', counter: 'rage' },
    });

    const rageLayout = resolveEffectFormLayout('feature', rage);

    expect(rageLayout.showActivationCounter).toBe(true);
    expect(rageLayout.showDuration).toBe(true);
    expect(rageLayout.triggerEvents).toContain('activate');
    expect(rageLayout.minSaveDc).toBe(FIXED_MIN_SAVE_DC);
  });

  it('применяемое умение на цели бросает против Сл применившего', () => {
    const channel = createEffect({
      effectTarget: 'target',
      activation: { mode: 'use', counter: 'channelDivinity' },
    });

    const channelLayout = resolveEffectFormLayout('feature', channel);

    expect(channelLayout.delivery).toBe('target');
    expect(channelLayout.minSaveDc).toBe(APPLIER_SAVE_DC);
    expect(channelLayout.showSave).toBe(true);
  });

  it('применение не для этого места — неработающее поле', () => {
    const toggledItem = createEffect({ activation: { mode: 'toggle' } });

    expect(
      listInertEffectFields(
        toggledItem,
        resolveEffectFormLayout('item', toggledItem),
      ),
    ).toEqual(['activation']);
  });

  it('шаблон применения на своём листе сохраняется выключенным', () => {
    const template = createEffect({ activation: { mode: 'use' } });
    const templateLayout = resolveEffectFormLayout('ownEffects', template);

    expect(normalizeEffectDraft(template, templateLayout).disabled).toBe(true);
    expect(templateLayout.showStatusToggle).toBe(false);
  });

  it('ресурс и расход пишутся только заданными', () => {
    const rage = createEffect({
      activation: { mode: 'toggle', counter: '  rage  ', amount: 2 },
    });

    expect(
      normalizeEffectDraft(rage, resolveEffectFormLayout('feature', rage))
        .activation,
    ).toEqual({ mode: 'toggle', counter: 'rage', amount: 2 });

    const singleCharge = createEffect({
      activation: { mode: 'toggle', counter: 'rage', amount: 1 },
    });

    expect(
      normalizeEffectDraft(
        singleCharge,
        resolveEffectFormLayout('feature', singleCharge),
      ).activation,
    ).toEqual({ mode: 'toggle', counter: 'rage', amount: undefined });

    const withoutCounter = createEffect({
      activation: { mode: 'use', amount: 3 },
    });

    expect(
      normalizeEffectDraft(
        withoutCounter,
        resolveEffectFormLayout('feature', withoutCounter),
      ).activation,
    ).toEqual({ mode: 'use', counter: undefined, amount: undefined });
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
    ).toBe(APPLIER_SAVE_DC);
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

    const effectWithoutSave = writeEffectSaveEnabled(
      effect,
      false,
      resolveEffectFormLayout('weapon', effect),
    );

    expect(effectWithoutSave.applySave).toBeUndefined();
    expect(effectWithoutSave.applyOnSuccessOnly).toBeUndefined();
  });

  it('у действия существа «при успехе» остаётся за спасброском действия', () => {
    const effect = createEffect({
      effectTarget: 'target',
      applySave: CONSTITUTION_SAVE,
      applyOnSuccessOnly: true,
    });

    const effectWithoutSave = writeEffectSaveEnabled(
      effect,
      false,
      resolveEffectFormLayout('creatureAction', effect),
    );

    expect(effectWithoutSave.applySave).toBeUndefined();
    expect(effectWithoutSave.applyOnSuccessOnly).toBe(true);
  });
});

describe('список «Срабатывания»', () => {
  it('события и действия по месту', () => {
    const ownLayout = resolveLayoutFor('ownEffects');

    expect(ownLayout.triggerEvents).toEqual([
      'turnStart',
      'turnEnd',
      'attackRoll',
      'damageTaken',
      'hpZero',
      'rest',
    ]);

    expect(ownLayout.triggerActions).toEqual([
      'damage',
      'applyCondition',
      'applyTag',
      'reduceMaxHp',
      'setHp',
      'endCast',
      'removeSelf',
    ]);

    expect(listTriggerActionTypes(ownLayout, 'attackRoll')).toEqual([
      'damage',
      'applyCondition',
      'applyTag',
      'reduceMaxHp',
      'endCast',
      'removeSelf',
    ]);

    expect(listTriggerActionTypes(ownLayout, 'hpZero')).toEqual([
      'damage',
      'applyCondition',
      'applyTag',
      'reduceMaxHp',
      'setHp',
      'endCast',
      'removeSelf',
    ]);

    expect(triggerEventAcceptsDcFormula('damageTaken')).toBe(true);
    expect(triggerEventAcceptsDcFormula('turnEnd')).toBe(false);
    expect(triggerEventAcceptsDcFormula('applied')).toBe(true);
    expect(triggerEventHasOtherParty('attackRoll')).toBe(true);
    expect(triggerEventHasOtherParty('damageTaken')).toBe(true);
    expect(triggerEventHasOtherParty('applied')).toBe(true);
    expect(triggerEventHasOtherParty('hpZero')).toBe(false);

    expect(
      resolveLayoutFor('spell', { effectTarget: 'target' }).triggerEvents,
    ).toEqual([
      'applied',
      'turnStart',
      'turnEnd',
      'attackRoll',
      'damageTaken',
      'hpZero',
      'castEnd',
      'rest',
    ]);

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
      'reduceMaxHp',
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

    const traitLayout = resolveLayoutFor('creatureTrait');

    expect(traitLayout.triggerEvents).toEqual([
      'turnStart',
      'turnEnd',
      'damageTaken',
      'hpZero',
    ]);

    expect(traitLayout.triggerActions).toEqual([
      'damage',
      'applyCondition',
      'applyTag',
      'reduceMaxHp',
      'setHp',
    ]);

    // Эффект накладывают — выбирается и ход наложившего
    expect(ownLayout.triggerTurnOwners).toEqual(['subject', 'source']);
    // У черты существа наложившего нет
    expect(traitLayout.triggerTurnOwners).toEqual(['subject']);

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

    const spellEffect = createEffect({ effectTarget: 'target' });

    // У заклинания — Сл заклинателя
    expect(
      createEffectTriggerPreset(
        'recurringSave',
        spellEffect,
        resolveEffectFormLayout('spell', spellEffect),
      ).save?.dc,
    ).toBe(APPLIER_SAVE_DC);
  });

  it('запись «сначала старые поля»: лимит уводит строку в triggers, удаление снимает поле', () => {
    const layout = resolveLayoutFor('ownEffects');
    const effect = createEffect();

    const recurringDamageEffect = writeEffectTriggerRow(
      effect,
      0,
      createEffectTriggerPreset('recurringDamage', effect, layout),
    );

    expect(recurringDamageEffect.recurringDamage).toEqual({
      damageParts: [],
      timing: 'startOfTurn',
    });

    expect(recurringDamageEffect.triggers).toBeUndefined();

    const [recurringDamageTrigger] = listEffectListTriggers(
      recurringDamageEffect,
    );

    if (!recurringDamageTrigger) {
      throw new Error('Пресет урона каждый ход не дал строки срабатывания');
    }

    const limitedEffect = writeEffectTriggerRow(recurringDamageEffect, 0, {
      ...recurringDamageTrigger,
      actions: [{ type: 'damage', parts: POISON_DAMAGE }],
      limit: { max: 1, per: 'turn' },
    });

    expect(limitedEffect.recurringDamage).toBeUndefined();
    expect(limitedEffect.triggers).toHaveLength(1);
    // Id legacy.* не уходит в triggers
    expect(limitedEffect.triggers?.[0]?.id).not.toBe(recurringDamageTrigger.id);
    expect(limitedEffect.triggers?.[0]?.limit).toEqual({ max: 1, per: 'turn' });

    const consumeOnEffect = writeEffectTriggerRow(
      limitedEffect,
      1,
      createEffectTriggerPreset('consumeOn', limitedEffect, layout),
    );

    expect(consumeOnEffect.consumeOn).toBe('carrierAttack');

    // Старые поля читаются первыми
    expect(
      listEffectListTriggers(consumeOnEffect).map((trigger) => trigger.event),
    ).toEqual(['attackRoll', 'turnStart']);

    const effectWithoutConsumeOn = writeEffectTriggerRow(
      consumeOnEffect,
      0,
      null,
    );

    expect(effectWithoutConsumeOn.consumeOn).toBeUndefined();
    expect(effectWithoutConsumeOn.triggers).toHaveLength(1);
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

    const effectWithWorkingTriggers = clearInertEffectFields(
      effect,
      ['triggers'],
      'spell',
    );

    expect(
      effectWithWorkingTriggers.triggers?.map((trigger) => trigger.id),
    ).toEqual(['trigger_turn']);

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
    const normalizedEffect = normalizeEffectDraft(effect, itemLayout);

    expect(normalizedEffect.triggers?.map((trigger) => trigger.id)).toEqual([
      'trigger_stench',
    ]);

    const [stenchTrigger] = normalizedEffect.triggers ?? [];

    expect(stenchTrigger?.save?.dc).toBe(FIXED_MIN_SAVE_DC);
    expect(stenchTrigger?.limit).toEqual({ max: 1, per: 'round' });

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

    if (!condition) {
      throw new Error('Нет шаблона состояния «Отравленный»');
    }

    const poisonedEffect = applyConditionPresetToEffect(effect, condition);

    expect(poisonedEffect.id).toBe(effect.id);
    expect(poisonedEffect.origin).toBe('spell');
    expect(poisonedEffect.aura).toEqual(ALLIES_AURA);
    expect(poisonedEffect.areaTrigger).toBe('enter');
    expect(poisonedEffect.applySave).toEqual(CONSTITUTION_SAVE);
    expect(poisonedEffect.damageParts).toEqual(POISON_DAMAGE);
    expect(poisonedEffect.duration).toEqual({ type: 'minutes', value: 1 });
    expect(poisonedEffect.conditionKey).toBe('poisoned');
    expect(poisonedEffect.name).toBe(condition.name);
    expect(poisonedEffect.changes).toEqual(condition.changes);
    expect(poisonedEffect.flags).toEqual(condition.flags);
    expect(poisonedEffect.exhaustionLevel).toBeUndefined();
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

    const normalizedEffect = normalizeEffectDraft(
      effect,
      resolveEffectFormLayout('item', effect),
    );

    expect(normalizedEffect.name).toBe('Яд');
    expect(normalizedEffect.recurringSave?.dc).toBe(TYPED_SAVE_DC);
    expect(normalizedEffect.damageParts).toBeUndefined();
    expect(normalizedEffect.conditionImmunities).toBeUndefined();
  });

  it('сл спасброска против урона каждый ход: 0 у ауры предмета — 1', () => {
    const effect = createEffect({
      aura: ALLIES_AURA,
      recurringDamage: {
        damageParts: POISON_DAMAGE,
        timing: 'startOfTurn',
        save: { ...CONSTITUTION_SAVE, dc: APPLIER_SAVE_DC },
      },
    });

    const normalizedEffect = normalizeEffectDraft(
      effect,
      resolveEffectFormLayout('item', effect),
    );

    expect(normalizedEffect.recurringDamage?.save?.dc).toBe(FIXED_MIN_SAVE_DC);

    expect(normalizedEffect.recurringDamage?.damageParts).toEqual(
      POISON_DAMAGE,
    );
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

    const normalizedEffect = normalizeEffectDraft(
      effect,
      resolveEffectFormLayout('ownEffects', effect),
    );

    expect(
      normalizedEffect.triggers?.map((trigger) => [
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
      applySave: { ...CONSTITUTION_SAVE, dc: APPLIER_SAVE_DC },
    });

    expect(
      normalizeEffectDraft(
        spellEffect,
        resolveEffectFormLayout('spell', spellEffect),
      ).applySave?.dc,
    ).toBe(APPLIER_SAVE_DC);

    const auraEffect = createEffect({
      aura: ALLIES_AURA,
      areaTrigger: 'enter',
      applySave: { ...CONSTITUTION_SAVE, dc: APPLIER_SAVE_DC },
    });

    expect(
      normalizeEffectDraft(
        auraEffect,
        resolveEffectFormLayout('item', auraEffect),
      ).applySave?.dc,
    ).toBe(FIXED_MIN_SAVE_DC);
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
      `Когда существо входит в ауру ${AURA_RADIUS} фт (союзники): спасбросок Телосложения, Сл ${SAVE_DC}. `
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
      `При попадании оружием: спасбросок Телосложения, Сл ${SAVE_DC}. `
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
      `При попадании оружием: спасбросок Телосложения, Сл ${SAVE_DC}. `
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
      applySave: {
        ability: 'strength',
        dc: APPLIER_SAVE_DC,
        onSuccess: 'negate',
      },
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
      recurringSave: {
        ability: 'strength',
        dc: APPLIER_SAVE_DC,
        timing: 'endOfTurn',
      },
    });

    expect(describeEffectScenario(effect, 'spell')).toBe(
      'Когда заклинание задело цель: «Опутанный», повторный спасбросок Силы '
        + 'Сл заклинателя в конце хода снимает эффект, на 10 раундов.',
    );
  });

  it('состояние из шаблона не перечисляет свои правила, только добавленные', () => {
    const condition = buildConditionActiveEffect('poisoned');

    if (!condition) {
      throw new Error('Нет шаблона состояния «Отравленный»');
    }

    expect(condition.flags.length).toBeGreaterThan(0);

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
        `Существам в ауре ${AURA_RADIUS} фт (союзники): каждый ход 2d6 ядом в начале хода `
          + `(спасбросок Телосложения, Сл ${SAVE_DC}: успех — ${successLabel}).`,
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
    ).toBe(
      `Существам в ауре ${AURA_RADIUS} фт (союзники): Скорость (ходьба) +10 фт.`,
    );

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
