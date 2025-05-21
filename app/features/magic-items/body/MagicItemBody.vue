<script setup lang="ts">
  import { DescriptionsBlock, TopBar } from './ui';

  import { UiGallery } from '~ui/gallery';

  import type { MagicItemDetailResponse } from '~magic-items/types';

  defineProps<{
    magicItem: MagicItemDetailResponse;
  }>();
</script>

<template>
  <div :class="$style.container">
    <div :class="$style.body">
      <AFlex
        vertical
        :gap="12"
        :class="$style.info"
      >
        <TopBar :subtitle="magicItem.subtitle" />

        <div :class="$style.galleryImg">
          <UiGallery :preview="magicItem.image || '/img/no-img.webp'" />
        </div>
      </AFlex>

      <AFlex
        vertical
        :gap="12"
        flex="1 1 auto"
      >
        <DescriptionsBlock :description="magicItem.description" />
      </AFlex>
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

  .galleryImg {
    overflow: hidden;
    max-width: 160px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
  }
</style>
