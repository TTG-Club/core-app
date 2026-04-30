<script setup lang="ts">
  import type { ClassMulticlassProficiencyCreate } from '../../model';

  import { SelectArmorCategory, SelectWeaponCategory } from '~ui/select';

  const state = defineModel<ClassMulticlassProficiencyCreate>({
    required: true,
  });
</script>

<template>
  <UForm
    :state
    attach
  >
    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          Владения при мультиклассировании
        </h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
        <UFormField
          class="col-span-12"
          label="Виды доспехов"
          name="multiclassProficiency.armor.category"
        >
          <SelectArmorCategory
            v-model="state.armor.category"
            multiple
          />
        </UFormField>

        <UFormField
          class="col-span-12"
          label="Дополнительно"
          name="multiclassProficiency.armor.custom"
        >
          <UInput
            v-model="state.armor.custom"
            placeholder="Например: только щиты"
          />
        </UFormField>

        <UFormField
          class="col-span-12"
          label="Виды оружия"
          name="multiclassProficiency.weapon.category"
        >
          <SelectWeaponCategory
            v-model="state.weapon.category"
            multiple
          />
        </UFormField>

        <UFormField
          class="col-span-12"
          label="Дополнительно"
          name="multiclassProficiency.weapon.custom"
        >
          <UInput
            v-model="state.weapon.custom"
            placeholder="Например: длинные мечи"
          />
        </UFormField>

        <UFormField
          class="col-span-24"
          label="Инструменты"
          name="multiclassProficiency.toolProficiency"
        >
          <UInput
            v-model="state.toolProficiency"
            placeholder="Например: набор вора"
          />
        </UFormField>

        <UFormField
          class="col-span-24"
          label="Кол-во навыков"
          name="multiclassProficiency.skills"
        >
          <UInputNumber
            v-model="state.skills"
            :min="0"
          />
        </UFormField>
      </div>
    </UCard>
  </UForm>
</template>
