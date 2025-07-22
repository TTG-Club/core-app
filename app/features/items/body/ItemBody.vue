<script setup lang="ts">
  import { DescriptionsBlock, TopBar } from './ui';

  import StatsBlock from '~items/body/ui/StatsBlock.vue';

  import type { ItemDetailResponse } from '~items/types';

  defineProps<{
    item: ItemDetailResponse;
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
        <TopBar :types="item.types" />

        <StatsBlock
          :cost="item.cost"
          :weight="item.weight"
        />
      </AFlex>

      <AFlex
        vertical
        :gap="12"
        flex="1 1 auto"
      >
        <DescriptionsBlock :description="item.description" />
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
