<script setup lang="ts">
  import { COMPONENT_TOOLTIP_TEXT } from '../model';

  import type { SpellDetailResponse } from '~/shared/types';

  defineProps<
    Pick<
      SpellDetailResponse,
      'castingTime' | 'range' | 'duration' | 'components'
    >
  >();
</script>

<template>
  <div :class="$style.stats">
    <div :class="$style.item">
      <span :class="$style.name">Время накладывания:</span>

      <span>{{ castingTime }}</span>
    </div>

    <div :class="$style.item">
      <span :class="$style.name">Дистанция:</span>

      <span>{{ range }}</span>
    </div>

    <div :class="[$style.item, $style.duration]">
      <span :class="$style.name">Длительность:</span>

      <span>{{ duration }}</span>
    </div>

    <div :class="[$style.item, $style.block]">
      <span :class="$style.name">Компоненты:</span>

      <span>
        <ATooltip
          v-if="components.v"
          :title="COMPONENT_TOOLTIP_TEXT.v"
          :mouse-enter-delay="0.7"
          destroy-tooltip-on-hide
        >
          <span>Вербальный</span>

          <span v-if="components.s || components.m">, </span>
        </ATooltip>

        <ATooltip
          v-if="components.s"
          :title="COMPONENT_TOOLTIP_TEXT.s"
          :mouse-enter-delay="0.7"
          destroy-tooltip-on-hide
        >
          <span>Соматический</span>

          <span v-if="components.m">, </span>
        </ATooltip>

        <ATooltip
          v-if="components.m"
          :title="COMPONENT_TOOLTIP_TEXT.m"
          :mouse-enter-delay="0.7"
          destroy-tooltip-on-hide
        >
          <span>Материальный ({{ components.m }})</span>
        </ATooltip>
      </span>
    </div>
  </div>
</template>

<style module lang="scss">
  .stats {
    container-type: inline-size;
    overflow: hidden;
    display: flex;
    flex-wrap: wrap;

    width: 100%;
    min-width: 272px;
    padding: 8px 0;
    border: 1px solid var(--color-border);
    border-radius: 8px;

    background-color: var(--color-bg-secondary);

    .item {
      display: flex;
      flex: 1 0 100%;
      flex-direction: column;

      min-width: 100%;
      padding: 6px 16px;

      @container (width > 600px) {
        flex: 1 0 calc(100% / 3);
        min-width: calc(100% / 3);
        padding: 10px 24px;
      }

      &.block {
        flex: 1 0 100%;
        min-width: 100%;
        border-right: none;
      }

      &.duration {
        border-right: none;
      }

      .name {
        font-weight: 600;
        color: var(--color-text-bold);
      }
    }
  }
</style>
