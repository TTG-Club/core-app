<script setup lang="ts">
  import { SelectDamageType } from '~ui/select';

  import type { CreatureDefense } from '~bestiary/model';

  const vulnerabilities = defineModel<CreatureDefense>({
    required: true,
  });
</script>

<template>
  <UForm
    :state="vulnerabilities"
    attach
    class="col-span-12 flex flex-col gap-4"
  >
    <UFormField
      label="Уязвимость к типам урона"
      name="values"
    >
      <SelectDamageType
        v-model="vulnerabilities.values"
        multiple
      />
    </UFormField>

    <UFormField name="text">
      <UInput
        v-model="vulnerabilities.text"
        placeholder="Введи отображаемый текст уязвимостей"
      />
    </UFormField>
  </UForm>
</template>
