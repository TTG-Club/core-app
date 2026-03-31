<script setup lang="ts">
  import type { SourceDetailResponse } from '~sources/types';

  defineProps<
    Pick<SourceDetailResponse, 'type' | 'publisher' | 'translation'>
  >();
</script>

<template>
  <div :class="$style.stats">
    <div
      v-if="type"
      :class="$style.item"
    >
      <span :class="$style.name">Тип:</span>

      <span>{{ type }}</span>
    </div>

    <template v-if="publisher?.date || publisher?.name">
      <div
        v-if="publisher.name"
        :class="$style.item"
      >
        <span :class="$style.name">Издатель:</span>

        <span>{{ publisher.name }}</span>
      </div>

      <div
        v-if="publisher.date"
        :class="$style.item"
      >
        <span :class="$style.name">Дата издания:</span>

        <NuxtTime
          :datetime="publisher.date"
          locale="ru-RU"
        />
      </div>
    </template>

    <template v-if="translation?.authors || translation?.date">
      <div
        v-if="translation.authors"
        :class="$style.item"
      >
        <span :class="$style.name">Перевод:</span>

        <span>{{ translation.authors }}</span>
      </div>

      <div
        v-if="translation.date"
        :class="$style.item"
      >
        <span :class="$style.name">Дата перевода:</span>

        <NuxtTime
          :datetime="translation.date"
          locale="ru-RU"
        />
      </div>
    </template>
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
