<script setup lang="ts">
  import { UiGallery } from '~ui/gallery';

  import { DescriptionsBlock, TopBar } from './ui';

  import type { MagicItemDetailResponse } from '~magic-items/model';

  defineProps<{
    magicItem: MagicItemDetailResponse;
  }>();
</script>

<template>
  <div class="@container flex flex-col gap-4">
    <div class="flex flex-col gap-3 @min-3xl:flex-row @min-3xl:gap-7">
      <div class="flex w-full flex-col gap-3 @min-3xl:max-w-80">
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
