import type { FeatCreate } from './create';
import type {
  FeatAbilityBonus,
  FeatChoice,
  FeatCounter,
  FeatMechanics,
  FeatModifiers,
  FeatPrerequisiteDetails,
  FeatProficiencyGrant,
  FeatSpellFilter,
  FeatSpellGrant,
  FeatSpellListExpansion,
} from './mechanics';

import { createFeatMechanics, createFeatSpellList } from './mechanics';
import { fromFeatEditorRows } from './rows';

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
    classes: orUndefinedList(filter.classes) ?? [],
    classesFromChoiceKey: text(filter.classesFromChoiceKey) ?? '',
  });
}

/**
 * Готовит выборы: без типа и ключа выбор бессмыслен и не отправляется.
 *
 * Поля, которых у типа выбора не бывает, обнулены ещё в сборке строк редактора
 * ({@link fromFeatEditorRows}) — здесь остаётся только отсеять пустые фильтры.
 */
function buildChoices(choices: Array<FeatChoice>): Array<FeatChoice> {
  return choices
    .filter((choice) => !!choice.type && !!text(choice.key))
    .map((choice) => ({
      ...choice,
      key: choice.key.trim(),
      spellFilter: buildSpellFilter(choice.spellFilter),
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
function buildModifiers(modifiers: FeatModifiers): FeatModifiers | undefined {
  return orUndefined({
    ...modifiers,
    senses: modifiers.senses.filter((sense) => !!sense.type),
    creatureType: text(modifiers.creatureType),
    initiativeProficiencyBonus: !!modifiers.initiativeProficiencyBonus,
    damage: {
      ...modifiers.damage,
      // Ссылка без ключа выбора никуда не ведёт: так выглядит строка защиты,
      // которую только что перевели в режим выбора и ещё не заполнили
      defenseChoices: modifiers.damage.defenseChoices.filter(
        (choice) => !!text(choice.choiceKey),
      ),
      resistanceFromChoiceKey:
        text(modifiers.damage.resistanceFromChoiceKey) ?? '',
    },
  });
}

/**
 * Готовит выдаваемые владения: ссылка без url — это только что добавленная и
 * незаполненная строка, отправлять её некуда.
 */
function buildProficiencies(
  proficiencies: FeatProficiencyGrant,
): FeatProficiencyGrant | undefined {
  return orUndefined({
    ...proficiencies,
    tools: proficiencies.tools.filter((tool) => !!text(tool.url)),
    weapons: proficiencies.weapons.filter((weapon) => !!text(weapon.url)),
    weaponMasteries: proficiencies.weaponMasteries.filter(
      (mastery) => !!text(mastery.url),
    ),
  });
}

/**
 * Готовит выдаваемые заклинания.
 *
 * Заклинание без ссылки отправлять некуда — так выглядит пустая строка, только
 * что добавленная в списке. Остальные поля блока без заклинаний бессмысленны:
 * заклинательной характеристике не к чему применяться, поэтому блок целиком
 * уходит пустым.
 */
function buildSpells(spells: FeatSpellGrant): FeatSpellGrant | undefined {
  const granted = spells.spells.filter((spell) => !!text(spell.url));

  if (!granted.length) {
    return undefined;
  }

  return { ...spells, spells: granted };
}

/**
 * Готовит расширение списка заклинаний.
 *
 * Без заклинаний блок бессмыслен: расширять нечем, а отметка «нужно
 * заклинательство» сама по себе ничего не описывает.
 *
 * Отправляются только группы: плоский `spells` core-api держит ради записей,
 * сохранённых до появления уровней, и читает его через `resolveGroups()`, а
 * пишет всегда группами. Дублировать заклинания вторым полем значило бы
 * оставлять в JSONB две версии одного списка.
 *
 * @param spellList расширение списка из формы.
 * @returns блок расширения; `undefined` — заклинаний в нём нет.
 */
function buildSpellList(
  spellList: FeatSpellListExpansion,
): FeatSpellListExpansion | undefined {
  const groups = spellList.groups
    .map((group) => ({
      ...group,
      count: text(group.count) ?? '',
      spells: group.spells.filter((spell) => !!text(spell.url)),
    }))
    .filter((group) => group.spells.length > 0);

  if (!groups.length) {
    return undefined;
  }

  return { ...spellList, groups };
}

/** Готовит ресурсы черты: без названия счётчику нечего показать на листе. */
function buildCounters(counters: Array<FeatCounter>): Array<FeatCounter> {
  return counters
    .filter((counter) => !!text(counter.name) && !!text(counter.key))
    .map((counter) => ({
      ...counter,
      key: counter.key.trim(),
      name: counter.name.trim(),
      shortName: counter.shortName.trim(),
      // Кривую формулу лист читает как ноль, а пустую — как отсутствие поля:
      // счётчик без максимума на листе не появится вовсе
      max: counter.max.trim() || '0',
    }));
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
    // Без заклинаний блок уходит пустым целиком: отметка «нужно
    // заклинательство» без списка ничего не описывает
    spellList: buildSpellList(mechanics.spellList) ?? createFeatSpellList(),
    counters: buildCounters(mechanics.counters),
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
 * Механика и предусловие собираются из строк редактора: форма правит их, а
 * блоки механики — уже результат. Строки в теле запроса не нужны и уходят
 * `undefined` — такие поля `JSON.stringify` выбрасывает.
 *
 * Механика и предусловие лежат в core-api в JSONB, поэтому пустые объекты и
 * выключенные флаги туда лучше не писать: они только мешают читать данные.
 */
export function transformFeatBeforeSubmit(state: FeatCreate): FeatCreate {
  const built = state.editorRows
    ? fromFeatEditorRows(
        state.editorRows,
        state.mechanics ?? createFeatMechanics(),
      )
    : {
        mechanics: state.mechanics,
        prerequisiteDetails: state.prerequisiteDetails,
      };

  return {
    ...state,
    editorRows: undefined,
    // Плоскую проекцию характеристик core-api пересобирает из
    // `mechanics.abilityBonuses` сам и в теле запроса её больше не ждёт
    abilities: undefined,
    prerequisite: state.prerequisite.trim(),
    prerequisiteDetails: built.prerequisiteDetails
      ? buildPrerequisiteDetails(built.prerequisiteDetails)
      : undefined,
    mechanics: built.mechanics ? buildMechanics(built.mechanics) : undefined,
  };
}
