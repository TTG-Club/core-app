import type { NameResponse, SourceResponse } from '~/shared/types';

import type { BackgroundToolCategory } from './tool-category';

import { BACKGROUND_DETAIL_LABELS } from './constants';
import {
  findBackgroundToolCategory,
  toBackgroundToolCategoryMarker,
} from './tool-category';

/** Ссылка на запись справочника со снимком названия. */
export interface BackgroundEntityRef {
  url: string;
  name?: string | null;
}

/** Владение инструментами на выбор игрока. */
export interface BackgroundToolChoiceResponse {
  count?: number | null;
  from?: Array<BackgroundEntityRef> | null;
}

export interface BackgroundDetailResponse {
  url: string;
  name: NameResponse;
  abilityScores: string; // характеристики
  feat: string; // черта
  featChoices?: Array<BackgroundEntityRef> | null; // черты на выбор игрока
  skillProficiencies: string; // навыки
  toolProficiency: string[]; // владение инструментов текстом (легаси)
  toolProficiencies?: Array<BackgroundEntityRef> | null; // владение ссылками
  toolChoice?: BackgroundToolChoiceResponse | null; // владение на выбор игрока
  equipment: string[]; // снаряжение
  source: SourceResponse;
  description: Array<string>;
  updatedAt: string;
}

/**
 * Маркер ссылки на запись раздела: подпись плюс адрес страницы. Ссылка без
 * подписи показывается адресом — так видно, что запись переименовали или
 * удалили, а не что владения нет.
 *
 * @param reference ссылка со снимком названия.
 * @param section раздел разметки (`item`, `feat`).
 * @returns маркер разметки сайта.
 */
function toMarker(reference: BackgroundEntityRef, section: string): string {
  return `{@${section} ${reference.name || reference.url}|url:${reference.url}}`;
}

/**
 * Выбор инструментов строкой. Выбор из всей категории называется категорией
 * со ссылкой на раздел, иначе инструменты перечисляются через «или».
 *
 * @param count сколько инструментов выбирает игрок.
 * @param pool инструменты, из которых он выбирает; пусто — любой инструмент.
 * @param toolCategories категории инструментов раздела «Предметы».
 * @returns разметка строки выбора.
 */
function getToolChoiceNode(
  count: number,
  pool: Array<BackgroundEntityRef>,
  toolCategories: Array<BackgroundToolCategory>,
): string {
  const prefix = `${BACKGROUND_DETAIL_LABELS.toolChoicePrefix} ${count}`;

  if (!pool.length) {
    return `${prefix}: ${BACKGROUND_DETAIL_LABELS.anyTool}`;
  }

  const category = findBackgroundToolCategory(pool, toolCategories);

  if (category) {
    return `${prefix} ${BACKGROUND_DETAIL_LABELS.toolCategoryJoiner} ${toBackgroundToolCategoryMarker(category)}`;
  }

  return `${prefix}: ${pool
    .map((reference) => toMarker(reference, 'item'))
    .join(BACKGROUND_DETAIL_LABELS.choiceSeparator)}`;
}

/**
 * Владение инструментами для страницы предыстории.
 *
 * Ссылки мастерской главнее свободного текста: у переведённых записей текст
 * остаётся прежней прозой и повторил бы уже показанное. Выбор игрока идёт
 * отдельной строкой — он не владение, а обещание его назвать.
 *
 * @param background деталь предыстории.
 * @param toolCategories категории инструментов раздела «Предметы»: по ним
 *   выбор из всей категории называется категорией. Без них выбор всегда
 *   перечисляется поимённо.
 * @returns строки разметки для блока владения инструментами.
 */
export function getBackgroundToolNodes(
  background: BackgroundDetailResponse,
  toolCategories: Array<BackgroundToolCategory> = [],
): Array<string> {
  const fixed = background.toolProficiencies ?? [];

  const choice = background.toolChoice;

  const choiceCount = choice?.count ?? 0;

  if (!fixed.length && choiceCount < 1) {
    return background.toolProficiency;
  }

  const nodes: Array<string> = [];

  if (fixed.length) {
    nodes.push(
      fixed
        .map((reference) => toMarker(reference, 'item'))
        .join(BACKGROUND_DETAIL_LABELS.listSeparator),
    );
  }

  if (choiceCount >= 1) {
    nodes.push(
      getToolChoiceNode(choiceCount, choice?.from ?? [], toolCategories),
    );
  }

  return nodes;
}

/**
 * Черта предыстории для страницы: названная ею самой либо список на выбор
 * игрока.
 *
 * @param background деталь предыстории.
 * @returns разметка блока черты.
 */
export function getBackgroundFeatNode(
  background: BackgroundDetailResponse,
): string {
  if (background.feat) {
    return background.feat;
  }

  const choices = background.featChoices ?? [];

  if (!choices.length) {
    return '';
  }

  return choices
    .map((reference) => toMarker(reference, 'feat'))
    .join(BACKGROUND_DETAIL_LABELS.choiceSeparator);
}
