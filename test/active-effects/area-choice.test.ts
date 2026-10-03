import type {
  ActiveEffect,
  EffectAreaChoice,
  EffectFormContext,
  EffectTrigger,
} from '~active-effects/model';
import type { CreateAction } from '~bestiary/model';

import { describe, expect, it } from 'vitest';

import {
  clearInertEffectFields,
  describeActiveEffect,
  describeAreaChoice,
  describeEffectScenario,
  EFFECT_FORM_CONTEXT,
  listInertEffectFields,
  normalizeActiveEffects,
  normalizeLoadedActiveEffects,
  readAreaChoiceSettings,
  resolveAreaChoiceMode,
  resolveEffectFormLayout,
  toDraftAreaChoice,
  toDraftAreaChoiceCount,
} from '~active-effects/model';
import {
  createEmptyCreatureAction,
  CREATURE_ACTION_EFFECT_CONTEXTS,
  normalizeCreatureActions,
} from '~bestiary/model';
import { normalizeLoadedSpell } from '~spells/model';

import {
  createEffect,
  createRawEffect,
  resolveLayoutFor,
  stripUndefinedKeys,
} from './fixtures';

/** «Замедление»: до шести существ на выбор в кубе. */
const SLOW_CHOICE_COUNT = 6;

/** Предел выбора формулой: на одно существо больше круга ячейки. */
const CAST_LEVEL_FORMULA = '@castLevel + 1';

/** Наибольший предел выбора. */
const MAX_CHOICE_COUNT = 99;

/** Число больше наибольшего предела. */
const OVER_MAX_CHOICE_COUNT = 150;

/** Длина формулы больше допустимой. */
const OVER_MAX_FORMULA_LENGTH = 201;

/** Размер области применения в тестах, фт. */
const USE_AREA_SIZE = 20;

/** Правило «Замедления». */
const SLOW_AREA_CHOICE: EffectAreaChoice = { count: SLOW_CHOICE_COUNT };

/** Правило со всеми полями. */
const FULL_AREA_CHOICE: EffectAreaChoice = {
  count: '@castLevel',
  mode: 'exactly',
  target: 'allies',
  fallback: 'all',
};

/** Кнопка «При действии» с шаблоном получателей. */
const TEMPLATE_ACTION_TRIGGER: EffectTrigger = {
  id: 'trigger_breath',
  event: 'activate',
  recipient: 'area',
  area: { radius: 0, template: { shape: 'cone', size: USE_AREA_SIZE } },
  actions: [{ type: 'damage', parts: [{ formula: '2d6@dmg.fire' }] }],
};

/**
 * Круг «открыл запись — сохранил»: загрузка эффектов и их запись в месте
 * формы.
 *
 * @param rawEffect эффект, как его отдал сервер.
 * @param context место формы.
 * @returns правило выбора, как его увидит сервер.
 */
function roundTripAreaChoice(
  rawEffect: Record<string, unknown>,
  context: EffectFormContext,
): unknown {
  const [savedEffect] = normalizeActiveEffects(
    normalizeLoadedActiveEffects([rawEffect]),
    context,
  );

  return stripUndefinedKeys(savedEffect?.areaChoice ?? null);
}

/**
 * Правило выбора загруженного эффекта.
 *
 * @param rawAreaChoice значение поля `areaChoice`, в том числе негодное.
 * @returns правило после разбора.
 */
function loadAreaChoice(rawAreaChoice: unknown): EffectAreaChoice | undefined {
  return normalizeLoadedActiveEffects([
    createRawEffect({ areaChoice: rawAreaChoice }),
  ])[0]?.areaChoice;
}

/**
 * Применяемый эффект умения с областью.
 *
 * @param overrides поля, отличные от умолчания.
 * @returns эффект.
 */
function createAreaUseEffect(
  overrides: Partial<ActiveEffect> = {},
): ActiveEffect {
  return createEffect({
    effectTarget: 'target',
    activation: {
      mode: 'use',
      area: { shape: 'circle', size: USE_AREA_SIZE },
    },
    ...overrides,
  });
}

describe('схема: правило «на выбор из тех, кто в области»', () => {
  it('число и формула разбираются как есть', () => {
    expect(loadAreaChoice(SLOW_AREA_CHOICE)).toEqual(SLOW_AREA_CHOICE);
    expect(loadAreaChoice(FULL_AREA_CHOICE)).toEqual(FULL_AREA_CHOICE);

    expect(loadAreaChoice({ count: CAST_LEVEL_FORMULA })).toEqual({
      count: CAST_LEVEL_FORMULA,
    });
  });

  it('негодное поле выбрасывается одно, остальные остаются', () => {
    expect(
      stripUndefinedKeys(
        loadAreaChoice({
          count: OVER_MAX_CHOICE_COUNT,
          mode: 'someday',
          target: 'enemies',
          fallback: 'everyone',
        }),
      ),
    ).toEqual({ target: 'enemies' });

    expect(
      stripUndefinedKeys(
        loadAreaChoice({
          count: 'x'.repeat(OVER_MAX_FORMULA_LENGTH),
          mode: 'upTo',
        }),
      ),
    ).toEqual({ mode: 'upTo' });
  });

  it('пустое и негодное правило — его отсутствие, эффект остаётся', () => {
    for (const rawAreaChoice of [{}, { mode: 'someday' }, 'six', null, []]) {
      const loadedEffects = normalizeLoadedActiveEffects([
        createRawEffect({ areaChoice: rawAreaChoice }),
      ]);

      expect(loadedEffects).toHaveLength(1);
      expect(loadedEffects[0]?.areaChoice).toBeUndefined();
    }
  });

  it('число строкой становится числом', () => {
    expect(loadAreaChoice({ count: '6' })).toEqual(SLOW_AREA_CHOICE);
  });
});

describe('сохранение: правило переживает «открыл — сохранил»', () => {
  it.each([
    EFFECT_FORM_CONTEXT.spell,
    EFFECT_FORM_CONTEXT.creatureAction,
    EFFECT_FORM_CONTEXT.feature,
    EFFECT_FORM_CONTEXT.item,
    EFFECT_FORM_CONTEXT.weapon,
    EFFECT_FORM_CONTEXT.creatureTrait,
    EFFECT_FORM_CONTEXT.ownEffects,
  ])('в месте «%s»', (context) => {
    expect(
      roundTripAreaChoice(
        createRawEffect({ areaChoice: SLOW_AREA_CHOICE }),
        context,
      ),
    ).toEqual(SLOW_AREA_CHOICE);

    expect(
      roundTripAreaChoice(
        createRawEffect({ areaChoice: FULL_AREA_CHOICE }),
        context,
      ),
    ).toEqual(FULL_AREA_CHOICE);
  });

  it('эффект без правила сохраняется без поля', () => {
    const [savedEffect] = normalizeActiveEffects(
      normalizeLoadedActiveEffects([createRawEffect()]),
      EFFECT_FORM_CONTEXT.spell,
    );

    expect(stripUndefinedKeys(savedEffect)).not.toHaveProperty('areaChoice');
  });

  it('черновик приводится к записи: предел в пределах, формула без пробелов', () => {
    const [clamped, trimmed, blank] = normalizeActiveEffects(
      [
        createEffect({ areaChoice: { count: OVER_MAX_CHOICE_COUNT } }),
        createEffect({ areaChoice: { count: ` ${CAST_LEVEL_FORMULA} ` } }),
        createEffect({ areaChoice: { count: '   ' } }),
      ],
      EFFECT_FORM_CONTEXT.spell,
    );

    expect(clamped?.areaChoice?.count).toBe(MAX_CHOICE_COUNT);
    expect(trimmed?.areaChoice?.count).toBe(CAST_LEVEL_FORMULA);
    expect(blank?.areaChoice).toBeUndefined();
  });

  it('форма заклинания отдаёт правило эффекта', () => {
    const loadedSpell = normalizeLoadedSpell({
      activeEffects: [createRawEffect({ areaChoice: SLOW_AREA_CHOICE })],
    });

    expect(
      normalizeLoadedActiveEffects(loadedSpell.activeEffects)[0]?.areaChoice,
    ).toEqual(SLOW_AREA_CHOICE);
  });

  it('действие существа сохраняет правило своего эффекта', () => {
    const emptyAction = createEmptyCreatureAction();

    const breath: CreateAction = {
      ...emptyAction,
      name: { rus: 'Ледяное дыхание', eng: 'Cold Breath' },
      effect: {
        ...emptyAction.effect,
        activeEffects: [
          createEffect({
            effectTarget: 'target',
            areaChoice: { target: 'enemies' },
          }),
        ],
      },
    };

    const [savedAction] = normalizeCreatureActions(
      [breath],
      CREATURE_ACTION_EFFECT_CONTEXTS.actions,
    );

    expect(
      stripUndefinedKeys(savedAction?.effect.activeEffects[0]?.areaChoice),
    ).toEqual({ target: 'enemies' });
  });
});

describe('поля формы: умолчания не пишутся', () => {
  it('без правила поля показывают умолчания VTTG', () => {
    expect(readAreaChoiceSettings(undefined)).toEqual({
      count: undefined,
      mode: 'all',
      target: 'allWithSelf',
      fallback: 'none',
    });
  });

  it('режим без поля: «до числа» у правила с числом, «все» без него', () => {
    expect(resolveAreaChoiceMode(SLOW_AREA_CHOICE)).toBe('upTo');
    expect(resolveAreaChoiceMode({ target: 'enemies' })).toBe('all');
    expect(resolveAreaChoiceMode(FULL_AREA_CHOICE)).toBe('exactly');
  });

  it('правило из одних умолчаний снимается', () => {
    expect(
      toDraftAreaChoice(readAreaChoiceSettings(undefined)),
    ).toBeUndefined();
  });

  it('режим пишется, только когда его не угадать по числу', () => {
    const settings = readAreaChoiceSettings(SLOW_AREA_CHOICE);

    expect(stripUndefinedKeys(toDraftAreaChoice(settings))).toEqual(
      SLOW_AREA_CHOICE,
    );

    // «Существа по вашему выбору»: числа нет, а выбор есть
    expect(
      stripUndefinedKeys(toDraftAreaChoice({ ...settings, count: undefined })),
    ).toEqual({ mode: 'upTo' });

    expect(
      stripUndefinedKeys(toDraftAreaChoice({ ...settings, mode: 'exactly' })),
    ).toEqual({ count: SLOW_CHOICE_COUNT, mode: 'exactly' });
  });

  it('без выбора предел и исход закрытого окна не пишутся', () => {
    expect(
      stripUndefinedKeys(
        toDraftAreaChoice({
          ...readAreaChoiceSettings(FULL_AREA_CHOICE),
          mode: 'all',
        }),
      ),
    ).toEqual({ target: 'allies' });
  });

  it('поле предела: цифры — число, остальное — формула, пустое — нет', () => {
    expect(toDraftAreaChoiceCount('6')).toBe(SLOW_CHOICE_COUNT);
    expect(toDraftAreaChoiceCount(CAST_LEVEL_FORMULA)).toBe(CAST_LEVEL_FORMULA);
    expect(toDraftAreaChoiceCount('')).toBeUndefined();
  });
});

describe('раскладка: правило видно там, где применение ставит шаблон', () => {
  it('заклинание: с областью — да, без области — нет', () => {
    const effect = createEffect({ effectTarget: 'target' });

    expect(
      resolveEffectFormLayout('spell', effect, { zoneAvailable: true })
        .showAreaChoice,
    ).toBe(true);

    expect(
      resolveEffectFormLayout('spell', effect, { zoneAvailable: false })
        .showAreaChoice,
    ).toBe(false);

    // Форма без знания об области ничего не прячет
    expect(resolveLayoutFor('spell').showAreaChoice).toBe(true);
  });

  it('действие существа: с областью — да, без области — нет', () => {
    const effect = createEffect({ effectTarget: 'target' });

    expect(
      resolveEffectFormLayout('creatureAction', effect, { zoneAvailable: true })
        .showAreaChoice,
    ).toBe(true);

    expect(
      resolveEffectFormLayout('creatureAction', effect, {
        zoneAvailable: false,
      }).showAreaChoice,
    ).toBe(false);
  });

  it('применение умения и предмета: только с областью', () => {
    for (const context of ['feature', 'item', 'ownEffects'] as const) {
      expect(
        resolveEffectFormLayout(context, createAreaUseEffect()).showAreaChoice,
      ).toBe(true);

      expect(
        resolveLayoutFor(context, {
          effectTarget: 'target',
          activation: { mode: 'use' },
        }).showAreaChoice,
      ).toBe(false);
    }
  });

  it('кнопка «При действии»: только с шаблоном', () => {
    expect(
      resolveLayoutFor('feature', { triggers: [TEMPLATE_ACTION_TRIGGER] })
        .showAreaChoice,
    ).toBe(true);

    expect(
      resolveLayoutFor('feature', {
        triggers: [
          { ...TEMPLATE_ACTION_TRIGGER, area: { radius: USE_AREA_SIZE } },
        ],
      }).showAreaChoice,
    ).toBe(false);
  });

  it('постоянный эффект и черта существа области не имеют', () => {
    expect(resolveLayoutFor('feature').showAreaChoice).toBe(false);
    expect(resolveLayoutFor('item').showAreaChoice).toBe(false);
    expect(resolveLayoutFor('weapon').showAreaChoice).toBe(false);
    expect(resolveLayoutFor('creatureTrait').showAreaChoice).toBe(false);
  });

  it('правило без области — неработающая настройка, «Убрать» его снимает', () => {
    const effect = createEffect({ areaChoice: SLOW_AREA_CHOICE });
    const layout = resolveEffectFormLayout('feature', effect);

    expect(listInertEffectFields(effect, layout)).toContain('areaChoice');

    expect(
      clearInertEffectFields(effect, ['areaChoice'], 'feature').areaChoice,
    ).toBeUndefined();

    const areaEffect = createAreaUseEffect({ areaChoice: SLOW_AREA_CHOICE });

    expect(
      listInertEffectFields(
        areaEffect,
        resolveEffectFormLayout('feature', areaEffect),
      ),
    ).not.toContain('areaChoice');
  });

  it('у заклинания без области правило числится неработающим', () => {
    const effect = createEffect({
      effectTarget: 'target',
      areaChoice: SLOW_AREA_CHOICE,
    });

    expect(
      listInertEffectFields(
        effect,
        resolveEffectFormLayout('spell', effect, { zoneAvailable: false }),
      ),
    ).toContain('areaChoice');
  });
});

describe('описание словами', () => {
  it('правило, которое ничего не меняет, не описывается', () => {
    expect(describeAreaChoice(undefined)).toBe('');
    expect(describeAreaChoice({ target: 'allWithSelf' })).toBe('');
  });

  it('выбор: предел, из кого и что без выбора', () => {
    expect(describeAreaChoice(SLOW_AREA_CHOICE)).toBe(
      'применивший выбирает цели в области (до 6)',
    );

    expect(describeAreaChoice({ mode: 'upTo' })).toBe(
      'применивший выбирает цели в области (сколько угодно)',
    );

    expect(describeAreaChoice(FULL_AREA_CHOICE)).toBe(
      'применивший выбирает цели в области (ровно @castLevel; только союзники; без выбора — все)',
    );
  });

  it('отбор без выбора', () => {
    expect(describeAreaChoice({ target: 'enemies' })).toBe(
      'в области задеты: только враги',
    );

    expect(describeAreaChoice({ target: 'all' })).toBe(
      'в области задеты: все, кроме применившего',
    );
  });

  it('описание эффекта и сводка формы называют правило', () => {
    const effect = createEffect({
      effectTarget: 'target',
      flags: ['save.disadvantage.dexterity'],
      areaChoice: SLOW_AREA_CHOICE,
    });

    expect(describeActiveEffect(effect)).toContain(
      'применивший выбирает цели в области (до 6)',
    );

    expect(describeEffectScenario(effect, 'spell')).toContain(
      ', применивший выбирает цели в области (до 6)',
    );

    // У постоянного эффекта умения области нет — сводка о правиле молчит
    expect(describeEffectScenario(effect, 'feature')).not.toContain(
      'в области',
    );
  });
});
