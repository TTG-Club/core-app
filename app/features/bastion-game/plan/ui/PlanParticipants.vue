<script setup lang="ts">
  import type { PlanParticipant } from '../../model';

  import { PLAN_LABELS, toCssColor } from '../../model';

  /**
   * Кто ещё сейчас открыл план: кружок цвета его указателя с первой буквой
   * имени, имя — в подсказке.
   */
  const { participants } = defineProps<{
    participants: ReadonlyArray<PlanParticipant>;
  }>();

  const items = computed(() =>
    participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      initial: participant.name.charAt(0).toUpperCase(),
      style: { backgroundColor: toCssColor(participant.color) },
    })),
  );
</script>

<template>
  <div
    v-if="items.length"
    class="flex items-center gap-1"
    :aria-label="PLAN_LABELS.participants"
  >
    <UTooltip
      v-for="participant in items"
      :key="participant.id"
      :text="participant.name"
    >
      <span
        class="flex size-7 items-center justify-center rounded-full text-xs font-semibold text-inverted ring-2 ring-default"
        :style="participant.style"
      >
        {{ participant.initial }}
      </span>
    </UTooltip>
  </div>
</template>
