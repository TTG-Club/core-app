<script setup lang="ts">
  import type { PublicationSlot } from '../model';

  import {
    PUBLICATION_DAYS,
    PUBLICATION_DEFAULT_SLOT,
    PUBLICATION_ICONS,
    PUBLICATION_MAX_SLOTS,
    PUBLICATION_TEXT,
  } from '../model';

  const slots = defineModel<PublicationSlot[]>({ required: true });
  const scheduleId = useId();

  const rows = computed(() =>
    slots.value.map((slot, index) => ({
      ...slot,
      dayId: `${scheduleId}-${index}-day`,
      timeId: `${scheduleId}-${index}-time`,
    })),
  );

  const props = defineProps<{ disabled?: boolean }>();

  const cannotAdd = computed(
    () => props.disabled || slots.value.length >= PUBLICATION_MAX_SLOTS,
  );

  /** Добавляет независимый слот расписания. */
  function addSlot(): void {
    slots.value = [...slots.value, { ...PUBLICATION_DEFAULT_SLOT }];
  }

  /** Удаляет выбранный слот без изменения остальных. */
  function removeSlot(index: number): void {
    slots.value = slots.value.filter((slot, slotIndex) => slotIndex !== index);
  }

  /** Заменяет день в выбранном слоте. */
  function updateDay(index: number, day: number): void {
    slots.value = slots.value.map((slot, slotIndex) =>
      slotIndex === index ? { ...slot, day } : slot,
    );
  }

  /** Заменяет время в выбранном слоте. */
  function updateTime(index: number, time: string | number): void {
    slots.value = slots.value.map((slot, slotIndex) =>
      slotIndex === index ? { ...slot, time: String(time) } : slot,
    );
  }
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(slot, index) in rows"
      :key="index"
      class="grid grid-cols-[minmax(0,1fr)_6rem_2rem] items-center gap-2"
    >
      <USelect
        :id="slot.dayId"
        :name="slot.dayId"
        :model-value="slot.day"
        :items="PUBLICATION_DAYS"
        :aria-label="PUBLICATION_TEXT.day"
        :disabled="disabled"
        class="min-w-0"
        @update:model-value="updateDay(index, $event)"
      />

      <UInput
        :id="slot.timeId"
        :name="slot.timeId"
        autocomplete="off"
        :model-value="slot.time"
        type="time"
        :aria-label="PUBLICATION_TEXT.time"
        :disabled="disabled"
        class="min-w-0"
        @update:model-value="updateTime(index, $event)"
      />

      <UButton
        :icon="PUBLICATION_ICONS.remove"
        color="neutral"
        variant="ghost"
        :aria-label="PUBLICATION_TEXT.removeSlot"
        :disabled="disabled"
        @click.left.exact.prevent="removeSlot(index)"
      />
    </div>

    <UButton
      :icon="PUBLICATION_ICONS.add"
      data-invalid-focus
      color="neutral"
      variant="soft"
      :disabled="cannotAdd"
      @click.left.exact.prevent="addSlot"
      >{{ PUBLICATION_TEXT.addSlot }}</UButton
    >
  </div>
</template>
