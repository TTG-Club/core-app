<script setup lang="ts">
  import type { SourceDetailResponse } from '~sources/types';

  import { UiDetailLayout } from '~ui/detail-layout';
  import { UiGallery } from '~ui/gallery';
  import { MarkupRender } from '~ui/markup';

  import { StatsBlock } from './ui';

  const { source, hideGallery = false } = defineProps<{
    source: SourceDetailResponse;
    hideGallery?: boolean;
  }>();
</script>

<template>
  <UiDetailLayout>
    <template #aside>
      <div class="flex flex-col gap-3">
        <UiGallery
          v-if="!hideGallery && source.image"
          :preview="source.image"
          class="min-w-25 overflow-hidden rounded-md border border-default @min-xl:@max-3xl:max-w-50"
        />

        <StatsBlock
          :type="source.type"
          :publisher="source.publisher"
          :translation="source.translation"
        />
      </div>
    </template>

    <MarkupRender
      v-if="source.description"
      :render-node="source.description"
    />
  </UiDetailLayout>
</template>
