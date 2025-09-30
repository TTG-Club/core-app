<script setup lang="ts">
  import { DescriptionsBlock, TopBar } from './ui';

  import type { ItemDetailResponse } from '~/features/items/types';
  import { UiGallery } from '~ui/gallery';
  import StatsBlock from '~items/body/ui/StatsBlock.vue';

  defineProps<{
    item: ItemDetailResponse;
  }>();
</script>

<template>
  <div class="@container flex flex-col gap-4">
    <div class="flex flex-col gap-3 @min-[800px]:flex-row @min-[800px]:gap-7">
      <div class="flex w-full flex-col gap-3 @min-[800px]:max-w-80">
        <TopBar :types="item.types" />

        <StatsBlock
          :cost="item.cost"
          :weight="item.weight"
        />

        <div class="max-w-40 overflow-hidden rounded-md border border-default">
          <UiGallery :preview="item.image || '/img/no-img.webp'" />
        </div>
      </div>

      <div class="flex flex-auto flex-col gap-3">
        <DescriptionsBlock :description="item.description" />
      </div>
    </div>
  </div>
</template>
