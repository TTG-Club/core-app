<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  defineProps<{
    abilityScores: string;
    feat: string;
    skillProficiencies: string;
    toolProficiency: string;
    equipment: string[];
  }>();
</script>

<template>
  <div :class="$style.stats">
    <div :class="$style.item">
      <div :class="$style.name">Характеристики:</div>

      <span>{{ abilityScores }}</span>
    </div>

    <div :class="$style.item">
      <span :class="$style.name">Черта:</span>

      <span>{{ feat }}</span>
    </div>

    <div :class="$style.item">
      <span :class="$style.name">Навыки:</span>

      <span>{{ skillProficiencies }}</span>
    </div>

    <div :class="$style.item">
      <span :class="$style.name">Владение инструментами:</span>

      <span>{{ toolProficiency }}</span>
    </div>

    <div :class="[$style.item, $style.block]">
      <span :class="$style.name">Снаряжение:</span>

      <MarkupRender :entries="equipment" />
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
