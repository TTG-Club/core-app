import type { VttgDocsChannel } from '#shared/consts';

import { parseVttgDocsChannel } from '#shared/utils';

import {
  fetchVttgDocsIndex,
  getVttgDocsIndexDataKey,
  getVttgDocsLoadFailure,
} from '../model';

/**
 * Канал документации из адреса страницы (`?channel=dev`); без него — релиз.
 */
export function useVttgDocsChannel(): ComputedRef<VttgDocsChannel> {
  const route = useRoute();

  return computed(() => parseVttgDocsChannel(route.query.channel));
}

/**
 * Оглавление канала документации и каналы, доступные посетителю. Ключ данных
 * включает канал: при переключении канала оглавление перечитывается, а
 * вернувшись, берётся из уже загруженного.
 *
 * @param channel канал документации
 */
export async function useVttgDocsIndex(channel: Ref<VttgDocsChannel>) {
  const requestFetch = useRequestFetch();

  const {
    data: indexResponse,
    status: indexStatus,
    error: indexError,
    refresh,
  } = await useAsyncData(
    () => getVttgDocsIndexDataKey(channel.value),
    () => fetchVttgDocsIndex(requestFetch, channel.value),
  );

  const index = computed(() => indexResponse.value?.index ?? null);

  const channels = computed(() => indexResponse.value?.channels ?? []);

  const failure = computed(() =>
    indexError.value ? getVttgDocsLoadFailure(indexError.value) : null,
  );

  const isLoading = computed(() => indexStatus.value === 'pending');

  return { index, channels, failure, isLoading, refresh };
}
