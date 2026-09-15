import { describe, expect, it } from 'vitest';

import {
  clearInertEffectFields,
  describeEffectScenario,
  listInertEffectFields,
  readEffectDelivery,
  resolveEffectFormLayout,
  writeEffectDelivery,
} from '~active-effects/model';

import { createEffect } from './fixtures';

/** «Лунный луч»: урон каждый ход в зоне, спасбросок Телосложения Сл заклинателя. */
const MOONBEAM_STAY = createEffect({
  name: 'Лунный луч',
  effectTarget: 'zone',
  recurringDamage: {
    damageParts: [{ formula: '2d10@dmg.radiant+@mod.spell' }],
    timing: 'endOfTurn',
    save: { ability: 'constitution', dc: 0, onSuccess: 'half' },
  },
});

/** «Паутина»: при входе спасбросок Ловкости, провал — «Опутанный». */
const WEB_ENTER = createEffect({
  name: 'Опутанный',
  effectTarget: 'zone',
  areaTrigger: 'enter',
  applySave: { ability: 'dexterity', dc: 0, onSuccess: 'negate' },
  conditionKey: 'restrained',
  duration: { type: 'rounds', value: 10 },
});

describe('[SZ05] форма эффекта заклинания: доставка «зоной на месте области»', () => {
  it('зона — одна из доставок заклинания; обычный эффект заклинания остаётся «на цели»', () => {
    const layout = resolveEffectFormLayout(
      'spell',
      createEffect({ effectTarget: 'target' }),
    );

    expect(layout.deliveryOptions).toEqual([
      'target',
      'carrier',
      'aura',
      'zone',
    ]);

    expect(layout.delivery).toBe('target');
    expect(readEffectDelivery(MOONBEAM_STAY, 'spell')).toBe('zone');
    expect(readEffectDelivery(createEffect(), 'spell')).toBe('carrier');
  });

  it('сл 0 — Сл заклинателя у зоны заклинания; момент — как у ауры, без её настроек', () => {
    const layout = resolveEffectFormLayout('spell', WEB_ENTER);

    expect(layout.minSaveDc).toBe(0);
    expect(layout.showTrigger).toBe(true);
    expect(layout.showAuraSettings).toBe(false);
    expect(layout.showSave).toBe(true);
    expect(resolveEffectFormLayout('item', WEB_ENTER).minSaveDc).toBe(1);
  });

  it('зона «пока в зоне»: без спасброска и длительности, с уроном каждый ход', () => {
    const layout = resolveEffectFormLayout('spell', MOONBEAM_STAY);

    expect(layout.showSave).toBe(false);
    expect(layout.saveUnavailableReason).toBe('stayTrigger');
    expect(layout.showDuration).toBe(false);
    expect(layout.showRecurringDamage).toBe(true);
  });

  it('смена доставки: в зону и обратно на цель без хвостов момента срабатывания', () => {
    const toZone = writeEffectDelivery(createEffect(), 'zone');

    expect(toZone.effectTarget).toBe('zone');

    const back = writeEffectDelivery(
      { ...toZone, areaTrigger: 'enter' },
      'target',
    );

    expect(back.effectTarget).toBe('target');
    expect(back.areaTrigger).toBeUndefined();
  });

  it('без области у заклинания зону не предлагают, а уже выбранная — неработающее поле', () => {
    const layout = resolveEffectFormLayout(
      'spell',
      createEffect({ effectTarget: 'target' }),
      { zoneAvailable: false },
    );

    expect(layout.deliveryOptions).toEqual(['target', 'carrier', 'aura']);

    const zoneLayout = resolveEffectFormLayout('spell', MOONBEAM_STAY, {
      zoneAvailable: false,
    });

    expect(listInertEffectFields(MOONBEAM_STAY, zoneLayout)).toEqual([
      'effectTarget',
    ]);

    expect(
      clearInertEffectFields(MOONBEAM_STAY, ['effectTarget'], 'spell')
        .effectTarget,
    ).toBe('target');
  });

  it('«в зону» у предмета, умения, черты и действия существа не работает', () => {
    for (const context of [
      'item',
      'feature',
      'creatureTrait',
      'creatureAction',
      'ownEffects',
    ] as const) {
      const layout = resolveEffectFormLayout(context, MOONBEAM_STAY);

      expect(listInertEffectFields(MOONBEAM_STAY, layout), context).toContain(
        'effectTarget',
      );
    }
  });

  it('сводка говорит о зоне заклинания и Сл заклинателя', () => {
    expect(describeEffectScenario(MOONBEAM_STAY, 'spell')).toBe(
      'Пока существо в зоне заклинания: каждый ход 2d10+мод. закл. характеристики излучением в конце хода '
        + '(спасбросок Телосложения, Сл заклинателя: успех — половина урона).',
    );

    expect(describeEffectScenario(WEB_ENTER, 'spell')).toBe(
      'При входе в зону заклинания: спасбросок Ловкости, Сл заклинателя. '
        + 'Провал — «Опутанный», на 10 раундов. Успех — ничего.',
    );
  });
});
