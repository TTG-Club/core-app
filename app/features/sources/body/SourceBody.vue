<script setup lang="ts">
  import type { SourceDetailResponse } from '~sources/types';

  import { UiGallery } from '~ui/gallery';
  import { MarkupRender } from '~ui/markup';

  import { StatsBlock } from './ui';

  const { source, hideGallery = false } = defineProps<{
    source: SourceDetailResponse;
    hideGallery?: boolean;
  }>();
</script>

<template>
  <div class="@container flex flex-col gap-4">
    <div class="flex flex-col gap-3 @min-[800px]:flex-row @min-[800px]:gap-7">
      <UiGallery
        v-if="!hideGallery && source.image"
        :preview="source.image"
        class="min-w-25 @min-xl:@max-3xl:max-w-50"
      />

      <div class="flex w-full flex-col gap-3 @min-[800px]:max-w-80">
        <StatsBlock
          :type="source.type"
          :publisher="source.publisher"
          :translation="source.translation"
        />
      </div>

      <div
        v-if="source?.description"
        class="flex flex-auto flex-col gap-3"
      >
        <MarkupRender :render-node="source.description" />
      </div>
    </div>
  </div>
</template>
