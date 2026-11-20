import type { VttgDocsChannel } from '#shared/consts';

import {
  VTTG_DOCS_ACCESS_DATA_KEY,
  VTTG_DOCS_ANCHOR_PREFIX,
  VTTG_DOCS_DATA_KEY_SEPARATOR,
  VTTG_DOCS_GUEST_KEY,
  VTTG_DOCS_INDEX_DATA_KEY,
  VTTG_DOCS_NEW_TAB_TARGET,
  VTTG_DOCS_PAGE_DATA_KEY,
  VTTG_DOCS_ROLES_KEY_SEPARATOR,
  VTTG_DOCS_SITE_PATH_PREFIX,
  VTTG_DOCS_SUBTITLE_SEPARATOR,
  VTTG_DOCS_TOC_ACTIVE_CLASS,
  VTTG_DOCS_TOC_INACTIVE_CLASS,
  VTTG_DOCS_TOC_NESTED_CLASS,
  VTTG_DOCS_TOC_TOP_CLASS,
  VTTG_DOCS_TOC_TOP_DEPTH,
  VTTG_DOCS_UPDATED_PREFIX,
  VTTG_DOCS_VERSION_PREFIX,
} from './constants';

/** Что сделать по клику на ссылку внутри статьи. */
export type VttgDocsLinkAction = 'anchor' | 'route' | 'browser';

/** Части подзаголовка: группа (на странице), версия и дата выкладки. */
export interface VttgDocsSubtitleParts {
  groupTitle?: string;
  version: string;
  /** Дата выкладки, уже отформатированная. */
  formattedReleaseDate?: string;
}

/**
 * Подзаголовок раздела: «Модули · VTTG 0.9.330 · обновлено 19 ноября 2026».
 *
 * @param subtitleParts группа, версия и дата
 */
export function formatVttgDocsSubtitle(
  subtitleParts: VttgDocsSubtitleParts,
): string {
  const { groupTitle, version, formattedReleaseDate } = subtitleParts;

  const versionLabel = `${VTTG_DOCS_VERSION_PREFIX} ${version}`;

  const releaseLabel = formattedReleaseDate
    ? `${VTTG_DOCS_UPDATED_PREFIX} ${formattedReleaseDate}`
    : undefined;

  return [groupTitle, versionLabel, releaseLabel]
    .filter(Boolean)
    .join(VTTG_DOCS_SUBTITLE_SEPARATOR);
}

/**
 * Параметр адреса строкой: у динамического сегмента он всегда строка, но тип
 * роутера допускает и массив.
 *
 * @param routeParam значение `route.params.*`
 */
export function toVttgDocsRouteParam(
  routeParam: string | string[] | undefined,
): string {
  return typeof routeParam === 'string' ? routeParam : '';
}

/**
 * Ключ данных оглавления: свой у каждого канала.
 *
 * @param channel канал документации
 */
export function getVttgDocsIndexDataKey(channel: VttgDocsChannel): string {
  return [VTTG_DOCS_INDEX_DATA_KEY, channel].join(VTTG_DOCS_DATA_KEY_SEPARATOR);
}

/**
 * Ключ данных доступа: свой у каждого набора ролей, поэтому вход и выход
 * перечитывают доступ сами.
 *
 * @param roles роли посетителя (пусто — гость)
 */
export function getVttgDocsAccessDataKey(roles: readonly string[]): string {
  const rolesKey = roles.length
    ? [...roles].sort().join(VTTG_DOCS_ROLES_KEY_SEPARATOR)
    : VTTG_DOCS_GUEST_KEY;

  return [VTTG_DOCS_ACCESS_DATA_KEY, rolesKey].join(
    VTTG_DOCS_DATA_KEY_SEPARATOR,
  );
}

/**
 * Ключ данных страницы: канал, группа и страница.
 *
 * @param channel канал документации
 * @param groupSlug группа
 * @param pageSlug страница
 */
export function getVttgDocsPageDataKey(
  channel: VttgDocsChannel,
  groupSlug: string,
  pageSlug: string,
): string {
  return [VTTG_DOCS_PAGE_DATA_KEY, channel, groupSlug, pageSlug].join(
    VTTG_DOCS_DATA_KEY_SEPARATOR,
  );
}

/** Положение заголовка статьи относительно верха окна. */
export interface VttgDocsHeadingPosition {
  id: string;
  /** Расстояние от верха окна до заголовка (пикселей), выше окна — меньше 0. */
  top: number;
}

/**
 * Классы пункта оглавления страницы: третий уровень сдвинут, текущий
 * заголовок выделен.
 *
 * @param depth уровень заголовка
 * @param isActive заголовок сейчас читают
 */
export function getVttgDocsTocLinkClass(
  depth: number,
  isActive: boolean,
): string[] {
  return [
    depth > VTTG_DOCS_TOC_TOP_DEPTH
      ? VTTG_DOCS_TOC_NESTED_CLASS
      : VTTG_DOCS_TOC_TOP_CLASS,
    isActive ? VTTG_DOCS_TOC_ACTIVE_CLASS : VTTG_DOCS_TOC_INACTIVE_CLASS,
  ];
}

/**
 * Заголовок, который сейчас читают: последний из поднявшихся к верху окна.
 * Пока ни один не поднялся — первый; докрутили до конца — последний, иначе
 * короткие разделы в конце страницы не подсветились бы никогда.
 *
 * @param headingPositions заголовки статьи по порядку
 * @param activeOffset насколько ниже верха окна заголовок ещё текущий
 * @param isPageBottom страница докручена до конца
 */
export function findVttgDocsActiveHeadingId(
  headingPositions: VttgDocsHeadingPosition[],
  activeOffset: number,
  isPageBottom: boolean,
): string | undefined {
  if (isPageBottom) {
    return headingPositions.at(-1)?.id;
  }

  const passedHeadings = headingPositions.filter(
    (headingPosition) => headingPosition.top <= activeOffset,
  );

  return (passedHeadings.at(-1) ?? headingPositions[0])?.id;
}

/**
 * Что сделать по клику на ссылку статьи: якорь — прокрутить страницу, адрес
 * сайта — перейти роутером без перезагрузки, остальное (внешние ссылки и
 * ссылки в новой вкладке) — оставить браузеру.
 *
 * @param href адрес ссылки
 * @param linkTarget атрибут `target` ссылки
 */
export function getVttgDocsLinkAction(
  href: string,
  linkTarget: string,
): VttgDocsLinkAction {
  if (linkTarget === VTTG_DOCS_NEW_TAB_TARGET) {
    return 'browser';
  }

  if (href.startsWith(VTTG_DOCS_ANCHOR_PREFIX)) {
    return 'anchor';
  }

  return href.startsWith(VTTG_DOCS_SITE_PATH_PREFIX) ? 'route' : 'browser';
}
