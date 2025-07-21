<script setup lang="ts">
  import { ABILITIES } from '~/shared/types';
  import { getFormattedModifier, getModifier } from '~/shared/utils';
  import { SelectMastery } from '~ui/select';

  import type { CreateAbilities } from '~bestiary/types';

  const { proficiencyBonus } = defineProps<{
    proficiencyBonus: number;
  }>();

  const model = defineModel<CreateAbilities>({ required: true });

  function calcModifier(ability: number, multiplier: number): string {
    const abilityMod = getModifier(ability);
    const total = abilityMod + proficiencyBonus * multiplier;

    return total >= 0 ? `+${total}` : `${total}`;
  }
</script>

<template>
  <USeparator>
    <span class="font-bold text-secondary">Характеристики</span>
  </USeparator>

  <UForm
    class="col-span-full grid grid-cols-24 gap-4"
    attach
    :state="model"
  >
    <UFormField
      v-for="ability in ABILITIES"
      :key="ability.key"
      class="col-span-4"
      :label="ability.label"
      :name="ability.shortKey + '.value'"
    >
      <UInputNumber
        v-model="model[ability.shortKey].value"
        :precision="0"
        :min="0"
        :max="30"
      >
        <template #trailing>
          {{ getFormattedModifier(model[ability.shortKey].value) }}
        </template>
      </UInputNumber>
    </UFormField>
  </UForm>

  <USeparator>
    <span class="font-bold text-secondary">Спасброски</span>
  </USeparator>

  <UForm
    class="col-span-full grid grid-cols-24 gap-4"
    attach
    :state="model"
  >
    <UFormField
      v-for="ability in ABILITIES"
      :key="ability.key"
      class="col-span-4"
      :label="ability.label"
      :name="ability.shortKey + '.multiplier'"
    >
      <div class="flex">
        <SelectMastery
          v-model="model[ability.shortKey].multiplier"
          class="flex-grow"
        >
          <template #trailing>
            {{
              calcModifier(
                model[ability.shortKey].value,
                model[ability.shortKey].multiplier,
              )
            }}
          </template>
        </SelectMastery>
      </div>
    </UFormField>
  </UForm>
</template>
