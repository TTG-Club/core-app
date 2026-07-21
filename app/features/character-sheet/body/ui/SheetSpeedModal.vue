<script setup lang="ts">
  import { useCharacterSheet } from '../../composables';
  import {
    SPEED_MODAL_ORDER,
    SPEED_TYPE_LABELS,
    SPEED_UNIT_OPTIONS,
    SPEED_VALUE_MAX,
    SPEED_VALUE_MIN,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setSpeed } = useCharacterSheet();

  const draftSpeed = ref({
    ...character.value.speed,
    values: { ...character.value.speed.values },
  });

  const speedFields = SPEED_MODAL_ORDER.map((key) => ({
    key,
    label: SPEED_TYPE_LABELS[key],
  }));

  function handleApply() {
    setSpeed(draftSpeed.value);
    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal title="Передвижение">
    <template #body>
      <div class="flex flex-col gap-3">
        <div
          v-for="field in speedFields"
          :key="field.key"
          class="flex items-center justify-between gap-4"
        >
          <span class="text-sm text-toned">{{ field.label }}</span>

          <div class="flex items-center gap-3">
            <UInputNumber
              v-model="draftSpeed.values[field.key]"
              :min="SPEED_VALUE_MIN"
              :max="SPEED_VALUE_MAX"
              class="w-40"
            />

            <UCheckbox
              v-if="field.key === 'fly'"
              v-model="draftSpeed.hover"
              label="Парение"
            />
          </div>
        </div>

        <USeparator class="my-1" />

        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">Единицы</span>

          <USelect
            v-model="draftSpeed.unit"
            :items="SPEED_UNIT_OPTIONS"
            class="w-40"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Отмена"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          label="Применить"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
