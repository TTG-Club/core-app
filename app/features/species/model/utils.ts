import type { SpeciesFeatureCreate } from './types';

/**
 * Сколько блоков механики умения заполнено: дары, правки листа, заклинания и
 * эффекты считаются блоками, а не строками. Числом подписывается свёрнутое
 * умение — без пометки автор не видит, какие умения настроены, и раскрывает их
 * по одному.
 *
 * @param feature умение формы вида.
 * @returns число непустых блоков.
 */
export function getFeatureFilledBlocksCount(
  feature: SpeciesFeatureCreate,
): number {
  return [
    feature.editorRows?.grants.length ?? 0,
    feature.editorRows?.modifiers.length ?? 0,
    feature.grantedSpells.length,
    feature.activeEffects.length,
  ].filter(Boolean).length;
}

/**
 * Подпись уровня в шапке свёрнутого умения. Показывается только для умений,
 * открывающихся позже первого уровня: с первого действует большинство, и бейдж
 * на каждом умении был бы шумом.
 *
 * @param level уровень умения; пусто или 1 — с первого.
 * @returns подпись бейджа либо `undefined`, когда бейдж не нужен.
 */
export function getSpeciesFeatureLevelBadge(
  level: number | undefined,
): string | undefined {
  return level !== undefined && level > 1 ? `С ${level} уровня` : undefined;
}
