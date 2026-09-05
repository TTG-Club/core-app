<script setup lang="ts">
  import { SPECIES_VISION_EDITOR } from '../../model';
  import SpeciesEditorSection from './SpeciesEditorSection.vue';

  /** Обычное зрение вида в футах; пусто — не задано. */
  const vision = defineModel<number | undefined>();
</script>

<template>
  <SpeciesEditorSection
    :title="SPECIES_VISION_EDITOR.title"
    icon="tabler:eye"
    :hint="SPECIES_VISION_EDITOR.hint"
  >
    <UFormField name="properties.vision">
      <UInputNumber
        v-model="vision"
        :min="0"
        :max="SPECIES_VISION_EDITOR.max"
        :step="SPECIES_VISION_EDITOR.step"
        class="w-40"
      />
    </UFormField>

    <p class="text-xs text-dimmed">
      {{ SPECIES_VISION_EDITOR.fieldHint }}
    </p>

    <p class="text-xs text-dimmed">
      {{ SPECIES_VISION_EDITOR.sensesHint }}
    </p>
  </SpeciesEditorSection>
</template>
