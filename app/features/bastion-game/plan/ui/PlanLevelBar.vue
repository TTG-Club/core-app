<script setup lang="ts">
  import { getLevelLabel, PLAN_LABELS } from '../../model';

  /**
   * Этажи плана: переключатель, добавление этажа выше и подвала, удаление
   * пустого крайнего этажа.
   */
  const { levels, canEdit, canRemove } = defineProps<{
    /** Уровни по возрастанию. */
    levels: ReadonlyArray<number>;
    canEdit: boolean;
    /** Можно ли убрать текущий этаж. */
    canRemove: boolean;
  }>();

  const level = defineModel<number>('level', { required: true });

  const emit = defineEmits<{
    add: [direction: 'up' | 'down'];
    remove: [];
  }>();

  const items = computed(() =>
    [...levels].reverse().map((value) => ({
      label: getLevelLabel(value),
      value,
    })),
  );

  /** Меню «Этажи»: добавить сверху или снизу, убрать крайний пустой. */
  const menuItems = computed(() => [
    [
      {
        label: PLAN_LABELS.addLevelUp,
        icon: 'tabler:arrow-up',
        onSelect: () => emit('add', 'up'),
      },
      {
        label: PLAN_LABELS.addLevelDown,
        icon: 'tabler:arrow-down',
        onSelect: () => emit('add', 'down'),
      },
    ],
    [
      {
        label: canRemove
          ? PLAN_LABELS.removeLevel
          : PLAN_LABELS.removeLevelHint,
        icon: 'tabler:trash',
        color: 'error' as const,
        disabled: !canRemove,
        onSelect: () => emit('remove'),
      },
    ],
  ]);
</script>

<template>
  <div class="flex items-center gap-1">
    <USelect
      id="plan-level"
      v-model="level"
      :items="items"
      value-key="value"
      :aria-label="PLAN_LABELS.level"
      size="sm"
      class="w-32"
    />

    <UDropdownMenu
      v-if="canEdit"
      :items="menuItems"
    >
      <UButton
        icon="tabler:plus"
        color="neutral"
        variant="outline"
        size="sm"
      >
        {{ PLAN_LABELS.levelsMenu }}
      </UButton>
    </UDropdownMenu>
  </div>
</template>
