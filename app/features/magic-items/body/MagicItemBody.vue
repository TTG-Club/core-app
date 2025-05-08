<script setup lang="ts">
  import { DescriptionsBlock, TopBar } from './ui';

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
</style>
