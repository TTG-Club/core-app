import type { FeatGrantedSpellRef } from '~feats/model';

import type { SpeciesFeatureCreate } from './types';

import { SPECIES_FEATURE_LEVEL_BADGE } from './constants';

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
    feature.editorRows?.counters.length ?? 0,
    feature.editorRows?.spellChoice.picks.length ?? 0,
    feature.mechanics?.spellList.groups.length ?? 0,
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
  if (level === undefined || level <= 1) {
    return undefined;
  }

  return `${SPECIES_FEATURE_LEVEL_BADGE.prefix}${level}${SPECIES_FEATURE_LEVEL_BADGE.suffix}`;
}

/**
 * Отметка «Подготавливать не нужно» у заклинаний умения вида. Врождённая
 * магия вида подготовки не требует, поэтому отметка стоит, пока запись прямо
 * не сняла её у заклинаний.
 *
 * @param spells выданные заклинания умения.
 * @returns `true`, если готовить заклинания не нужно.
 */
export function readSpeciesSpellsAlwaysPrepared(
  spells: ReadonlyArray<FeatGrantedSpellRef>,
): boolean {
  return spells.every((spell) => spell.alwaysPrepared !== false);
}

/**
 * Ставит отметку «Подготавливать не нужно» всему списку умения: отметка одна
 * на умение, как в системе. Пишется только снятая — без поля заклинание вида
 * и так всегда подготовлено.
 *
 * @param spells выданные заклинания умения.
 * @param alwaysPrepared отметка «Подготавливать не нужно».
 * @returns заклинания с отметкой.
 */
export function writeSpeciesSpellsAlwaysPrepared(
  spells: ReadonlyArray<FeatGrantedSpellRef>,
  alwaysPrepared: boolean,
): Array<FeatGrantedSpellRef> {
  return spells.map((spell) => ({
    ...spell,
    alwaysPrepared: alwaysPrepared ? undefined : false,
  }));
}
