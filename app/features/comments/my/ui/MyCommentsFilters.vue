<script setup lang="ts">
  import type { MyCommentsFilter } from '../../model';

  import { MY_COMMENTS_FILTER_TILES } from '../../model';

  /** Оформление выбранной плитки. */
  const ACTIVE_TILE_CLASS =
    'border-primary bg-primary/10 ring-1 ring-primary/50';

  /** Оформление невыбранной плитки. */
  const TILE_CLASS =
    'border-default bg-elevated/50 hover:border-accented hover:bg-elevated';

  const props = defineProps<{
    /** Сколько ответов появилось после отметки просмотра */
    newReplyCount: number;
  }>();

  const filter = defineModel<MyCommentsFilter>({ required: true });

  /**
   * Число на плитке есть только у «Новых ответов»: его считает сводка. Общее
   * число комментариев и число ответивших пришлось бы спрашивать отдельными
   * запросами ради цифры, которая ничего не решает.
   */
  const tiles = computed(() =>
    MY_COMMENTS_FILTER_TILES.map((tile) => ({
      ...tile,
      count: tile.value === 'NEW_REPLIES' ? props.newReplyCount : 0,
      isActive: filter.value === tile.value,
    })),
  );

  /**
   * Переключает фильтр списка.
   *
   * @param value Выбранный фильтр.
   */
  function selectFilter(value: MyCommentsFilter): void {
    filter.value = value;
  }

  /**
   * Оформление плитки по её состоянию.
   *
   * @param isActive Выбрана ли плитка.
   */
  function resolveTileClass(isActive: boolean): string {
    return isActive ? ACTIVE_TILE_CLASS : TILE_CLASS;
  }
</script>

<template>
  <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
    <button
      v-for="tile in tiles"
      :key="tile.value"
      type="button"
      :aria-pressed="tile.isActive"
      class="flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors"
      :class="resolveTileClass(tile.isActive)"
      @click.left.exact.prevent="selectFilter(tile.value)"
    >
      <span class="text-sm leading-tight text-highlighted">
        {{ tile.label }}
      </span>

      <UBadge
        v-if="tile.count > 0"
        color="primary"
        variant="solid"
        size="sm"
        class="tabular-nums"
      >
        {{ tile.count }}
      </UBadge>
    </button>
  </div>
</template>
