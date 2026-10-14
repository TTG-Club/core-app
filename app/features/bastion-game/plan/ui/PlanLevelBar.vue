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

  const removeHint = computed(() =>
    canRemove ? PLAN_LABELS.removeLevel : PLAN_LABELS.removeLevelHint,
  );
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

    <template v-if="canEdit">
      <UTooltip :text="PLAN_LABELS.addLevelUp">
        <UButton
          icon="tabler:arrow-bar-to-up"
          :aria-label="PLAN_LABELS.addLevelUp"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="emit('add', 'up')"
        />
      </UTooltip>

      <UTooltip :text="PLAN_LABELS.addLevelDown">
        <UButton
          icon="tabler:arrow-bar-to-down"
          :aria-label="PLAN_LABELS.addLevelDown"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="emit('add', 'down')"
        />
      </UTooltip>

      <UTooltip :text="removeHint">
        <UButton
          icon="tabler:trash"
          :aria-label="PLAN_LABELS.removeLevel"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="!canRemove"
          @click.left.exact.prevent="emit('remove')"
        />
      </UTooltip>
    </template>
  </div>
</template>
