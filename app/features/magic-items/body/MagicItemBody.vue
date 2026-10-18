<script setup lang="ts">
  import type { MagicItemDetailResponse } from '../model';

  import { UiDetailLayout } from '~ui/detail-layout';
  import { UiGallery } from '~ui/gallery';

  import { DescriptionsBlock, PropertiesBlock, TopBar } from './ui';

  defineProps<{
    magicItem: MagicItemDetailResponse;

    /** Слаги немагической основы для предпросмотра несохранённого предмета. */
    baseItemUrls?: Array<string>;
  }>();
</script>

<template>
  <UiDetailLayout>
    <template #aside>
      <div class="flex flex-col gap-3">
        <TopBar :subtitle="magicItem.subtitle" />

        <div class="max-w-40 overflow-hidden rounded-md border border-default">
          <UiGallery :preview="magicItem.image || '/img/no-img.webp'" />
        </div>

        <PropertiesBlock
          :magic-item
          :base-item-urls
        />
      </div>
    </template>

    <DescriptionsBlock :description="magicItem.description" />
  </UiDetailLayout>
</template>
