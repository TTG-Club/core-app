<script setup lang="ts">
  import type { ToolCreate } from '~items/model';

  import {
    ITEM_ABILITY_OPTIONS,
    ITEM_EDITOR_SECTIONS,
    TOOL_BASE_TYPE_OPTIONS,
    TOOL_CATEGORY_OPTIONS,
    TOOL_FORM_LABELS,
    TOOL_PROFICIENCY_MODE_OPTIONS,
    WEAPON_FORM_LABELS,
  } from '~items/model';
  import { SelectOptional } from '~ui/select';

  const model = defineModel<ToolCreate>({ required: true });

  /**
   * Базовые инструменты выбранной категории. Без категории показываем все:
   * иначе список был бы пуст ровно тогда, когда категорию ещё не выбрали.
   */
  const baseTypeOptions = computed(() => {
    const category = model.value.category;

    return category
      ? TOOL_BASE_TYPE_OPTIONS.filter((tool) => tool.category === category)
      : TOOL_BASE_TYPE_OPTIONS;
  });
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <h2 class="truncate text-base text-highlighted">
        {{ ITEM_EDITOR_SECTIONS.tool }}
      </h2>
    </template>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
      <UFormField
        class="md:col-span-12"
        :label="TOOL_FORM_LABELS.category"
        name="tool.category"
      >
        <SelectOptional
          v-model="model.category"
          :items="TOOL_CATEGORY_OPTIONS"
          :unset-label="TOOL_FORM_LABELS.categoryUnset"
        />
      </UFormField>

      <UFormField
        class="md:col-span-12"
        :label="TOOL_FORM_LABELS.baseType"
        :tooltip="TOOL_FORM_LABELS.baseTypeHint"
        name="tool.baseType"
      >
        <SelectOptional
          v-model="model.baseType"
          :items="baseTypeOptions"
          :unset-label="TOOL_FORM_LABELS.baseTypeUnset"
        />
      </UFormField>

      <UFormField
        class="md:col-span-8"
        :label="TOOL_FORM_LABELS.ability"
        name="tool.ability"
      >
        <SelectOptional
          v-model="model.ability"
          :items="ITEM_ABILITY_OPTIONS"
          :unset-label="TOOL_FORM_LABELS.abilityUnset"
        />
      </UFormField>

      <UFormField
        class="md:col-span-8"
        :label="TOOL_FORM_LABELS.bonus"
        name="tool.bonus"
      >
        <UInputNumber
          v-model="model.bonus"
          :placeholder="WEAPON_FORM_LABELS.bonusPlaceholder"
        />
      </UFormField>

      <UFormField
        class="md:col-span-8"
        :label="TOOL_FORM_LABELS.proficiencyMode"
        name="tool.proficiencyMode"
      >
        <SelectOptional
          v-model="model.proficiencyMode"
          :items="TOOL_PROFICIENCY_MODE_OPTIONS"
          :unset-label="TOOL_FORM_LABELS.proficiencyModeUnset"
        />
      </UFormField>
    </div>
  </UCard>
</template>
