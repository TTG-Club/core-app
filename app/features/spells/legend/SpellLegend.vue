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
    title="Заговор"
    v-bind="TOOLTIP_CONFIG"
  >
    <ATag :class="$style.tag">◐</ATag>
  </ATooltip>

  <ATooltip
    title="Концентрация"
    v-bind="TOOLTIP_CONFIG"
  >
    <ATag :class="$style.tag">К</ATag>
  </ATooltip>

  <ATooltip
    title="Ритуал"
    v-bind="TOOLTIP_CONFIG"
  >
    <ATag :class="$style.tag">Р</ATag>
  </ATooltip>

  <ATooltip
    title="Вербальный компонент, Соматический компонент, Материальный компонент"
    v-bind="TOOLTIP_CONFIG"
  >
    <ATag :class="$style.tag"> В С М </ATag>
  </ATooltip>

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
