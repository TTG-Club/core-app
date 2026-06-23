<script setup lang="ts">
  import type { WeaponCreate } from '~items/model';

  import {
    SelectAmmunition,
    SelectDamageType,
    SelectWeaponCategory,
    SelectWeaponMastery,
    SelectWeaponProperty,
  } from '~ui/select';

  import RollInput from './RollInput.vue';

  const model = defineModel<WeaponCreate>({ required: true });
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <h2 class="truncate text-base text-highlighted">Оружие</h2>
    </template>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
      <UFormField
        class="md:col-span-12"
        label="Категория оружия"
        name="weapon.category"
      >
        <SelectWeaponCategory v-model="model.category" />
      </UFormField>

      <UFormField
        class="md:col-span-12"
        label="Приём"
        name="weapon.mastery"
      >
        <SelectWeaponMastery v-model="model.mastery" />
      </UFormField>

      <UFormField
        class="md:col-span-12"
        label="Урон"
        tooltip="Количество костей, тип кости и бонус"
        name="weapon.damage.roll"
      >
        <RollInput v-model="model.damage.roll" />
      </UFormField>

      <UFormField
        class="md:col-span-12"
        label="Тип урона"
        name="weapon.damage.type"
      >
        <SelectDamageType v-model="model.damage.type" />
      </UFormField>

      <UFormField
        class="md:col-span-24"
        label="Универсальный урон"
        tooltip="Урон при использовании двумя руками (свойство «Универсальное»)"
        name="weapon.versatile"
      >
        <RollInput v-model="model.versatile" />
      </UFormField>

      <UFormField
        class="md:col-span-24"
        label="Свойства"
        name="weapon.properties"
      >
        <SelectWeaponProperty
          v-model="model.properties"
          multiple
        />
      </UFormField>

      <UFormField
        class="md:col-span-8"
        label="Дистанция (нормальная)"
        name="weapon.range.normal"
      >
        <UInputNumber
          v-model="model.range.normal"
          placeholder="Введи дистанцию"
          :min="0"
        />
      </UFormField>

      <UFormField
        class="md:col-span-8"
        label="Дистанция (максимальная)"
        name="weapon.range.max"
      >
        <UInputNumber
          v-model="model.range.max"
          placeholder="Введи дистанцию"
          :min="0"
        />
      </UFormField>

      <UFormField
        class="md:col-span-8"
        label="Тип боеприпаса"
        name="weapon.ammo"
      >
        <SelectAmmunition v-model="model.ammo" />
      </UFormField>

      <UFormField
        class="md:col-span-24"
        label="Дополнительно"
        name="weapon.additional"
      >
        <UInput
          v-model="model.additional"
          placeholder="Дополнительная информация"
        />
      </UFormField>
    </div>
  </UCard>
</template>
