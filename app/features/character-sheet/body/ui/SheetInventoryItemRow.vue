<script setup lang="ts">
  import type { CharacterInventoryItem } from '../../model';

  const props = defineProps<{
    inventoryItem: CharacterInventoryItem;
  }>();

  const equippedIcon = computed(() =>
    props.inventoryItem.equipped
      ? 'tabler:circle-check-filled'
      : 'tabler:circle',
  );

  const equippedIconClass = computed(() =>
    props.inventoryItem.equipped ? 'text-warning' : 'text-muted',
  );
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-lg border border-default/50 bg-elevated/20 p-3"
  >
    <div
      class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-default/50 bg-default/40"
    >
      <UIcon
        :name="inventoryItem.icon"
        class="size-5 text-muted"
      />
    </div>

    <div class="flex min-w-0 grow flex-col">
      <span class="truncate text-sm font-medium text-highlighted">
        {{ inventoryItem.name }}
      </span>

      <span class="truncate text-xs text-dimmed">
        {{ inventoryItem.category }}
      </span>
    </div>

    <div class="flex shrink-0 items-center gap-1.5">
      <div
        v-for="stat in inventoryItem.stats"
        :key="stat.label"
        class="flex flex-col items-center rounded border border-default/50 bg-default/40 px-2 py-0.5"
      >
        <span class="text-xs font-bold text-highlighted">{{ stat.value }}</span>

        <span class="text-[9px] text-dimmed uppercase">{{ stat.label }}</span>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-1">
      <UButton
        icon="tabler:minus"
        color="neutral"
        variant="ghost"
        size="xs"
        square
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
      />
    </div>

    <UIcon
      :name="equippedIcon"
      class="size-5 shrink-0"
      :class="equippedIconClass"
    />
  </div>
</template>
