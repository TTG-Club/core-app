<script setup lang="ts">
  import type { FeatDetailResponse } from '~/shared/types';
  import {
    TopBar,
    StatsBlock,
    DescriptionsBlock,
  } from './ui';

  defineProps<{
    spell: FeatDetailResponse;
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
        <TopBar
          :additional-type="spell.additionalType"
          :ritual="spell.ritual"
          :school="spell.school"
          :level="spell.level"
        />

        <StatsBlock
          :casting-time="spell.castingTime"
          :components="spell.components"
          :duration="spell.duration"
          :range="spell.range"
        />
      </AFlex>

      <AFlex
        vertical
        :gap="12"
        flex="1 1 auto"
      >
        <DescriptionsBlock
          :description="spell.description"
          :level="spell.level"
          :upper="spell.upper"
        />

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
