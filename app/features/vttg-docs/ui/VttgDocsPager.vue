<script setup lang="ts">
  import type { VttgDocsChannel } from '#shared/consts';
  import type { VttgDocsPageLink } from '#shared/types';

  import { getVttgDocsPageRoute } from '#shared/utils';

  import { VTTG_DOCS_NEXT_LABEL, VTTG_DOCS_PREVIOUS_LABEL } from '../model';

  /** Ссылки на соседние страницы внизу статьи. */
  const { channel, previous, next } = defineProps<{
    channel: VttgDocsChannel;
    previous: VttgDocsPageLink | null;
    next: VttgDocsPageLink | null;
  }>();

  const hasNeighbours = computed(() => Boolean(previous || next));

  /**
   * Адрес соседней страницы.
   *
   * @param pageLink соседняя страница
   */
  function getLinkTarget(pageLink: VttgDocsPageLink) {
    return getVttgDocsPageRoute(channel, pageLink);
  }
</script>

<template>
  <div
    v-if="hasNeighbours"
    class="grid grid-cols-1 gap-3 border-t border-default pt-6 sm:grid-cols-2"
  >
    <UButton
      v-if="previous"
      :to="getLinkTarget(previous)"
      color="neutral"
      variant="outline"
      size="lg"
      icon="tabler:arrow-left"
      class="flex-col items-start gap-0.5"
    >
      <span class="text-xs text-muted">{{ VTTG_DOCS_PREVIOUS_LABEL }}</span>

      <span class="text-highlighted">{{ previous.title }}</span>
    </UButton>

    <UButton
      v-if="next"
      :to="getLinkTarget(next)"
      color="neutral"
      variant="outline"
      size="lg"
      trailing-icon="tabler:arrow-right"
      class="flex-col items-end gap-0.5 text-right sm:col-start-2"
    >
      <span class="text-xs text-muted">{{ VTTG_DOCS_NEXT_LABEL }}</span>

      <span class="text-highlighted">{{ next.title }}</span>
    </UButton>
  </div>
</template>
