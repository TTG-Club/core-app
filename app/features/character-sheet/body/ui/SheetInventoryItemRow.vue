<script setup lang="ts">
  import type { CharacterInventoryItem } from '../../model';

  import { INVENTORY_CATEGORY_ICONS, WEIGHT_UNIT_LABEL } from '../../model';

  const props = defineProps<{
    inventoryItem: CharacterInventoryItem;
  }>();

  const emit = defineEmits<{
    preview: [];
    remove: [];
    adjust: [delta: number];
  }>();

  const categoryIcon = computed(
    () => INVENTORY_CATEGORY_ICONS[props.inventoryItem.category],
  );

  /** Плитки параметров предмета: стоимость и вес, если они известны. */
  const displayStats = computed(() => {
    const stats: Array<{ label: string; value: string }> = [];

    if (props.inventoryItem.cost) {
      stats.push({ label: 'Цена', value: props.inventoryItem.cost });
    }

    if (props.inventoryItem.weight > 0) {
      stats.push({
        label: WEIGHT_UNIT_LABEL,
        value: String(props.inventoryItem.weight),
      });
    }

    return stats;
  });

  const isDecreaseDisabled = computed(() => props.inventoryItem.quantity <= 1);

  function handleDecrease() {
    emit('adjust', -1);
  }

  function handleIncrease() {
    emit('adjust', 1);
  }
</script>

<template>
  <div
    class="group/item relative flex items-center gap-3 rounded-lg border border-default/50 bg-elevated/20 p-3 transition-colors hover:border-warning/60"
  >
    <button
      type="button"
      class="flex min-w-0 grow cursor-pointer items-center gap-3 text-left after:absolute after:inset-0 after:cursor-pointer"
      :aria-label="`Открыть предмет: ${inventoryItem.name}`"
      @click.left.exact.prevent="emit('preview')"
    >
      <span
        class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-default/50 bg-default/40"
      >
        <UIcon
          :name="categoryIcon"
          class="size-5 text-muted"
        />
      </span>

      <span class="flex min-w-0 grow flex-col">
        <span class="truncate text-sm font-medium text-highlighted">
          {{ inventoryItem.name }}
        </span>

        <span
          v-if="inventoryItem.typesLabel"
          class="truncate text-xs text-dimmed"
        >
          {{ inventoryItem.typesLabel }}
        </span>
      </span>
    </button>

    <div class="flex shrink-0 items-center gap-1.5">
      <div
        v-for="stat in displayStats"
        :key="stat.label"
        class="flex flex-col items-center rounded border border-default/50 bg-default/40 px-2 py-0.5"
      >
        <span class="text-xs font-bold text-highlighted">{{ stat.value }}</span>

        <span class="text-[9px] text-dimmed uppercase">{{ stat.label }}</span>
      </div>
    </div>

    <div class="relative z-10 flex shrink-0 items-center gap-1">
      <UButton
        icon="tabler:minus"
        color="neutral"
        variant="ghost"
        size="xs"
        square
        :disabled="isDecreaseDisabled"
        :aria-label="`Уменьшить количество: ${inventoryItem.name}`"
        @click.left.exact.prevent="handleDecrease"
      />

      <span class="w-6 text-center text-sm font-medium text-default">
        {{ inventoryItem.quantity }}
      </span>

      <UButton
        icon="tabler:plus"
        color="neutral"
        variant="ghost"
        size="xs"
        square
        :aria-label="`Увеличить количество: ${inventoryItem.name}`"
        @click.left.exact.prevent="handleIncrease"
      />
    </div>

    <UButton
      icon="tabler:trash"
      color="error"
      variant="ghost"
      size="xs"
      square
      class="relative z-10 shrink-0 opacity-0 transition-opacity group-hover/item:opacity-100 focus-visible:opacity-100"
      :aria-label="`Убрать предмет: ${inventoryItem.name}`"
      @click.left.exact.prevent="emit('remove')"
    />
  </div>
</template>
