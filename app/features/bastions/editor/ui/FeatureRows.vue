<script setup lang="ts">
  import type { FacilityFeatureForm } from '../../model';

  import { BASTION_EDITOR_LABELS, EMPTY_FEATURE } from '../../model';
  import EditorRowsCard from './EditorRowsCard.vue';

  /** Постоянные свойства сооружения. */
  const model = defineModel<Array<FacilityFeatureForm>>({ required: true });

  /** Добавляет пустое свойство. */
  function addFeature(): void {
    model.value = [...model.value, { ...EMPTY_FEATURE }];
  }

  /**
   * Удаляет свойство.
   *
   * @param index - Номер строки
   */
  function removeFeature(index: number): void {
    model.value = model.value.filter((_, position) => position !== index);
  }
</script>

<template>
  <EditorRowsCard
    :title="BASTION_EDITOR_LABELS.featuresTitle"
    :hint="BASTION_EDITOR_LABELS.featuresHint"
    :empty="BASTION_EDITOR_LABELS.featuresEmpty"
    :add-label="BASTION_EDITOR_LABELS.addFeature"
    :count="model.length"
    @add="addFeature"
  >
    <div
      v-for="(feature, index) in model"
      :key="index"
      class="grid grid-cols-1 items-end gap-3 rounded-lg bg-elevated/40 p-2 md:grid-cols-24"
    >
      <UFormField
        class="md:col-span-23"
        :label="BASTION_EDITOR_LABELS.featureName"
      >
        <UInput
          v-model="feature.name"
          class="w-full"
        />
      </UFormField>

      <div class="flex justify-end md:col-span-1">
        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          :aria-label="BASTION_EDITOR_LABELS.remove"
          @click.left.exact.prevent="removeFeature(index)"
        />
      </div>

      <UFormField
        class="md:col-span-24"
        :label="BASTION_EDITOR_LABELS.featureDescription"
      >
        <UTextarea
          v-model="feature.description"
          :rows="2"
          autoresize
          class="w-full"
        />
      </UFormField>
    </div>
  </EditorRowsCard>
</template>
