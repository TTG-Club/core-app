<script setup lang="ts">
  import type { SpeciesCreateSpeed } from '~/shared/types';

  const speed = defineModel<SpeciesCreateSpeed>({ required: true });
</script>

<template>
  <UForm
    class="col-span-full grid grid-cols-24 gap-4"
    attach
    :state="speed"
  >
    <UFormField
      class="col-span-6"
      label="Скорость передвижения"
      name="base"
    >
      <UInputNumber
        v-model="speed.base"
        placeholder="Введи скорость передвижения"
        :min="0"
      />
    </UFormField>

    <div class="col-span-6 grid grid-cols-12 gap-4">
      <UFormField
        class="col-span-8"
        label="Скорость полета"
        name="fly"
      >
        <UInputNumber
          v-model="speed.fly"
          placeholder="Введи скорость полета"
          :min="0"
        />
      </UFormField>

      <UFormField
        class="col-span-4"
        label="Парит"
        name="hover"
      >
        <UCheckbox
          v-model="speed.hover"
          label="Да"
        />
      </UFormField>
    </div>

    <UFormField
      class="col-span-6"
      label="Скорость лазания"
      name="climb"
    >
      <UInputNumber
        v-model="speed.climb"
        placeholder="Введи скорость лазания"
        :min="0"
      />
    </UFormField>

    <UFormField
      class="col-span-6"
      label="Скорость плавания"
      name="swim"
    >
      <UInputNumber
        v-model="speed.swim"
        placeholder="Введи скорость плавания"
        :min="0"
      />
    </UFormField>
  </UForm>
</template>
