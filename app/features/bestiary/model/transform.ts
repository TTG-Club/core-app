import type { CreatureCreate } from './create';

import {
  EFFECT_FORM_CONTEXT,
  normalizeActiveEffects,
} from '~active-effects/model';

import { CREATURE_ACTION_EFFECT_CONTEXTS } from './action';
import { normalizeCreatureActions } from './create';
import { normalizeCreatureSpellcasting } from './spellcasting';

/**
 * Чистит состояние формы существа перед отправкой: механику шести списков
 * боевого блока, блоки заклинаний и собственные эффекты существа.
 *
 * Эффекты записей чистятся по месту своего списка: у черты эффект лежит на
 * самом существе, у действия — ложится на цель, и допустимая Сл у них разная.
 *
 * @param state состояние формы.
 * @returns тело запроса.
 */
export function transformCreatureBeforeSubmit(
  state: CreatureCreate,
): CreatureCreate {
  return {
    ...state,
    traits: normalizeCreatureActions(
      state.traits,
      CREATURE_ACTION_EFFECT_CONTEXTS.traits,
    ),
    actions: normalizeCreatureActions(
      state.actions,
      CREATURE_ACTION_EFFECT_CONTEXTS.actions,
    ),
    bonusActions: normalizeCreatureActions(
      state.bonusActions,
      CREATURE_ACTION_EFFECT_CONTEXTS.bonusActions,
    ),
    reactions: normalizeCreatureActions(
      state.reactions,
      CREATURE_ACTION_EFFECT_CONTEXTS.reactions,
    ),
    legendary: {
      ...state.legendary,
      actions: normalizeCreatureActions(
        state.legendary.actions,
        CREATURE_ACTION_EFFECT_CONTEXTS.legendary,
      ),
    },
    lair: {
      ...state.lair,
      effects: normalizeCreatureActions(
        state.lair.effects,
        CREATURE_ACTION_EFFECT_CONTEXTS.lair,
      ),
    },
    spellcasting: normalizeCreatureSpellcasting(state.spellcasting),
    activeEffects: normalizeActiveEffects(
      state.activeEffects,
      EFFECT_FORM_CONTEXT.ownEffects,
    ),
  };
}
