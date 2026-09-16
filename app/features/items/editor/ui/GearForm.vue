<script setup lang="ts">
  import type { ItemEquipmentCategory } from '~items/model';

  import {
    EQUIPMENT_CATEGORY_OPTIONS,
    ITEM_EDITOR_SECTIONS,
    ITEM_FORM_LABELS,
  } from '~items/model';
  import { SelectOptional } from '~ui/select';

  const model = defineModel<ItemEquipmentCategory | undefined>();
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex min-w-0 flex-col">
        <h2 class="truncate text-base text-highlighted">
          {{ ITEM_EDITOR_SECTIONS.gear }}
        </h2>

        <span class="text-xs text-muted">
          {{ ITEM_FORM_LABELS.equipmentCategoryHint }}
        </span>
      </div>
    </template>

    <UFormField
      :label="ITEM_FORM_LABELS.equipmentCategory"
      name="equipmentCategory"
    >
      <SelectOptional
        v-model="model"
        :items="EQUIPMENT_CATEGORY_OPTIONS"
        :unset-label="ITEM_FORM_LABELS.equipmentCategoryUnset"
      />
    </UFormField>
  </UCard>
</template>
