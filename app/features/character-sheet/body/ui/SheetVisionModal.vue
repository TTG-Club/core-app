<script setup lang="ts">
  import { useCharacterSheet } from '../../composables';
  import {
    SPEED_UNIT_OPTIONS,
    VISION_DISTANCE_MAX,
    VISION_DISTANCE_MIN,
    VISION_LABELS,
    VISION_ORDER,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setVision } = useCharacterSheet();

  const draftVision = ref({ ...character.value.vision });

  const visionFields = VISION_ORDER.map((key) => ({
    key,
    label: VISION_LABELS[key],
  }));

  function handleApply() {
    setVision({ ...draftVision.value });
    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal title="Зрение">
    <template #body>
      <div class="flex flex-col gap-3">
        <div
          v-for="field in visionFields"
          :key="field.key"
          class="flex items-center justify-between gap-4"
        >
          <span class="text-sm text-toned">{{ field.label }}</span>

          <UInputNumber
            v-model="draftVision[field.key]"
            :min="VISION_DISTANCE_MIN"
            :max="VISION_DISTANCE_MAX"
            class="w-40"
          />
        </div>

        <USeparator class="my-1" />

        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">Единицы</span>

          <USelect
            v-model="draftVision.unit"
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
