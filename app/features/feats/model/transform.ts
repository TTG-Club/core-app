import type {
  MechanicChoice,
  MechanicSpellFilter,
  ProficiencyGrant,
  SheetModifiers,
} from '~/shared/types';

import type { FeatCreate } from './create';
import type {
  FeatAbilityBonus,
  FeatMechanics,
  FeatPrerequisiteDetails,
} from './mechanics';

/**
 * Пустое ли значение с точки зрения формы: `undefined`, пустая строка, пустой
 * массив или объект, у которого пусты все поля.
 */
function isBlank(value: unknown): boolean {
  if (value === undefined || value === null || value === '') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.values(value).every(isBlank);
  }

  return false;
}

/** Отдаёт объект, только если в нём осталось хоть одно непустое поле. */
function orUndefined<TValue extends object>(value: TValue): TValue | undefined {
  return isBlank(value) ? undefined : value;
}

/** Отдаёт список, только если он не пуст. */
function orUndefinedList<TItem>(list: Array<TItem>): Array<TItem> | undefined {
  return list.length ? list : undefined;
}

/** Обрезает строку и превращает пустую в `undefined`. */
function text(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

/** Готовит фильтр заклинаний выбора. */
function buildSpellFilter(
  filter: MechanicSpellFilter | undefined,
): MechanicSpellFilter | undefined {
  if (!filter) {
    return undefined;
  }

  return orUndefined({
    ...filter,
    schools: orUndefinedList(filter.schools) ?? [],
    classes: orUndefinedList(filter.classes) ?? [],
    castingTime: text(filter.castingTime),
  });
}

/** Готовит выборы: без типа и ключа выбор бессмысленен и не отправляется. */
function buildChoices(choices: Array<MechanicChoice>): Array<MechanicChoice> {
  return choices
    .filter((choice) => !!choice.type && !!text(choice.key))
    .map((choice) => ({
      ...choice,
      key: choice.key.trim(),
      label: text(choice.label) ?? '',
      options: choice.options.filter((option) => !!option.value),
      spellFilter: buildSpellFilter(choice.spellFilter),
      countEqualsProficiencyBonus: !!choice.countEqualsProficiencyBonus,
    }));
}

/** Готовит варианты повышения характеристик. */
function buildAbilityBonuses(
  bonuses: Array<FeatAbilityBonus>,
): Array<FeatAbilityBonus> {
  return bonuses
    .filter((bonus) => bonus.abilities.length || text(bonus.fromChoiceKey))
    .map((bonus) => ({
      ...bonus,
      fromChoiceKey: text(bonus.fromChoiceKey) ?? '',
    }));
}

/** Готовит постоянные модификаторы листа. */
function buildModifiers(modifiers: SheetModifiers): SheetModifiers | undefined {
  return orUndefined({
    ...modifiers,
    senses: modifiers.senses.filter((sense) => !!sense.type),
    creatureType: text(modifiers.creatureType),
    initiativeProficiencyBonus: !!modifiers.initiativeProficiencyBonus,
    damage: {
      ...modifiers.damage,
      resistanceFromChoiceKey:
        text(modifiers.damage.resistanceFromChoiceKey) ?? '',
    },
  });
}

/** Готовит выдаваемые владения: инструмент без ссылки отправлять некуда. */
function buildProficiencies(
  proficiencies: ProficiencyGrant,
): ProficiencyGrant | undefined {
  return orUndefined({
    ...proficiencies,
    tools: proficiencies.tools.filter((tool) => !!text(tool.url)),
  });
}

/** Готовит механику целиком. */
function buildMechanics(mechanics: FeatMechanics): FeatMechanics | undefined {
  return orUndefined({
    abilityBonuses: buildAbilityBonuses(mechanics.abilityBonuses),
    choices: buildChoices(mechanics.choices),
    modifiers: buildModifiers(mechanics.modifiers) ?? mechanics.modifiers,
    proficiencies:
      buildProficiencies(mechanics.proficiencies) ?? mechanics.proficiencies,
  });
}

/** Готовит разобранное предварительное условие. */
function buildPrerequisiteDetails(
  prerequisite: FeatPrerequisiteDetails,
): FeatPrerequisiteDetails | undefined {
  return orUndefined({
    ...prerequisite,
    abilities: prerequisite.abilities.filter(
      (requirement) => requirement.anyOf.length > 0,
    ),
    anyDragonmark: !!prerequisite.anyDragonmark,
    campaign: text(prerequisite.campaign) ?? '',
    custom: text(prerequisite.custom) ?? '',
  });
}

/**
 * Чистит состояние формы перед отправкой.
 *
 * Механика и предусловие лежат в core-api в JSONB, поэтому пустые объекты и
 * выключенные флаги туда лучше не писать: они только мешают читать данные.
 */
export function transformFeatBeforeSubmit(state: FeatCreate): FeatCreate {
  return {
    ...state,
    prerequisite: state.prerequisite.trim(),
    prerequisiteDetails: state.prerequisiteDetails
      ? buildPrerequisiteDetails(state.prerequisiteDetails)
      : undefined,
    mechanics: state.mechanics ? buildMechanics(state.mechanics) : undefined,
  };
}
