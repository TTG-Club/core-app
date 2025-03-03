<script setup lang="ts">
  import type { SpellDetail } from '~/shared/types';
  import { COMPONENT_TOOLTIP_TEXT } from '../model';

  defineProps<
    Pick<SpellDetail, 'castingTime' | 'range' | 'duration' | 'components'>
  >();
</script>

<template>
  <div :class="$style.stats">
    <div :class="$style.item">
      <p>Время накладывания:</p>

      <span>{{ castingTime }}</span>
    </div>

    <div :class="$style.item">
      <p>Дистанция:</p>

      <span>{{ range }}</span>
    </div>

    <div :class="[$style.item, $style.duration]">
      <p>Длительность:</p>

      <span>{{ duration }}</span>
    </div>

    <div :class="[$style.item, $style.block]">
      <p>Компоненты:</p>

      <ATooltip
        v-if="components.v"
        :title="COMPONENT_TOOLTIP_TEXT.v"
        :mouse-enter-delay="0.7"
      >
        <span>Вербальный</span>

        <span v-if="components.s || components.m">, </span>
      </ATooltip>

      <ATooltip
        v-if="components.s"
        :title="COMPONENT_TOOLTIP_TEXT.s"
        :mouse-enter-delay="0.7"
      >
        <span>Соматический</span>

        <span v-if="components.m">, </span>
      </ATooltip>

      <ATooltip
        v-if="components.m"
        :title="COMPONENT_TOOLTIP_TEXT.m"
        :mouse-enter-delay="0.7"
      >
        <span>Материальный ({{ components.m }})</span>
      </ATooltip>
    </div>
  </div>
</template>

<style module lang="scss">
  .stats {
    container-type: inline-size;
    overflow: hidden;
    display: flex;
    flex-wrap: wrap;

    border: 1px solid var(--color-border);
    border-radius: 8px;

    .item {
      flex: 1 0 50%;

      min-width: 50%;
      margin-right: -1px;
      margin-bottom: -1px;
      padding: 10px 16px;
      border-right: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);

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

      p {
        margin-bottom: 4px;
        font-weight: 500;
        color: var(--color-text-title);
      }
    }
  }
</style>
