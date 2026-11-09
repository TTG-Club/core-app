<script setup lang="ts">
  import type { FilterGroups } from '../types';
  import type { ActiveFilterChip } from '../utils';

  import {
    FILTER_ACTIVE_CHIP_REMOVE_ICON,
    FILTER_ACTIVE_CHIP_REMOVE_LABEL,
  } from '../model';
  import { getActiveFilterChips, removeActiveFilterChip } from '../utils';

  /**
   * Выбранные значения фильтра плашками над списком: видно, что отобрано,
   * когда сами фильтры спрятаны за кнопкой. Крестик снимает одно значение.
   */
  const { groups } = defineProps<{
    groups: FilterGroups;
  }>();

  const emit = defineEmits<{
    /** Новые группы после снятия значения */
    (event: 'update', groups: FilterGroups): void;
  }>();

  const chips = computed(() => getActiveFilterChips(groups));

  /**
   * Снимает значение плашки и отдаёт новые группы.
   *
   * @param chip Снимаемая плашка.
   */
  function handleRemove(chip: ActiveFilterChip): void {
    emit('update', removeActiveFilterChip(groups, chip));
  }

  /**
   * Подпись крестика для экранных читалок: что именно снимается.
   *
   * @param chip Плашка.
   * @returns Подпись кнопки.
   */
  function getRemoveLabel(chip: ActiveFilterChip): string {
    return `${FILTER_ACTIVE_CHIP_REMOVE_LABEL}: ${chip.label}`;
  }

  /**
   * Цвет плашки: исключение — красное, как счётчик группы.
   *
   * @param chip Плашка.
   * @returns Цвет кнопки.
   */
  function getChipColor(chip: ActiveFilterChip): 'error' | 'primary' {
    return chip.isExcluded ? 'error' : 'primary';
  }
</script>

<template>
  <div
    v-if="chips.length"
    class="flex flex-wrap gap-1.5"
  >
    <UButton
      v-for="chip in chips"
      :key="`${chip.groupKey}:${chip.itemId}`"
      :label="chip.label"
      :color="getChipColor(chip)"
      :trailing-icon="FILTER_ACTIVE_CHIP_REMOVE_ICON"
      :aria-label="getRemoveLabel(chip)"
      variant="soft"
      size="xs"
      @click.left.exact.prevent="handleRemove(chip)"
    />
  </div>
</template>
