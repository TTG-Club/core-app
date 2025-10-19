<script setup lang="ts">
  import { TopBar, StatsBlock, DescriptionsBlock } from './ui';

  import type { FeatDetailResponse } from '~/shared/types';

  defineProps<{
    feat: FeatDetailResponse;
  }>();
</script>

<template>
  <div class="@container flex flex-col gap-4">
    <div class="flex flex-col gap-3 @min-[800px]:flex-row @min-[800px]:gap-7">
      <div
        class="flex flex-col gap-3 @min-[800px]:max-w-80 @min-[800px]:min-w-[272px]"
      >
        <TopBar :category="feat.category" />

        <StatsBlock
          v-if="feat.prerequisite"
          :prerequisite="feat.prerequisite"
        />
      </div>

      <div class="flex flex-auto flex-col gap-3">
        <DescriptionsBlock :description="feat.description" />
      </div>
    </div>
  </div>
</template>
