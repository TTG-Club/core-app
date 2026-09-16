/**
 * Формирует стабильный id для умения в списке мультикласса.
 */
export function getIndexedFeatureAnchorId(
  featureKey: string,
  featureIndex: number,
): string {
  return `${featureKey}-${featureIndex + 1}`;
}
