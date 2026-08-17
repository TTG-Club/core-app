import type { FeatCreate } from './create';
import type {
  FeatAbilityBonus,
  FeatChoice,
  FeatMechanics,
  FeatModifiers,
  FeatPrerequisiteDetails,
  FeatProficiencyGrant,
  FeatSpellFilter,
  FeatSpellGrant,
} from './mechanics';

import {
  isExpertiseChoiceType,
  isProficiencyChoiceType,
  isSpellChoiceType,
} from './constants';

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
  filter: FeatSpellFilter | undefined,
): FeatSpellFilter | undefined {
  if (!filter) {
    return undefined;
  }

  return orUndefined({
    ...filter,
    schools: orUndefinedList(filter.schools) ?? [],
    classes: orUndefinedList(filter.classes) ?? [],
    classesFromChoiceKey: text(filter.classesFromChoiceKey) ?? '',
    castingTime: text(filter.castingTime),
  });
}

/**
 * Готовит выборы: без типа и ключа выбор бессмысленен и не отправляется.
 *
 * Поля, которых у типа выбора не бывает, обнуляются: их могли заполнить до
 * смены типа, а форма после неё их уже не показывает — иначе в JSONB осталась
 * бы бессмыслица вроде компетентности за выбранное заклинание.
 */
function buildChoices(choices: Array<FeatChoice>): Array<FeatChoice> {
  return choices
    .filter((choice) => !!choice.type && !!text(choice.key))
    .map((choice) => {
      const isProficiency = isProficiencyChoiceType(choice.type);
      const isExpertise = isExpertiseChoiceType(choice.type);

      return {
        ...choice,
        key: choice.key.trim(),
        label: text(choice.label) ?? '',
        options: choice.options.filter((option) => !!option.value),
        spellFilter: isSpellChoiceType(choice.type)
          ? buildSpellFilter(choice.spellFilter)
          : undefined,
        countEqualsProficiencyBonus: !!choice.countEqualsProficiencyBonus,
        onlyIfNotProficient: isProficiency && choice.onlyIfNotProficient,
        onlyIfProficient: isProficiency && choice.onlyIfProficient,
        // Исход по умолчанию не пишется: у записей до его появления поля нет, и
        // core-api читает его отсутствие как владение.
        grants:
          isExpertise && choice.grants === 'EXPERTISE'
            ? choice.grants
            : undefined,
        expertiseIfProficient: isExpertise && choice.expertiseIfProficient,
      };
    });
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
function buildModifiers(modifiers: FeatModifiers): FeatModifiers | undefined {
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
  proficiencies: FeatProficiencyGrant,
): FeatProficiencyGrant | undefined {
  return orUndefined({
    ...proficiencies,
    tools: proficiencies.tools.filter((tool) => !!text(tool.url)),
  });
}

/**
 * Готовит выдаваемые заклинания.
 *
 * Заклинание без ссылки отправлять некуда — так выглядит пустая строка, только
 * что добавленная в списке. Остальные поля блока без заклинаний бессмысленны:
 * заклинательная характеристика не к чему применяться, поэтому блок целиком
 * уходит пустым.
 */
function buildSpells(spells: FeatSpellGrant): FeatSpellGrant | undefined {
  const granted = spells.spells.filter((spell) => !!text(spell.url));

  if (!granted.length) {
    return undefined;
  }

  return { ...spells, spells: granted };
}

/** Готовит механику целиком. */
function buildMechanics(mechanics: FeatMechanics): FeatMechanics | undefined {
  return orUndefined({
    abilityBonuses: buildAbilityBonuses(mechanics.abilityBonuses),
    choices: buildChoices(mechanics.choices),
    modifiers: buildModifiers(mechanics.modifiers) ?? mechanics.modifiers,
    proficiencies:
      buildProficiencies(mechanics.proficiencies) ?? mechanics.proficiencies,
    spells: buildSpells(mechanics.spells) ?? mechanics.spells,
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
