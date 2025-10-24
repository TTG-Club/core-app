<script setup lang="ts">
  import { TopBar, StatsBlock, DescriptionsBlock } from './ui';

  import type { FeatDetailResponse } from '~/shared/types';

  defineProps<{
    feat: FeatDetailResponse;
  }>();
</script>

<template>
  <div class="@container flex flex-col gap-4">
    <div class="flex flex-col gap-3 @min-3xl:flex-row @min-3xl:gap-7">
      <div class="flex flex-col gap-3 @min-3xl:max-w-80 @min-3xl:min-w-68">
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
