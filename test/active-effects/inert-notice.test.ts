import type { EffectTrigger } from '~active-effects/model';

import { describe, expect, it } from 'vitest';

import {
  clearInertEffectFields,
  EFFECT_INERT_FIELD_REASONS,
  EFFECT_INERT_NOTICE_LABELS,
  EFFECT_TRIGGER_EVENT_UNAVAILABLE_REASONS,
  isEffectTriggerSupported,
  listInertEffectFields,
  listInertNoticeRows,
  listUnsupportedEffectTriggers,
  removeEffectTrigger,
  resolveEffectFormLayout,
} from '~active-effects/model';

import { createEffect, POISON_DAMAGE } from './fixtures';

/** «При наложении»: у постоянного эффекта умения не наступает. */
const APPLIED_TRIGGER: EffectTrigger = {
  id: 'trigger_applied',
  event: 'applied',
  actions: [{ type: 'removeSelf' }],
};

/** «При включении»: наступает только у эффекта с переключателем. */
const ACTIVATE_TRIGGER: EffectTrigger = {
  id: 'trigger_activate',
  event: 'activate',
  actions: [{ type: 'removeSelf' }],
};

/** «В начале хода — урон»: работает почти везде. */
const TURN_DAMAGE_TRIGGER: EffectTrigger = {
  id: 'trigger_turn',
  event: 'turnStart',
  actions: [{ type: 'damage', parts: POISON_DAMAGE }],
};

/** «В начале хода — хиты становятся»: такого действия на этом событии нет. */
const TURN_SET_HP_TRIGGER: EffectTrigger = {
  id: 'trigger_set_hp',
  event: 'turnStart',
  actions: [{ type: 'setHp', value: '1' }],
};

describe('плашка «Не работает в этом месте»: срабатывания по одному', () => {
  it('событие не наступает — причина и что включить в этом же месте', () => {
    const effect = createEffect({
      triggers: [APPLIED_TRIGGER, ACTIVATE_TRIGGER],
    });

    const layout = resolveEffectFormLayout('weapon', effect);
    const unsupported = listUnsupportedEffectTriggers(effect, layout);

    expect(unsupported.map((entry) => entry.trigger.id)).toEqual([
      APPLIED_TRIGGER.id,
      ACTIVATE_TRIGGER.id,
    ]);

    // Наложение у оружия включают применением или доставкой «на цели»
    expect(unsupported[0]).toMatchObject({
      eventUnavailable: true,
      eventSwitches: ['use', 'target'],
      unavailableActions: [],
    });

    expect(unsupported[1]?.eventSwitches).toEqual(['toggle']);

    // Сводка не считает их работающими
    expect(isEffectTriggerSupported(APPLIED_TRIGGER, layout)).toBe(false);
    expect(isEffectTriggerSupported(ACTIVATE_TRIGGER, layout)).toBe(false);
  });

  it('предлагается только то, что в этом месте есть', () => {
    const effect = createEffect({ triggers: [ACTIVATE_TRIGGER] });
    const layout = resolveEffectFormLayout('creatureTrait', effect);

    // У черты существа переключателя нет — советовать его нельзя
    expect(layout.activationModes).not.toContain('toggle');

    const [row] = listInertNoticeRows(['triggers'], effect, layout);

    expect(row?.reason).toBe(EFFECT_TRIGGER_EVENT_UNAVAILABLE_REASONS.activate);
  });

  it('событие без особой причины — общая причина', () => {
    const effect = createEffect({
      effectTarget: 'zone',
      triggers: [
        {
          id: 'trigger_attack',
          event: 'attackRoll',
          actions: [{ type: 'removeSelf' }],
        },
      ],
    });

    const layout = resolveEffectFormLayout('spell', effect);
    const [row] = listInertNoticeRows(['triggers'], effect, layout);

    expect(row?.reason).toBe(EFFECT_INERT_FIELD_REASONS.triggers);
  });

  it('действия нет на этом событии — срабатывание названо, действие перечислено', () => {
    const effect = createEffect({
      triggers: [TURN_SET_HP_TRIGGER, TURN_DAMAGE_TRIGGER],
    });

    const layout = resolveEffectFormLayout('spell', effect);

    expect(listInertEffectFields(effect, layout)).toContain('triggers');
    expect(isEffectTriggerSupported(TURN_SET_HP_TRIGGER, layout)).toBe(false);
    expect(isEffectTriggerSupported(TURN_DAMAGE_TRIGGER, layout)).toBe(true);

    const rows = listInertNoticeRows(['triggers'], effect, layout);

    expect(rows).toHaveLength(1);

    expect(rows[0]).toMatchObject({
      key: TURN_SET_HP_TRIGGER.id,
      name: EFFECT_INERT_NOTICE_LABELS.triggerName,
      field: null,
      triggerId: TURN_SET_HP_TRIGGER.id,
    });

    expect(
      rows[0]?.detail.startsWith(EFFECT_INERT_NOTICE_LABELS.detailSeparator),
    ).toBe(true);

    expect(
      rows[0]?.reason.startsWith(
        EFFECT_INERT_NOTICE_LABELS.actionsUnavailablePrefix,
      ),
    ).toBe(true);
  });

  it('поля — своей строкой с причиной, а «Убрать» стирает только своё', () => {
    const effect = createEffect({
      effectTarget: 'target',
      triggers: [APPLIED_TRIGGER],
    });

    const layout = resolveEffectFormLayout('feature', effect);
    const fields = listInertEffectFields(effect, layout);

    expect(fields).toEqual(['effectTarget', 'triggers']);

    const rows = listInertNoticeRows(fields, effect, layout);

    expect(rows.map((row) => row.key)).toEqual([
      'effectTarget',
      APPLIED_TRIGGER.id,
    ]);

    expect(rows[0]).toMatchObject({
      field: 'effectTarget',
      triggerId: null,
      detail: '',
      reason: EFFECT_INERT_FIELD_REASONS.effectTarget,
    });

    // Строка поля стирает только поле: срабатывания на месте
    const withoutTarget = clearInertEffectFields(
      effect,
      ['effectTarget'],
      'feature',
    );

    expect(withoutTarget.triggers).toEqual(effect.triggers);
  });
});

describe('удаление одного срабатывания', () => {
  it('остальные срабатывания остаются', () => {
    const effect = createEffect({
      triggers: [APPLIED_TRIGGER, ACTIVATE_TRIGGER, TURN_DAMAGE_TRIGGER],
    });

    expect(
      removeEffectTrigger(effect, APPLIED_TRIGGER.id).triggers?.map(
        (trigger) => trigger.id,
      ),
    ).toEqual([ACTIVATE_TRIGGER.id, TURN_DAMAGE_TRIGGER.id]);
  });

  it('пустой список в данные не пишется', () => {
    const effect = createEffect({ triggers: [APPLIED_TRIGGER] });

    expect(removeEffectTrigger(effect, APPLIED_TRIGGER.id).triggers).toBe(
      undefined,
    );
  });
});
