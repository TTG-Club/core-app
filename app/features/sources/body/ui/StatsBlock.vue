<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  defineProps<{
    type: string;
    published: string;
    authors: string[];
  }>();
</script>

<template>
  <div :class="$style.stats">
    <div :class="$style.item">
      <span :class="$style.name">Тип:</span>

      <span>{{ type }}</span>
    </div>

    <div :class="$style.item">
      <span :class="$style.name">Дата издания:</span>

      <span>{{ published }}</span>
    </div>

    <div :class="$style.item">
      <span :class="$style.name">Авторы:</span>

      <span><MarkupRender :entries="authors" /> </span>
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
    border: 1px solid var(--ui-border);
    border-radius: 8px;

    background-color: var(--ui-bg-muted);

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
        color: var(--ui-text-bold);
      }
    }
  }
</style>
