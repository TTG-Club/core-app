<script setup lang="ts">
  import { SelectCondition, SelectDamageType } from '~ui/select';

  import type { CreatureImmunities } from '~bestiary/model';

  const immunities = defineModel<CreatureImmunities>({
    required: true,
  });
</script>

<template>
  <UForm
    :state="immunities"
    attach
    class="col-span-full grid grid-cols-24 gap-4"
  >
    <UFormField
      class="col-span-12"
      label="Иммунитет к типам урона"
      name="damage"
    >
      <SelectDamageType
        v-model="immunities.damage"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-12"
      label="Иммунитет к состояниям"
      name="condition"
    >
      <SelectCondition
        v-model="immunities.condition"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-full"
      name="text"
    >
      <UInput
        v-model="immunities.text"
        placeholder="Введи отображаемый текст иммунитетов"
      />
    </UFormField>
  </UForm>
</template>
