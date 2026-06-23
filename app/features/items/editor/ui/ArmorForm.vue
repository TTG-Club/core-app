<script setup lang="ts">
  import type { ArmorCreate } from '~items/model';

  import { DEXTERITY_MOD_OPTIONS } from '~items/model';
  import { SelectArmorCategory } from '~ui/select';

  const model = defineModel<ArmorCreate>({ required: true });
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <h2 class="truncate text-base text-highlighted">Доспех</h2>
    </template>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
      <UFormField
        class="md:col-span-12"
        label="Категория доспеха"
        name="armor.category"
      >
        <SelectArmorCategory v-model="model.category" />
      </UFormField>

      <UFormField
        class="md:col-span-12"
        label="Класс доспеха (КД)"
        name="armor.armorClass"
      >
        <UInputNumber
          v-model="model.armorClass"
          placeholder="Введи КД"
          :min="0"
        />
      </UFormField>

      <UFormField
        class="md:col-span-12"
        label="Модификатор Ловкости"
        name="armor.mod"
      >
        <USelect
          v-model="model.mod"
          :items="DEXTERITY_MOD_OPTIONS"
          placeholder="Выбери добавление модификатора Ловкости"
        />
      </UFormField>

      <UFormField
        class="md:col-span-12"
        label="Требование Силы"
        tooltip="Минимальное значение Силы для ношения без штрафа к скорости"
        name="armor.strength"
      >
        <UInput
          v-model="model.strength"
          placeholder="Например, Сила 13"
        />
      </UFormField>

      <UFormField
        class="md:col-span-24"
        label="Скрытность"
        name="armor.stealth"
      >
        <USwitch
          v-model="model.stealth"
          label="Помеха к проверкам Скрытности"
        />
      </UFormField>
    </div>
  </UCard>
</template>
