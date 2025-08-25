<script setup lang="ts">
  import { SelectCondition, SelectDamageType } from '~ui/select';

  const vulnerabilities = defineModel<Array<string>>('vulnerabilities', {
    required: true,
  });

  const resistance = defineModel<Array<string>>('resistance', {
    required: true,
  });

  const immunityToDamage = defineModel<Array<string>>('immunityToDamage', {
    required: true,
  });

  const immunityToCondition = defineModel<Array<string>>(
    'immunityToCondition',
    { required: true },
  );
</script>

<template>
  <UCard
    variant="subtle"
    class="col-span-full"
  >
    <template #header>
      <h2 class="truncate text-base text-highlighted">Защита</h2>
    </template>

    <div class="col-span-full grid grid-cols-24 gap-4">
      <UFormField
        class="col-span-6"
        label="Уязвимость к урону"
        name="vulnerabilities"
      >
        <SelectDamageType
          v-model="vulnerabilities"
          multiple
        />
      </UFormField>

      <UFormField
        class="col-span-6"
        label="Сопротивление к урону"
        name="resistance"
      >
        <SelectDamageType
          v-model="resistance"
          multiple
        />
      </UFormField>

      <UFormField
        class="col-span-6"
        label="Иммунитет к урону"
        name="immunityToDamage"
      >
        <SelectDamageType
          v-model="immunityToDamage"
          multiple
        />
      </UFormField>

      <UFormField
        class="col-span-6"
        label="Иммунитет к состояниям"
        name="immunityToCondition"
      >
        <SelectCondition
          v-model="immunityToCondition"
          multiple
        />
      </UFormField>
    </div>
  </UCard>
</template>
