<script setup lang="ts">
  import type { LegendItems } from './types';

  defineProps<{
    items: LegendItems;
  }>();
</script>

<template>
  <AFlex
    gap="8"
    vertical
  >
    <span>Легенда:</span>

    <AFlex
      align="center"
      gap="8"
    >
      <ATooltip
        v-for="item in items"
        :key="item.label"
        :mouse-enter-delay="0.5"
        :mouse-leave-delay="0"
        :title="item.title"
        placement="bottom"
      >
        <ATag :class="$style.tag">{{ item.label }}</ATag>
      </ATooltip>
    </AFlex>
  </AFlex>
</template>

<style module>
  .tag {
    cursor: default;
    margin: 0;
  }
</style>
