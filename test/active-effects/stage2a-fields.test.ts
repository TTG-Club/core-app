import type {
  ActiveEffect,
  EffectFormContext,
  EffectTrigger,
} from '~active-effects/model';

import { describe, expect, it } from 'vitest';

import {
  createDefaultEscape,
  createEffectPrice,
  describeEffectChangeCondition,
  describeEffectChangeValueError,
  describeEffectDuration,
  describeEffectPay,
  describeEffectScenario,
  describeEffectTrigger,
  describeSaveAbilities,
  describeTriggerCondition,
  durationAcceptsCurrentTurn,
  EFFECT_FLAG_LABELS,
  EFFECT_TARGET_KEY_SUGGESTIONS,
  formatEffectSaveDc,
  getChangeValueOptions,
  isChoiceKey,
  isTriggerConditionText,
  labelFormulaVariables,
  listEffectListTriggers,
  listInertEffectFields,
  listTriggerConditionKinds,
  normalizeActiveEffects,
  normalizeAltAbilities,
  normalizeDraftCastRule,
  normalizeDraftPay,
  normalizeLoadedActiveEffects,
  parseCreatureTypeCondition,
  readTriggerConditionParts,
  renderReadableFormula,
  resolveEffectFormLayout,
  triggerAsksPermission,
  triggerEventAcceptsApplier,
  triggerEventAcceptsArea,
  validateFormula,
  writeCreatureTypeCondition,
  writeEffectTriggers,
  writeTriggerCondition,
  writeTriggerEvent,
} from '~active-effects/model';

import {
  CONSTITUTION_SAVE,
  createEffect,
  createRawEffect,
  POISON_DAMAGE,
  resolveLayoutFor,
  SAVE_DC,
  stripUndefinedKeys,
} from './fixtures';

/** Ключ выбора владельца: «Гримуар монстров». */
const CHOICE_KEY = 'monster-manual';

/** Условие «цель — тип из выбора владельца». */
const CHOSEN_TARGET_TYPE = `target.creatureType === "@choice.${CHOICE_KEY}"`;

/** Условие «спасбросок от заклинания школы Воплощения или Некромантии». */
const SCHOOL_SAVE_SOURCE = 'source.spellSchool === "evocation, necromancy"';

/** Ключ счётчика листа в цене. */
const COUNTER_KEY = 'grit';

/** Формула урона «Мистической кары»: кости по кругу потраченной ячейки. */
const SMITE_FORMULA = '(1 + @paid.slotLevel)к8@dmg.force';

/** Своя Сл навыка «вырваться»: у Акробатики — отдельная. */
const ACROBATICS_DC = 12;

/** Размер области применения, фт. */
const USE_AREA_SIZE = 30;

/** Ширина линии области применения, фт. */
const USE_AREA_WIDTH = 5;

/** Размер шаблона получателей кнопки «При действии», фт. */
const TEMPLATE_SIZE = 15;

/** Расстояние перемещения в действии срабатывания, фт. */
const MOVE_DISTANCE = 10;

/** Круг рассеивания числом — запасной при формуле. */
const DISPEL_LEVEL = 3;

/** Шанс провала каста, %: «Замедление». */
const CAST_FAIL_CHANCE = 25;

/** Лимит круга ячейки: «не может использовать ячейки 7-го круга и выше». */
const MAX_SLOT_LEVEL = 6;

/** Потраченное ценой — проставляет VTTG, редактор его только хранит. */
const PAID_NUMBERS = {
  counter: 1,
  hitDice: 2,
  hitDie: 8,
  hitDiceRoll: 9,
  slotLevel: 3,
  itemUses: 1,
} as const;

/** Срабатывание кнопки «При действии» со всеми новыми полями действий. */
const STAGE_2A_TRIGGER = {
  id: 'trigger_probe',
  event: 'activate',
  cost: 'action',
  recipient: 'area',
  ask: true,
  condition: 'self.hp.max <= 50',
  limit: { max: 1, per: 'turn' },
  pay: [{ kind: 'inspiration' }],
  area: { radius: 0, template: { shape: 'cone', size: TEMPLATE_SIZE } },
  save: { ability: 'dexterity', dc: 0, altAbilities: ['wisdom'] },
  actions: [
    {
      type: 'damage',
      parts: [
        {
          formula: '@paid.hitDiceRoll * even(@paid.hitDiceRoll)@dmg.event',
          target: 'selected',
        },
      ],
      halfOnSave: true,
    },
    { type: 'move', kind: 'choose', distance: MOVE_DISTANCE, upTo: true },
    { type: 'dispel', maxLevel: DISPEL_LEVEL, maxLevelFormula: '@castLevel' },
    {
      type: 'restore',
      what: 'counter',
      counter: COUNTER_KEY,
      amount: '1 + @mod.con',
      set: true,
    },
    { type: 'setHp', value: 0, formula: '5 * @paid.slotLevel' },
    {
      type: 'applyCondition',
      conditionKey: 'grappled',
      durationFormula: '@paid.hitDice',
      flags: ['escape.disadvantage'],
      escape: {
        by: 'adjacent',
        check: {
          skill: 'athletics',
          dc: 13,
          skills: [
            { skill: 'athletics' },
            { skill: 'medicine', by: 'adjacent' },
          ],
        },
      },
    },
    { type: 'applyTag', tag: 'probe', durationFormula: '2' },
    {
      type: 'removeCondition',
      conditionKey: 'charmed',
      fromCreatureTypes: ['fey', 'fiend'],
    },
  ],
} as const;

/**
 * Эффект со всеми новыми полями этапа 2A сразу — тот же набор, что записала
 * проба на DEV (`wave2-plan/stage2A/probe/dev-probe-2a.mjs`), в записи, которую
 * понимает VTTG: у «Хиты становятся» есть число, у состояния — `conditionKey`.
 */
const STAGE_2A_EFFECT = {
  id: 'probe-2a',
  name: 'Проба этапа 2A',
  description: 'Проба этапа 2A',
  icon: 'tabler:flask',
  disabled: true,
  origin: 'feature',
  transfer: false,
  effectTarget: 'target',
  stackable: true,
  turnCurrent: true,
  conditionKey: 'restrained',
  duration: { type: 'turn', turnAnchor: 'carrier', turnTiming: 'end' },
  activation: {
    mode: 'use',
    cost: 'action',
    range: 30,
    concentration: true,
    area: { shape: 'ray', size: USE_AREA_SIZE, width: USE_AREA_WIDTH },
  },
  pay: [
    { kind: 'hitDice', amount: '1', max: '2' },
    { kind: 'counter', counter: COUNTER_KEY, amount: '@castLevel' },
    { kind: 'spellSlot', minLevel: 1, maxLevel: 5, pact: true },
    { kind: 'itemUses', amount: '0' },
  ],
  paid: PAID_NUMBERS,
  castRule: {
    maxSlotLevel: MAX_SLOT_LEVEL,
    minSlotLevel: 1,
    failChance: CAST_FAIL_CHANCE,
    failComponent: 'somatic',
    failLosesSlot: true,
    failSave: { ability: 'constitution', dc: 0, dcFormula: '10 + @prof' },
  },
  flags: [
    'actions.oneOfMoveActionBonus',
    'actions.oneAttackPerAction',
    'actions.noOpportunityAttack',
    'spellcasting.noMagicAction',
    'spellcasting.noSchool.evocation',
    'hitDice.maximize',
    'escape.advantage.grappled',
    'defense.suppressResistances',
    'damage.concentrationDisadvantage',
  ],
  changes: [
    {
      key: 'spell.damageType',
      mode: 'override',
      value: 'psychic',
      priority: 20,
    },
    {
      key: 'tempHp.gain',
      mode: 'add',
      value: '@hp.temp + @tag.pressure',
      priority: 20,
    },
    {
      key: 'creatureType.extra',
      mode: 'override',
      value: 'fiend',
      condition: 'target.isSource === true',
      priority: 20,
    },
  ],
  rollCondition: SCHOOL_SAVE_SOURCE,
  conditionImmunities: ['frightened'],
  variant: { group: 'probe', label: 'А', pick: 'multi' },
  applySave: {
    ability: 'dexterity',
    altAbilities: ['strength', 'constitution'],
    dc: 10,
    dcFormula: '8 + @mod.feat + @prof',
    dcSkill: 'athletics',
    onSuccess: 'half',
  },
  damageParts: [{ formula: SMITE_FORMULA, target: 'selected' }],
  escape: {
    by: 'any',
    cost: 'action',
    check: {
      skill: 'athletics',
      dc: 14,
      skills: [
        { skill: 'athletics' },
        { skill: 'acrobatics', by: 'self', dc: ACROBATICS_DC, label: 'Ловко' },
      ],
      mode: 'disadvantage',
    },
    onSuccess: 'removeCondition',
    onSuccessApply: 'prone',
    onFailDamage: [{ formula: '1', type: 'piercing' }],
  },
  triggers: [STAGE_2A_TRIGGER],
} as const;

/** Место формы пробы: применяемое умение на цели — там работают все поля. */
const PROBE_CONTEXT: EffectFormContext = 'feature';

/**
 * Эффект, сохранённый формой, как его увидит сервер.
 *
 * @param effect эффект из формы.
 * @param context место формы.
 * @returns данные эффекта.
 */
function saveEffect(effect: ActiveEffect, context: EffectFormContext): unknown {
  return stripUndefinedKeys(normalizeActiveEffects([effect], context)[0]);
}

/**
 * Эффект по кругу редактора: разбор ответа сервера, сохранение формой и снова
 * разбор.
 *
 * @param rawEffect эффект, как его отдал сервер.
 * @param context место формы.
 * @returns данные эффекта после сохранения.
 */
function roundTripRawEffect(
  rawEffect: unknown,
  context: EffectFormContext,
): unknown {
  const [loadedEffect] = normalizeLoadedActiveEffects([rawEffect]);

  return loadedEffect ? saveEffect(loadedEffect, context) : undefined;
}

/**
 * Пути значений, которых в сохранённых данных не стало или которые изменились.
 *
 * @param expectedValue что должно сохраниться.
 * @param savedValue что сохранилось.
 * @param path путь до значения.
 * @returns пути потерь.
 */
function findLostPaths(
  expectedValue: unknown,
  savedValue: unknown,
  path = '',
): string[] {
  if (Array.isArray(expectedValue)) {
    return Array.isArray(savedValue)
      ? expectedValue.flatMap((expectedItem, index) =>
          findLostPaths(expectedItem, savedValue[index], `${path}[${index}]`),
        )
      : [path];
  }

  if (typeof expectedValue === 'object' && expectedValue !== null) {
    if (typeof savedValue !== 'object' || savedValue === null) {
      return [path];
    }

    const savedFields = new Map(Object.entries(savedValue));

    return Object.entries(expectedValue).flatMap(([field, fieldValue]) =>
      findLostPaths(fieldValue, savedFields.get(field), `${path}.${field}`),
    );
  }

  return expectedValue === savedValue ? [] : [path];
}

/**
 * Первый эффект списка после разбора; тест падает, если разбор его выбросил.
 *
 * @param rawEffect эффект, как его отдал сервер.
 * @returns разобранный эффект.
 */
function loadEffect(rawEffect: unknown): ActiveEffect {
  const [loadedEffect] = normalizeLoadedActiveEffects([rawEffect]);

  if (!loadedEffect) {
    throw new Error('эффект не разобрался');
  }

  return loadedEffect;
}

/**
 * Фраза срабатывания для сводки с обычной подписью Сл.
 *
 * @param trigger срабатывание.
 * @returns фраза.
 */
function describeTrigger(trigger: EffectTrigger): string {
  return describeEffectTrigger(trigger, { formatDc: formatEffectSaveDc });
}

describe('эффект со всеми полями этапа 2A', () => {
  it('переживает открытие и сохранение без потерь', () => {
    expect(
      findLostPaths(
        STAGE_2A_EFFECT,
        roundTripRawEffect(STAGE_2A_EFFECT, PROBE_CONTEXT),
      ),
    ).toEqual([]);
  });

  it('второе сохранение ничего не меняет', () => {
    const savedOnce = roundTripRawEffect(STAGE_2A_EFFECT, PROBE_CONTEXT);

    expect(roundTripRawEffect(savedOnce, PROBE_CONTEXT)).toEqual(savedOnce);
  });

  it('потраченное ценой (paid) форма не показывает, но и не стирает', () => {
    const loadedEffect = loadEffect(STAGE_2A_EFFECT);

    expect(loadedEffect.paid).toEqual(PAID_NUMBERS);

    // Правка любого другого поля потраченное не трогает
    expect(
      saveEffect({ ...loadedEffect, name: 'Другое имя' }, PROBE_CONTEXT),
    ).toMatchObject({ paid: PAID_NUMBERS });
  });

  it('все места формы хранят поля, которые в них не работают', () => {
    for (const context of [
      'spell',
      'item',
      'creatureAction',
      'creatureTrait',
    ] as const) {
      const savedEffect = roundTripRawEffect(STAGE_2A_EFFECT, context);

      expect(savedEffect, context).toMatchObject({
        pay: STAGE_2A_EFFECT.pay,
        paid: PAID_NUMBERS,
        castRule: { maxSlotLevel: MAX_SLOT_LEVEL },
        escape: { by: 'any', onSuccessApply: 'prone' },
        stackable: true,
        turnCurrent: true,
      });
    }
  });
});

describe('тип урона токеном события', () => {
  it('тип, записанный токеном события, переносится в формулу без второй приставки', () => {
    const [loadedEffect] = normalizeLoadedActiveEffects([
      {
        id: 'effect-event-type',
        name: 'Отражение',
        description: '',
        disabled: false,
        origin: 'feature',
        transfer: true,
        duration: { type: 'permanent' },
        changes: [],
        flags: [],
        triggers: [
          {
            id: 'trigger-event-type',
            event: 'damageTaken',
            actions: [
              {
                type: 'damage',
                parts: [{ formula: '2к12', type: '@dmg.event' }],
              },
            ],
          },
        ],
      },
    ]);

    expect(loadedEffect?.triggers?.[0]?.actions[0]).toMatchObject({
      parts: [{ formula: '2к12@dmg.event' }],
    });
  });
});

describe('цена ресурсом (pay)', () => {
  it('пустые формулы и платёж без ключа счётчика не пишутся', () => {
    expect(
      normalizeDraftPay([
        { kind: 'counter', counter: '  ', amount: '2' },
        {
          kind: 'counter',
          counter: ` ${COUNTER_KEY} `,
          amount: ' 6 ',
          max: '',
        },
        { kind: 'hitDice', amount: '', max: ' @castLevel ' },
        { kind: 'spellSlot', minLevel: 4 },
      ]),
    ).toEqual([
      { kind: 'counter', counter: COUNTER_KEY, amount: '6', max: undefined },
      { kind: 'hitDice', amount: undefined, max: '@castLevel' },
      { kind: 'spellSlot', minLevel: 4 },
    ]);

    expect(normalizeDraftPay([])).toBeUndefined();
    expect(normalizeDraftPay(undefined)).toBeUndefined();
  });

  it('пустая цена в данные не уходит', () => {
    expect(
      saveEffect(
        createEffect({
          activation: { mode: 'use' },
          pay: [createEffectPrice('counter')],
        }),
        PROBE_CONTEXT,
      ),
    ).not.toHaveProperty('pay');
  });

  it('незнакомый вид платежа выпадает один, число читается формулой', () => {
    const loadedEffect = loadEffect(
      createRawEffect({
        pay: [
          { kind: 'soul' },
          { kind: 'hitDice', amount: 2 },
          { kind: 'counter', counter: '' },
          { kind: 'spellSlot', minLevel: 12, pact: 'yes' },
        ],
      }),
    );

    expect(loadedEffect.pay).toEqual([
      { kind: 'hitDice', amount: '2' },
      { kind: 'spellSlot' },
    ]);
  });

  it('читается словами: платежи через «и»', () => {
    expect(
      describeEffectPay([
        { kind: 'hitDice', amount: '1', max: '2' },
        { kind: 'counter', counter: COUNTER_KEY, amount: '6' },
      ]),
    ).toBe(`1–2 кости хитов и 6 «${COUNTER_KEY}»`);

    expect(describeEffectPay([{ kind: 'hitDice' }])).toBe('1 кость хитов');

    expect(describeEffectPay([{ kind: 'itemUses', amount: '5' }])).toBe(
      '5 зарядов',
    );

    expect(
      describeEffectPay([{ kind: 'spellSlot', minLevel: 4, pact: true }]),
    ).toBe('ячейка договора от 4 круга');

    expect(describeEffectPay([{ kind: 'spellSlot' }])).toBe('ячейка');

    expect(describeEffectPay([{ kind: 'inspiration' }])).toBe(
      'героическое вдохновение',
    );

    expect(describeEffectPay(undefined)).toBe('');
  });

  it('есть там, где эффект кто-то запускает: каст, применение, включение', () => {
    expect(resolveLayoutFor('spell').showPay).toBe(true);
    expect(resolveLayoutFor('feature').showPay).toBe(false);
    expect(resolveLayoutFor('creatureTrait').showPay).toBe(false);

    for (const mode of ['use', 'toggle'] as const) {
      expect(
        resolveLayoutFor('feature', { activation: { mode } }).showPay,
        mode,
      ).toBe(true);
    }

    expect(
      resolveLayoutFor('item', { activation: { mode: 'use' } }).showPay,
    ).toBe(true);
  });

  it('у постоянного эффекта — неработающая настройка, но данные остаются', () => {
    const effect = createEffect({ pay: [{ kind: 'hitDice' }] });

    expect(
      listInertEffectFields(effect, resolveEffectFormLayout('feature', effect)),
    ).toEqual(['pay']);

    expect(saveEffect(effect, 'feature')).toMatchObject({
      pay: [{ kind: 'hitDice' }],
    });
  });

  it('срабатывание с ценой спрашивает владельца и не сворачивается в старое поле', () => {
    const paidTrigger: EffectTrigger = {
      id: 'trigger_paid',
      event: 'turnStart',
      pay: [{ kind: 'spellSlot' }],
      actions: [{ type: 'damage', parts: POISON_DAMAGE }],
    };

    expect(triggerAsksPermission(paidTrigger)).toBe(true);

    const writtenEffect = writeEffectTriggers(createEffect(), [paidTrigger]);

    expect(writtenEffect.recurringDamage).toBeUndefined();
    expect(writtenEffect.triggers).toEqual([paidTrigger]);
  });

  it('попадает в сводку эффекта и во фразу срабатывания', () => {
    expect(
      describeEffectScenario(
        createEffect({
          activation: { mode: 'use' },
          pay: [{ kind: 'hitDice' }],
          flags: ['attack.advantage'],
        }),
        'feature',
      ),
    ).toBe(
      'После применения — на применившем, цена: 1 кость хитов: Преимущество на все атаки.',
    );

    expect(
      describeTrigger({
        id: 'trigger_smite',
        event: 'attackRoll',
        role: 'attacker',
        pay: [{ kind: 'spellSlot', pact: true }],
        limit: { max: 1, per: 'turn' },
        actions: [{ type: 'damage', parts: [{ formula: SMITE_FORMULA }] }],
      }),
    ).toBe(
      'после своей атаки: (1 + круг потраченной ячейки)к8 силовой, цена: ячейка договора, не чаще одного раза за ход',
    );
  });
});

describe('«вырваться» по правилам 2024', () => {
  it('первый навык списка пишется и полем skill — для версий без списка', () => {
    const savedEffect = saveEffect(
      createEffect({
        escape: {
          check: {
            skill: 'athletics',
            dc: SAVE_DC,
            skills: [{ skill: 'acrobatics' }, { skill: 'athletics' }],
          },
        },
      }),
      'ownEffects',
    );

    expect(savedEffect).toMatchObject({
      escape: {
        check: {
          skill: 'acrobatics',
          skills: [{ skill: 'acrobatics' }, { skill: 'athletics' }],
        },
      },
    });
  });

  it('список из одного навыка без своих настроек не пишется', () => {
    const savedEffect = saveEffect(
      createEffect({
        escape: {
          check: {
            skill: 'athletics',
            dc: SAVE_DC,
            skills: [{ skill: 'stealth', label: '  ' }],
          },
          onFailDamage: [{ formula: '  ' }],
        },
      }),
      'ownEffects',
    );

    expect(savedEffect).toMatchObject({
      escape: { check: { skill: 'stealth', dc: SAVE_DC } },
    });

    expect(savedEffect).not.toHaveProperty('escape.check.skills');
    expect(savedEffect).not.toHaveProperty('escape.onFailDamage');
  });

  it('один навык со своей Сл остаётся списком', () => {
    expect(
      saveEffect(
        createEffect({
          escape: {
            check: {
              skill: 'athletics',
              dc: SAVE_DC,
              skills: [{ skill: 'sleightOfHand', dc: 20 }],
            },
          },
        }),
        'ownEffects',
      ),
    ).toMatchObject({
      escape: {
        check: {
          skill: 'sleightOfHand',
          skills: [{ skill: 'sleightOfHand', dc: 20 }],
        },
      },
    });
  });

  it('разбор: навык строкой — вариант без настроек, чужой навык выпадает один', () => {
    const loadedEffect = loadEffect(
      createRawEffect({
        escape: {
          by: 'any',
          check: {
            skill: 'athletics',
            dc: SAVE_DC,
            skills: [
              'athletics',
              { skill: 'juggling' },
              { skill: 'acrobatics', dc: 0 },
            ],
            mode: 'sideways',
          },
        },
      }),
    );

    expect(loadedEffect.escape).toEqual({
      by: 'any',
      check: {
        skill: 'athletics',
        dc: SAVE_DC,
        skills: [{ skill: 'athletics' }, { skill: 'acrobatics' }],
      },
    });
  });

  it('урон при провале хранит тип полем, а не токеном формулы', () => {
    const loadedEffect = loadEffect(
      createRawEffect({
        escape: { onFailDamage: [{ formula: '1', type: 'piercing' }] },
      }),
    );

    expect(loadedEffect.escape?.onFailDamage).toEqual([
      { formula: '1', type: 'piercing' },
    ]);
  });

  it('новое действие: действием, Атлетика против Сл источника или своей', () => {
    expect(createDefaultEscape(true)).toEqual({
      cost: 'action',
      check: { skill: 'athletics', dc: 0 },
    });

    expect(createDefaultEscape(false).check?.dc).toBeGreaterThan(0);
  });
});

describe('флаги и ключи этапа 2A', () => {
  it('флаги ограничений, костей хитов и «вырваться» есть в словаре', () => {
    for (const flag of STAGE_2A_EFFECT.flags) {
      expect(EFFECT_FLAG_LABELS[flag], flag).toBeDefined();
    }

    for (const flag of [
      'spellcasting.noSchool.abjuration',
      'spellcasting.noSchool.transmutation',
      'hitDice.lowAsThree',
      'hitDice.firstFree',
      'escape.advantage',
      'escape.disadvantage',
      'escape.disadvantage.grappled',
      'grapple.escapeDisadvantage',
    ]) {
      expect(EFFECT_FLAG_LABELS[flag], flag).toBeDefined();
    }
  });

  it('ключи строк: тип урона заклинаний, временные хиты, досягаемость, второй тип', () => {
    const changeKeys = EFFECT_TARGET_KEY_SUGGESTIONS.map(
      (suggestion) => suggestion.value,
    );

    for (const changeKey of [
      'spell.damageType',
      'tempHp.gain',
      'attack.reach',
      'creatureType.extra',
    ]) {
      expect(changeKeys).toContain(changeKey);
    }
  });

  it('тип урона заклинаний — слово из списка, а не формула', () => {
    expect(getChangeValueOptions('spell.damageType')).toContainEqual(
      expect.objectContaining({ value: 'psychic' }),
    );

    expect(
      describeEffectChangeValueError({
        key: 'spell.damageType',
        mode: 'override',
        value: 'psychic',
      }),
    ).toBeUndefined();

    expect(
      describeEffectChangeValueError({
        key: 'spell.damageType',
        mode: 'override',
        value: '2к6',
      }),
    ).toBeDefined();
  });

  it('формулы: even и odd разбираются и читаются словами', () => {
    expect(
      validateFormula('@paid.hitDiceRoll * odd(@paid.hitDiceRoll)'),
    ).toEqual({ valid: true });

    expect(validateFormula('ceil(@hitDice.left / 2) + @tag.pressure')).toEqual({
      valid: true,
    });

    expect(renderReadableFormula('even(@roll)', (token) => token)).toBe(
      '(1, если @roll чётное, иначе 0)',
    );
  });

  it('токены потраченного читаются словами', () => {
    expect(labelFormulaVariables('5 * @paid.slotLevel')).toBe(
      '5 * круг потраченной ячейки',
    );

    expect(labelFormulaVariables('@hp.temp + @tag.pressure')).toBe(
      'текущие временные хиты + @tag.pressure',
    );
  });
});

describe('правило каста (castRule)', () => {
  it('пустое правило и поля без провала не пишутся', () => {
    expect(normalizeDraftCastRule({})).toBeUndefined();
    expect(normalizeDraftCastRule(undefined)).toBeUndefined();

    expect(
      normalizeDraftCastRule({ failComponent: 'verbal', failLosesSlot: true }),
    ).toBeUndefined();

    expect(
      stripUndefinedKeys(
        normalizeDraftCastRule({
          maxSlotLevel: MAX_SLOT_LEVEL,
          failComponent: 'verbal',
          failLosesSlot: true,
        }),
      ),
    ).toEqual({ maxSlotLevel: MAX_SLOT_LEVEL });
  });

  it('числа держатся в пределах: круг 1–9, шанс 1–100', () => {
    expect(
      stripUndefinedKeys(
        normalizeDraftCastRule({
          maxSlotLevel: 12,
          minSlotLevel: 0,
          failChance: 250,
        }),
      ),
    ).toEqual({ maxSlotLevel: 9, minSlotLevel: 1, failChance: 100 });
  });

  it('разбор: негодное поле выпадает одно, пустое правило — целиком', () => {
    expect(
      loadEffect(
        createRawEffect({
          castRule: {
            maxSlotLevel: '6',
            failChance: 'часто',
            failSave: { ability: 'luck', dc: 0 },
          },
        }),
      ).castRule,
    ).toEqual({ maxSlotLevel: MAX_SLOT_LEVEL });

    expect(
      loadEffect(createRawEffect({ castRule: { failComponent: 'somatic' } })),
    ).not.toHaveProperty('castRule.failComponent');
  });

  it('сл спасброска при попытке каста — не ниже допустимой в месте формы', () => {
    const effect = createEffect({
      castRule: { failSave: { ability: 'constitution', dc: 0 } },
    });

    // У заклинания 0 — Сл заклинателя; у черты существа источника нет
    expect(saveEffect(effect, 'spell')).toMatchObject({
      castRule: { failSave: { dc: 0 } },
    });

    expect(saveEffect(effect, 'creatureTrait')).toMatchObject({
      castRule: { failSave: { dc: 1 } },
    });
  });
});

describe('условия этапа 2A', () => {
  it('тип существа из выбора владельца разбирается и собирается обратно', () => {
    const parsedCondition = parseCreatureTypeCondition(CHOSEN_TARGET_TYPE);

    expect(parsedCondition).toEqual({
      subject: 'target.creatureType',
      condition: { types: [], negate: false, choiceKey: CHOICE_KEY },
    });

    expect(
      writeCreatureTypeCondition('target.creatureType', {
        types: [],
        negate: false,
        choiceKey: CHOICE_KEY,
      }),
    ).toBe(CHOSEN_TARGET_TYPE);

    expect(describeEffectChangeCondition(CHOSEN_TARGET_TYPE)).toBe(
      `Цель — тип из выбора владельца (${CHOICE_KEY})`,
    );
  });

  it('ключ выбора — латиница, цифры и «-_#:»', () => {
    expect(isChoiceKey(CHOICE_KEY)).toBe(true);
    expect(isChoiceKey('feat:energy#1')).toBe(true);
    expect(isChoiceKey('гримуар')).toBe(false);
    expect(isChoiceKey('two words')).toBe(false);
    expect(isChoiceKey('')).toBe(false);
  });

  it('словарь срабатываний: выбор владельца, вид, максимум хитов, сторона наложившего', () => {
    const condition = [
      `damage.type === "@choice.energy"`,
      CHOSEN_TARGET_TYPE,
      'self.species !== "дварф, дуэргар"',
      'target.species === "эльф"',
      'target.species !== "эльф"',
      'self.hp.max <= 50',
      'target.isSourceSide === true',
    ].join(' && ');

    const parts = readTriggerConditionParts(condition);

    expect(parts).toEqual([
      { kind: 'damageTypeChosen', value: 'energy' },
      { kind: 'otherCreatureTypeChosen', value: CHOICE_KEY },
      { kind: 'selfSpeciesNot', value: 'дварф, дуэргар' },
      { kind: 'otherSpecies', value: 'эльф' },
      { kind: 'otherSpeciesNot', value: 'эльф' },
      { kind: 'selfHpMaxAtMost', value: '50' },
      { kind: 'otherIsSourceSide' },
    ]);

    expect(writeTriggerCondition(parts)).toBe(condition);

    expect(describeTriggerCondition(condition)).toBe(
      'урон типа из выбора владельца (energy)'
        + ` и другая сторона — тип из выбора владельца (${CHOICE_KEY})`
        + ' и вид носителя — не «дварф, дуэргар»'
        + ' и вид другой стороны — «эльф»'
        + ' и вид другой стороны — не «эльф»'
        + ' и максимум хитов носителя не больше 50'
        + ' и другая сторона — наложивший эффект или его союзник',
    );
  });

  it('урон из списка типов читается обычной частью', () => {
    expect(
      readTriggerConditionParts('damage.type === "fire, radiant"'),
    ).toEqual([{ kind: 'damageType', value: 'fire, radiant' }]);

    expect(
      readTriggerConditionParts('damage.type === "fire, glitter"'),
    ).toEqual(['damage.type === "fire, glitter"']);
  });

  it('части о другой стороне есть там, где она известна', () => {
    expect(listTriggerConditionKinds('attackRoll')).toEqual(
      expect.arrayContaining([
        'otherSpecies',
        'otherCreatureTypeChosen',
        'otherIsSourceSide',
        'selfHpMaxAtMost',
      ]),
    );

    expect(listTriggerConditionKinds('turnStart')).not.toContain(
      'otherSpecies',
    );

    expect(listTriggerConditionKinds('damageTaken')).toContain(
      'damageTypeChosen',
    );
  });

  it('значение части из выбора владельца — только годный ключ выбора', () => {
    expect(isTriggerConditionText('damageTypeChosen', CHOICE_KEY)).toBe(true);
    expect(isTriggerConditionText('damageTypeChosen', 'мой выбор')).toBe(false);
    expect(isTriggerConditionText('selfSpeciesNot', 'горный дварф')).toBe(true);
    expect(isTriggerConditionText('selfSpeciesNot', '')).toBe(false);
  });

  it('условия броска: источник спасброска, вид носителя, наложивший', () => {
    expect(describeEffectChangeCondition(SCHOOL_SAVE_SOURCE)).toBe(
      'спасбросок от заклинания школы: воплощение, некромантия',
    );

    expect(
      describeEffectChangeCondition('source.damageType === "fire, radiant"'),
    ).toBe('спасбросок от источника с уроном: огненный, излучением');

    expect(describeEffectChangeCondition('self.species === "Эльф"')).toBe(
      'вид носителя — эльф',
    );

    expect(describeEffectChangeCondition('target.isSource === false')).toBe(
      'Цель — не тот, кто наложил этот эффект («помеха атакам не по вам»)',
    );

    expect(
      describeEffectChangeCondition('incoming.attackerIsSource === false'),
    ).toBe(
      'Защита: атакует не тот, кто наложил этот эффект («все, кроме вас»)',
    );
  });
});

describe('спасбросок: характеристика на выбор и Сл от проверки', () => {
  it('основная характеристика в список «или» не попадает', () => {
    expect(
      normalizeAltAbilities('strength', ['strength', 'dexterity']),
    ).toEqual(['dexterity']);

    expect(normalizeAltAbilities('strength', ['strength'])).toBeUndefined();
    expect(normalizeAltAbilities('strength', [])).toBeUndefined();
  });

  it('разбор: чужая характеристика выпадает одна, пустой список — целиком', () => {
    const loadedEffect = loadEffect(
      createRawEffect({
        effectTarget: 'target',
        applySave: {
          ...CONSTITUTION_SAVE,
          altAbilities: ['luck', 'dexterity'],
          dcSkill: 'juggling',
        },
        triggers: [
          {
            id: 'trigger_save',
            event: 'applied',
            save: { ability: 'wisdom', dc: SAVE_DC, altAbilities: ['luck'] },
            actions: [{ type: 'removeSelf' }],
          },
        ],
      }),
    );

    expect(loadedEffect.applySave).toEqual({
      ...CONSTITUTION_SAVE,
      altAbilities: ['dexterity'],
    });

    expect(loadedEffect.triggers?.[0]?.save).toEqual({
      ability: 'wisdom',
      dc: SAVE_DC,
    });
  });

  it('читается словами: «Сила или Ловкость» и Сл от проверки навыка', () => {
    expect(
      describeSaveAbilities({
        ability: 'strength',
        altAbilities: ['dexterity'],
      }),
    ).toBe('Сила или Ловкость');

    expect(
      describeEffectScenario(
        createEffect({
          activation: { mode: 'use' },
          effectTarget: 'target',
          conditionKey: 'frightened',
          applySave: {
            ability: 'wisdom',
            altAbilities: ['charisma'],
            dc: 10,
            dcSkill: 'intimidation',
            onSuccess: 'negate',
          },
        }),
        'feature',
      ),
    ).toBe(
      'При применении — на выбранной цели: спасбросок Мудрости или Харизмы, Сл 10 (при применении — итог проверки: Запугивание). Провал — «Испуганный». Успех — ничего.',
    );
  });

  it('спасбросок против урона каждый ход не теряет «или» при правке срабатываний', () => {
    const effect = createEffect({
      recurringDamage: {
        damageParts: POISON_DAMAGE,
        timing: 'startOfTurn',
        save: { ...CONSTITUTION_SAVE, altAbilities: ['strength'] },
      },
    });

    const rewrittenEffect = writeEffectTriggers(
      effect,
      listEffectListTriggers(effect),
    );

    expect(rewrittenEffect.recurringDamage?.save).toEqual({
      ...CONSTITUTION_SAVE,
      altAbilities: ['strength'],
    });
  });

  it('повторный спасбросок с «или» остаётся срабатыванием: у старого поля такого нет', () => {
    const repeatedSave: EffectTrigger = {
      id: 'trigger_repeat',
      event: 'turnEnd',
      save: { ability: 'strength', dc: SAVE_DC, altAbilities: ['dexterity'] },
      actions: [{ type: 'removeSelf', on: 'saved' }],
    };

    const writtenEffect = writeEffectTriggers(createEffect(), [repeatedSave]);

    expect(writtenEffect.recurringSave).toBeUndefined();
    expect(writtenEffect.triggers).toEqual([repeatedSave]);
  });
});

describe('применение: трата хода, область, концентрация', () => {
  it('область и концентрация пишутся только у применения, ширина — у линии', () => {
    expect(
      saveEffect(
        createEffect({
          activation: {
            mode: 'toggle',
            cost: 'bonus',
            concentration: true,
            area: { shape: 'cone', size: USE_AREA_SIZE },
          },
        }),
        'feature',
      ),
    ).toMatchObject({ activation: { mode: 'toggle', cost: 'bonus' } });

    const savedUse = saveEffect(
      createEffect({
        activation: {
          mode: 'use',
          area: { shape: 'cone', size: USE_AREA_SIZE, width: USE_AREA_WIDTH },
        },
      }),
      'feature',
    );

    expect(savedUse).toMatchObject({
      activation: { area: { shape: 'cone', size: USE_AREA_SIZE } },
    });

    expect(savedUse).not.toHaveProperty('activation.area.width');
    expect(savedUse).not.toHaveProperty('activation.concentration');
  });

  it('применение с областью может оставить зону на месте шаблона', () => {
    const areaLayout = resolveLayoutFor('feature', {
      activation: {
        mode: 'use',
        area: { shape: 'circle', size: USE_AREA_SIZE },
      },
    });

    expect(areaLayout.deliveryOptions).toContain('zone');

    expect(
      resolveLayoutFor('feature', { activation: { mode: 'use' } })
        .deliveryOptions,
    ).not.toContain('zone');
  });

  it('негодная область выпадает одна, применение остаётся', () => {
    expect(
      loadEffect(
        createRawEffect({
          activation: {
            mode: 'use',
            cost: 'move',
            area: { shape: 'star', size: USE_AREA_SIZE },
            concentration: 'yes',
          },
        }),
      ).activation,
    ).toEqual({ mode: 'use' });
  });

  it('кнопка «При действии» отдаёт действия области и наложившему', () => {
    expect(triggerEventAcceptsArea('activate')).toBe(true);
    expect(triggerEventAcceptsApplier('activate')).toBe(true);
    expect(triggerEventAcceptsArea('turnStart')).toBe(false);
  });

  it('шаблон получателей остаётся только у события «При действии»', () => {
    const spellEffect = createEffect({ effectTarget: 'target' });
    const spellLayout = resolveEffectFormLayout('spell', spellEffect);
    const breathTrigger = loadEffect(STAGE_2A_EFFECT).triggers?.[0];

    expect(breathTrigger?.area?.template).toEqual({
      shape: 'cone',
      size: TEMPLATE_SIZE,
    });

    if (!breathTrigger) {
      throw new Error('срабатывание не разобралось');
    }

    const movedTrigger = writeTriggerEvent(
      breathTrigger,
      'damageTaken',
      spellLayout,
    );

    expect(movedTrigger.area).toEqual({ radius: 0, template: undefined });
  });

  it('вариант «один или несколько» разбирается и сохраняется', () => {
    expect(
      roundTripRawEffect(
        createRawEffect({
          variant: { group: 'types', label: 'Нежить', pick: 'multi' },
        }),
        'spell',
      ),
    ).toMatchObject({
      variant: { group: 'types', label: 'Нежить', pick: 'multi' },
    });
  });
});

describe('срок «до конца текущего хода» и складывание', () => {
  it('фраза срока называет текущий ход', () => {
    const turnEnd = { type: 'turn', turnTiming: 'end' } as const;

    expect(describeEffectDuration(turnEnd, true)).toBe(
      'до конца текущего хода носителя',
    );

    expect(describeEffectDuration(turnEnd)).toBe(
      'до конца следующего хода носителя',
    );

    // У начала хода «текущего» не бывает
    expect(
      describeEffectDuration({ type: 'turn', turnTiming: 'start' }, true),
    ).toBe('до начала следующего хода носителя');
  });

  it('галочка пишется только у срока «до конца хода»', () => {
    expect(durationAcceptsCurrentTurn({ type: 'turn' })).toBe(true);

    expect(
      durationAcceptsCurrentTurn({ type: 'turn', turnTiming: 'start' }),
    ).toBe(false);

    expect(durationAcceptsCurrentTurn({ type: 'rounds', value: 1 })).toBe(
      false,
    );

    const savedRounds = saveEffect(
      createEffect({
        duration: { type: 'rounds', value: 1 },
        turnCurrent: true,
        stackable: true,
      }),
      'ownEffects',
    );

    expect(savedRounds).not.toHaveProperty('turnCurrent');
    expect(savedRounds).toMatchObject({ stackable: true });
  });
});

describe('действия срабатываний этапа 2A', () => {
  it('число «сколько вернуть» из старых данных читается формулой', () => {
    const loadedEffect = loadEffect(
      createRawEffect({
        triggers: [
          {
            id: 'trigger_restore',
            event: 'rest',
            actions: [
              {
                type: 'restore',
                what: 'counter',
                counter: COUNTER_KEY,
                amount: 2,
              },
            ],
          },
        ],
      }),
    );

    expect(loadedEffect.triggers?.[0]?.actions[0]).toEqual({
      type: 'restore',
      what: 'counter',
      counter: COUNTER_KEY,
      amount: '2',
    });
  });

  it('незнакомый тип существа у «снять состояние» выпадает один', () => {
    const loadedEffect = loadEffect(
      createRawEffect({
        triggers: [
          {
            id: 'trigger_dispel_evil',
            event: 'applied',
            actions: [
              {
                type: 'removeCondition',
                conditionKey: 'charmed',
                fromCreatureTypes: ['fey', 'robot'],
              },
            ],
          },
        ],
      }),
    );

    expect(loadedEffect.triggers?.[0]?.actions[0]).toMatchObject({
      fromCreatureTypes: ['fey'],
    });
  });

  it('пустые «вырваться» и флаги наложенного состояния не пишутся', () => {
    const savedEffect = saveEffect(
      createEffect({
        effectTarget: 'target',
        triggers: [
          {
            id: 'trigger_grapple',
            event: 'applied',
            actions: [
              {
                type: 'applyCondition',
                conditionKey: 'grappled',
                flags: [],
                durationFormula: '  ',
              },
            ],
          },
        ],
      }),
      'spell',
    );

    expect(savedEffect).not.toHaveProperty('triggers.0.actions.0.flags');
    expect(savedEffect).not.toHaveProperty('triggers.0.actions.0.escape');

    expect(savedEffect).not.toHaveProperty(
      'triggers.0.actions.0.durationFormula',
    );
  });

  it('фразы действий: перемещение на выбор, счётчик, рассеивание, хиты формулой', () => {
    const phrase = describeTrigger({
      id: 'trigger_phrases',
      event: 'applied',
      actions: [
        { type: 'move', kind: 'choose', distance: MOVE_DISTANCE, upTo: true },
        { type: 'move', kind: 'bring', distance: 0 },
        {
          type: 'restore',
          what: 'counter',
          counter: COUNTER_KEY,
          amount: '@paid.slotLevel',
          set: true,
        },
        {
          type: 'restore',
          what: 'counter',
          counter: COUNTER_KEY,
          amount: '2',
        },
        {
          type: 'dispel',
          maxLevel: DISPEL_LEVEL,
          maxLevelFormula: '@castLevel',
        },
        { type: 'setHp', value: 0, formula: '5 * @paid.slotLevel' },
        {
          type: 'removeCondition',
          conditionKey: 'charmed',
          fromCreatureTypes: ['fey', 'fiend'],
        },
      ],
    });

    expect(phrase).toBe(
      [
        'при наложении: отталкивает или притягивает (на выбор применившего) на до 10 фт',
        'переносит вплотную к опоре',
        `«${COUNTER_KEY}» становится круг потраченной ячейки`,
        `возвращается ресурс «${COUNTER_KEY}» ×2`,
        'рассеиваются заклинания до круга круг ячейки',
        'хиты становятся 5 * круг потраченной ячейки',
        'снимается состояние «Очарованный», наложенное существом типа: Фея или Исчадие',
      ].join(', '),
    );
  });
});
