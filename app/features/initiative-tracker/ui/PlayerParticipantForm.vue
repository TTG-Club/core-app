<script setup lang="ts">
  import type {
    InitiativeRelationType,
    InitiativeRollMode,
    PlayerParticipantPayload,
  } from '../model';

  import {
    PLAYER_FORM_DEFAULTS,
    RELATION_TYPE_OPTIONS,
    ROLL_MODE_OPTIONS,
  } from '../model';

  defineProps<{
    pending?: boolean;
  }>();

  const emit = defineEmits<{
    add: [payload: PlayerParticipantPayload];
  }>();

  const relationType = ref<InitiativeRelationType>(
    PLAYER_FORM_DEFAULTS.relationType,
  );

  const name = ref(PLAYER_FORM_DEFAULTS.name);
  const level = ref(PLAYER_FORM_DEFAULTS.level);
  const hpMax = ref(PLAYER_FORM_DEFAULTS.hpMax);
  const hpCurrent = ref(PLAYER_FORM_DEFAULTS.hpCurrent);
  const hpTemporary = ref(PLAYER_FORM_DEFAULTS.hpTemporary);
  const initiativeBonus = ref(PLAYER_FORM_DEFAULTS.initiativeBonus);
  const dexterityBonus = ref(PLAYER_FORM_DEFAULTS.dexterityBonus);
  const rollMode = ref<InitiativeRollMode>(PLAYER_FORM_DEFAULTS.rollMode);
  const rollValue = ref<number | undefined>(PLAYER_FORM_DEFAULTS.rollValue);

  const isManualRoll = computed(() => rollMode.value === 'MANUAL');
  const canSubmit = computed(() => name.value.trim().length > 0);

  function resetForm(): void {
    name.value = PLAYER_FORM_DEFAULTS.name;
    level.value = PLAYER_FORM_DEFAULTS.level;
    hpMax.value = PLAYER_FORM_DEFAULTS.hpMax;
    hpCurrent.value = PLAYER_FORM_DEFAULTS.hpCurrent;
    hpTemporary.value = PLAYER_FORM_DEFAULTS.hpTemporary;
    initiativeBonus.value = PLAYER_FORM_DEFAULTS.initiativeBonus;
    dexterityBonus.value = PLAYER_FORM_DEFAULTS.dexterityBonus;
    rollMode.value = PLAYER_FORM_DEFAULTS.rollMode;
    rollValue.value = PLAYER_FORM_DEFAULTS.rollValue;
  }

  function emitAdd(): void {
    if (!canSubmit.value) {
      return;
    }

    emit('add', {
      type: 'PLAYER',
      relationType: relationType.value,
      name: name.value.trim(),
      level: level.value,
      hpMax: hpMax.value,
      hpCurrent: hpCurrent.value,
      hpTemporary: hpTemporary.value,
      initiativeBonus: initiativeBonus.value,
      dexterityBonus: dexterityBonus.value,
      rollMode: rollMode.value,
      rollValue: isManualRoll.value ? rollValue.value : undefined,
    });

    resetForm();
  }
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <h2 class="text-lg font-semibold text-highlighted">Персонаж игрока</h2>
    </template>

    <div class="grid gap-3">
      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField label="Имя персонажа">
          <UInput v-model="name" />
        </UFormField>

        <UFormField label="Отношение">
          <USelect
            v-model="relationType"
            :items="RELATION_TYPE_OPTIONS"
            value-key="value"
            label-key="label"
          />
        </UFormField>
      </div>

      <div class="grid gap-3 sm:grid-cols-4">
        <UFormField label="Уровень">
          <UInputNumber
            v-model="level"
            :min="1"
          />
        </UFormField>

        <UFormField label="Макс. хиты">
          <UInputNumber
            v-model="hpMax"
            :min="0"
          />
        </UFormField>

        <UFormField label="Текущие">
          <UInputNumber
            v-model="hpCurrent"
            :min="0"
          />
        </UFormField>

        <UFormField label="Временные">
          <UInputNumber
            v-model="hpTemporary"
            :min="0"
          />
        </UFormField>
      </div>

      <div class="grid gap-3 sm:grid-cols-4">
        <UFormField label="Бонус инициативы">
          <UInputNumber v-model="initiativeBonus" />
        </UFormField>

        <UFormField label="Бонус Ловкости">
          <UInputNumber v-model="dexterityBonus" />
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
      </div>

      <UButton
        icon="tabler:user-plus"
        :loading="pending"
        :disabled="!canSubmit"
        @click.left.exact.prevent="emitAdd"
      >
        Добавить персонажа
      </UButton>
    </div>
  </UCard>
</template>
