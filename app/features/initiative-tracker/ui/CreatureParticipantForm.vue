<script setup lang="ts">
  import type {
    CreatureParticipantPayload,
    InitiativeRelationType,
    InitiativeRollMode,
  } from '../model';

  import {
    CREATURE_FORM_DEFAULTS,
    RELATION_TYPE_OPTIONS,
    ROLL_MODE_OPTIONS,
  } from '../model';
  import CreatureSearchSelect from './CreatureSearchSelect.vue';

  defineProps<{
    pending?: boolean;
  }>();

  const emit = defineEmits<{
    add: [payload: CreatureParticipantPayload];
  }>();

  const sourceCreatureId = ref(CREATURE_FORM_DEFAULTS.sourceCreatureId);
  const count = ref(CREATURE_FORM_DEFAULTS.count);

  const relationType = ref<InitiativeRelationType>(
    CREATURE_FORM_DEFAULTS.relationType,
  );

  const rollMode = ref<InitiativeRollMode>(CREATURE_FORM_DEFAULTS.rollMode);
  const rollValue = ref<number | undefined>(CREATURE_FORM_DEFAULTS.rollValue);
  const hpMax = ref<number | undefined>(CREATURE_FORM_DEFAULTS.hpMax);
  const hpCurrent = ref<number | undefined>(CREATURE_FORM_DEFAULTS.hpCurrent);

  const isManualRoll = computed(() => rollMode.value === 'MANUAL');
  const canSubmit = computed(() => Boolean(sourceCreatureId.value));

  function resetForm(): void {
    sourceCreatureId.value = CREATURE_FORM_DEFAULTS.sourceCreatureId;
    count.value = CREATURE_FORM_DEFAULTS.count;
    relationType.value = CREATURE_FORM_DEFAULTS.relationType;
    rollMode.value = CREATURE_FORM_DEFAULTS.rollMode;
    rollValue.value = CREATURE_FORM_DEFAULTS.rollValue;
    hpMax.value = CREATURE_FORM_DEFAULTS.hpMax;
    hpCurrent.value = CREATURE_FORM_DEFAULTS.hpCurrent;
  }

  function emitAdd(): void {
    if (!canSubmit.value) {
      return;
    }

    emit('add', {
      type: 'CREATURE',
      relationType: relationType.value,
      sourceCreatureId: sourceCreatureId.value,
      count: count.value,
      rollMode: rollMode.value,
      rollValue: isManualRoll.value ? rollValue.value : undefined,
      hpMax: hpMax.value,
      hpCurrent: hpCurrent.value,
    });

    resetForm();
  }
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <h2 class="text-lg font-semibold text-highlighted">
        Существа из бестиария
      </h2>
    </template>

    <div class="grid gap-3">
      <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
        <UFormField label="Существо">
          <CreatureSearchSelect v-model="sourceCreatureId" />
        </UFormField>

        <UFormField label="Количество">
          <UInputNumber
            v-model="count"
            :min="1"
          />
        </UFormField>
      </div>

      <div class="grid gap-3 sm:grid-cols-4">
        <UFormField label="Отношение">
          <USelect
            v-model="relationType"
            :items="RELATION_TYPE_OPTIONS"
            value-key="value"
            label-key="label"
          />
        </UFormField>

        <UFormField label="Бросок">
          <USelect
            v-model="rollMode"
            :items="ROLL_MODE_OPTIONS"
            value-key="value"
            label-key="label"
          />
        </UFormField>

        <UFormField label="d20">
          <UInputNumber
            v-model="rollValue"
            :min="1"
            :max="20"
            :disabled="!isManualRoll"
          />
        </UFormField>

        <UFormField label="Макс. хиты">
          <UInputNumber
            v-model="hpMax"
            :min="0"
          />
        </UFormField>
      </div>

      <UFormField label="Текущие хиты">
        <UInputNumber
          v-model="hpCurrent"
          :min="0"
        />
      </UFormField>

      <UAlert
        icon="tabler:copy-plus"
        color="neutral"
        variant="soft"
        title="Нумерацию одинаковых существ сделает сервер"
        description="Например: Гоблин 1, Гоблин 2, Гоблин 3."
      />

      <UButton
        icon="tabler:skull"
        :loading="pending"
        :disabled="!canSubmit"
        @click.left.exact.prevent="emitAdd"
      >
        Добавить существ
      </UButton>
    </div>
  </UCard>
</template>
