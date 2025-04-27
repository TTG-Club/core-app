<script setup lang="ts">
  import type { TooltipProps } from 'ant-design-vue/lib';

  const TOOLTIP_CONFIG: Omit<TooltipProps, 'title'> = {
    mouseEnterDelay: 0.5,
    mouseLeaveDelay: 0,
    placement: 'bottom',
  };
</script>

<template>
  <span>Легенда:</span>

  <ATooltip
    title="Тип источника"
    v-bind="TOOLTIP_CONFIG"
  >
    <ATag :class="$style.tag">Basic</ATag>
  </ATooltip>
</template>

<style module lang="scss">
  .tag {
    cursor: default;
    margin: 0;
  }
</style>
