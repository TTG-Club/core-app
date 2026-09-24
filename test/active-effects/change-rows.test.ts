import { describe, expect, it } from 'vitest';

import {
  ABILITY_CHECK_KEY,
  ACTIVE_EFFECT_LABELS,
  applyEffectChangeModeChoice,
  describeEffectChange,
  describeEffectChangeValueError,
  describeEffectScenario,
  EFFECT_CHANGE_MODE_OPTIONS,
  EFFECT_MODIFIER_MENU,
  getEffectChangeModeChoice,
  getEffectChangeShownValue,
  isEffectModifierSubmenu,
  isRollDiceEffectChange,
  isRollTimeDiceKey,
  listInertEffectFields,
  negateEffectFormula,
  normalizeActiveEffects,
  readEffectAreaTrigger,
  resolveEffectFormLayout,
  SUBTRACT_MODE_CHOICE,
  toStoredEffectChangeValue,
  upgradeEffectDraft,
} from '~active-effects/model';

import { CONSTITUTION_SAVE, createEffect, POISON_DAMAGE } from './fixtures';

/** Подпись раздела проверок в меню «Готовые». */
const CHECKS_GROUP_LABEL = 'Проверки и навыки';

describe('режим «Вычесть» — только в форме', () => {
  it('смена знака затрагивает только сложение верхнего уровня', () => {
    const cases = [
      ['1к4', '-1к4'],
      ['-1к4', '1к4'],
      ['1к4+2', '-1к4-2'],
      ['1к4 - @prof', '-1к4 + @prof'],
      ['2*-1', '-2*-1'],
      ['max(1, @mod.str - 1)', '-max(1, @mod.str - 1)'],
      ['@prof', '-@prof'],
    ] as const;

    for (const [formula, negated] of cases) {
      expect(negateEffectFormula(formula), formula).toBe(negated);
      expect(negateEffectFormula(negated), negated).toBe(formula);
    }

    // Недописанная формула не прыгает, пока её набирают
    expect(negateEffectFormula(negateEffectFormula('1к4+'))).toBe('1к4+');
  });

  it('«Добавить» с минусом показывается как «Вычесть» без минуса', () => {
    const subtractChange = { mode: 'add', value: '-1к4' } as const;

    expect(getEffectChangeModeChoice(subtractChange)).toBe(
      SUBTRACT_MODE_CHOICE,
    );

    expect(getEffectChangeShownValue(subtractChange)).toBe('1к4');

    // Минус у другого режима — просто значение
    const overrideChange = { mode: 'override', value: '-2' } as const;

    expect(getEffectChangeModeChoice(overrideChange)).toBe('override');
    expect(getEffectChangeShownValue(overrideChange)).toBe('-2');
  });

  it('смена режима сохраняет число, которое видел автор; в данных — `add`', () => {
    const addChange = { mode: 'add', value: '1к4+2' } as const;

    const subtractChange = applyEffectChangeModeChoice(
      addChange,
      SUBTRACT_MODE_CHOICE,
    );

    expect(subtractChange).toEqual({ mode: 'add', value: '-1к4-2' });

    expect(applyEffectChangeModeChoice(subtractChange, 'add')).toEqual(
      addChange,
    );

    expect(applyEffectChangeModeChoice(subtractChange, 'multiply')).toEqual({
      mode: 'multiply',
      value: '1к4+2',
    });
  });

  it('поле «Вычесть» пишется с минусом и не теряет режим, пока пустое', () => {
    const subtractChange = { mode: 'add', value: '-1к4' } as const;

    expect(toStoredEffectChangeValue(subtractChange, '2')).toBe('-2');

    const emptiedChange = {
      mode: 'add',
      value: toStoredEffectChangeValue(subtractChange, ''),
    } as const;

    expect(getEffectChangeModeChoice(emptiedChange)).toBe(SUBTRACT_MODE_CHOICE);
    expect(getEffectChangeShownValue(emptiedChange)).toBe('');
  });

  it('«Вычесть» стоит в выборе режима, а сводка читает минус кости', () => {
    expect(EFFECT_CHANGE_MODE_OPTIONS.map((option) => option.value)).toContain(
      SUBTRACT_MODE_CHOICE,
    );

    expect(
      describeEffectChange({
        key: 'skill.perception',
        mode: 'add',
        value: '-1к4',
        priority: 20,
      }),
    ).toContain('−1к4');
  });
});

describe('кость в значении строки', () => {
  it('катается у атак, спасбросков, проверок, навыков и урона', () => {
    for (const changeKey of [
      'attack.melee',
      'save.dexterity',
      'save.concentration',
      'skill.perception',
      ABILITY_CHECK_KEY,
      'deathSave',
      'attacksAgainst',
      'damage.all',
    ]) {
      expect(isRollTimeDiceKey(changeKey), changeKey).toBe(true);
    }
  });

  it('у Класса доспеха, скорости и инициативы её никто не бросит', () => {
    for (const changeKey of ['armorClass', 'movement.walk', 'initiative']) {
      expect(isRollTimeDiceKey(changeKey), changeKey).toBe(false);
    }
  });

  it('кость у ключа без броска и в режиме не «Добавить» — ошибка', () => {
    expect(
      describeEffectChangeValueError({
        key: 'armorClass',
        mode: 'add',
        value: '1к4',
      }),
    ).toBe(ACTIVE_EFFECT_LABELS.changeDiceNotRolledError);

    expect(
      describeEffectChangeValueError({
        key: 'attack.melee',
        mode: 'override',
        value: '1к4',
      }),
    ).toBe(ACTIVE_EFFECT_LABELS.changeDiceModeError);

    // «Вычесть» в данных — `add` с минусом: кость в нём законна
    const subtractDice = {
      key: 'skill.perception',
      mode: 'add',
      value: '-1к4',
    } as const;

    expect(describeEffectChangeValueError(subtractDice)).toBeUndefined();
    expect(isRollDiceEffectChange(subtractDice)).toBe(true);

    // У урона кость — часть урона, а не кость к броску
    expect(
      isRollDiceEffectChange({ key: 'damage.all', mode: 'add', value: '1к6' }),
    ).toBe(false);

    expect(
      describeEffectChangeValueError({
        key: 'armorClass',
        mode: 'add',
        value: '',
      }),
    ).toBe(ACTIVE_EFFECT_LABELS.changeValueRequired);
  });

  it('в меню «Готовые» у каждой проверки — число, кость и бонус мастерства', () => {
    const checksGroup = EFFECT_MODIFIER_MENU.find(
      (group) => group.label === CHECKS_GROUP_LABEL,
    );

    const submenus = (checksGroup?.items ?? []).filter(isEffectModifierSubmenu);

    // «Все проверки» первыми, дальше навыки по алфавиту
    expect(submenus[0]?.key).toBe(ABILITY_CHECK_KEY);

    const skillLabels = submenus.slice(1).map((submenu) => submenu.label);

    expect(skillLabels).toEqual(
      [...skillLabels].sort((left, right) => left.localeCompare(right, 'ru')),
    );

    expect(
      submenus.find((submenu) => submenu.key === 'skill.perception')?.options,
    ).toEqual([
      { key: 'skill.perception', label: 'Число', mode: 'add', value: '1' },
      {
        key: 'skill.perception',
        label: 'Кость к броску',
        mode: 'add',
        value: '1к4',
      },
      {
        key: 'skill.perception',
        label: 'Бонус мастерства',
        mode: 'add',
        value: '@prof',
      },
    ]);
  });
});

describe('старая зона «пока внутри» со спасброском', () => {
  const staySaveZone = createEffect({
    effectTarget: 'zone',
    applySave: CONSTITUTION_SAVE,
  });

  it('открывается и сохраняется «при входе»', () => {
    const upgradedEffect = upgradeEffectDraft(staySaveZone, 'spell');

    expect(readEffectAreaTrigger(upgradedEffect)).toBe('enter');

    expect(
      listInertEffectFields(
        upgradedEffect,
        resolveEffectFormLayout('spell', upgradedEffect),
      ),
    ).not.toContain('applySave');

    const [savedEffect] = normalizeActiveEffects([staySaveZone], 'spell');

    expect(savedEffect?.areaTrigger).toBe('enter');
  });

  it('без спасброска и не у зоны остаётся как есть', () => {
    const plainZone = createEffect({ effectTarget: 'zone' });

    expect(upgradeEffectDraft(plainZone, 'spell')).toBe(plainZone);

    const targetEffect = createEffect({
      effectTarget: 'target',
      applySave: CONSTITUTION_SAVE,
    });

    expect(upgradeEffectDraft(targetEffect, 'spell')).toBe(targetEffect);
  });
});

describe('сводка не обещает неработающее', () => {
  it('срабатывание не для этого места в сводку не попадает', () => {
    const workingTrigger = {
      id: 'trigger_turn',
      event: 'turnStart',
      actions: [{ type: 'damage', parts: POISON_DAMAGE }],
    } as const;

    const withWorkingTrigger = createEffect({
      effectTarget: 'zone',
      triggers: [workingTrigger],
    });

    const withInertTrigger = createEffect({
      effectTarget: 'zone',
      triggers: [
        workingTrigger,
        {
          id: 'trigger_attack',
          event: 'attackRoll',
          actions: [{ type: 'removeSelf' }],
        },
      ],
    });

    expect(describeEffectScenario(withInertTrigger, 'spell')).toBe(
      describeEffectScenario(withWorkingTrigger, 'spell'),
    );
  });
});
