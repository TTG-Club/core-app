<script setup lang="ts">
  import { StatsBlock, DescriptionsBlock } from './ui';

  import type { BeastDetailResponse } from '~/features/bestiary/types';

  defineProps<{
    bestiary: BeastDetailResponse;
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
        <StatsBlock
          :ac="bestiary.AC"
          :hit="bestiary.hit"
          :initiative="bestiary.initiative"
        />
      </AFlex>

      <AFlex
        vertical
        :gap="12"
        flex="1 1 auto"
      >
        <DescriptionsBlock :description="bestiary.description" />
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
