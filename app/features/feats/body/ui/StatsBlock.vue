<script setup lang="ts">
  import type { FeatDetailResponse } from '~/shared/types';
  import { COMPONENT_TOOLTIP_TEXT } from '../model';
  import { MarkupRender } from '~ui/markup';

  defineProps<Pick<FeatDetailResponse, 'prerequisite'>>();
</script>

<template>
  <div :class="$style.stats">
    <div :class="$style.item">
      <ATooltip
        :title="COMPONENT_TOOLTIP_TEXT.prerequisite"
        :mouse-enter-delay="0.7"
        destroy-tooltip-on-hide
      >
        <p>Предварительное условие:</p>
      </ATooltip>

      <MarkupRender :entries="prerequisite" />
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
    border: 1px solid var(--color-border);
    border-radius: 8px;

    background-color: var(--color-bg-secondary);

    .item {
      flex: 1 0 100%;
      min-width: 100%;
      padding: 10px 16px;

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
