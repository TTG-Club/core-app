import type { CreateAction, CreatureSpellGroup } from '~bestiary/model';

import { describe, expect, it } from 'vitest';

import {
  createEmptyCreatureAction,
  createEmptyCreatureSpellGroup,
  CREATURE_ACTION_EFFECT_CONTEXTS,
  getCreatureSpellGroupLabel,
  normalizeCreatureActions,
  normalizeCreatureSpellcasting,
  normalizeLoadedCreatureSpellcasting,
  setCreatureActionCooldownTurns,
  setCreatureActionRecharge,
  toStoredCooldownTurns,
} from '~bestiary/model';

/** «Раз в 3 хода» — число из примеров задачи. */
const COOLDOWN_TURNS = 3;

/** Значение словаря перезарядки. */
const RECHARGE_FIVE_SIX = '5-6';

/**
 * Действие «раз в N ходов».
 *
 * @param cooldownTurns число ходов.
 * @returns запись действия.
 */
function createCooldownAction(cooldownTurns: number): CreateAction {
  return {
    ...createEmptyCreatureAction(),
    name: { rus: 'Огненное дыхание', eng: 'Fire Breath' },
    cooldownTurns,
  };
}

/**
 * Порция заклинаний «раз в N ходов».
 *
 * @param cooldownTurns число ходов.
 * @returns группа заклинаний.
 */
function createCooldownGroup(
  cooldownTurns: number | undefined,
): CreatureSpellGroup {
  return {
    ...createEmptyCreatureSpellGroup(),
    mode: 'COOLDOWN',
    cooldownTurns,
  };
}

describe('«раз в N ходов» у записи существа (cooldownTurns)', () => {
  it('3 сохраняется, 1, 21, 2.5 и пусто — null', () => {
    expect(toStoredCooldownTurns(COOLDOWN_TURNS)).toBe(COOLDOWN_TURNS);
    expect(toStoredCooldownTurns('3')).toBe(COOLDOWN_TURNS);
    expect(toStoredCooldownTurns(1)).toBeNull();
    expect(toStoredCooldownTurns(21)).toBeNull();
    expect(toStoredCooldownTurns(2.5)).toBeNull();
    expect(toStoredCooldownTurns('')).toBeNull();
    expect(toStoredCooldownTurns(undefined)).toBeNull();
    expect(toStoredCooldownTurns(null)).toBeNull();
  });

  it('пишется у всех списков, пустая запись — null', () => {
    expect(createEmptyCreatureAction().cooldownTurns).toBeNull();

    for (const effectContext of Object.values(
      CREATURE_ACTION_EFFECT_CONTEXTS,
    )) {
      expect(
        normalizeCreatureActions(
          [createCooldownAction(COOLDOWN_TURNS)],
          effectContext,
        )[0]?.cooldownTurns,
      ).toBe(COOLDOWN_TURNS);
    }
  });

  it('выбор перезарядки сбрасывает число ходов', () => {
    const action = setCreatureActionRecharge(
      createCooldownAction(COOLDOWN_TURNS),
      RECHARGE_FIVE_SIX,
    );

    expect(action.recharge).toBe(RECHARGE_FIVE_SIX);
    expect(action.cooldownTurns).toBeNull();
  });

  it('снятая перезарядка число ходов не трогает', () => {
    const action = setCreatureActionRecharge(
      createCooldownAction(COOLDOWN_TURNS),
      undefined,
    );

    expect(action.cooldownTurns).toBe(COOLDOWN_TURNS);
  });

  it('введённое число ходов сбрасывает перезарядку, негодное — нет', () => {
    const rechargeAction = {
      ...createEmptyCreatureAction(),
      recharge: RECHARGE_FIVE_SIX,
    };

    const cooldownAction = setCreatureActionCooldownTurns(
      rechargeAction,
      COOLDOWN_TURNS,
    );

    expect(cooldownAction.cooldownTurns).toBe(COOLDOWN_TURNS);
    expect(cooldownAction.recharge).toBeUndefined();

    const invalidAction = setCreatureActionCooldownTurns(rechargeAction, 1);

    expect(invalidAction.cooldownTurns).toBeNull();
    expect(invalidAction.recharge).toBe(RECHARGE_FIVE_SIX);
  });

  it('при обоих ограничениях на отправке остаётся перезарядка', () => {
    const action = {
      ...createCooldownAction(COOLDOWN_TURNS),
      recharge: RECHARGE_FIVE_SIX,
    };

    const [normalized] = normalizeCreatureActions(
      [action],
      CREATURE_ACTION_EFFECT_CONTEXTS.actions,
    );

    expect(normalized?.recharge).toBe(RECHARGE_FIVE_SIX);
    expect(normalized?.cooldownTurns).toBeNull();
  });
});

describe('порция заклинаний «раз в N ходов» (COOLDOWN)', () => {
  it('разбирается из ответа сервера', () => {
    const [block] = normalizeLoadedCreatureSpellcasting([
      {
        id: 'spellcasting-1',
        name: 'Использование заклинаний',
        groups: [{ mode: 'COOLDOWN', cooldownTurns: COOLDOWN_TURNS }],
      },
    ]);

    expect(block?.groups[0]?.mode).toBe('COOLDOWN');
    expect(block?.groups[0]?.cooldownTurns).toBe(COOLDOWN_TURNS);
  });

  it('негодное число ходов из ответа отбрасывается', () => {
    const [block] = normalizeLoadedCreatureSpellcasting([
      {
        id: 'spellcasting-1',
        name: 'Использование заклинаний',
        groups: [{ mode: 'COOLDOWN', cooldownTurns: 21 }],
      },
    ]);

    expect(block?.groups[0]?.cooldownTurns).toBeUndefined();
  });

  it('подписывается «Раз в 3 хода» со склонением', () => {
    expect(
      getCreatureSpellGroupLabel(createCooldownGroup(COOLDOWN_TURNS)),
    ).toBe('Раз в 3 хода');

    expect(getCreatureSpellGroupLabel(createCooldownGroup(5))).toBe(
      'Раз в 5 ходов',
    );

    expect(getCreatureSpellGroupLabel(createCooldownGroup(undefined))).toBe(
      'Раз в N ходов',
    );
  });

  it('число ходов уходит только у режима COOLDOWN', () => {
    const [block] = normalizeCreatureSpellcasting(
      normalizeLoadedCreatureSpellcasting([
        {
          id: 'spellcasting-1',
          name: 'Использование заклинаний',
          groups: [
            { mode: 'COOLDOWN', cooldownTurns: COOLDOWN_TURNS },
            { mode: 'AT_WILL', cooldownTurns: COOLDOWN_TURNS },
          ],
        },
      ]),
    );

    expect(block?.groups[0]?.cooldownTurns).toBe(COOLDOWN_TURNS);
    expect(block?.groups[1]?.cooldownTurns).toBeUndefined();
  });
});
