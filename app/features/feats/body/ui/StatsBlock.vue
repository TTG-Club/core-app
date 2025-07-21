<script setup lang="ts">
  import { COMPONENT_TOOLTIP_TEXT } from '../model';

  import type { FeatDetailResponse } from '~/shared/types';

  defineProps<Pick<FeatDetailResponse, 'prerequisite'>>();
</script>

<template>
  <div :class="$style.stats">
    <div :class="$style.item">
      <UTooltip :text="COMPONENT_TOOLTIP_TEXT.prerequisite">
        <div :class="$style.name">Предварительное условие:</div>
      </UTooltip>

      <span>{{ prerequisite }}</span>
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
