import type { EffectChange } from '~active-effects/model';

import { describe, expect, it } from 'vitest';

import {
  ABILITY_CHECK_KEY,
  ACTIVE_EFFECT_LABELS,
  applyEffectChangeModeChoice,
  DEFAULT_EFFECT_CHANGE_PRIORITY,
  describeEffectChange,
  describeEffectChangeValueError,
  describeEffectChangeValueHint,
  describeEffectScenario,
  EFFECT_CHANGE_MODE_OPTIONS,
  EFFECT_MODIFIER_MENU,
  getEffectChangeModeChoice,
  getEffectChangeShownValue,
  getWeaponOverrideValueOptions,
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

import {
  CONSTITUTION_SAVE,
  createEffect,
  POISON_DAMAGE,
  SHILLELAGH_DICE,
  SHILLELAGH_WEAPONS,
} from './fixtures';

/** Подпись раздела проверок в меню «Готовые». */
const CHECKS_GROUP_LABEL = 'Проверки и навыки';

/** Подпись раздела замен свойств оружия в меню «Готовые». */
const WEAPON_GROUP_LABEL = 'Оружие: замены';

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

describe('замены свойств оружия («Дубинка»)', () => {
  /**
   * Строка замены в режиме «Заменить» с условием «Дубинки».
   *
   * @param key ключ замены.
   * @param changeValue значение.
   * @returns строка модификатора.
   */
  function createOverrideChange(
    key: string,
    changeValue: string,
  ): EffectChange {
    return {
      key,
      mode: 'override',
      value: changeValue,
      condition: SHILLELAGH_WEAPONS,
      priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
    };
  }

  it('значения из своего списка без ошибки, чужие — с ошибкой списка', () => {
    for (const [changeKey, changeValue] of [
      ['weapon.attackAbility', 'spell'],
      ['weapon.attackAbility', 'wisdom'],
      ['weapon.damageType', 'force'],
    ] as const) {
      expect(
        describeEffectChangeValueError(
          createOverrideChange(changeKey, changeValue),
        ),
        `${changeKey}: ${changeValue}`,
      ).toBeUndefined();
    }

    for (const [changeKey, changeValue] of [
      ['weapon.attackAbility', 'force'],
      ['weapon.attackAbility', '@mod.wis'],
      ['weapon.damageType', 'spell'],
      ['weapon.damageType', 'wisdom'],
    ] as const) {
      expect(
        describeEffectChangeValueError(
          createOverrideChange(changeKey, changeValue),
        ),
        `${changeKey}: ${changeValue}`,
      ).toBe(ACTIVE_EFFECT_LABELS.changeWeaponOptionError);
    }
  });

  it('кость урона: любая кость, в том числе грань выражением; число — ошибка', () => {
    for (const diceValue of ['1к8', '2d6', SHILLELAGH_DICE]) {
      expect(
        describeEffectChangeValueError(
          createOverrideChange('weapon.damageDice', diceValue),
        ),
        diceValue,
      ).toBeUndefined();
    }

    expect(
      describeEffectChangeValueError(
        createOverrideChange('weapon.damageDice', '8'),
      ),
    ).toBe(ACTIVE_EFFECT_LABELS.changeWeaponDiceError);
  });

  it('список характеристик начинается с заклинательной, у кости списка нет', () => {
    expect(getWeaponOverrideValueOptions('weapon.attackAbility')?.[0]).toEqual({
      value: 'spell',
      label: 'Заклинательная характеристика',
    });

    expect(getWeaponOverrideValueOptions('weapon.damageType')).toContainEqual({
      value: 'force',
      label: 'Силовое поле',
    });

    expect(getWeaponOverrideValueOptions('weapon.damageDice')).toBeUndefined();
    expect(getWeaponOverrideValueOptions('armorClass')).toBeUndefined();
  });

  it('сводка читает значение и условие словами', () => {
    expect(
      describeEffectChange(
        createOverrideChange('weapon.attackAbility', 'spell'),
      ),
    ).toBe(
      'Оружие: характеристика атаки заменить: Заклинательная характеристика '
        + '(только: Оружие: дубинка или боевой посох (Дубинка))',
    );

    expect(
      describeEffectChangeValueHint(
        createOverrideChange('weapon.damageType', 'force'),
      ),
    ).toBe('заменить: Силовое поле');

    const diceHint = describeEffectChangeValueHint(
      createOverrideChange('weapon.damageDice', SHILLELAGH_DICE),
    );

    expect(diceHint).not.toContain('@');
    expect(diceHint).toContain('уровень');
  });

  it('раздел «Оружие: замены» с тремя готовыми строками «Дубинки»', () => {
    const weaponGroup = EFFECT_MODIFIER_MENU.find(
      (group) => group.label === WEAPON_GROUP_LABEL,
    );

    const presets = (weaponGroup?.items ?? []).filter(
      (menuItem) =>
        !isEffectModifierSubmenu(menuItem) && menuItem.condition !== undefined,
    );

    expect(presets).toEqual([
      {
        key: 'weapon.damageDice',
        label: 'Дубинка: кость к8 → 2к6 по уровню',
        mode: 'override',
        value: SHILLELAGH_DICE,
        condition: SHILLELAGH_WEAPONS,
      },
      {
        key: 'weapon.attackAbility',
        label: 'Дубинка: заклинательная характеристика',
        mode: 'override',
        value: 'spell',
        condition: SHILLELAGH_WEAPONS,
      },
      {
        key: 'weapon.damageType',
        label: 'Дубинка: силовой урон',
        mode: 'override',
        value: 'force',
        condition: SHILLELAGH_WEAPONS,
      },
    ]);

    // Простые пункты раздела — «Заменить» со значением по смыслу, а не единица
    const plainItems = (weaponGroup?.items ?? []).filter(
      (menuItem) =>
        !isEffectModifierSubmenu(menuItem) && menuItem.condition === undefined,
    );

    expect(plainItems).toEqual([
      expect.objectContaining({
        key: 'weapon.damageDice',
        mode: 'override',
        value: '1к8',
      }),
      expect.objectContaining({
        key: 'weapon.attackAbility',
        mode: 'override',
        value: 'spell',
      }),
      expect.objectContaining({
        key: 'weapon.damageType',
        mode: 'override',
        value: 'force',
      }),
    ]);
  });

  it('«открыл и сохранил» не трогает слова вместо формулы', () => {
    const changes = [
      createOverrideChange('weapon.damageDice', SHILLELAGH_DICE),
      createOverrideChange('weapon.attackAbility', 'spell'),
      createOverrideChange('weapon.damageType', 'force'),
    ];

    const [savedEffect] = normalizeActiveEffects(
      [createEffect({ effectTarget: 'self', changes })],
      'spell',
    );

    expect(savedEffect?.changes).toEqual(changes);
  });
});
