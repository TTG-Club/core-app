import type {
  EffectFormContext,
  EffectFormLayoutOptions,
} from '~active-effects/model';

import { describe, expect, it } from 'vitest';

import {
  APPLIER_SAVE_DC,
  DEFAULT_EFFECT_CHANGE_PRIORITY,
  listInertEffectFields,
  normalizeActiveEffects,
  normalizeLoadedActiveEffects,
  resolveEffectFormLayout,
} from '~active-effects/model';

import { createRawEffect, SAVE_DC, stripUndefinedKeys } from './fixtures';

/**
 * Эффекты каталога сценариев системы dnd5e-2024 (`tests/scenarios`,
 * `docs/EFFECT_SCENARIOS.md`) на сайте: запись переживает круг «открыл и
 * сохранил» без потерь, а в своём месте окна у эффекта нет неработающих полей.
 *
 * Эффекты перенесены литералами — как их собирает тест системы. Где сайт при
 * сохранении пишет запись иначе только умолчанием, эффект записан уже в форме
 * сайта, с комментарием.
 */

/** Сл спасброска срабатывания в сценариях словаря условий. */
const TRIGGER_SAVE_DC = 13;

/** Сл, которую честным броском не пройти: успех бывает только автоматическим. */
const UNBEATABLE_SAVE_DC = 30;

/** Радиус «в пределах 30 футов» у отбора и выбора целей заклинаний, фт. */
const SPELL_AREA_RADIUS = 30;

/** На сколько толкает «Волна грома» и уходит «Облако смерти», фт. */
const SHIFT_DISTANCE_FEET = 10;

/** Шаг пути «Шипастого следа», фт. */
const PATH_STEP_FEET = 10;

/** Заряды «Огненного щита». */
const FIRE_SHIELD_CHARGES = 2;

/** Круг ячейки, которую возвращает «Стихийное извержение». */
const RESTORED_SLOT_LEVEL = 2;

/** До какого круга снимает «Рассеивание магии». */
const DISPEL_MAX_LEVEL = 3;

/** Срок «Вибрирующих жидкостей», раунды. */
const SAVED_ROLL_DURATION_ROUNDS = 3;

/** Сценарий каталога системы: эффект и место окна, где его собирает автор. */
interface EffectScenario {
  /** Номер сценария в каталоге системы. */
  id: string;
  /** Подпись эффекта в проверке. */
  name: string;
  /** Место окна. */
  context: EffectFormContext;
  /** Что ещё влияет на раскладку (область у заклинания). */
  layoutOptions?: EffectFormLayoutOptions;
  /** Эффект, как его хранит сервер. */
  storedEffect: Record<string, unknown>;
}

/**
 * Проверяет эффекты раздела каталога: круг «открыл и сохранил» ничего не
 * теряет, а в своём месте окна нет неработающих полей.
 *
 * @param title название раздела.
 * @param scenarios сценарии раздела.
 */
function describeScenarios(
  title: string,
  scenarios: readonly EffectScenario[],
): void {
  describe(title, () => {
    // Цикл, а не `it.each`: у `it.each` подпись приходит в кавычках и
    // обрезается, а по ней ищут упавший сценарий
    for (const {
      id,
      context,
      layoutOptions,
      name,
      storedEffect,
    } of scenarios) {
      it(`[${id}] «${name}» переживает круг «открыл и сохранил»`, () => {
        const savedEffects = normalizeActiveEffects(
          normalizeLoadedActiveEffects([storedEffect]),
          context,
          layoutOptions,
        );

        expect(stripUndefinedKeys(savedEffects), name).toEqual([storedEffect]);
      });

      it(`[${id}] «${name}»: в месте окна «${context}» нет неработающих полей`, () => {
        const inertFields = normalizeLoadedActiveEffects([storedEffect]).map(
          (effect) =>
            listInertEffectFields(
              effect,
              resolveEffectFormLayout(context, effect, layoutOptions),
            ),
        );

        // Один эффект без неработающих полей: выпавший при загрузке эффект
        // дал бы пустой список и тоже уронил бы проверку
        expect(inertFields, name).toEqual([[]]);
      });
    }
  });
}

describeScenarios('каталог: вопросы человеку', [
  {
    id: 'Q01',
    name: 'Опутывание',
    context: 'spell',
    layoutOptions: { zoneAvailable: false },
    storedEffect: createRawEffect({
      id: 'Опутывание',
      name: 'Опутывание',
      conditionKey: 'restrained',
      escape: {
        by: 'self',
        cost: 'action',
        check: { skill: 'athletics', dc: APPLIER_SAVE_DC },
        onSuccess: 'removeSelf',
      },
    }),
  },
  {
    id: 'Q09',
    name: 'Горение с ценой и вопросом',
    context: 'ownEffects',
    storedEffect: createRawEffect({
      id: 'Горение',
      name: 'Горение',
      triggers: [
        {
          id: 'trigger_tick',
          event: 'turnStart',
          cost: 'bonus',
          ask: true,
          actions: [
            {
              type: 'damage',
              // Тип урона сайт хранит токеном формулы, цель части пишет явно —
              // у системы это поле `type` и умолчание цели
              parts: [{ formula: '3@dmg.fire', target: 'selected' }],
            },
          ],
        },
      ],
    }),
  },
  {
    id: 'Q09',
    name: 'Горение без цены и вопроса',
    context: 'ownEffects',
    // Такое срабатывание система пишет старым полем «урон каждый ход»
    storedEffect: createRawEffect({
      id: 'Горение',
      name: 'Горение',
      recurringDamage: {
        // Тип урона — токеном формулы, цель части — явно
        damageParts: [{ formula: '3@dmg.fire', target: 'selected' }],
        timing: 'startOfTurn',
      },
    }),
  },
  {
    id: 'Q02',
    name: 'Эвардовы чёрные щупальца',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Эвардовы чёрные щупальца',
      name: 'Эвардовы чёрные щупальца',
      triggers: [
        {
          id: 'trigger_crush',
          event: 'turnStart',
          ask: true,
          actions: [
            {
              type: 'damage',
              // Тип урона — токеном формулы, цель части — явно
              parts: [{ formula: '3@dmg.bludgeoning', target: 'selected' }],
            },
          ],
        },
      ],
    }),
  },
  {
    id: 'Q04',
    name: 'Ответный удар',
    context: 'ownEffects',
    storedEffect: createRawEffect({
      id: 'Ответный удар',
      name: 'Ответный удар',
      triggers: [
        {
          id: 'trigger_riposte',
          event: 'turnEnd',
          cost: 'reaction',
          actions: [
            {
              type: 'damage',
              // Тип урона — токеном формулы, цель части — явно
              parts: [{ formula: '3@dmg.slashing', target: 'selected' }],
            },
          ],
        },
      ],
    }),
  },
  {
    id: 'Q05',
    name: 'Принуждение',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Принуждение',
      name: 'Принуждение',
      triggers: [
        {
          id: 'trigger_remind',
          event: 'turnStart',
          actions: [
            {
              type: 'notify',
              text: 'Двигайся в указанную сторону',
              to: 'subject',
            },
          ],
        },
      ],
    }),
  },
  {
    id: 'Q06',
    name: 'Проклятие гибельного старения',
    context: 'ownEffects',
    storedEffect: createRawEffect({
      id: 'Проклятие гибельного старения',
      name: 'Проклятие гибельного старения',
      changes: [
        {
          key: 'ability.strength',
          mode: 'add',
          value: '-2',
          priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
        },
      ],
      stages: [
        {
          label: 'Сила −2',
          changes: [
            {
              key: 'ability.strength',
              mode: 'add',
              value: '-2',
              priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
            },
          ],
          flags: [],
        },
        {
          label: 'Сила −4',
          changes: [
            {
              key: 'ability.strength',
              mode: 'add',
              value: '-4',
              priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
            },
          ],
          flags: [],
        },
      ],
      stageIndex: 0,
    }),
  },
  {
    id: 'Q07',
    name: 'Пылающая сфера на цели',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Пылающая сфера',
      name: 'Пылающая сфера',
      effectTarget: 'target',
      triggers: [
        {
          id: 'trigger_move',
          event: 'activate',
          cost: 'bonus',
          actions: [
            {
              type: 'damage',
              // Тип урона — токеном формулы, цель части — явно
              parts: [{ formula: '4@dmg.fire', target: 'selected' }],
            },
          ],
        },
      ],
    }),
  },
  {
    id: 'Q07',
    name: 'Пылающая сфера на заклинателе',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Пылающая сфера',
      name: 'Пылающая сфера',
      triggers: [
        {
          id: 'trigger_move',
          event: 'activate',
          cost: 'bonus',
          actions: [
            {
              type: 'damage',
              // Тип урона — токеном формулы, цель части — явно
              parts: [{ formula: '4@dmg.fire', target: 'selected' }],
            },
          ],
        },
      ],
    }),
  },
  {
    id: 'Q08',
    name: 'Дверь измерений',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Дверь измерений',
      name: 'Дверь измерений',
      // Каталог: «spell → цель». В тесте системы доставки нет, а спасбросок
      // эффекта на заклинателе в окне не работает
      effectTarget: 'target',
      applySave: {
        ability: 'charisma',
        dc: SAVE_DC,
        onSuccess: 'negate',
        allowWilling: true,
      },
    }),
  },
]);

describeScenarios('каталог: словарь условий', [
  {
    id: 'TC03',
    name: 'Временные хиты, характеристика и вид носителя',
    context: 'ownEffects',
    // В сценарии эффекта нет: части словаря положены в срабатывания, как их
    // перечисляет каталог
    storedEffect: createRawEffect({
      id: 'Условия о носителе',
      name: 'Условия о носителе',
      triggers: [
        {
          id: 'trigger_self_at_least',
          event: 'turnStart',
          condition:
            'self.hp.temp === 0 && self.ability["strength"] >= 13 && self.species === "эльф"',
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
        {
          id: 'trigger_self_at_most',
          event: 'turnEnd',
          condition:
            'self.ability["strength"] <= 12 && self.species === "Дварф"',
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
      ],
    }),
  },
  {
    id: 'TC04',
    name: 'Наложивший, окровавленность и хиты другой стороны',
    context: 'ownEffects',
    // В сценарии эффекта нет: другая сторона есть у события урона
    storedEffect: createRawEffect({
      id: 'Условия о другой стороне',
      name: 'Условия о другой стороне',
      triggers: [
        {
          id: 'trigger_other',
          event: 'damageTaken',
          condition:
            'target.isSource === true && target.hp.value <= (target.hp.max / 2) && target.hp.value <= 10',
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
      ],
    }),
  },
  {
    id: 'TC05',
    name: 'Урон, расстояние и вид атаки из данных события',
    context: 'ownEffects',
    // В сценарии эффекта нет: каждая часть — на событии, где есть её данные
    storedEffect: createRawEffect({
      id: 'Условия о событии',
      name: 'Условия о событии',
      triggers: [
        {
          id: 'trigger_damage',
          event: 'damageTaken',
          condition: 'damage.amount >= 10 && source.distance <= 30',
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
        {
          id: 'trigger_attack',
          event: 'attackRoll',
          condition: 'attack.kind === "melee" && attack.ability === "strength"',
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
      ],
    }),
  },
  {
    id: 'TC07',
    name: 'Жуткий смех Таши с режимом по условию',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Жуткий смех Таши',
      name: 'Жуткий смех Таши',
      triggers: [
        {
          id: 'trigger_save',
          event: 'turnEnd',
          save: {
            ability: 'wisdom',
            dc: TRIGGER_SAVE_DC,
            modeIf: [{ condition: 'self.hp.temp === 0', mode: 'advantage' }],
          },
          actions: [{ type: 'removeSelf' }],
        },
      ],
    }),
  },
  {
    id: 'TC08',
    name: 'Жуткий смех Таши с успехом и провалом по условию',
    context: 'spell',
    // В сценарии спасбросок без эффекта: он положен в срабатывание, как у
    // второго сценария TC08
    storedEffect: createRawEffect({
      id: 'Жуткий смех Таши',
      name: 'Жуткий смех Таши',
      triggers: [
        {
          id: 'trigger_save',
          event: 'turnEnd',
          save: {
            ability: 'wisdom',
            dc: TRIGGER_SAVE_DC,
            autoSuccessIf: 'self.hp.temp === 0',
            autoFailIf: 'self.hp.value <= 20',
          },
          actions: [{ type: 'removeSelf', on: 'saved' }],
        },
      ],
    }),
  },
  {
    id: 'TC08',
    name: 'Жуткий смех Таши с автоматическим успехом',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Жуткий смех Таши',
      name: 'Жуткий смех Таши',
      triggers: [
        {
          id: 'trigger_save',
          event: 'turnEnd',
          save: {
            ability: 'wisdom',
            dc: UNBEATABLE_SAVE_DC,
            autoSuccessIf: 'self.hp.temp === 0',
          },
          actions: [{ type: 'removeSelf', on: 'saved' }],
        },
      ],
    }),
  },
]);

describeScenarios('каталог: действия срабатываний', [
  {
    id: 'A01',
    name: 'Защита от яда',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Защита от яда',
      name: 'Защита от яда',
      triggers: [
        {
          id: 'trigger_main',
          event: 'turnStart',
          actions: [{ type: 'removeCondition', conditionKey: 'poisoned' }],
        },
      ],
    }),
  },
  {
    id: 'A02',
    name: 'Заражение',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Заражение',
      name: 'Заражение',
      triggers: [
        {
          id: 'trigger_main',
          event: 'turnStart',
          actions: [
            { type: 'applyCondition', conditionKey: 'poisoned', locked: true },
          ],
        },
      ],
    }),
  },
  {
    id: 'A02',
    name: 'Снятие',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Снятие',
      name: 'Снятие',
      triggers: [
        {
          id: 'trigger_main',
          event: 'turnStart',
          actions: [{ type: 'removeCondition', conditionKey: 'poisoned' }],
        },
      ],
    }),
  },
  {
    id: 'A03',
    name: 'Слово силы: Исцеление',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Слово силы: Исцеление',
      name: 'Слово силы: Исцеление',
      effectTarget: 'target',
      triggers: [
        {
          id: 'trigger_main',
          event: 'applied',
          actions: [
            { type: 'setHp', value: 0, toMax: true },
            { type: 'removeCondition' },
          ],
        },
      ],
    }),
  },
  {
    id: 'A04',
    name: 'Божественное слово',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Божественное слово',
      name: 'Божественное слово',
      triggers: [
        { id: 'trigger_main', event: 'turnStart', actions: [{ type: 'kill' }] },
      ],
    }),
  },
  {
    id: 'A04',
    name: 'Воскрешение',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Воскрешение',
      name: 'Воскрешение',
      triggers: [
        {
          id: 'trigger_main',
          event: 'turnStart',
          actions: [{ type: 'revive', full: true }],
        },
      ],
    }),
  },
  {
    id: 'A05',
    name: 'Ложная жизнь',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Ложная жизнь',
      name: 'Ложная жизнь',
      triggers: [
        {
          id: 'trigger_main',
          event: 'turnStart',
          actions: [{ type: 'tempHp', amount: '5' }],
        },
      ],
    }),
  },
  {
    id: 'A05',
    name: 'Расход щита',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Расход щита',
      name: 'Расход щита',
      triggers: [
        {
          id: 'trigger_main',
          event: 'turnStart',
          actions: [{ type: 'tempHp', amount: '3', mode: 'spend' }],
        },
      ],
    }),
  },
  {
    id: 'A06',
    name: 'Рассеивание магии',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Рассеивание магии',
      name: 'Рассеивание магии',
      triggers: [
        {
          id: 'trigger_main',
          event: 'turnStart',
          actions: [{ type: 'dispel', maxLevel: DISPEL_MAX_LEVEL }],
        },
      ],
    }),
  },
  {
    id: 'A07',
    name: 'Вернуть ячейку',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Вернуть ячейку',
      name: 'Вернуть ячейку',
      triggers: [
        {
          id: 'trigger_main',
          event: 'turnStart',
          actions: [
            {
              type: 'restore',
              what: 'spellSlot',
              level: RESTORED_SLOT_LEVEL,
            },
          ],
        },
      ],
    }),
  },
  {
    id: 'A07',
    name: 'Вернуть ресурс',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Вернуть ресурс',
      name: 'Вернуть ресурс',
      triggers: [
        {
          id: 'trigger_main',
          event: 'turnStart',
          actions: [{ type: 'restore', what: 'counter', counter: 'rage' }],
        },
      ],
    }),
  },
  {
    id: 'A08',
    name: 'Совершенство',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Совершенство',
      name: 'Совершенство',
      triggers: [
        {
          id: 'trigger_main',
          event: 'turnStart',
          actions: [{ type: 'grantInspiration' }, { type: 'dropHeld' }],
        },
      ],
    }),
  },
  {
    id: 'A09',
    name: 'Изгоняющая кара',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Изгоняющая кара',
      name: 'Изгоняющая кара',
      triggers: [
        {
          id: 'trigger_main',
          event: 'turnStart',
          actions: [{ type: 'endCast', whose: 'recipient' }],
        },
      ],
    }),
  },
  {
    id: 'A10',
    name: 'Сглаз',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Сглаз',
      name: 'Сглаз',
      triggers: [
        {
          id: 'trigger_main',
          event: 'turnStart',
          actions: [
            { type: 'grantInspiration', on: 'saved' },
            { type: 'kill', on: 'failed' },
          ],
        },
      ],
    }),
  },
  {
    id: 'A11',
    name: 'Свобода перемещения',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Свобода перемещения',
      name: 'Свобода перемещения',
      suppressConditions: ['restrained'],
    }),
  },
  {
    id: 'A12',
    name: 'Волна грома',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Волна грома',
      name: 'Волна грома',
      triggers: [
        {
          id: 'trigger_main',
          event: 'turnStart',
          actions: [
            { type: 'move', kind: 'push', distance: SHIFT_DISTANCE_FEET },
          ],
        },
      ],
    }),
  },
]);

describeScenarios('каталог: ключи и флаги', [
  {
    id: 'K01',
    name: 'Иссушение',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Иссушение',
      name: 'Иссушение',
      triggers: [
        {
          id: 'trigger_drain',
          event: 'turnStart',
          actions: [{ type: 'reduceMaxHp', amount: '5' }],
        },
      ],
    }),
  },
  {
    id: 'K01',
    name: 'Аура жизни',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Аура жизни',
      name: 'Аура жизни',
      flags: ['hitPoints.maxReductionBlocked'],
    }),
  },
  {
    id: 'K02',
    name: 'Парализованный',
    context: 'condition',
    storedEffect: createRawEffect({
      id: 'Парализованный',
      name: 'Парализованный',
      flags: ['attacksAgainst.forceCritical'],
    }),
  },
  {
    id: 'K02',
    name: 'Адамантиновая броня',
    context: 'item',
    storedEffect: createRawEffect({
      id: 'Адамантиновая броня',
      name: 'Адамантиновая броня',
      flags: ['defense.critImmunity'],
    }),
  },
  {
    id: 'K03',
    name: 'Изгоняющая кара',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Изгоняющая кара',
      name: 'Изгоняющая кара',
      flags: ['defense.suppressAll'],
    }),
  },
  {
    id: 'K04',
    name: 'Цепи Белета',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Цепи Белета',
      name: 'Цепи Белета',
      flags: ['movement.teleportBlocked'],
    }),
  },
  {
    id: 'K05',
    name: 'Проклятие бессонницы',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Проклятие бессонницы',
      name: 'Проклятие бессонницы',
      flags: ['rest.noBenefit.long'],
    }),
  },
  {
    id: 'K06',
    name: 'Метка охотника',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Метка охотника',
      name: 'Метка охотника',
      changes: [
        {
          key: 'damage.all',
          mode: 'add',
          value: '1d6',
          priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
        },
      ],
    }),
  },
  {
    id: 'K06',
    name: 'Только рукопашный',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Только рукопашный',
      name: 'Только рукопашный',
      changes: [
        {
          key: 'damage.melee',
          mode: 'add',
          value: '1d4',
          priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
        },
      ],
    }),
  },
  {
    id: 'K07',
    name: 'Обращение в зверя',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Обращение в зверя',
      name: 'Обращение в зверя',
      changes: [
        {
          key: 'creatureType',
          mode: 'add',
          value: 'beast',
          priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
        },
      ],
    }),
  },
]);

describeScenarios('каталог: значения формулой', [
  {
    id: 'V01',
    name: 'Вибрирующие жидкости',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Вибрирующие жидкости',
      name: 'Вибрирующие жидкости',
      savedRoll: '2к6',
      duration: { type: 'rounds', value: SAVED_ROLL_DURATION_ROUNDS },
      changes: [
        {
          key: 'armorClass',
          mode: 'add',
          value: '-@roll',
          priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
        },
      ],
      recurringDamage: {
        // Тип урона — токеном формулы, цель части — явно
        damageParts: [{ formula: '@roll@dmg.thunder', target: 'selected' }],
        timing: 'startOfTurn',
      },
    }),
  },
  {
    id: 'V04',
    name: 'Замешательство',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Замешательство',
      name: 'Замешательство',
      durationFormula: '1к4',
      duration: { type: 'rounds' },
    }),
  },
  {
    id: 'V08',
    name: 'Огненный щит',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Огненный щит',
      name: 'Огненный щит',
      charges: { max: FIRE_SHIELD_CHARGES, current: FIRE_SHIELD_CHARGES },
      triggers: [
        {
          id: 'trigger_burn',
          // В тесте системы событие `damaged` — такого события нет ни у
          // системы, ни у сайта: разбор записи выбросил бы срабатывание
          event: 'damageTaken',
          actions: [{ type: 'applyTag', tag: 'burned' }],
        },
      ],
    }),
  },
  {
    id: 'V09',
    name: 'Искра',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Искра',
      name: 'Искра',
      charges: { max: 1, current: 1, endsWhenEmpty: true },
      triggers: [
        {
          id: 'trigger_spark',
          // У системы `damaged` — см. «Огненный щит»
          event: 'damageTaken',
          actions: [{ type: 'applyTag', tag: 'sparked' }],
        },
      ],
    }),
  },
  {
    id: 'V11',
    name: 'Нарастающая порча',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Нарастающая порча',
      name: 'Нарастающая порча',
      changes: [
        {
          key: 'abilityCheck',
          mode: 'add',
          value: '-1',
          priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
          step: { by: -1, per: 'turn', until: -5 },
        },
      ],
    }),
  },
  {
    id: 'V19',
    name: 'Доспехи мага',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Доспехи мага',
      name: 'Доспехи мага',
      effectTarget: 'target',
      // Модификатор читается по цели: Ловкость того, на ком доспех
      changes: [
        {
          key: 'armorClass',
          mode: 'override',
          value: '13 + @mod.dex',
          priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
        },
      ],
    }),
  },
  {
    id: 'V19',
    name: 'Лечение числами применившего',
    context: 'item',
    storedEffect: createRawEffect({
      id: 'Лечение',
      name: 'Лечение',
      disabled: true,
      activation: { mode: 'use' },
      effectTarget: 'target',
      triggers: [
        {
          id: 'heal',
          event: 'applied',
          actions: [
            {
              type: 'damage',
              parts: [{ formula: '1к8@heal + @mod.wis', target: 'selected' }],
            },
          ],
        },
      ],
    }),
  },
  {
    id: 'V20',
    name: 'Число костей выражением',
    context: 'item',
    storedEffect: createRawEffect({
      id: 'Кости по ступеням',
      name: 'Кости по ступеням',
      disabled: true,
      activation: { mode: 'use' },
      effectTarget: 'target',
      damageParts: [
        {
          formula: '(1 + steps(@classLevel, 7, 13, 18))к8@dmg.fire',
          target: 'selected',
        },
      ],
    }),
  },
]);

describeScenarios('каталог: получатели и отбор', [
  {
    id: 'R01',
    name: 'Маяк надежды',
    context: 'spell',
    // В сценарии эффекта нет: отборы «с носителем» положены в «всем в
    // радиусе» — как у эффекта R03
    storedEffect: createRawEffect({
      id: 'Маяк надежды',
      name: 'Маяк надежды',
      triggers: [
        {
          id: 'trigger_allies_with_self',
          event: 'damageTaken',
          recipient: 'area',
          area: { radius: SPELL_AREA_RADIUS, target: 'alliesWithSelf' },
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
        {
          id: 'trigger_all_with_self',
          event: 'damageTaken',
          recipient: 'area',
          area: { radius: SPELL_AREA_RADIUS, target: 'allWithSelf' },
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
      ],
    }),
  },
  {
    id: 'R04',
    name: 'Прикосновение вампира',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Прикосновение вампира',
      name: 'Прикосновение вампира',
      triggers: [
        {
          id: 'trigger_drain',
          event: 'damageTaken',
          recipient: 'source',
          actions: [{ type: 'tempHp', amount: '5' }],
        },
      ],
    }),
  },
]);

describeScenarios('каталог: события срабатываний', [
  {
    id: 'E01',
    name: 'Печать жизни',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Печать жизни',
      name: 'Печать жизни',
      triggers: [
        {
          id: 'trigger_Печать жизни',
          event: 'healed',
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
      ],
    }),
  },
  {
    id: 'E03',
    name: 'Освобождение от любого состояния',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Освобождение',
      name: 'Освобождение',
      triggers: [
        {
          id: 'trigger_Освобождение',
          event: 'conditionLost',
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
      ],
    }),
  },
  {
    id: 'E03',
    name: 'Освобождение от Опутанности',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Освобождение',
      name: 'Освобождение',
      triggers: [
        {
          id: 'trigger_Освобождение',
          event: 'conditionLost',
          conditionKey: 'restrained',
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
      ],
    }),
  },
  {
    id: 'E04',
    name: 'Кровавая жатва',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Кровавая жатва',
      name: 'Кровавая жатва',
      triggers: [
        {
          id: 'trigger_Кровавая жатва',
          event: 'downedOther',
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
      ],
    }),
  },
  {
    id: 'E06',
    name: 'Шальная искра',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Шальная искра',
      name: 'Шальная искра',
      triggers: [
        {
          id: 'trigger_spark',
          event: 'turnStart',
          chancePercent: 50,
          limit: { max: 1, per: 'turn' },
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
      ],
    }),
  },
  {
    id: 'E07',
    name: 'Атака попала или промахнулась',
    context: 'spell',
    // В сценарии эффекта нет: части условия — у броска атаки, строками
    // `writeTriggerCondition`
    storedEffect: createRawEffect({
      id: 'Попадание и промах',
      name: 'Попадание и промах',
      triggers: [
        {
          id: 'trigger_landed',
          event: 'attackRoll',
          condition: 'attack.landed === true',
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
        {
          id: 'trigger_missed',
          event: 'attackRoll',
          condition: 'attack.landed === false',
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
      ],
    }),
  },
  {
    id: 'E17',
    name: 'Расписание на втором раунде',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Расписание',
      name: 'Расписание',
      triggers: [
        {
          id: 'trigger_Расписание',
          event: 'healed',
          condition: 'combat.round === 2',
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
      ],
    }),
  },
  {
    id: 'E17',
    name: 'Расписание не раньше второго раунда',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Расписание',
      name: 'Расписание',
      triggers: [
        {
          id: 'trigger_Расписание',
          event: 'healed',
          condition: 'combat.round >= 2',
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
      ],
    }),
  },
  {
    id: 'E17',
    name: 'Расписание хода',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Расписание хода',
      name: 'Расписание хода',
      triggers: [
        {
          id: 'trigger_Расписание хода',
          event: 'turnStart',
          condition: 'combat.round === 2',
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
      ],
    }),
  },
  {
    id: 'E17',
    name: 'Расписание действия',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Расписание действия',
      name: 'Расписание действия',
      triggers: [
        {
          id: 'trigger_Расписание действия',
          event: 'activate',
          condition: 'combat.round === 2',
          actions: [{ type: 'applyTag', tag: 'fired' }],
        },
      ],
    }),
  },
  {
    id: 'E09',
    name: 'Громовой клинок',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Громовой клинок',
      name: 'Громовой клинок',
      triggers: [
        {
          id: 'trigger_booming_blade',
          event: 'moved',
          condition: 'move.forced === false',
          actions: [
            {
              type: 'damage',
              // Цель части урона сайт пишет явно — у системы это умолчание
              parts: [{ formula: '1d8@dmg.thunder', target: 'selected' }],
            },
            { type: 'removeSelf' },
          ],
        },
      ],
    }),
  },
  {
    id: 'E09',
    name: 'Шипастый след',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Шипастый след',
      name: 'Шипастый след',
      triggers: [
        {
          id: 'trigger_trail',
          event: 'moved',
          everyFeet: PATH_STEP_FEET,
          actions: [
            {
              type: 'damage',
              // Цель части урона сайт пишет явно — у системы это умолчание
              parts: [{ formula: '1@dmg.piercing', target: 'selected' }],
            },
          ],
        },
      ],
    }),
  },
]);

describeScenarios('каталог: зоны и ауры', [
  {
    id: 'Z15',
    name: 'Аура живучести',
    context: 'spell',
    storedEffect: createRawEffect({
      id: 'Аура живучести',
      name: 'Аура живучести',
      triggers: [
        {
          id: 'trigger_heal',
          event: 'turnStart',
          recipient: 'choice',
          choice: { radius: SPELL_AREA_RADIUS, target: 'allies', count: 1 },
          actions: [
            {
              type: 'damage',
              // Цель части урона сайт пишет явно — у системы это умолчание
              parts: [{ formula: '5@heal', target: 'selected' }],
            },
          ],
        },
      ],
    }),
  },
  {
    id: 'Z17',
    name: 'Паутина',
    context: 'zone',
    storedEffect: createRawEffect({
      id: 'Паутина',
      name: 'Паутина',
      areaTrigger: 'enter',
      triggers: [
        {
          id: 'trigger_web',
          event: 'enter',
          actions: [
            {
              type: 'applyCondition',
              conditionKey: 'restrained',
              endsOnExit: true,
            },
          ],
        },
      ],
    }),
  },
  {
    id: 'Z18',
    name: 'Облако смерти',
    context: 'spell',
    // `castId` из теста системы не переносится: его проставляет VTTG при
    // касте, а сайт такого поля не хранит
    storedEffect: createRawEffect({
      id: 'Облако смерти',
      name: 'Облако смерти',
      triggers: [
        {
          id: 'trigger_cloudkill_drift',
          event: 'turnStart',
          actions: [
            { type: 'moveArea', kind: 'away', distance: SHIFT_DISTANCE_FEET },
          ],
        },
      ],
    }),
  },
  {
    id: 'Z18',
    name: 'Тьма',
    context: 'spell',
    // `castId` — см. «Облако смерти»
    storedEffect: createRawEffect({
      id: 'Тьма',
      name: 'Тьма',
      triggers: [
        {
          id: 'trigger_darkness_follow',
          event: 'moved',
          actions: [{ type: 'moveArea', kind: 'follow' }],
        },
      ],
    }),
  },
]);

describeScenarios('каталог: магические предметы и оружие', [
  {
    id: 'W01b',
    name: 'Магическое оружие',
    context: 'weapon',
    storedEffect: createRawEffect({
      id: 'Магическое оружие',
      name: 'Магическое оружие',
      changes: [
        {
          key: 'damage.weapon',
          mode: 'add',
          value: '1d4@dmg.force',
          priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
        },
        {
          key: 'attack.weapon',
          mode: 'add',
          value: '1',
          priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
        },
      ],
    }),
  },
]);

/** Дальность «Божественной искры», фт. */
const DIVINE_SPARK_RANGE = 30;

/** Лечение и урон «Божественной искры»: лишняя к8 на 7, 13 и 18 уровнях. */
const DIVINE_SPARK_DICE = '(1 + steps(@classLevel, 7, 13, 18))к8';

/**
 * Вариант «Божественной искры» жреца (F19) в форме хранения сайта: срок у
 * системы «мгновенный» — такого срока у сайта нет, копия снимает себя сама.
 *
 * @param label подпись варианта.
 * @param overrides поля варианта.
 * @returns эффект, как его хранит сервер.
 */
function createDivineSpark(
  label: string,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  return createRawEffect({
    id: `Божественная искра: ${label}`,
    name: label,
    origin: 'feature',
    disabled: true,
    activation: {
      mode: 'use',
      counter: 'channel-divinity',
      range: DIVINE_SPARK_RANGE,
    },
    variant: { group: 'Божественная искра', label },
    effectTarget: 'target',
    ...overrides,
  });
}

describeScenarios('каталог: классы и черты', [
  {
    id: 'F19',
    name: 'Божественная искра: лечение',
    context: 'feature',
    storedEffect: createDivineSpark('Лечение', {
      triggers: [
        {
          id: 'spark-heal',
          event: 'applied',
          actions: [
            {
              type: 'damage',
              parts: [
                {
                  formula: `${DIVINE_SPARK_DICE}@heal + @mod.wis`,
                  target: 'selected',
                },
              ],
            },
            { type: 'removeSelf' },
          ],
        },
      ],
    }),
  },
  {
    id: 'F19',
    name: 'Божественная искра: излучение',
    context: 'feature',
    storedEffect: createDivineSpark('Излучение', {
      applySave: {
        ability: 'constitution',
        dc: APPLIER_SAVE_DC,
        onSuccess: 'half',
      },
      // Тип урона — токеном формулы, цель части — явно
      damageParts: [
        {
          formula: `${DIVINE_SPARK_DICE}@dmg.radiant + @mod.wis`,
          target: 'selected',
        },
      ],
    }),
  },
  {
    id: 'F19',
    name: 'Божественная искра: некротическая энергия',
    context: 'feature',
    storedEffect: createDivineSpark('Некротическая энергия', {
      applySave: {
        ability: 'constitution',
        dc: APPLIER_SAVE_DC,
        onSuccess: 'half',
      },
      damageParts: [
        {
          formula: `${DIVINE_SPARK_DICE}@dmg.necrotic + @mod.wis`,
          target: 'selected',
        },
      ],
    }),
  },
]);
