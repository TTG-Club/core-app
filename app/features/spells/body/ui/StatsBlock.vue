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
        <UTooltip
          v-if="components.v"
          :text="COMPONENT_TOOLTIP_TEXT.v"
          disable-hoverable-content
        >
          <span>
            <span>Вербальный</span>

            <span v-if="components.s || components.m">, </span>
          </span>
        </UTooltip>

        <UTooltip
          v-if="components.s"
          :text="COMPONENT_TOOLTIP_TEXT.s"
          disable-hoverable-content
        >
          <span>
            <span>Соматический</span>

            <span v-if="components.m">, </span>
          </span>
        </UTooltip>

        <UTooltip
          v-if="components.m"
          :text="COMPONENT_TOOLTIP_TEXT.m"
          disable-hoverable-content
        >
          <span> Материальный ({{ components.m }}) </span>
        </UTooltip>
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
