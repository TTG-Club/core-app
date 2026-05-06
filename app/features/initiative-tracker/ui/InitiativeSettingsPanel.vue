<script setup lang="ts">
  import type { InitiativeTracker, TrackerSettingsPayload } from '../model';

  const props = defineProps<{
    tracker: InitiativeTracker;
    pending?: boolean;
    readonly?: boolean;
  }>();

  const emit = defineEmits<{
    save: [payload: TrackerSettingsPayload];
  }>();

  const title = ref(props.tracker.title);
  const rerollEachRound = ref(props.tracker.rerollEachRound);

  const groupSameCreaturesInitiative = ref(
    props.tracker.groupSameCreaturesInitiative,
  );

  watch(
    () => props.tracker,
    (tracker) => {
      title.value = tracker.title;
      rerollEachRound.value = tracker.rerollEachRound;
      groupSameCreaturesInitiative.value = tracker.groupSameCreaturesInitiative;
    },
  );

  function emitSave(): void {
    emit('save', {
      title: title.value,
      rerollEachRound: rerollEachRound.value,
      groupSameCreaturesInitiative: groupSameCreaturesInitiative.value,
    });
  }
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <h2 class="text-lg font-semibold text-highlighted">Настройки</h2>
    </template>

    <div class="grid gap-4">
      <UFormField label="Название боя">
        <UInput
          v-model="title"
          :disabled="readonly"
        />
      </UFormField>

      <USwitch
        v-model="rerollEachRound"
        label="Перебрасывать инициативу каждый раунд"
        :disabled="readonly"
      />

      <USwitch
        v-model="groupSameCreaturesInitiative"
        label="Одна инициатива для одинаковых существ"
        :disabled="readonly"
      />

      <UButton
        v-if="!readonly"
        icon="tabler:device-floppy"
        :loading="pending"
        @click.left.exact.prevent="emitSave"
      >
        Сохранить настройки
      </UButton>
    </div>
  </UCard>
</template>
