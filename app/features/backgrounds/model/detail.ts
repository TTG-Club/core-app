import type { NameResponse, SourceResponse } from '~/shared/types';

import { BACKGROUND_DETAIL_LABELS } from './constants';

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
 * Владение инструментами для страницы предыстории.
 *
 * Ссылки мастерской главнее свободного текста: у переведённых записей текст
 * остаётся прежней прозой и повторил бы уже показанное. Выбор игрока идёт
 * отдельной строкой — он не владение, а обещание его назвать.
 *
 * @param background деталь предыстории.
 * @returns строки разметки для блока владения инструментами.
 */
export function getBackgroundToolNodes(
  background: BackgroundDetailResponse,
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
    const pool = choice?.from ?? [];

    nodes.push(
      pool.length
        ? `${BACKGROUND_DETAIL_LABELS.toolChoicePrefix} ${choiceCount}: ${pool
            .map((reference) => toMarker(reference, 'item'))
            .join(BACKGROUND_DETAIL_LABELS.choiceSeparator)}`
        : `${BACKGROUND_DETAIL_LABELS.toolChoicePrefix} ${choiceCount}: ${BACKGROUND_DETAIL_LABELS.anyTool}`,
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
