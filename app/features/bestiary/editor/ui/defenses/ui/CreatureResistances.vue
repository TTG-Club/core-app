<script setup lang="ts">
  import type { CreatureDefense } from '~bestiary/model';

  import { SelectDamageType } from '~ui/select';

  const resistances = defineModel<CreatureDefense>({
    required: true,
  });
</script>

<template>
  <UForm
    :state="resistances"
    attach
    class="col-span-12 flex flex-col gap-4"
  >
    <UFormField
      label="Сопротивление к типам урона"
      name="values"
    >
      <SelectDamageType
        v-model="resistances.values"
        multiple
      />
    </UFormField>

    <UFormField name="text">
      <UInput
        v-model="resistances.text"
        placeholder="Введи отображаемый текст сопротивления"
      />
    </UFormField>
  </UForm>
</template>
