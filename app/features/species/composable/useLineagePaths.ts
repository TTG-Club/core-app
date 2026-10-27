import type { ComputedRef } from 'vue';

import type { SpeciesLinkResponse } from '../model';

/**
 * Что листать свайпом со страницы происхождения: соседние происхождения того
 * же вида, в порядке их списка. У самого вида своего порядка нет — он
 * листает список видов. Происхождения листаются, даже если страница открыта
 * не из списка.
 *
 * @param parentUrl Адрес вида, если открыто происхождение.
 * @returns Адреса происхождений или `undefined`, если открыт сам вид.
 */
export async function useLineagePaths(
  parentUrl: string | undefined,
): Promise<ComputedRef<Array<string> | undefined>> {
  if (!parentUrl) {
    return computed(() => undefined);
  }

  const { data: lineages } = await useAsyncData(
    `species-${parentUrl}-lineage-paths`,
    () =>
      $fetch<Array<SpeciesLinkResponse>>(
        `/api/v2/species/${parentUrl}/lineages/search`,
      ),
  );

  return computed(() =>
    lineages.value
      ? lineages.value.map((lineage) => `/species/${lineage.url}`)
      : undefined,
  );
}
