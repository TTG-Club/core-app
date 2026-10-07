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
 * Формирует якорь заголовка раздела. Навигация следит за заголовками, а не за
 * разделами целиком, иначе подсвечиваются все короткие разделы на экране.
 */
export function getSectionHeadingId(sectionId: string): string {
  return `${sectionId}-heading`;
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
