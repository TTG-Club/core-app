<script setup lang="ts">
  import { DescriptionsBlock, StatsBlock, TopBar } from './ui';

  import type { ItemDetailResponse } from '~items/types';

  defineProps<{
    item: ItemDetailResponse;
  }>();
</script>

<template>
  <div class="@container flex flex-col gap-4">
    <div class="flex flex-col gap-3 @min-3xl:flex-row @min-3xl:gap-7">
      <div class="flex w-full flex-col gap-3 @min-3xl:max-w-80">
        <TopBar :types="item.types" />

        <StatsBlock
          :cost="item.cost"
          :weight="item.weight"
        />
      </div>

      <div class="flex flex-auto flex-col gap-3">
        <DescriptionsBlock :description="item.description" />
      </div>
    </div>
  </div>
</template>
