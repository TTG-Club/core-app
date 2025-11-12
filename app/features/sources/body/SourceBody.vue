<script setup lang="ts">
  import { DescriptionsBlock } from './ui';
  import type { SourceDetailResponse } from '~/features/sources/types';
  import { StatsBlock } from '~sources/body/ui';

  defineProps<{
    source: SourceDetailResponse;
  }>();
</script>

<template>
  <div :class="$style.container">
    <div :class="$style.body">
      <div class="flex w-full flex-col gap-3 @min-[800px]:max-w-80">
        <StatsBlock
          :type="source.type"
          :published="source.published"
          :authors="source.authors"
        />
      </div>

      <div class="flex flex-auto flex-col gap-3">
        <DescriptionsBlock :description="source.description" />
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
  .container {
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 12px;

    @container (width > 800px) {
      flex-direction: row;
      gap: 28px;
    }
  }

  .info {
    width: 100%;
    max-width: 100%;

    @container (width > 800px) {
      max-width: 320px;
    }
  }
</style>
