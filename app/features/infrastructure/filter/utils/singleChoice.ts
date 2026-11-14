import type { FilterGroup } from '../types';

import {
  FILTER_SINGLE_CHOICE_EXCLUDE_LABELS,
  FILTER_SINGLE_CHOICE_EXCLUDE_PREFIX,
} from '../model';
import { getGroupItems } from './getGroupItems';

/**
 * Положение группы с единственным значением: признак не важен, обязателен или
 * исключён.
 */
export type SingleChoiceState = 'any' | 'include' | 'exclude';

/**
 * Группа — признак «да или нет»: значение у неё одно, и она умеет исключать.
 * Такой группе не нужны «Выбрать все» и «Исключать» — у неё всего два ответа,
 * и оба показываются сразу.
 *
 * Группа без исключения сюда не относится: второму ответу нечему
 * соответствовать в запросе. Так остаются обычными, например, группы источников
 * с единственной книгой.
 *
 * @param group группа фильтров.
 * @returns признак группы с единственным значением.
 */
export function isSingleChoiceGroup(group: FilterGroup): boolean {
  return group.supports?.mode === true && getGroupItems(group).length === 1;
}

/**
 * Текущее положение группы с единственным значением. Исключение без выбранного
 * значения на выдачу не влияет, поэтому читается как «не важно».
 *
 * @param group группа с единственным значением.
 * @returns положение группы.
 */
export function getSingleChoiceState(group: FilterGroup): SingleChoiceState {
  const [filterItem] = getGroupItems(group);

  if (!filterItem?.selected) {
    return 'any';
  }

  return group.mode ? 'exclude' : 'include';
}

/**
 * Переводит группу с единственным значением в новое положение. Выбор значения
 * и режим исключения меняются вместе: «исключить» — это выбранное значение с
 * исключением, а «не важно» снимает и то и другое.
 *
 * @param group группа с единственным значением.
 * @param state новое положение.
 * @returns новая группа; исходная не меняется.
 */
export function setSingleChoiceState(
  group: FilterGroup,
  state: SingleChoiceState,
): FilterGroup {
  const selected = state === 'any' ? null : true;

  return {
    ...group,
    mode: state === 'exclude',
    values: getGroupItems(group).map((filterItem) => ({
      ...filterItem,
      selected,
    })),
  };
}

/**
 * Нажатие на ответ «да»: отмечает его или снимает, если он уже отмечен.
 *
 * @param group группа с единственным значением.
 * @param selected отмечен ли ответ после нажатия.
 * @returns новая группа.
 */
export function toggleSingleChoiceInclude(
  group: FilterGroup,
  selected: boolean | null,
): FilterGroup {
  return setSingleChoiceState(group, selected ? 'include' : 'any');
}

/**
 * Нажатие на ответ «нет»: отмечает его или снимает, если он уже отмечен.
 *
 * @param group группа с единственным значением.
 * @param selected отмечен ли ответ после нажатия.
 * @returns новая группа.
 */
export function toggleSingleChoiceExclude(
  group: FilterGroup,
  selected: boolean | null,
): FilterGroup {
  return setSingleChoiceState(group, selected ? 'exclude' : 'any');
}

/**
 * Отмечен ли у группы ответ «да».
 *
 * @param group группа с единственным значением.
 * @returns признак отмеченного ответа «да».
 */
export function isSingleChoiceIncluded(group: FilterGroup): boolean {
  return getSingleChoiceState(group) === 'include';
}

/**
 * Отмечен ли у группы ответ «нет».
 *
 * @param group группа с единственным значением.
 * @returns признак отмеченного ответа «нет».
 */
export function isSingleChoiceExcluded(group: FilterGroup): boolean {
  return getSingleChoiceState(group) === 'exclude';
}

/**
 * Подпись ответа «нет» для единственного значения группы.
 *
 * @param group группа с единственным значением.
 * @returns подпись; пустая строка — значения у группы нет.
 */
export function getSingleChoiceGroupExcludeLabel(group: FilterGroup): string {
  const [filterItem] = getGroupItems(group);

  return filterItem ? getSingleChoiceExcludeLabel(filterItem.name) : '';
}

/**
 * Подпись ответа «нет» для значения группы: «Требуется» → «Не требуется»,
 * «Есть» → «Нет». Значение без своей подписи получает отрицание приставкой.
 *
 * @param valueName название единственного значения группы.
 * @returns подпись исключающего ответа.
 */
export function getSingleChoiceExcludeLabel(valueName: string): string {
  return (
    FILTER_SINGLE_CHOICE_EXCLUDE_LABELS[valueName]
    ?? `${FILTER_SINGLE_CHOICE_EXCLUDE_PREFIX} ${valueName}`
  );
}
