/**
 * Формирует стабильный id для умения в списке мультикласса.
 */
export function getIndexedFeatureAnchorId(
  featureKey: string,
  featureIndex: number,
): string {
  return `${featureKey}-${featureIndex + 1}`;
}

/**
 * Заголовок навигации по разделам страницы класса.
 */
export const CLASS_NAVIGATION_TITLE = 'На этой странице';

/**
 * Уровень пунктов навигации: все разделы страницы класса равноправны.
 */
export const CLASS_NAVIGATION_LINK_DEPTH = 2;

/**
 * Якоря разделов страницы класса, на которые ведёт навигация.
 */
export const CLASS_SECTION_ANCHOR = {
  table: 'class-table',
  proficiency: 'class-proficiency',
  equipment: 'class-equipment',
  description: 'description',
} as const;

/**
 * Подписи разделов страницы класса в навигации.
 */
export const CLASS_SECTION_LABEL = {
  table: 'Основное',
  proficiency: 'Владения',
  equipment: 'Снаряжение',
  description: 'Описание',
} as const;

/**
 * Префикс идентификаторов меток текущего раздела в навигации.
 */
export const CLASS_NAVIGATION_MARKER_PREFIX = 'class-navigation-marker-';

/**
 * Возвращает идентификатор метки, по которой навигация подсвечивает раздел.
 *
 * @param sectionId Якорь раздела страницы класса.
 */
export function getClassNavigationMarkerId(sectionId: string): string {
  return `${CLASS_NAVIGATION_MARKER_PREFIX}${sectionId}`;
}
