<script setup lang="ts">
  import type { Hit } from '~bestiary/types';

  defineProps<{
    ac: string;
    initiative: string;
    hit: Hit;
  }>();
</script>

<template>
  <div :class="$style.stats">
    <div :class="$style.item">
      <ATooltip
        :mouse-enter-delay="0.7"
        destroy-tooltip-on-hide
      >
        <div :class="$style.name">КД:</div>
      </ATooltip>

      <span>{{ ac }}</span>
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
      display: flex;
      flex: 1 0 100%;
      flex-direction: column;
      gap: 4px;

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

      .name {
        font-weight: 500;
        color: var(--color-text-title);
      }
    }
  }
</style>
