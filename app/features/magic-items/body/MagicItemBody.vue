<script setup lang="ts">
  import { DescriptionsBlock, TopBar } from './ui';

  import { UiGallery } from '~ui/gallery';

  import type { MagicItemDetailResponse } from '~magic-items/types';

  defineProps<{
    magicItem: MagicItemDetailResponse;
  }>();
</script>

<template>
  <div class="@container flex flex-col gap-4">
    <div class="flex flex-col gap-3 @min-[800px]:flex-row @min-[800px]:gap-7">
      <div class="flex w-full flex-col gap-3 @min-[800px]:max-w-80">
        <TopBar :subtitle="magicItem.subtitle" />

        <div class="max-w-40 overflow-hidden rounded-md border border-default">
          <UiGallery :preview="magicItem.image || '/img/no-img.webp'" />
        </div>
      </div>

      <div class="flex flex-auto flex-col gap-3">
        <DescriptionsBlock :description="magicItem.description" />
      </div>
    </div>
  </div>
</template>
