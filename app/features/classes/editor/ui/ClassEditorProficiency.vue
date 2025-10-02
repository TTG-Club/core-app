<script setup lang="ts">
  import {
    SelectArmorCategory,
    SelectSkills,
    SelectWeaponCategory,
  } from '~ui/select';
  import type { ClassProficiencyCreate } from '~classes/types';

  const state = defineModel<ClassProficiencyCreate>({ required: true });
</script>

<template>
  <UForm
    :state
    attach
  >
    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Владения</h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
        <UFormField
          class="col-span-12"
          label="Виды оружия"
          name="armor.category"
        >
          <SelectArmorCategory
            v-model="state.armor.category"
            multiple
          />
        </UFormField>

        <UFormField
          class="col-span-12"
          label="Дополнительно"
          name="armor.custom"
        >
          <UInput
            v-model="state.armor.custom"
            placeholder="Например: только щиты"
          />
        </UFormField>

        <UFormField
          class="col-span-12"
          label="Виды оружия"
          name="weapon.category"
        >
          <SelectWeaponCategory
            v-model="state.weapon.category"
            multiple
          />
        </UFormField>

        <UFormField
          class="col-span-12"
          label="Дополнительно"
          name="weapon.custom"
        >
          <UInput
            v-model="state.weapon.custom"
            placeholder="Например: длинные мечи"
          />
        </UFormField>

        <UFormField
          class="col-span-24"
          label="Инструменты"
          name="tool"
        >
          <UInput
            v-model="state.tool"
            placeholder="Например: набор вора"
          />
        </UFormField>

        <UFormField
          class="col-span-4"
          label="Кол-во навыков"
          name="skill.cnt"
        >
          <UInputNumber
            v-model="state.skill.cnt"
            :min="0"
          />
        </UFormField>

        <UFormField
          class="col-span-20"
          label="Навыки на выбор"
          name="skill.skills"
        >
          <SelectSkills
            v-model="state.skill.skills"
            multiple
            :limit="state.skill.cnt || 0"
          />
        </UFormField>
      </div>
    </UCard>
  </UForm>
</template>
