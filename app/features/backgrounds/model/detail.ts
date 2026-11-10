import type { NameResponse, SourceResponse } from '~/shared/types';
import type { RenderNode } from '~ui/markup';
import type { StartingEquipmentOptionResponse } from '~ui/starting-equipment';

import type { BackgroundToolCatalog } from './tool-category';

import { kebabCase } from 'es-toolkit';

import { EFFECT_SKILL_OPTIONS } from '~active-effects/model';
import { getStartingEquipmentNode } from '~ui/starting-equipment';

import {
  BACKGROUND_DETAIL_LABELS,
  SKILL_GLOSSARY_URL_SUFFIX,
} from './constants';
import {
  createEmptyBackgroundToolCatalog,
  findBackgroundToolCategory,
  toBackgroundToolCategoryMarker,
} from './tool-category';

/**
 * Адреса статей глоссария о навыках по названию навыка. Собраны из общего
 * списка навыков, а не своим перечнем: так они не разъедутся при
 * переименовании. Ключ навыка `sleightOfHand` даёт адрес `sleight-of-hand-phb`.
 */
const SKILL_GLOSSARY_URLS = new Map<string, string>(
  EFFECT_SKILL_OPTIONS.map((skill) => [
    skill.label,
    `${kebabCase(skill.value)}${SKILL_GLOSSARY_URL_SUFFIX}`,
  ]),
);

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
  toolProficiency?: string[] | null; // владение инструментов текстом (легаси)
  toolProficiencies?: Array<BackgroundEntityRef> | null; // владение ссылками
  toolChoice?: BackgroundToolChoiceResponse | null; // владение на выбор игрока
  equipment?: string[] | null; // снаряжение текстом (легаси)
  startingEquipment?: Array<StartingEquipmentOptionResponse> | null; // снаряжение вариантами
  source: SourceResponse;
  description: Array<string>;
  updatedAt: string;
}

/**
 * Маркер ссылки на запись раздела: подпись плюс адрес страницы. Подпись —
 * снимок названия в записи, а без него — название из каталога раздела. Ссылка,
 * которую не назвать ни так, ни так, показывается адресом — так видно, что
 * запись переименовали или удалили, а не что владения нет.
 *
 * @param reference ссылка со снимком названия.
 * @param section раздел разметки (`item`, `feat`).
 * @param names названия карточек раздела по адресу.
 * @returns маркер разметки сайта.
 */
function toMarker(
  reference: BackgroundEntityRef,
  section: string,
  names: Record<string, string> = {},
): string {
  const label = reference.name || names[reference.url] || reference.url;

  return `{@${section} ${label}|url:${reference.url}}`;
}

/**
 * Выбор инструментов строкой. Выбор из всей категории называется категорией
 * со ссылкой на раздел, иначе инструменты перечисляются через «или».
 *
 * @param count сколько инструментов выбирает игрок.
 * @param pool инструменты, из которых он выбирает; пусто — любой инструмент.
 * @param toolCatalog инструменты раздела «Предметы».
 * @returns разметка строки выбора.
 */
function getToolChoiceNode(
  count: number,
  pool: Array<BackgroundEntityRef>,
  toolCatalog: BackgroundToolCatalog,
): string {
  const prefix = `${BACKGROUND_DETAIL_LABELS.toolChoicePrefix} ${count}`;

  if (!pool.length) {
    return `${prefix}: ${BACKGROUND_DETAIL_LABELS.anyTool}`;
  }

  const category = findBackgroundToolCategory(pool, toolCatalog.categories);

  if (category) {
    return `${prefix} ${BACKGROUND_DETAIL_LABELS.toolCategoryJoiner} ${toBackgroundToolCategoryMarker(category)}`;
  }

  return `${prefix}: ${pool
    .map((reference) => toMarker(reference, 'item', toolCatalog.names))
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
 * @param toolCatalog инструменты раздела «Предметы»: по категориям выбор из
 *   всей категории называется категорией, по названиям подписываются ссылки
 *   без снимка названия. Без каталога выбор перечисляется поимённо, а такие
 *   ссылки показываются адресом.
 * @returns строки разметки для блока владения инструментами.
 */
export function getBackgroundToolNodes(
  background: BackgroundDetailResponse,
  toolCatalog: BackgroundToolCatalog = createEmptyBackgroundToolCatalog(),
): Array<string> {
  const fixed = background.toolProficiencies ?? [];

  const choice = background.toolChoice;

  const choiceCount = choice?.count ?? 0;

  if (!fixed.length && choiceCount < 1) {
    return background.toolProficiency ?? [];
  }

  const nodes: Array<string> = [];

  if (fixed.length) {
    nodes.push(
      fixed
        .map((reference) => toMarker(reference, 'item', toolCatalog.names))
        .join(BACKGROUND_DETAIL_LABELS.listSeparator),
    );
  }

  if (choiceCount >= 1) {
    nodes.push(getToolChoiceNode(choiceCount, choice?.from ?? [], toolCatalog));
  }

  return nodes;
}

/**
 * Навыки предыстории для страницы: каждый известный навык — ссылка на его
 * статью в глоссарии, незнакомое название остаётся текстом.
 *
 * @param background деталь предыстории.
 * @returns разметка строки навыков.
 */
export function getBackgroundSkillNode(
  background: BackgroundDetailResponse,
): string {
  return background.skillProficiencies
    .split(BACKGROUND_DETAIL_LABELS.listSeparator)
    .map((skillName) => skillName.trim())
    .filter(Boolean)
    .map((skillName) => {
      const glossaryUrl = SKILL_GLOSSARY_URLS.get(skillName);

      return glossaryUrl
        ? toMarker({ url: glossaryUrl, name: skillName }, 'glossary')
        : skillName;
    })
    .join(BACKGROUND_DETAIL_LABELS.listSeparator);
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

/**
 * Снаряжение предыстории для страницы. Варианты «А или Б» главнее прежнего
 * свободного текста: текст — легаси, у переведённых записей он пуст, а где
 * остался — повторил бы варианты.
 *
 * @param background деталь предыстории.
 * @returns разметка снаряжения; пусто — снаряжения нет.
 */
export function getBackgroundEquipmentNode(
  background: BackgroundDetailResponse,
): RenderNode {
  const options = getStartingEquipmentNode(background.startingEquipment);

  return options || background.equipment || [];
}
