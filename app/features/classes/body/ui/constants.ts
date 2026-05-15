export const FEATURE_OPTIONS_LABELS = {
  empty: 'Ничего не найдено',
  levelSuffix: '-й уровень',
  search: 'Поиск по вариантам...',
  shown: 'Показано',
} as const;

/**
 * Формирует стабильный id для умения в списке мультикласса.
 */
export function getIndexedFeatureAnchorId(
  featureKey: string,
  featureIndex: number,
): string {
  return `${featureKey}-${featureIndex + 1}`;
}
