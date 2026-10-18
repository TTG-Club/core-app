<script setup lang="ts">
  import type { ItemDetailResponse } from '~items/model';

  import { UiDetailLayout } from '~ui/detail-layout';

  import { DescriptionsBlock, StatsBlock, TopBar } from './ui';

  defineProps<{
    item: ItemDetailResponse;
  }>();
</script>

<template>
  <UiDetailLayout>
    <template #aside>
      <div class="flex flex-col gap-3">
        <TopBar :types="item.types" />

        <StatsBlock
          :cost="item.cost"
          :weight="item.weight"
        />
      </div>
    </template>

    <DescriptionsBlock :description="item.description" />
  </UiDetailLayout>
</template>
