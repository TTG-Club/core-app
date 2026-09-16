import type { ActiveEffect, EffectFormContext } from '~active-effects/model';
import type { CreateAction } from '~bestiary/model';
import type { MagicItemMechanics } from '~magic-items/model';
import type { SpellEffect } from '~spells/model';

import { describe, expect, it } from 'vitest';

import {
  APPLIER_SAVE_DC,
  EFFECT_FORM_CONTEXT,
  FIXED_MIN_SAVE_DC,
  normalizeActiveEffects,
} from '~active-effects/model';
import {
  createEmptyCreatureAction,
  createEmptyCreatureActionEffect,
  CREATURE_ACTION_EFFECT_CONTEXTS,
  getInitialState,
  normalizeCreatureActions,
  transformCreatureBeforeSubmit,
} from '~bestiary/model';
import {
  getItemEffectContext,
  ITEM_WEAPON_CATEGORY,
  resolveItemEffectContext,
} from '~items/model';
import {
  createEmptyMagicItemMechanics,
  getMagicItemEffectContext,
  MAGIC_ITEM_WEAPON_CATEGORY,
  normalizeMagicItemMechanics,
} from '~magic-items/model';
import { createEmptySpellEffect, hasSpellArea } from '~spells/model';

import { CONSTITUTION_SAVE, createEffect } from './fixtures';

/** Категория доспеха: у обычных и у магических предметов одна строка. */
const ARMOR_CATEGORY = 'ARMOR';

/** Форма области заклинания в тестах. */
const CYLINDER_AREA_TYPE = 'CYLINDER';

/** Радиус области заклинания в тестах. */
const SPELL_AREA_RADIUS = 20;

/**
 * Эффект «на цели» со спасброском «Авто» — Сл источника. Где источника нет,
 * нормализация поднимает Сл до минимальной.
 *
 * @returns эффект.
 */
function createApplierSaveEffect(): ActiveEffect {
  return createEffect({
    effectTarget: 'target',
    applySave: { ...CONSTITUTION_SAVE, dc: APPLIER_SAVE_DC },
  });
}

/**
 * Запись боевого блока существа с эффектом «Авто».
 *
 * @returns запись.
 */
function createApplierSaveAction(): CreateAction {
  return {
    ...createEmptyCreatureAction(),
    effect: {
      ...createEmptyCreatureActionEffect(),
      activeEffects: [createApplierSaveEffect()],
    },
  };
}

/**
 * Сл спасброска первого эффекта записи боевого блока.
 *
 * @param actions записи после нормализации.
 * @returns сложность; `undefined` — эффекта или спасброска нет.
 */
function readFirstActionSaveDc(
  actions: Array<CreateAction>,
): number | undefined {
  return actions[0]?.effect.activeEffects[0]?.applySave?.dc;
}

/**
 * Сл спасброска первого эффекта механики магического предмета.
 *
 * @param mechanics механика после нормализации.
 * @returns сложность; `undefined` — механики, эффекта или спасброска нет.
 */
function readFirstMechanicsSaveDc(
  mechanics: MagicItemMechanics | null,
): number | undefined {
  return mechanics?.activeEffects[0]?.applySave?.dc;
}

describe('место эффектов предмета', () => {
  it('у оружия — «оружие», у остального снаряжения — «предмет»', () => {
    expect(getItemEffectContext(ITEM_WEAPON_CATEGORY)).toBe(
      EFFECT_FORM_CONTEXT.weapon,
    );

    expect(getItemEffectContext(ARMOR_CATEGORY)).toBe(EFFECT_FORM_CONTEXT.item);
    expect(resolveItemEffectContext(true)).toBe(EFFECT_FORM_CONTEXT.weapon);
    expect(resolveItemEffectContext(false)).toBe(EFFECT_FORM_CONTEXT.item);
  });

  it('у магического предмета — по категории, без категории — «предмет»', () => {
    expect(
      getMagicItemEffectContext({
        type: MAGIC_ITEM_WEAPON_CATEGORY,
        clarification: undefined,
      }),
    ).toBe(EFFECT_FORM_CONTEXT.weapon);

    expect(
      getMagicItemEffectContext({
        type: ARMOR_CATEGORY,
        clarification: undefined,
      }),
    ).toBe(EFFECT_FORM_CONTEXT.item);

    expect(
      getMagicItemEffectContext({ type: undefined, clarification: undefined }),
    ).toBe(EFFECT_FORM_CONTEXT.item);
  });

  it('механика магического оружия оставляет «Авто», прочего предмета — поднимает Сл', () => {
    const mechanics: MagicItemMechanics = {
      ...createEmptyMagicItemMechanics(),
      activeEffects: [createApplierSaveEffect()],
    };

    expect(
      readFirstMechanicsSaveDc(
        normalizeMagicItemMechanics(mechanics, EFFECT_FORM_CONTEXT.weapon),
      ),
    ).toBe(APPLIER_SAVE_DC);

    expect(
      readFirstMechanicsSaveDc(
        normalizeMagicItemMechanics(mechanics, EFFECT_FORM_CONTEXT.item),
      ),
    ).toBe(FIXED_MIN_SAVE_DC);
  });
});

describe('область заклинания', () => {
  it('есть, только если цель — область и её форма выбрана', () => {
    const areaEffect: SpellEffect = {
      targetType: 'AREA',
      areaOfEffect: {
        type: CYLINDER_AREA_TYPE,
        value1: SPELL_AREA_RADIUS,
        value2: undefined,
      },
    };

    expect(hasSpellArea(areaEffect)).toBe(true);
    expect(hasSpellArea(createEmptySpellEffect())).toBe(false);
    expect(hasSpellArea({ ...areaEffect, targetType: 'CREATURE' })).toBe(false);

    expect(
      hasSpellArea({
        targetType: 'AREA',
        areaOfEffect: {
          type: undefined,
          value1: SPELL_AREA_RADIUS,
          value2: undefined,
        },
      }),
    ).toBe(false);
  });

  it('без области эффект «зоной» сохраняется как есть: неработающую доставку показывает форма', () => {
    const zoneEffect = createEffect({ effectTarget: 'zone' });

    const [savedZoneEffect] = normalizeActiveEffects(
      [zoneEffect],
      EFFECT_FORM_CONTEXT.spell,
      { zoneAvailable: hasSpellArea(createEmptySpellEffect()) },
    );

    expect(savedZoneEffect?.effectTarget).toBe('zone');

    expect(savedZoneEffect).toEqual(
      normalizeActiveEffects([zoneEffect], EFFECT_FORM_CONTEXT.spell)[0],
    );
  });
});

describe('сл «Авто» по месту формы', () => {
  it('у действия существа остаётся, у умения, черты существа и своих эффектов — поднимается', () => {
    const effects = [createApplierSaveEffect()];

    const readSaveDc = (context: EffectFormContext) =>
      normalizeActiveEffects(effects, context)[0]?.applySave?.dc;

    expect(readSaveDc(EFFECT_FORM_CONTEXT.creatureAction)).toBe(
      APPLIER_SAVE_DC,
    );

    for (const context of [
      EFFECT_FORM_CONTEXT.feature,
      EFFECT_FORM_CONTEXT.creatureTrait,
      EFFECT_FORM_CONTEXT.ownEffects,
    ]) {
      expect(readSaveDc(context), context).toBe(FIXED_MIN_SAVE_DC);
    }
  });

  it('записи существа: у черты Сл 0 поднимается до 1, у действия остаётся 0', () => {
    const actions = [createApplierSaveAction()];

    expect(
      readFirstActionSaveDc(
        normalizeCreatureActions(
          actions,
          CREATURE_ACTION_EFFECT_CONTEXTS.traits,
        ),
      ),
    ).toBe(FIXED_MIN_SAVE_DC);

    expect(
      readFirstActionSaveDc(
        normalizeCreatureActions(
          actions,
          CREATURE_ACTION_EFFECT_CONTEXTS.actions,
        ),
      ),
    ).toBe(APPLIER_SAVE_DC);
  });

  it('сохранение существа раздаёт спискам свои места, а своим эффектам — «свои эффекты»', () => {
    const initialState = getInitialState();

    const submittedCreature = transformCreatureBeforeSubmit({
      ...initialState,
      traits: [createApplierSaveAction()],
      actions: [createApplierSaveAction()],
      legendary: {
        ...initialState.legendary,
        actions: [createApplierSaveAction()],
      },
      lair: { ...initialState.lair, effects: [createApplierSaveAction()] },
      activeEffects: [createApplierSaveEffect()],
    });

    expect(readFirstActionSaveDc(submittedCreature.traits)).toBe(
      FIXED_MIN_SAVE_DC,
    );

    expect(readFirstActionSaveDc(submittedCreature.actions)).toBe(
      APPLIER_SAVE_DC,
    );

    expect(readFirstActionSaveDc(submittedCreature.legendary.actions)).toBe(
      APPLIER_SAVE_DC,
    );

    expect(readFirstActionSaveDc(submittedCreature.lair.effects)).toBe(
      APPLIER_SAVE_DC,
    );

    expect(submittedCreature.activeEffects[0]?.applySave?.dc).toBe(
      FIXED_MIN_SAVE_DC,
    );
  });
});
